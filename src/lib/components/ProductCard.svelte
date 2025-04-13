<script lang="ts">
  import { formatPrice } from '$lib/utils/data';
  import type { Product } from '$lib/types';
  import { onMount, createEventDispatcher } from 'svelte';
  import gsap from 'gsap';

  export let product: Product;

  const dispatch = createEventDispatcher();

  // Calculate lowest and highest price
  const prices = product.variants.map(variant => variant.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Get primary image
  const primaryImage = product.variants[0]?.images?.[0]?.url || '/images/product-placeholder.jpg';
  const secondaryImage = product.variants[0]?.images?.[1]?.url || primaryImage;

  // Format price range
  const priceDisplay = minPrice === maxPrice
    ? formatPrice(minPrice)
    : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;

  // Animation state
  let cardElement: HTMLElement;
  let imageContainer: HTMLElement;
  let isHovered = false;
  let isLoaded = false;
  let isTouchDevice = false;
  let timeline: gsap.core.Timeline;

  // Fallback for images that fail to load
  function handleImageError(event) {
    event.currentTarget.src = '/images/product-placeholder.jpg';
  }

  onMount(() => {
    if (!cardElement || !imageContainer) return;

    // Check if device supports touch
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Initialize GSAP timeline
    timeline = gsap.timeline({ paused: true });

    try {
      // Setup animations
      timeline
        .to(cardElement, {
          y: -15,
          duration: 0.5,
          ease: "power3.out",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
        }, 0)
        .to(imageContainer.querySelector('.primary-image'), {
          scale: 1.08,
          duration: 0.7,
          ease: "power2.out"
        }, 0);

      const secondaryImg = imageContainer.querySelector('.secondary-image');
      if (secondaryImg) {
        timeline.to(secondaryImg, {
          opacity: 1,
          scale: 1.08,
          duration: 0.7,
          ease: "power2.out"
        }, 0);
      }

      const overlay = cardElement.querySelector('.product-card-overlay');
      if (overlay) {
        timeline.to(overlay, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        }, 0);
      }

      const actions = cardElement.querySelector('.product-card-actions');
      if (actions) {
        timeline.to(actions, {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.5)"
        }, 0.1);
      }

      const cta = cardElement.querySelector('.product-card-cta');
      if (cta) {
        timeline.to(cta, {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.5)"
        }, 0.2);
      }

      const title = cardElement.querySelector('.product-card-title');
      if (title) {
        timeline.to(title, {
          color: "var(--color-gold)",
          duration: 0.4,
          ease: "power2.out"
        }, 0);
      }
    } catch (error) {
      console.error("Error setting up animations:", error);
    }

    // Add loaded class after component is mounted for fade-in effect
    gsap.to(cardElement, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: Math.random() * 0.3, // Staggered appearance
      onComplete: () => {
        isLoaded = true;
      }
    });
  });

  const handleMouseEnter = () => {
    if (!isTouchDevice && timeline) {
      isHovered = true;
      timeline.play();
    }
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice && timeline) {
      isHovered = false;
      timeline.reverse();
    }
  };

  const handleTouchStart = () => {
    if (isTouchDevice && timeline) {
      isHovered = !isHovered;
      if (isHovered) {
        timeline.play();
      } else {
        timeline.reverse();
      }
    }
  };

  // Quick view handler
  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch('quickview', { product });
  };
</script>

<a
  href={`/product/${product._id}`}
  class="product-card-wrapper"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:touchstart={handleTouchStart}
  bind:this={cardElement}
