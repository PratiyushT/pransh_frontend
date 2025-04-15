import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
	],
	server: {
		fs: {
			allow: ['..']
		}
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
	}
});
