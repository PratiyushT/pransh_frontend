// We'll use +page.server.ts for SSR
export const prerender = false;

// Turn off preloading for this route to avoid errors during navigation
export const config = {
  preload: false
};
