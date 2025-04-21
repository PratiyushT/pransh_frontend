<script lang="ts">
  import { onMount } from 'svelte';
  import { formatPrice } from '$lib/utils/data';
  import { addToCart, isInWishlist, toggleWishlist } from '$lib/stores';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import ColorPieChart from '$lib/components/ColorPieChart.svelte';
  import { goto } from '$app/navigation';

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

  const handleBuyNow = () => {
    if (product && selectedVariant) {
      isBuyingNow = true;
      addToCart(product._id, selectedVariant._id, quantity);
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

          <div class="product-actions">
            <button
              class="btn-add-to-cart {isAddingToCart ? 'adding' : ''} {addedToCart ? 'added' : ''}"
              on:click={handleAddToCart}
              disabled={!inStock || isAddingToCart || isBuyingNow}
            >
              {#if isAddingToCart}
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

            <button
              class="btn-buy-now {isBuyingNow ? 'buying' : ''}"
              on:click={handleBuyNow}
              disabled={!inStock || isAddingToCart || isBuyingNow}
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
  .product-detail-section {
    padding-top: 2rem;
    padding-bottom: 2rem;
    background: var(--color-cream-light, #f9f6f1);
    min-height: 100vh;
  }

  .product-detail-container {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
  }

  .breadcrumbs-container {
    margin-bottom: 2rem;
  }

  .product-detail {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
    margin-bottom: 5rem;
    background-color: var(--color-white);
    border-radius: 4px;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
    padding: 0;
    overflow: hidden;
  }

  .product-images {
    position: relative;
    background: var(--color-cream-dark, #f4ede5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    min-width: 0;
    min-height: 0;
    padding: 2.5rem 2.5rem 2.5rem 2.5rem;
    border-radius: 0;
  }

  .product-main-image-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .product-main-image-container {
    position: relative;
    overflow: hidden;
    background-color: var(--color-cream-dark);
    cursor: zoom-in;
    aspect-ratio: 1;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    max-height: 520px;
    width: 100%;
  }

  .product-main-image-container.zoomed {
    cursor: zoom-out;
  }

  .product-main-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s cubic-bezier(.77,0,.18,1);
    background: transparent;
    border-radius: 4px;
    max-width: 100%;
    max-height: 520px;
    min-height: 320px;
    min-width: 0;
    user-select: none;
    pointer-events: all;
  }

  .zoom-instruction {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    background-color: rgba(255, 255, 255, 0.88);
    padding: 0.5rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    opacity: 0;
    transition: opacity 0.3s ease;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
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
    justify-content: flex-start;
    align-items: center;
    width: 100%;
  }

  .product-thumbnail-btn {
    width: 60px;
    height: 60px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    padding: 0;
    background: none;
    border-radius: 8px;
    transition: all 0.24s cubic-bezier(.77,0,.18,1);
    box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  }

  .product-thumbnail-btn:hover {
    border-color: var(--color-charcoal-light, #b5b3b2);
  }

  .product-thumbnail-btn.active {
    border-color: var(--color-gold, #cba046);
    box-shadow: 0 2px 8px rgba(203,160,70,0.08);
  }

  .product-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    background: #f3f3f3;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    padding: 2.5rem;
    min-width: 0;
    min-height: 0;
    background: var(--color-white);
    border-radius: 0;
    justify-content: flex-start;
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
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .product-info-price {
    font-size: 1.5rem;
    color: var(--color-gold);
    font-weight: 500;
    margin-bottom: 1rem;
    letter-spacing: 0.01em;
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
    color: var(--color-charcoal);
    font-size: 1.08rem;
    letter-spacing: 0.01em;
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
    letter-spacing: 0.01em;
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.23s cubic-bezier(.77,0,.18,1);
    padding: 0;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-color: #e2e2e2;
    outline: none;
  }

  .color-option:hover {
    transform: scale(1.12);
    border-color: var(--color-gold);
    z-index: 2;
  }

  .color-option.active {
    box-shadow: 0 0 0 2px var(--color-white), 0 0 0 4px var(--color-gold);
    border-color: var(--color-gold);
    z-index: 2;
  }

  .color-swatch {
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid;
    background: #fff;
  }

  .size-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .size-option {
    min-width: 44px;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1.5px solid var(--color-charcoal-light, #b5b3b2);
    font-size: 0.97rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.23s cubic-bezier(.77,0,.18,1);
    padding: 0 1.1rem;
    background: none;
    border-radius: 8px;
    color: var(--color-charcoal);
    background: var(--color-cream-light, #f9f6f1);
    outline: none;
  }

  .size-option:hover:not([disabled]) {
    border-color: var(--color-gold);
    background: var(--color-cream-dark, #f4ede5);
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
    background: #f6f6f6;
    color: #bdbdbd;
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    border: 1px solid var(--color-charcoal-light);
    max-width: 140px;
    background: var(--color-cream-light, #f9f6f1);
    border-radius: 8px;
    overflow: hidden;
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
    transition: all 0.22s cubic-bezier(.77,0,.18,1);
    font-size: 1.2rem;
    color: var(--color-charcoal);
    outline: none;
  }

  .quantity-btn:hover:not([disabled]) {
    background-color: var(--color-cream-dark, #f4ede5);
  }

  .quantity-btn[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quantity-value {
    flex: 1;
    text-align: center;
    font-weight: 500;
    font-size: 1.11rem;
    color: var(--color-charcoal);
    user-select: none;
  }

  .stock-status {
    margin-top: 0.75rem;
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 0.01em;
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
    gap: 0.6rem;
    margin: 2rem 0;
    align-items: center;
    flex-wrap: nowrap;
  }

  .btn-add-to-cart {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    border: none;
    padding: 0.875rem 0.75rem;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(.77,0,.18,1);
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    min-width: 0;
    min-height: 0;
    outline: none;
    white-space: nowrap;
    text-overflow: ellipsis;
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
    z-index: 0;
  }

  .btn-add-to-cart:hover:not([disabled])::before {
    transform: translateX(0);
  }

  .btn-add-to-cart:hover:not([disabled]) {
    background-color: var(--color-gold-dark, #a9852f);
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
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background-color: var(--color-charcoal);
    color: var(--color-white);
    border: none;
    padding: 0.875rem 0.75rem;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(.77,0,.18,1);
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    min-width: 0;
    min-height: 0;
    outline: none;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .btn-buy-now::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateX(-100%);
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
    z-index: 0;
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

  .btn-buy-now.buying {
    background-color: var(--color-charcoal);
    opacity: 0.9;
  }

  .btn-wishlist {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-white);
    border: 1.5px solid var(--color-charcoal-light, #b5b3b2);
    cursor: pointer;
    transition: all 0.22s cubic-bezier(.77,0,.18,1);
    border-radius: 50%;
    color: var(--color-charcoal);
    outline: none;
    padding: 0;
    font-size: 1.2rem;
  }

  .btn-wishlist:hover {
    border-color: var(--color-gold);
    color: var(--color-gold);
    background: var(--color-cream-dark, #f4ede5);
  }

  .btn-wishlist.active {
    background-color: var(--color-cream-dark);
    color: var(--color-gold);
    border-color: var(--color-gold);
  }

  .product-meta {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-cream-dark);
  }

  .meta-item {
    display: flex;
    margin-bottom: 0.5rem;
    font-size: 0.97rem;
    color: var(--color-charcoal);
  }

  .meta-label {
    width: 110px;
    color: var(--color-charcoal-light);
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  .product-details-accordion {
    margin-top: 2rem;
    border-top: 1px solid var(--color-cream-dark);
  }

  .accordion-item {
    border-bottom: 1px solid var(--color-cream-dark);
  }

  .accordion-header {
    width: 100%;
    padding: 1.25rem 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 500;
    font-size: 1rem;
    color: var(--color-charcoal);
    text-align: left;
    transition: color 0.2s ease;
  }

  .accordion-header:hover {
    color: var(--color-gold);
  }

  .accordion-header svg {
    transition: transform 0.3s ease;
  }

  .accordion-content {
    padding: 0 0 1.5rem 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--color-charcoal-light);
  }

  .product-features-list,
  .product-care-list,
  .product-delivery-list {
    list-style: none;
    padding-left: 0;
    margin: 0.5rem 0;
  }

  .product-features-list li,
  .product-care-list li,
  .product-delivery-list li {
    position: relative;
    padding-left: 1.5rem;
    margin-bottom: 0.5rem;
    line-height: 1.6;
  }

  .product-features-list li:before,
  .product-care-list li:before,
  .product-delivery-list li:before {
    content: "•";
    position: absolute;
    left: 0.5rem;
    color: var(--color-gold);
  }

  .related-products-section {
    margin-top: 5rem;
    background: none;
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

  /* --- Related Products Grid Styling --- */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
    width: 100%;
  }

  .related-product-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2rem;
    width: 100%;
    align-items: stretch;
  }

  .related-product-card-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
  }

  .related-product-card-wrapper :global(.product-card) {
    margin: 0 !important;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .related-product-card-wrapper :global(.product-card-image) {
    object-fit: cover !important;
    width: 100% !important;
    height: 220px !important;
    min-height: 180px;
    max-height: 260px;
    border-radius: 8px 8px 0 0;
    background: #f8f8f8;
    display: block;
  }

  @media (max-width: 767px) {
    .product-detail-container {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
    .product-detail {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    .product-grid,
    .related-product-grid {
      grid-template-columns: repeat(1, 1fr);
      gap: 1.5rem;
    }
    .breadcrumbs-container {
      margin-bottom: 1.5rem;
    }
    .product-featured-badge {
      top: 0.75rem;
      left: 0.75rem;
      font-size: 0.6rem;
      padding: 0.3rem 0.6rem;
    }
    .product-featured-label {
      margin-left: 0.5rem;
      font-size: 0.6rem;
      padding: 0.2rem 0.5rem;
      transform: translateY(-3px);
    }
    .product-info-title {
      font-size: 2rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }
    .related-product-card-wrapper :global(.product-card-image) {
      height: 140px !important;
      min-height: 100px;
      max-height: 180px;
    }
    .product-main-image-container {
      min-height: 220px;
      max-height: 320px;
    }
    .product-main-image {
      min-height: 220px;
      max-height: 320px;
    }
    .product-actions {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .btn-add-to-cart,
    .btn-buy-now {
      flex: 1 1 calc(50% - 0.5rem);
      padding: 0.75rem 0.5rem;
      font-size: 0.9rem;
    }
    .btn-wishlist {
      flex: 0 0 auto;
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .product-detail-container {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
    .product-grid,
    .related-product-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    .related-product-card-wrapper :global(.product-card-image) {
      height: 180px !important;
      min-height: 120px;
      max-height: 220px;
    }
    .product-main-image-container {
      min-height: 320px;
      max-height: 400px;
    }
    .product-main-image {
      min-height: 320px;
      max-height: 400px;
    }
  }

  @media (min-width: 768px) {
    .product-detail-container {
      padding-left: 2rem;
      padding-right: 2rem;
    }
    .product-detail {
      grid-template-columns: 1fr 1fr;
      gap: 0;
      margin-bottom: 7rem;
    }
    .product-images {
      padding: 2.5rem 2.5rem 2.5rem 3.5rem;
      border-radius: 12px 0 0 12px;
      min-width: 0;
      max-width: none;
      min-height: 0;
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
    .product-main-image-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .product-main-image-container {
      min-width: 0;
      width: 100%;
      height: auto;
      max-width: 100%;
      min-height: 400px;
      max-height: 600px;
      aspect-ratio: 1;
    }
    .product-main-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      max-height: 600px;
      min-height: 400px;
    }
    .product-info {
      padding: 2.5rem 3.5rem 2.5rem 2.5rem;
      border-radius: 0 12px 12px 0;
      flex: 1;
      width: 100%;
    }
    .product-info-title {
      font-size: 3rem;
    }
  }

  @media (min-width: 1024px) {
    .product-detail-container {
      padding-left: 2.5rem;
      padding-right: 2.5rem;
    }
    .product-detail {
      gap: 0;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
    }
    .product-detail-section {
      padding-top: 3rem;
      padding-bottom: 3rem;
    }
    .product-images {
      padding: 3.5rem 3.5rem 3.5rem 4.5rem;
    }
    .product-info {
      padding: 3.5rem 4.5rem 3.5rem 3.5rem;
    }
    .product-main-image-container {
      min-width: 0;
      max-width: none;
      width: 100%;
      min-height: 500px;
      max-height: 700px;
    }
    .product-main-image {
      max-width: 100%;
      max-height: 700px;
      min-height: 500px;
    }
    .product-thumbnails {
      max-width: 100%;
      justify-content: center;
    }
  }

  @media (min-width: 1280px) {
    .product-detail-container {
      padding-left: 0;
      padding-right: 0;
      max-width: 1400px;
    }
    .product-detail {
      gap: 2rem;
    }
    .product-main-image-container {
      min-height: 600px;
      max-height: 800px;
    }
    .product-main-image {
      max-height: 800px;
      min-height: 600px;
    }
    .product-images {
      padding: 4rem;
    }
    .product-info {
      padding: 4rem;
    }
  }

  /* --- Featured Badge and Label --- */
  .product-featured-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.4rem 0.8rem;
    z-index: 5;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    animation: featuredBadgePulse 2s infinite alternate ease-in-out;
  }

  @keyframes featuredBadgePulse {
    0% {
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    100% {
      box-shadow: 0 2px 15px rgba(212, 175, 55, 0.5);
    }
  }

  .product-featured-label {
    display: inline-flex;
    align-items: center;
    margin-left: 1rem;
    background-color: var(--color-gold);
    color: var(--color-white);
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.25rem 0.6rem;
    border-radius: 2px;
    vertical-align: middle;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
    transform: translateY(-4px);
  }
</style>
