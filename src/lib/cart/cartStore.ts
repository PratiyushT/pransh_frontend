import { writable, derived, get } from 'svelte/store';
import type { CartItem } from '$lib/types';
import { browser } from '$app/environment';
import { getSession, loadUserProfile } from '$lib/auth/auth';
import { supabase } from '$lib/auth/client';
import { validateCartItem, validateCartItems } from './cartValidation';

// Constants for cart management
const CART_STORAGE_KEY = 'pransh_cart';
const CART_SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const SYNC_INTERVAL = 60 * 1000; // 1 minute in milliseconds

// Storing the last synced state to avoid unnecessary Supabase operations
let lastSyncedCartHash = '';
let syncTimer: ReturnType<typeof setInterval> | null = null;

// Internal flag to track if user is authenticated
let isAuthenticated = false;
let profileId: number | null = null;

// Loading state for cart operations
export const cartLoading = writable(true);
export const cartError = writable<string | null>(null);
export const cartSyncing = writable(false);
export const cartValidating = writable(false);

// Main cart store
export const cart = writable<CartItem[]>([]);

// Derived stores for UI
export const cartCount = derived(cart, ($cart) =>
  Array.isArray($cart) ? $cart.reduce((total, item) => total + (item.quantity || 0), 0) : 0
);

export const cartEmpty = derived(cart, ($cart) => !$cart || $cart.length === 0);

/**
 * Calculate a simple hash of the cart for comparison
 */
function calculateCartHash(cartItems: CartItem[]): string {
  return JSON.stringify(cartItems.map(item => ({
    pid: item.productId,
    vid: item.variantId,
    qty: item.quantity
  })).sort((a, b) => a.pid.localeCompare(b.pid) || a.vid.localeCompare(b.vid)));
}

/**
 * Get the timestamp of when the cart was last used
 */
function getCartTimestamp(): number {
  if (!browser) return 0;

  try {
    const timestamp = localStorage.getItem(`${CART_STORAGE_KEY}_timestamp`);
    return timestamp ? parseInt(timestamp, 10) : 0;
  } catch (e) {
    console.error('Error getting cart timestamp:', e);
    return 0;
  }
}

/**
 * Update the timestamp of the cart to prevent expiration
 */
function updateCartTimestamp(): void {
  if (!browser) return;

  try {
    localStorage.setItem(`${CART_STORAGE_KEY}_timestamp`, Date.now().toString());
  } catch (e) {
    console.error('Error updating cart timestamp:', e);
  }
}

/**
 * Check if the cart has expired based on inactivity
 */
function hasCartExpired(): boolean {
  const timestamp = getCartTimestamp();
  return timestamp > 0 && Date.now() - timestamp > CART_SESSION_EXPIRY;
}

/**
 * Load the guest cart from localStorage
 */
async function loadGuestCart(): Promise<CartItem[]> {
  if (!browser) return [];

  try {
    // Check for expired cart
    if (hasCartExpired()) {
      console.log('Cart has expired, clearing local storage');
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(`${CART_STORAGE_KEY}_timestamp`);
      return [];
    }

    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return [];

    const parsedCart = JSON.parse(storedCart);
    if (!Array.isArray(parsedCart)) return [];

    // Filter out invalid items
    const validItems = parsedCart.filter(item =>
      item &&
      typeof item.productId === 'string' &&
      typeof item.variantId === 'string' &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
    );

    // Update the timestamp since we're accessing the cart
    updateCartTimestamp();

    return validItems;
  } catch (e) {
    console.error('Error loading guest cart:', e);
    return [];
  }
}

/**
 * Save the guest cart to localStorage
 */
function saveGuestCart(cartItems: CartItem[]): void {
  if (!browser) return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    updateCartTimestamp();
  } catch (e) {
    console.error('Error saving guest cart:', e);
  }
}

/**
 * Load the user cart from Supabase
 */
async function loadUserCart(): Promise<CartItem[]> {
  if (!isAuthenticated || !profileId) return [];

  try {
    // Fetch the user's cart items
    const { data, error } = await supabase
      .from('user_carts')
      .select('product_id, variant_id, quantity')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error loading cart from Supabase:', error);
      cartError.set('Failed to load your cart. Please try again.');
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convert the database format to CartItem format
    return data.map(item => ({
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity
    }));
  } catch (error) {
    console.error('Failed to load cart from Supabase:', error);
    cartError.set('Failed to load your cart. Please try again.');
    return [];
  }
}

/**
 * Save a single cart item to Supabase
 */
