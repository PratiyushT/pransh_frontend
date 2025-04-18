import { sanityClient } from './client';
import { 
  allFeaturedProductsQuery, 
  allCategoriesQuery, 
  totalProductCountQuery 
} from './queries';

/**
 * Fetches all data needed for the homepage
 * @returns Object containing featured products, categories, and total product count
 */
export async function fetchHomepageData() {
  try {
    // Fetch featured products
    const featuredProducts = await sanityClient.fetch(allFeaturedProductsQuery);
    
    // Fetch categories
    const categories = await sanityClient.fetch(allCategoriesQuery);
    
    // Fetch total product count
    const totalProductCount = await sanityClient.fetch(totalProductCountQuery);
    
    return {
      featuredProducts,
      categories,
      totalProductCount
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    throw error;
  }
} 