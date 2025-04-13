// place files you want to import through the `$lib` alias in this folder.

// Components exports
export { default as Header } from './components/Header.svelte';
export { default as Footer } from './components/Footer.svelte';
export { default as Menu } from './components/Menu.svelte';
export { default as CustomCursor } from './components/CustomCursor.svelte';
export { default as PageLoader } from './components/PageLoader.svelte';

// Utils exports
export * from './utils/data';
export * from './stores/index';
export * from './types';
