<script lang="ts">
  import { onMount } from 'svelte';
  import { formatPrice } from '$lib/utils/data';
  import { addToCart } from '$lib/stores';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import ColorPieChart from '$lib/components/ColorPieChart.svelte';

  // Get product data from server load function
  export let data;
  const { product, relatedProducts, error: productError } = data;

  // If error is defined, display error message
  $: errorMessage = productError?.message || (product === null ? 'Product not found' : null);

  // Only set up product-related variables if we have a product
  let selectedVariantIndex = 0;
  let selectedSize = '';
  let selectedColor = null;
  let quantity = 1;
  let activeImage = 0;
  let isAddingToCart = false;
  let addedToCart = false;
  let zoomedImage = false;
  let zoomPosition = { x: 0, y: 0 };

  $: selectedVariant = product?.variants[selectedVariantIndex] || null;
  $: availableSizes = product ? [...new Set(product.variants.map(v => v.size.name))] : [];
  $: availableColors = product
    ? [...new Set(product.variants.filter(v =>
        !selectedSize || v.size.name === selectedSize).map(v => v.color))]
    : [];
  $: variantImages = product
    ? product.variants
        .filter(v => v.color?.name === selectedVariant?.color?.name)
        .flatMap(v => v.images.map(url => ({ url })))
    : [];

  // Initialize selectedSize and selectedColor if product exists
  $: if (product && product.variants && product.variants.length > 0) {
    if (!selectedSize) selectedSize = product.variants[0]?.size?.name || '';
    if (!selectedColor) selectedColor = product.variants[0]?.color || null;
  }

  // Handle size selection
  const selectSize = (size: string) => {
    selectedSize = size;

    // Find a variant with the selected size and color
    const variantIndex = product?.variants.findIndex(
      v => v.size.name === selectedSize && (selectedColor ? v.color.name === selectedColor.name : true)
    );

    if (variantIndex !== -1 && variantIndex !== undefined) {
      selectedVariantIndex = variantIndex;
      selectedColor = product?.variants[variantIndex].color;
      activeImage = 0;
    } else {
      // If no variant found with selected size and color, just find one with selected size
      const sizeVariantIndex = product?.variants.findIndex(v => v.size.name === selectedSize);
      if (sizeVariantIndex !== -1 && sizeVariantIndex !== undefined) {
        selectedVariantIndex = sizeVariantIndex;
        selectedColor = product?.variants[sizeVariantIndex].color;
        activeImage = 0;
      }
    }
  };

  // Handle color selection
  const selectColor = (color) => {
    if (color) {
      selectedColor = color;

      // Find a variant with the selected color and size
      const variantIndex = product?.variants.findIndex(
        v => v.color.name === color.name && v.size.name === selectedSize
      );

      if (variantIndex !== -1 && variantIndex !== undefined) {
        selectedVariantIndex = variantIndex;
        activeImage = 0;
      } else {
        // If no variant found with selected color and size, just find one with selected color
        const colorVariantIndex = product?.variants.findIndex(v => v.color.name === color.name);
        if (colorVariantIndex !== -1 && colorVariantIndex !== undefined) {
          selectedVariantIndex = colorVariantIndex;
          selectedSize = product?.variants[colorVariantIndex].size.name;
          activeImage = 0;
        }
      }
    }
  };

  // Handle thumbnail click
  const setActiveImage = (index) => {
    activeImage = index;
    zoomedImage = false;
  };

  // Handle image zoom
  const toggleZoom = (e) => {
    if (!zoomedImage) {
      zoomedImage = true;
      updateZoomPosition(e);
    } else {
      zoomedImage = false;
    }
  };

  // Update zoom position
  const updateZoomPosition = (e) => {
    if (zoomedImage) {
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      zoomPosition = { x, y };
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

        // Reset the added state after a brief delay
        setTimeout(() => {
          addedToCart = false;
        }, 2000);
      }, 600);
    }
  };

  $: inStock = selectedVariant && selectedVariant.stock > 0;
  $: lowStock = selectedVariant && selectedVariant.stock <= 3 && selectedVariant.stock > 0;

  function handleProductImageError(event) {
    const img = event.target;
    img.onerror = null;
    img.src = '/images/product-placeholder.jpg';
  }
</script>

