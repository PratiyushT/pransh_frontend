// src/lib/homepage/data/homepageData.server.ts
import {
  allFeaturedProductsQuery,
  allCategoriesQuery,
  totalProductCountQuery
} from '$lib/sanity/utils/queries'

import client from "$lib/sanity/client";

/**
 * Fetch everything the homepage needs—all in one place.
 */
export async function fetchHomepageData() {
  // First, get the total count of featured products
  const featuredCountQuery = `count(*[_type == "product" && isFeatured == true])`;
  const [featuredProductsCount, categories, totalProductCount] = await Promise.all([
    client.fetch(featuredCountQuery),
    client.fetch(allCategoriesQuery),
    client.fetch(totalProductCountQuery)
  ]);

  // If there are more than 4 featured products, limit to 4, otherwise get all
  const limitedFeaturedQuery = featuredProductsCount > 4
    ? `${allFeaturedProductsQuery}[0...4]`
    : allFeaturedProductsQuery;

  // Fetch the featured products with the applied limit
  const featuredProducts = await client.fetch(limitedFeaturedQuery);

  return {
    featuredProducts,
    categories,
    totalProductCount,
    featuredProductsCount
  }
}
