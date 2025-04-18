import { sanityClient } from '$lib/sanity/client';
import { 
  allFeaturedProductsQuery, 
  allCategoriesQuery, 
  allColorsQuery,
  allSizesQuery,
  paginatedProductsQuery,
  singleProductQuery
} from '$lib/sanity/queries';
import type { Size, Color, Category, Product, Variant, Image } from '$lib/types';

// Helper function to transform Sanity data to match our app's data structure
function transformSanityProduct(sanityProduct: any): Product {
  // Extract the first variant's price as the product price
  const firstVariant = sanityProduct.variants && sanityProduct.variants.length > 0 
    ? sanityProduct.variants[0] 
    : null;
  
  // Transform variants
  const variants: Variant[] = sanityProduct.variants?.map((variant: any) => ({
    _id: variant._id,
    sku: variant.sku || `${sanityProduct._id}-${variant.color?._id || 'default'}-${variant.size?._id || 'default'}`,
    size: variant.size?.name || 'M',
    color: {
      _id: variant.color?._id || 'default',
      name: variant.color?.name || 'Default',
      hex: variant.color?.hex || '#000000'
    },
    price: variant.price || 0,
    stock: variant.stock || 0,
    images: variant.images?.map((url: string, index: number) => ({
      _id: `${variant._id}-img-${index}`,
      url: url
    })) || []
  })) || [];

  // Create a default variant if none exist
  if (variants.length === 0) {
    variants.push({
      _id: `${sanityProduct._id}-default`,
      sku: `${sanityProduct._id}-default`,
      size: 'M',
      color: {
        _id: 'default',
        name: 'Default',
        hex: '#000000'
      },
      price: 0,
      stock: 0,
      images: []
    });
  }

  return {
    _id: sanityProduct._id,
    name: sanityProduct.name,
    description: sanityProduct.description || '',
    category: sanityProduct.category?.name || 'Uncategorized',
    variants: variants,
    rating: sanityProduct.rating || 0,
    isFeatured: sanityProduct.isFeatured || false
  };
}

// Fetch all categories
export async function getCategories(): Promise<Category[]> {
  try {
    const sanityCategories = await sanityClient.fetch(allCategoriesQuery);
    return sanityCategories.map((category: any) => ({
      _id: category._id,
      name: category.name,
      description: category.description || ''
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Fetch all sizes
export async function getSizes(): Promise<Size[]> {
  try {
    const sanitySizes = await sanityClient.fetch(allSizesQuery);
    return sanitySizes.map((size: any) => ({
      _id: size._id,
      name: size.name
    }));
  } catch (error) {
    console.error('Error fetching sizes:', error);
    return [];
  }
}

// Fetch all colors
export async function getColors(): Promise<Color[]> {
  try {
    const sanityColors = await sanityClient.fetch(allColorsQuery);
    return sanityColors.map((color: any) => ({
      _id: color._id,
      name: color.name,
      hex: color.hex
    }));
  } catch (error) {
    console.error('Error fetching colors:', error);
    return [];
  }
}

// Fetch all products
export async function getProducts(): Promise<Product[]> {
  try {
    const result = await sanityClient.fetch(paginatedProductsQuery(0, 100));
    return result.products.map(transformSanityProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Fetch featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const featuredProducts = await sanityClient.fetch(allFeaturedProductsQuery);
    return featuredProducts.map(transformSanityProduct);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// Fetch products by category
export async function getProductsByCategory(categoryName: string): Promise<Product[]> {
  try {
    // First, find the category ID by name
    const categories = await getCategories();
    const category = categories.find(c => c.name === categoryName);
    
    if (!category) {
      return [];
    }
    
    // Use a custom query for category products
    const query = `
      *[_type == "product" && category._ref == "${category._id}"] | order(_createdAt desc) [0...100] {
        _id,
        name,
        description,
        "slug": slug.current,
        "category": category-> {
          _id,
          name
        },
        isFeatured,
        rating,
        "image": mainImage.asset->url,
        "variants": variants[]->{
          _id,
          sku,
          price,
          stock,
          "color": color->{
            _id,
            name,
            hex
          },
          "size": size->{
            _id,
            name
          },
          "images": images[].asset->url
        }
      }
    `;
    
    const products = await sanityClient.fetch(query);
    return products.map(transformSanityProduct);
  } catch (error) {
    console.error(`Error fetching products for category ${categoryName}:`, error);
    return [];
  }
}

// Fetch product by ID
export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const product = await sanityClient.fetch(singleProductQuery(id));
    return product ? transformSanityProduct(product) : undefined;
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    return undefined;
  }
}

// Get random products
export async function getRandomProducts(count: number): Promise<Product[]> {
  try {
    const allProducts = await getProducts();
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error(`Error fetching ${count} random products:`, error);
    return [];
  }
}

// Format price (keeping the existing function)
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(price);
} 