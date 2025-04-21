import { createClient } from '@sanity/client';

// Hardcoded project ID to ensure it works properly
export const client = createClient({
  projectId: 'tyr2rel9', // Fixed project ID
  dataset: 'production',
  apiVersion: '2023-01-01',
  useCdn: false
});
