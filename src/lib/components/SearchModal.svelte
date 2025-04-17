<script lang="ts">
  import { onMount } from 'svelte';
  import { isSearchOpen, closeSearch, performSearch, searchQuery } from '$lib/stores/index';
  import { getCategories, getColors, getSizes } from '$lib/utils/data';
  import gsap from 'gsap';
  import { page } from '$app/stores';

  let searchInput: HTMLInputElement;
  let searchModalContent: HTMLElement;
  let searchValue = '';
  let showFilters = false;

  // Filter states
  let selectedCategories: string[] = [];
  let selectedColors: string[] = [];
  let selectedSizes: string[] = [];
  let minPrice = 0;
  let maxPrice = 1000;
  let sortBy = 'featured';

  // Get filter options from data
  const categories = getCategories();
  const colors = getColors();
  const sizes = getSizes();

  // Get global price range
  const allPrices = getColors().flatMap(c => [0, 1000]); // Simplified for demo
  const globalMinPrice = Math.floor(Math.min(...allPrices));
  const globalMaxPrice = Math.ceil(Math.max(...allPrices));

  // Initialize filters from URL parameters
  const loadFiltersFromURL = () => {
    // Current URL parameters
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Get search query
    if (params.has('search')) {
      searchValue = params.get('search') || '';
    }

    // Get category filter
    if (params.has('category')) {
      const categoryParam = params.get('category') || '';
      selectedCategories = categoryParam.split(',').map(c => c.toLowerCase());
      // Show filters if categories are present
      if (selectedCategories.length > 0) {
        showFilters = true;
      }
    }

    // Get color filter
    if (params.has('color')) {
      const colorParam = params.get('color') || '';
      selectedColors = colorParam.split(',').map(c => c.toLowerCase());
      // Show filters if colors are present
      if (selectedColors.length > 0) {
        showFilters = true;
      }
    }

    // Get size filter
    if (params.has('size')) {
      const sizeParam = params.get('size') || '';
      selectedSizes = sizeParam.split(',');
      // Show filters if sizes are present
      if (selectedSizes.length > 0) {
        showFilters = true;
      }
    }

    // Get price range
    if (params.has('minPrice')) {
      minPrice = parseInt(params.get('minPrice') || '0');
      // Show filters if min price is set
      if (minPrice > 0) {
        showFilters = true;
      }
    }

    if (params.has('maxPrice')) {
      maxPrice = parseInt(params.get('maxPrice') || '1000');
      // Show filters if max price is not default
      if (maxPrice < globalMaxPrice) {
        showFilters = true;
      }
    }

    // Get sort order
    if (params.has('sort')) {
      sortBy = params.get('sort') || 'featured';
      // Show filters if sort is not default
      if (sortBy !== 'featured') {
        showFilters = true;
      }
    }

    // Ensure the searchValue is updated in the store
    searchQuery.set(searchValue);

    console.log('Loaded filters from URL:', {
      searchValue,
      selectedCategories,
      selectedColors,
      selectedSizes,
      minPrice,
      maxPrice,
      sortBy
    });
  };

  onMount(() => {
    // Load filters from URL when component mounts
    loadFiltersFromURL();

    // Focus input when search modal opens
    const unsubscribe = isSearchOpen.subscribe(value => {
      if (value && searchInput) {
        setTimeout(() => {
          searchInput.focus();
        }, 100);
      }
    });

    // Initialize searchValue from store
    const queryUnsubscribe = searchQuery.subscribe(value => {
      searchValue = value;
    });

    // Close search modal when escape key is pressed
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && $isSearchOpen) {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);

    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if ($isSearchOpen && searchModalContent && !searchModalContent.contains(e.target as Node)) {
        closeSearch();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);

    // Clean up event listeners
    return () => {
      unsubscribe();
      queryUnsubscribe();
      window.removeEventListener('keydown', handleEscapeKey);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  });

  // Animation effects when modal opens/closes
  $: if ($isSearchOpen && searchModalContent) {
    // Reload filters from URL each time the modal opens
    loadFiltersFromURL();

    gsap.fromTo(searchModalContent,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );
  }

  // Toggle category selection
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      selectedCategories = selectedCategories.filter(c => c !== category);
    } else {
      selectedCategories = [...selectedCategories, category];
    }
  };

  // Toggle color selection
  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      selectedColors = selectedColors.filter(c => c !== color);
    } else {
      selectedColors = [...selectedColors, color];
    }
  };

  // Toggle size selection
  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      selectedSizes = selectedSizes.filter(s => s !== size);
    } else {
      selectedSizes = [...selectedSizes, size];
    }
  };

  // Reset all filters
  const resetFilters = () => {
    selectedCategories = [];
    selectedColors = [];
    selectedSizes = [];
    minPrice = 0;
    maxPrice = 1000;
    sortBy = 'featured';
  };

  // Handle search submit with filters
  const handleSubmit = (e: Event) => {
    e.preventDefault();

    console.log("Submitting search with query:", searchValue);

    // Create filters object with all the current filter values
    const filters = {
      categories: selectedCategories,
      colors: selectedColors,
      sizes: selectedSizes,
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 1000 ? maxPrice : undefined,
      sort: sortBy !== 'featured' ? sortBy : undefined
    };

    // Use the performSearch function from the store instead of manually building URL
    performSearch(searchValue, filters);

    // Close the search modal (handled by performSearch already)
  };

  // Toggle filter visibility
  const toggleFilters = () => {
    showFilters = !showFilters;

    if (showFilters && searchModalContent) {
      // Animate the filter section when opened
      setTimeout(() => {
        const filterSection = searchModalContent.querySelector('.search-filters');
        if (filterSection) {
          gsap.fromTo(filterSection,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
          );
        }
      }, 10);
    }
  };
