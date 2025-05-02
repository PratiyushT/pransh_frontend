import type { PageServerLoad } from './$types';
import { singleProductByIdQuery } from '$lib/sanity/utils/queries';

import client from "$lib/sanity/client";

export const load: PageServerLoad = async ({ url, cookies, request }) => {
  try {
    // Get wishlist from localStorage via cookies
    // (in a real app you'd fetch from user's account if they're logged in)
    let wishlist: string[] = [];
    const wishlistCookie = cookies.get('wishlist');

    if (wishlistCookie) {
      try {
        wishlist = JSON.parse(wishlistCookie);
        if (!Array.isArray(wishlist)) {
          wishlist = [];
        }
      } catch (e) {
        console.error('Error parsing wishlist cookie', e);
        wishlist = [];
      }
    }

    // If there are no wishlist items, return empty array
    if (wishlist.length === 0) {
      return {
        wishlistProducts: []
      };
    }

    // Fetch products from Sanity based on wishlist IDs
    // We'll need to fetch products one by one since there's no easy way to
    // query multiple products by id in a single query
    const wishlistProductPromises = wishlist.map(async (productId) => {
      const query = singleProductByIdQuery(productId);
      return client.fetch(query).catch(err => {
        console.error(`Error fetching product ${productId}`, err);
        return null;
      });
    });

    const wishlistProducts = await Promise.all(wishlistProductPromises);

    // Filter out any null results from failed queries
    const filteredProducts = wishlistProducts.filter(product => product !== null);

    return {
      wishlistProducts: filteredProducts
    };
  } catch (error) {
    console.error('Error in wishlist load function:', error);
    return {
      wishlistProducts: [],
      error: 'Failed to fetch wishlist products'
    };
  }
};
