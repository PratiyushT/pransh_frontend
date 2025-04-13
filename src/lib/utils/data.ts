import type { Size, Color, Category, Product } from '$lib/types';

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
  { _id: '1', name: 'Black', hex: '#000000' },
  { _id: '2', name: 'White', hex: '#FFFFFF' },
  { _id: '3', name: 'Gold', hex: '#D4AF37' },
  { _id: '4', name: 'Navy', hex: '#000080' },
  { _id: '5', name: 'Beige', hex: '#F5F5DC' },
  { _id: '6', name: 'Red', hex: '#FF0000' }
];

// Mock data for products
const products: Product[] = [
  {
    _id: '1',
    name: 'Silk Evening Gown',
    description: 'A luxurious silk evening gown perfect for special occasions. Features a flattering silhouette and delicate details.',
    category: 'Dresses',
    variants: [
      {
        _id: '1-1',
        sku: 'SEG-BLK-S',
        size: 'S',
        color: colors[0],
        price: 599.99,
        stock: 5,
        images: [{ _id: '111', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '1-2',
        sku: 'SEG-BLK-M',
        size: 'M',
        color: colors[0],
        price: 599.99,
        stock: 3,
        images: [{ _id: '112', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '1-3',
        sku: 'SEG-GLD-S',
        size: 'S',
        color: colors[2],
        price: 649.99,
        stock: 2,
        images: [{ _id: '113', url: '/images/product-placeholder.jpg' }]
      }
    ],
    rating: 4.8,
    isFeatured: true
  },
  {
    _id: '2',
    name: 'Cashmere Sweater',
    description: 'A soft and warm cashmere sweater made from the finest materials. Perfect for cooler days and elegant enough for evening wear.',
    category: 'Tops',
    variants: [
      {
        _id: '2-1',
        sku: 'CS-WHT-M',
        size: 'M',
        color: colors[1],
        price: 299.99,
        stock: 8,
        images: [{ _id: '211', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '2-2',
        sku: 'CS-WHT-L',
        size: 'L',
        color: colors[1],
        price: 299.99,
        stock: 6,
        images: [{ _id: '212', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '2-3',
        sku: 'CS-BEG-M',
        size: 'M',
        color: colors[4],
        price: 299.99,
        stock: 4,
        images: [{ _id: '213', url: '/images/product-placeholder.jpg' }]
      }
    ],
    rating: 4.5,
    isFeatured: false
  },
  {
    _id: '3',
    name: 'Tailored Wool Blazer',
    description: 'A perfectly tailored wool blazer that adds sophistication to any outfit. Features premium buttons and a luxurious lining.',
    category: 'Tops',
    variants: [
      {
        _id: '3-1',
        sku: 'TWB-NVY-S',
        size: 'S',
        color: colors[3],
        price: 449.99,
        stock: 3,
        images: [{ _id: '311', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '3-2',
        sku: 'TWB-NVY-M',
        size: 'M',
        color: colors[3],
        price: 449.99,
        stock: 5,
        images: [{ _id: '312', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '3-3',
        sku: 'TWB-BLK-M',
        size: 'M',
        color: colors[0],
        price: 449.99,
        stock: 4,
        images: [{ _id: '313', url: '/images/product-placeholder.jpg' }]
      }
    ],
    rating: 4.9,
    isFeatured: true
  },
  {
    _id: '4',
    name: 'Silk Scarf',
    description: 'A beautiful silk scarf with an intricate pattern. The perfect accessory to elevate any outfit.',
    category: 'Accessories',
    variants: [
      {
        _id: '4-1',
        sku: 'SS-RED-OS',
        size: 'OS',
        color: colors[5],
        price: 129.99,
        stock: 10,
        images: [{ _id: '411', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '4-2',
        sku: 'SS-GLD-OS',
        size: 'OS',
        color: colors[2],
        price: 129.99,
        stock: 8,
        images: [{ _id: '412', url: '/images/product-placeholder.jpg' }]
      }
    ],
    rating: 4.7,
    isFeatured: false
  },
  {
    _id: '5',
    name: 'Linen Trousers',
    description: 'Elegant linen trousers, perfect for warm weather. Features a comfortable fit and timeless design.',
    category: 'Bottoms',
    variants: [
      {
        _id: '5-1',
        sku: 'LT-BEG-M',
        size: 'M',
        color: colors[4],
        price: 199.99,
        stock: 6,
        images: [{ _id: '511', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '5-2',
        sku: 'LT-BEG-L',
        size: 'L',
        color: colors[4],
        price: 199.99,
        stock: 4,
        images: [{ _id: '512', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '5-3',
        sku: 'LT-WHT-M',
        size: 'M',
        color: colors[1],
        price: 199.99,
        stock: 5,
        images: [{ _id: '513', url: '/images/product-placeholder.jpg' }]
      }
    ],
    rating: 4.6,
    isFeatured: true
  },
  {
    _id: '6',
    name: 'Leather Belt',
    description: 'A premium leather belt with a stylish gold buckle. The perfect finishing touch for any outfit.',
    category: 'Accessories',
    variants: [
      {
        _id: '6-1',
        sku: 'LB-BLK-S',
        size: 'S',
        color: colors[0],
        price: 149.99,
        stock: 7,
        images: [{ _id: '611', url: '/images/product-placeholder.jpg' }]
      },
      {
        _id: '6-2',
        sku: 'LB-BLK-M',
        size: 'M',
        color: colors[0],
        price: 149.99,
        stock: 5,
        images: [{ _id: '612', url: '/images/product-placeholder.jpg' }]
      }
    ],
    rating: 4.5,
    isFeatured: false
  }
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

// Get all products
export const getProducts = (): Product[] => {
  return products;
};

// Get featured products
export const getFeaturedProducts = (): Product[] => {
  return products.filter(product => product.isFeatured);
};

// Get products by category
export const getProductsByCategory = (categoryName: string): Product[] => {
  return products.filter(product =>
    product.category.toLowerCase() === categoryName.toLowerCase()
  );
};

// Get product by ID
export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product._id === id);
};

// Get random products
export const getRandomProducts = (count: number): Product[] => {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Format price utility
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};
