<script lang="ts">
  import { onMount } from 'svelte';
  import { isMenuOpen, cartCount, wishlistCount } from '$lib/stores/index';
  import gsap from 'gsap';

  let prevScrollY = 0;
  let headerSticky: HTMLElement;
  let isVisible = false;
  let isScrolled = false;
  let scrollY: number;
  let cartIconHeader: HTMLElement;
  let cartIconSticky: HTMLElement;
  let wishlistIconHeader: HTMLElement;
  let wishlistIconSticky: HTMLElement;
  let headerAnimation: gsap.core.Timeline;
  let scrollDirection = "up";
  let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
  let mainHeader: HTMLElement;

  onMount(() => {
    // Initialize GSAP timeline for smoother animation control
    headerAnimation = gsap.timeline({ paused: true });
    headerAnimation.fromTo(headerSticky,
      { y: -100, opacity: 0, pointerEvents: "none" },
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", pointerEvents: "auto" }
    );

    // Throttled scroll handler for better performance
    const handleScroll = () => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        scrollY = window.scrollY;
        scrollDirection = scrollY > prevScrollY ? "down" : "up";

        // Show sticky header when scrolling down past 80px (slightly faster appearance)
        if (scrollY > 80) {
          isScrolled = true;
          isVisible = true; // Show sticky header only when we're not at the very top
        } else {
          isScrolled = false;
          // When scrolling up to the very top, complete the animation before hiding
          if (scrollY < 10 && scrollDirection === "up") {
            // Ensure we hide the sticky header when we reach the top
            isVisible = false;
          }
        }

        prevScrollY = scrollY;
        throttleTimeout = null;
      }, 10); // Small throttle for smoother transitions
    };

    window.addEventListener('scroll', handleScroll);

    // Store references to cart icons for the add-to-cart animation
    cartIconHeader = document.querySelector('.header .header-action-icon.cart-icon[aria-label="Cart"]');
    cartIconSticky = document.querySelector('.header-sticky .header-action-icon.cart-icon[aria-label="Cart"]');

    // Store references to wishlist icons
    wishlistIconHeader = document.querySelector('.header .header-action-icon[aria-label="Wishlist"]');
    wishlistIconSticky = document.querySelector('.header-sticky .header-action-icon[aria-label="Wishlist"]');

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  });

  // Watch isVisible to trigger the animation with smoother transitions
  $: if (isVisible && headerAnimation) {
    // When the sticky header becomes visible, slightly adjust the main header
    headerAnimation.play();

    if (mainHeader) {
      // Adjust main header visibility when sticky header is active
      gsap.to(mainHeader, {
        opacity: scrollY < 50 ? 1 : 0,
        duration: 0.3,
        ease: "power2.inOut"
      });
    }
  } else if (headerAnimation) {
    headerAnimation.reverse();

    if (mainHeader) {
      // Make sure main header is fully visible when sticky header is hidden
      gsap.to(mainHeader, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }

  const toggleMenu = () => {
    $isMenuOpen = !$isMenuOpen;
    if ($isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
</script>

<header class="header" bind:this={mainHeader}>
  <div class="container">
    <div class="header-inner">
      <a href="/" class="brand-logo">
        <img src="/images/pransh-logo.svg" alt="Pransh Logo" height="30">
      </a>

      <nav class="hidden md:block">
        <ul class="nav-links">
          <li><a href="/" class="nav-link">Home</a></li>
          <li><a href="/category/all" class="nav-link">Shop</a></li>
          <li><a href="/about" class="nav-link">About & Contact</a></li>
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

        <button class="hamburger-menu md:hidden" class:open={$isMenuOpen} on:click={toggleMenu} aria-label="Toggle menu">
          <div class="hamburger-lines">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
    </div>
  </div>
</header>

<!-- Sticky Header that appears when scrolling -->
<div class="header-sticky" class:visible={isVisible} bind:this={headerSticky}>
  <div class="container">
    <div class="header-inner">
      <a href="/" class="brand-logo text-lg">
        <img src="/images/pransh-logo.svg" alt="Pransh Logo" height="24">
      </a>

      <nav class="hidden md:block">
        <ul class="nav-links">
          <li><a href="/" class="nav-link text-sm">Home</a></li>
          <li><a href="/category/all" class="nav-link text-sm">Shop</a></li>
          <li><a href="/about" class="nav-link text-sm">About & Contact</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <a href="/search" class="header-action-icon" aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </a>

        <a href="/wishlist" class="header-action-icon relative" aria-label="Wishlist" bind:this={wishlistIconSticky}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {#if $wishlistCount > 0}
            <span class="wishlist-count absolute -top-2 -right-2 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center">
              {$wishlistCount}
            </span>
          {/if}
        </a>

        <a href="/cart" class="header-action-icon cart-icon relative" aria-label="Cart" bind:this={cartIconSticky}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          {#if $cartCount > 0}
            <span class="cart-count absolute -top-2 -right-2 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center">
              {$cartCount}
            </span>
          {/if}
        </a>

        <button class="hamburger-menu md:hidden" class:open={$isMenuOpen} on:click={toggleMenu} aria-label="Toggle menu">
          <div class="hamburger-lines">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .hamburger-menu {
    width: 2.5rem;
    height: 2.5rem;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 101;
    border-radius: 50%;
    transition: transform 0.3s ease, background-color 0.3s ease;
    background-color: transparent;
  }

  .hamburger-menu:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .hamburger-menu.open {
    background-color: transparent;
  }

  .hamburger-lines {
    width: 1.4rem;
    height: 1.4rem;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .hamburger-menu span {
    display: block;
    position: absolute;
    height: 1.5px;
    width: 100%;
    background-color: var(--color-charcoal);
    border-radius: 3px;
    opacity: 1;
    left: 0;
    transform: rotate(0deg);
    transition: transform 0.5s cubic-bezier(0.7, 0, 0.3, 1),
                opacity 0.25s ease-in-out;
  }

  .hamburger-menu span:nth-child(1) {
    top: 0.3rem;
    transform-origin: left center;
  }

  .hamburger-menu span:nth-child(2) {
    top: 0.7rem;
    transform-origin: left center;
  }

  .hamburger-menu span:nth-child(3) {
    top: 1.1rem;
    transform-origin: left center;
  }

  .hamburger-menu.open span:nth-child(1) {
    transform: rotate(45deg);
    top: 0.25rem;
    left: 0.3rem;
    width: 100%;
    background-color: var(--color-gold);
  }

  .hamburger-menu.open span:nth-child(2) {
    width: 0%;
    opacity: 0;
  }

  .hamburger-menu.open span:nth-child(3) {
    transform: rotate(-45deg);
    top: 1.15rem;
    left: 0.3rem;
    width: 100%;
    background-color: var(--color-gold);
  }

  .header {
    position: relative;
    z-index: 20;
    background-color: var(--color-white);
    width: 100%;
    transition: opacity 0.3s ease;
    will-change: opacity;
  }

  .header-sticky {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: rgba(250, 249, 246, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 25; /* Adjust z-index to be between header and menu */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    will-change: transform, opacity;
    transform: translateY(-100%);
    pointer-events: none; /* Prevent interaction when hidden */
    transition: box-shadow 0.3s ease, transform 0.3s ease; /* Smooth all transitions */
  }

  .header-sticky.visible {
    transform: translateY(0);
    pointer-events: all; /* Enable interaction when visible */
    z-index: 25; /* Keep consistent z-index */
  }

  .header-action-icon {
    position: relative;
    transition: transform 0.3s ease, color 0.3s ease;
    transform-origin: center;
    will-change: transform;
  }

  .header-action-icon:hover {
    color: var(--color-gold);
    transform: translateY(-2px);
  }

  .cart-count {
    background-color: var(--color-gold);
    transition: all 0.3s ease;
    will-change: transform;
    transform-origin: center;
  }

  .wishlist-count {
    background-color: var(--color-gold);
    transition: all 0.3s ease;
    will-change: transform;
    transform-origin: center;
  }

  .nav-link {
    position: relative;
    transition: color 0.3s ease;
  }

  .nav-link:after {
    content: '';
    position: absolute;
    width: 0%;
    height: 2px;
    bottom: -4px;
    left: 0;
    background-color: var(--color-gold);
    transition: width 0.3s ease;
  }

  .nav-link:hover:after {
    width: 100%;
  }
</style>
