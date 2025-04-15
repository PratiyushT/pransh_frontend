import { writable, derived, get } from 'svelte/store';
import type { Product, CartItem } from '$lib/types';
import { browser } from '$app/environment';

// Loading state
export const isLoading = writable(true);

// Menu state
export const isMenuOpen = writable(false);

// Initialize cart from localStorage if available
const storedCart = browser && localStorage.getItem('cart')
  ? JSON.parse(localStorage.getItem('cart') || '[]')
  : [];

// Cart state
export const cart = writable<CartItem[]>(storedCart);

// Update localStorage when cart changes
if (browser) {
  cart.subscribe(items => {
    localStorage.setItem('cart', JSON.stringify(items));
  });
}

// Cart count
export const cartCount = derived(cart, ($cart) => {
  return $cart.reduce((acc, item) => acc + item.quantity, 0);
});

// Cart total
export const cartTotal = derived(cart, ($cart) => {
  return $cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
});

// Add item to cart
export const addToCart = (product: Product, variantIndex: number, quantity: number = 1) => {
  const variant = product.variants[variantIndex];

  cart.update(items => {
    // Check if item already exists in cart
    const existingItemIndex = items.findIndex(item =>
      item.productId === product._id && item.variantSku === variant.sku
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      return updatedItems;
    } else {
      // Add new item if it doesn't exist
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
    }
  });
};

// Remove item from cart
export const removeFromCart = (productId: string, variantSku: string) => {
  cart.update(items => items.filter(item =>
    !(item.productId === productId && item.variantSku === variantSku)
  ));
};

// Update item quantity
export const updateCartItemQuantity = (productId: string, variantSku: string, quantity: number) => {
  cart.update(items => {
    return items.map(item => {
      if (item.productId === productId && item.variantSku === variantSku) {
        return { ...item, quantity };
      }
      return item;
    });
  });
};

// Clear cart
export const clearCart = () => {
  cart.set([]);
};

// Initialize wishlist from localStorage if available
const storedWishlist = browser && localStorage.getItem('wishlist')
  ? JSON.parse(localStorage.getItem('wishlist') || '[]')
  : [];

// Wishlist functionality
export const wishlist = writable<string[]>(storedWishlist);

// Update localStorage when wishlist changes
if (browser) {
  wishlist.subscribe(items => {
    localStorage.setItem('wishlist', JSON.stringify(items));
  });
}

// Wishlist count
export const wishlistCount = derived(wishlist, $wishlist => $wishlist.length);

// Check if a product is in the wishlist
export const isInWishlist = (productId: string): boolean => {
  return get(wishlist).includes(productId);
};

// Add product to wishlist
export const addToWishlist = (productId: string) => {
  wishlist.update(items => {
    if (!items.includes(productId)) {
      return [...items, productId];
    }
    return items;
  });
};

// Remove product from wishlist
export const removeFromWishlist = (productId: string) => {
  wishlist.update(items => items.filter(id => id !== productId));
};

// Toggle wishlist status (add if not in wishlist, remove if already in wishlist)
export const toggleWishlist = (productId: string) => {
  if (isInWishlist(productId)) {
    removeFromWishlist(productId);
  } else {
    addToWishlist(productId);
  }
};
