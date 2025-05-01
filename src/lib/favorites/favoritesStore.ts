import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { getSession, loadUserProfile } from '$lib/auth/auth';
import { supabase } from '$lib/auth/client';
import { validateProduct } from './favoritesValidation';

// Constants
const FAVORITES_STORAGE_KEY = 'pransh_favorites';
const FAVORITES_SESSION_EXPIRY = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
const SYNC_INTERVAL = 60 * 1000; // 1 minute in milliseconds

// Store the last synced state to avoid unnecessary operations
let lastSyncedFavoritesHash = '';
let syncTimer: ReturnType<typeof setInterval> | null = null;

// Internal authentication flags
let isAuthenticated = false;
let profileId: number | null = null;

// Loading and error states
export const favoritesLoading = writable(true);
export const favoritesError = writable<string | null>(null);
export const favoritesSyncing = writable(false);
export const favoritesValidating = writable(false);

// Main favorites store - contains an array of product IDs
export const favorites = writable<string[]>([]);

// Derived store for counting favorites
export const favoritesCount = derived(favorites, ($favorites) =>
  Array.isArray($favorites) ? $favorites.length : 0
);

// Derived store for checking if favorites is empty
export const favoritesEmpty = derived(favorites, ($favorites) =>
  !$favorites || $favorites.length === 0
);

/**
 * Calculate a simple hash of favorites for comparison
 */
function calculateFavoritesHash(favorites: string[]): string {
  return JSON.stringify([...favorites].sort());
}

/**
 * Get the timestamp of when favorites were last accessed
 */
function getFavoritesTimestamp(): number {
  if (!browser) return 0;

  try {
    const timestamp = localStorage.getItem(`${FAVORITES_STORAGE_KEY}_timestamp`);
    return timestamp ? parseInt(timestamp, 10) : 0;
  } catch (e) {
    console.error('Error getting favorites timestamp:', e);
    return 0;
  }
}

/**
 * Update the timestamp of favorites
 */
function updateFavoritesTimestamp(): void {
  if (!browser) return;

  try {
    localStorage.setItem(`${FAVORITES_STORAGE_KEY}_timestamp`, Date.now().toString());
  } catch (e) {
    console.error('Error updating favorites timestamp:', e);
  }
}

/**
 * Check if favorites have expired
 */
function haveFavoritesExpired(): boolean {
  const timestamp = getFavoritesTimestamp();
  return timestamp > 0 && Date.now() - timestamp > FAVORITES_SESSION_EXPIRY;
}

/**
 * Load guest favorites from localStorage
 */
async function loadGuestFavorites(): Promise<string[]> {
  if (!browser) return [];

  try {
    // Check for expired favorites
    if (haveFavoritesExpired()) {
      console.log('Favorites have expired, clearing local storage');
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      localStorage.removeItem(`${FAVORITES_STORAGE_KEY}_timestamp`);
      return [];
    }

    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!storedFavorites) return [];

    const parsedFavorites = JSON.parse(storedFavorites);
    if (!Array.isArray(parsedFavorites)) return [];

    // Filter out non-string values
    const validFavorites = parsedFavorites.filter(item => typeof item === 'string');

    // Update the timestamp
    updateFavoritesTimestamp();

    return validFavorites;
  } catch (e) {
    console.error('Error loading guest favorites:', e);
    return [];
  }
}

/**
 * Save guest favorites to localStorage
 */
function saveGuestFavorites(favoriteItems: string[]): void {
  if (!browser) return;

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteItems));
    updateFavoritesTimestamp();
  } catch (e) {
    console.error('Error saving guest favorites:', e);
  }
}

/**
 * Load user favorites from Supabase
 */
async function loadUserFavorites(): Promise<string[]> {
  if (!isAuthenticated || !profileId) return [];

  try {
    // Fetch the user's favorites
    const { data, error } = await supabase
      .from('user_favorites')
      .select('product_id')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error loading favorites from Supabase:', error);
      favoritesError.set('Failed to load your favorites. Please try again.');
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Extract product IDs
    return data.map(item => item.product_id);
  } catch (error) {
    console.error('Failed to load favorites from Supabase:', error);
    favoritesError.set('Failed to load your favorites. Please try again.');
    return [];
  }
}

