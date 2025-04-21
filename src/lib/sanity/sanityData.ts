import { client } from '$lib/sanity/client';
import {
  allFeaturedProductsQuery,
  allCategoriesQuery,
  allColorsQuery,
  allSizesQuery,
  paginatedProductsQuery,
  singleProductBySlugQuery,
  cartProductsQuery,
} from '$lib/sanity/queries';
import type { Size, Color, Category, Product, Variant, Image, CartItem, ProductDetails } from '$lib/types';

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
    const sanityCategories = await client.fetch(allCategoriesQuery);
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
    const sanitySizes = await client.fetch(allSizesQuery);
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
    const sanityColors = await client.fetch(allColorsQuery);
    console.log('Sanity colors data:', sanityColors);

    return sanityColors.map((color: any) => {
      // Check if hex is an array - if not, make it an array with a single value
      const hexValue = color.hex ? color.hex : '#000000';
      const hexArray = Array.isArray(hexValue) ? hexValue : [hexValue];

      return {
        _id: color._id,
        name: color.name,
        hex: hexArray
      };
    });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return [];
  }
}

// Fetch all products
export async function getProducts(): Promise<Product[]> {
  try {
    const result = await client.fetch(paginatedProductsQuery(0, 100));
    return result.products.map(transformSanityProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Fetch featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const featuredProducts = await client.fetch(allFeaturedProductsQuery);
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

    const products = await client.fetch(query);
    return products.map(transformSanityProduct);
  } catch (error) {
    console.error(`Error fetching products for category ${categoryName}:`, error);
    return [];
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

export async function getProductBySlug(slug: string) {
  try {
    const product = await client.fetch(singleProductBySlugQuery(slug));
    return product;
  } catch (err) {
    console.error('Error fetching product by slug:', err);
    throw err;
  }
}

export async function getCartProductDetails(
  cartItems: CartItem[]
): Promise<ProductDetails> {
  // Add defensive checks
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    console.log('No cart items to fetch details for');
    return {};
  }

  try {
    console.log('Fetching details for cart items:', cartItems.length);

    // Filter out any invalid items
    const validCartItems = cartItems.filter(
      item => item && typeof item.productId === 'string' && typeof item.variantId === 'string'
    );

    if (validCartItems.length === 0) {
      console.log('No valid cart items to fetch details for');
      return {};
    }

    // Create a more direct query to fix the data fetching issue
    // This query fetches both the product and its variants in a single request
    const fetchQuery = `
      {
        "products": *[_type == "product" && _id in $productIds] {
          _id,
          name,
          "variants": *[_type == "variant" && _id in $variantIds && references(^._id)] {
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
      }
    `;

    const productIds = [...new Set(validCartItems.map(i => i.productId))];
    const variantIds = [...new Set(validCartItems.map(i => i.variantId))];

    console.log('Product IDs:', productIds);
    console.log('Variant IDs:', variantIds);

    const result = await client.fetch(fetchQuery, { productIds, variantIds });
    console.log('Raw response from Sanity:', result);

    const details: ProductDetails = {};

    // Process the results
    if (result && result.products && Array.isArray(result.products)) {
      result.products.forEach(product => {
        if (product && product.variants && Array.isArray(product.variants)) {
          product.variants.forEach(variant => {
            if (variant && variant._id) {
              const key = `${product._id}___${variant._id}`;
              details[key] = {
                product: {
                  _id: product._id,
                  name: product.name || 'Unknown Product'
                },
                variant: {
                  _id: variant._id,
                  sku: variant.sku || 'unknown',
                  price: typeof variant.price === 'number' ? variant.price : 0,
                  stock: typeof variant.stock === 'number' ? variant.stock : 0,
                  color: variant.color || { _id: 'default', name: 'Default', hex: '#000000' },
                  size: variant.size?.name || 'One Size',
                  images: Array.isArray(variant.images) ? variant.images : []
                }
              };
            }
          });
        }
      });
    }

    // Fallback to individual queries if the combined query fails or returns empty results
    if (Object.keys(details).length === 0) {
      console.log('Falling back to individual product queries...');

      // Fetch each product and variant individually
      for (const item of validCartItems) {
        try {
          const product = await client.fetch(`
            *[_type == "product" && _id == $productId][0]{
              _id,
              name
            }
          `, { productId: item.productId });

          const variant = await client.fetch(`
            *[_type == "variant" && _id == $variantId][0]{
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
          `, { variantId: item.variantId });

          if (product && variant) {
            const key = `${item.productId}___${item.variantId}`;
            details[key] = {
              product: {
                _id: product._id,
                name: product.name || 'Unknown Product'
              },
              variant: {
                _id: variant._id,
                sku: variant.sku || 'unknown',
                price: typeof variant.price === 'number' ? variant.price : 0,
                stock: typeof variant.stock === 'number' ? variant.stock : 0,
                color: variant.color || { _id: 'default', name: 'Default', hex: '#000000' },
                size: variant.size?.name || 'One Size',
                images: Array.isArray(variant.images) ? variant.images : []
              }
            };
          }
        } catch (err) {
          console.error(`Error fetching details for item ${item.productId}:${item.variantId}`, err);
        }
      }
    }

    console.log('Processed details:', Object.keys(details).length);
    return details;
  } catch (error) {
    console.error('Error fetching cart product details:', error);
    // Return an empty object on error instead of throwing
    return {};
  }
}
