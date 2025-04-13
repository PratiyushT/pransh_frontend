<script lang="ts">
  import '../app.css';
  import { onMount, afterUpdate } from 'svelte';
  import { page } from '$app/stores';
  import { navigating } from '$app/stores';
  import { isLoading } from '$lib/stores/index';
  import gsap from 'gsap';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Menu from '$lib/components/Menu.svelte';
  import CustomCursor from '$lib/components/CustomCursor.svelte';
  import PageLoader from '$lib/components/PageLoader.svelte';

  let mainContent: HTMLElement;
  let pageWrapper: HTMLElement;
  let currentPath: string;
  let timeline: gsap.core.Timeline;

  onMount(() => {
    // Initialize smooth page transitions
    timeline = gsap.timeline({ paused: true });

    // Make sure pageWrapper exists before proceeding
    if (pageWrapper) {
      // Set initial page state
      gsap.set(pageWrapper, {
        opacity: 1,
        y: 0
      });

      // Reveal animation when page first loads
      gsap.from(pageWrapper, {
        duration: 1,
        opacity: 0,
        y: 10,
        ease: "power2.out",
        clearProps: "all",
        onComplete: () => {
          // Mark page as loaded
          $isLoading = false;
        }
      });
    } else {
      // If pageWrapper isn't available yet, just mark page as loaded
      setTimeout(() => {
        $isLoading = false;
      }, 800);
    }

    // Store current path for detecting route changes
    currentPath = $page.url.pathname;
  });

  // Handle page transitions when routes change
  $: if ($navigating && pageWrapper && !$isLoading) {
    // Set loading state
    $isLoading = true;

    // Fade out current page
    gsap.to(pageWrapper, {
      duration: 0.4,
      opacity: 0,
      y: -15,
      ease: "power2.in"
    });
  }

  // After navigation completes, fade in new page content
  $: if (!$navigating && $page.url.pathname !== currentPath && pageWrapper) {
    currentPath = $page.url.pathname;

    // Reset scroll position
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);

    // Fade in new page
    gsap.fromTo(pageWrapper,
      { opacity: 0, y: 15 },
      {
        duration: 0.6,
        opacity: 1,
        y: 0,
        ease: "power3.out",
        clearProps: "all",
        onComplete: () => {
          $isLoading = false;
        }
      }
    );
  }
</script>

{#if $isLoading}
  <PageLoader />
{/if}

<div class="site-wrapper" class:page-loading={$isLoading}>
  <Header />
  <Menu />

  <main class="main-content" bind:this={mainContent}>
    <div class="page-wrapper" bind:this={pageWrapper}>
      <slot />
    </div>
  </main>

  <Footer />
</div>

<CustomCursor />

<style>
  .site-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  .main-content {
    flex-grow: 1;
    position: relative;
  }

  .page-wrapper {
    width: 100%;
  }

  .site-wrapper.page-loading {
    pointer-events: none;
  }
</style>
