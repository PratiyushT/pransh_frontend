<script lang="ts">
  import { formatPrice } from '$lib/utils/data';
  import type { Product } from '$lib/types';
  import { onMount, createEventDispatcher } from 'svelte';
  import gsap from 'gsap';
  import { isInWishlist, toggleWishlist } from '$lib';
  import ColorPieChart from '$lib/components/ColorPieChart.svelte';

  export let product: Product;

  $: productSlug = typeof product.slug === 'string'
    ? product.slug
    : product.slug?.current || '';

  const dispatch = createEventDispatcher();

  let isWishlisted = isInWishlist(product._id);

  const prices = product.variants.map(variant => variant.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const primaryImage = product.image;
  const secondaryImage = product.variants[0]?.images?.[1]?.url || primaryImage;

  const uniqueColors = Array.from(new Set(product.variants.map(variant =>
    variant.color && variant.color._id ? JSON.stringify(variant.color) : null
  ))).filter(color => color !== null).map(color => JSON.parse(color));

  const priceDisplay = minPrice === maxPrice
    ? formatPrice(minPrice)
    : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;

  let cardElement: HTMLElement;
  let imageContainer: HTMLElement;
  let isHovered = false;
  let isLoaded = false;
  let isTouchDevice = false;
  let timeline: gsap.core.Timeline;
  let mainCartIcon: HTMLElement;
  let wishlistButton: HTMLElement;

  function handleImageError(event) {
    event.currentTarget.src = '/images/product-placeholder.jpg';
  }

  let primaryImageRef: HTMLImageElement;
  let secondaryImageRef: HTMLImageElement;

  function setupLazyLoading() {
    if (typeof IntersectionObserver !== 'undefined') {
      const options = {
        rootMargin: '200px 0px',
        threshold: 0.01
      };

      const loadImage = (img: HTMLImageElement) => {
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          gsap.fromTo(img,
            { opacity: 0 },
            { duration: 0.3, opacity: 1, ease: "power2.out" }
          );
        }
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadImage(entry.target as HTMLImageElement);
            observer.unobserve(entry.target);
          }
        });
      }, options);

      if (primaryImageRef) observer.observe(primaryImageRef);
      if (secondaryImageRef) observer.observe(secondaryImageRef);
    }
  }

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist(product._id);
    isWishlisted = isInWishlist(product._id);

    const btn = e.currentTarget;

    const ripple = document.createElement('div');
    ripple.classList.add('wishlist-ripple');
    ripple.style.position = 'absolute';
    ripple.style.zIndex = '1';
    ripple.style.top = '50%';
    ripple.style.left = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.width = '10px';
    ripple.style.height = '10px';
    ripple.style.backgroundColor = isWishlisted ? 'var(--color-gold)' : 'rgba(0,0,0,0.2)';
    ripple.style.borderRadius = '50%';
    ripple.style.pointerEvents = 'none';
    btn.appendChild(ripple);

    gsap.fromTo(btn,
      { scale: 1 },
      { scale: 1.2, duration: 0.15, ease: "power1.out", yoyo: true, repeat: 1 }
    );

    gsap.to(ripple, {
      duration: 0.5,
      scale: 15,
      opacity: 0,
      ease: "power1.out",
      onComplete: () => {
        if (btn.contains(ripple)) {
          btn.removeChild(ripple);
        }
      }
    });
  };

  onMount(() => {
    if (!cardElement || !imageContainer) return;

    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 ||
                   (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    setupLazyLoading();

    timeline = gsap.timeline({ paused: true });

    try {
      timeline
        .to(cardElement, {
          y: -10,
          duration: 0.25,
          ease: "power2.out",
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.09), 0 0 10px rgba(212, 175, 55, 0.25), 0 0 15px rgba(212, 175, 55, 0.12)"
        }, 0)
        .to(imageContainer.querySelector('.primary-image'), {
          scale: 1.05,
          duration: 0.3,
          ease: "power1.out"
        }, 0);

      const cardGlow = document.createElement('div');
      cardGlow.classList.add('card-glow-effect');
      cardElement.appendChild(cardGlow);

      timeline.to(cardGlow, {
        opacity: 1,
        duration: 0.25,
        ease: "power1.out"
      }, 0);

      const secondaryImg = imageContainer.querySelector('.secondary-image');
      if (secondaryImg) {
        timeline.to(secondaryImg, {
          opacity: 1,
          scale: 1.05,
          duration: 0.3,
          ease: "power1.out"
        }, 0);
      }

      const overlay = cardElement.querySelector('.product-card-overlay');
      if (overlay) {
        timeline.to(overlay, {
          opacity: 1,
          duration: 0.25,
          ease: "power1.out"
        }, 0);
      }

      const actions = cardElement.querySelector('.product-card-actions');
      if (actions) {
        timeline.to(actions, {
          y: 0,
          opacity: 1,
          duration: 0.25,
          ease: "back.out(1.7)"
        }, 0.03);
      }

      const cta = cardElement.querySelector('.product-card-cta');
      if (cta) {
        timeline.to(cta, {
          y: 0,
          opacity: 1,
          duration: 0.25,
          ease: "back.out(1.7)"
        }, 0.07);
      }

      const title = cardElement.querySelector('.product-card-title');
      if (title) {
        timeline.to(title, {
          color: "var(--color-gold)",
          duration: 0.2,
          ease: "power1.out"
        }, 0);
      }
    } catch (error) {
      console.error("Error setting up animations:", error);
    }

    gsap.to(cardElement, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out",
      delay: Math.random() * 0.15,
      onComplete: () => {
        isLoaded = true;
      }
    });

    mainCartIcon = document.querySelector('.header .header-action-icon[aria-label="Cart"]');
    if (!mainCartIcon) {
      mainCartIcon = document.querySelector('.header-sticky .header-action-icon[aria-label="Cart"]');
    }

    wishlistButton = cardElement.querySelector('.product-card-action.wishlist');

    setTimeout(() => {
      isWishlisted = isInWishlist(product._id);
    }, 100);
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

  const handleTouchStart = (e) => {
    if (isTouchDevice && timeline) {
      isHovered= !isHovered;
      if (isHovered) {
        timeline.play();
        setTimeout(() => {
          document.addEventListener('touchstart', handleTouchOutside);
        }, 10);
      } else {
        timeline.reverse();
      }
      e.preventDefault();
    }
  };

  const handleTouchOutside = (e) => {
    if (cardElement && !cardElement.contains(e.target)) {
      isHovered = false;
      timeline?.reverse();
      document.removeEventListener('touchstart', handleTouchOutside);
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch('quickView',  { product });
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch('quickView',  { product });
  };
</script>

<a
  href={`/product/${productSlug}`}
  class="product-card-wrapper"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:touchstart={handleTouchStart}
  bind:this={cardElement}
  data-sveltekit-preload-data="off"
>
  <div class="product-card {isLoaded ? 'loaded' : ''} {isHovered ? 'hovered' : ''}">
    <div class="product-card-image-container" bind:this={imageContainer}>
      <img
        src="/images/product-placeholder.jpg"
        data-src={primaryImage}
        alt={product.name}
        class="product-card-image primary-image"
        bind:this={primaryImageRef}
        on:error={handleImageError}
      >
      {#if secondaryImage && secondaryImage !== primaryImage}
        <img
          src="/images/product-placeholder.jpg"
          data-src={secondaryImage}
          alt={`${product.name} - Alternate view`}
          class="product-card-image secondary-image"
          bind:this={secondaryImageRef}
          on:error={handleImageError}
        >
      {/if}

      <div class="product-card-overlay">
        <div class="product-card-actions">
          <button
            class="product-card-action wishlist {isWishlisted ? 'active' : ''}"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            on:click={handleToggleWishlist}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button class="product-card-action add-to-cart"
            aria-label="Add to cart"
            on:click={handleQuickView}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
        </div>
        <div class="product-card-cta">
          <span>View Details</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      <div class="product-card-category">{typeof product.category === 'object' ? product.category?.name : product.category}</div>
      <h3 class="product-card-title">{product.name}</h3>

      {#if uniqueColors.length > 0}
        <div class="product-card-colors" aria-label="Available colors">
          {#each uniqueColors as color}
            {#if color.hex && Array.isArray(color.hex) && color.hex.length > 1}
              <div class="color-swatch-container" title={color.name || 'Color'}>
                <ColorPieChart hexColors={color.hex} size={14} border={true} borderWidth={1} borderColor="#e2e2e2" />
              </div>
            {:else}
              <div
                class="color-swatch-container"
                title={color.name || 'Color'}
              >
                <span
                  class="color-swatch"
                  style="background-color: {Array.isArray(color.hex) && color.hex[0] ? color.hex[0] : (typeof color.hex === 'string' ? color.hex : '#ccc')}"
                  aria-label={color.name || 'Color swatch'}
                ></span>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      <div class="product-card-price">{priceDisplay}</div>
      {#if product.rating > 0}
        <div class="product-card-rating">
          {#each Array(5) as _, i}
            <span class="star {i < Math.round(product.rating) ? 'filled' : ''}">★</span>
          {/each}
        </div>
      {/if}

      <button class="add-to-cart-button" on:click={handleAddToCart}>
        <span>Add to Cart</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      </button>
    </div>
  </div>
</a>

<style>
  .product-card-wrapper {
    display: block;
    position: relative;
    margin-bottom: 1rem;
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
    transition: all 0.25s ease;
  }

  .card-glow-effect {
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: radial-gradient(
      ellipse at center,
      rgba(212, 175, 55, 0.15) 0%,
      rgba(212, 175, 55, 0.05) 60%,
      rgba(212, 175, 55, 0) 70%
    );
    border-radius: 8px;
    pointer-events: none;
    z-index: -1;
    opacity: 0;
    filter: blur(15px);
    will-change: opacity;
    transition: opacity 0.25s ease;
  }

  .product-card.hovered {
    border-color: rgba(212, 175, 55, 0.3);
  }

  .product-card.hovered::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 2px;
    padding: 2px;
    background: linear-gradient(225deg, var(--color-gold-light), transparent, var(--color-gold));
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.7;
  }

  .product-card.loaded {
    opacity: 1;
    transform: translateY(0);
  }

  .product-card-image-container {
    position: relative;
    overflow: hidden;
    padding-bottom: 110%;
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
    transition: transform 0.25s ease;
  }

  .primary-image {
    opacity: 1;
  }

  .secondary-image {
    opacity: 0;
    z-index: 2;
    transition: opacity 0.25s ease;
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
    padding: 1rem;
    will-change: opacity;
    transition: opacity 0.25s ease;
  }

  .product-card-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    transform: translateY(-10px);
    opacity: 0;
    will-change: transform, opacity;
    transition: transform 0.25s ease, opacity 0.25s ease;
    z-index: 4;
  }

  .product-card-action {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background-color: var(--color-white);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.13);
    transition: all 0.25s ease;
    color: var(--color-charcoal);
    font-size: 1rem;
    padding: 0;
  }

  .product-card-action svg {
    width: 14px;
    height: 14px;
  }

  .product-card-action:hover {
    background-color: var(--color-gold);
    color: var(--color-white);
    transform: scale(1.07) translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.18);
  }

  .product-card-action.add-to-cart {
    background-color: var(--color-gold);
    color: var(--color-white);
  }

  .product-card-action.add-to-cart:hover {
    background-color: var(--color-gold-dark);
    transform: scale(1.11) translateY(-2px);
  }

  .product-card-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.6rem 0.8rem;
    border-radius: 2px;
    opacity: 0;
    transform: translateY(10px);
    will-change: transform, opacity;
    box-shadow: 0 3px 10px rgba(212, 175, 55, 0.22);
    transition: transform 0.25s ease, opacity 0.25s ease;
    z-index: 4;
    position: relative;
    width: fit-content;
    margin: 0 auto;
  }

  .product-card-cta svg {
    transition: transform 0.2s ease;
  }

  .product-card-cta:hover svg {
    transform: translateX(4px);
  }

  .product-card-badge {
    position: absolute;
    top: 0.7rem;
    left: 0.7rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    font-size: 0.65rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.22rem 0.45rem;
    z-index: 5;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.09);
  }

  .product-card-info {
    padding: 1rem;
    background-color: var(--color-white);
    z-index: 2;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    border-top: 1px solid rgba(0,0,0,0.03);
  }

  .product-card-category {
    font-size: 0.7rem;
    color: var(--color-charcoal-light);
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .product-card-title {
    font-family: var(--heading-font);
    font-weight: 500;
    font-size: 1.1rem;
    line-height: 1.2;
    margin-bottom: 0.4rem;
    transition: color 0.25s ease;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .product-card-colors {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
    margin-bottom: 4px;
  }

  .color-swatch-container {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .color-swatch-container:hover {
    transform: scale(1.07);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  .color-swatch {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  .product-card-price {
    color: var(--color-gold-dark);
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .product-card-rating {
    margin-bottom: 0.7rem;
    display: flex;
    gap: 0.18rem;
    font-size: 0.88rem;
  }

  .star {
    color: rgba(0, 0, 0, 0.18);
  }

  .star.filled {
    color: var(--color-gold);
  }

  .add-to-cart-button {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.6rem;
    background-color: var(--color-cream);
    border: 1px solid var(--color-gold);
    color: var(--color-gold);
    font-weight: 500;
    font-size: 0.85rem;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.25s ease;
    transform: translateY(5px);
    opacity: 0.9;
    position: relative;
    overflow: hidden;
  }

  .add-to-cart-button::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-100%) rotate(30deg);
    transition: none;
  }

  .product-card.hovered .add-to-cart-button::before {
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%) rotate(30deg);
    }
  }

  .add-to-cart-button:hover {
    background-color: var(--color-gold);
    color: var(--color-white);
    transform: translateY(0);
    opacity: 1;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.35);
  }

  :global(.flying-cart-item) {
    pointer-events: none;
  }

  @media (max-width: 768px) {
    .product-card-overlay {
      background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%);
      opacity: 0.7;
    }

    .product-card-cta {
      opacity: 1;
      transform: translateY(0);
      padding: 0.6rem 0.8rem;
      font-size: 0.75rem;
    }

    .product-card-title {
      font-size: 1rem;
      -webkit-line-clamp: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .product-card-price {
      font-size: 0.9rem;
      margin-bottom: 0.4rem;
    }

    .product-card-category {
      font-size: 0.65rem;
    }

    .add-to-cart-button {
      transform: translateY(0);
      opacity: 1;
      padding: 0.5rem;
      font-size: 0.8rem;
    }

    .product-card-image-container {
      padding-bottom: 100%;
    }

    .product-card-info {
      padding: 0.8rem;
    }

    .product-card-actions {
      opacity: 1;
      transform: translateY(0);
    }

    .product-card-action {
      width: 2rem;
      height: 2rem;
    }
  }

  @media (max-width: 480px) {
    .product-card-wrapper {
      margin-bottom: 0.75rem;
    }

    .product-card-overlay {
      padding: 0.8rem;
    }

    .product-card-title {
      font-size: 0.9rem;
    }
  }

  .product-card:hover .add-to-cart-button,
  .product-card.hovered .add-to-cart-button {
    transform: translateY(0);
    opacity: 1;
  }

  .product-card-action.wishlist.active {
    background-color: var(--color-gold-light);
    color: var(--color-gold);
  }

  .product-card-action.wishlist.active:hover {
    background-color: var(--color-gold);
    color: white;
  }
</style>
