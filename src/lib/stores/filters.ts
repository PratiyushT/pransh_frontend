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
    console.log("Filters already loaded, using cached data");
    return;
  }

  console.log("Initializing filter data from Sanity...");
  isLoadingFilters.set(true);
  filtersError.set(null);

  try {
    // Always try to use Sanity data first
    console.log("Fetching categories from Sanity...");
    const categoriesData = await getCategories();
    console.log(`Fetched ${categoriesData.length} categories from Sanity`);

    console.log("Fetching colors from Sanity...");
    const colorsData = await getColors();
    console.log(`Fetched ${colorsData.length} colors from Sanity`);

    console.log("Fetching sizes from Sanity...");
    const sizesData = await getSizes();
    console.log(`Fetched ${sizesData.length} sizes from Sanity`);

    // Update the stores with the data
    categoriesStore.set(categoriesData);
    colorsStore.set(colorsData);
    sizesStore.set(sizesData);

    // Mark as loaded so we don't load again
    filtersLoaded = true;
    console.log("Sanity filter data successfully loaded and cached");

  } catch (error) {
    console.error('Error loading filter data from Sanity:', error);
    filtersError.set('Failed to load filter data. Using fallback data.');

    // Import and use mock data as fallback
    console.log("Falling back to mock data...");
    const { getCategories: getMockCategories,
            getColors: getMockColors,
            getSizes: getMockSizes } = await import('$lib/utils/data');

    categoriesStore.set(getMockCategories());
    colorsStore.set(getMockColors());
    sizesStore.set(getMockSizes());
    console.log("Fallback mock data loaded");
  } finally {
    isLoadingFilters.set(false);
  }
}

// Initialize filter data on import
initializeFilterData();
