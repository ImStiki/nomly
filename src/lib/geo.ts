export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/** A gently bent route between two points so the courier doesn't fly in a straight line. */
export function routeBetween(a: LatLng, b: LatLng, steps = 40): LatLng[] {
  const mid = lerp(a, b, 0.5);
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const ctrl = { lat: mid.lat - dx * 0.25, lng: mid.lng + dy * 0.25 };
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p1 = lerp(a, ctrl, t);
    const p2 = lerp(ctrl, b, t);
    pts.push(lerp(p1, p2, t));
  }
  return pts;
}

export function pointAlong(route: LatLng[], t: number): LatLng {
  if (t <= 0) return route[0];
  if (t >= 1) return route[route.length - 1];
  const f = t * (route.length - 1);
  const i = Math.floor(f);
  return lerp(route[i], route[i + 1], f - i);
}
