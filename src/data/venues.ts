import type { City, Promo, Venue, VenueType } from '@/types';
import type { ImageTag } from './images';
import { CITIES } from './cities';
import { poolImage } from '@/lib/img';
import { seeded } from '@/lib/random';

interface VenueTpl {
  key: string;
  name: string;
  menu: string;
  cats: string[];
  cuisine: string;
  tagline: string;
  img: ImageTag;
  emoji: string;
  color: string;
  price: 1 | 2 | 3;
  type?: VenueType;
  hours?: [number, number];
  age?: boolean;
}

const R = (t: Omit<VenueTpl, 'type'>): VenueTpl => ({ ...t, type: 'restaurant' });
const S = (t: Omit<VenueTpl, 'type'>): VenueTpl => ({ ...t, type: 'store' });
const h = (open: number, close: number): [number, number] => [open * 60, close * 60];

export const VENUE_TEMPLATES: VenueTpl[] = [
  R({ key: 'forno-felice', name: 'Forno Felice', menu: 'pizza', cats: ['pizza', 'italian'], cuisine: 'Neapolitan pizza', tagline: 'Wood-fired Neapolitan pizza, 90 seconds at 450°C', img: 'pizza', emoji: '🍕', color: '#E85D3F', price: 2 }),
  R({ key: 'slice-society', name: 'Slice Society', menu: 'pizza', cats: ['pizza'], cuisine: 'New York pizza', tagline: 'Big NY-style slices and whole pies', img: 'pizza', emoji: '🍕', color: '#2F3A8F', price: 1, hours: h(11, 27) }),
  R({ key: 'nonna-rosa', name: 'Pizzeria Nonna Rosa', menu: 'pizza', cats: ['pizza', 'italian'], cuisine: 'Italian', tagline: 'Family recipes since 1987', img: 'pizza', emoji: '👵', color: '#B33A3A', price: 2 }),
  R({ key: 'bun-intended', name: 'Bun Intended', menu: 'burger', cats: ['burgers'], cuisine: 'Burgers', tagline: 'Smashed burgers with crispy edges', img: 'burger', emoji: '🍔', color: '#F2A93B', price: 2 }),
  R({ key: 'grill-theory', name: 'Grill Theory', menu: 'burger', cats: ['burgers', 'bbq'], cuisine: 'Gourmet burgers', tagline: 'Dry-aged beef, brioche buns, house sauces', img: 'burger', emoji: '🔥', color: '#3B3B3B', price: 3 }),
  R({ key: 'patty-wagon', name: 'Patty Wagon', menu: 'burger', cats: ['burgers'], cuisine: 'Street food', tagline: 'Late-night burgers & loaded fries', img: 'burger', emoji: '🚚', color: '#D94F70', price: 1, hours: h(12, 28) }),
  R({ key: 'koi-sushi', name: 'Koi Sushi Bar', menu: 'sushi', cats: ['sushi', 'asian'], cuisine: 'Japanese', tagline: 'Fresh nigiri and creative rolls', img: 'sushi', emoji: '🍣', color: '#E4572E', price: 3 }),
  R({ key: 'maki-moto', name: 'Maki Moto', menu: 'sushi', cats: ['sushi', 'asian'], cuisine: 'Sushi', tagline: 'Sushi sets made for sharing', img: 'sushi', emoji: '🥢', color: '#1F7A8C', price: 2 }),
  R({ key: 'golden-gyros', name: 'Golden Gyros', menu: 'kebab', cats: ['kebab', 'mediterranean'], cuisine: 'Kebab', tagline: 'Juicy kebabs, crispy fries, legendary garlic sauce', img: 'kebab', emoji: '🥙', color: '#C9862C', price: 1, hours: h(10, 28) }),
  R({ key: 'sultans-grill', name: 'Sultan’s Grill', menu: 'kebab', cats: ['kebab'], cuisine: 'Turkish', tagline: 'Charcoal-grilled Turkish classics', img: 'kebab', emoji: '🌙', color: '#8C2F39', price: 2 }),
  R({ key: 'levant-kitchen', name: 'Levant Kitchen', menu: 'mediterranean', cats: ['mediterranean', 'healthy', 'vegan'], cuisine: 'Lebanese', tagline: 'Mezze, falafel and shawarma plates', img: 'falafel', emoji: '🧆', color: '#4E8F3A', price: 2 }),
  R({ key: 'wok-this-way', name: 'Wok This Way', menu: 'wok', cats: ['asian'], cuisine: 'Chinese', tagline: 'Fiery wok dishes and dim sum', img: 'noodles', emoji: '🥡', color: '#D7263D', price: 2 }),
  R({ key: 'dumpling-dynasty', name: 'Dumpling Dynasty', menu: 'dumplings', cats: ['asian'], cuisine: 'Dumplings', tagline: 'Hand-folded every morning', img: 'dumplings', emoji: '🥟', color: '#F4A259', price: 1 }),
  R({ key: 'ramen-kazoku', name: 'Ramen Kazoku', menu: 'ramen', cats: ['asian'], cuisine: 'Ramen', tagline: '12-hour tonkotsu broth', img: 'ramen', emoji: '🍜', color: '#2B2D42', price: 2 }),
  R({ key: 'bangkok-street', name: 'Bangkok Street', menu: 'thai', cats: ['asian'], cuisine: 'Thai', tagline: 'Street food from Bangkok’s night markets', img: 'thai', emoji: '🌶️', color: '#F18F01', price: 2 }),
  R({ key: 'pho-real', name: 'Pho Real', menu: 'pho', cats: ['asian', 'healthy'], cuisine: 'Vietnamese', tagline: 'Slow-simmered phở and crunchy bánh mì', img: 'pho', emoji: '🍲', color: '#3A7D44', price: 1 }),
  R({ key: 'seoul-bowl', name: 'Seoul Bowl', menu: 'korean', cats: ['asian', 'chicken'], cuisine: 'Korean', tagline: 'Bibimbap and double-fried chicken', img: 'poke', emoji: '🇰🇷', color: '#C1121F', price: 2 }),
  R({ key: 'masala-junction', name: 'Masala Junction', menu: 'indian', cats: ['indian'], cuisine: 'Indian', tagline: 'North Indian curries from the tandoor', img: 'curry', emoji: '🍛', color: '#E07A1F', price: 2 }),
  R({ key: 'tandoor-nights', name: 'Tandoor Nights', menu: 'indian', cats: ['indian', 'vegan'], cuisine: 'Indian & Nepali', tagline: 'Biryani, momos and butter chicken', img: 'curry', emoji: '🪔', color: '#7B2D26', price: 2 }),
  R({ key: 'el-barrio', name: 'El Barrio Taquería', menu: 'mexican', cats: ['mexican'], cuisine: 'Mexican', tagline: 'Tacos, burritos and fresh guac', img: 'tacos', emoji: '🌮', color: '#2A9D8F', price: 2 }),
  R({ key: 'burrito-bros', name: 'Burrito Brothers', menu: 'mexican', cats: ['mexican'], cuisine: 'Tex-Mex', tagline: 'Burritos as big as your head', img: 'burrito', emoji: '🌯', color: '#E9C46A', price: 1 }),
  R({ key: 'crispy-coop', name: 'Crispy Coop', menu: 'chicken', cats: ['chicken'], cuisine: 'Fried chicken', tagline: 'Buttermilk fried chicken & tenders', img: 'chicken', emoji: '🍗', color: '#F77F00', price: 1, hours: h(11, 26) }),
  R({ key: 'leaf-ladle', name: 'Leaf & Ladle', menu: 'healthy', cats: ['healthy', 'vegan'], cuisine: 'Salads', tagline: 'Big salads, warm bowls, cold-pressed juice', img: 'salad', emoji: '🥗', color: '#52B788', price: 2, hours: h(8, 21) }),
  R({ key: 'aloha-poke', name: 'Aloha Poke', menu: 'poke', cats: ['healthy', 'sushi'], cuisine: 'Poke', tagline: 'Hawaiian poke bowls, your way', img: 'poke', emoji: '🌺', color: '#FF6B6B', price: 2 }),
  R({ key: 'sunny-side', name: 'Sunny Side Café', menu: 'breakfast', cats: ['breakfast', 'coffee'], cuisine: 'Brunch', tagline: 'All-day breakfast & brunch', img: 'breakfast', emoji: '🍳', color: '#FFB703', price: 2, hours: h(7, 17) }),
  R({ key: 'pancake-parlor', name: 'Pancake Parlour', menu: 'pancakes', cats: ['breakfast', 'dessert'], cuisine: 'Pancakes', tagline: 'Fluffy stacks & Belgian waffles', img: 'pancakes', emoji: '🥞', color: '#BC6C25', price: 1, hours: h(8, 20) }),
  R({ key: 'bean-there', name: 'Bean There', menu: 'coffee', cats: ['coffee', 'bakery'], cuisine: 'Coffee', tagline: 'Specialty coffee & fresh pastries', img: 'coffee', emoji: '☕', color: '#6F4E37', price: 1, hours: h(7, 19) }),
  R({ key: 'daily-grind', name: 'The Daily Grind', menu: 'coffee', cats: ['coffee', 'breakfast'], cuisine: 'Café', tagline: 'Your neighbourhood coffee spot', img: 'coffee', emoji: '🫘', color: '#432818', price: 1, hours: h(6, 18) }),
  R({ key: 'crumb-co', name: 'Crumb & Co.', menu: 'bakery', cats: ['bakery', 'breakfast'], cuisine: 'Bakery', tagline: 'Sourdough, pastries and cakes baked daily', img: 'bakery', emoji: '🥐', color: '#D4A373', price: 2, hours: h(7, 18) }),
  R({ key: 'sugar-rush', name: 'Sugar Rush', menu: 'dessert', cats: ['dessert'], cuisine: 'Desserts', tagline: 'Cakes, donuts and late-night sweets', img: 'dessert', emoji: '🧁', color: '#F15BB5', price: 2, hours: h(10, 25) }),
  R({ key: 'gelato-bello', name: 'Gelato Bello', menu: 'icecream', cats: ['dessert'], cuisine: 'Gelato', tagline: 'Artisan gelato churned every morning', img: 'icecream', emoji: '🍨', color: '#9BC53D', price: 2, hours: h(11, 23) }),
  R({ key: 'frank-furter', name: 'Frank & Furter', menu: 'hotdog', cats: ['sandwiches', 'burgers'], cuisine: 'Hot dogs', tagline: 'Gourmet hot dogs and crispy fries', img: 'hotdog', emoji: '🌭', color: '#E63946', price: 1, hours: h(11, 26) }),
  R({ key: 'smokehouse-88', name: 'Smokehouse 88', menu: 'bbq', cats: ['bbq'], cuisine: 'American BBQ', tagline: 'Low & slow BBQ from our smoker', img: 'bbq', emoji: '🍖', color: '#5C3D2E', price: 3 }),
  R({ key: 'pasta-la-vista', name: 'Pasta La Vista', menu: 'italian', cats: ['italian'], cuisine: 'Italian', tagline: 'Fresh pasta, made in-house', img: 'pasta', emoji: '🍝', color: '#386641', price: 2 }),
  R({ key: 'salty-catch', name: 'The Salty Catch', menu: 'seafood', cats: ['seafood'], cuisine: 'Seafood', tagline: 'Fish & chips and fresh catch of the day', img: 'seafood', emoji: '🐟', color: '#0077B6', price: 3 }),
  R({ key: 'prime-cut', name: 'Prime Cut', menu: 'steakhouse', cats: ['bbq'], cuisine: 'Steakhouse', tagline: 'Dry-aged steaks over charcoal', img: 'steak', emoji: '🥩', color: '#6A040F', price: 3, hours: h(16, 24) }),
  R({ key: 'boba-bliss', name: 'Boba Bliss', menu: 'boba', cats: ['drinks', 'dessert'], cuisine: 'Bubble tea', tagline: 'Bubble tea with freshly cooked pearls', img: 'bubbletea', emoji: '🧋', color: '#B5838D', price: 1, hours: h(11, 23) }),
  R({ key: 'juice-junction', name: 'Juice Junction', menu: 'smoothie', cats: ['drinks', 'healthy', 'vegan'], cuisine: 'Smoothies', tagline: 'Smoothies, juices and açaí bowls', img: 'smoothie', emoji: '🥤', color: '#06D6A0', price: 2, hours: h(8, 20) }),
  R({ key: 'stacked', name: 'Stacked Sandwiches', menu: 'sandwich', cats: ['sandwiches', 'breakfast'], cuisine: 'Deli', tagline: 'Towering deli sandwiches', img: 'sandwich', emoji: '🥪', color: '#A7C957', price: 1, hours: h(8, 20) }),
  R({ key: 'planted', name: 'Planted Kitchen', menu: 'vegan', cats: ['vegan', 'healthy'], cuisine: 'Vegan', tagline: '100% plant-based comfort food', img: 'vegan', emoji: '🌱', color: '#2D6A4F', price: 2 }),
  R({ key: 'balkan-grill', name: 'Balkan Grill House', menu: 'balkan', cats: ['bbq', 'kebab'], cuisine: 'Balkan', tagline: 'Qebapa, pljeskavica and fresh somun', img: 'kebab', emoji: '🔥', color: '#9D0208', price: 1, hours: h(9, 24) }),

  S({ key: 'nomly-market', name: 'Nomly Market', menu: 'grocery', cats: ['grocery'], cuisine: 'Grocery', tagline: 'Your groceries in 20 minutes', img: 'grocery', emoji: '🛒', color: '#7B4DFF', price: 1, hours: h(0, 24) }),
  S({ key: 'freshco', name: 'FreshCo Supermarket', menu: 'grocery', cats: ['grocery'], cuisine: 'Supermarket', tagline: 'Thousands of products at store prices', img: 'grocery', emoji: '🧺', color: '#2A9D8F', price: 1, hours: h(7, 23) }),
  S({ key: 'quickstop', name: 'Quickstop 24/7', menu: 'convenience', cats: ['convenience'], cuisine: 'Convenience', tagline: 'Snacks, drinks & essentials, day and night', img: 'chips', emoji: '🏪', color: '#E76F51', price: 1, hours: h(0, 24) }),
  S({ key: 'organic-oasis', name: 'Organic Oasis', menu: 'organic', cats: ['organic', 'grocery'], cuisine: 'Organic', tagline: 'Organic and local produce', img: 'produce', emoji: '🥕', color: '#588157', price: 2, hours: h(8, 21) }),
  S({ key: 'careplus', name: 'CarePlus Pharmacy', menu: 'pharmacy', cats: ['pharmacy'], cuisine: 'Pharmacy', tagline: 'Health, beauty and everyday care', img: 'pharmacy', emoji: '💊', color: '#00A6A6', price: 2, hours: h(8, 22) }),
  S({ key: 'bloom-room', name: 'Bloom Room', menu: 'flowers', cats: ['flowers'], cuisine: 'Florist', tagline: 'Fresh bouquets, hand-tied today', img: 'flowers', emoji: '💐', color: '#E56B6F', price: 3, hours: h(9, 20) }),
  S({ key: 'gadget-garage', name: 'Gadget Garage', menu: 'electronics', cats: ['electronics'], cuisine: 'Electronics', tagline: 'Chargers, audio and tech accessories', img: 'headphones', emoji: '🎧', color: '#3D5A80', price: 2, hours: h(10, 21) }),
  S({ key: 'paws-claws', name: 'Paws & Claws', menu: 'pets', cats: ['pets'], cuisine: 'Pet shop', tagline: 'Food, treats and toys for pets', img: 'petfood', emoji: '🐾', color: '#BC6C25', price: 2, hours: h(9, 20) }),
  S({ key: 'cellar-door', name: 'Cellar Door', menu: 'alcohol', cats: ['alcohol'], cuisine: 'Wine shop', tagline: 'Wine, craft beer and cider. ID required.', img: 'wine', emoji: '🍷', color: '#6D213C', price: 2, hours: h(10, 21), age: true }),
];

