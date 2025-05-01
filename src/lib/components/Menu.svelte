<script lang="ts">
  import { onMount } from 'svelte';
  import { isMenuOpen, wishlistCount, openSearch } from '$lib/stores/index';
  import { cartCount } from '$lib/cart/cartStore';
  import { getCategories } from '$lib/utils/data';
  import gsap from 'gsap';

  const categories = getCategories();
  let menuLinks: HTMLElement;
  let menuFooter: HTMLElement;
  let menuHeader: HTMLElement;
  let menuContent: HTMLElement;
  let touchStartY: number = 0;
  let touchEndY: number = 0;

  // Close menu function
  const closeMenu = () => {
    $isMenuOpen = false;
    document.body.style.overflow = '';
  };

  onMount(() => {
    // Close menu when escape key is pressed
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && $isMenuOpen) {
        closeMenu();
      }
    };

    // Handle swipe down to close
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (touchEndY - touchStartY > 100) { // If swiped down more than 100px
        closeMenu();
      }
      // Reset values
      touchStartY = 0;
      touchEndY = 0;
    };

    if (menuContent) {
      menuContent.addEventListener('touchstart', handleTouchStart, { passive: true });
      menuContent.addEventListener('touchmove', handleTouchMove, { passive: true });
      menuContent.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
      if (menuContent) {
        menuContent.removeEventListener('touchstart', handleTouchStart);
        menuContent.removeEventListener('touchmove', handleTouchMove);
        menuContent.removeEventListener('touchend', handleTouchEnd);
      }
    };
  });

  // Watch for menu open/close to trigger animations
  $: if ($isMenuOpen && menuLinks && menuFooter && menuHeader) {
    // Animation for open
    animateMenuOpen();
  } else if (!$isMenuOpen && menuLinks && menuFooter && menuHeader) {
    // Animation for close
    animateMenuClose();
  }

  function animateMenuOpen() {
    const links = menuLinks.querySelectorAll('.menu-link');
    const icons = menuHeader.querySelectorAll('.menu-action-icon');
    const logo = menuHeader.querySelector('.menu-brand-logo');

    // Reset any previous animations
    gsap.killTweensOf([links, menuFooter, icons, logo]);

    // Preset the initial state
    gsap.set([links, menuFooter], {
      y: 30,
      opacity: 0
    });

    gsap.set([icons, logo], {
      opacity: 0,
      y: -10
    });

    // Create a main timeline for better control and smoother sequencing
    const tl = gsap.timeline({
      defaults: {
        ease: "power3.out"
      }
    });

    // Animate header elements
    tl.to(logo, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out"
    }, 0.1);

    tl.to(icons, {
      opacity: 1,
      y: 0,
      stagger: 0.08,
      duration: 0.4,
      ease: "power2.out"
    }, 0.2);

    // Animate links with a more elegant stagger
    tl.to(links, {
      y: 0,
      opacity: 1,
      stagger: 0.08, // Faster stagger for more responsive feel
      duration: 0.5, // Slightly faster
      ease: "back.out(1.4)" // Add a slight bounce effect
    }, 0.3);

    // Animate footer
    tl.to(menuFooter, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, 0.5);
  }

  function animateMenuClose() {
    // Add a smooth exit animation instead of just resetting
    const links = menuLinks.querySelectorAll('.menu-link');
    const icons = menuHeader.querySelectorAll('.menu-action-icon');
    const logo = menuHeader.querySelector('.menu-brand-logo');

    // Create a timeline for exit animation
    const tl = gsap.timeline({
      defaults: {
        ease: "power2.in",
        duration: 0.3
      }
    });

    // Animate out in reverse order
    tl.to(menuFooter, {
      y: 20,
      opacity: 0
    }, 0);

    tl.to(links, {
      y: 20,
      opacity: 0,
      stagger: 0.05
    }, 0);

    tl.to([icons, logo], {
      y: -10,
      opacity: 0,
      stagger: 0.05
    }, 0.1);

    // After animation completes, reset to initial state for next opening
    tl.call(() => {
      gsap.set([links, menuFooter], {
        y: 30,
        opacity: 0
      });

      gsap.set([icons, logo], {
        opacity: 0,
        y: -10
      });
    });
  }

  // Show a hint for swipe gesture
  $: if ($isMenuOpen) {
    setTimeout(() => {
      const swipeHint = document.querySelector('.swipe-hint');
      if (swipeHint) {
        gsap.fromTo(swipeHint,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 1.5 }
        );

        // Hide hint after showing
        setTimeout(() => {
          gsap.to(swipeHint, { opacity: 0, duration: 0.5, delay: 2 });
        }, 2000);
      }
    }, 500);
  }
