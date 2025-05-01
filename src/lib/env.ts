// Environment variable adapter
// This helps us use environment variables with fallbacks
// and handle different naming conventions between .env file and what components expect

export const MAPBOX_API_KEY =
  // Try to get from VITE_ prefixed env var (standard for Vite projects)
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_API_KEY) ||
  // Try to get from PUBLIC_ prefixed env var (found in .env)
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_MAPBOX_API_KEY) ||
  // Fallback to this key if neither exists
  'pk.eyJ1IjoicHJ0MTUiLCJhIjoiY205aXh3cW5kMDc5MzJqcHk3ODg2eGFlaCJ9.sMg8tneQeKsSTDxSc4C9Bg';
