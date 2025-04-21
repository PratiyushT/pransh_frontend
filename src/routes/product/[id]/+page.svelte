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
  let isBuyingNow = false; // New state for Buy Now loading

  $: selectedVariant = product?.variants[selectedVariantIndex] || null;

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
          .map(v => v.size.name)
      )]
    : [];

  $: variantImages = product
    ? (() => {
        const filteredVariants = product.variants
          .filter(v => v.color && selectedColor && v.color._id === selectedColor._id);

        if (filteredVariants.length > 0) {
          const images = filteredVariants
            .flatMap(v => v.images || [])
            .filter(url => url)
            .map(url => ({ url }));

          if (images.length > 0) {
            return images;
          }
        }
        return product.image ? [{ url: product.image }] : [];
      })()
    : [];

  $: if (product) {
    isWishlisted = isInWishlist(product._id);
  }

  $: if (product && product.variants && product.variants.length > 0) {
    if (!selectedColor && product.variants[0]?.color) {
      selectedColor = product.variants[0]?.color;
    }
    if (!selectedSize) {
      if (selectedColor) {
        const variantWithColor = product.variants.find(v => v.color && v.color._id === selectedColor._id);
        if (variantWithColor) {
          selectedSize = variantWithColor.size.name;
        } else {
          selectedSize = product.variants[0]?.size?.name || '';
        }
      } else {
        selectedSize = product.variants[0]?.size?.name || '';
      }
    }
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

  const selectSize = (size: string) => {
    selectedSize = size;

    const variantIndex = product?.variants.findIndex(
      v => v.size.name === selectedSize && (selectedColor ? v.color._id === selectedColor._id : true)
    );

    if (variantIndex !== -1 && variantIndex !== undefined) {
      selectedVariantIndex = variantIndex;
      selectedColor = product?.variants[variantIndex].color;
      activeImage = 0;
    } else {
      const sizeVariantIndex = product?.variants.findIndex(v => v.size.name === selectedSize);
      if (sizeVariantIndex !== -1 && sizeVariantIndex !== undefined) {
        selectedVariantIndex = sizeVariantIndex;
        selectedColor = product?.variants[sizeVariantIndex].color;
        activeImage = 0;
      }
    }
  };

  const selectColor = (color) => {
    if (color) {
      selectedColor = color;

      const firstColorVariant = product?.variants.find(v =>
        v.color && v.color._id === color._id
      );

      if (firstColorVariant) {
        if (!availableSizes.includes(selectedSize)) {
          selectedSize = firstColorVariant.size.name;
        }

        const specificVariant = product?.variants.find(v =>
          v.color && v.color._id === color._id && v.size.name === selectedSize
        );

        if (specificVariant) {
          const variantIndex = product?.variants.findIndex(v => v._id === specificVariant._id);
          if (variantIndex !== -1) {
            selectedVariantIndex = variantIndex;
          }
        } else {
          const colorVariantIndex = product?.variants.findIndex(v => v._id === firstColorVariant._id);
          if (colorVariantIndex !== -1) {
            selectedVariantIndex = colorVariantIndex;
            selectedSize = firstColorVariant.size.name;
          }
        }
      }
      activeImage = 0;
    }
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
          <div class="product-main-image-wrapper">
            <div
              class="product-main-image-container {zoomedImage ? 'zoomed' : ''}"
              on:click={toggleZoom}
              on:keydown={(e) => e.key === 'Enter' && toggleZoom(e)}
              role="button"
              tabindex="0"
              aria-label="Click to zoom image"
            >
              {#if product.isFeatured}
                <div class="product-featured-badge">Featured</div>
              {/if}
              <img
                src={(variantImages && variantImages.length > 0) ?
                    variantImages[activeImage]?.url || product?.image || "/images/product-placeholder.jpg" :
                    product?.image || "/images/product-placeholder.jpg"}
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
                <h3 class="option-title">Color: <span class="selected-option">{selectedColor?.name || 'Select a color'}</span></h3>
                <div class="color-options">
                  {#each availableColors as color}
                    {#if color}
                    <button
                      class="color-option {selectedColor?._id === color._id ? 'active' : ''}"
                      on:click={() => selectColor(color)}
                      aria-label={`Select ${color.name} color`}
                      aria-pressed={selectedColor?._id === color._id}
                    >
                      {#if color.hex && Array.isArray(color.hex) && color.hex.length > 1}
                        <ColorPieChart hexColors={color.hex} size={24} border={true} borderColor={selectedColor?._id === color._id ? 'var(--color-gold)' : '#e2e2e2'} borderWidth={2} />
                      {:else}
                        <span
                          class="color-swatch"
                          style="background-color: {Array.isArray(color.hex) ? color.hex[0] || '#ccc' : color.hex || '#ccc'}; border-color: {Array.isArray(color.hex) ? (color.hex[0] === '#FFFFFF' ? '#e2e2e2' : color.hex[0] || '#ccc') : (color.hex === '#FFFFFF' ? '#e2e2e2' : color.hex || '#ccc')}"
                        ></span>
                      {/if}
                    </button>
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
                      disabled={!product.variants.some(v => v.size.name === size && v.color?._id === selectedColor?._id)}
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
          </div>

          <!-- Product Actions with Buy Now Tooltip -->
          <div class="product-detail-actions">
            {#if inStock}
              <div class="flex flex-col md:flex-row gap-4 items-stretch">
                <div class="add-to-cart-button-container">
                  <button
                    class="add-to-cart-button btn-add-to-cart {isAddingToCart ? 'adding' : ''} {addedToCart ? 'added' : ''}"
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
                      <span>Added</span>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      <span>Add to Cart</span>
                    {/if}
                  </button>
                </div>

                <div class="buy-now-button-container relative">
                  <button
                    class="buy-now-button btn-buy-now {isBuyingNow ? 'buying' : ''}"
                    on:click={handleBuyNow}
                    disabled={!inStock || isAddingToCart || isBuyingNow}
                    title="Go directly to checkout with this item"
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
                  <div class="buy-now-tooltip" tabindex="-1">
                    <span>Go directly to checkout with this item.</span>
                    {#if $cart.length > 1}
                      <span class="font-semibold block">Your current cart items will be saved for later.</span>
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
                </button>
              </div>
            {/if}
          </div>
          <!-- End Product Actions with Buy Now Tooltip -->

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
  /* ... all CSS unchanged ... */
</style>
