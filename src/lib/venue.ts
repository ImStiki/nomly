import type { Venue } from '@/types';
import { distanceKm, type LatLng } from './geo';
import { minutesToClock } from './format';

const nowMinutes = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

export function isOpen(v: Venue, d = new Date()): boolean {
  const { open, close } = v.hours;
  if (close - open >= 1440) return true;
  const m = nowMinutes(d);
  // close past midnight: also open in the early hours of the next day
  return (m >= open && m < close) || (close > 1440 && m < close - 1440);
}

export function hoursLabel(v: Venue): string {
  const { open, close } = v.hours;
  if (close - open >= 1440) return 'Open 24 hours';
  return `${minutesToClock(open)}–${minutesToClock(close)}`;
}

/** "Opens at 10:00" or "Open until 23:00". */
export function openStatus(v: Venue, d = new Date()): { open: boolean; label: string } {
  if (v.hours.close - v.hours.open >= 1440) return { open: true, label: 'Open 24/7' };
  const open = isOpen(v, d);
  return open
    ? { open, label: `Open until ${minutesToClock(v.hours.close)}` }
    : { open, label: `Opens at ${minutesToClock(v.hours.open)}` };
}

export interface DeliveryEstimate {
  km: number;
  min: number;
  max: number;
  fee: number;
}

export function estimate(v: Venue, to: LatLng): DeliveryEstimate {
  const km = distanceKm(v, to);
  const travel = Math.round(km * 3.2 + 4);
  const min = Math.max(10, Math.round((v.prepTime + travel) / 5) * 5);
  const fee =
    v.baseDeliveryFee === 0 ? 0 : Math.round((v.baseDeliveryFee + Math.max(0, km - 1.5) * 0.45) * 100) / 100;
  return { km, min, max: min + 10, fee: Math.min(fee, 5.9) };
}

/** Small-order surcharge, like most delivery apps. */
export function smallOrderFee(v: Venue, subtotal: number): number {
  if (subtotal === 0 || subtotal >= v.minOrder) return 0;
  return Math.round((v.minOrder - subtotal) * 100) / 100;
}

export const SERVICE_FEE_RATE = 0.05;
export const SERVICE_FEE_MAX = 2.5;

export function serviceFee(subtotal: number): number {
  return Math.min(SERVICE_FEE_MAX, Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100);
}
