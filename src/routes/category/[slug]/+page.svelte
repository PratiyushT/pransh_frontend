<script lang="ts">
  import { onMount } from 'svelte';
  import { getProducts, getProductsByCategory, getCategories, getSizes, getColors } from '$lib/utils/data';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import QuickViewModal from '$lib/components/QuickViewModal.svelte';
  import type { Product } from '$lib/types';
  import { page } from '$app/stores';
  import gsap from 'gsap';

  // Get page data
  export let data;
  const { slug } = data;

  let isFilterOpen = false;
  let products: Product[] = [];
  let selectedSort = 'featured'; // Added selectedSort state
  let pageContainer: HTMLElement;
  let heroSection: HTMLElement;
  let productGrid: HTMLElement;
  let filterSection: HTMLElement;
  let isInitialLoad = true;

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

    // Animate page elements on load
    if (isInitialLoad) {
      // Fade in hero section
      gsap.fromTo(heroSection,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );

      // Animate filters
      gsap.fromTo(filterSection,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, delay: 0.2, ease: "power2.out" }
      );

      // Animate product grid with staggered effect
      const productCards = productGrid?.querySelectorAll('.product-card-wrapper');
      if (productCards?.length) {
        gsap.fromTo(productCards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            delay: 0.3,
            ease: "power2.out"
          }
        );
      }

      isInitialLoad = false;
    }
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

    // Animate product changes if not initial load
    if (!isInitialLoad && productGrid) {
      // Animate out the current products
      gsap.to(productGrid, {
        opacity: 0,
        y: 15,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          // Update products
          products = filteredProducts;

          // Wait for DOM update then animate in
          setTimeout(() => {
            gsap.to(productGrid, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out"
            });
          }, 50);
        }
      });
    } else {
      products = filteredProducts;
    }
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

    // Animate filter opening/closing
    if (filterSection) {
      if (isFilterOpen) {
        gsap.fromTo(filterSection,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      } else {
        gsap.to(filterSection, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in"
        });
      }
    }
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

