export interface Size {
  _id: string;
  name: string;
}

export interface Color {
  _id: string;
  name: string;
  hex: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string; // Added description field
}

export interface Image {
  _id: string;
  url: string;
  alt?: string;
}

export interface Variant {
  _id: string;
  sku: string;
  size: string;
  color: Color;
  price: number;
  stock: number;
  images: Image[];
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  variants: Variant[];
  rating: number;
  isFeatured: boolean;
}

export interface CartItem {
  productId: string;
  variantSku: string;
  name: string;
  price: number;
  size: string;
  color: Color;
  quantity: number;
  image: string;
}

export interface MockDataResult {
  success: boolean; // Added success field
  result: Size[] | Color[] | Category[] | Product[];
  ms?: number; // Retained ms for backward compatibility
}