async function saveItemToSupabase(item: CartItem): Promise<boolean> {
  if (!isAuthenticated || !profileId) return false;

  try {
    // Check if the item already exists
    const { data: existingItems, error: fetchError } = await supabase
      .from('user_carts')
      .select('id, quantity')
      .eq('profile_id', profileId)
      .eq('variant_id', item.variantId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // If error is not "no rows returned" then it's a real error
      console.error('Error checking existing cart item:', fetchError);
      return false;
    }

    if (existingItems) {
      // Item exists, update quantity if different
      if (existingItems.quantity !== item.quantity) {
        const { error: updateError } = await supabase
          .from('user_carts')
          .update({ quantity: item.quantity })
          .eq('id', existingItems.id);

        if (updateError) {
          console.error('Error updating cart item:', updateError);
          return false;
        }
      }
      return true;
    } else {
      // Item doesn't exist, insert new
      const { error: insertError } = await supabase
        .from('user_carts')
        .insert([{
          profile_id: profileId,
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity
        }]);

      if (insertError) {
        console.error('Error inserting cart item:', insertError);
        return false;
      }
      return true;
    }
  } catch (error) {
    console.error('Error saving item to Supabase:', error);
    return false;
  }
}

/**
 * Remove a cart item from Supabase
 */
async function removeItemFromSupabase(variantId: string): Promise<boolean> {
  if (!isAuthenticated || !profileId) return false;

  try {
    const { error } = await supabase
      .from('user_carts')
      .delete()
      .eq('profile_id', profileId)
      .eq('variant_id', variantId);

    if (error) {
      console.error('Error removing cart item from Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error removing cart item from Supabase:', error);
    return false;
  }
}

/**
 * Synchronize the entire cart to Supabase
 */
async function syncCartToSupabase(cartItems: CartItem[]): Promise<boolean> {
  if (!isAuthenticated || !profileId) return false;

  cartSyncing.set(true);

  try {
    // Get current cart hash
    const currentHash = calculateCartHash(cartItems);

    // Skip if nothing changed
    if (currentHash === lastSyncedCartHash) {
      cartSyncing.set(false);
      return true;
    }

    // Get existing items from Supabase
    const { data: existingItems, error: fetchError } = await supabase
      .from('user_carts')
      .select('id, variant_id, quantity')
      .eq('profile_id', profileId);

    if (fetchError) {
      console.error('Error fetching existing cart items:', fetchError);
      cartSyncing.set(false);
      return false;
    }

    // Create a map of existing items by variant_id
    const existingItemMap = new Map();
    if (existingItems) {
      existingItems.forEach(item => {
        existingItemMap.set(item.variant_id, item);
      });
    }

    // Process each cart item
    const operations: Promise<any>[] = [];

    // Process updates and inserts
    for (const item of cartItems) {
      const existingItem = existingItemMap.get(item.variantId);

      if (existingItem) {
        // Update if quantity changed
        if (existingItem.quantity !== item.quantity) {
          operations.push(
            supabase
              .from('user_carts')
              .update({ quantity: item.quantity })
              .eq('id', existingItem.id)
          );
        }
        // Mark as processed
        existingItemMap.delete(item.variantId);
      } else {
        // Insert new item
        operations.push(
          supabase
            .from('user_carts')
            .insert([{
              profile_id: profileId,
              product_id: item.productId,
              variant_id: item.variantId,
              quantity: item.quantity
            }])
        );
      }
    }

    // Delete items not in current cart
    if (existingItemMap.size > 0) {
      const idsToDelete = Array.from(existingItemMap.values()).map(item => item.id);
      if (idsToDelete.length > 0) {
        operations.push(
          supabase
            .from('user_carts')
            .delete()
            .in('id', idsToDelete)
        );
      }
    }

    // Execute all operations
    if (operations.length > 0) {
      const results = await Promise.allSettled(operations);

      // Check for errors
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);

      if (errors.length > 0) {
        console.error('Some cart sync operations failed:', errors);
        cartSyncing.set(false);
        return false;
      }
    }

    // Update last synced hash
    lastSyncedCartHash = currentHash;
    cartSyncing.set(false);
    return true;
  } catch (error) {
    console.error('Error syncing cart to Supabase:', error);
    cartSyncing.set(false);
    return false;
  }
}

/**
 * Initialize the cart system and load the appropriate cart
 */
