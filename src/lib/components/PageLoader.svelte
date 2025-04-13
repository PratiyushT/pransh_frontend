<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { isLoading } from '$lib/stores/index';
  import gsap from 'gsap';

  let loaderElement: HTMLElement;
  let loaderText: HTMLElement;
  let loaderLine: HTMLElement;
  let loaderBg: HTMLElement;
  let isAnimating = false;
  let timeline: gsap.core.Timeline;

  onMount(() => {
    // Set initial animation state
    isAnimating = true;

    // Create animation timeline
    timeline = gsap.timeline({
      paused: false,
      onComplete: () => {
        // After the loader animation completes, hide loader
        setTimeout(() => {
          $isLoading = false;
        }, 300);
      }
    });

    // Add animations to the timeline
    timeline
      // Initial setup
      .set(loaderText, { y: 100, opacity: 0 })
      .set(loaderLine, { width: 0, opacity: 0 })

      // Animate elements in
      .to(loaderText, {
        duration: 1.2,
        y: 0,
        opacity: 1,
        ease: "power3.out"
      })
      .to(loaderLine, {
        duration: 1,
        width: "100px",
        opacity: 1,
        ease: "power2.inOut"
      }, "-=0.7")

      // Hold for a moment
      .to({}, { duration: 0.8 })

      // Animate out
      .to(loaderText, {
        duration: 0.8,
        y: -80,
        opacity: 0,
        ease: "power2.in"
      })
      .to(loaderLine, {
        duration: 0.5,
        width: "30px",
        opacity: 0,
        ease: "power2.in"
      }, "-=0.6")
      .to(loaderBg, {
        duration: 0.8,
        yPercent: -100,
        ease: "power3.inOut"
      }, "-=0.3");
  });

  onDestroy(() => {
    // Clean up
    if (timeline) {
      timeline.kill();
    }
  });
</script>

<div class="page-loader" bind:this={loaderElement} class:loaded={!$isLoading} class:animating={isAnimating}>
  <div class="page-loader-bg" bind:this={loaderBg}></div>
  <div class="page-loader-content">
    <h1 class="page-loader-text" bind:this={loaderText}>PRANSH</h1>
    <div class="page-loader-line" bind:this={loaderLine}></div>
  </div>
</div>

<style>
  .page-loader {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: all;
    overflow: hidden;
  }

  .page-loader.loaded {
    pointer-events: none;
  }

  .page-loader-bg {
    position: absolute;
    inset: 0;
    background-color: var(--color-cream);
    z-index: 1;
  }

  .page-loader-content {
    position: relative;
    z-index: 2;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .page-loader-text {
    font-family: var(--heading-font);
    font-size: 3rem;
    letter-spacing: 0.15em;
    color: var(--color-gold);
    font-weight: 500;
    margin: 0;
    opacity: 0;
  }

  .page-loader-line {
    height: 1px;
    background-color: var(--color-gold);
    width: 0;
    opacity: 0;
  }

  @media (min-width: 768px) {
    .page-loader-text {
      font-size: 4rem;
    }
  }

  @media (min-width: 1024px) {
    .page-loader-text {
      font-size: 5rem;
    }

    .page-loader-line {
      height: 2px;
    }
  }
</style>
