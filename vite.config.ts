import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load env variables from .env files
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      sveltekit(),
      tailwindcss(),
    ],
    server: {
      fs: {
        allow: ['..']
      }
    },
    // Provide env vars to both client and server
    define: {
      'process.env.STRIPE_SECRET_KEY': JSON.stringify(env.STRIPE_SECRET_KEY),
      // Add any other server-side env vars that need to be accessible
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Ignore a11y warnings during build
          // @ts-ignore
          if (warning.code === 'a11y-missing-attribute' ||
              warning.code === 'a11y-missing-content' ||
              warning.code.includes('a11y')) {
            return;
          }
          warn(warning);
        }
      }
    },
    envPrefix: 'VITE_'
  }
});
