<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { navigating } from "$app/stores";
  import { isLoading, syncWishlistToCookies } from "$lib";
  import gsap from "gsap";
  import Header from "$lib/components/LayoutElements/Header.svelte";
  import Footer from "$lib/components/LayoutElements/Footer.svelte";
  import Menu from "$lib/components/UI/Menu.svelte";
  import PageLoader from "$lib/components/Loaders/PageLoader.svelte";

  let mainContent: HTMLElement;
  let pageWrapper: HTMLElement;
  let currentPath: string;
  let timeline: gsap.core.Timeline;
  let isMobile = false;

  onMount(() => {
    // Sync wishlist from localStorage to cookies on app initialization
    syncWishlistToCookies();

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

{#if $isLoading}
  <PageLoader />
{/if}

<div
  class="site-wrapper"
  class:page-loading={$isLoading}
  class:mobile={isMobile}
>
  <Header />
  <Menu />

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

  @media (max-width: 768px) {
    /* Add specific mobile styles if needed */
    .page-wrapper {
      overflow-x: hidden; /* Prevent horizontal scroll on mobile */
    }
  }
</style>
