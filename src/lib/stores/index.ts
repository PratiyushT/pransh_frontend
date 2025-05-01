import { writable, derived, get } from 'svelte/store';
import type { Product, CartItem } from '$lib/types';
import { browser } from '$app/environment';

// Loading state
export const isLoading = writable(true);

// Menu state
export const isMenuOpen = writable(false);

//
// CART STORE
//

// Defensive initialization for cart
let initialCart: CartItem[] = [];
if (browser) {
  try {
    const rawCart = localStorage.getItem('cart');
    if (rawCart) {
      const parsed = JSON.parse(rawCart);
      if (Array.isArray(parsed)) {
        initialCart = parsed.filter(
          (item) =>
            item &&
            typeof item.productId === 'string' &&
            typeof item.variantId === 'string' &&
            typeof item.quantity === 'number'
        );
      }
    }
  } catch (e) {
    initialCart = [];
  }
}

// Cart store (always an array)
export const cart = writable<CartItem[]>(initialCart);

// Initialize cart from localStorage on client-side
if (browser) {
  try {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      if (Array.isArray(parsedCart)) {
        cart.set(
          parsedCart.filter(
            (item) =>
              item &&
              typeof item.productId === 'string' &&
              typeof item.variantId === 'string' &&
              typeof item.quantity === 'number'
          )
        );
      }
    }
  } catch (e) {
    console.error('Error loading cart from localStorage:', e);
  }
}

// Persist cart to localStorage when it changes
cart.subscribe((items) => {
  if (browser && Array.isArray(items)) {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }
});

// Create a store for saved cart items
export const savedCart = writable<CartItem[]>([]);

// Auto update localStorage on savedCart change
if (browser) {
  savedCart.subscribe((items) => {
    if (Array.isArray(items) && items.length > 0) {
      try {
        localStorage.setItem('savedCart', JSON.stringify(items));
      } catch (e) {
        console.error('Error saving savedCart to localStorage:', e);
      }
    } else {
      try {
        localStorage.removeItem('savedCart');
      } catch (e) {
        console.error('Error removing savedCart from localStorage:', e);
      }
    }
  });

  // Initialize savedCart from localStorage if it exists
  try {
    const savedCartData = localStorage.getItem('savedCart');
    if (savedCartData) {
      const parsed = JSON.parse(savedCartData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        savedCart.set(
          parsed.filter(
            (item) =>
              item &&
              typeof item.productId === 'string' &&
              typeof item.variantId === 'string' &&
              typeof item.quantity === 'number'
          )
        );
      }
    }
  } catch (e) {
    console.error('Error loading saved cart:', e);
  }
}

// Cart count (safe)
export const cartCount = derived(cart, ($cart) =>
  Array.isArray($cart)
    ? $cart.reduce(
        (acc, item) =>
          item && typeof item.quantity === 'number' ? acc + item.quantity : acc,
        0
      )
    : 0
);

// Saved cart count (for UI indicator)
export const savedCartCount = derived(savedCart, ($savedCart) =>
  Array.isArray($savedCart)
    ? $savedCart.reduce(
        (acc, item) =>
          item && typeof item.quantity === 'number' ? acc + item.quantity : acc,
        0
      )
    : 0
);

// Add to cart
export const addToCart = (
  productId: string,
  variantId: string,
  quantity: number = 1
) => {
  if (
    typeof productId !== 'string' ||
    typeof variantId !== 'string' ||
    typeof quantity !== 'number' ||
    quantity < 1
  ) {
    return;
  }
  cart.update((items) => {
    if (!Array.isArray(items)) items = [];
    const existingIndex = items.findIndex(
      (item) =>
        item &&
        item.productId === productId &&
        item.variantId === variantId
    );

    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity =
        (typeof updatedItems[existingIndex].quantity === 'number'
          ? updatedItems[existingIndex].quantity
          : 0) + quantity;
      return updatedItems;
    }

    return [
      ...items,
      {
        productId,
        variantId,
        quantity,
      },
    ];
  });
};

// Remove from cart
export const removeFromCart = (productId: string, variantId: string) => {
  if (typeof productId !== 'string' || typeof variantId !== 'string') return;
  cart.update((items) =>
    Array.isArray(items)
      ? items.filter(
          (item) =>
            !(
              item &&
              item.productId === productId &&
              item.variantId === variantId
            )
        )
      : []
  );
};