</script>

<div class="fullscreen-menu" class:open={$isMenuOpen}>
  <div class="menu-glass-layer"></div>
  <div class="menu-content" bind:this={menuContent}>
    <!-- Menu Header with Logo and Icons -->
    <div class="menu-header" bind:this={menuHeader}>
      <div class="menu-header-inner">
        <a href="/" class="menu-brand-logo" on:click={closeMenu}>Pransh</a>

        <div class="menu-actions">
          <button
            class="menu-action-icon"
            aria-label="Search"
            on:click={() => {
              closeMenu();
              openSearch();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <a href="/account" class="menu-action-icon hidden sm:flex" aria-label="Account" on:click={closeMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </a>

          <a href="/wishlist" class="menu-action-icon relative" aria-label="Wishlist" on:click={closeMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {#if $wishlistCount > 0}
              <span class="count-badge absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center">
                {$wishlistCount}
              </span>
            {/if}
          </a>

          <a href="/cart" class="menu-action-icon relative" aria-label="Cart" on:click={closeMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {#if $cartCount > 0}
              <span class="count-badge absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center">
                {$cartCount}
              </span>
            {/if}
          </a>

          <button class="menu-close-button" on:click={closeMenu} aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Swipe down hint (mobile only) -->
    <div class="swipe-hint md:hidden">
      <div class="swipe-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
      <span>Swipe down to close</span>
    </div>

    <nav class="menu-nav">
      <ul class="menu-links" bind:this={menuLinks}>
        <li>
          <a href="/" class="menu-link" on:click={closeMenu}>Home</a>
        </li>

        <li>
          <a href="/shop" class="menu-link" on:click={closeMenu}>Shop</a>
        </li>

        <li>
          <a href="/about" class="menu-link" on:click={closeMenu}>About & Contact</a>
        </li>
      </ul>
    </nav>

    <div class="menu-footer mt-auto p-4 sm:p-6 md:p-8 border-t border-gray-200" bind:this={menuFooter}>
      <div class="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 md:gap-6">
        <div class="flex gap-4 sm:gap-6">
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
    display: flex;
    flex-direction: column;
    z-index: 30; /* Ensure menu is above all headers */
    transform: translateY(-100%);
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); /* Smoother easing for more natural feel */
    pointer-events: none;
    overflow: hidden;
    will-change: transform; /* Optimize for animation performance */
  }

  .fullscreen-menu.open {
    transform: translateY(0);
    pointer-events: all;
  }

  .menu-glass-layer {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: -1;
    overflow: hidden;
  }

  .menu-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0 1rem; /* Reduced horizontal padding for mobile */
    position: relative;
    max-width: 1320px;
    width: 100%;
    margin: 0 auto;
  }

  /* Menu Header */
  .menu-header {
    padding: 1rem 0; /* Reduced padding for mobile */
    opacity: 1;
  }

  .menu-header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .menu-brand-logo {
    font-family: var(--heading-font);
    font-size: 1.75rem; /* Reduced font size for mobile */
    font-weight: 600;
    color: var(--color-gold);
    letter-spacing: 0.05em;
    transition: transform 0.3s ease;
  }

  .menu-brand-logo:hover {
    transform: scale(1.05);
  }

  .menu-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem; /* Reduced from 1.5rem for mobile */
  }

  .menu-action-icon {
    width: 2.25rem; /* Reduced from 2.5rem for mobile */
    height: 2.25rem; /* Reduced from 2.5rem for mobile */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-charcoal);
    transition: all 0.3s ease;
    position: relative;
    background-color: rgba(0, 0, 0, 0.03);
  }

  .menu-action-icon:hover {
    background-color: rgba(212, 175, 55, 0.1);
    color: var(--color-gold);
    transform: translateY(-2px);
  }

  .menu-close-button {
    width: 2.25rem; /* Reduced from 2.5rem for mobile */
    height: 2.25rem; /* Reduced from 2.5rem for mobile */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-charcoal);
    background-color: rgba(0, 0, 0, 0.03);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .menu-close-button:hover {
    background-color: rgba(212, 175, 55, 0.1);
    color: var(--color-gold);
    transform: rotate(90deg);
  }

  /* Swipe hint */
  .swipe-hint {
    position: absolute;
    top: 5rem;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0;
    color: rgba(0, 0, 0, 0.5);
    font-size: 0.85rem;
  }

  .swipe-icon {
    margin-bottom: 0.5rem;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: translateY(0);
      opacity: 0.8;
    }
    50% {
      transform: translateY(5px);
      opacity: 1;
    }
    100% {
      transform: translateY(0);
      opacity: 0.8;
    }
  }

  .menu-nav {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .menu-links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 0;
  }

  .menu-link {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.75rem; /* Smaller font size for mobile */
    position: relative;
    display: inline-block;
    color: var(--color-charcoal);
    transition: color 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); /* More responsive and bouncy */
    transform-origin: center;
    padding: 0.2rem 0.5rem;
    letter-spacing: 0.02em;
    will-change: transform, color; /* Optimize for animation performance */
  }

  .menu-link::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1.5px;
    background-color: var(--color-gold);
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); /* Smoother transition */
    opacity: 0.7;
    will-change: transform; /* Optimize for animation performance */
  }

  .menu-link:hover {
    color: var(--color-gold);
    transform: scale(1.05);
  }

  .menu-link:hover::before {
    transform: scaleX(1);
    transform-origin: left;
  }

  .menu-footer {
    opacity: 0;
  }

  .footer-social-icon {
    width: 2.25rem; /* Smaller size for mobile */
    height: 2.25rem; /* Smaller size for mobile */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(212, 175, 55, 0.1);
    color: var(--color-charcoal);
    transition: all 0.3s ease;
  }

  .footer-social-icon:hover {
    background-color: var(--color-gold);
    color: white;
    transform: translateY(-3px);
  }

  /* Gold background for cart count */
  .bg-gold, .count-badge {
    background-color: var(--color-gold);
  }

  @media (min-width: 640px) {
    .menu-actions {
      gap: 1.25rem; /* Increased for tablets and above */
    }

    .menu-action-icon, .menu-close-button {
      width: 2.5rem; /* Back to original size for tablets and above */
      height: 2.5rem; /* Back to original size for tablets and above */
    }

    .menu-header {
      padding: 1.25rem 0; /* Increased padding for tablets */
    }

    .menu-brand-logo {
      font-size: 2rem; /* Original size for tablets and above */
    }

    .menu-content {
      padding: 0 1.5rem; /* Increased horizontal padding for tablets */
    }

    .menu-link {
      font-size: 2rem; /* Increased font size for tablets */
    }

    .footer-social-icon {
      width: 2.5rem; /* Original size for tablets and up */
      height: 2.5rem; /* Original size for tablets and up */
    }
  }

  @media (min-width: 768px) {
    .menu-link {
      font-size: 2.5rem;
    }

    .menu-actions {
      gap: 1.5rem; /* Original gap for desktops */
    }

    .menu-header {
      padding: 1.5rem 0; /* Original padding for desktops */
    }
  }

  @media (min-width: 1024px) {
    .menu-link {
      font-size: 3rem;
    }

    .menu-content {
      padding: 0 1.5rem; /* Maintain padding for large screens */
    }
  }
</style>
