import { browser } from '$app/environment';

// Define the global Stripe type
declare global {
  interface Window {
    Stripe?: any;
  }
}

// Create a function to initialize Stripe only in browser environments
export const getStripePromise = () => {
  if (!browser) {
    // Return null when running on the server
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    // Check if Stripe is already loaded
    if (window.Stripe) {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (!stripeKey) {
        console.error('Missing Stripe public key in environment variables');
        resolve(null);
        return;
      }
      resolve(window.Stripe(stripeKey));
      return;
    }

    // If Stripe is not loaded yet, wait for it
    const checkStripeInterval = setInterval(() => {
      if (window.Stripe) {
        clearInterval(checkStripeInterval);
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        if (!stripeKey) {
          console.error('Missing Stripe public key in environment variables');
          resolve(null);
          return;
        }
        resolve(window.Stripe(stripeKey));
      }
    }, 100);

    // Set a timeout to prevent infinite waiting
    setTimeout(() => {
      clearInterval(checkStripeInterval);
      console.error('Stripe.js did not load within expected timeframe');
      resolve(null);
    }, 5000);
  });
};

// For backwards compatibility
export const stripePromise = browser ? getStripePromise() : Promise.resolve(null);
