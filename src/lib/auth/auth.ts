// src/lib/supabase/auth.ts
import { supabase } from './client';

/**
 * Sign up a new user
 * - Creates an auth user
 * - Creates a profile (handled by Supabase webhook or backend)
 * - Inserts shipping address immediately if provided
 */
export async function signUp({
  email,
  password,
  fullName,
  address,
}: {
  email: string;
  password: string;
  fullName: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };
}) {
  // Step 1: Create a new user in auth.users
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }, // Save full name into user's metadata
    },
  });

  if (signUpError) throw signUpError;

  const user = signUpData.user;
  if (!user) throw new Error('Signup failed — no user created.');

  // Step 2: Fetch the newly created profile using user ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) throw new Error('Profile not found after signup.');

  // Step 3: If address fields are provided, insert address immediately
  if (address && address.street && address.city && address.postalCode && address.country && address.phoneNumber) {
    const { error: addressError } = await supabase.from('addresses').insert({
      profile_id: profile.id,    // Link address to the user's profile
      label: 'Home',             // Default label
      street: address.street,
      city: address.city,
      state: address.state || '',
      postal_code: address.postalCode,
      country: address.country,
      phone_number: address.phoneNumber,
      is_default: true,          // Mark first address as default
    });

    if (addressError) {
      console.error('Address insertion failed:', addressError.message);
      // You can choose whether to throw error here or just log it
    }
  }

  return user;
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: { email: string; password: string }) {
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
 * Load the logged-in user's profile from public.profiles table
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
 * Update logged-in user's profile
 * - Only updates fullName and phoneNumber
 */
export async function updateUserProfile({
  fullName,
  phoneNumber,
}: {
  fullName?: string;
  phoneNumber?: string;
}) {
  const session = await getSession();
  if (!session?.user) throw new Error('No logged in user.');

  const updates: any = {
    updated_at: new Date().toISOString(), // Always update the updated_at timestamp
  };

  if (fullName) updates.full_name = fullName;
  if (phoneNumber) updates.phone_number = phoneNumber;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', session.user.id);

  if (error) throw error;
}
