// src/lib/supabase/auth.ts
import { supabase } from './client';

/**
 * Sign up a new user
 * - Creates a Supabase auth user
 * - Stores first_name, last_name, and shipping address temporarily in user_metadata
 * - No profiles or addresses are created until email confirmation
 */
export async function signUp({
  email,
  password,
  firstName,
  lastName,
  address
}: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        shipping_address: address || null,
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in an existing user
 */
export async function signIn({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the currently logged-in user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current user session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Load logged-in user's profile after confirmation
 * Fetch the profile from public.profiles after user has confirmed email
 */
export async function loadUserProfile() {
  const session = await getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Insert Shipping Address after login if metadata had a stored address
 */
export async function insertShippingAddressIfNeeded(profileId: number) {
  const session = await getSession();
  if (!session?.user) throw new Error('No active session');

  const shipping = session.user.user_metadata?.shipping_address;

  if (shipping) {
    const { error } = await supabase.from('addresses').insert([
      {
        profile_id: profileId,
        street: shipping.street,
        city: shipping.city,
        state: shipping.state || '',
        postal_code: shipping.postalCode,
        country: shipping.country,
        phone_number: shipping.phoneNumber,
        label: 'Default',
        is_default: true,
      }
    ]);

    if (error) throw error;
  }
}
