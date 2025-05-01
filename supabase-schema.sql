-- Note: This SQL should only be run if the user_carts table does not exist.
-- If the table already exists, you do not need to run this script.

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_cart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_carts table to store individual cart items per user
CREATE TABLE IF NOT EXISTS public.user_carts (
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

-- Create unique index to ensure one variant per user cart
CREATE UNIQUE INDEX IF NOT EXISTS one_variant_per_user_cart
ON public.user_carts
USING btree (profile_id, variant_id);

-- Create trigger to automatically update updated_at field
CREATE TRIGGER set_user_cart_updated_at
BEFORE UPDATE ON user_carts
FOR EACH ROW
EXECUTE FUNCTION update_user_cart_updated_at();

-- Create RLS (Row Level Security) policies for the user_carts table
-- This ensures that users can only access their own cart data
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

-- Policy for selecting: users can only select their own cart items
CREATE POLICY select_own_cart_items ON public.user_carts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth.users.id
      FROM auth.users
      JOIN profiles ON auth.users.id = profiles.user_id
      WHERE profiles.id = user_carts.profile_id
    )
  );

-- Policy for inserting: users can only insert their own cart items
CREATE POLICY insert_own_cart_items ON public.user_carts
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT auth.users.id
      FROM auth.users
      JOIN profiles ON auth.users.id = profiles.user_id
      WHERE profiles.id = user_carts.profile_id
    )
  );

-- Policy for updating: users can only update their own cart items
CREATE POLICY update_own_cart_items ON public.user_carts
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT auth.users.id
      FROM auth.users
      JOIN profiles ON auth.users.id = profiles.user_id
      WHERE profiles.id = user_carts.profile_id
    )
  );

-- Policy for deleting: users can only delete their own cart items
CREATE POLICY delete_own_cart_items ON public.user_carts
  FOR DELETE USING (
    auth.uid() IN (
      SELECT auth.users.id
      FROM auth.users
      JOIN profiles ON auth.users.id = profiles.user_id
      WHERE profiles.id = user_carts.profile_id
    )
  );