<section class="section shop-section" bind:this={pageContainer}>
  <div class="container">
    <!-- Page Header -->
    <div class="section-title mb-12" bind:this={heroSection}>
      <h1 class="hero-title fade-in">{categoryName}</h1>
      <p class="section-subtitle fade-in">
        Discover our exquisite collection of {categoryName.toLowerCase()},
        crafted with premium materials for the discerning customer.
      </p>
      <div class="hero-line"></div>
    </div>

    <!-- Filters and Products -->
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Mobile Filter Toggle -->
      <div class="lg:hidden mb-4">
        <button
          class="filter-toggle w-full py-3 px-4 flex items-center justify-between"
          on:click={toggleFilter}
        >
          <span class="font-serif text-lg">Filters & Sorting</span>
          <div class="toggle-icon">
            <span class={isFilterOpen ? 'open' : ''}></span>
            <span class={isFilterOpen ? 'open' : ''}></span>
          </div>
        </button>
      </div>

      <!-- Filters -->
      <div class="lg:w-1/4 filter-container {isFilterOpen ? 'block' : 'hidden lg:block'}" bind:this={filterSection}>
        <div class="filter-wrapper">
          <div class="flex justify-between items-center mb-8">
            <h2 class="filter-heading">Filters</h2>
            <button
              class="reset-button"
              on:click={resetFilters}
            >
              Reset All
            </button>
          </div>

          <!-- Categories -->
          <div class="filter-group">
            <h3 class="filter-title">Categories</h3>
            <div class="space-y-3 mt-4">
              <label class="filter-option">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={selectedCategory === ''}
                  on:change={() => handleCategoryChange('')}
                  class="filter-radio"
                >
                <span class="filter-text">All Categories</span>
              </label>

              {#each categories as category}
                <label class="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value={category.name.toLowerCase()}
                    checked={selectedCategory === category.name.toLowerCase()}
                    on:change={() => handleCategoryChange(category.name.toLowerCase())}
                    class="filter-radio"
                  >
                  <span class="filter-text">{category.name}</span>
                </label>
              {/each}
            </div>
          </div>

          <!-- Sizes -->
          <div class="filter-group">
            <h3 class="filter-title">Sizes</h3>
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
          <div class="filter-group">
            <h3 class="filter-title">Colors</h3>
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
          <div class="filter-group">
            <h3 class="filter-title">Price Range</h3>
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
      <div class="lg:w-3/4 products-container">
        <!-- Sort and Result Count -->
        <div class="sort-container mb-8">
          <div class="results-info">
            <p class="results-count">{products.length} products found</p>
          </div>

          <div class="sort-wrapper">
            <label for="sort-select" class="sort-label">Sort by:</label>
            <div class="select-wrapper">
              <select
                id="sort-select"
                class="sort-select"
                bind:value={selectedSort}
                on:change={handleSortChange}
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Product Grid -->
        {#if products.length > 0}
          <div class="product-grid" bind:this={productGrid}>
            {#each products as product}
              <ProductCard {product} on:quickview={handleQuickView} />
            {/each}
          </div>
        {:else}
          <div class="no-products">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="no-products-icon">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line>
            </svg>
            <p class="no-products-text">No products found matching your criteria</p>
            <button class="reset-filters-btn" on:click={resetFilters}>Reset Filters</button>
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
  /* Hero Section Styling */
  .hero-title {
    position: relative;
    margin-bottom: 1.5rem;
    letter-spacing: 0.02em;
  }

  .section-subtitle {
    max-width: 700px;
    margin: 0 auto 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
    color: var(--color-charcoal-light);
  }

  .hero-line {
    width: 60px;
    height: 3px;
    background-color: var(--color-gold);
    margin: 0 auto;
    transition: width 0.5s ease;
  }

  .shop-section:hover .hero-line {
    width: 120px;
  }

  /* Filter Toggle Styling */
  .filter-toggle {
    background-color: var(--color-white);
    border: 1px solid var(--color-cream-dark);
    border-radius: 4px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .filter-toggle:hover {
    border-color: var(--color-gold);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .toggle-icon {
    width: 20px;
    height: 20px;
    position: relative;
  }

  .toggle-icon span {
    position: absolute;
    width: 100%;
    height: 2px;
    background-color: var(--color-charcoal);
    transition: all 0.3s ease;
    right: 0;
  }

  .toggle-icon span:first-child {
    top: 8px;
    transform: rotate(0deg);
  }

  .toggle-icon span:last-child {
    bottom: 8px;
    width: 70%;
    transform: rotate(0deg);
  }

  .toggle-icon span.open:first-child {
    transform: rotate(45deg);
    top: 9px;
    background-color: var(--color-gold);
  }

  .toggle-icon span.open:last-child {
    transform: rotate(-45deg);
    bottom: 9px;
    width: 100%;
    background-color: var(--color-gold);
  }

  /* Filter Container Styling */
  .filter-wrapper {
    background-color: var(--color-white);
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
    position: sticky;
    top: 110px;
  }

  .filter-heading {
    font-family: var(--heading-font);
    font-size: 1.5rem;
    color: var(--color-charcoal);
    font-weight: 500;
  }

  .reset-button {
    font-size: 0.9rem;
    color: var(--color-gold);
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }

  .reset-button:after {
    content: '';
    position: absolute;
    width: 0;
    height: 1px;
    bottom: -2px;
    left: 0;
    background-color: var(--color-gold);
    transition: width 0.3s ease;
  }

  .reset-button:hover:after {
    width: 100%;
  }

  .filter-group {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-cream-dark);
  }

  .filter-group:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .filter-title {
    font-weight: 600;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--color-cream-dark);
    color: var(--color-charcoal);
    transition: border-color 0.3s ease;
  }

  .filter-group:hover .filter-title {
    border-color: var(--color-gold);
  }

  .filter-option {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: transform 0.3s ease;
  }

  .filter-option:hover {
    transform: translateX(5px);
  }

  .filter-radio {
    margin-right: 1rem;
    -webkit-appearance: none;
    appearance: none;
    background-color: #fff;
    margin: 0;
    width: 1.2em;
    height: 1.2em;
    border: 1px solid var(--color-charcoal-light);
    border-radius: 50%;
    margin-right: 0.75rem;
    display: grid;
    place-content: center;
    transition: all 0.3s ease;
  }

  .filter-radio:checked {
    border-color: var(--color-gold);
  }

  .filter-radio::before {
    content: "";
    width: 0.65em;
    height: 0.65em;
    border-radius: 50%;
    transform: scale(0);
    transition: 0.3s transform ease;
    box-shadow: inset 1em 1em var(--color-gold);
  }

  .filter-radio:checked::before {
    transform: scale(1);
  }

  .filter-text {
    color: var(--color-charcoal);
    transition: color 0.3s ease;
  }

  .filter-option:hover .filter-text {
    color: var(--color-gold);
  }

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
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-gold);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .price-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
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
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border-radius: 2px;
  }

  .size-selector:hover {
    border-color: var(--color-gold);
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .size-selector.active {
    background-color: var(--color-gold);
    color: var(--color-white);
    border-color: var(--color-gold);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 12px rgba(212, 175, 55, 0.3);
  }

  .color-selector {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
  }

  .color-selector.active {
    transform: scale(1.15);
    box-shadow: 0 0 0 2px var(--color-gold);
  }

  .color-selector:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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

  /* Products Area Styling */
  .products-container {
    position: relative;
  }

  .sort-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
    padding: 1.5rem;
    background-color: var(--color-white);
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  }

  @media (min-width: 640px) {
    .sort-container {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .sort-wrapper {
    display: flex;
    align-items: center;
  }

  .sort-label {
    margin-right: 1rem;
    font-weight: 500;
    color: var(--color-charcoal);
  }

  .select-wrapper {
    position: relative;
  }

  .select-wrapper::after {
    content: '▼';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 10px;
    color: var(--color-gold);
  }

  .sort-select {
    padding: 0.7rem 2.5rem 0.7rem 1rem;
    border: 1px solid var(--color-cream-dark);
    background-color: var(--color-white);
    font-size: 0.9rem;
    min-width: 220px;
    transition: all 0.3s ease;
    border-radius: 4px;
    appearance: none;
    cursor: pointer;
  }

  .sort-select:focus {
    outline: none;
    border-color: var(--color-gold);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  .sort-select:hover {
    border-color: var(--color-gold);
  }

  .results-count {
    font-size: 0.95rem;
    color: var(--color-charcoal-light);
    font-weight: 500;
  }

  /* Product Grid */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 2rem;
    margin-top: 1rem;
    will-change: opacity, transform;
  }

  /* Empty State */
  .no-products {
    text-align: center;
    padding: 4rem 2rem;
    background-color: var(--color-white);
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }

  .no-products-icon {
    color: var(--color-charcoal-light);
    opacity: 0.3;
  }

  .no-products-text {
    font-size: 1.2rem;
    color: var(--color-charcoal);
    font-weight: 500;
    margin-bottom: 1rem;
  }

  .reset-filters-btn {
    padding: 0.75rem 1.5rem;
    background-color: var(--color-gold);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(212, 175, 55, 0.3);
  }

  .reset-filters-btn:hover {
    background-color: var(--color-gold-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(212, 175, 55, 0.4);
  }

  /* Animations */
  .fade-in {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeIn 0.8s forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive adjustments */
  @media (min-width: 640px) {
    .product-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .product-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
