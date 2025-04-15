<script lang="ts">
  import { formatPrice } from '$lib/utils/data';
  import { addToCart } from '$lib/stores';
  import type { Product } from '$lib/types';
  import { onMount, createEventDispatcher } from 'svelte';

  export let product: Product | null = null;
  export let open = false;

  const dispatch = createEventDispatcher();

  let selectedVariantIndex = 0;
  let quantity = 1;
  let activeImage = 0;
  let isAddingToCart = false;
  let addedToCart = false;

  $: selectedVariant = product?.variants[selectedVariantIndex] || null;

  // Combine all images from the selected variant's color
  $: variantImages = product?.variants
    .filter(v => v.color.name === selectedVariant?.color.name)
    .flatMap(v => v.images) || [];

  // Handle thumbnail click
  const setActiveImage = (index) => {
    activeImage = index;
  };

  // Handle close
  const handleClose = () => {
    dispatch('close');
    setTimeout(() => {
      // Reset state after animation completes
      selectedVariantIndex = 0;
      quantity = 1;
      activeImage = 0;
      isAddingToCart = false;
      addedToCart = false;
    }, 300);
  };

  // Handle color selection
  const selectColor = (color) => {
    if (color) {
      const variantIndex = product?.variants.findIndex(
        v => v.color.name === color.name
      );

      if (variantIndex !== -1 && variantIndex !== undefined) {
        selectedVariantIndex = variantIndex;
        activeImage = 0;
      }
    }
  };

  // Handle size selection
  let availableSizes = [];

  // Get available sizes for the selected color
  $: {
    if (product && selectedVariant) {
      // Find all variants with the same color and get their sizes
      availableSizes = product.variants
        .filter(variant => variant.color.name === selectedVariant.color.name)
        .map(variant => variant.size)
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    }
  }

  const selectSize = (size) => {
    if (size) {
      // Find variant with selected color and size
      const variantIndex = product?.variants.findIndex(
        v => v.color.name === selectedVariant?.color.name && v.size === size
      );

      if (variantIndex !== -1 && variantIndex !== undefined) {
        selectedVariantIndex = variantIndex;
      }
    }
  };

  // Handle quantity changes
  const decreaseQuantity = () => {
    if (quantity > 1) quantity--;
  };

  const increaseQuantity = () => {
    if (quantity < selectedVariant?.stock) quantity++;
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (product && selectedVariant) {
      isAddingToCart = true;

      // Simulate a small delay for animation purposes
      setTimeout(() => {
        addToCart(product, selectedVariantIndex, quantity);
        isAddingToCart = false;
        addedToCart = true;

        // Reset the added state and close the modal after a brief delay
        setTimeout(() => {
          addedToCart = false;
          handleClose();
        }, 1000);
      }, 600);
    }
  };

  // In stock
  $: inStock = selectedVariant && selectedVariant.stock > 0;
  $: lowStock = selectedVariant && selectedVariant.stock <= 3 && selectedVariant.stock > 0;

  // Click outside to close
  function handleClickOutside(e) {
    if (e.target.classList.contains('modal-overlay')) {
      handleClose();
    }
  }

  // Keyboard navigation
  function handleKeydown(e) {
    if (e.key === 'Escape' && open) {
      handleClose();
    }
  }

  // When the Page mounts, add keyboard event listener
  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  function handleProductImageError(event) {
    const img = event.target;
    img.onerror = null;
    img.src = '/images/product-placeholder.jpg';
  }
</script>

