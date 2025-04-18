import { supabase } from './client'

// Signup new user
export async function signUp(email: string, password: string) {
  return await supabase.auth.signUp({ email, password })
}

// Login user
export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password })
}

// Logout user
export async function signOut() {
  return await supabase.auth.signOut()
}

// Get user profile from profiles table
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
} 