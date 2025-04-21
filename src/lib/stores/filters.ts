import { writable } from 'svelte/store';
import type { Category, Color, Size } from '$lib/types';
import { getCategories, getColors, getSizes } from '$lib/sanity/sanityData';

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
    // Use mock data if in development and Sanity is not accessible
    const useMockData = import.meta.env.DEV && !import.meta.env.VITE_SANITY_PROJECT_ID;

    if (useMockData) {
      // Import mock data dynamically
      const { getCategories: getMockCategories,
              getColors: getMockColors,
              getSizes: getMockSizes } = await import('$lib/utils/data');

      categoriesStore.set(getMockCategories());
      colorsStore.set(getMockColors());
      sizesStore.set(getMockSizes());
      console.log('Using mock filter data in development');
    } else {
      // Load data from Sanity in parallel
      const [categoriesData, colorsData, sizesData] = await Promise.all([
        getCategories(),
        getColors(),
        getSizes()
      ]);

      categoriesStore.set(categoriesData);
      colorsStore.set(colorsData);
      sizesStore.set(sizesData);
    }

    // Mark as loaded so we don't load again
    filtersLoaded = true;
  } catch (error) {
    console.error('Error loading filter data:', error);
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
