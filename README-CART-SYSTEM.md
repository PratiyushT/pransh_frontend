# Cart System Implementation

This document explains the comprehensive cart system implementation that handles both guest carts and authenticated user carts with proper synchronization and validation against Sanity.

## System Overview

The cart system provides a seamless experience for both guest users and authenticated users:

1. **Guest users**: Cart data is stored in localStorage and persists across page reloads
2. **Authenticated users**: Cart data is stored in Supabase and automatically synced with the frontend
3. **Automatic merging**: When a guest user logs in, their cart is merged with any existing cart in Supabase

## Key Features

- **Guest Cart**: Stored in localStorage with expiry after 30 days of inactivity
- **User Cart**: Stored in Supabase's `user_carts` table with proper foreign key relationships
- **Sanity Validation**: All cart items are validated against Sanity to ensure they exist and are in stock
- **Conflict Resolution**: When merging carts, conflicts are resolved by using the higher quantity
- **Auto-sync**: User carts are automatically synced to Supabase on changes with efficient diff tracking
- **Checkout Validation**: Strict validation before checkout to ensure items are in stock

## Architecture

The cart system consists of several components:

### 1. Core Cart Store (`src/lib/cart/cartStore.ts`)

This is the central store for all cart operations. It provides:

- A Svelte store for the cart items (`cart`)
- Derived stores for UI (`cartCount`, `cartEmpty`)
- Utility functions for cart operations (add, remove, update, clear)
- Authentication-aware storage (localStorage vs Supabase)
- Cart initialization and synchronization logic

### 2. Cart Validation (`src/lib/cart/cartValidation.ts`)

This module is responsible for validating cart items against Sanity:

- Single item validation for add/update operations
- Batch validation for cart initialization and checkout
- Stock level checking for both regular validation and strict checkout validation

### 3. Database Schema (`user_carts` table)

The `user_carts` table in Supabase stores cart items for authenticated users:

```sql
CREATE TABLE public.user_carts (
  id bigint generated always as identity not null,
  profile_id bigint not null,
  product_id text not null,
  variant_id text not null,
  quantity integer not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_carts_pkey primary key (id),
  constraint user_carts_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE,
  constraint user_carts_quantity_check check ((quantity > 0))
);

CREATE UNIQUE INDEX one_variant_per_user_cart on public.user_carts using btree (profile_id, variant_id);
```

## Implementation Details

### Cart Initialization

The cart is initialized in the app's main layout (`+layout.svelte`):

1. Check if user is authenticated by getting the current session
2. If authenticated:
   - Load cart from Supabase
   - Check for guest cart in localStorage to merge
3. If not authenticated:
   - Load guest cart from localStorage

Both guest and user carts go through Sanity validation to ensure items are still valid.

### Cart Synchronization

Synchronization happens in several key moments:

1. **On initialization**: Load and merge carts as needed
2. **On login**: Merge guest cart with Supabase cart
3. **On logout**: Switch to localStorage for storage
4. **On cart changes**: Automatically sync to the appropriate storage
5. **Auto-sync**: Periodically sync authenticated user carts to Supabase

### Cart Validation Against Sanity

Every cart operation includes validation:

1. **Adding items**: Validate product and variant exist, check stock level
2. **Updating quantities**: Validate stock levels are sufficient
3. **Initializing cart**: Filter out invalid items
4. **Before checkout**: Strictly validate all items and stock levels

### Merging Strategy

When merging guest and user carts:

1. Start with the user's cart from Supabase
2. For each item in the guest cart:
   - If the item already exists in the user's cart, use the higher quantity
   - If the item doesn't exist in the user's cart, add it
3. Validate the merged cart against Sanity
4. Save the result to Supabase
5. Clear the guest cart

## Usage

### Basic Cart Operations

```typescript
// Import cart functions
import {
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  validateCartForCheckout
} from '$lib/cart/cartStore';

// Add an item to the cart
await addToCart(productId, variantId, quantity);

// Remove an item from the cart
await removeFromCart(productId, variantId);

// Update an item's quantity
await updateCartItemQuantity(productId, variantId, newQuantity);

// Clear the entire cart
await clearCart();

// Validate cart before checkout
const { valid, invalidItems } = await validateCartForCheckout();
```

### Cart UI Integration

```svelte
<script>
  import { cart, cartCount, cartEmpty, cartLoading, cartError } from '$lib/cart/cartStore';
</script>

{#if $cartLoading}
  <div>Loading cart...</div>
{:else if $cartError}
  <div>Error: {$cartError}</div>
{:else if $cartEmpty}
  <div>Your cart is empty</div>
{:else}
  <div>Cart Items: {$cartCount}</div>

  {#each $cart as item}
    <div>
      {item.productId} - {item.variantId} - {item.quantity}
    </div>
  {/each}
</div>
{/if}
```

### User Authentication Integration

```typescript
// Import auth handlers
import { handleUserLogin, handleUserLogout } from '$lib/cart/cartStore';

// On user login
await handleUserLogin();

// On user logout
await handleUserLogout();
```

## Error Handling

The cart system includes comprehensive error handling:

1. **Validation Errors**: Items that fail validation are not added to the cart
2. **Network Errors**: Sync operations automatically retry and gracefully degrade
3. **Conflict Resolution**: When merging carts, conflicts are resolved automatically
4. **UI Feedback**: Cart errors are displayed to users through the `cartError` store

## Performance Considerations

Several optimizations are in place for better performance:

1. **Throttling**: Sync operations are throttled to avoid excessive database writes
2. **Checksumming**: Changes are detected using checksums to avoid unnecessary syncs
3. **Batch Operations**: Items are validated and synced in batches where possible
4. **Lazy Loading**: Cart data is loaded only when needed
5. **Caching**: Local state is used as a cache to reduce database reads

## Conclusion

This cart system provides a comprehensive solution for handling both guest and authenticated user carts with proper validation, synchronization, and error handling. It's designed to be robust, efficient, and user-friendly while ensuring data integrity and availability.
