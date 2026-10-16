export type VenueType = 'restaurant' | 'store';

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  streets: string[];
}

export interface Category {
  id: string;
  name: string;
  image: string;
  type: VenueType;
}

export interface OptionChoice {
  id: string;
  name: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  /** Minimum number of choices. 1 = required single choice. */
  min: number;
  max: number;
  choices: OptionChoice[];
}

export type ItemTag = 'vegan' | 'vegetarian' | 'spicy' | 'gluten-free' | 'new' | 'age-18';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  popular?: boolean;
  tags?: ItemTag[];
  options?: OptionGroup[];
  /** Store products: "500 g", "1 l"… */
  unit?: string;
}

export interface MenuSection {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

export type PromoKind = 'discount' | 'free-delivery' | 'bogo' | 'gift';

export interface Promo {
  kind: PromoKind;
  label: string;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  type: VenueType;
  categories: string[];
  cuisine: string;
  tagline: string;
  description: string;
  image: string;
  logoColor: string;
  logoEmoji: string;
  rating: number;
  ratingCount: number;
  priceLevel: 1 | 2 | 3;
  baseDeliveryFee: number;
  prepTime: number;
  minOrder: number;
  lat: number;
  lng: number;
  address: string;
  /** Opening hours in minutes after midnight. close may exceed 1440 (open past midnight). */
  hours: { open: number; close: number };
  promo?: Promo;
  isNew?: boolean;
  sponsored?: boolean;
  popularity: number;
  menuKey: string;
  ageRestricted?: boolean;
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  price: number;
}

export interface CartLine {
  key: string;
  itemId: string;
  name: string;
  image?: string;
  basePrice: number;
  options: SelectedOption[];
  quantity: number;
  note?: string;
  /** Group orders: name of the friend who added this line (undefined = you). */
  by?: string;
}

export interface GroupGuest {
  name: string;
  color: string;
}

export interface GroupOrder {
  code: string;
  createdAt: number;
  guests: GroupGuest[];
  /** Guests who have joined so far. */
  joined: string[];
  /** Number of simulated events already applied. */
  step: number;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  street: string;
  details?: string;
  cityId: string;
  lat: number;
  lng: number;
  instructions?: string;
}

export type OrderStatus = 'received' | 'preparing' | 'pickup' | 'delivering' | 'delivered' | 'cancelled';

export interface OrderTotals {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  serviceFee: number;
  smallOrderFee: number;
  tip: number;
  total: number;
}

export interface Order {
  id: string;
  venueId: string;
  venueSlug: string;
  venueName: string;
  venueImage: string;
  cityId: string;
  lines: CartLine[];
  totals: OrderTotals;
  mode: 'delivery' | 'pickup';
  address?: Address;
  paymentMethod: string;
  promoCode?: string;
  createdAt: number;
  /** When the order should be ready/delivered for scheduled orders. */
  scheduledFor?: number;
  /** Total simulated duration in ms from placement to delivery. */
  durationMs: number;
  courierName: string;
  courierVehicle: 'bike' | 'scooter' | 'car';
  cancelled?: boolean;
  rated?: number;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarColor: string;
  createdAt: number;
}
