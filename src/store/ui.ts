import { create } from 'zustand';
import { uid } from '@/lib/random';

export interface Toast {
  id: string;
  message: string;
  tone: 'default' | 'success' | 'error';
  action?: { label: string; onClick: () => void };
}

interface UIState {
  authOpen: boolean;
  authMode: 'login' | 'signup';
  addressOpen: boolean;
  cartOpen: boolean;
  /** When set, the cart drawer focuses this venue's basket. */
  cartVenueId: string | null;
  toasts: Toast[];
  openAuth: (mode?: 'login' | 'signup') => void;
  closeAuth: () => void;
  openAddress: () => void;
  closeAddress: () => void;
  openCart: (venueId?: string) => void;
  closeCart: () => void;
  toast: (message: string, opts?: Partial<Omit<Toast, 'id' | 'message'>>) => void;
  dismissToast: (id: string) => void;
}

export const useUI = create<UIState>()((set, get) => ({
  authOpen: false,
  authMode: 'login',
  addressOpen: false,
  cartOpen: false,
  cartVenueId: null,
  toasts: [],
  openAuth: (authMode = 'login') => set({ authOpen: true, authMode }),
  closeAuth: () => set({ authOpen: false }),
  openAddress: () => set({ addressOpen: true }),
  closeAddress: () => set({ addressOpen: false }),
  openCart: (venueId) => set({ cartOpen: true, cartVenueId: venueId ?? null }),
  closeCart: () => set({ cartOpen: false }),
  toast: (message, opts) => {
    const id = uid('t_');
    const t: Toast = { id, message, tone: 'default', ...opts };
    set((s) => ({ toasts: [...s.toasts, t].slice(-3) }));
    setTimeout(() => get().dismissToast(id), 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message: string, opts?: Partial<Omit<Toast, 'id' | 'message'>>) =>
  useUI.getState().toast(message, opts);