</script>

<div class="search-modal-overlay" class:open={$isSearchOpen}>
  <div class="search-modal-container" class:with-filters={showFilters}>
    <div class="search-modal-content" bind:this={searchModalContent}>
      <div class="search-modal-header">
        <h2 class="search-modal-title">Search</h2>
        <button
          class="search-close-button"
          on:click={closeSearch}
          aria-label="Close search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form on:submit={handleSubmit} class="search-form">
        <div class="search-input-container">
          <svg
            class="search-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            bind:value={searchValue}
            bind:this={searchInput}
            placeholder="Search for products..."
            class="search-input"
          />
        </div>

        <div class="search-actions">
          <button type="button" class="filter-toggle-button" on:click={toggleFilters}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button type="submit" class="search-button">Search</button>
        </div>

        <!-- Always display currently applied filters summary if any filters are active -->
        {#if (selectedCategories.length > 0 || selectedColors.length > 0 || selectedSizes.length > 0 || minPrice > 0 || maxPrice < 1000 || sortBy !== 'featured')}
          <div class="current-filters-container">
            <h3 class="filter-title">Currently Applied Filters:</h3>
            <div class="current-filters-list">
              <!-- Categories -->
              {#if selectedCategories.length > 0}
                <div class="current-filter-group">
                  <span class="filter-label">Categories:</span>
                  <div class="filter-chips">
                    {#each selectedCategories as category}
                      <div class="filter-chip">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <button
                          type="button"
                          class="remove-filter"
                          on:click={() => toggleCategory(category)}
                          aria-label="Remove {category} filter"
                        >×</button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Colors -->
              {#if selectedColors.length > 0}
                <div class="current-filter-group">
                  <span class="filter-label">Colors:</span>
                  <div class="filter-chips">
                    {#each selectedColors as color}
                      <div class="filter-chip">
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                        <button
                          type="button"
                          class="remove-filter"
                          on:click={() => toggleColor(color)}
                          aria-label="Remove {color} filter"
                        >×</button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Sizes -->
              {#if selectedSizes.length > 0}
                <div class="current-filter-group">
                  <span class="filter-label">Sizes:</span>
                  <div class="filter-chips">
                    {#each selectedSizes as size}
                      <div class="filter-chip">
                        {size}
                        <button
                          type="button"
                          class="remove-filter"
                          on:click={() => toggleSize(size)}
                          aria-label="Remove size {size} filter"
                        >×</button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Price Range -->
              {#if minPrice > 0 || maxPrice < 1000}
                <div class="current-filter-group">
                  <span class="filter-label">Price:</span>
                  <div class="filter-chips">
                    <div class="filter-chip">
                      ${minPrice} - ${maxPrice}
                      <button
                        type="button"
                        class="remove-filter"
                        on:click={() => {
                          minPrice = 0;
                          maxPrice = 1000;
                        }}
                        aria-label="Reset price range"
                      >×</button>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Sort -->
              {#if sortBy !== 'featured'}
                <div class="current-filter-group">
                  <span class="filter-label">Sort:</span>
                  <div class="filter-chips">
                    <div class="filter-chip">
                      {sortBy === 'price-asc' ? 'Price: Low to High' :
                       sortBy === 'price-desc' ? 'Price: High to Low' :
                       sortBy === 'rating' ? 'Customer Rating' :
                       sortBy === 'newest' ? 'Newest Arrivals' : sortBy}
                      <button
                        type="button"
                        class="remove-filter"
                        on:click={() => {
                          sortBy = 'featured';
                        }}
                        aria-label="Reset sort order"
                      >×</button>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        {#if showFilters}
          <div class="search-filters">
            <!-- Categories Filter -->
            <div class="filter-group">
              <h3 class="filter-title">Categories</h3>
              <div class="filter-options categories">
                {#each categories as category}
                  <button
                    type="button"
                    class="category-chip {selectedCategories.includes(category.name.toLowerCase()) ? 'active' : ''}"
                    on:click={() => toggleCategory(category.name.toLowerCase())}
                  >
                    {category.name}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Colors Filter -->
            <div class="filter-group">
              <h3 class="filter-title">Colors</h3>
              <div class="filter-options colors">
                {#each colors as color}
                  <button
                    type="button"
                    class="color-chip {selectedColors.includes(color.name.toLowerCase()) ? 'active' : ''}"
                    style="--color-dot: {color.hex};"
                    on:click={() => toggleColor(color.name.toLowerCase())}
                  >
                    <span class="color-dot"></span>
                    <span class="color-name">{color.name}</span>
                  </button>
                {/each}
              </div>
            </div>

            <!-- Sizes Filter -->
            <div class="filter-group">
              <h3 class="filter-title">Sizes</h3>
              <div class="filter-options sizes">
                {#each sizes as size}
                  <button
                    type="button"
                    class="size-chip {selectedSizes.includes(size.name) ? 'active' : ''}"
                    on:click={() => toggleSize(size.name)}
                  >
                    {size.name}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Price Range Filter -->
            <div class="filter-group price-range">
              <h3 class="filter-title">Price Range</h3>
              <div class="price-inputs">
                <div class="price-input-group">
                  <label for="min-price">Min</label>
                  <div class="price-input-wrapper">
                    <span class="currency-symbol">$</span>
                    <input
                      type="number"
                      id="min-price"
                      bind:value={minPrice}
                      min="0"
                      max={maxPrice}
                      step="10"
                    />
                  </div>
                </div>
                <div class="price-range-divider">-</div>
                <div class="price-input-group">
                  <label for="max-price">Max</label>
                  <div class="price-input-wrapper">
                    <span class="currency-symbol">$</span>
                    <input
                      type="number"
                      id="max-price"
                      bind:value={maxPrice}
                      min={minPrice}
                      max="10000"
                      step="10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Sort Order -->
            <div class="filter-group">
              <h3 class="filter-title">Sort By</h3>
              <div class="sort-options">
                <select bind:value={sortBy} class="sort-select">
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>

            <!-- Reset Filters Button -->
            <button type="button" class="reset-filters-button" on:click={resetFilters}>
              Reset All Filters
            </button>
          </div>
        {/if}
      </form>

      {#if !showFilters}
        <div class="search-tips">
          <p>
            Try searching for product types (e.g., "dress"), materials (e.g., "silk"),
            or colors (e.g., "black"). Click "Show Filters" for more options.
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .search-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 100;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .search-modal-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .search-modal-container {
    width: 100%;
    max-width: 600px;
    margin: 0 1rem;
    transition: max-width 0.3s ease;
  }

  .search-modal-container.with-filters {
    max-width: 800px;
  }

  .search-modal-content {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    padding: 1.5rem;
    position: relative;
    max-height: 80vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling for iOS */
  }

  .search-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .search-modal-title {
    font-family: var(--heading-font);
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--color-charcoal);
    margin: 0;
  }

  .search-close-button {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.03);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--color-charcoal);
    /* Improved tap target */
    min-width: 44px;
    min-height: 44px;
  }

  .search-close-button:hover {
    background-color: rgba(212, 175, 55, 0.1);
    color: var(--color-gold);
    transform: rotate(90deg);
  }

  .search-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .search-input-container {
    position: relative;
    width: 100%;
  }

  .search-icon {
    position: absolute;
    top: 50%;
    left: 1rem;
    transform: translateY(-50%);
    color: #777;
  }

  .search-input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 1px solid var(--color-light-gray);
    border-radius: 4px;
    font-size: 1rem;
    transition: all 0.3s ease;
    /* Improved for touch */
    -webkit-appearance: none;
    appearance: none;
    min-height: 48px;
    font-size: 16px; /* Prevents iOS zoom on focus */
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-gold);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  .search-actions {
    display: flex;
    gap: 0.5rem;
    flex-direction: column; /* Stack buttons by default for mobile */
  }

  .filter-toggle-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-light-gray);
    background-color: white;
    color: var(--color-charcoal);
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
    /* Improved touch target */
    min-height: 48px;
  }

  .filter-toggle-button:hover {
    border-color: var(--color-gold);
    color: var(--color-gold);
  }

  .search-button {
    background-color: var(--color-gold);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
    min-width: 100px;
    /* Improved touch target */
    min-height: 48px;
  }

  .search-button:hover {
    background-color: #c29d2e;
  }

  .search-tips {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-light-gray);
  }

  .search-tips p {
    font-size: 0.875rem;
    color: #777;
    margin: 0;
  }

  /* Filter Styles */
  .search-filters {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-light-gray);
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-title {
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-charcoal);
    margin: 0;
  }

  .filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  /* Currently Applied Filters */
  .current-filters-container {
    margin-top: 1rem;
    background-color: #f8f8f8;
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid var(--color-light-gray);
  }

  .current-filters-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .current-filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .filter-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #666;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .filter-chip {
    display: inline-flex;
    align-items: center;
    background-color: var(--color-gold);
    color: white;
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
  }

  .remove-filter {
    margin-left: 0.5rem;
    font-size: 1.2rem;
    line-height: 0.8;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;
    padding: 0;
    color: white;
    /* Improved touch target */
    min-width: 30px;
    min-height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-filter:hover {
    opacity: 1;
  }

  /* Category Chips */
  .category-chip {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-light-gray);
    border-radius: 30px;
    background-color: white;
    color: var(--color-charcoal);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    /* Improved touch target */
    min-height: 40px;
    min-width: 44px;
  }

  .category-chip:hover {
    border-color: var(--color-gold);
    background-color: rgba(212, 175, 55, 0.05);
  }

  .category-chip.active {
    background-color: var(--color-gold);
    color: white;
    border-color: var(--color-gold);
  }

  /* Color Chips */
  .color-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--color-light-gray);
    border-radius: 4px;
    background-color: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    /* Improved touch target */
    min-height: 40px;
    min-width: 44px;
  }

  .color-chip:hover {
    border-color: var(--color-gold);
  }

  .color-chip.active {
    border-color: var(--color-gold);
    box-shadow: 0 0 0 1px var(--color-gold);
  }

  .color-dot {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background-color: var(--color-dot);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  /* Size Chips */
  .size-chip {
    min-width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-light-gray);
    background-color: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    /* Improved touch target */
    min-height: 44px;
    min-width: 44px;
  }

  .size-chip:hover {
    border-color: var(--color-gold);
  }

  .size-chip.active {
    background-color: var(--color-charcoal);
    color: white;
    border-color: var(--color-charcoal);
  }

  /* Price Range */
  .price-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap; /* Allow wrapping on very small screens */
  }

  .price-input-group {
    flex: 1;
    min-width: 120px; /* Ensure they don't get too narrow on small screens */
  }

  .price-input-group label {
    display: block;
    font-size: 0.75rem;
    color: #777;
    margin-bottom: 0.25rem;
  }

  .price-input-wrapper {
    position: relative;
  }

  .currency-symbol {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #777;
  }

  .price-input-wrapper input {
    width: 100%;
    padding: 0.75rem 0.75rem 0.75rem 1.75rem;
    border: 1px solid var(--color-light-gray);
    border-radius: 4px;
    font-size: 0.875rem;
    /* Improved for touch */
    min-height: 44px;
    -webkit-appearance: none;
    appearance: none;
    font-size: 16px; /* Prevents iOS zoom on focus */
  }

  .price-input-wrapper input:focus {
    outline: none;
    border-color: var(--color-gold);
  }

  .price-range-divider {
    color: #777;
    font-weight: 300;
  }

  /* Sort Select */
  .sort-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-light-gray);
    border-radius: 4px;
    background-color: white;
    color: var(--color-charcoal);
    font-size: 0.875rem;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1rem;
    /* Improved for touch */
    min-height: 44px;
    font-size: 16px; /* Prevents iOS zoom on focus */
  }

  .sort-select:focus {
    outline: none;
    border-color: var(--color-gold);
  }

  /* Reset Filters Button */
  .reset-filters-button {
    margin-top: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--color-light-gray);
    background-color: transparent;
    color: var(--color-charcoal);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 4px;
    /* Improved touch target */
    min-height: 44px;
  }

  .reset-filters-button:hover {
    color: var(--color-gold);
    border-color: var(--color-gold);
  }

  /* Mobile-first Media Queries */
  @media (min-width: 480px) {
    .search-modal-content {
      padding: 1.75rem;
    }
  }

  @media (min-width: 640px) {
    .search-actions {
      flex-direction: row; /* Horizontal layout for larger screens */
    }

    .search-modal-overlay {
      padding-top: 15vh; /* More space at the top on larger screens */
    }
  }

  @media (min-width: 768px) {
    .search-modal-content {
      padding: 2rem;
    }

    .search-filters {
      grid-template-columns: repeat(2, 1fr);
    }

    .filter-group.price-range {
      grid-column: span 2;
    }
  }

  /* For very small devices, ensure the overlay works properly */
  @media (max-height: 600px) {
    .search-modal-overlay {
      padding-top: 5vh;
    }

    .search-modal-content {
      max-height: 90vh; /* Allow more space on small height screens */
    }
  }
</style>
