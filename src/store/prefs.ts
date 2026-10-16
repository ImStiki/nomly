import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Address } from '@/types';
import { DEFAULT_CITY_ID, getCity } from '@/data/cities';

export type Theme = 'system' | 'light' | 'dark';

interface PrefsState {
  cityId: string;
  /** The currently selected delivery address; null = city centre. */
  address: Address | null;
  theme: Theme;
  favorites: string[];
  recentSearches: string[];
  onboarded: boolean;
  /** Speed multiplier for the simulated order tracking. */
  demoSpeed: number;
  setCity: (cityId: string) => void;
  setAddress: (a: Address | null) => void;
  setTheme: (t: Theme) => void;
  toggleFavorite: (venueId: string) => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  setOnboarded: (v: boolean) => void;
  setDemoSpeed: (n: number) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      cityId: DEFAULT_CITY_ID,
      address: null,
      theme: 'system',
      favorites: [],
      recentSearches: [],
      onboarded: false,
      demoSpeed: 10,
      setCity: (cityId) => set({ cityId, address: null }),
      setAddress: (address) => set(address ? { address, cityId: address.cityId } : { address: null }),
      setTheme: (theme) => set({ theme }),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites],
        })),
      addRecentSearch: (q) =>
        set((s) => ({
          recentSearches: [q, ...s.recentSearches.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 6),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setDemoSpeed: (demoSpeed) => set({ demoSpeed }),
    }),
    { name: 'nomly-prefs' },
  ),
);

/** The point deliveries are estimated from: selected address or city centre. */
export function useDeliveryPoint() {
  const cityId = usePrefs((s) => s.cityId);
  const address = usePrefs((s) => s.address);
  const city = getCity(cityId);
  return address ? { lat: address.lat, lng: address.lng } : { lat: city.lat, lng: city.lng };
}
