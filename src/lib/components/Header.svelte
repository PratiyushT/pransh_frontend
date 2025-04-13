<script lang="ts">
  import { onMount } from 'svelte';
  import { isMenuOpen } from '$lib/stores/index';
  // Import just isMenuOpen for now since we don't have cart implementation yet
  const cartCount = { subscribe: () => ({ unsubscribe: () => {} }) };

  let prevScrollY = 0;
  let headerSticky: HTMLElement;
  let isVisible = false;
  let scrollY: number;

  onMount(() => {
    const handleScroll = () => {
      scrollY = window.scrollY;

      // Show sticky header when scrolling down past 100px
      if (scrollY > 100) {
        if (scrollY > prevScrollY) {
          // Scrolling down - hide header
          isVisible = false;
        } else {
          // Scrolling up - show header
          isVisible = true;
        }
      } else {
        // At the top - no sticky header
        isVisible = false;
      }

      prevScrollY = scrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  const toggleMenu = () => {
    $isMenuOpen = !$isMenuOpen;
    if ($isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
</script>

<header class="header">
  <div class="container">
    <div class="header-inner">
      <a href="/" class="brand-logo">Pransh</a>

      <nav class="hidden md:block">
        <ul class="nav-links">
          <li><a href="/category/women" class="nav-link">Women</a></li>
          <li><a href="/category/men" class="nav-link">Men</a></li>
          <li><a href="/category/accessories" class="nav-link">Accessories</a></li>
          <li><a href="/collection/new" class="nav-link">New Arrivals</a></li>
          <li><a href="/about" class="nav-link">Our Story</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <a href="/search" class="header-action-icon" aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </a>

        <a href="/account" class="header-action-icon hidden md:block" aria-label="Account">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </a>

        <a href="/cart" class="header-action-icon relative" aria-label="Cart">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          {#if $cartCount > 0}
            <span class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
              {$cartCount}
            </span>
          {/if}
        </a>

        <button class="hamburger-menu md:hidden" class:open={$isMenuOpen} on:click={toggleMenu} aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </div>
</header>

<!-- Sticky Header that appears when scrolling -->
<div class="header-sticky" class:visible={isVisible} bind:this={headerSticky}>
  <div class="container">
    <div class="header-inner">
      <a href="/" class="brand-logo text-lg">Pransh</a>

      <nav class="hidden md:block">
        <ul class="nav-links">
          <li><a href="/category/women" class="nav-link text-sm">Women</a></li>
          <li><a href="/category/men" class="nav-link text-sm">Men</a></li>
          <li><a href="/category/accessories" class="nav-link text-sm">Accessories</a></li>
          <li><a href="/collection/new" class="nav-link text-sm">New Arrivals</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <a href="/search" class="header-action-icon" aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </a>

        <a href="/cart" class="header-action-icon relative" aria-label="Cart">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          {#if $cartCount > 0}
            <span class="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary text-white text-xs flex items-center justify-center">
              {$cartCount}
            </span>
          {/if}
        </a>

        <button class="hamburger-menu md:hidden" class:open={$isMenuOpen} on:click={toggleMenu} aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .hamburger-menu {
    width: 2rem;
    height: 1.5rem;
    position: relative;
    cursor: pointer;
  }

  .hamburger-menu span {
    display: block;
    position: absolute;
    height: 1px;
    width: 100%;
    background-color: #333333;
    transition: all 0.3s ease-in-out;
  }

  .hamburger-menu span:nth-child(1) {
    top: 0;
  }

  .hamburger-menu span:nth-child(2) {
    top: 50%;
    transform: translateY(-50%);
  }

  .hamburger-menu span:nth-child(3) {
    bottom: 0;
  }

  .hamburger-menu.open span:nth-child(1) {
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
  }

  .hamburger-menu.open span:nth-child(2) {
    opacity: 0;
  }

  .hamburger-menu.open span:nth-child(3) {
    bottom: 50%;
    transform: translateY(50%) rotate(-45deg);
  }

  .header-sticky {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: rgba(250, 249, 246, 0.9);
    backdrop-filter: blur(4px);
    z-index: 30;
    transition: all 0.3s;
    transform: translateY(-100%);
  }

  .header-sticky.visible {
    transform: translateY(0);
  }
</style>
