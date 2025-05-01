# Stores: Function-Level Documentation

This document covers **src/lib/stores/index.ts**, which defines all global Svelte stores and actions for loading, menu, cart, wishlist, and search functionality. Sections:

1. **Purpose**
2. **File Path**
3. **Imports**
4. **Exports**
5. **Functions**
6. **Flow**

---

## Purpose
Provides application-wide state management via Svelte stores and exposes related actions for:
- Loading indicator
- Mobile menu toggle
- Shopping cart (with persistence)
- Wishlist (with persistence)
- Search modal control and query navigation

## File Path
`src/lib/stores/index.ts`

## Imports
```ts
import { writable, derived, get } from 'svelte/store';
import type { Product, CartItem } from '$lib/types';
import { browser } from '$app/environment';
```

## Exports
```ts
// Loading & menu
export const isLoading: Writable<boolean>;
export const isMenuOpen: Writable<boolean>;

// Cart
export const cart: Writable<CartItem[]>;
export const cartCount: Readable<number>;
export const cartTotal: Readable<number>;
export const addToCart: (product: Product, variantIndex: number, quantity?: number) => void;
export const removeFromCart: (productId: string, variantSku: string) => void;
export const updateCartItemQuantity: (productId: string, variantSku: string, quantity: number) => void;
export const clearCart: () => void;

// Wishlist
export const wishlist: Writable<string[]>;
export const wishlistCount: Readable<number>;
export const isInWishlist: (productId: string) => boolean;
export const addToWishlist: (productId: string) => void;
export const removeFromWishlist: (productId: string) => void;
export const toggleWishlist: (productId: string) => void;

// Search
export const isSearchOpen: Writable<boolean>;
export const searchQuery: Writable<string>;
export const openSearch: () => void;
export const closeSearch: () => void;
export const performSearch: (
  query: string,
  filters?: {
    categories?: string[];
    colors?: string[];
    sizes?: string[];
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }
) => void;
```

## Functions

### Cart Actions
1. **addToCart(product, variantIndex, quantity = 1)**
   - **Signature:** `(product: Product, variantIndex: number, quantity?: number) => void`
   - **Description:** Adds a product variant to the cart or increments quantity if already present.
   - **Parameters:**
     - `product` (Product) — full product data
     - `variantIndex` (number) — index of chosen variant in `product.variants`
     - `quantity` (number, default `1`) — number of items to add
   - **Returns:** `void`
   - **Example:**
     ```js
     addToCart(myProduct, 0, 2);
     // cart now has 2 of variant at index 0
     ```

2. **removeFromCart(productId, variantSku)**
   - **Signature:** `(productId: string, variantSku: string) => void`
   - **Description:** Removes the specified product variant from the cart.
   - **Example:**
     ```js
     removeFromCart('abc123', 'SKU456');
     ```

3. **updateCartItemQuantity(productId, variantSku, quantity)**
   - **Signature:** `(productId: string, variantSku: string, quantity: number) => void`
   - **Description:** Sets the cart item's quantity to the given value.
   - **Example:**
     ```js
     updateCartItemQuantity('abc123', 'SKU456', 5);
     // quantity now 5
     ```

4. **clearCart()**
   - **Signature:** `() => void`
   - **Description:** Empties the cart.
   - **Example:**
     ```js
     clearCart(); // cart becomes []
     ```

### Wishlist Actions
1. **isInWishlist(productId)**
   - **Signature:** `(productId: string) => boolean`
   - **Description:** Returns `true` if the product ID is in the wishlist.
   - **Example:**
     ```js
     isInWishlist('abc123'); // true/false
     ```

2. **addToWishlist(productId)**
   - **Signature:** `(productId: string) => void`
   - **Description:** Adds the product ID to the wishlist if not already present.

3. **removeFromWishlist(productId)**
   - **Signature:** `(productId: string) => void`
   - **Description:** Removes the product ID from the wishlist.

4. **toggleWishlist(productId)**
   - **Signature:** `(productId: string) => void`
   - **Description:** Toggles wishlist status for the given product ID.

### Search Actions
1. **openSearch()**
   - **Signature:** `() => void`
   - **Description:** Sets `isSearchOpen` to `true` and disables page scrolling.

2. **closeSearch()**
   - **Signature:** `() => void`
   - **Description:** Sets `isSearchOpen` to `false` and restores page scrolling.

3. **performSearch(query, filters?)**
   - **Signature:** `(query: string, filters?: { categories?: string[]; colors?: string[]; sizes?: string[]; minPrice?: number; maxPrice?: number; sort?: string }) => void`
   - **Description:** Updates `searchQuery`, navigates to `/shop` with URL parameters for `search` and each filter, then closes the search modal.
   - **Example:**
     ```js
     performSearch('shirt', { categories: ['Men'], minPrice: 2000 });
     // navigates to /shop?search=shirt&category=Men&minPrice=2000
     ```

## Flow

```text
Initialization:
  browser? -> load storedCart from localStorage -> cart = writable(storedCart)
  browser? -> load storedWishlist -> wishlist = writable(storedWishlist)
  isLoading = writable(true)
  isMenuOpen = writable(false)

Cart Persistence:
  cart.subscribe -> write to localStorage

Wishlist Persistence:
  wishlist.subscribe -> write to localStorage

Cart Derived:
  cartCount = derived(cart)
  cartTotal = derived(cart)

User Actions:
  addToCart/remove/update/clear -> cart.update or cart.set
  addToWishlist/remove/isInWishlist/toggle -> wishlist.update or get(wishlist)

Search Modal:
  openSearch -> isSearchOpen.set(true) & overflow hidden
  closeSearch -> isSearchOpen.set(false) & overflow reset
  performSearch -> searchQuery.set + build URL + window.location + closeSearch
```

---

*End of documentation for `src/lib/stores`.*

