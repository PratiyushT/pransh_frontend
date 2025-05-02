import type { Size, Color, Category} from '$lib/types';

// Mock data for categories
const categories: Category[] = [
  { _id: '1', name: 'Dresses' },
  { _id: '2', name: 'Tops' },
  { _id: '3', name: 'Bottoms' },
  { _id: '4', name: 'Accessories' }
];

// Mock data for sizes
const sizes: Size[] = [
  { _id: '1', name: 'XS' },
  { _id: '2', name: 'S' },
  { _id: '3', name: 'M' },
  { _id: '4', name: 'L' },
  { _id: '5', name: 'XL' }
];

// Mock data for colors
const colors: Color[] = [
  { _id: '1', name: 'Black', hex: ['#000000'] },
  { _id: '2', name: 'White', hex: ['#FFFFFF'] },
  { _id: '3', name: 'Gold', hex: ['#D4AF37'] },
  { _id: '4', name: 'Navy', hex: ['#000080'] },
  { _id: '5', name: 'Beige', hex: ['#F5F5DC'] },
  { _id: '6', name: 'Red', hex: ['#FF0000'] },
  { _id: '7', name: 'Red/Blue', hex: ['#E32D2D', '#0048A5'] },
  { _id: '8', name: 'Tricolor', hex: ['#E32D2D', '#0048A5', '#FFD500'] }
];

// Get all categories
export const getCategories = (): Category[] => {
  return categories;
};

// Get all sizes
export const getSizes = (): Size[] => {
  return sizes;
};

// Get all colors
export const getColors = (): Color[] => {
  return colors;
};

// Get random products
export const getRandomProducts = (count: number): Product[] => {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Format price utility
export function formatPrice(amount?: number, currency = 'USD'): string {
  // if amount is missing or not a finite number, return blank or “$0.00”
  if (typeof amount !== 'number' || !isFinite(amount)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(0);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}
