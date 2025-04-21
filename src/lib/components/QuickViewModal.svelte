<script lang="ts">
  import { formatPrice } from "$lib/utils/data";
  import { addToCart, saveCartAndClearForDirectCheckout, cart } from "$lib/stores";
  import type { Product, Variant } from "$lib/types";
  import { onMount, createEventDispatcher } from "svelte";
  import ColorPieChart from "$lib/components/ColorPieChart.svelte";
  import { goto } from "$app/navigation";

  export let product: Product | null = null;
  export let open = false;

  const dispatch = createEventDispatcher();

  // State management
  let selectedVariant: Variant | null = null;
  let quantity = 1;
  let activeImageIndex = 0;
  let isAddingToCart = false;
  let addedToCart = false;
  let showBuyNowTooltip = false;

  // Initialize selected variant when product changes
  $: if (product && product.variants.length > 0) {
    selectedVariant = selectedVariant || product.variants[0];
  }

  // Get deduplicated color options from variants
  $: colorOptions = product
    ? [...new Map(product.variants.map(v => [v.color._id, v.color])).values()]
    : [];

  // Get available sizes for the selected color
  $: sizeOptions = product && selectedVariant
    ? product.variants
        .filter(v => v.color._id === selectedVariant.color._id)
        .map(v => v.size.name)
        .filter((value, index, self) => self.indexOf(value) === index)
    : [];

  // Images for the selected variant - accessing direct URL strings per schema
  $: variantImages = selectedVariant?.images || [];

  // Stock status
  $: inStock = selectedVariant && selectedVariant.stock > 0;
  $: lowStock = selectedVariant && selectedVariant.stock <= 3 && selectedVariant.stock > 0;

  // Handle color selection
  function selectColor(colorId: string) {
    if (!product) return;

    // Find first variant with the selected color
    const newVariant = product.variants.find(v => v.color._id === colorId);
    if (newVariant) {
      selectedVariant = newVariant;
      activeImageIndex = 0;
    }
  }

  // Handle size selection
  function selectSize(sizeName: string) {
    if (!product || !selectedVariant) return;

    // Find variant with current color and the selected size
    const newVariant = product.variants.find(
      v => v.color._id === selectedVariant.color._id && v.size.name === sizeName
    );

    if (newVariant) {
      selectedVariant = newVariant;
    }
  }

  // Quantity controls
  function decreaseQuantity() {
    if (quantity > 1) quantity--;
  }

  function increaseQuantity() {
    if (selectedVariant && quantity < selectedVariant.stock) quantity++;
  }

  // Image gallery controls
  function setActiveImage(index: number) {
    activeImageIndex = index;
  }

  // Add to cart functionality
  function handleAddToCart() {
    if (!product || !selectedVariant) return;

    isAddingToCart = true;

    setTimeout(() => {
      addToCart(product._id, selectedVariant._id, quantity);
      isAddingToCart = false;
      addedToCart = true;

      setTimeout(() => {
        addedToCart = false;
        handleClose();
      }, 1000);
    }, 600);
  }

  // Buy now functionality - add to cart and go to checkout with direct=true parameter, matching product detail page
  async function handleBuyNow() {
    if (!product || !selectedVariant) return;

    isAddingToCart = true;

    // Save current cart items and clear cart for Buy Now
    await saveCartAndClearForDirectCheckout();

    // Add to cart (wait for it if async)
    await addToCart(product._id, selectedVariant._id, quantity);

    // Show tooltip/notification
    showBuyNowTooltip = true;

    // Wait a bit for animation/UX
    setTimeout(() => {
      handleClose();
      goto('/checkout?direct=true');
      setTimeout(() => {
        showBuyNowTooltip = false;
      }, 3000);
    }, 600);
  }

  // Modal controls
  function handleClose() {
    dispatch("close");
    setTimeout(() => {
      // Reset state after animation completes
      quantity = 1;
      activeImageIndex = 0;
      isAddingToCart = false;
      addedToCart = false;
      showBuyNowTooltip = false;
      // Don't reset selectedVariant here to maintain selection between opens
    }, 300);
  }

  function handleClickOutside(e) {
    if (e.target.classList.contains("modal-overlay")) {
      handleClose();
    }
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && open) {
      handleClose();
    }
  }

  // Image error handler
  function handleImageError(event) {
    const img = event.target;
    img.onerror = null;
    img.src = "/images/product-placeholder.jpg";
  }

  // Lifecycle management
  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

