<script lang="ts">
  import { onMount } from 'svelte';
  import { getProducts, getProductsByCategory, getCategories, getSizes, getColors } from '$lib/utils/data';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import QuickViewModal from '$lib/components/QuickViewModal.svelte';
  import type { Product } from '$lib/types';
  import { page } from '$app/stores';

  // Get page data
  export let data;
  const { slug } = data;

  let isFilterOpen = false;
  let products: Product[] = [];
  let selectedSort = 'featured'; // Added selectedSort state

  // Filters
  let selectedCategory = slug !== 'all' ? slug : '';
  let selectedSizes: string[] = [];
  let selectedColors: string[] = [];
  let minPrice = 0;
  let maxPrice = 100;
  let sortBy = 'featured';

  // Categories, sizes and colors
  const categories = getCategories();
  const sizes = getSizes();
  const colors = getColors();

  // Get price range of all products
  const allProducts = getProducts();
  const allPrices = allProducts.flatMap(p => p.variants.map(v => v.price));
  const globalMinPrice = Math.floor(Math.min(...allPrices));
  const globalMaxPrice = Math.ceil(Math.max(...allPrices));

  // Initial price filter values
  minPrice = globalMinPrice;
  maxPrice = globalMaxPrice;

  // Initialize products
  onMount(() => {
    updateProducts();
  });

  // Function to update products based on filters
  const updateProducts = () => {
    // Get base products by category or all products
    let filteredProducts = selectedCategory
      ? getProductsByCategory(selectedCategory)
      : getProducts();

    // Filter by size
    if (selectedSizes.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.variants.some(variant => selectedSizes.includes(variant.size))
      );
    }

    // Filter by color
    if (selectedColors.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.variants.some(variant => selectedColors.includes(variant.color.name))
      );
    }

    // Filter by price
    filteredProducts = filteredProducts.filter(product =>
      product.variants.some(variant =>
        variant.price >= minPrice && variant.price <= maxPrice
      )
    );

    // Sort products
    switch (sortBy) {
      case 'price-asc':
        filteredProducts.sort((a, b) => {
          const aMinPrice = Math.min(...a.variants.map(v => v.price));
          const bMinPrice = Math.min(...b.variants.map(v => v.price));
          return aMinPrice - bMinPrice;
        });
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => {
          const aMaxPrice = Math.max(...a.variants.map(v => v.price));
          const bMaxPrice = Math.max(...b.variants.map(v => v.price));
          return bMaxPrice - aMaxPrice;
        });
        break;
      case 'rating':
        filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // In real app, we'd sort by date, but our mock data doesn't have dates
        // For now, we'll just use the default order
        break;
      case 'featured':
      default:
        filteredProducts.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    products = filteredProducts;
  };

  // Handle filter changes
  const handleSizeChange = (size: string) => {
    if (selectedSizes.includes(size)) {
      selectedSizes = selectedSizes.filter(s => s !== size);
    } else {
      selectedSizes = [...selectedSizes, size];
    }
    updateProducts();
  };

  const handleColorChange = (color: string) => {
    if (selectedColors.includes(color)) {
      selectedColors = selectedColors.filter(c => c !== color);
    } else {
      selectedColors = [...selectedColors, color];
    }
    updateProducts();
  };

  const handleCategoryChange = (category: string) => {
    selectedCategory = category;
    updateProducts();
  };

  const handleSortChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    sortBy = target.value;
    updateProducts();
  };

  const resetFilters = () => {
    selectedCategory = slug !== 'all' ? slug : '';
    selectedSizes = [];
    selectedColors = [];
    minPrice = globalMinPrice;
    maxPrice = globalMaxPrice;
    sortBy = 'featured';
    updateProducts();
  };

  const toggleFilter = () => {
    isFilterOpen = !isFilterOpen;
  };

  // Quick View functionality
  let quickViewProduct = null;
  let quickViewOpen = false;

  const handleQuickView = (event) => {
    quickViewProduct = event.detail.product;
    quickViewOpen = true;
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleCloseQuickView = () => {
    quickViewOpen = false;
    // Re-enable scrolling when modal closes
    document.body.style.overflow = '';
  };

  // Fix capitalized category name for display
  $: categoryName = slug === 'all'
    ? 'All Products'
    : categories.find(c => c.name.toLowerCase() === slug)?.name || slug;
</script>

<svelte:head>
  <title>Pransh - {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</title>
  <meta name="description" content="Browse our {categoryName} collection - luxury clothing with timeless elegance and exceptional quality.">
</svelte:head>

<section class="section">
  <div class="container">
    <!-- Page Header -->
    <div class="section-title mb-8">
      <h1 class="hero-title">{categoryName}</h1>
      <p class="section-subtitle">
        Discover our exquisite collection of {categoryName.toLowerCase()},
        crafted with premium materials for the discerning customer.
      </p>
    </div>

    <!-- Filters and Products -->
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Mobile Filter Toggle -->
      <div class="lg:hidden mb-4">
        <button
          class="w-full py-3 px-4 border flex items-center justify-between bg-white"
          on:click={toggleFilter}
        >
          <span class="font-serif text-lg">Filters & Sorting</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="lg:w-1/4 {isFilterOpen ? 'block' : 'hidden lg:block'}">
        <div class="bg-white p-6 sticky top-24">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-serif text-xl">Filters</h2>
            <button
              class="text-sm text-gold hover:underline transition-colors"
              on:click={resetFilters}
            >
              Reset All
            </button>
          </div>

          <!-- Categories -->
          <div class="mb-8">
            <h3 class="font-medium mb-3 pb-2 border-b border-cream-dark">Categories</h3>
            <div class="space-y-3 mt-4">
              <label class="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={selectedCategory === ''}
                  on:change={() => handleCategoryChange('')}
                  class="mr-3 text-gold"
                >
                <span class="text-charcoal hover:text-gold transition-colors">All Categories</span>
              </label>

              {#each categories as category}
                <label class="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={category.name.toLowerCase()}
                    checked={selectedCategory === category.name.toLowerCase()}
                    on:change={() => handleCategoryChange(category.name.toLowerCase())}
                    class="mr-3 text-gold"
                  >
                  <span class="text-charcoal hover:text-gold transition-colors">{category.name}</span>
                </label>
              {/each}
            </div>
          </div>

          <!-- Sizes -->
          <div class="mb-8">
            <h3 class="font-medium mb-3 pb-2 border-b border-cream-dark">Sizes</h3>
            <div class="flex flex-wrap gap-2 mt-4">
              {#each sizes as size}
                <label
                  class="size-selector {selectedSizes.includes(size.name) ? 'active' : ''}"
                >
                  <input
                    type="checkbox"
                    class="sr-only"
                    value={size.name}
                    checked={selectedSizes.includes(size.name)}
                    on:change={() => handleSizeChange(size.name)}
                  >
                  {size.name}
                </label>
              {/each}
            </div>
          </div>

          <!-- Colors -->
          <div class="mb-8">
            <h3 class="font-medium mb-3 pb-2 border-b border-cream-dark">Colors</h3>
            <div class="flex flex-wrap gap-3 mt-4">
              {#each colors as color}
                <label
                  class="color-selector {selectedColors.includes(color.name) ? 'active' : ''}"
                  style="background-color: {color.hex}; border-color: {color.hex === '#FFFFFF' ? '#e2e2e2' : color.hex}"
                  title={color.name}
                >
                  <input
                    type="checkbox"
                    class="sr-only"
                    value={color.name}
                    checked={selectedColors.includes(color.name)}
                    on:change={() => handleColorChange(color.name)}
                  >
                </label>
              {/each}
            </div>
          </div>

          <!-- Price Range -->
          <div class="mb-8">
            <h3 class="font-medium mb-3 pb-2 border-b border-cream-dark">Price Range</h3>
            <div class="flex items-center justify-between mb-4 mt-4">
              <span class="price-label">${minPrice}</span>
              <span class="price-label">${maxPrice}</span>
            </div>

            <!-- Simplified range sliders -->
            <div class="flex space-x-4">
              <input
                type="range"
                min={globalMinPrice}
                max={globalMaxPrice}
                bind:value={minPrice}
                on:change={updateProducts}
                class="price-slider"
              >
              <input
                type="range"
                min={globalMinPrice}
                max={globalMaxPrice}
                bind:value={maxPrice}
                on:change={updateProducts}
                class="price-slider"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Products -->
      <div class="lg:w-3/4">
        <!-- Sort and Result Count -->
        <div class="bg-white p-4 mb-8 flex flex-col sm:flex-row justify-between items-center">
          <div class="mb-4 sm:mb-0">
            <p class="results-count">{products.length} products found</p>
          </div>

          <div class="flex items-center">
            <label for="sort-select" class="mr-3 font-medium">Sort by:</label>
            <select
              id="sort-select"
              class="sort-select"
              bind:value={selectedSort}
              on:change={handleSortChange}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        <!-- Product Grid -->
        {#if products.length > 0}
          <div class="product-grid">
            {#each products as product}
              <ProductCard {product} on:quickview={handleQuickView} />
            {/each}
          </div>
        {:else}
          <div class="bg-white p-12 text-center">
            <p class="text-xl mb-4">No products found matching your criteria</p>
            <button class="btn btn-secondary" on:click={resetFilters}>Reset Filters</button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<!-- QuickView Modal -->
<QuickViewModal
  product={quickViewProduct}
  open={quickViewOpen}
  on:close={handleCloseQuickView}
/>

<style>
  .price-label {
    font-weight: 500;
    color: var(--color-gold);
  }

  .price-slider {
    -webkit-appearance: none;
    height: 3px;
    background: var(--color-cream-dark);
    cursor: pointer;
    width: 100%;
  }

  .price-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: var(--color-gold);
    cursor: pointer;
    border: none;
  }

  .size-selector {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-charcoal-light);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
  }

  .size-selector:hover {
    border-color: var(--color-gold);
  }

  .size-selector.active {
    background-color: var(--color-gold);
    color: var(--color-white);
    border-color: var(--color-gold);
  }

  .color-selector {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid;
    transition: all 0.3s ease;
    position: relative;
  }

  .color-selector.active {
    transform: scale(1.15);
    box-shadow: 0 0 0 2px var(--color-gold);
  }

  .color-selector.active::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    background-color: rgba(255,255,255,0.5);
    border-radius: 50%;
  }

  .sort-select {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-cream-dark);
    background-color: var(--color-white);
    font-size: 0.9rem;
    min-width: 200px;
    transition: border-color 0.3s ease;
  }

  .sort-select:focus {
    outline: none;
    border-color: var(--color-gold);
  }

  .results-count {
    font-size: 0.9rem;
    color: var(--color-charcoal-light);
  }
</style>
