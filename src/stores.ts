import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';
import type { Product, CartItem } from '$lib/types';

// Loading state
export const isLoading = writable(true);

// Menu state
export const isMenuOpen = writable(false);

// Cart state
const storedCart = browser && localStorage.getItem('cart')
  ? JSON.parse(localStorage.getItem('cart') || '[]')
  : [];

export const cart = writable<CartItem[]>(storedCart);

// Update localStorage when cart changes
if (browser) {
  cart.subscribe(items => {
    localStorage.setItem('cart', JSON.stringify(items));
  });
}

// Derive cart count
export const cartCount = derived(cart, $cart => {
  return $cart.reduce((total, item) => total + item.quantity, 0);
});

// Derive cart total
export const cartTotal = derived(cart, $cart => {
  return $cart.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Add to cart
export const addToCart = (product: Product, variantIndex: number, quantity: number = 1) => {
  const variant = product.variants[variantIndex];

  if (variant && variant.stock > 0) {
    cart.update(items => {
      // Check if item already exists
      const existingItemIndex = items.findIndex(
        item => item.productId === product._id && item.variantSku === variant.sku
      );

      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        const newItem: CartItem = {
          productId: product._id,
          variantSku: variant.sku,
          name: product.name,
          price: variant.price,
          size: variant.size,
          color: variant.color,
          quantity,
          image: variant.images[0]?.url || '/images/product-placeholder.jpg'
        };

        return [...items, newItem];
      }
    });
  }
};

// Remove from cart
export const removeFromCart = (productId: string, variantSku: string) => {
  cart.update(items => items.filter(
    item => !(item.productId === productId && item.variantSku === variantSku)
  ));
};

// Update cart item quantity
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
