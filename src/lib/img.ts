import { IMAGE_POOLS, type ImageTag } from '@/data/images';
import { hashString } from './random';

/** Build an Unsplash CDN URL for a photo id at a given width. */
export function unsplash(id: string, w = 640, h?: number): string {
  const size = h ? `&h=${h}` : '';
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${size}&q=70`;
}

/** Pick a stable photo id from a tag pool, varied by key. */
export function poolImage(tag: ImageTag, key: string | number = 0): string {
  const pool = IMAGE_POOLS[tag];
  const i = typeof key === 'number' ? key : hashString(key);
  return pool[i % pool.length];
}

/** Resize an image reference: stored ids are bare Unsplash ids. */
export function imgUrl(id: string | undefined, w = 640, h?: number): string | undefined {
  if (!id) return undefined;
  if (id.startsWith('http') || id.startsWith('data:')) return id;
  return unsplash(id, w, h);
}
