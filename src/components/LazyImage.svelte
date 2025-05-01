<script lang="ts">
  import { onMount } from 'svelte';
  import SkeletonLoader from './SkeletonLoader.svelte';

  export let src: string;
  export let alt = '';
  export let className = '';
  export let width = '100%';
  export let height = '100%';
  export let borderRadius = '0px';

  let loaded = false;
  let imageElement: HTMLImageElement;
  let observer: IntersectionObserver;

  onMount(() => {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              imageElement.src = src;
              observer.unobserve(imageElement);
            }
          });
        },
        {
          rootMargin: '50px'
        }
      );

      observer.observe(imageElement);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      imageElement.src = src;
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  });

  function handleLoad() {
    loaded = true;
  }
</script>

<div class="lazy-image-container" style="width: {width}; height: {height};">
  {#if !loaded}
    <SkeletonLoader {width} {height} {borderRadius} />
  {/if}
  
  <img
    bind:this={imageElement}
    {alt}
    class="{className} {loaded ? 'loaded' : ''}"
    on:load={handleLoad}
    loading="lazy"
  />
</div>

<style>
  .lazy-image-container {
    position: relative;
    overflow: hidden;
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  img.loaded {
    opacity: 1;
  }
</style> 