import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Address, User } from '@/types';
import { uid } from '@/lib/random';

export interface PaymentMethod {
  id: string;
  kind: 'card' | 'cash' | 'wallet';
  label: string;
  detail?: string;
}

const AVATAR_COLORS = ['#7B4DFF', '#E85D3F', '#2A9D8F', '#F4A259', '#D94F70', '#3D5A80'];

const DEFAULT_METHODS: PaymentMethod[] = [
  { id: 'card-demo', kind: 'card', label: 'Visa •••• 4242', detail: 'Demo card · expires 12/29' },
  { id: 'wallet', kind: 'wallet', label: 'Mobile wallet', detail: 'Apple Pay / Google Pay (demo)' },
  { id: 'cash', kind: 'cash', label: 'Cash', detail: 'Pay the courier on delivery' },
];

interface AuthState {
  user: User | null;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  defaultPayment: string;
  credits: number;
  plus: boolean;
  plusSince?: number;
  welcomeGiven: boolean;
  signIn: (name: string, email: string) => void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
  saveAddress: (a: Address) => void;
  removeAddress: (id: string) => void;
  addCard: (last4: string, brand: string, expiry: string) => void;
  removePayment: (id: string) => void;
  setDefaultPayment: (id: string) => void;
  addCredits: (n: number) => void;
  setPlus: (on: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      addresses: [],
      paymentMethods: DEFAULT_METHODS,
      defaultPayment: 'card-demo',
      credits: 0,
      plus: false,
      welcomeGiven: false,
      signIn: (name, email) =>
        set((s) => ({
          user: {
            id: uid('u_'),
            name: name.trim() || email.split('@')[0],
            email: email.trim().toLowerCase(),
            avatarColor: AVATAR_COLORS[email.length % AVATAR_COLORS.length],
            createdAt: Date.now(),
          },
          // one-time welcome bonus
          credits: s.welcomeGiven ? s.credits : s.credits + 5,
          welcomeGiven: true,
        })),
      signOut: () => set({ user: null }),
      updateUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      saveAddress: (a) =>
        set((s) => ({
          addresses: s.addresses.some((x) => x.id === a.id)
            ? s.addresses.map((x) => (x.id === a.id ? a : x))
            : [a, ...s.addresses],
        })),
      removeAddress: (id) => set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),
      addCard: (last4, brand, expiry) =>
        set((s) => {
          const id = uid('card_');
          return {
            paymentMethods: [
              { id, kind: 'card', label: `${brand} •••• ${last4}`, detail: `Demo card · expires ${expiry}` },
              ...s.paymentMethods,
            ],
            defaultPayment: id,
          };
        }),
      removePayment: (id) =>
        set((s) => {
          const paymentMethods = s.paymentMethods.filter((p) => p.id !== id);
          return {
            paymentMethods,
            defaultPayment: s.defaultPayment === id ? (paymentMethods[0]?.id ?? '') : s.defaultPayment,
          };
        }),
      setDefaultPayment: (defaultPayment) => set({ defaultPayment }),
      addCredits: (n) => set((s) => ({ credits: Math.max(0, Math.round((s.credits + n) * 100) / 100) })),
      setPlus: (plus) => set({ plus, plusSince: plus ? Date.now() : undefined }),
    }),
    { name: 'nomly-auth' },
  ),
);
