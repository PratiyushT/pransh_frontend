<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { navigating } from "$app/stores";
  import { isLoading, syncWishlistToCookies } from "$lib";
  import { initializeCart, cartLoading, cartError } from "$lib/cart/cartStore";
  import gsap from "gsap";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import Menu from "$lib/components/Menu.svelte";
  import PageLoader from "$lib/components/PageLoader.svelte";

  let mainContent: HTMLElement;
  let pageWrapper: HTMLElement;
  let currentPath: string;
  let timeline: gsap.core.Timeline;
  let isMobile = false;

  onMount(async () => {
    // Sync wishlist from localStorage to cookies on app initialization
    syncWishlistToCookies();

    // Initialize the cart
    await initializeCart();

    // Check if mobile/touch device
    isMobile =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

    // Initialize smooth page transitions
    timeline = gsap.timeline({ paused: true });

    // Make sure pageWrapper exists before proceeding
    if (pageWrapper) {
      // Set initial page state
      gsap.set(pageWrapper, {
        opacity: 1,
        y: 0,
      });

      // Reveal animation when page first loads - faster on mobile
      gsap.from(pageWrapper, {
        duration: isMobile ? 0.7 : 1,
        opacity: 0,
        y: isMobile ? 5 : 10, // Smaller movement on mobile for smoother experience
        ease: "power2.out",
        clearProps: "all",
        onComplete: () => {
          // Mark page as loaded
          $isLoading = false;
        },
      });
    } else {
      // If pageWrapper isn't available yet, just mark page as loaded
      setTimeout(
        () => {
          $isLoading = false;
        },
        isMobile ? 500 : 800
      ); // Faster timeout on mobile
    }

    // Store current path for detecting route changes
    currentPath = page.url.pathname;

    // Add passive touch listeners for better scrolling performance on mobile
    if (isMobile) {
      addPassiveTouchListeners();
    }
  });

  function addPassiveTouchListeners() {
    // This improves scrolling performance on mobile devices
    document.addEventListener("touchstart", () => {}, { passive: true });
    document.addEventListener("touchmove", () => {}, { passive: true });

    // Apply will-change to improve scroll performance on critical elements
    const criticalElements = document.querySelectorAll(
      ".hero, .product-grid, .section"
    );
    criticalElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.willChange = "transform";
        // Remove will-change after animation completes to free up resources
        setTimeout(() => {
          el.style.willChange = "auto";
        }, 1000);
      }
    });
  }

  // Handle page transitions when routes change
  $: if ($navigating && pageWrapper && !$isLoading) {
    // Set loading state
    $isLoading = true;

    // Fade out current page - faster on mobile
    gsap.to(pageWrapper, {
      duration: isMobile ? 0.3 : 0.4,
      opacity: 0,
      y: isMobile ? -10 : -15, // Smaller movement on mobile
      ease: "power2.in",
    });
  }

  // After navigation completes, fade in new page content
  $: if (!$navigating && page.url.pathname !== currentPath && pageWrapper) {
    currentPath = page.url.pathname;

    // Reset scroll position
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);

    // Fade in new page - faster animations on mobile
    gsap.fromTo(
      pageWrapper,
      { opacity: 0, y: isMobile ? 10 : 15 },
      {
        duration: isMobile ? 0.4 : 0.6,
        opacity: 1,
        y: 0,
        ease: "power3.out",
        clearProps: "all",
        onComplete: () => {
          $isLoading = false;

          // Re-apply passive touch listeners after navigation
          if (isMobile) {
            addPassiveTouchListeners();
          }
        },
      }
    );
  }
</script>

{#if $isLoading || $cartLoading}
  <PageLoader />
{/if}

<div
  class="site-wrapper"
  class:page-loading={$isLoading || $cartLoading}
  class:mobile={isMobile}
>
  <Header />
  <Menu />

  {#if $cartError}
    <div class="cart-error-notification">
      <div class="cart-error-content">
        <span class="cart-error-icon">⚠️</span>
        <span>{$cartError}</span>
        <button
          class="cart-error-close"
          on:click={() => cartError.set(null)}
        >
          ×
        </button>
      </div>
    </div>
  {/if}

  <main class="main-content" bind:this={mainContent}>
    <div class="page-wrapper" bind:this={pageWrapper}>
      <slot />
    </div>
  </main>

  <Footer />
</div>

<style>
  .site-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    margin: 0;
    padding: 0;
  }

  .main-content {
    flex-grow: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0; /* Prevent over-expansion */
  }

  .page-wrapper {
    width: 100%;
    flex: 1 0 auto; /* Don't shrink */
  }

  .site-wrapper.page-loading {
    pointer-events: none;
  }

  /* Mobile optimizations */
  .site-wrapper.mobile .main-content {
    /* Improve mobile scrolling feel */
    -webkit-overflow-scrolling: touch;
  }

  /* Cart error notification */
  .cart-error-notification {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    width: 90%;
    max-width: 500px;
    background-color: var(--color-cream, #f9f6f0);
    border: 1px solid var(--color-gold, #ad974f);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 0;
    animation: slideDown 0.3s ease-out forwards;
  }

  .cart-error-content {
    display: flex;
    align-items: center;
    padding: 12px 16px;
  }

  .cart-error-icon {
    margin-right: 12px;
  }

  .cart-error-close {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 20px;
    line-height: 1;
    padding: 0;
    cursor: pointer;
    color: #666;
  }

  .cart-error-close:hover {
    color: #000;
  }

  @keyframes slideDown {
    from {
      transform: translate(-50%, -20px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    /* Add specific mobile styles if needed */
    .page-wrapper {
      overflow-x: hidden; /* Prevent horizontal scroll on mobile */
    }

    .cart-error-notification {
      top: 60px;
      width: 95%;
    }
  }
</style>
