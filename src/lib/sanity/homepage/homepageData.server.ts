// src/lib/homepage/data/homepageData.server.ts
import { client } from '$lib/sanity/client'
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
    client.fetch(allFeaturedProductsQuery),
    client.fetch(allCategoriesQuery),
    client.fetch(totalProductCountQuery)
  ])

  return {
    featuredProducts,
    categories,
    totalProductCount
  }
}
