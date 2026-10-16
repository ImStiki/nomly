import type { Category } from '@/types';
import { poolImage } from '@/lib/img';

export const RESTAURANT_CATEGORIES: Category[] = [
  { id: 'pizza', name: 'Pizza', image: poolImage('pizza', 0), type: 'restaurant' },
  { id: 'burgers', name: 'Burgers', image: poolImage('burger', 2), type: 'restaurant' },
  { id: 'sushi', name: 'Sushi', image: poolImage('sushi', 0), type: 'restaurant' },
  { id: 'asian', name: 'Asian', image: poolImage('ramen', 1), type: 'restaurant' },
  { id: 'kebab', name: 'Kebab', image: poolImage('kebab', 0), type: 'restaurant' },
  { id: 'healthy', name: 'Healthy', image: poolImage('salad', 0), type: 'restaurant' },
  { id: 'indian', name: 'Indian', image: poolImage('curry', 5), type: 'restaurant' },
  { id: 'mexican', name: 'Mexican', image: poolImage('tacos', 0), type: 'restaurant' },
  { id: 'chicken', name: 'Chicken', image: poolImage('chicken', 4), type: 'restaurant' },
  { id: 'breakfast', name: 'Breakfast', image: poolImage('breakfast', 0), type: 'restaurant' },
  { id: 'coffee', name: 'Coffee', image: poolImage('coffee', 0), type: 'restaurant' },
  { id: 'bakery', name: 'Bakery', image: poolImage('croissant', 0), type: 'restaurant' },
  { id: 'dessert', name: 'Dessert', image: poolImage('dessert', 0), type: 'restaurant' },
  { id: 'italian', name: 'Italian', image: poolImage('pasta', 0), type: 'restaurant' },
  { id: 'bbq', name: 'BBQ & Steak', image: poolImage('steak', 0), type: 'restaurant' },
  { id: 'seafood', name: 'Seafood', image: poolImage('seafood', 0), type: 'restaurant' },
  { id: 'vegan', name: 'Vegan', image: poolImage('vegan', 2), type: 'restaurant' },
  { id: 'drinks', name: 'Drinks', image: poolImage('bubbletea', 0), type: 'restaurant' },
  { id: 'sandwiches', name: 'Sandwiches', image: poolImage('sandwich', 0), type: 'restaurant' },
  { id: 'mediterranean', name: 'Mediterranean', image: poolImage('falafel', 2), type: 'restaurant' },
];

export const STORE_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery', image: poolImage('grocery', 0), type: 'store' },
  { id: 'convenience', name: 'Convenience', image: poolImage('chips', 1), type: 'store' },
  { id: 'pharmacy', name: 'Health & beauty', image: poolImage('pharmacy', 1), type: 'store' },
  { id: 'flowers', name: 'Flowers', image: poolImage('flowers', 2), type: 'store' },
  { id: 'electronics', name: 'Electronics', image: poolImage('headphones', 1), type: 'store' },
  { id: 'pets', name: 'Pets', image: poolImage('petfood', 0), type: 'store' },
  { id: 'alcohol', name: 'Wine & spirits', image: poolImage('wine', 1), type: 'store' },
  { id: 'organic', name: 'Organic', image: poolImage('produce', 1), type: 'store' },
];

export const ALL_CATEGORIES = [...RESTAURANT_CATEGORIES, ...STORE_CATEGORIES];

export const getCategory = (id: string) => ALL_CATEGORIES.find((c) => c.id === id);
