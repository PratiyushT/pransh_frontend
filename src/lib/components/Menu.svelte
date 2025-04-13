<script lang="ts">
  import { onMount } from 'svelte';
  import { isMenuOpen } from '$lib/stores/index';
  import { getCategories } from '$lib/utils/data';

  const categories = getCategories();

  // Close menu when escape key is pressed
  onMount(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && $isMenuOpen) {
        $isMenuOpen = false;
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  });
</script>

<div class="fullscreen-menu" class:open={$isMenuOpen}>
  <div class="container">
    <nav class="py-20">
      <ul class="menu-links">
        <li>
          <a href="/" class="menu-link" on:click={() => ($isMenuOpen = false)}>Home</a>
        </li>

        <li>
          <a href="/category/women" class="menu-link" on:click={() => ($isMenuOpen = false)}>Women</a>
        </li>

        <li>
          <a href="/category/men" class="menu-link" on:click={() => ($isMenuOpen = false)}>Men</a>
        </li>

        <li>
          <a href="/category/accessories" class="menu-link" on:click={() => ($isMenuOpen = false)}>Accessories</a>
        </li>

        <li>
          <a href="/collection/new" class="menu-link" on:click={() => ($isMenuOpen = false)}>New Arrivals</a>
        </li>

        <li>
          <a href="/about" class="menu-link" on:click={() => ($isMenuOpen = false)}>Our Story</a>
        </li>

        <li>
          <a href="/contact" class="menu-link" on:click={() => ($isMenuOpen = false)}>Contact</a>
        </li>
      </ul>
    </nav>

    <div class="mt-auto p-8 border-t border-gray-200">
      <div class="flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex gap-6">
          <a href="https://instagram.com" class="footer-social-icon" aria-label="Follow us on Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="https://facebook.com" class="footer-social-icon" aria-label="Follow us on Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="https://twitter.com" class="footer-social-icon" aria-label="Follow us on Twitter">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
        </div>

        <div class="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Pransh Luxury. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .fullscreen-menu {
    position: fixed;
    inset: 0;
    background-color: var(--color-white);
    display: flex;
    flex-direction: column;
    z-index: 100;
    transform: translateY(-100%);
    transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
    overflow-y: auto;
  }

  .fullscreen-menu.open {
    transform: translateY(0);
  }

  .menu-links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem 0;
  }

  .menu-link {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    position: relative;
    display: inline-block;
    color: var(--color-charcoal);
    transition: var(--transition-smooth);
  }

  .menu-link::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -4px;
    width: 0;
    height: 2px;
    background-color: var(--color-gold);
    transition: var(--transition-smooth);
  }

  .menu-link:hover {
    color: var(--color-gold);
  }

  .menu-link:hover::after {
    width: 100%;
  }

  @media (min-width: 768px) {
    .menu-link {
      font-size: 2.5rem;
    }
  }

  @media (min-width: 1024px) {
    .menu-link {
      font-size: 3rem;
    }
  }
</style>