{#if open && product}
  <div
    class="modal-overlay {open ? 'open' : ''}"
    on:click={handleClickOutside}
    on:keydown={(e) => e.key === 'Enter' && handleClickOutside(e)}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="0"
  >
    <div class="modal-content">
      <button class="modal-close" on:click={handleClose} aria-label="Close modal">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="modal-body">
        <div class="product-images">
          <div class="product-main-image-container">
            <img
              src={variantImages[activeImage]?.url || "/images/product-placeholder.jpg"}
              alt={product.name}
              class="product-main-image"
              on:error={handleProductImageError}
            >
          </div>

          {#if variantImages.length > 1}
            <div class="product-thumbnails">
              {#each variantImages as image, index}
                <button
                  class="product-thumbnail-btn {activeImage === index ? 'active' : ''}"
                  on:click={() => setActiveImage(index)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img
                    src={image.url || "/images/product-placeholder.jpg"}
                    alt={`${product.name} - Image ${index + 1}`}
                    class="product-thumbnail"
                    on:error={handleProductImageError}
                  >
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <div class="product-info">
          <h2 id="modal-title" class="product-title">{product.name}</h2>
          <div class="product-price">{formatPrice(selectedVariant?.price || 0)}</div>

          {#if product.rating > 0}
            <div class="product-rating">
              {#each Array(5) as _, i}
                <span class="star {i < Math.round(product.rating) ? 'filled' : ''}">★</span>
              {/each}
              <span class="rating-count">({product.rating})</span>
            </div>
          {/if}

          <div class="product-description">
            <p>{product.description}</p>
          </div>

          {#if product.variants.length > 1}
            <div class="option-group">
              <h3 class="option-title">Color</h3>
              <div class="color-options">
                {#each [...new Set(product.variants.map(v => v.color.name))].map(name =>
                  product.variants.find(v => v.color.name === name).color) as color}
                  <button
                    class="color-option {selectedVariant?.color.name === color.name ? 'active' : ''}"
                    style="background-color: {color.hex}; border-color: {color.hex === '#FFFFFF' ? '#e2e2e2' : color.hex}"
                    on:click={() => selectColor(color)}
                    aria-label={`Select ${color.name} color`}
                    aria-pressed={selectedVariant?.color.name === color.name}
                  ></button>
                {/each}
              </div>
            </div>
          {/if}

          <div class="option-group">
            <h3 class="option-title">Size</h3>
            <div class="size-options">
              {#each availableSizes as size}
                <button
                  class="size-option {selectedVariant?.size === size ? 'active' : ''}"
                  on:click={() => selectSize(size)}
                  aria-label={`Select size ${size}`}
                  aria-pressed={selectedVariant?.size === size}
                >
                  {size}
                </button>
              {/each}
            </div>
          </div>

          <div class="option-group">
            <h3 class="option-title">Quantity</h3>
            <div class="quantity-selector">
              <button
                class="quantity-btn"
                on:click={decreaseQuantity}
                disabled={quantity <= 1 || !inStock}
                aria-label="Decrease quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <span class="quantity-value">{quantity}</span>
              <button
                class="quantity-btn"
                on:click={increaseQuantity}
                disabled={quantity >= selectedVariant?.stock || !inStock}
                aria-label="Increase quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>

            {#if inStock}
              <div class="stock-status">
                {#if lowStock}
                  <span class="low-stock">Only {selectedVariant.stock} left in stock</span>
                {:else}
                  <span class="in-stock">In Stock</span>
                {/if}
              </div>
            {:else}
              <div class="stock-status">
                <span class="out-of-stock">Out of Stock</span>
              </div>
            {/if}
          </div>

          <div class="product-actions">
            <button
              class="btn-add-to-cart {isAddingToCart ? 'adding' : ''} {addedToCart ? 'added' : ''}"
              on:click={handleAddToCart}
              disabled={!inStock || isAddingToCart}
            >
              {#if isAddingToCart}
                <svg class="spinner" viewBox="0 0 50 50">
                  <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                </svg>
                <span>Adding to Cart</span>
              {:else if addedToCart}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Added to Cart</span>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              {/if}
            </button>

            <a href={`/product/${product._id}`} class="btn-view-details">
              View Full Details
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }

  .modal-overlay.open {
    opacity: 1;
    visibility: visible;
  }

  .modal-content {
    background-color: var(--color-white);
    width: 100%;
    max-width: 1000px;
    max-height: 90vh;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    transform: translateY(20px);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
    animation: modalFadeIn 0.3s forwards;
  }

  @keyframes modalFadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--color-white);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease, transform 0.3s ease;
  }

  .modal-close:hover {
    background-color: var(--color-cream-dark);
    transform: rotate(90deg);
  }

  .modal-body {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem;
    overflow-y: auto;
  }

  .product-images {
    position: relative;
  }

  .product-main-image-container {
    position: relative;
    overflow: hidden;
    background-color: var(--color-cream-dark);
  }

  .product-main-image {
    width: 100%;
    height: auto;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .product-thumbnails {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .product-thumbnail-btn {
    width: 60px;
    height: 60px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    padding: 0;
    background: none;
    transition: all 0.3s ease;
  }

  .product-thumbnail-btn:hover {
    border-color: var(--color-charcoal-light);
  }

  .product-thumbnail-btn.active {
    border-color: var(--color-gold);
  }

  .product-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-info {
    display: flex;
    flex-direction: column;
  }

  .product-title {
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
    line-height: 1.2;
    font-family: var(--heading-font);
  }

  .product-price {
    font-size: 1.25rem;
    color: var(--color-gold);
    font-weight: 500;
    margin-bottom: 0.75rem;
  }

  .product-rating {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    margin-bottom: 1rem;
  }

  .star {
    color: #e0e0e0;
    font-size: 1.1rem;
  }

  .star.filled {
    color: var(--color-gold);
  }

  .rating-count {
    margin-left: 0.5rem;
    font-size: 0.85rem;
    color: var(--color-charcoal-light);
  }

  .product-description {
    margin: 1rem 0;
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--color-charcoal-light);
  }

  .option-group {
    margin-bottom: 1.25rem;
  }

  .option-title {
    font-size: 0.95rem;
    font-weight: 500;
    margin-bottom: 0.6rem;
  }

  .color-options {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .color-option {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
    background: none;
  }

  .color-option:hover {
    transform: scale(1.1);
  }

  .color-option.active {
    box-shadow: 0 0 0 2px var(--color-white), 0 0 0 3px var(--color-gold);
  }

  .size-options {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .size-option {
    min-width: 40px;
    padding: 0.3rem 0.7rem;
    border: 1px solid var(--color-charcoal-light);
    border-radius: 2px;
    background: var(--color-white);
    color: var(--color-charcoal);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
  }

  .size-option:hover {
    border-color: var(--color-gold);
    color: var(--color-gold);
  }

  .size-option.active {
    background-color: var(--color-gold);
    color: var(--color-white);
    border-color: var(--color-gold);
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    border: 1px solid var(--color-charcoal-light);
    max-width: 120px;
  }

  .quantity-btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .quantity-btn:hover:not([disabled]) {
    background-color: var(--color-cream-dark);
  }

  .quantity-btn[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quantity-value {
    flex: 1;
    text-align: center;
    font-weight: 500;
  }

  .stock-status {
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }

  .in-stock {
    color: green;
  }

  .low-stock {
    color: #ff9800;
  }

  .out-of-stock {
    color: red;
  }

  .product-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .btn-add-to-cart {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .btn-add-to-cart::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateX(-100%);
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
  }

  .btn-add-to-cart:hover:not([disabled])::before {
    transform: translateX(0);
  }

  .btn-add-to-cart:hover:not([disabled]) {
    background-color: var(--color-gold-dark);
  }

  .btn-add-to-cart:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background-color: var(--color-charcoal-light);
  }

  .btn-add-to-cart.adding {
    background-color: var(--color-gold);
  }

  .btn-add-to-cart.added {
    background-color: green;
  }

  .spinner {
    animation: rotate 2s linear infinite;
    width: 20px;
    height: 20px;
  }

  .path {
    stroke: var(--color-white);
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }

  .btn-view-details {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    background-color: transparent;
    border: 1px solid var(--color-charcoal-light);
    color: var(--color-charcoal);
    text-align: center;
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .btn-view-details:hover {
    border-color: var(--color-gold);
    color: var(--color-gold);
  }

  @media (min-width: 768px) {
    .modal-body {
      grid-template-columns: 1fr 1fr;
      padding: 2.5rem;
    }

    .product-title {
      font-size: 2.25rem;
    }

    .product-actions {
      flex-direction: row;
    }

    .btn-add-to-cart {
      flex: 1;
    }

    .btn-view-details {
      flex: 0 0 auto;
    }
  }
</style>
