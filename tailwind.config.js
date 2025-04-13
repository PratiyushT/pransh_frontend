/** @type {import('tailwindcss').Config} */
export default {
  mode: 'aot', // Ahead-of-time mode instead of JIT
  content: [
    './src/**/*.{html,js,svelte,ts}',
  ],
  theme: {
    colors: {
      primary: '#D4AF37',
      secondary: '#333333',
      white: '#FFFFFF',
      black: '#000000',
      transparent: 'transparent',
      gray: {
        100: '#F9F9F9',
        200: '#F5F5F5',
        300: '#E6E6E6',
        400: '#CCCCCC',
        500: '#999999',
        600: '#666666',
        700: '#333333',
        800: '#222222',
        900: '#111111',
      },
    },
    fontFamily: {
      'sans': ['Montserrat', 'sans-serif'],
      'serif': ['Cormorant Garamond', 'serif'],
      'poppins': ['Poppins', 'sans-serif'],
    },
  },
  plugins: [],
}