/**
 * Add a favorite to Supabase
 */
async function addFavoriteToSupabase(productId: string): Promise<boolean> {
  if (!isAuthenticated || !profileId) return false;

  try {
    // Check if the favorite already exists
    const { data: existingFavorite, error: fetchError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('profile_id', profileId)
      .eq('product_id', productId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // If error is not "no rows returned" then it's a real error
      console.error('Error checking existing favorite:', fetchError);
      return false;
    }

    // Don't add if it already exists
    if (existingFavorite) {
      return true;
    }

    // Insert new favorite
    const { error: insertError } = await supabase
      .from('user_favorites')
      .insert([{
        profile_id: profileId,
        product_id: productId
      }]);

    if (insertError) {
      console.error('Error adding favorite to Supabase:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding favorite to Supabase:', error);
    return false;
  }
}

/**
 * Remove a favorite from Supabase
 */
async function removeFavoriteFromSupabase(productId: string): Promise<boolean> {
  if (!isAuthenticated || !profileId) return false;

  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('profile_id', profileId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing favorite from Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing favorite from Supabase:', error);
    return false;
  }
}

/**
 * Synchronize favorites to Supabase
 */
async function syncFavoritesToSupabase(favoriteItems: string[]): Promise<boolean> {
  if (!isAuthenticated || !profileId) return false;

  favoritesSyncing.set(true);

  try {
    // Get current favorites hash
    const currentHash = calculateFavoritesHash(favoriteItems);

    // Skip if nothing changed
    if (currentHash === lastSyncedFavoritesHash) {
      favoritesSyncing.set(false);
      return true;
    }

    // Get existing favorites from Supabase
    const { data: existingFavorites, error: fetchError } = await supabase
      .from('user_favorites')
      .select('id, product_id')
      .eq('profile_id', profileId);

    if (fetchError) {
      console.error('Error fetching existing favorites:', fetchError);
      favoritesSyncing.set(false);
      return false;
    }

    // Create a map of existing favorites by product_id
    const existingFavoritesMap = new Map();
    if (existingFavorites) {
      existingFavorites.forEach(item => {
        existingFavoritesMap.set(item.product_id, item);
      });
    }

    // Create a set of current favorites for faster lookups
    const currentFavoritesSet = new Set(favoriteItems);

    // Process favorites to add
    const toAdd = favoriteItems.filter(productId => !existingFavoritesMap.has(productId));

    // Process favorites to remove
    const toRemove = existingFavorites
      ? existingFavorites
          .filter(item => !currentFavoritesSet.has(item.product_id))
          .map(item => item.id)
      : [];

    // Batch operations
    const operations: Promise<any>[] = [];

    // Add new favorites
    if (toAdd.length > 0) {
      const addRows = toAdd.map(productId => ({
        profile_id: profileId,
        product_id: productId
      }));

      operations.push(
        supabase
          .from('user_favorites')
          .insert(addRows)
      );
    }

    // Remove old favorites
    if (toRemove.length > 0) {
      operations.push(
        supabase
          .from('user_favorites')
          .delete()
          .in('id', toRemove)
      );
    }

    // Execute all operations
    if (operations.length > 0) {
      const results = await Promise.allSettled(operations);

      // Check for errors
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);

      if (errors.length > 0) {
        console.error('Some favorites sync operations failed:', errors);
        favoritesSyncing.set(false);
        return false;
      }
    }

    // Update last synced hash
    lastSyncedFavoritesHash = currentHash;
    favoritesSyncing.set(false);
    return true;
  } catch (error) {
    console.error('Error syncing favorites to Supabase:', error);
    favoritesSyncing.set(false);
    return false;
  }
}

/**
 * Initialize the favorites
 */
export async function initializeFavorites(): Promise<void> {
  favoritesLoading.set(true);
  favoritesError.set(null);

  try {
    // Check authentication status
    const session = await getSession();
    isAuthenticated = !!session?.user;

    if (isAuthenticated) {
      // Get user profile
      const profile = await loadUserProfile();
      profileId = profile?.id || null;

      if (profileId) {
        // User is authenticated, load from Supabase
        const userFavorites = await loadUserFavorites();

        // Check if we have guest favorites to merge
        const guestFavorites = await loadGuestFavorites();

        if (guestFavorites.length > 0) {
          // Merge favorites
          const mergedFavorites = [...new Set([...userFavorites, ...guestFavorites])];

          // Validate the merged favorites
          favoritesValidating.set(true);
          const validatedFavorites = await validateFavorites(mergedFavorites);
          favoritesValidating.set(false);

          // Update local favorites
          favorites.set(validatedFavorites);

          // Sync to Supabase
          await syncFavoritesToSupabase(validatedFavorites);

          // Clear guest favorites after successful merge
          if (browser) {
            localStorage.removeItem(FAVORITES_STORAGE_KEY);
            localStorage.removeItem(`${FAVORITES_STORAGE_KEY}_timestamp`);
          }
        } else {
          // Validate the user favorites
          favoritesValidating.set(true);
          const validatedFavorites = await validateFavorites(userFavorites);
          favoritesValidating.set(false);

          // Update local favorites
          favorites.set(validatedFavorites);
        }

        // Start auto-sync timer
        startAutoSync();
      } else {
        // User is authenticated but no profile found, treat as guest
        const guestFavorites = await loadGuestFavorites();

        // Validate guest favorites
        favoritesValidating.set(true);
        const validatedFavorites = await validateFavorites(guestFavorites);
        favoritesValidating.set(false);

        // Set the favorites
        favorites.set(validatedFavorites);
      }
    } else {
      // User is not authenticated, load guest favorites
      const guestFavorites = await loadGuestFavorites();

      // Validate guest favorites
      favoritesValidating.set(true);
      const validatedFavorites = await validateFavorites(guestFavorites);
      favoritesValidating.set(false);

      // Set the favorites
      favorites.set(validatedFavorites);
    }
  } catch (error) {
    console.error('Error initializing favorites:', error);
    favoritesError.set('Failed to initialize your favorites. Please refresh the page.');
  } finally {
    favoritesLoading.set(false);
  }
}

/**
 * Validate favorites against Sanity
 */
async function validateFavorites(favoriteItems: string[]): Promise<string[]> {
  if (!favoriteItems || favoriteItems.length === 0) {
    return [];
  }

  try {
    // For each product ID, check if it exists in Sanity
    const validProductIds: string[] = [];

    // Using Promise.allSettled to handle potential errors gracefully
    const validationResults = await Promise.allSettled(
      favoriteItems.map(productId => validateProduct(productId))
    );

    // Process results
    validationResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        validProductIds.push(favoriteItems[index]);
      }
    });

    return validProductIds;
  } catch (error) {
    console.error('Error validating favorites:', error);
    // Return the original list in case of error
    return favoriteItems;
  }
}