const PROMOS: Promo[] = [
  { kind: 'free-delivery', label: 'Free delivery' },
  { kind: 'discount', label: '−20% on selected items' },
  { kind: 'bogo', label: '2 for 1 on popular items' },
  { kind: 'gift', label: 'Free dessert over €25' },
];

function describe(t: VenueTpl, city: City): string {
  if (t.type === 'store') {
    return `${t.name} delivers ${t.cuisine.toLowerCase()} essentials across ${city.name}. ${t.tagline}. Order now and get everything delivered straight to your door — no queues, no heavy bags.`;
  }
  return `${t.name} is a much-loved ${t.cuisine.toLowerCase()} spot in ${city.name}. ${t.tagline}. Everything is prepared fresh when you order and packed carefully so it arrives just as good as in the restaurant.`;
}

function buildVenue(t: VenueTpl, city: City): Venue {
  const r = seeded(`${city.id}-${t.key}`);
  const latSpread = 0.022;
  const lngSpread = latSpread / Math.cos((city.lat * Math.PI) / 180);
  const hours = t.hours
    ? { open: t.hours[0], close: t.hours[1] }
    : { open: r.pick([9, 10, 10, 11, 11]) * 60, close: r.pick([22, 23, 23, 24, 25]) * 60 };
  const promo = r.chance(0.32) ? r.pick(PROMOS) : undefined;
  return {
    id: `${city.id}-${t.key}`,
    slug: `${t.key}-${city.id}`,
    name: t.name,
    type: t.type ?? 'restaurant',
    categories: t.cats,
    cuisine: t.cuisine,
    tagline: t.tagline,
    description: describe(t, city),
    image: poolImage(t.img, `${t.key}-${city.id}`),
    logoColor: t.color,
    logoEmoji: t.emoji,
    rating: Math.round(r.range(7.4, 9.8) * 10) / 10,
    ratingCount: Math.round(r.range(40, 4200)),
    priceLevel: t.price,
    baseDeliveryFee: promo?.kind === 'free-delivery' ? 0 : r.pick([0.99, 1.49, 1.9, 1.9, 2.49, 2.9]),
    prepTime: t.type === 'store' ? r.int(5, 10) : r.int(8, 22),
    minOrder: t.type === 'store' ? r.pick([10, 12, 15]) : r.pick([8, 10, 10, 12]),
    lat: city.lat + r.range(-latSpread, latSpread),
    lng: city.lng + r.range(-lngSpread, lngSpread),
    address: `${r.pick(city.streets)} ${r.int(1, 120)}`,
    hours,
    promo,
    isNew: r.chance(0.12),
    sponsored: r.chance(0.1),
    popularity: Math.round(r.range(10, 100)),
    menuKey: t.menu,
    ageRestricted: t.age,
  };
}

const byCity = new Map<string, Venue[]>();
for (const city of CITIES) byCity.set(city.id, VENUE_TEMPLATES.map((t) => buildVenue(t, city)));

export const ALL_VENUES: Venue[] = [...byCity.values()].flat();

export const venuesForCity = (cityId: string): Venue[] => byCity.get(cityId) ?? byCity.get(CITIES[0].id)!;

export const getVenueBySlug = (slug: string) => ALL_VENUES.find((v) => v.slug === slug);

export const getVenueById = (id: string) => ALL_VENUES.find((v) => v.id === id);
