// src/lib/homepage/data/homepageData.server.ts
import { sanityClient } from '$lib/sanity/client';
import {
  allFeaturedProductsQuery,
  allCategoriesQuery,
  totalProductCountQuery
} from '$lib/sanity/queries'

/**
 * Fetch everything the homepage needs—all in one place.
 */
export async function fetchHomepageData() {
  const [ featuredProducts, categories, totalProductCount ] = await Promise.all([
    sanityClient.fetch(allFeaturedProductsQuery),
    sanityClient.fetch(allCategoriesQuery),
    sanityClient.fetch(totalProductCountQuery)
  ])

  console

  return {
    featuredProducts,
    categories,
    totalProductCount
  }
}
