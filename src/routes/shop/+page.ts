import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  // Debugging output for URL parameters
  console.log('URL search params:', Object.fromEntries(url.searchParams.entries()));

  // Get search query from URL
  const searchQuery = url.searchParams.get('search') || '';

  // Get category filter (one or multiple separated by commas)
  const categoryParam = url.searchParams.get('category') || '';
  const categories = categoryParam ? categoryParam.split(',') : [];

  // Get color filter (one or multiple separated by commas)
  const colorParam = url.searchParams.get('color') || '';
  const colors = colorParam ? colorParam.split(',') : [];

  // Get size filter (one or multiple separated by commas)
  const sizeParam = url.searchParams.get('size') || '';
  const sizes = sizeParam ? sizeParam.split(',') : [];

  // Get price range
  const minPrice = url.searchParams.get('minPrice') ? parseInt(url.searchParams.get('minPrice') || '0') : null;
  const maxPrice = url.searchParams.get('maxPrice') ? parseInt(url.searchParams.get('maxPrice') || '1000') : null;

  // Get sort order
  const sort = url.searchParams.get('sort') || 'featured';

  console.log('Parsed filters:', { searchQuery, categories, colors, sizes, minPrice, maxPrice, sort });

  return {
    filters: {
      searchQuery,
      categories,
      colors,
      sizes,
      minPrice,
      maxPrice,
      sort
    }
  };
};
