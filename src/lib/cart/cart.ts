import { supabase } from '$lib/auth/client';
import type { CartItem } from '$lib/types';
import { getSession } from '$lib/auth/auth';
import { loadUserProfile } from '$lib/auth/auth';

/**
 * Save the current cart to Supabase for the logged-in user
 * @param cartItems The cart items to save
 */
export async function saveCartToSupabase(cartItems: CartItem[]) {
  try {
    // Get the current user session
    const session = await getSession();
    if (!session?.user) {
      console.log('User not logged in, skipping cart save to Supabase');
      return;
    }

    // Get the user's profile to get the profile_id (needed for user_carts table)
    const profile = await loadUserProfile();
    if (!profile || !profile.id) {
      console.error('User profile not found, cannot save cart');
      return;
    }

    const profileId = profile.id;

    // Get existing cart items for this user
    const { data: existingItems, error: fetchError } = await supabase
      .from('user_carts')
      .select('*')
      .eq('profile_id', profileId);

    if (fetchError) {
      console.error('Error fetching existing cart items:', fetchError);
      return;
    }

    // Create a map of existing items by variant_id for easy lookup
    const existingItemMap = new Map();
    if (existingItems) {
      existingItems.forEach(item => {
        existingItemMap.set(item.variant_id, item);
      });
    }

    // Process each cart item
    for (const item of cartItems) {
      const existingItem = existingItemMap.get(item.variantId);

      if (existingItem) {
        // Update existing item if quantity changed
        if (existingItem.quantity !== item.quantity) {
          const { error } = await supabase
            .from('user_carts')
            .update({
              quantity: item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id);

          if (error) {
            console.error(`Error updating cart item ${item.variantId}:`, error);
          }
        }
        // Remove this item from the map to track which ones need to be deleted
        existingItemMap.delete(item.variantId);
      } else {
        // Insert new item
        const { error } = await supabase
          .from('user_carts')
          .insert([{
            profile_id: profileId,
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity
          }]);

        if (error) {
          console.error(`Error inserting cart item ${item.variantId}:`, error);
        }
      }
    }

    // Delete items that are in the database but not in the current cart
    if (existingItemMap.size > 0) {
      const idsToDelete = Array.from(existingItemMap.values()).map(item => item.id);
      const { error } = await supabase
        .from('user_carts')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        console.error('Error deleting removed cart items:', error);
      }
    }

    console.log('Cart saved to Supabase successfully');
  } catch (error) {
    console.error('Failed to save cart to Supabase:', error);
  }
}

/**
 * Load the user's cart from Supabase
 * @returns CartItem[] or null if no cart or user not logged in
 */
export async function loadCartFromSupabase(): Promise<CartItem[] | null> {
  try {
    // Get the current user session
    const session = await getSession();
    if (!session?.user) {
      console.log('User not logged in, cannot load cart from Supabase');
      return null;
    }

    // Get the user's profile to get the profile_id
    const profile = await loadUserProfile();
    if (!profile || !profile.id) {
      console.error('User profile not found, cannot load cart');
      return null;
    }

    const profileId = profile.id;

    // Fetch the user's cart items
    const { data, error } = await supabase
      .from('user_carts')
      .select('product_id, variant_id, quantity')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error loading cart from Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Convert the database format to CartItem format
    return data.map(item => ({
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity
    }));
  } catch (error) {
    console.error('Failed to load cart from Supabase:', error);
    return null;
  }
}
