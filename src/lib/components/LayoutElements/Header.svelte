<script lang="ts">
  import { onMount } from 'svelte';
  import { isMenuOpen, cartCount, wishlistCount, openSearch } from '$lib/stores';
  import gsap from 'gsap';
  import SearchModal from '../UI/SearchModal.svelte';

  let prevScrollY = 0;
  let mainHeader: HTMLElement;
  let isScrolled = false;
  let scrollY: number;
  let cartIconHeader: HTMLElement;
  let wishlistIconHeader: HTMLElement;
  let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    // Throttled scroll handler for basic sticky functionality
    const handleScroll = () => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        scrollY = window.scrollY;

        // Simple toggle for sticky header
        if (scrollY > 80) {
          isScrolled = true;
        } else {
          isScrolled = false;
        }

        prevScrollY = scrollY;
        throttleTimeout = null;
      }, 10);
    };

    window.addEventListener('scroll', handleScroll);

    // Store references to cart and wishlist icons
    cartIconHeader = document.querySelector('.header .header-action-icon.cart-icon[aria-label="Cart"]');
    wishlistIconHeader = document.querySelector('.header .header-action-icon[aria-label="Wishlist"]');

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
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

<header class="header" bind:this={mainHeader} class:scrolled={isScrolled}>
  <div class="container">
    <div class="header-inner">
      <a href="/static" class="brand-logo">
        <img src="/images/header_logo.png" alt="Pransh Logo" height="40" style="aspect-ratio: 5/2; object-fit: contain; max-width: 160px; width: auto; display: block; margin: 0; padding: 0;" class="logo-image">
      </a>

      <nav class="hidden md:block">
        <ul class="nav-links">
          <li><a href="/static" class="nav-link">Home</a></li>
          <li><a href="/shop" class="nav-link">Shop</a></li>
          <li><a href="/about" class="nav-link">About & Contact</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <button
          class="header-action-icon"
          aria-label="Search"
          on:click={() => openSearch()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <a href="/account" class="header-action-icon hidden md:block" aria-label="Account">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </a>

        <a href="/wishlist" class="header-action-icon relative" aria-label="Wishlist" bind:this={wishlistIconHeader}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {#if $wishlistCount > 0}
            <span class="wishlist-count absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center">
              {$wishlistCount}
            </span>
          {/if}
        </a>

        <a href="/cart" class="header-action-icon cart-icon relative" aria-label="Cart" bind:this={cartIconHeader}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          {#if $cartCount > 0}
            <span class="cart-count absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center">
              {$cartCount}
            </span>
          {/if}
        </a>

        <button class="hamburger md:hidden" class:active={$isMenuOpen} on:click={toggleMenu} aria-label="Toggle menu">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>
    </div>
  </div>
</header>

<!-- Include the SearchModal component -->
<SearchModal />

<style>
  :root {
    --header-bg: #fffdfa;
    --header-shadow: 0 4px 28px 0 rgba(60,50,35,0.07);
    --header-border: 1px solid #ece6db;
    --header-link-hover: var(--color-gold);
  }
  .header {
    position: relative;
    z-index: 25;
    background-color: var(--header-bg);
    box-shadow: var(--header-shadow);
    border-bottom: var(--header-border);
    width: 100%;
    padding: 1.1rem 0 1.1rem 0;
    transition: box-shadow 0.24s cubic-bezier(.7,0,.3,1), background-color 0.22s, padding 0.17s;
  }
  .header.scrolled {
    position: fixed;
    top: 0;
    left: 0;
    box-shadow: 0 4px 21px 0 rgba(100,88,38,.13);
    padding: 0.55rem 0;
    background: rgba(255, 253, 250, 0.98);
    border-bottom: 1px solid #e2dcc1;
    backdrop-filter: blur(10px);
  }
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 26px;
    width: 100%;
  }
  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 48px;
    gap: 1.2rem;
  }
  .brand-logo {
    margin: 0 1.1rem 0 0;
    padding: 0;
    line-height: 0;
    display: flex;
    align-items: center;
    max-height: 45px;
  }
  .logo-image {
    height: 40px !important;
    max-width: 150px;
    aspect-ratio: 5/2;
    object-fit: contain;
    display: block;
  }
  nav ul.nav-links {
    display: flex;
    gap: 2.2rem;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .nav-link {
    position: relative;
    color: #624b19;
    font-size: 1.13rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    text-decoration: none;
    transition: color .18s;
    padding: 2px 3px;
    border-radius: 3px;
  }
  .nav-link:after {
    content: '';
    position: absolute;
    width: 0%;
    height: 2.4px;
    left: 0;
    bottom: -5px;
    background: linear-gradient(90deg,#F8CA57 50%,#e6b82c 100%);
    border-radius: 1px;
    transition: width 0.33s cubic-bezier(.7,0,.3,1);
  }
  .nav-link:hover, .nav-link:focus {
    color: var(--header-link-hover);
    background-color: #fcf6e7;
  }
  .nav-link:hover:after, .nav-link:focus:after {
    width: 100%;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1.1rem;
  }
  .header-action-icon {
    color: #7a663c;
    transition: color 0.22s, transform 0.20s;
    padding: 0.15rem 0.21rem;
    border-radius: 50%;
    background: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .header-action-icon:hover, .header-action-icon:focus {
    color: var(--header-link-hover);
    background: #f5e6bb52;
    transform: translateY(-2px) scale(1.08);
  }
  .cart-count, .wishlist-count {
    background: linear-gradient(90deg,#f2c651 35%,#f7d785 100%);
    color: #624b19 !important;
    border-radius: 50%;
    font-size: .82rem;
    border: 1.5px solid #ffeab4;
    font-weight: 700;
    padding: 1px 0;
  }

  /* Elegant Minimalist Hamburger Menu */
  .hamburger {
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 5px;
    position: relative;
    z-index: 101;
    padding: 8px 12px;
    transition: all 0.2s ease;
  }

  .hamburger:hover {
    transform: translateY(-1px);
  }

  .hamburger:hover .hamburger-line:first-child {
    width: 22px;
  }

  .hamburger:hover .hamburger-line:nth-child(2) {
    width: 20px;
  }

  .hamburger:hover .hamburger-line:nth-child(3) {
    width: 18px;
  }

  .hamburger:focus {
    outline: none;
  }

  .hamburger-line {
    height: 1.5px;
    background-color: #b39839;
    display: block;
    transition: all 0.3s ease;
    border-radius: 0.5px;
    transform-origin: left center;
  }

  /* Varying line widths for aesthetic effect */
  .hamburger-line:first-child {
    width: 18px;
  }

  .hamburger-line:nth-child(2) {
    width: 24px;
    margin-top: 1px;
  }

  .hamburger-line:nth-child(3) {
    width: 14px;
    margin-top: 1px;
  }

  /* Active state (when menu is open) */
  .hamburger.active .hamburger-line:first-child {
    width: 22px;
    transform: rotate(45deg) translate(1px, -2px);
  }

  .hamburger.active .hamburger-line:nth-child(2) {
    opacity: 0;
    width: 0;
  }

  .hamburger.active .hamburger-line:nth-child(3) {
    width: 22px;
    transform: rotate(-45deg) translate(1px, 2px);
  }

  @media (max-width: 900px) {
    .container { max-width: 97vw; }
    nav ul.nav-links { gap: 1.1rem; }
  }
  @media (max-width: 768px) {
    .brand-logo { margin-right: 1rem; margin-left: -3px; }
    .container { padding-left: 5px; padding-right: 9px; }
    .header-inner { min-height: 43px; gap: 0.71rem; }
    .header { padding: 0.7rem 0; }
  }
</style>