/**
 * Start auto-sync timer for authenticated users
 */
function startAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
  }

  if (isAuthenticated && profileId) {
    syncTimer = setInterval(() => {
      const currentFavorites = get(favorites);
      const currentHash = calculateFavoritesHash(currentFavorites);

      // Only sync if favorites have changed
      if (currentHash !== lastSyncedFavoritesHash) {
        syncFavoritesToSupabase(currentFavorites).catch(err => {
          console.error('Auto-sync favorites failed:', err);
        });
      }
    }, SYNC_INTERVAL);
  }
}

/**
 * Stop auto-sync timer
 */
function stopAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

/**
 * Handle user login
 */
export async function handleUserLogin(): Promise<void> {
  try {
    // Get user profile
    const session = await getSession();
    isAuthenticated = !!session?.user;

    if (isAuthenticated) {
      const profile = await loadUserProfile();
      profileId = profile?.id || null;

      if (profileId) {
        // Get current guest favorites
        const currentFavorites = get(favorites);

        // Get server favorites
        const serverFavorites = await loadUserFavorites();

        // Merge favorites
        const mergedFavorites = [...new Set([...currentFavorites, ...serverFavorites])];

        // Validate the merged favorites
        favoritesValidating.set(true);
        const validatedFavorites = await validateFavorites(mergedFavorites);
        favoritesValidating.set(false);

        // Update local favorites
        favorites.set(validatedFavorites);

        // Sync to server
        await syncFavoritesToSupabase(validatedFavorites);

        // Clear guest favorites
        if (browser) {
          localStorage.removeItem(FAVORITES_STORAGE_KEY);
          localStorage.removeItem(`${FAVORITES_STORAGE_KEY}_timestamp`);
        }

        // Start auto-sync
        startAutoSync();
      }
    }
  } catch (error) {
    console.error('Error handling user login for favorites:', error);
    favoritesError.set('Failed to sync your favorites after login. Please refresh the page.');
  }
}

