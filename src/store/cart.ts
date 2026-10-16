import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine, SelectedOption } from '@/types';

export function lineKey(itemId: string, options: SelectedOption[], note?: string) {
  const opts = options
    .map((o) => o.choiceId)
    .sort()
    .join(',');
  return `${itemId}|${opts}|${(note ?? '').trim().toLowerCase()}`;
}

export const unitPrice = (l: Pick<CartLine, 'basePrice' | 'options'>) =>
  l.basePrice + l.options.reduce((s, o) => s + o.price, 0);

export const linePrice = (l: CartLine) => Math.round(unitPrice(l) * l.quantity * 100) / 100;

export const cartSubtotal = (lines: CartLine[]) =>
  Math.round(lines.reduce((s, l) => s + linePrice(l), 0) * 100) / 100;

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0);

interface CartState {
  /** One basket per venue, like the real app. */
  carts: Record<string, CartLine[]>;
  /** Venue order of last modification, newest first. */
  order: string[];
  add: (venueId: string, line: Omit<CartLine, 'key'>) => void;
  setQuantity: (venueId: string, key: string, quantity: number) => void;
  clear: (venueId: string) => void;
  replace: (venueId: string, lines: CartLine[]) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      order: [],
      add: (venueId, line) =>
        set((s) => {
          const key = lineKey(line.itemId, line.options, line.note);
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
          delete carts[venueId];
          return { carts, order: s.order.filter((v) => v !== venueId) };
        }),
      replace: (venueId, lines) =>
        set((s) => ({
          carts: { ...s.carts, [venueId]: lines },
          order: [venueId, ...s.order.filter((v) => v !== venueId)],
        })),
    }),
    { name: 'nomly-cart' },
  ),
);

export function useVenueCart(venueId: string | undefined): CartLine[] {
  return useCart((s) => (venueId ? (s.carts[venueId] ?? EMPTY) : EMPTY));
}

const EMPTY: CartLine[] = [];
