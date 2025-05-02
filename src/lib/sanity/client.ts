// Creates a configured client with better error handling
import {createClient} from "@sanity/client";
import {SANITY_DATASET, SANITY_PROJECT_ID} from "$lib/env";


export const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2023-01-01',
  useCdn: false,
  // Add a 10 second timeout to prevent hanging requests
  timeout: 10000
});


export default client;