export async function initializeCart(): Promise<void> {
  cartLoading.set(true);
  cartError.set(null);

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
        const userCart = await loadUserCart();

        // Check if we have a guest cart to merge
        const guestCart = await loadGuestCart();

        if (guestCart.length > 0) {
          // Merge guest cart with user cart
          const mergedCart = mergeGuestAndUserCart(guestCart, userCart);

          // Validate the merged cart
          cartValidating.set(true);
          const validatedCart = await validateCartItems(mergedCart);
          cartValidating.set(false);

          // Update local cart
          cart.set(validatedCart);

          // Sync to Supabase
          await syncCartToSupabase(validatedCart);

          // Clear guest cart after successful merge
          if (browser) {
            localStorage.removeItem(CART_STORAGE_KEY);
          }
        } else {
          // Validate the user cart
          cartValidating.set(true);
          const validatedCart = await validateCartItems(userCart);
          cartValidating.set(false);

          // Update local cart
          cart.set(validatedCart);
        }

        // Start auto-sync timer
        startAutoSync();
      } else {
        // User is authenticated but no profile found, treat as guest
        const guestCart = await loadGuestCart();

        // Validate guest cart
        cartValidating.set(true);
        const validatedCart = await validateCartItems(guestCart);
        cartValidating.set(false);

        // Set the cart
        cart.set(validatedCart);
      }
    } else {
      // User is not authenticated, load guest cart
      const guestCart = await loadGuestCart();

      // Validate guest cart
      cartValidating.set(true);
      const validatedCart = await validateCartItems(guestCart);
      cartValidating.set(false);

      // Set the cart
      cart.set(validatedCart);
    }
  } catch (error) {
    console.error('Error initializing cart:', error);
    cartError.set('Failed to initialize your cart. Please refresh the page.');
  } finally {
    cartLoading.set(false);
  }
}

/**
 * Merge guest and user carts
 */
function mergeGuestAndUserCart(guestCart: CartItem[], userCart: CartItem[]): CartItem[] {
  const mergedItems = [...userCart];
  const userVariantIds = new Set(userCart.map(item => item.variantId));

  for (const guestItem of guestCart) {
    const existingItemIndex = mergedItems.findIndex(
      item => item.variantId === guestItem.variantId
    );

    if (existingItemIndex >= 0) {
      // Item exists in user cart, use the higher quantity
      mergedItems[existingItemIndex].quantity = Math.max(
        mergedItems[existingItemIndex].quantity,
        guestItem.quantity
      );
    } else {
      // Item doesn't exist in user cart, add it
      mergedItems.push(guestItem);
    }
  }

  return mergedItems;
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
      const currentCart = get(cart);
      const currentHash = calculateCartHash(currentCart);

      // Only sync if cart has changed
      if (currentHash !== lastSyncedCartHash) {
        syncCartToSupabase(currentCart).catch(err => {
          console.error('Auto-sync failed:', err);
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
        // Get current guest cart
        const currentCart = get(cart);

        // Get server cart
        const serverCart = await loadUserCart();

        // Merge carts with server cart taking priority
        const mergedCart = mergeGuestAndUserCart(currentCart, serverCart);

        // Validate the merged cart
        cartValidating.set(true);
        const validatedCart = await validateCartItems(mergedCart);
        cartValidating.set(false);

        // Update local cart
        cart.set(validatedCart);

        // Sync to server
        await syncCartToSupabase(validatedCart);

        // Clear guest cart
        if (browser) {
          localStorage.removeItem(CART_STORAGE_KEY);
        }

        // Start auto-sync
        startAutoSync();
      }
    }
  } catch (error) {
    console.error('Error handling user login:', error);
    cartError.set('Failed to sync your cart after login. Please refresh the page.');
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
  lastSyncedCartHash = '';

  // Get current cart and save as guest cart
  const currentCart = get(cart);
  saveGuestCart(currentCart);
}

/**
 * Add an item to the cart
 */
export async function addToCart(productId: string, variantId: string, quantity: number = 1): Promise<boolean> {
  if (quantity <= 0) return false;

  try {
    cartError.set(null);

    // Create new cart item
    const newItem = { productId, variantId, quantity };

    // Validate the item with Sanity
    cartValidating.set(true);
    const isValid = await validateCartItem(newItem);
    cartValidating.set(false);

    if (!isValid) {
      cartError.set('This item is not available or out of stock.');
      return false;
    }

    // Update cart store
    cart.update(items => {
      const existingIndex = items.findIndex(
        item => item.productId === productId && item.variantId === variantId
      );

      if (existingIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...items];
        updatedItems[existingIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...items, newItem];
      }
    });

    // Get updated cart
    const updatedCart = get(cart);

    // Sync to appropriate storage
    if (isAuthenticated && profileId) {
      const itemToSync = updatedCart.find(
        item => item.productId === productId && item.variantId === variantId
      );

      if (itemToSync) {
        await saveItemToSupabase(itemToSync);
        lastSyncedCartHash = calculateCartHash(updatedCart);
      }
    } else {
      saveGuestCart(updatedCart);
    }

    return true;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    cartError.set('Failed to add item to cart. Please try again.');
    return false;
  }
}

