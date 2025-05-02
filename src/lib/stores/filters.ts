import { writable } from 'svelte/store';
import type { Category, Color, Size } from '$lib/types';
import { getCategories, getColors, getSizes } from '$lib/sanity/utils/queriesTransform';

// Create stores for filter data
export const categoriesStore = writable<Category[]>([]);
export const colorsStore = writable<Color[]>([]);
export const sizesStore = writable<Size[]>([]);
export const isLoadingFilters = writable(true);
export const filtersError = writable<string | null>(null);

// Flag to track if data has been loaded
let filtersLoaded = false;

// Function to fetch filter data once
export async function initializeFilterData() {
  // Only fetch if we haven't already loaded the data
  if (filtersLoaded) {
    return;
  }

  isLoadingFilters.set(true);
  filtersError.set(null);

  try {
    // Always try to use Sanity data first
    const categoriesData = await getCategories();

    const colorsData = await getColors();

    const sizesData = await getSizes();

    // Update the stores with the data
    categoriesStore.set(categoriesData);
    colorsStore.set(colorsData);
    sizesStore.set(sizesData);

    // Mark as loaded so we don't load again
    filtersLoaded = true;

  } catch (error) {
    console.error('Error loading filter data from Sanity:', error);
    filtersError.set('Failed to load filter data. Using fallback data.');

    // Import and use mock data as fallback
    const { getCategories: getMockCategories,
            getColors: getMockColors,
            getSizes: getMockSizes } = await import('$lib/utils/data');

    categoriesStore.set(getMockCategories());
    colorsStore.set(getMockColors());
    sizesStore.set(getMockSizes());
  } finally {
    isLoadingFilters.set(false);
  }
}

// Initialize filter data on import
initializeFilterData();