{#if open && product}
  <div
    class="modal-overlay {open ? 'open' : ''}"
    on:click={handleClickOutside}
    on:keydown={(e) => e.key === "Enter" && handleClickOutside(e)}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="0"
  >
    <div class="modal-content">
      <button
        class="modal-close"
        on:click={handleClose}
        aria-label="Close modal"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="modal-body">
        <!-- Product Images -->
        <div class="product-images">
          <div class="product-main-image-container">
            <img
              src={variantImages[activeImageIndex] || "/images/product-placeholder.jpg"}
              alt={product.name}
              class="product-main-image"
              on:error={handleImageError}
            />
          </div>

          {#if variantImages.length > 1}
            <div class="product-thumbnails">
              {#each variantImages as imageUrl, index}
                <button
                  class="product-thumbnail-btn {activeImageIndex === index ? 'active' : ''}"
                  on:click={() => setActiveImage(index)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img
                    src={imageUrl || "/images/product-placeholder.jpg"}
                    alt={`${product.name} - Image ${index + 1}`}
                    class="product-thumbnail"
                    on:error={handleImageError}
                  />
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Product Info -->
        <div class="product-info">
          <h2 id="modal-title" class="product-title">{product.name}</h2>
          {#if product.category}
            <div class="product-category">{product.category.name}</div>
          {/if}
          <div class="product-price">
            {formatPrice(selectedVariant?.price || 0)}
          </div>

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

          {#if colorOptions.length > 1}
            <div class="option-group">
              <h3 class="option-title">Color: <span class="selected-option">{selectedVariant?.color.name}</span></h3>
              <div class="color-options">
                {#each colorOptions as color}
                  <button
                    class="color-option {selectedVariant?.color._id === color._id ? 'active' : ''}"
                    on:click={() => selectColor(color._id)}
                    aria-label={`Select ${color.name} color`}
                    aria-pressed={selectedVariant?.color._id === color._id}
                  >
                    {#if color.hex && Array.isArray(color.hex) && color.hex.length > 1}
                      <ColorPieChart hexColors={color.hex} size={24} border={true} borderColor={selectedVariant?.color._id === color._id ? 'var(--color-gold)' : '#e2e2e2'} borderWidth={2} />
                    {:else}
                      <span
                        class="color-swatch"
                        style="background-color: {Array.isArray(color.hex) ? color.hex[0] : color.hex}; border-color: {Array.isArray(color.hex) ? (color.hex[0] === '#FFFFFF' ? '#e2e2e2' : color.hex[0]) : (color.hex === '#FFFFFF' ? '#e2e2e2' : color.hex)}"
                      ></span>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          {#if sizeOptions.length > 0}
            <div class="option-group">
              <h3 class="option-title">Size</h3>
              <div class="size-options">
                {#each sizeOptions as sizeName}
                  <button
                    class="size-option {selectedVariant?.size.name === sizeName ? 'active' : ''}"
                    on:click={() => selectSize(sizeName)}
                    aria-label={`Select size ${sizeName}`}
                    aria-pressed={selectedVariant?.size.name === sizeName}
                  >
                    {sizeName}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <div class="option-group">
            <h3 class="option-title">Quantity</h3>
            <div class="quantity-selector">
              <button
                class="quantity-btn"
                on:click={decreaseQuantity}
                disabled={quantity <= 1 || !inStock}
                aria-label="Decrease quantity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <span class="quantity-value">{quantity}</span>
              <button
                class="quantity-btn"
                on:click={increaseQuantity}
                disabled={quantity >= (selectedVariant?.stock || 0) || !inStock}
                aria-label="Increase quantity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>

            {#if inStock}
              <div class="stock-status">
                {#if lowStock}
                  <span class="low-stock">Only {selectedVariant?.stock} left in stock</span>
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
                  <circle
                    class="path"
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke-width="5"
                  ></circle>
                </svg>
                <span>Adding...</span>
              {:else if addedToCart}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Added</span>
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path
                    d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                  ></path>
                </svg>
                <span>Add to Cart</span>
              {/if}
            </button>

            <div class="buy-now-wrapper" style="position: relative; flex: 1;">
              <button
                class="btn-buy-now"
                on:click={handleBuyNow}
                disabled={!inStock || isAddingToCart}
                on:mouseenter={() => (showBuyNowTooltip = true)}
                on:mouseleave={() => (showBuyNowTooltip = false)}
                aria-describedby="buynow-tooltip"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Buy Now</span>
              </button>
              {#if showBuyNowTooltip}
                <div class="buynow-tooltip" id="buynow-tooltip" role="tooltip">
                  <span>
                    <b>Buy Now</b> temporarily clears your cart and checks out only this item.<br />
                    Your previous cart will be restored after checkout.
                  </span>
                </div>
              {/if}
            </div>

            <a href={`/product/${product.slug}`} class="btn-view-details" data-sveltekit-preload-data="off">
              View Details
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
    transition:
      opacity 0.3s ease,
      visibility 0.3s ease;
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
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
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
    transition:
      background-color 0.3s ease,
      transform 0.3s ease;
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
    aspect-ratio: 1;
  }

  .product-main-image {
    width: 100%;
    height: 100%;
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
    margin-bottom: 0.25rem;
    line-height: 1.2;
    font-family: var(--heading-font);
  }

  .product-category {
    font-size: 0.9rem;
    color: var(--color-charcoal-light);
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    padding: 0;
    margin: 0 8px 8px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    overflow: visible;
    background: none;
    border: none;
  }

  .color-option.active {
    transform: scale(1.15);
    box-shadow: 0 0 0 2px var(--color-white), 0 0 0 4px var(--color-gold);
  }

  .color-swatch {
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid;
  }

  .selected-option {
    font-weight: normal;
    color: var(--color-gold);
    margin-left: 5px;
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
    flex-direction: row;
    gap: 0.6rem;
    margin-top: 1.5rem;
    flex-wrap: nowrap;
  }

  .btn-add-to-cart {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    border: none;
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
    border-radius: 4px;
  }

  .btn-add-to-cart::before {
    content: "";
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

  .btn-buy-now {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background-color: var(--color-charcoal);
    color: var(--color-white);
    border: none;
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
    border-radius: 4px;
    z-index: 2;
  }

  .btn-buy-now::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateX(-100%);
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
  }

  .btn-buy-now:hover:not([disabled])::before {
    transform: translateX(0);
  }

  .btn-buy-now:hover:not([disabled]) {
    background-color: var(--color-charcoal-dark, #1a1a1a);
  }

  .btn-buy-now:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background-color: var(--color-charcoal-light);
  }

  .btn-view-details {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 0.75rem;
    background-color: transparent;
    border: 1px solid var(--color-charcoal-light);
    color: var(--color-charcoal);
    text-align: center;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
    white-space: nowrap;
    text-overflow: ellipsis;
    border-radius: 4px;
  }

  .btn-view-details:hover {
    border-color: var(--color-gold);
    color: var(--color-gold);
  }

  .buy-now-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex: 1;
    min-width: 0;
  }

  .buynow-tooltip {
    position: absolute;
    top: 110%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-cream-dark, #fffbe5);
    color: var(--color-charcoal);
    border: 1px solid var(--color-gold);
    border-radius: 6px;
    font-size: 0.92rem;
    padding: 0.75em 1em;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    min-width: 230px;
    max-width: 300px;
    z-index: 99;
    text-align: left;
    pointer-events: none;
    opacity: 1;
    animation: buynowTooltipAppear 0.22s cubic-bezier(.4,1.5,.6,1) both;
  }

  @keyframes buynowTooltipAppear {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .buynow-tooltip b {
    color: var(--color-gold);
    font-weight: 600;
  }

  @media (min-width: 768px) {
    .modal-body {
      grid-template-columns: 1fr 1fr;
      padding: 2.5rem;
    }

    .product-title {
      font-size: 2.25rem;
    }
  }

  @media (max-width: 767px) {
    .product-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .btn-add-to-cart,
    .btn-buy-now,
    .buy-now-wrapper {
      flex: 1 1 calc(50% - 0.5rem);
    }

    .btn-view-details {
      flex: 0 0 100%;
    }
    .buynow-tooltip {
      min-width: 180px;
      max-width: 90vw;
      font-size: 0.96rem;
      left: 50%;
      right: auto;
      transform: translateX(-50%);
    }
  }
</style>
