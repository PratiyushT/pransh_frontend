import { createClient } from '@sanity/client';

// Creates a configured client with better error handling
export const client = createClient({
  projectId: 'tyr2rel9', // Fixed project ID
  dataset: 'production',
  apiVersion: '2023-01-01',
  useCdn: false,
  // Add a 10 second timeout to prevent hanging requests
  timeout: 10000
});

// Utility wrapper for Sanity queries with retry logic
export async function fetchWithRetry(query, params = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.fetch(query, params);
    } catch (error) {
      console.warn(`Sanity fetch attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
      lastError = error;

      // Only wait between retries if we're going to retry again
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
  }

  console.error(`All ${maxRetries} attempts to fetch from Sanity failed:`, lastError);
  return null; // Return null instead of throwing to prevent cascading failures
}