/**
 * Handle user logout
 */
export async function handleUserLogout(): Promise<void> {
  isAuthenticated = false;
  profileId = null;

  // Stop auto-sync
  stopAutoSync();

  // Reset last synced hash
  lastSyncedFavoritesHash = '';

  // Get current favorites and save as guest favorites
  const currentFavorites = get(favorites);
  saveGuestFavorites(currentFavorites);
}

/**
 * Check if a product is in favorites
 */
export function isInFavorites(productId: string): boolean {
  if (typeof productId !== 'string') return false;

  const currentFavorites = get(favorites);
  return Array.isArray(currentFavorites) && currentFavorites.includes(productId);
}

/**
 * Add a product to favorites
 */
export async function addToFavorites(productId: string): Promise<boolean> {
  if (typeof productId !== 'string') return false;

  try {
    favoritesError.set(null);

    // Validate the product exists
    favoritesValidating.set(true);
    const isValid = await validateProduct(productId);
    favoritesValidating.set(false);

    if (!isValid) {
      favoritesError.set('This product could not be added to favorites.');
      return false;
    }

    // Update favorites store
    favorites.update(items => {
      if (!Array.isArray(items)) items = [];
      if (!items.includes(productId)) {
        return [...items, productId];
      }
      return items;
    });

    // Sync to appropriate storage
    if (isAuthenticated && profileId) {
      await addFavoriteToSupabase(productId);
      lastSyncedFavoritesHash = calculateFavoritesHash(get(favorites));
    } else {
      saveGuestFavorites(get(favorites));
    }

    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    favoritesError.set('Failed to add item to favorites. Please try again.');
    return false;
  }
}

/**
 * Remove a product from favorites
 */
export async function removeFromFavorites(productId: string): Promise<boolean> {
  if (typeof productId !== 'string') return false;

  try {
    favoritesError.set(null);

    // Update favorites store
    favorites.update(items =>
      Array.isArray(items) ? items.filter(id => id !== productId) : []
    );

    // Sync to appropriate storage
    if (isAuthenticated && profileId) {
      await removeFavoriteFromSupabase(productId);
      lastSyncedFavoritesHash = calculateFavoritesHash(get(favorites));
    } else {
      saveGuestFavorites(get(favorites));
    }

    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    favoritesError.set('Failed to remove item from favorites. Please try again.');
    return false;
  }
}

/**
 * Toggle a product in favorites
 */
export async function toggleFavorite(productId: string): Promise<boolean> {
  if (typeof productId !== 'string') return false;

  try {
    favoritesError.set(null);

    const isFavorite = isInFavorites(productId);

    if (isFavorite) {
      return await removeFromFavorites(productId);
    } else {
      return await addToFavorites(productId);
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    favoritesError.set('Failed to update favorites. Please try again.');
    return false;
  }
}

/**
 * Clear all favorites
 */
export async function clearFavorites(): Promise<boolean> {
  try {
    favoritesError.set(null);

    // Clear the favorites store
    favorites.set([]);

    // Sync to appropriate storage
    if (isAuthenticated && profileId) {
      // Delete all favorites for this user
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('profile_id', profileId);

      if (error) {
        console.error('Error clearing favorites in Supabase:', error);
        return false;
      }

      // Reset last synced hash
      lastSyncedFavoritesHash = '';
    } else {
      // Clear guest favorites
      if (browser) {
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
        localStorage.removeItem(`${FAVORITES_STORAGE_KEY}_timestamp`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error clearing favorites:', error);
    favoritesError.set('Failed to clear favorites. Please try again.');
    return false;
  }
}

// Subscribe to favorites changes to update localStorage for guest users
if (browser) {
  favorites.subscribe(items => {
    if (!isAuthenticated) {
      saveGuestFavorites(items);
    }
  });
}
