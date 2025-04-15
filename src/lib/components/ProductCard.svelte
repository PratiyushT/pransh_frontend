<script lang="ts">
  import { formatPrice } from '$lib/utils/data';
  import type { Product } from '$lib/types';
  import { onMount, createEventDispatcher } from 'svelte';
  import gsap from 'gsap';
  import { addToCart, isInWishlist, toggleWishlist } from '$lib/stores/index';

  export let product: Product;

  const dispatch = createEventDispatcher();

  // Check if product is in wishlist initially
  let isWishlisted = isInWishlist(product._id);

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
  let mainCartIcon: HTMLElement;
  let wishlistButton: HTMLElement;

  // Fallback for images that fail to load
  function handleImageError(event) {
    event.currentTarget.src = '/images/product-placeholder.jpg';
  }

  // Add to wishlist handler
  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist(product._id);
    isWishlisted = isInWishlist(product._id);

    // Add visual feedback with animation
    const btn = e.currentTarget;

    // Create ripple effect
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

    // Animate the heart with a beat effect
    gsap.fromTo(btn,
      { scale: 1 },
      { scale: 1.2, duration: 0.15, ease: "power1.out", yoyo: true, repeat: 1 }
    );

    // Animate the ripple
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

    // Check if device supports touch
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Initialize GSAP timeline
    timeline = gsap.timeline({ paused: true });

    try {
      // Setup animations - FASTER AND SMOOTHER
      timeline
        .to(cardElement, {
          y: -15,
          duration: 0.3,
          ease: "power2.out",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1), 0 0 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.2)"
        }, 0)
        .to(imageContainer.querySelector('.primary-image'), {
          scale: 1.08,
          duration: 0.4,
          ease: "power1.out"
        }, 0);

      // Add a glow effect around the card
      const cardGlow = document.createElement('div');
      cardGlow.classList.add('card-glow-effect');
      cardElement.appendChild(cardGlow);

      // Add the glow animation to the timeline
      timeline.to(cardGlow, {
        opacity: 1,
        duration: 0.3,
        ease: "power1.out"
      }, 0);

      const secondaryImg = imageContainer.querySelector('.secondary-image');
      if (secondaryImg) {
        timeline.to(secondaryImg, {
          opacity: 1,
          scale: 1.08,
          duration: 0.4,
          ease: "power1.out"
        }, 0);
      }

      const overlay = cardElement.querySelector('.product-card-overlay');
      if (overlay) {
        timeline.to(overlay, {
          opacity: 1,
          duration: 0.3,
          ease: "power1.out"
        }, 0);
      }

      const actions = cardElement.querySelector('.product-card-actions');
      if (actions) {
        timeline.to(actions, {
          y: 0,
          opacity: 1,
          duration: 0.3,
          ease: "back.out(1.7)"
        }, 0.05);
      }

      const cta = cardElement.querySelector('.product-card-cta');
      if (cta) {
        timeline.to(cta, {
          y: 0,
          opacity: 1,
          duration: 0.3,
          ease: "back.out(1.7)"
        }, 0.1);
      }

      const title = cardElement.querySelector('.product-card-title');
      if (title) {
        timeline.to(title, {
          color: "var(--color-gold)",
          duration: 0.25,
          ease: "power1.out"
        }, 0);
      }
    } catch (error) {
      console.error("Error setting up animations:", error);
    }

    // Add loaded class after Page is mounted for fade-in effect - FASTER INITIAL LOAD
    gsap.to(cardElement, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: Math.random() * 0.2,
      onComplete: () => {
        isLoaded = true;
      }
    });

    // Find the cart icon in the header for add-to-cart animation
    mainCartIcon = document.querySelector('.header .header-action-icon[aria-label="Cart"]');
    if (!mainCartIcon) {
      mainCartIcon = document.querySelector('.header-sticky .header-action-icon[aria-label="Cart"]');
    }

    // Get reference to the wishlist button and update status
    wishlistButton = cardElement.querySelector('.product-card-action.wishlist');

    // Make sure the initial wishlist state is correct and synced with the store
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

  // Add to cart handler with animation
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Create clone of product image for animation
    const productImage = imageContainer.querySelector('.primary-image');
    const rect = productImage.getBoundingClientRect();

    // Create a flying image element
    const flyingImg = document.createElement('img');
    flyingImg.src = primaryImage;
    flyingImg.classList.add('flying-cart-item');
    flyingImg.style.position = 'fixed';
    flyingImg.style.zIndex = '9999';
    flyingImg.style.width = '80px';
    flyingImg.style.height = '80px';
    flyingImg.style.objectFit = 'cover';
    flyingImg.style.borderRadius = '50%';
    flyingImg.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
    flyingImg.style.left = `${rect.left + (rect.width / 2) - 40}px`;
    flyingImg.style.top = `${rect.top + (rect.height / 2) - 40}px`;
    document.body.appendChild(flyingImg);

    // Get the cart icon position
    if (mainCartIcon) {
      const cartRect = mainCartIcon.getBoundingClientRect();
      const cartX = cartRect.left + (cartRect.width / 2);
      const cartY = cartRect.top + (cartRect.height / 2);

      // Animate the flying image to the cart - FASTER
      gsap.to(flyingImg, {
        duration: 0.6,
        x: cartX - (rect.left + rect.width / 2),
        y: cartY - (rect.top + rect.height / 2),
        scale: 0.1,
        opacity: 0.7,
        ease: "power2.in",
        onComplete: () => {
          // Remove the flying image
          document.body.removeChild(flyingImg);

          // Add item to cart
          addToCart(product, 0);

          // Animate cart icon - SNAPPIER
          gsap.fromTo(mainCartIcon,
            { scale: 0.8 },
            { scale: 1.3, duration: 0.15, ease: "elastic.out(1.2, 0.4)" }
          );

          // Create ripple effect - FASTER
          const ripple = document.createElement('div');
          ripple.classList.add('cart-ripple');
          ripple.style.position = 'absolute';
          ripple.style.zIndex = '9998';
          ripple.style.top = '50%';
          ripple.style.left = '50%';
          ripple.style.transform = 'translate(-50%, -50%)';
          ripple.style.width = '10px';
          ripple.style.height = '10px';
          ripple.style.backgroundColor = 'var(--color-gold)';
          ripple.style.borderRadius = '50%';
          ripple.style.pointerEvents = 'none';
          mainCartIcon.appendChild(ripple);

          gsap.to(ripple, {
            duration: 0.4,
            scale: 15,
            opacity: 0,
            ease: "power1.out",
            onComplete: () => {
              mainCartIcon.removeChild(ripple);
            }
          });
        }
      });
    } else {
      // Fallback if cart icon not found
      addToCart(product, 0);
    }
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
          <button
            class="product-card-action wishlist {isWishlisted ? 'active' : ''}"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            on:click={handleToggleWishlist}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          <button class="product-card-action add-to-cart"
            aria-label="Add to cart"
            on:click={handleAddToCart}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
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

      <button class="add-to-cart-button" on:click={handleAddToCart}>
        <span>Add to Cart</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    transition: all 0.25s ease; /* Faster transition from 0.3s */
  }

  /* Add glow effect styling */
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
    transition: opacity 0.25s ease; /* Added transition */
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
    transition: transform 0.25s ease; /* Added transition for hover without GSAP */
  }

  .primary-image {
    opacity: 1;
  }

  .secondary-image {
    opacity: 0;
    z-index: 2;
    transition: opacity 0.25s ease; /* Added transition */
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
    transition: opacity 0.25s ease; /* Added transition for fallback when GSAP fails */
  }

  .product-card-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    transform: translateY(-15px);
    opacity: 0;
    will-change: transform, opacity;
    transition: transform 0.25s ease, opacity 0.25s ease; /* Added transition for fallback */
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
    transition: all 0.25s ease; /* Faster from 0.3s */
    color: var(--color-charcoal);
  }

  .product-card-action:hover {
    background-color: var(--color-gold);
    color: var(--color-white);
    transform: scale(1.1) translateY(-3px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }

  .product-card-action.add-to-cart {
    background-color: var(--color-gold);
    color: var(--color-white);
  }

  .product-card-action.add-to-cart:hover {
    background-color: var(--color-gold-dark);
    transform: scale(1.15) translateY(-3px);
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
    transition: transform 0.25s ease, opacity 0.25s ease; /* Added for fallback */
  }

  .product-card-cta svg {
    transition: transform 0.2s ease; /* Faster from 0.3s */
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
    transition: color 0.25s ease; /* Faster from 0.3s */
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
    margin-bottom: 1rem;
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

  .add-to-cart-button {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background-color: var(--color-cream);
    border: 1px solid var(--color-gold);
    color: var(--color-gold);
    font-weight: 500;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.25s ease; /* Faster from 0.3s */
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
    animation: shimmer 1.5s infinite; /* Faster from 2s */
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
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
  }

  /* Flying cart item animation will be handled through JS */
  :global(.flying-cart-item) {
    pointer-events: none;
  }

  /* Add responsive adjustments */
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

    .add-to-cart-button {
      transform: translateY(0);
      opacity: 1;
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
