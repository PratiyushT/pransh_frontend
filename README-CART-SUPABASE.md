# Cart-Supabase Integration

This document explains how the cart data is now saved to Supabase in addition to localStorage.

## Features

- Cart data is saved to Supabase for logged-in users
- Cart data is loaded from Supabase on page load for logged-in users
- Local cart and Supabase cart are merged on load (highest quantity is used)
- Cart data is saved to Supabase whenever the cart changes
- Cart data is still saved to localStorage for non-logged-in users

## Existing Supabase Structure

The implementation is built to work with your existing `user_carts` table with the following structure:

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
)
```

The implementation also respects the unique index that prevents duplicate variants in the cart:

```sql
CREATE UNIQUE INDEX one_variant_per_user_cart on public.user_carts using btree (profile_id, variant_id)
```

## How It Works

1. The `cart` store in `src/lib/stores/index.ts` has been updated to:
   - Load cart data from Supabase on initialization (for logged-in users)
   - Save cart data to Supabase whenever it changes (for logged-in users)
   - Merge local and Supabase cart data when both exist

2. New functions in `src/lib/cart/cart.ts` handle the Supabase integration:
   - `saveCartToSupabase(cartItems)` - Saves cart items to Supabase using your `user_carts` table
   - `loadCartFromSupabase()` - Loads cart items from Supabase

## Implementation Details

The `saveCartToSupabase` function:
1. Gets the user's profile ID from the Supabase profile
2. Fetches all existing cart items for the user
3. For each item in the current cart:
   - If the item already exists in Supabase, updates its quantity if needed
   - If the item doesn't exist, inserts a new record
4. Deletes any items that are in Supabase but not in the current cart

The `loadCartFromSupabase` function:
1. Gets the user's profile ID
2. Fetches all cart items for the user
3. Converts them to the format used by the cart store

## Troubleshooting

- If cart items aren't being saved to Supabase, check if:
  - The user is logged in
  - The user has a profile in the profiles table
  - The Supabase credentials are correct
  - The `user_carts` table exists and has the correct schema
  - There are no errors in the browser console (F12)
