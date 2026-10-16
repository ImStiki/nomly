export interface PromoCode {
  code: string;
  description: string;
  minSubtotal: number;
  /** percent off items (0..1) */
  percent?: number;
  /** fixed amount off items */
  amount?: number;
  maxDiscount?: number;
  freeDelivery?: boolean;
  firstOrderOnly?: boolean;
}

export const PROMO_CODES: PromoCode[] = [
  { code: 'WELCOME', description: '€5 off + free delivery on your first order', minSubtotal: 15, amount: 5, freeDelivery: true, firstOrderOnly: true },
  { code: 'NOMLY10', description: '10% off your order (max €10)', minSubtotal: 10, percent: 0.1, maxDiscount: 10 },
  { code: 'FREEDEL', description: 'Free delivery on any order', minSubtotal: 0, freeDelivery: true },
  { code: 'STUDENT', description: '15% off for students (max €8)', minSubtotal: 12, percent: 0.15, maxDiscount: 8 },
  { code: 'PIZZA2X', description: '€3 off orders over €20', minSubtotal: 20, amount: 3 },
];

export type PromoCheck = { ok: true; promo: PromoCode } | { ok: false; error: string };

export function checkPromo(raw: string, subtotal: number, ordersCount: number): PromoCheck {
  const code = raw.trim().toUpperCase();
  const promo = PROMO_CODES.find((p) => p.code === code);
  if (!promo) return { ok: false, error: 'This code doesn’t exist or has expired.' };
  if (promo.firstOrderOnly && ordersCount > 0) return { ok: false, error: 'This code is only valid on your first order.' };
  if (subtotal < promo.minSubtotal) return { ok: false, error: `Add items worth €${promo.minSubtotal} or more to use this code.` };
  return { ok: true, promo };
}

export function promoDiscount(p: PromoCode | null, subtotal: number): number {
  if (!p || subtotal < p.minSubtotal) return 0;
  let d = 0;
  if (p.percent) d = subtotal * p.percent;
  if (p.amount) d += p.amount;
  if (p.maxDiscount) d = Math.min(d, p.maxDiscount);
  return Math.round(Math.min(d, subtotal) * 100) / 100;
}
