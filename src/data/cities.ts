import type { City } from '@/types';

export const CITIES: City[] = [
  {
    id: 'helsinki',
    name: 'Helsinki',
    country: 'Finland',
    countryCode: 'FI',
    lat: 60.1699,
    lng: 24.9384,
    streets: ['Mannerheimintie', 'Aleksanterinkatu', 'Fredrikinkatu', 'Bulevardi', 'Hämeentie', 'Runeberginkatu', 'Iso Roobertinkatu', 'Kalevankatu'],
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    lat: 52.52,
    lng: 13.405,
    streets: ['Torstraße', 'Kastanienallee', 'Oranienstraße', 'Friedrichstraße', 'Karl-Marx-Allee', 'Bergmannstraße', 'Schönhauser Allee', 'Warschauer Straße'],
  },
  {
    id: 'prishtina',
    name: 'Prishtina',
    country: 'Kosovo',
    countryCode: 'XK',
    lat: 42.6629,
    lng: 21.1655,
    streets: ['Rr. Garibaldi', 'Bul. Nënë Tereza', 'Rr. Agim Ramadani', 'Rr. UÇK', 'Rr. Luan Haradinaj', 'Rr. Fehmi Agani', 'Rr. Rexhep Luci', 'Bul. Bill Clinton'],
  },
  {
    id: 'tirana',
    name: 'Tirana',
    country: 'Albania',
    countryCode: 'AL',
    lat: 41.3275,
    lng: 19.8187,
    streets: ['Rruga e Durrësit', 'Rruga Myslym Shyri', 'Rruga Ibrahim Rugova', 'Rruga e Kavajës', 'Rruga Sami Frashëri', 'Rruga Pjetër Bogdani', 'Bulevardi Zogu I', 'Rruga Ismail Qemali'],
  },
  {
    id: 'stockholm',
    name: 'Stockholm',
    country: 'Sweden',
    countryCode: 'SE',
    lat: 59.3293,
    lng: 18.0686,
    streets: ['Götgatan', 'Drottninggatan', 'Hornsgatan', 'Sveavägen', 'Odengatan', 'Kungsgatan', 'Folkungagatan', 'Birger Jarlsgatan'],
  },
  {
    id: 'prague',
    name: 'Prague',
    country: 'Czechia',
    countryCode: 'CZ',
    lat: 50.0755,
    lng: 14.4378,
    streets: ['Vinohradská', 'Národní', 'Na Příkopě', 'Korunní', 'Dlouhá', 'Seifertova', 'Milady Horákové', 'Žitná'],
  },
];

export const DEFAULT_CITY_ID = 'helsinki';

export const getCity = (id: string) => CITIES.find((c) => c.id === id) ?? CITIES[0];