<svelte:head>
  <title>Pransh - {product?.name || 'Product'}</title>
  <meta name="description" content="{product?.description || 'Product details'} - Luxury clothing with timeless elegance and exceptional quality.">
</svelte:head>

<section class="section product-detail-section">
  <div class="container">
    {#if errorMessage}
      <div class="not-found">
        <h1>{errorMessage}</h1>
        <p>The product you're looking for could not be found.</p>
        <a href="/shop" class="btn btn-primary">Back to Shop</a>
      </div>
    {:else if product}
      <div class="product-detail">
        <!-- Product Images -->
        <div class="product-images">
          <div
            class="product-main-image-container {zoomedImage ? 'zoomed' : ''}"
            on:click={toggleZoom}
            on:keydown={(e) => e.key === 'Enter' && toggleZoom()}
            role="button"
            tabindex="0"
            aria-label="Click to zoom image"
          >
            <img
              src={variantImages[activeImage]?.url || "/images/product-placeholder.jpg"}
              alt={product.name}
              class="product-main-image"
              style={zoomedImage ? `transform: scale(1.5); transform-origin: ${zoomPosition.x}% ${zoomPosition.y}%` : ''}
              on:error={handleProductImageError}
              on:mousemove={updateZoomPosition}
            >
            <div class="zoom-instruction {zoomedImage ? 'hidden' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              <span>Click to zoom</span>
            </div>
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

        <!-- Product Info -->
        <div class="product-info">
          <div class="breadcrumbs">
            <a href="/" class="breadcrumb-link">Home</a>
            <span class="breadcrumb-separator">/</span>
            <a href="/shop" class="breadcrumb-link">{product.category?.name || 'Shop'}</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">{product.name}</span>
          </div>

          <h1 class="product-info-title">{product.name}</h1>
          <div class="product-info-price">{formatPrice(selectedVariant?.price || 0)}</div>

          {#if product.rating > 0}
            <div class="product-rating mb-4">
              {#each Array(5) as _, i}
                <span class="star {i < Math.round(product.rating) ? 'filled' : ''}">★</span>
              {/each}
              <span class="rating-count">({product.rating})</span>
            </div>
          {/if}

          <div class="product-description">
            <p>{product.description}</p>
          </div>

          <div class="product-options">
            {#if availableColors.length > 1}
              <div class="option-group">
                <h2 class="option-title">Color: <span class="selected-option">{selectedColor?.name}</span></h2>
                <div class="color-options">
                  {#each availableColors as color}
                    <button
                      class="color-option {selectedColor?.name === color.name ? 'active' : ''}"
                      on:click={() => selectColor(color)}
                      aria-label={`Select ${color.name} color`}
                      aria-pressed={selectedColor?.name === color.name}
                    >
                      {#if color.hex && Array.isArray(color.hex) && color.hex.length > 1}
                        <ColorPieChart hexColors={color.hex} size={24} border={true} borderColor={selectedColor?.name === color.name ? 'var(--color-gold)' : '#e2e2e2'} borderWidth={2} />
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

            {#if availableSizes.length > 1}
              <div class="option-group">
                <h2 class="option-title">Size: <span class="selected-option">{selectedSize}</span></h2>
                <div class="size-options">
                  {#each availableSizes as size}
                    <button
                      class="size-option {selectedSize === size ? 'active' : ''}"
                      on:click={() => selectSize(size)}
                      disabled={!product.variants.some(v => v.size.name === size && v.color.name === selectedColor?.name)}
                      aria-label={`Select size ${size}`}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <div class="option-group">
              <h2 class="option-title">Quantity</h2>
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

            <button class="btn-wishlist" aria-label="Add to wishlist">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>

          <div class="product-meta">
            <div class="meta-item">
              <span class="meta-label">Availability:</span>
              <span class="meta-value">{inStock ? 'In stock' : 'Out of stock'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">SKU:</span>
              <span class="meta-value">{selectedVariant?.sku || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Category:</span>
              <span class="meta-value">{product.category?.name || 'Uncategorized'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products -->
      {#if relatedProducts && relatedProducts.length > 0}
        <div class="related-products-section">
          <div class="section-title">
            <h2>You May Also Like</h2>
            <div class="title-underline"></div>
          </div>

          <div class="product-grid">
            {#each relatedProducts as relatedProduct}
              <ProductCard product={relatedProduct} />
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  .product-detail-section {
    padding-top: 2rem;
  }

  .product-detail {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
    margin-bottom: 5rem;
  }

  .product-images {
    position: relative;
  }

  .product-main-image-container {
    position: relative;
    overflow: hidden;
    background-color: var(--color-cream-dark);
    cursor: zoom-in;
  }

  .product-main-image-container.zoomed {
    cursor: zoom-out;
  }

  .product-main-image {
    width: 100%;
    height: auto;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .zoom-instruction {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 0.5rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .product-main-image-container:hover .zoom-instruction {
    opacity: 1;
  }

  .zoom-instruction.hidden {
    display: none;
  }

  .product-thumbnails {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .product-thumbnail-btn {
    width: 80px;
    height: 80px;
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

  .breadcrumbs {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    flex-wrap: wrap;
  }

  .breadcrumb-link {
    color: var(--color-charcoal-light);
    transition: color 0.3s ease;
  }

  .breadcrumb-link:hover {
    color: var(--color-gold);
  }

  .breadcrumb-separator {
    margin: 0 0.5rem;
    color: var(--color-charcoal-light);
  }

  .breadcrumb-current {
    color: var(--color-charcoal);
    font-weight: 500;
  }

  .product-info-title {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .product-info-price {
    font-size: 1.5rem;
    color: var(--color-gold);
    font-weight: 500;
    margin-bottom: 1rem;
  }

  .product-rating {
    display: flex;
    align-items: center;
    gap: 0.1rem;
  }

  .star {
    color: #e0e0e0;
    font-size: 1.2rem;
  }

  .star.filled {
    color: var(--color-gold);
  }

  .rating-count {
    margin-left: 0.5rem;
    font-size: 0.9rem;
    color: var(--color-charcoal-light);
  }

  .product-description {
    margin: 1.5rem 0;
    line-height: 1.7;
  }

  .product-options {
    margin: 2rem 0;
  }

  .option-group {
    margin-bottom: 1.5rem;
  }

  .option-title {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
  }

  .selected-option {
    font-weight: 400;
    color: var(--color-gold);
  }

  .color-options {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .color-option {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-option:hover {
    transform: scale(1.1);
  }

  .color-option.active {
    box-shadow: 0 0 0 2px var(--color-white), 0 0 0 4px var(--color-gold);
  }

  .color-swatch {
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid;
  }

  .size-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .size-option {
    min-width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid var(--color-charcoal-light);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0 1rem;
    background: none;
  }

  .size-option:hover:not([disabled]) {
    border-color: var(--color-gold);
  }

  .size-option.active {
    background-color: var(--color-gold);
    color: var(--color-white);
    border-color: var(--color-gold);
  }

  .size-option[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
    text-decoration: line-through;
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    border: 1px solid var(--color-charcoal-light);
    max-width: 140px;
  }

  .quantity-btn {
    width: 40px;
    height: 40px;
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
    margin-top: 0.75rem;
    font-size: 0.9rem;
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
    gap: 1rem;
    margin: 2rem 0;
  }

  .btn-add-to-cart {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    border: none;
    padding: 1rem 2rem;
    font-size: 1rem;
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

  .btn-wishlist {
    width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-white);
    border: 1px solid var(--color-charcoal-light);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-wishlist:hover {
    border-color: var(--color-gold);
    color: var(--color-gold);
  }

  .product-meta {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-cream-dark);
  }

  .meta-item {
    display: flex;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .meta-label {
    width: 100px;
    color: var(--color-charcoal-light);
  }

  .related-products-section {
    margin-top: 5rem;
  }

  .section-title {
    text-align: center;
    margin-bottom: 3rem;
    position: relative;
  }

  .title-underline {
    width: 50px;
    height: 2px;
    background-color: var(--color-gold);
    margin: 1rem auto 0;
  }

  .not-found {
    text-align: center;
    padding: 5rem 0;
  }

  .not-found h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .not-found p {
    margin-bottom: 2rem;
    color: var(--color-charcoal-light);
  }

  @media (min-width: 768px) {
    .product-detail {
      grid-template-columns: 1fr 1fr;
    }

    .product-info-title {
      font-size: 3rem;
    }
  }

  @media (min-width: 1024px) {
    .product-detail {
      gap: 5rem;
    }

    .product-detail-section {
      padding-top: 3rem;
    }
  }
</style>
