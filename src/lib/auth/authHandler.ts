import { handleUserLogin, handleUserLogout } from '$lib/cart/cartStore';
import { signIn, signUp, signOut, getSession } from './auth';

/**
 * Handles user sign-in and cart synchronization
 *
 * @param email User's email
 * @param password User's password
 * @returns Session data if successful
 */
export async function handleSignIn(email: string, password: string) {
  try {
    // Authenticate the user
    const data = await signIn({ email, password });

    // Sync cart after successful login
    await handleUserLogin();

    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Handles user sign-up and cart synchronization
 *
 * @param email User's email
 * @param password User's password
 * @param firstName User's first name
 * @param lastName User's last name
 * @param address Optional shipping address
 * @returns Session data if successful
 */
export async function handleSignUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  }
) {
  try {
    // Register the user
    const data = await signUp({
      email,
      password,
      firstName,
      lastName,
      address
    });

    // If sign-up includes automatic sign-in, sync the cart
    if (data.session) {
      await handleUserLogin();
    }

    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

/**
 * Handles user sign-out and cart synchronization
 */
export async function handleSignOut() {
  try {
    // Handle cart state before signing out
    await handleUserLogout();

    // Sign out the user
    await signOut();

  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 *
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return !!session?.user;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}
