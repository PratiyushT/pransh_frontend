// src/routes/shop/+page.server.ts
import type { PageServerLoad } from './$types';
import { client }             from '$lib/utils/sanityClient';
import { buildProductsQuery } from '$lib/sanity/queryBuilder';

export const ssr = true;

export const load: PageServerLoad = async ({ url }) => {
  // Default page & perPage
  const page    = parseInt(url.searchParams.get('page')  || '1',  10);
  const perPage = parseInt(url.searchParams.get('perPage') || '10', 10);

  // Parse filters
  const search     = url.searchParams.get('search')     || '';
  const categories = url.searchParams.get('category')   ?.split(',') || [];
  const sizes      = url.searchParams.get('size')       ?.split(',') || [];
  const colors     = url.searchParams.get('color')      ?.split(',') || [];
  const minPrice   = url.searchParams.get('minPrice')   ? +url.searchParams.get('minPrice')! : undefined;
  const maxPrice   = url.searchParams.get('maxPrice')   ? +url.searchParams.get('maxPrice')! : undefined;
  const featured   = url.searchParams.get('featured') === 'true';

  // Fetch from Sanity
  const { products, totalCount } = await client.fetch(
    buildProductsQuery({
      page, perPage,
      search, categories, sizes, colors,
      minPrice, maxPrice,
      featuredOnly: featured
    })
  );

  // Return everything the page needs
  return { products, totalCount, filters: { page, perPage, search, categories, sizes, colors, minPrice, maxPrice, featured } };
};
