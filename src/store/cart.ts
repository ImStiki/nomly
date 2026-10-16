import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine, GroupOrder, SelectedOption } from '@/types';
import { seeded } from '@/lib/random';

export function lineKey(itemId: string, options: SelectedOption[], note?: string, by?: string) {
  const opts = options
    .map((o) => o.choiceId)
    .sort()
    .join(',');
  return `${itemId}|${opts}|${(note ?? '').trim().toLowerCase()}|${by ?? ''}`;
}

export const unitPrice = (l: Pick<CartLine, 'basePrice' | 'options'>) =>
  l.basePrice + l.options.reduce((s, o) => s + o.price, 0);

export const linePrice = (l: CartLine) => Math.round(unitPrice(l) * l.quantity * 100) / 100;

export const cartSubtotal = (lines: CartLine[]) =>
  Math.round(lines.reduce((s, l) => s + linePrice(l), 0) * 100) / 100;

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0);

const GUESTS = [
  { name: 'Alex', color: '#E85D3F' },
  { name: 'Sam', color: '#2A9D8F' },
  { name: 'Mia', color: '#F4A259' },
  { name: 'Leo', color: '#3D5A80' },
  { name: 'Nora', color: '#D94F70' },
  { name: 'Eli', color: '#588157' },
];

interface CartState {
  /** One basket per venue, like the real app. */
  carts: Record<string, CartLine[]>;
  /** Venue order of last modification, newest first. */
  order: string[];
  groups: Record<string, GroupOrder>;
  add: (venueId: string, line: Omit<CartLine, 'key'>) => void;
  setQuantity: (venueId: string, key: string, quantity: number) => void;
  clear: (venueId: string) => void;
  replace: (venueId: string, lines: CartLine[]) => void;
  startGroup: (venueId: string) => GroupOrder;
  endGroup: (venueId: string) => void;
  patchGroup: (venueId: string, patch: Partial<GroupOrder>) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},
      order: [],
      groups: {},
      add: (venueId, line) =>
        set((s) => {
          const key = lineKey(line.itemId, line.options, line.note, line.by);
          const lines = s.carts[venueId] ?? [];
          const existing = lines.find((l) => l.key === key);
          const next = existing
            ? lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l))
            : [...lines, { ...line, key }];
          return {
            carts: { ...s.carts, [venueId]: next },
            order: [venueId, ...s.order.filter((v) => v !== venueId)],
          };
        }),
      setQuantity: (venueId, key, quantity) =>
        set((s) => {
          const lines = (s.carts[venueId] ?? [])
            .map((l) => (l.key === key ? { ...l, quantity } : l))
            .filter((l) => l.quantity > 0);
          const carts = { ...s.carts };
          if (lines.length) carts[venueId] = lines;
          else delete carts[venueId];
          return { carts, order: lines.length ? s.order : s.order.filter((v) => v !== venueId) };
        }),
      clear: (venueId) =>
        set((s) => {
          const carts = { ...s.carts };
          const groups = { ...s.groups };
          delete carts[venueId];
          delete groups[venueId];
          return { carts, groups, order: s.order.filter((v) => v !== venueId) };
        }),
      replace: (venueId, lines) =>
        set((s) => ({
          carts: { ...s.carts, [venueId]: lines },
          order: [venueId, ...s.order.filter((v) => v !== venueId)],
        })),
      startGroup: (venueId) => {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        const r = seeded(code);
        const pool = [...GUESTS];
        const guests = Array.from({ length: r.int(2, 3) }, () => pool.splice(Math.floor(r.next() * pool.length), 1)[0]);
        const group: GroupOrder = { code, createdAt: Date.now(), guests, joined: [], step: 0 };
        set((s) => ({ groups: { ...s.groups, [venueId]: group } }));
        return group;
      },
      endGroup: (venueId) =>
        set((s) => {
          const groups = { ...s.groups };
          delete groups[venueId];
          // friends' items leave with them
          const lines = (s.carts[venueId] ?? []).filter((l) => !l.by);
          const carts = { ...s.carts };
          if (lines.length) carts[venueId] = lines;
          else delete carts[venueId];
          return { groups, carts };
        }),
      patchGroup: (venueId, patch) => {
        const g = get().groups[venueId];
        if (g) set((s) => ({ groups: { ...s.groups, [venueId]: { ...g, ...patch } } }));
      },
    }),
    { name: 'nomly-cart' },
  ),
);

export function useVenueCart(venueId: string | undefined): CartLine[] {
  return useCart((s) => (venueId ? (s.carts[venueId] ?? EMPTY) : EMPTY));
}

const EMPTY: CartLine[] = [];

/** Who pays what: items per person, fees shared equally. */
export function splitBill(lines: CartLine[], sharedFees: number, discount: number, people: string[]) {
  const totals = new Map<string, number>(people.map((p) => [p, 0]));
  for (const l of lines) {
    const who = l.by ?? 'You';
    totals.set(who, (totals.get(who) ?? 0) + linePrice(l));
  }
  const n = Math.max(1, totals.size);
  const share = (sharedFees - discount) / n;
  return [...totals.entries()].map(([name, items]) => ({ name, items, total: Math.max(0, Math.round((items + share) * 100) / 100) }));
}