// Update cart item quantity
export const updateCartItemQuantity = (
  productId: string,
  variantId: string,
  quantity: number
) => {
  if (
    typeof productId !== 'string' ||
    typeof variantId !== 'string' ||
    typeof quantity !== 'number' ||
    quantity < 1
  )
    return;
  cart.update((items) =>
    Array.isArray(items)
      ? items.map((item) =>
          item &&
          item.productId === productId &&
          item.variantId === variantId
            ? { ...item, quantity }
            : item
        )
      : []
  );
};

// Keep only the most recent cart item (for direct checkout)
export const keepOnlyLastCartItem = () => {
  cart.update((items) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    return [items[items.length - 1]];
  });
};

// Save current cart items and clear cart for direct checkout
export const saveCartAndClearForDirectCheckout = () => {
  const currentCart = get(cart);

  // Only save if there are items
  if (Array.isArray(currentCart) && currentCart.length > 0) {
    // Save a copy to savedCart (in-memory)
    savedCart.set([...currentCart]);

    // Store in localStorage too (as a backup)
    if (browser) {
      try {
        localStorage.setItem('savedCart', JSON.stringify(currentCart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }

    // Now clear the cart
    cart.set([]);
    // Also clear cart from localStorage for consistency
    if (browser) {
      try {
        localStorage.setItem('cart', JSON.stringify([]));
      } catch (error) {
        console.error('Error clearing cart in localStorage:', error);
      }
    }
  }
};

// Restore saved cart items by adding them to the current cart
export const restoreSavedCart = () => {
  let currentSavedCart: CartItem[] = get(savedCart);

  // If savedCart in memory is empty, try localStorage
  if (
    (!Array.isArray(currentSavedCart) || currentSavedCart.length === 0) &&
    browser
  ) {
    try {
      const savedCartData = localStorage.getItem('savedCart');
      if (savedCartData) {
        const parsed = JSON.parse(savedCartData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentSavedCart = parsed.filter(
            (item) =>
              item &&
              typeof item.productId === 'string' &&
              typeof item.variantId === 'string' &&
              typeof item.quantity === 'number'
          );
        }
      }
    } catch (e) {
      console.error('Error loading saved cart from localStorage:', e);
    }
  }

  if (Array.isArray(currentSavedCart) && currentSavedCart.length > 0) {
    // Add all saved items to the current cart
    cart.update((currentItems) => {
      if (!Array.isArray(currentItems)) return [...currentSavedCart];

      // Combine saved items with current cart
      const combinedCart = [...currentItems];

      currentSavedCart.forEach((savedItem) => {
        if (
          savedItem &&
          typeof savedItem.productId === 'string' &&
          typeof savedItem.variantId === 'string'
        ) {
          const existingIndex = combinedCart.findIndex(
            (item) =>
              item &&
              item.productId === savedItem.productId &&
              item.variantId === savedItem.variantId
          );

          if (existingIndex >= 0) {
            // If item exists, add quantities
            combinedCart[existingIndex].quantity =
              (typeof combinedCart[existingIndex].quantity === 'number'
                ? combinedCart[existingIndex].quantity
                : 0) + savedItem.quantity;
          } else {
            // Otherwise add the item
            combinedCart.push(savedItem);
          }
        }
      });

      return combinedCart;
    });

    // Clear the saved cart after restoring
    clearSavedCart();
  }
};

// Clear saved cart
export const clearSavedCart = () => {
  savedCart.set([]);
  if (browser) {
    try {
      localStorage.removeItem('savedCart');
    } catch (e) {
      console.error('Error removing savedCart from localStorage:', e);
    }
  }
};

// Clear cart completely
export const clearCart = () => {
  cart.set([]);
  if (browser) {
    try {
      localStorage.setItem('cart', JSON.stringify([]));
    } catch (e) {
      console.error('Error clearing cart in localStorage:', e);
    }
  }
};

//
// WISHLIST STORE
//

let storedWishlist: string[] = [];
if (browser) {
  try {
    const rawWishlist = localStorage.getItem('wishlist');
    if (rawWishlist) {
      const parsed = JSON.parse(rawWishlist);
      if (Array.isArray(parsed)) {
        storedWishlist = parsed.filter((id) => typeof id === 'string');
      }
    }
  } catch (e) {
    storedWishlist = [];
  }
}

export const wishlist = writable<string[]>(storedWishlist);

// Auto update localStorage on wishlist change and sync to cookies
if (browser) {
  wishlist.subscribe((items) => {
    if (!Array.isArray(items)) items = [];
    try {
      localStorage.setItem('wishlist', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving wishlist to localStorage:', e);
    }

    // Also sync to cookies so server-side functions can access it
    try {
      document.cookie = `wishlist=${encodeURIComponent(
        JSON.stringify(items)
      )}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      console.error('Error syncing wishlist to cookies', e);
    }
  });
}

/**
 * Synchronize wishlist from localStorage to cookies.
 * Useful to call on app startup or when you want to ensure cookies are in sync.
 */
export function syncWishlistToCookies() {
  if (!browser) return;
  try {
    const rawWishlist = localStorage.getItem('wishlist');
    if (rawWishlist) {
      const parsed = JSON.parse(rawWishlist);
      if (Array.isArray(parsed)) {
        document.cookie = `wishlist=${encodeURIComponent(
          JSON.stringify(parsed)
        )}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  } catch (e) {
    console.error('Error syncing wishlist to cookies', e);
  }
}

export const wishlistCount = derived(wishlist, ($wishlist) =>
  Array.isArray($wishlist) ? $wishlist.length : 0
);

export const isInWishlist = (productId: string): boolean => {
  if (typeof productId !== 'string') return false;
  const currentWishlist = get(wishlist);
  return Array.isArray(currentWishlist)
    ? currentWishlist.includes(productId)
    : false;
};

export const addToWishlist = (productId: string) => {
  if (typeof productId !== 'string') return;
  wishlist.update((items) => {
    if (!Array.isArray(items)) items = [];
    if (!items.includes(productId)) {
      return [...items, productId];
    }
    return items;
  });
};

export const removeFromWishlist = (productId: string) => {
  if (typeof productId !== 'string') return;
  wishlist.update((items) =>
    Array.isArray(items) ? items.filter((id) => id !== productId) : []
  );
};

export const toggleWishlist = (productId: string) => {
  if (typeof productId !== 'string') return;
  if (isInWishlist(productId)) {
    removeFromWishlist(productId);
  } else {
    addToWishlist(productId);
  }
};

//
// SEARCH STORE
//

// isSearchOpen controls whether the search modal is open
export const isSearchOpen = writable(false);

// searchQuery stores the current search term
export const searchQuery = writable('');

// Function to open search modal
export const openSearch = () => {
  isSearchOpen.set(true);
  // Prevent scrolling when modal is open
  if (browser && typeof document !== 'undefined' && document.body) {
    document.body.style.overflow = 'hidden';
  }
};

// Function to close search modal
export const closeSearch = () => {
  isSearchOpen.set(false);
  // Re-enable scrolling when modal closes
  if (browser && typeof document !== 'undefined' && document.body) {
    document.body.style.overflow = '';
  }
};

// Function to perform search and navigate to shop page
export const performSearch = (
  query: string,
  filters?: {
    categories?: string[];
    colors?: string[];
    sizes?: string[];
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    featured?: boolean; // Add featured filter type
  }
) => {
  searchQuery.set(query);

  // Navigate to shop page with search query and optional filters
  if (browser) {
    const params = new URLSearchParams();

    // Add search query if exists
    if (typeof query === 'string' && query) {
      params.set('search', query);
    }

    // Add any additional filters if provided
    if (filters && typeof filters === 'object') {
      if (
        Array.isArray(filters.categories) &&
        filters.categories.length > 0
      ) {
        params.set('category', filters.categories.join(','));
      }

      if (Array.isArray(filters.colors) && filters.colors.length > 0) {
        params.set('color', filters.colors.join(','));
      }

      if (Array.isArray(filters.sizes) && filters.sizes.length > 0) {
        params.set('size', filters.sizes.join(','));
      }

      if (
        typeof filters.minPrice === 'number' &&
        !isNaN(filters.minPrice)
      ) {
        params.set('minPrice', filters.minPrice.toString());
      }

      if (
        typeof filters.maxPrice === 'number' &&
        !isNaN(filters.maxPrice)
      ) {
        params.set('maxPrice', filters.maxPrice.toString());
      }

      if (typeof filters.sort === 'string' && filters.sort) {
        params.set('sort', filters.sort);
      }

      // Add featured flag if true
      if (filters.featured === true) {
        params.set('featured', 'true');
      }
    }

    // Build the URL with all parameters
    const url = `/shop${params.toString() ? `?${params.toString()}` : ''}`;
    window.location.href = url;
  }

  // Close the search modal
  closeSearch();
};
