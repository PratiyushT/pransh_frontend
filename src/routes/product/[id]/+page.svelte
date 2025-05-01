<script lang="ts">
  import { onMount } from 'svelte';
  import { formatPrice } from '$lib/utils/data';
  import { addToCart, isInWishlist, toggleWishlist, saveCartAndClearForDirectCheckout, cart } from '$lib/stores';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import ColorPieChart from '$lib/components/ColorPieChart.svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';

  let accordionStates = {
    features: true,
    care: false,
    delivery: false
  };

  export let data;
  const { product, relatedProducts, error: productError } = data;

  $: errorMessage = productError?.message || (product === null ? 'Product not found' : null);

  let selectedVariantIndex = 0;
  let selectedSize = '';
  let selectedColor = null;
  let quantity = 1;
  let activeImage = 0;
  let isAddingToCart = false;
  let addedToCart = false;
  let zoomedImage = false;
  let zoomPosition = { x: 0, y: 0 };
  let isWishlisted = product ? isInWishlist(product._id) : false;
  let isBuyingNow = false; // State for Buy Now loading
  let showBuyNowTooltip = false; // Add missing variable for tooltip

  $: selectedVariant = product?.variants?.[selectedVariantIndex] || null;

  $: availableColors = product
    ? [...new Map(
        product.variants
          .filter(v => v.color)
          .map(v => [v.color._id, v.color])
      ).values()]
    : [];

  $: availableSizes = product && selectedColor
    ? [...new Set(
        product.variants
          .filter(v => v.color && v.color._id === selectedColor._id)
          .map(v => v.size?.name)
          .filter(Boolean)
      )]
    : [];

  // Fix: Improve variant images calculation to handle all cases
  $: variantImages = product
    ? (() => {
        // First try to get images for selected variant with selected color
        if (selectedColor && product.variants) {
          const filteredVariants = product.variants
            .filter(v => v.color && v.color._id === selectedColor._id);

          if (filteredVariants.length > 0) {
            // Collect all images from variants with this color
            const images = filteredVariants
              .flatMap(v => v.images || [])
              .filter(url => url)
              .map(url => ({ url }));

            if (images.length > 0) {
              return images;
            }
          }
        }

        // If no variant images, try to use the specific selected variant's images
        if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
          return selectedVariant.images.map(url => ({ url }));
        }

        // Fallback to product main image
        return product.image ? [{ url: product.image }] : [];
      })()
    : [];

  $: if (product) {
    isWishlisted = isInWishlist(product._id);
  }

  $: if (product && product.variants && product.variants.length > 0) {
    // Initialize selectedColor if not set
    if (!selectedColor && product.variants[0]?.color) {
      selectedColor = product.variants[0]?.color;
    }
    // Initialize selectedSize if not set
    if (!selectedSize) {
      if (selectedColor) {
        const variantWithColor = product.variants.find(v => v.color && v.color._id === selectedColor._id);
        if (variantWithColor) {
          selectedSize = variantWithColor.size?.name || '';
        } else {
          selectedSize = product.variants[0]?.size?.name || '';
        }
      } else {
        selectedSize = product.variants[0]?.size?.name || '';
      }
    }
    // Update selectedVariantIndex based on selectedColor and selectedSize
    const idx = product.variants.findIndex(
      v =>
        v.color &&
        selectedColor &&
        v.color._id === selectedColor._id &&
        v.size &&
        v.size.name === selectedSize
    );
    if (idx !== -1 && idx !== undefined) {
      selectedVariantIndex = idx;
    }
  }

  // Improved selectSize function
  const selectSize = (size: string) => {
    if (!product || !product.variants || product.variants.length === 0) return;

    selectedSize = size;

    // Find variant with selected size and color if both are selected
    if (selectedColor) {
      const variantIndex = product.variants.findIndex(
        v => v.size && v.size.name === selectedSize && v.color && v.color._id === selectedColor._id
      );

      if (variantIndex !== -1) {
        selectedVariantIndex = variantIndex;
        activeImage = 0;
        return;
      }
    }

    // If no matching variant with both size and color, find any variant with this size
    const sizeVariantIndex = product.variants.findIndex(v => v.size && v.size.name === selectedSize);
    if (sizeVariantIndex !== -1) {
      selectedVariantIndex = sizeVariantIndex;
      // Update selected color to match what's available with this size
      if (product.variants[sizeVariantIndex].color) {
        selectedColor = product.variants[sizeVariantIndex].color;
      }
      activeImage = 0;
    }
  };

  // Improved selectColor function
  const selectColor = (color) => {
    if (!product || !product.variants || product.variants.length === 0 || !color) return;

    selectedColor = color;

    // Find variants with this color
    const variantsWithColor = product.variants.filter(v =>
      v.color && v.color._id === color._id
    );

    if (variantsWithColor.length > 0) {
      // Check if current size is available in this color
      const sizeAndColorVariant = variantsWithColor.find(v =>
        v.size && v.size.name === selectedSize
      );

      if (sizeAndColorVariant) {
        // Keep current size, just update variant index
        const variantIndex = product.variants.findIndex(v => v._id === sizeAndColorVariant._id);
        if (variantIndex !== -1) {
          selectedVariantIndex = variantIndex;
        }
      } else {
        // Size not available in this color, pick first available size
        selectedSize = variantsWithColor[0].size?.name || '';
        const variantIndex = product.variants.findIndex(v => v._id === variantsWithColor[0]._id);
        if (variantIndex !== -1) {
          selectedVariantIndex = variantIndex;
        }
      }
    }

    activeImage = 0;
  };

  const setActiveImage = (index) => {
    activeImage = index;
    zoomedImage = false;
  };

  const toggleZoom = (e) => {
    if (!zoomedImage) {
      zoomedImage = true;
      updateZoomPosition(e);
    } else {
      zoomedImage = false;
    }
  };

  const updateZoomPosition = (e) => {
    if (zoomedImage) {
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      zoomPosition = { x, y };
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) quantity--;
  };

  const increaseQuantity = () => {
    if (quantity < selectedVariant?.stock) quantity++;
  };

  const handleAddToCart = () => {
    if (product && selectedVariant) {
      isAddingToCart = true;
      setTimeout(() => {
        addToCart(product._id, selectedVariant._id, quantity);
        isAddingToCart = false;
        addedToCart = true;
        setTimeout(() => {
          addedToCart = false;
        }, 2000);
      }, 600);
    }
  };

  // Updated Buy Now logic: properly save cart and handle redirection
  const handleBuyNow = () => {
    if (product && selectedVariant) {
      isBuyingNow = true;

      // First save the current cart if there are any items
      if ($cart && $cart.length > 0) {
        saveCartAndClearForDirectCheckout();
      }

      // Then add the current product to cart
      addToCart(product._id, selectedVariant._id, quantity);

      // Go to checkout with direct=true parameter
      setTimeout(() => {
        goto('/checkout?direct=true');
      }, 600);
    }
  };

  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product._id);
      isWishlisted = !isWishlisted;
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
  <title>{product?.name || 'Product'} | Pransh Luxury</title>
  <meta name="description" content="{product?.description || 'Product details'} - Luxury clothing with timeless elegance and exceptional quality.">
