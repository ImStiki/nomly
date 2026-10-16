import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus } from '@/types';

interface OrdersState {
  orders: Order[];
  place: (o: Order) => void;
  cancel: (id: string) => void;
  rate: (id: string, stars: number) => void;
}

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      place: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      cancel: (id) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, cancelled: true } : o)) })),
      rate: (id, rated) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, rated } : o)) })),
    }),
    { name: 'nomly-orders' },
  ),
);

export interface OrderProgress {
  status: OrderStatus;
  /** 0..1 over the whole order lifetime */
  t: number;
  /** 0..1 progress of the courier from venue to customer (delivery only) */
  courierT: number;
  remainingMs: number;
  /** step index for the progress tracker */
  step: number;
}

// Phase boundaries as a fraction of the total duration.
const RECEIVED_END = 0.08;
const PREPARING_END = 0.55;
const PICKUP_END = 0.62;

export function orderProgress(o: Order, now = Date.now()): OrderProgress {
  const start = o.scheduledFor ? o.scheduledFor - o.durationMs : o.createdAt;
  const elapsed = Math.max(0, now - start);
  const t = Math.min(1, elapsed / o.durationMs);
  const remainingMs = Math.max(0, o.durationMs - elapsed);
  if (o.cancelled) return { status: 'cancelled', t, courierT: 0, remainingMs: 0, step: -1 };
  if (t >= 1) return { status: 'delivered', t: 1, courierT: 1, remainingMs: 0, step: 4 };
  if (t < RECEIVED_END) return { status: 'received', t, courierT: 0, remainingMs, step: 0 };
  if (t < PREPARING_END) return { status: 'preparing', t, courierT: 0, remainingMs, step: 1 };
  if (o.mode === 'pickup') return { status: 'pickup', t, courierT: 0, remainingMs, step: 2 };
  if (t < PICKUP_END) return { status: 'pickup', t, courierT: 0, remainingMs, step: 2 };
  return { status: 'delivering', t, courierT: (t - PICKUP_END) / (1 - PICKUP_END), remainingMs, step: 3 };
}

export const isActive = (o: Order, now = Date.now()) => {
  const p = orderProgress(o, now);
  return p.status !== 'delivered' && p.status !== 'cancelled';
};
