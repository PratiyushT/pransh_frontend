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

// Cart total price (safe)
export const cartTotal = derived(cart, ($cart) =>
  Array.isArray($cart) ? $cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) : 0
);

// Add to cart
export const addToCart = (product: Product, variantIndex: number, quantity: number = 1) => {
  const variant = product.variants[variantIndex];

  cart.update(items => {
    const existingIndex = items.findIndex(item =>
      item.productId === product._id && item.variantSku === variant.sku
    );

    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += quantity;
      return updatedItems;
    }

    return [...items, {
      productId: product._id,
      variantSku: variant.sku,
      name: product.name,
      price: variant.price,
      size: variant.size,
      color: variant.color,
      quantity,
      image: variant.images?.[0]?.url || '/images/product-placeholder.jpg'
    }];
  });
};

// Remove from cart
export const removeFromCart = (productId: string, variantSku: string) => {
  cart.update(items => items.filter(item =>
    !(item.productId === productId && item.variantSku === variantSku)
  ));
};

// Update cart item quantity
export const updateCartItemQuantity = (productId: string, variantSku: string, quantity: number) => {
  cart.update(items =>
    items.map(item =>
      item.productId === productId && item.variantSku === variantSku
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
