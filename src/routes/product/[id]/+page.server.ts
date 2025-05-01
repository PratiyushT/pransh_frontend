import { client } from '$lib/sanity/client';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { singleProductBySlugQuery } from '$lib/sanity/queries';

export const load: PageServerLoad = async ({ params }) => {
  const slug = params.id;

  try {
    // Use the existing singleProductBySlugQuery function
    const product = await client.fetch(singleProductBySlugQuery(slug));

    // If no product found, return a null product instead of throwing an error
    // This allows the page component to handle the missing product gracefully
    if (!product) {
      return {
        product: null,
        relatedProducts: []
      };
    }

    // Fetch related products based on same category
    let relatedProducts = [];

    if (product.category && product.category._id) {
      // Get related products query: same category, not the same product, limit 4
      const relatedProductsQuery = `*[_type == "product" && category._ref == "${product.category._id}" && slug.current != "${slug}"][0...4] {
        _id,
        name,
        slug,
        "image": image.asset->url,
        price,
        rating,
        "category": category->name,
        "variants": variants[] {
          _key,
          _id,
          size->{name},
          color->{name, hex},
          price,
          stock,
          "images": images[]
        },
        isFeatured
      }`;

      relatedProducts = await client.fetch(relatedProductsQuery);
    }

    return {
      product,
      relatedProducts
    };
  } catch (err) {
    console.error('Error fetching product:', err);
    return {
      error: { message: 'Error loading product. Please try again later.' },
      product: null,
      relatedProducts: []
    };
  }
};
