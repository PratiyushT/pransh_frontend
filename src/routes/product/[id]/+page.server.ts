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
      console.log(`Product with slug '${slug}' not found.`);
      return {
        product: null,
        relatedProducts: []
      };
    }

    // Get some related products
    try {
      const relatedQuery = `
        *[_type == "product" && _id != "${product._id}"] | order(rating desc) [0...4] {
          _id,
          name,
          description,
          "slug": slug.current,
          rating,
          isFeatured,
          "category": category->{
            _id,
            name
          },
          "variants": variants[]-> {
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

      const relatedProducts = await client.fetch(relatedQuery);

      return {
        product,
        relatedProducts
      };
    } catch (relatedErr) {
      console.error('Error fetching related products:', relatedErr);
      // Still return the main product even if related products fail
      return {
        product,
        relatedProducts: []
      };
    }
  } catch (err) {
    console.error('Error fetching product:', err);

    // Instead of throwing an error that breaks preloading, return null
    // This allows the page component to handle the missing product
    return {
      product: null,
      relatedProducts: [],
      error: {
        message: 'Error fetching product',
        status: 500
      }
    };
  }
};
