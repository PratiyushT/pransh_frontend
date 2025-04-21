export interface Size {
  _id: string;
  name: string;
}

export interface Color {
  _id: string;
  name: string;
  hex: string[];
}

export interface Category {
  _id: string;
  name: string;
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
  slug: string | { current: string }; // Update to handle both string and object formats
  image: string | Image;
  description: string;
  category: string | Category;
  variants: Variant[];
  rating: number;
  isFeatured: boolean;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface ProductFilterOptions {
  page?: number;
  perPage?: number;
  search?: string;
  categories?: string[];
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  featuredOnly?: boolean;
}

export interface ProductDetails {
  [key: string]: {
    product: { _id: string; name: string };
    variant: {
      _id: string;
      sku: string;
      price: number;
      stock: number;
      color: { _id: string; name: string; hex: string };
      size: string;
      images: string[];
    };
  };
}
