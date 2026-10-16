import type { Venue } from '@/types';
import { seeded } from '@/lib/random';

export interface Review {
  id: string;
  author: string;
  stars: number;
  text: string;
  daysAgo: number;
  item?: string;
}

const NAMES = ['Aino K.', 'Jonas M.', 'Elira B.', 'Mika L.', 'Sara P.', 'Noah W.', 'Leon S.', 'Drita H.', 'Emma R.', 'Luca F.', 'Arta G.', 'Oskar N.', 'Lena V.', 'Ilir D.', 'Maja T.', 'Felix A.'];

const GOOD = [
  'Absolutely delicious, arrived hot and fast. Will order again!',
  'Best in town, no contest. The portions are generous too.',
  'Courier was super friendly and the food was perfect.',
  'Everything was fresh and packed really well. 10/10.',
  'My go-to place for a lazy evening. Never disappoints.',
  'Great value for money and quick delivery.',
  'Tried it for the first time today — instantly a favourite.',
  'Exactly like eating at the restaurant. Loved it!',
];
const OK = [
  'Good food, delivery took a bit longer than expected.',
  'Tasty but could have been a little warmer.',
  'Solid choice, nothing extraordinary but reliable.',
  'Pretty good! Portion was slightly smaller than last time.',
];
const BAD = ['Food was fine but one item was missing.', 'Arrived cold this time, hope it was a one-off.'];

const STORE_GOOD = [
  'Everything I needed in under 30 minutes. Lifesaver!',
  'Fresh produce and well packed. Super convenient.',
  'Great selection and the courier brought it right to my door.',
  'Fast and easy, prices are fair too.',
];

const cache = new Map<string, Review[]>();

export function getReviews(venue: Venue, items: string[] = []): Review[] {
  const hit = cache.get(venue.id);
  if (hit) return hit;
  const r = seeded(`reviews-${venue.id}`);
  const count = 8;
  // skew towards the venue rating (10-point scale → 5 stars)
  const base = venue.rating / 2;
  const list: Review[] = Array.from({ length: count }, (_, i) => {
    const stars = Math.max(1, Math.min(5, Math.round(base + r.range(-1.2, 0.8))));
    const pool = venue.type === 'store' && stars >= 4 ? STORE_GOOD : stars >= 4 ? GOOD : stars === 3 ? OK : BAD;
    return {
      id: `${venue.id}-r${i}`,
      author: r.pick(NAMES),
      stars,
      text: r.pick(pool),
      daysAgo: Math.round(r.range(0, 60)) + i * 2,
      item: items.length && r.chance(0.6) ? r.pick(items) : undefined,
    };
  }).sort((a, b) => a.daysAgo - b.daysAgo);
  cache.set(venue.id, list);
  return list;
}

export function daysAgoLabel(d: number) {
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.round(d / 7)} week${Math.round(d / 7) > 1 ? 's' : ''} ago`;
  return `${Math.round(d / 30)} month${Math.round(d / 30) > 1 ? 's' : ''} ago`;
}