>
  <div class="product-card {isLoaded ? 'loaded' : ''} {isHovered ? 'hovered' : ''}">
    <div class="product-card-image-container" bind:this={imageContainer}>
      <img
        src={primaryImage}
        alt={product.name}
        class="product-card-image primary-image"
        on:error={handleImageError}
      >
      {#if secondaryImage && secondaryImage !== primaryImage}
        <img
          src={secondaryImage}
          alt={`${product.name} - Alternate view`}
          class="product-card-image secondary-image"
          on:error={handleImageError}
        >
      {/if}

      <div class="product-card-overlay">
        <div class="product-card-actions">
          <button class="product-card-action wishlist" aria-label="Add to wishlist">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button class="product-card-action quick-view"
            aria-label="Quick view"
            on:click={handleQuickView}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </button>
        </div>
        <div class="product-card-cta">
          <span>View Details</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </div>

      {#if product.isFeatured}
        <div class="product-card-badge">Featured</div>
      {/if}
    </div>

    <div class="product-card-info">
      <div class="product-card-category">{product.category}</div>
      <h3 class="product-card-title">{product.name}</h3>
      <div class="product-card-price">{priceDisplay}</div>
      {#if product.rating > 0}
        <div class="product-card-rating">
          {#each Array(5) as _, i}
            <span class="star {i < Math.round(product.rating) ? 'filled' : ''}">★</span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</a>

<style>
  .product-card-wrapper {
    display: block;
    position: relative;
    margin-bottom: 1.5rem;
    height: 100%;
    perspective: 1200px;
    transform-style: preserve-3d;
  }

  .product-card {
    position: relative;
    background-color: var(--color-white);
    height: 100%;
    display: flex;
    flex-direction: column;
    will-change: transform, box-shadow;
    opacity: 0;
    transform: translateY(15px);
    z-index: 1;
    border-radius: 2px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }

  .product-card.loaded {
    opacity: 1;
    transform: translateY(0);
  }

  .product-card-image-container {
    position: relative;
    overflow: hidden;
    padding-bottom: 130%;
    background-color: var(--color-cream-dark);
  }

  .product-card-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    will-change: transform, opacity;
  }

  .primary-image {
    opacity: 1;
  }

  .secondary-image {
    opacity: 0;
    z-index: 2;
  }

  .product-card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%);
    z-index: 3;
    opacity: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1.25rem;
    will-change: opacity;
  }

  .product-card-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    transform: translateY(-15px);
    opacity: 0;
    will-change: transform, opacity;
  }

  .product-card-action {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: var(--color-white);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    color: var(--color-charcoal);
  }

  .product-card-action:hover {
    background-color: var(--color-gold);
    color: var(--color-white);
    transform: scale(1.1) translateY(-3px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }

  .product-card-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.85rem 1.25rem;
    border-radius: 2px;
    opacity: 0;
    transform: translateY(15px);
    will-change: transform, opacity;
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  .product-card-cta svg {
    transition: transform 0.3s ease;
  }

  .product-card-cta:hover svg {
    transform: translateX(5px);
  }

  .product-card-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.3rem 0.6rem;
    z-index: 5;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .product-card-info {
    padding: 1.5rem;
    background-color: var(--color-white);
    z-index: 2;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    border-top: 1px solid rgba(0,0,0,0.03);
  }

  .product-card-category {
    font-size: 0.75rem;
    color: var(--color-charcoal-light);
    margin-bottom: 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .product-card-title {
    font-family: var(--heading-font);
    font-weight: 500;
    font-size: 1.4rem;
    line-height: 1.2;
    margin-bottom: 0.5rem;
    transition: color 0.3s ease;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .product-card-price {
    color: var(--color-gold-dark);
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
  }

  .product-card-rating {
    margin-top: auto;
    display: flex;
    gap: 0.2rem;
    font-size: 0.95rem;
  }

  .star {
    color: rgba(0, 0, 0, 0.2);
  }

  .star.filled {
    color: var(--color-gold);
  }

  @media (max-width: 768px) {
    .product-card-overlay {
      background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%);
      opacity: 0.7;
    }

    .product-card-cta {
      opacity: 1;
      transform: translateY(0);
    }

    .product-card-title {
      font-size: 1.25rem;
    }
  }
</style>
