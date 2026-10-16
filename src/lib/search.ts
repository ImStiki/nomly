import type { Category, MenuItem, Venue } from '@/types';
import { venuesForCity } from '@/data/venues';
import { getMenu } from '@/data/menus';
import { ALL_CATEGORIES } from '@/data/categories';

export interface ItemHit {
  venue: Venue;
  item: MenuItem;
}

export interface SearchResults {
  venues: Venue[];
  items: ItemHit[];
  categories: Category[];
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const indexCache = new Map<string, ItemHit[]>();

function itemIndex(cityId: string): ItemHit[] {
  let idx = indexCache.get(cityId);
  if (!idx) {
    idx = [];
    for (const venue of venuesForCity(cityId)) {
      const seen = new Set<string>();
      for (const s of getMenu(venue))
        for (const item of s.items) {
          if (seen.has(item.id)) continue; // "Most ordered" repeats items
          seen.add(item.id);
          idx.push({ venue, item });
        }
    }
    indexCache.set(cityId, idx);
  }
  return idx;
}

function score(text: string, q: string): number {
  const t = normalize(text);
  if (t === q) return 100;
  if (t.startsWith(q)) return 60;
  if (t.split(/[\s&,.-]+/).some((w) => w.startsWith(q))) return 40;
  if (t.includes(q)) return 20;
  return 0;
}

export function search(cityId: string, query: string, limit = 40): SearchResults {
  const q = normalize(query.trim());
  if (!q) return { venues: [], items: [], categories: [] };

  const categories = ALL_CATEGORIES.filter((c) => score(c.name, q) > 0 || score(c.id, q) > 0);
  const catIds = new Set(categories.map((c) => c.id));

  const venues = venuesForCity(cityId)
    .map((v) => {
      const s =
        score(v.name, q) * 2 +
        score(v.cuisine, q) +
        score(v.tagline, q) / 2 +
        (v.categories.some((c) => catIds.has(c)) ? 30 : 0);
      return { v, s: s + (s > 0 ? v.popularity / 100 : 0) };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.v)
    .slice(0, limit);

  const items = itemIndex(cityId)
    .map((h) => ({ h, s: score(h.item.name, q) * 2 + score(h.item.description, q) / 2 }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.h.venue.rating - a.h.venue.rating)
    .map((x) => x.h)
    .slice(0, limit);

  return { venues, items, categories };
}

export const POPULAR_SEARCHES = ['Pizza', 'Sushi', 'Burger', 'Pad Thai', 'Coffee', 'Kebab', 'Bubble tea', 'Flowers'];
