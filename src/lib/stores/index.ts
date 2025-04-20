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

// Load and validate cart from localStorage
let storedCart: CartItem[] = [];

if (browser) {
  const rawCart = localStorage.getItem('cart');
  try {
    const parsed = rawCart ? JSON.parse(rawCart) : [];
    if (Array.isArray(parsed)) {
      storedCart = parsed;
    }
  } catch (e) {
    storedCart = [];
  }
}

// Cart store (always an array)
export const cart = writable<CartItem[]>(storedCart);

// Auto update localStorage on cart change
if (browser) {
  cart.subscribe(items => {
    localStorage.setItem('cart', JSON.stringify(items));
  });
}

// Cart count (safe)
export const cartCount = derived(cart, ($cart) =>
  Array.isArray($cart) ? $cart.reduce((acc, item) => acc + item.quantity, 0) : 0
);

// Add to cart
export const addToCart = (productId: string, variantId: string, quantity: number = 1) => {
  cart.update(items => {
    const existingIndex = items.findIndex(item =>
      item.productId === productId && item.variantId === variantId
    );

    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += quantity;
      return updatedItems;
    }

    return [...items, {
      productId,
      variantId,
      quantity
    }];
  });
};

// Remove from cart
export const removeFromCart = (productId: string, variantId: string) => {
  cart.update(items =>
    items.filter(item => !(item.productId === productId && item.variantId === variantId))
  );
};

// Update cart item quantity
export const updateCartItemQuantity = (productId: string, variantId: string, quantity: number) => {
  cart.update(items =>
    items.map(item =>
      item.productId === productId && item.variantId === variantId
        ? { ...item, quantity }
        : item
    )
  );
};

// Clear cart
export const clearCart = () => {
  cart.set([]);
};

//
// WISHLIST STORE
//

let storedWishlist: string[] = [];

if (browser) {
  const rawWishlist = localStorage.getItem('wishlist');
  try {
    const parsed = rawWishlist ? JSON.parse(rawWishlist) : [];
    if (Array.isArray(parsed)) {
      storedWishlist = parsed;
    }
  } catch (e) {
    storedWishlist = [];
  }
}

export const wishlist = writable<string[]>(storedWishlist);

// Auto update localStorage on wishlist change
if (browser) {
  wishlist.subscribe(items => {
    localStorage.setItem('wishlist', JSON.stringify(items));
  });
}

export const wishlistCount = derived(wishlist, $wishlist => $wishlist.length);

export const isInWishlist = (productId: string): boolean => {
  return get(wishlist).includes(productId);
};

export const addToWishlist = (productId: string) => {
  wishlist.update(items => {
    if (!items.includes(productId)) {
      return [...items, productId];
    }
    return items;
  });
};

export const removeFromWishlist = (productId: string) => {
  wishlist.update(items => items.filter(id => id !== productId));
};

export const toggleWishlist = (productId: string) => {
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
  if (browser) {
    document.body.style.overflow = 'hidden';
  }
};

// Function to close search modal
export const closeSearch = () => {
  isSearchOpen.set(false);
  // Re-enable scrolling when modal closes
  if (browser) {
    document.body.style.overflow = '';
  }
};

// Function to perform search and navigate to shop page
export const performSearch = (query: string, filters?: {
  categories?: string[],
  colors?: string[],
  sizes?: string[],
  minPrice?: number,
  maxPrice?: number,
  sort?: string
}) => {
  searchQuery.set(query);

  // Navigate to shop page with search query and optional filters
  if (browser) {
    const params = new URLSearchParams();

    // Add search query if exists
    if (query) {
      params.set('search', query);
    }

    // Add any additional filters if provided
    if (filters) {
      if (filters.categories && filters.categories.length > 0) {
        params.set('category', filters.categories.join(','));
      }

      if (filters.colors && filters.colors.length > 0) {
        params.set('color', filters.colors.join(','));
      }

      if (filters.sizes && filters.sizes.length > 0) {
        params.set('size', filters.sizes.join(','));
      }

      if (filters.minPrice !== undefined) {
        params.set('minPrice', filters.minPrice.toString());
      }

      if (filters.maxPrice !== undefined) {
        params.set('maxPrice', filters.maxPrice.toString());
      }

      if (filters.sort) {
        params.set('sort', filters.sort);
      }
    }

    // Build the URL with all parameters
    const url = `/shop${params.toString() ? `?${params.toString()}` : ''}`;
    window.location.href = url;
  }

  // Close the search modal
  closeSearch();
};