/**
 * Remove an item from the cart
 */
export async function removeFromCart(productId: string, variantId: string): Promise<boolean> {
  try {
    cartError.set(null);

    // Update cart store
    cart.update(items =>
      items.filter(item => !(item.productId === productId && item.variantId === variantId))
    );

    // Get updated cart
    const updatedCart = get(cart);

    // Sync to appropriate storage
    if (isAuthenticated && profileId) {
      await removeItemFromSupabase(variantId);
      lastSyncedCartHash = calculateCartHash(updatedCart);
    } else {
      saveGuestCart(updatedCart);
    }

    return true;
  } catch (error) {
    console.error('Error removing item from cart:', error);
    cartError.set('Failed to remove item from cart. Please try again.');
    return false;
  }
}

/**
 * Update the quantity of an item in the cart
 */
export async function updateCartItemQuantity(
  productId: string,
  variantId: string,
  quantity: number
): Promise<boolean> {
  if (quantity <= 0) {
    return removeFromCart(productId, variantId);
  }

  try {
    cartError.set(null);

    // Create updated item
    const updatedItem = { productId, variantId, quantity };

    // Validate the updated item
    cartValidating.set(true);
    const isValid = await validateCartItem(updatedItem);
    cartValidating.set(false);

    if (!isValid) {
      cartError.set('This item is not available in the requested quantity.');
      return false;
    }

    // Update cart store
    cart.update(items => {
      const existingIndex = items.findIndex(
        item => item.productId === productId && item.variantId === variantId
      );

      if (existingIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...items];
        updatedItems[existingIndex].quantity = quantity;
        return updatedItems;
      } else {
        // Item doesn't exist, don't change anything
        return items;
      }
    });

    // Get updated cart
    const updatedCart = get(cart);

    // Sync to appropriate storage
    if (isAuthenticated && profileId) {
      const itemToSync = updatedCart.find(
        item => item.productId === productId && item.variantId === variantId
      );

      if (itemToSync) {
        await saveItemToSupabase(itemToSync);
        lastSyncedCartHash = calculateCartHash(updatedCart);
      }
    } else {
      saveGuestCart(updatedCart);
    }

    return true;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    cartError.set('Failed to update item quantity. Please try again.');
    return false;
  }
}

/**
 * Clear the entire cart
 */
export async function clearCart(): Promise<boolean> {
  try {
    cartError.set(null);

    // Clear the cart store
    cart.set([]);

    // Sync to appropriate storage
    if (isAuthenticated && profileId) {
      // Delete all items for this user
      const { error } = await supabase
        .from('user_carts')
        .delete()
        .eq('profile_id', profileId);

      if (error) {
        console.error('Error clearing cart in Supabase:', error);
        return false;
      }

      // Reset last synced hash
      lastSyncedCartHash = '';
    } else {
      // Clear guest cart
      if (browser) {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }

    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    cartError.set('Failed to clear cart. Please try again.');
    return false;
  }
}

/**
 * Validate all items in the cart before checkout
 */
export async function validateCartForCheckout(): Promise<{ valid: boolean; invalidItems: CartItem[] }> {
  try {
    cartValidating.set(true);
    cartError.set(null);

    // Get current cart
    const currentCart = get(cart);

    // Validate all items
    const result = await validateCartItems(currentCart, true);

    // Find invalid items
    const invalidItems = currentCart.filter(item =>
      !result.some(validItem =>
        validItem.productId === item.productId &&
        validItem.variantId === item.variantId
      )
    );

    // Update cart with only valid items
    if (invalidItems.length > 0) {
      cart.set(result);

      // Sync to appropriate storage
      if (isAuthenticated && profileId) {
        await syncCartToSupabase(result);
      } else {
        saveGuestCart(result);
      }

      cartError.set(`${invalidItems.length} item(s) were removed from your cart because they are no longer available.`);
    }

    cartValidating.set(false);

    return {
      valid: invalidItems.length === 0,
      invalidItems
    };
  } catch (error) {
    console.error('Error validating cart for checkout:', error);
    cartError.set('Failed to validate cart for checkout. Please try again.');
    cartValidating.set(false);

    return {
      valid: false,
      invalidItems: []
    };
  }
}

// Subscribe to cart changes to update localStorage for guest users
if (browser) {
  cart.subscribe(items => {
    if (!isAuthenticated) {
      saveGuestCart(items);
    }
  });
}