</svelte:head>

<section class="section product-detail-section">
  <div class="container product-detail-container">
    {#if errorMessage}
      <div class="not-found">
        <h1>{errorMessage}</h1>
        <p>The product you're looking for could not be found.</p>
        <a href="/shop" class="btn btn-primary">Back to Shop</a>
      </div>
    {:else if product}
      <div class="breadcrumbs-container">
        <div class="breadcrumbs">
          <a href="/" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">/</span>
          <a href="/shop" class="breadcrumb-link">Shop</a>
          {#if product.category}
            <span class="breadcrumb-separator">/</span>
            <a href={`/shop?category=${product.category._id}`} class="breadcrumb-link">{product.category.name}</a>
          {/if}
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">{product.name}</span>
        </div>
      </div>

      <div class="product-detail">
        <!-- Product Images -->
        <div class="product-images">
          {#if product.isFeatured}
            <div class="product-featured-badge">Featured</div>
          {/if}
          <div class="product-main-image-wrapper">
            <div
              class="product-main-image-container {zoomedImage ? 'zoomed' : ''}"
              on:click={toggleZoom}
              on:keydown={(e) => e.key === 'Enter' && toggleZoom(e)}
              role="button"
              tabindex="0"
              aria-label="Click to zoom image"
            >
              <img
                src={
                  variantImages && variantImages.length > 0 && variantImages[activeImage]?.url
                    ? variantImages[activeImage].url
                    : product?.image || "/images/product-placeholder.jpg"
                }
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
          </div>

          {#if variantImages && variantImages.length > 1}
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
          <div class="product-info-header">
            <h1 class="product-info-title">
              {product.name}
              {#if product.isFeatured}
                <span class="product-featured-label">Featured</span>
              {/if}
            </h1>

            <div class="product-info-price">{formatPrice(selectedVariant?.price || 0)}</div>

            {#if product.rating > 0}
              <div class="product-rating mb-4">
                {#each Array(5) as _, i}
                  <span class="star {i < Math.round(product.rating) ? 'filled' : ''}" aria-hidden="true">★</span>
                {/each}
                <span class="rating-count">({product.rating})</span>
              </div>
            {/if}
          </div>

          <div class="product-description">
            <p>{product.description}</p>
          </div>

          <div class="product-options">
            {#if availableColors.length > 1}
              <div class="option-group">
                <h3 class="option-title">Color: <span class="selected-option">{selectedColor?.name || 'Select a color'}</span></h3>
                <div class="color-options">
                  {#each availableColors as color}
                    {#if color}
                      <div class="color-option-container" title={color.name}>
                        <button
                          class="color-option {selectedColor?._id === color._id ? 'active' : ''}"
                          on:click={() => selectColor(color)}
                          aria-label={`Select ${color.name} color`}
                          aria-pressed={selectedColor?._id === color._id}
                        >
                          {#if color.hex && Array.isArray(color.hex) && color.hex.length > 1}
                            <ColorPieChart hexColors={color.hex} size={26} border={true} borderColor={selectedColor?._id === color._id ? 'var(--color-gold)' : '#e2e2e2'} borderWidth={2} />
                          {:else}
                            <span
                              class="color-swatch"
                              style="background-color: {Array.isArray(color.hex) ? color.hex[0] || '#ccc' : color.hex || '#ccc'}; border-color: {Array.isArray(color.hex) ? (color.hex[0] === '#FFFFFF' ? '#e2e2e2' : color.hex[0] || '#ccc') : (color.hex === '#FFFFFF' ? '#e2e2e2' : color.hex || '#ccc')}"
                            ></span>
                          {/if}
                        </button>
                        {#if selectedColor?._id === color._id}
                          <div class="color-option-label">{color.name}</div>
                        {/if}
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            {/if}

            {#if availableSizes.length > 0}
              <div class="option-group">
                <h3 class="option-title">Size: <span class="selected-option">{selectedSize}</span></h3>
                <div class="size-options">
                  {#each availableSizes as size}
                    <button
                      class="size-option {selectedSize === size ? 'active' : ''}"
                      on:click={() => selectSize(size)}
                      disabled={!product.variants.some(v => v.size && v.size.name === size && v.color?._id === selectedColor?._id)}
                      aria-label={`Select size ${size}`}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  {/each}
                </div>
                <div class="size-guide-link">
                  <a href="#" class="size-guide-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>Size Guide</span>
                  </a>
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
                    <span class="low-stock">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      Only {selectedVariant.stock} left in stock - order soon
                    </span>
                  {:else}
                    <span class="in-stock">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      In Stock
                    </span>
                  {/if}
                </div>
              {:else}
                <div class="stock-status">
                  <span class="out-of-stock">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Out of Stock
                  </span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Product Actions -->
          <div class="product-detail-actions">
            {#if inStock}
              <div class="action-buttons">
                <div class="main-buttons">
                  <button
                    class="add-to-cart-button {isAddingToCart ? 'adding' : ''} {addedToCart ? 'added' : ''}"
                    on:click={handleAddToCart}
                    disabled={!inStock || isAddingToCart || isBuyingNow}
                  >
                    {#if isAddingToCart && !addedToCart}
                      <svg class="spinner" viewBox="0 0 50 50">
                        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                      </svg>
                      <span>Adding...</span>
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
                      <span>Add to Cart</span>
                    {/if}
                  </button>

                  <div class="buy-now-button-container">
                    <button
                      class="buy-now-button {isBuyingNow ? 'buying' : ''}"
                      on:click={handleBuyNow}
                      disabled={!inStock || isAddingToCart || isBuyingNow}
                      on:mouseenter={() => showBuyNowTooltip = true}
                      on:mouseleave={() => showBuyNowTooltip = false}
                      on:focus={() => showBuyNowTooltip = true}
                      on:blur={() => showBuyNowTooltip = false}
                    >
                      {#if isBuyingNow}
                        <svg class="spinner" viewBox="0 0 50 50">
                          <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                        </svg>
                        <span>Processing...</span>
                      {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>Buy Now</span>
                      {/if}
                    </button>
                    {#if showBuyNowTooltip}
                      <div class="buy-now-tooltip" tabindex="-1">
                        <span>Go directly to checkout with this item.</span>
                        {#if $cart.length > 1}
                          <span class="font-semibold block">Your current cart items will be saved for later.</span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                </div>

                <button
                  class="btn-wishlist {isWishlisted ? 'active' : ''}"
                  on:click={handleToggleWishlist}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span class="wishlist-text">{isWishlisted ? 'Saved' : 'Add to Wishlist'}</span>
                </button>
              </div>
            {/if}
          </div>

          <div class="product-highlights">
            <div class="highlight-item">
              <div class="highlight-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="1" y="3" width="22" height="18" rx="2" ry="2"></rect>
                  <line x1="10" y1="7" x2="14" y2="7"></line>
                  <line x1="12" y1="7" x2="12" y2="17"></line>
                  <path d="M8 13h.01"></path>
                  <path d="M16 13h.01"></path>
                  <path d="M8 16h.01"></path>
                  <path d="M16 16h.01"></path>
                  <path d="M12 11h.01"></path>
                </svg>
              </div>
              <div class="highlight-content">
                <h4>Secure Payment</h4>
                <p>Multiple payment options</p>
              </div>
            </div>
            <div class="highlight-item">
              <div class="highlight-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div class="highlight-content">
                <h4>Premium Quality</h4>
                <p>Handcrafted with care</p>
              </div>
            </div>
            <div class="highlight-item">
              <div class="highlight-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="8" x2="8" y2="8"></line>
                  <line x1="16" y1="12" x2="8" y2="12"></line>
                  <line x1="16" y1="16" x2="8" y2="16"></line>
                </svg>
              </div>
              <div class="highlight-content">
                <h4>Easy Returns</h4>
                <p>30-day return policy</p>
              </div>
            </div>
          </div>

          <div class="product-meta">
            <div class="meta-item">
              <span class="meta-label">SKU:</span>
              <span class="meta-value">{selectedVariant?.sku || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Category:</span>
              <span class="meta-value">{product.category?.name || 'Uncategorized'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Share:</span>
              <div class="share-icons">
                <a href="#" class="share-icon" aria-label="Share on Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="#" class="share-icon" aria-label="Share on Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
                <a href="#" class="share-icon" aria-label="Share on Pinterest">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </a>
                <a href="#" class="share-icon" aria-label="Share via Email">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Tabs -->
      <div class="product-tabs">
        <div class="product-details-accordion">
          <div class="accordion-item">
            <button
              class="accordion-header"
              on:click={() => accordionStates.features = !accordionStates.features}
              aria-expanded={accordionStates.features}
            >
              <span>Features & Details</span>
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
                style="transform: {accordionStates.features ? 'rotate(180deg)' : 'rotate(0)'}"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="accordion-content" style="display: {accordionStates.features ? 'block' : 'none'}">
              <ul class="product-features-list">
                <li>Premium quality materials for exceptional comfort and durability</li>
                <li>Meticulously crafted with attention to detail and finishing</li>
                <li>Designed for timeless elegance and versatility</li>
                <li>Perfect fit and finish with expert tailoring</li>
                {#if selectedColor}
                  <li>Available in {selectedColor.name} and other elegant colors</li>
                {/if}
              </ul>
            </div>
          </div>

          <div class="accordion-item">
            <button
              class="accordion-header"
              on:click={() => accordionStates.care = !accordionStates.care}
              aria-expanded={accordionStates.care}
            >
              <span>Care Instructions</span>
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
                style="transform: {accordionStates.care ? 'rotate(180deg)' : 'rotate(0)'}"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="accordion-content" style="display: {accordionStates.care ? 'block' : 'none'}">
              <p>To maintain the beauty and longevity of your Pransh luxury item, we recommend:</p>
              <ul class="product-care-list">
                <li>Dry clean only</li>
                <li>Store in a cool, dry place away from direct sunlight</li>
                <li>Handle delicate embellishments with care</li>
                <li>Iron at low temperature if necessary</li>
                <li>Fold and store properly to avoid creasing</li>
              </ul>
            </div>
          </div>

          <div class="accordion-item">
            <button
              class="accordion-header"
              on:click={() => accordionStates.delivery = !accordionStates.delivery}
              aria-expanded={accordionStates.delivery}
            >
              <span>Shipping & Returns</span>
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
                style="transform: {accordionStates.delivery ? 'rotate(180deg)' : 'rotate(0)'}"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="accordion-content" style="display: {accordionStates.delivery ? 'block' : 'none'}">
              <p>Our shipping and returns policy:</p>
              <ul class="product-delivery-list">
                <li>Free shipping on orders over $100</li>
                <li>Express delivery available (2-3 business days)</li>
                <li>Standard delivery within 5-7 business days</li>
                <li>30-day return policy for unworn items in original packaging</li>
                <li>For custom items, special return conditions apply</li>
              </ul>
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
          <div class="product-grid related-product-grid">
            {#each relatedProducts as relatedProduct}
              <div class="related-product-card-wrapper">
                <ProductCard product={relatedProduct} />
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  /* Elements with animations will have this class added */
  :global(.animated) {
    will-change: transform, opacity;
  }

  .product-detail-section {
    padding-top: 2rem;
    padding-bottom: 4rem;
    background-color: var(--color-cream-light, #f9f7f5);
  }

  .product-detail-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .breadcrumbs-container {
    margin-bottom: 1.5rem;
  }

  .breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    font-size: 0.875rem;
    color: var(--color-gray-600);
  }

  .breadcrumb-link {
    color: var(--color-gray-600);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .breadcrumb-link:hover {
    color: var(--color-gold);
  }

  .breadcrumb-separator {
    margin: 0 0.5rem;
    color: var(--color-gray-400);
  }

  .breadcrumb-current {
    color: var(--color-gray-900);
    font-weight: 500;
  }

  .product-detail {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  @media (min-width: 768px) {
    .product-detail {
      grid-template-columns: 1fr 1fr;
    }
  }

  .product-images {
    position: relative;
  }

  .product-main-image-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 2px;
    margin-bottom: 0.75rem;
    background-color: #f9f9f9;
    height: 400px;
  }

  @media (min-width: 768px) {
    .product-main-image-wrapper {
      height: 500px;
    }
  }

  .product-main-image-container {
    position: relative;
    width: 100%;
    height: 100%;
    cursor: zoom-in;
    overflow: hidden;
  }

  .product-main-image-container.zoomed {
    cursor: zoom-out;
  }

  .product-main-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .zoom-instruction {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    font-size: 0.75rem;
    color: var(--color-gray-700);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .zoom-instruction.hidden {
    opacity: 0;
  }

  .product-featured-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background-color: var(--color-gold);
    color: white;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 2px;
    z-index: 10;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .product-thumbnails {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .product-thumbnail-btn {
    width: 70px;
    height: 70px;
    padding: 0;
    border: 1px solid var(--color-gray-300);
    border-radius: 2px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
    background: none;
  }

  .product-thumbnail-btn.active {
    border-color: var(--color-gold);
    box-shadow: 0 0 0 2px var(--color-gold-light);
  }

  .product-thumbnail-btn:hover:not(.active) {
    border-color: var(--color-gold-light);
  }

  .product-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .product-info-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .product-info-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0;
    line-height: 1.2;
    font-family: var(--heading-font, serif);
  }

  @media (min-width: 768px) {
    .product-info-title {
      font-size: 2rem;
    }
  }

  .product-featured-label {
    font-size: 0.75rem;
    font-weight: 500;
    background-color: var(--color-gold-light);
    color: var(--color-gold-dark);
    padding: 0.25rem 0.5rem;
    border-radius: 2px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
  }

  .product-info-price {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-gold-dark);
  }

  .product-rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: -1rem;
  }

  .star {
    color: var(--color-gray-400);
    font-size: 1.25rem;
  }

  .star.filled {
    color: var(--color-gold);
  }

  .rating-count {
    font-size: 0.875rem;
    color: var(--color-gray-600);
    margin-left: 0.25rem;
  }

  .product-description {
    line-height: 1.7;
    color: var(--color-gray-700);
    font-size: 1.05rem;
  }

  .product-options {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 0.5rem;
  }

  .option-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .option-title {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 0;
  }

  .selected-option {
    font-weight: 500;
    color: var(--color-gold-dark);
  }

  .color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .color-option-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 0.5rem;
    position: relative;
  }

  .color-option {
    position: relative;
    padding: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: none;
  }

  .color-option.active {
    border-color: var(--color-gold);
    transform: scale(1.1);
  }

  .color-option:hover:not(.active) {
    transform: scale(1.1);
    border-color: var(--color-gray-300);
  }

  .color-option-label {
    font-size: 0.75rem;
    color: var(--color-gray-800);
    margin-top: 0.25rem;
    text-align: center;
    white-space: nowrap;
    font-weight: 500;
  }

  .color-swatch {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--color-gray-300);
  }

  .size-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .size-option {
    padding: 0.5rem 0.75rem;
    min-width: 40px;
    height: 40px;
    border: 1px solid var(--color-gray-300);
    border-radius: 2px;
    background: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-gray-700);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .size-option:hover:not(:disabled):not(.active) {
    border-color: var(--color-gold-light);
    color: var(--color-gold-dark);
    background-color: rgba(212, 175, 55, 0.05);
  }

  .size-option.active {
    border-color: var(--color-gold);
    background-color: var(--color-gold-light);
    color: var(--color-gold-dark);
    font-weight: 600;
  }

  .size-option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    text-decoration: line-through;
  }

  .size-guide-link {
    margin-top: 0.5rem;
  }

  .size-guide-button {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.88em;
    color: var(--color-gold-dark);
    text-decoration: underline;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }

  .size-guide-button:hover {
    color: var(--color-gold);
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    width: fit-content;
    border: 1px solid var(--color-gray-300);
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .quantity-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-gray-700);
    transition: all 0.2s ease;
  }

  .quantity-btn:hover:not(:disabled) {
    color: var(--color-gold-dark);
    background-color: var(--color-gold-light);
  }

  .quantity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quantity-value {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-weight: 500;
    color: var(--color-gray-900);
  }

  .stock-status {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .in-stock {
    color: #16a34a;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .low-stock {
    color: #d97706;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .out-of-stock {
    color: #dc2626;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .product-detail-actions {
    margin-top: 0.5rem;
  }

  .action-buttons {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .main-buttons {
    display: flex;
    flex: 1 1 0;
    gap: 1rem;
  }

  .add-to-cart-button, .buy-now-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    height: 48px;
    border-radius: 2px;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .add-to-cart-button {
    background-color: var(--color-gold-dark);
    color: var(--color-white);
    border: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }

  .add-to-cart-button:hover:not(:disabled) {
    background-color: var(--color-gold);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .add-to-cart-button.adding {
    pointer-events: none;
  }

  .add-to-cart-button.added {
    background-color: #16a34a;
  }

  .buy-now-button {
    background-color: var(--color-white);
    color: var(--color-gold-dark);
    border: 1px solid var(--color-gold-dark);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .buy-now-button:hover:not(:disabled) {
    background-color: var(--color-gold-light);
    color: var(--color-gold-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .buy-now-button.buying {
    pointer-events: none;
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
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    height: 48px;
    border: 1px solid var(--color-gray-300);
    border-radius: 2px;
    background: none;
    color: var(--color-gray-700);
    cursor: pointer;
    transition: all 0.2s ease;
    gap: 0.5rem;
  }

  .wishlist-text {
    font-size: 0.95em;
    font-weight: 500;
    margin-left: 0.25rem;
  }

  .btn-wishlist:hover {
    border-color: var(--color-gray-400);
    color: var(--color-gray-900);
    background-color: var(--color-gray-100);
  }

  .btn-wishlist.active {
    color: #dc2626;
    border-color: rgba(220, 38, 38, 0.3);
    background-color: rgba(220, 38, 38, 0.05);
  }

  .product-highlights {
    display: flex;
    gap: 2rem;
    margin: 1.5rem 0 0.5rem 0;
    padding: 1.5rem 0;
    border-top: 1px solid var(--color-gray-200);
    border-bottom: 1px solid var(--color-gray-200);
    justify-content: space-between;
  }

  .highlight-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .highlight-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-gold-light);
    border-radius: 50%;
    width: 38px;
    height: 38px;
    color: var(--color-gold-dark);
  }

  .highlight-content h4 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-gold-dark);
  }

  .highlight-content p {
    font-size: 0.82rem;
    margin: 0.15rem 0 0 0;
    color: var(--color-gray-700);
  }

  .product-meta {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--color-gray-700);
    margin-top: 0.5rem;
  }

  .meta-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 0.25rem;
  }

  .meta-label {
    min-width: 80px;
    display: inline-block;
    font-weight: 500;
    color: var(--color-gray-900);
  }

  .share-icons {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-left: 0.5rem;
  }

  .share-icon {
    color: var(--color-gray-500);
    display: flex;
    align-items: center;
    transition: color 0.2s, transform 0.2s;
    margin-right: 0.15rem;
  }

  .share-icon:hover {
    color: var(--color-gold-dark);
    transform: translateY(-2px);
  }

  .product-tabs {
    margin-top: 2.5rem;
    margin-bottom: 2.5rem;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    padding: 2rem;
  }

  .product-details-accordion {
    width: 100%;
  }

  .accordion-item {
    border-bottom: 1px solid var(--color-gray-200);
  }

  .accordion-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 0;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-weight: 500;
    color: var(--color-gray-900);
    transition: color 0.2s ease;
    font-size: 1.05rem;
  }

  .accordion-header:hover {
    color: var(--color-gold-dark);
  }

  .accordion-content {
    padding: 0 0 1.5rem 0;
    line-height: 1.6;
    color: var(--color-gray-700);
  }

  .product-features-list,
  .product-care-list,
  .product-delivery-list {
    padding-left: 1.5rem;
    margin: 0.5rem 0 0;
  }

  .product-features-list li,
  .product-care-list li,
  .product-delivery-list li {
    margin-bottom: 0.75rem;
  }

  .related-products-section {
    margin-top: 4rem;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    padding: 2rem;
  }

  .section-title {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
  }

  .section-title h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 0.75rem;
    font-family: var(--heading-font, serif);
  }

  .title-underline {
    width: 60px;
    height: 2px;
    background-color: var(--color-gold);
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  @media (min-width: 640px) {
    .product-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .product-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }
  }

  @media (max-width: 480px) {
    .product-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .related-products-section {
      padding: 1rem;
      margin-top: 2rem;
    }

    .section-title h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
  }

  @media (max-width: 350px) {
    .product-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  .related-product-card-wrapper {
    height: 100%;
  }

  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 0;
    gap: 1rem;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .not-found h1 {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0;
  }

  .not-found p {
    color: var(--color-gray-600);
    margin-bottom: 1.5rem;
  }

  .buy-now-tooltip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    color: var(--color-gray-800);
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: max-content;
    max-width: 250px;
    text-align: center;
    z-index: 100;
    pointer-events: none;
  }

  .buy-now-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -8px;
    border-width: 8px;
    border-style: solid;
    border-color: white transparent transparent transparent;
  }

  .buy-now-button-container {
    position: relative;
  }

  @media (max-width: 767px) {
    .action-buttons {
      flex-direction: column;
      gap: 0.75rem;
    }
    .main-buttons {
      flex-direction: column;
      gap: 0.75rem;
    }
    .btn-wishlist {
      min-width: 100px;
    }
    .product-highlights {
      flex-direction: column;
      gap: 1rem;
      padding: 0.5rem 0;
    }
    .highlight-item {
      gap: 0.5rem;
    }
  }
</style>
