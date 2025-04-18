// src/lib/homepage/data/homepageData.server.ts
import { sanityClient } from './utils/sanityClient'
import {
  allFeaturedProductsQuery,
  allCategoriesQuery,
  totalProductCountQuery
} from './queries'

/**
 * Fetch everything the homepage needs—all in one place.
 */
export async function fetchHomepageData() {
  const [ featuredProducts, categories, totalProductCount ] = await Promise.all([
    sanityClient.fetch(allFeaturedProductsQuery),
    sanityClient.fetch(allCategoriesQuery),
    sanityClient.fetch(totalProductCountQuery)
  ])

  return {
    featuredProducts,
    categories,
    totalProductCount
  }
}
