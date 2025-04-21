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
  let showFeaturedOnly = false; // New state for featured products filter

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

  // Price range slider state - no longer need priceRangeValue
  let prevPriceRange = [minPrice, maxPrice]; // Store previous values for comparison

  // Slider is being dragged state
  let isDraggingMinSlider = false;
  let isDraggingMaxSlider = false;

  // Tooltip positions
  let minTooltipPosition = "0%";
  let maxTooltipPosition = "100%";

  // Add a state to track if we're currently changing a filter
  let isFilterChanging = false;

  // Update min/max tooltip positions whenever values change
  $: {
    // Calculate position as percentage
    minTooltipPosition = `${(minPrice / 1000) * 100}%`;
    maxTooltipPosition = `${(maxPrice / 1000) * 100}%`;
  }

  // Ensure that min doesn't exceed max and max doesn't go below min
  $: {
    if (minPrice > maxPrice) minPrice = maxPrice;
    if (maxPrice < minPrice) maxPrice = minPrice;
  }

  // Handle slider drag start
  const handleSliderDragStart = (type) => {
    if (type === 'min') {
      isDraggingMinSlider = true;
    } else if (type === 'max') {
      isDraggingMaxSlider = true;
    }
  };

  // Handle slider drag end
  const handleSliderDragEnd = () => {
    isDraggingMinSlider = false;
    isDraggingMaxSlider = false;
  };

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

    // Get featured filter
    if (params.has('featured')) {
      showFeaturedOnly = params.get('featured') === 'true';
      if (showFeaturedOnly) {
        showFilters = true;
      }
    }

    // Ensure the searchValue is updated in the store
    searchQuery.set(searchValue);
  };

  // Modified animation for applied filters to check the flag
  const animateAppliedFilters = () => {
    if (typeof document !== 'undefined' && !isFilterChanging) {
      const filterChips = document.querySelectorAll('.filter-chip');

      filterChips.forEach((chip, index) => {
        gsap.fromTo(chip,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            delay: index * 0.05,
            ease: "back.out(1.7)"
          }
        );
      });
    }
  };

  // Enhance the filter animation when opening/toggling filters
  const animateFilterSection = (show) => {
    if (showFilters && searchModalContent && !isFilterChanging) {
      const filterSection = searchModalContent.querySelector('.search-filters');
      if (filterSection) {
        if (show) {
          gsap.fromTo(filterSection,
            { opacity: 0, y: -20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power3.out"
            }
          );

          // Animate filter groups with staggered effect
          const filterGroups = filterSection.querySelectorAll('.filter-group');
          gsap.fromTo(filterGroups,
            { opacity: 0, y: -10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.08,
              ease: "power2.out"
            }
          );
        } else {
          gsap.to(filterSection, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            ease: "power2.in"
          });
        }
      }
    }
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

    // If any filters are active, show the filters section
    if (selectedCategories.length > 0 || selectedColors.length > 0 ||
        selectedSizes.length > 0 || minPrice > 0 || maxPrice < 1000 ||
        sortBy !== 'featured' || showFeaturedOnly) {
      showFilters = true;
    }

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

    // Enhanced opening animation
    gsap.fromTo(searchModalContent,
      { opacity: 0, y: -30, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }
    );

    // Animate search input with a slight delay
    const searchInputContainer = searchModalContent.querySelector('.search-input-container');
    if (searchInputContainer) {
      gsap.fromTo(searchInputContainer,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.1, ease: "power2.out" }
      );
    }

    // Animate search actions with a slight delay
    const searchActions = searchModalContent.querySelector('.search-actions');
    if (searchActions) {
      gsap.fromTo(searchActions,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.2, ease: "power2.out" }
      );
    }

    // If filters are shown, animate them with a slight delay
    if (showFilters) {
      setTimeout(() => {
        animateFilterSection(true);
      }, 300);
    }

    // Animate the current filters if they exist
    if (selectedCategories.length > 0 || selectedColors.length > 0 ||
        selectedSizes.length > 0 || minPrice > 0 || maxPrice < 1000 ||
        sortBy !== 'featured' || showFeaturedOnly) {
      setTimeout(() => {
        animateAppliedFilters();
      }, 400);
    }
  }

  // Toggle category selection
  const toggleCategory = (category: string) => {
    isFilterChanging = true;
    if (selectedCategories.includes(category)) {
      selectedCategories = selectedCategories.filter(c => c !== category);
    } else {
      selectedCategories = [...selectedCategories, category];
    }
    // Set a timeout to reset the flag after the filter change is processed
    setTimeout(() => {
      isFilterChanging = false;
      animateAppliedFilters();
    }, 10);
  };

  // Toggle color selection
  const toggleColor = (color: string) => {
    isFilterChanging = true;
    if (selectedColors.includes(color)) {
      selectedColors = selectedColors.filter(c => c !== color);
    } else {
      selectedColors = [...selectedColors, color];
    }
    // Set a timeout to reset the flag after the filter change is processed
    setTimeout(() => {
      isFilterChanging = false;
      animateAppliedFilters();
    }, 10);
  };

  // Toggle size selection
  const toggleSize = (size: string) => {
    isFilterChanging = true;
    if (selectedSizes.includes(size)) {
      selectedSizes = selectedSizes.filter(s => s !== size);
    } else {
      selectedSizes = [...selectedSizes, size];
    }
    // Set a timeout to reset the flag after the filter change is processed
    setTimeout(() => {
      isFilterChanging = false;
      animateAppliedFilters();
    }, 10);
  };

  // Reset all filters
  const resetFilters = () => {
    isFilterChanging = true;
    selectedCategories = [];
    selectedColors = [];
    selectedSizes = [];
    minPrice = 0;
    maxPrice = 1000;
    sortBy = 'featured';
    showFeaturedOnly = false;

    // Set a timeout to reset the flag after filters are reset
    setTimeout(() => {
      isFilterChanging = false;
    }, 10);
  };

  // Handle price change to set filter changing flag
  const handlePriceChange = () => {
    isFilterChanging = true;
    // Use a timeout to allow the UI to update before clearing the flag
    setTimeout(() => {
      isFilterChanging = false;
    }, 100);
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
      sort: sortBy !== 'featured' ? sortBy : undefined,
      featured: showFeaturedOnly ? true : undefined // Add featured filter
    };

    // Use the performSearch function from the store instead of manually building URL
    performSearch(searchValue, filters);

    // Close the search modal (handled by performSearch already)
  };

  // Toggle filter visibility
  const toggleFilters = () => {
    showFilters = !showFilters;

    // Only animate if we're not in the middle of a filter change
    if (!isFilterChanging) {
      animateFilterSection(showFilters);
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
        {#if (selectedCategories.length > 0 || selectedColors.length > 0 || selectedSizes.length > 0 || minPrice > 0 || maxPrice < 1000 || sortBy !== 'featured' || showFeaturedOnly)}
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

              <!-- Featured Filter -->
              {#if showFeaturedOnly}
                <div class="current-filter-group">
                  <span class="filter-label">Featured:</span>
                  <div class="filter-chips">
                    <div class="filter-chip">
                      Featured Only
                      <button
                        type="button"
                        class="remove-filter"
                        on:click={() => {
                          isFilterChanging = true;
                          showFeaturedOnly = false;
                          setTimeout(() => {
                            isFilterChanging = false;
                          }, 10);
                        }}
                        aria-label="Reset featured filter"
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

              <!-- Price Range Slider -->
              <div class="price-slider-container">
                <!-- Min/max labels at the ends of the slider -->
                <div class="slider-labels">
                  <span class="slider-label min-label">$0</span>
                  <span class="slider-label max-label">$1000</span>
                </div>

                <div class="slider-track">
                  <div
                    class="slider-fill"
                    style="left: {(minPrice / 1000) * 100}%; right: {100 - (maxPrice / 1000) * 100}%;"
                  ></div>
                </div>

                <div class="range-inputs">
                  <input
                    type="range"
                    class="price-range-slider min-slider"
                    min="0"
                    max="1000"
                    step="10"
                    bind:value={minPrice}
                    on:mousedown={() => handleSliderDragStart('min')}
                    on:touchstart={() => handleSliderDragStart('min')}
                    on:mouseup={handleSliderDragEnd}
                    on:touchend={handleSliderDragEnd}
                    on:mouseleave={handleSliderDragEnd}
                    on:input={handlePriceChange}
                  />
                  <input
                    type="range"
                    class="price-range-slider max-slider"
                    min="0"
                    max="1000"
                    step="10"
                    bind:value={maxPrice}
                    on:mousedown={() => handleSliderDragStart('max')}
                    on:touchstart={() => handleSliderDragStart('max')}
                    on:mouseup={handleSliderDragEnd}
                    on:touchend={handleSliderDragEnd}
                    on:mouseleave={handleSliderDragEnd}
                    on:input={handlePriceChange}
                  />
                </div>

                <!-- Tooltip bubbles that follow the sliders -->
                <div class="slider-tooltips">
                  <div
                    class="tooltip min-tooltip {isDraggingMinSlider ? 'active' : ''}"
                    style="left: {minTooltipPosition};"
                  >
                    ${minPrice}
                  </div>
                  <div
                    class="tooltip max-tooltip {isDraggingMaxSlider ? 'active' : ''}"
                    style="left: {maxTooltipPosition};"
                  >
                    ${maxPrice}
                  </div>
                </div>

                <!-- Direct input for prices -->
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
                        on:input={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val) || val < 0) val = 0;
                          if (val > maxPrice) val = maxPrice;
                          minPrice = val;
                          handlePriceChange();
                        }}
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
                        on:input={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val) || val > 10000) val = 10000;
                          if (val < minPrice) val = minPrice;
                          maxPrice = val;
                          handlePriceChange();
                        }}
                      />
                    </div>
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

            <!-- Featured Products Filter -->
            <div class="filter-group featured-filter">
              <h3 class="filter-title">Featured Products</h3>
              <label class="featured-toggle-label">
                <input
                  type="checkbox"
                  bind:checked={showFeaturedOnly}
                  on:change={() => {
                    isFilterChanging = true;
                    setTimeout(() => {
                      isFilterChanging = false;
                      animateAppliedFilters();
                    }, 10);
                  }}
                />
                Show Featured Only
              </label>
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
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 100;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
  }

  .search-modal-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .search-modal-container {
    width: 100%;
    max-width: 600px;
    margin: 0 1rem;
    transition: max-width 0.4s ease;
  }

  .search-modal-container.with-filters {
    max-width: 800px;
  }

  .search-modal-content {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25), 0 0 15px rgba(212, 175, 55, 0.2);
    padding: 1.75rem;
    position: relative;
    max-height: 80vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling for iOS */
    border: 1px solid rgba(212, 175, 55, 0.1);
  }

  .search-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.75rem;
  }

  .search-modal-title {
    font-family: var(--heading-font);
    font-size: 1.75rem;
    font-weight: 500;
    color: var(--color-charcoal);
    margin: 0;
    background: linear-gradient(120deg, var(--color-charcoal), var(--color-gold));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
  }

  .search-close-button {
    width: 3rem;
    height: 3rem;
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
    gap: 1.25rem;
  }

  .search-input-container {
    position: relative;
    width: 100%;
  }

  .search-icon {
    position: absolute;
    top: 50%;
    left: 1.15rem;
    transform: translateY(-50%);
    color: #777;
  }

  .search-input {
    width: 100%;
    padding: 1.1rem 1.1rem 1.1rem 3.2rem;
    border: 2px solid var(--color-light-gray);
    border-radius: 8px;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    /* Improved for touch */
    -webkit-appearance: none;
    appearance: none;
    min-height: 56px;
    font-size: 16px; /* Prevents iOS zoom on focus */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-gold);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.15);
  }

  .search-actions {
    display: flex;
    gap: 0.75rem;
    flex-direction: column; /* Stack buttons by default for mobile */
  }

  .filter-toggle-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.9rem 1.25rem;
    border: 2px solid var(--color-light-gray);
    background-color: white;
    color: var(--color-charcoal);
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
    /* Improved touch target */
    min-height: 52px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  }

  .filter-toggle-button:hover {
    border-color: var(--color-gold);
    color: var(--color-gold);
    box-shadow: 0 6px 15px rgba(212, 175, 55, 0.1);
    transform: translateY(-2px);
  }

  .search-button {
    background-color: var(--color-gold);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.9rem 1.25rem;
    font-weight: 500;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
    /* Improved touch target */
    min-height: 52px;
    box-shadow: 0 6px 15px rgba(212, 175, 55, 0.25);
    letter-spacing: 0.03em;
  }

  .search-button:hover {
    background-color: #c29d2e;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3);
  }

  .search-tips {
    margin-top: 1.75rem;
    padding-top: 1.75rem;
    border-top: 1px solid var(--color-light-gray);
  }

  .search-tips p {
    font-size: 0.95rem;
    color: #777;
    margin: 0;
    line-height: 1.5;
  }

  /* Filter Styles */
  .search-filters {
    margin-top: 1.75rem;
    padding: 1.75rem;
    border-radius: 10px;
    background-color: #f9f9f9;
    background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(245, 245, 245, 0.8));
    border: 1px solid rgba(212, 175, 55, 0.1);
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.75rem;
    box-shadow: inset 0 1px 5px rgba(0, 0, 0, 0.03);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    position: relative;
    padding-left: 0.5rem;
  }

  .filter-group::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.4rem;
    bottom: 0.4rem;
    width: 3px;
    background: linear-gradient(to bottom, var(--color-gold), rgba(212, 175, 55, 0.2));
    border-radius: 3px;
  }

  .filter-title {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--color-charcoal);
    margin: 0;
  }

  .filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  /* Currently Applied Filters */
  .current-filters-container {
    margin-top: 1.25rem;
    background: linear-gradient(145deg, #f8f8f8, #f2f2f2);
    padding: 1rem;
    border-radius: 10px;
    border: 1px solid rgba(212, 175, 55, 0.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  }

  .current-filters-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .current-filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .filter-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #666;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
  }

  .filter-chip {
    display: inline-flex;
    align-items: center;
    background: linear-gradient(145deg, var(--color-gold), #c29d2e);
    color: white;
    font-size: 0.85rem;
    padding: 0.35rem 0.7rem;
    border-radius: 30px;
    box-shadow: 0 3px 6px rgba(212, 175, 55, 0.2);
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .filter-chip:hover {
    box-shadow: 0 5px 10px rgba(212, 175, 55, 0.3);
    transform: translateY(-1px) scale(1.02);
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
    padding: 0.6rem 1.2rem;
    border: 2px solid var(--color-light-gray);
    border-radius: 30px;
    background-color: white;
    color: var(--color-charcoal);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    /* Improved touch target */
    min-height: 40px;
    min-width: 44px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
  }

  .category-chip:hover {
    border-color: var(--color-gold);
    background-color: rgba(212, 175, 55, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(212, 175, 55, 0.15);
  }

  .category-chip.active {
    background: linear-gradient(145deg, var(--color-gold), #c29d2e);
    color: white;
    border-color: var(--color-gold);
    box-shadow: 0 5px 12px rgba(212, 175, 55, 0.25);
  }

  /* Color Chips */
  .color-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border: 2px solid var(--color-light-gray);
    border-radius: 8px;
    background-color: white;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    /* Improved touch target */
    min-height: 44px;
    min-width: 44px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
  }

  .color-chip:hover {
    border-color: var(--color-gold);
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(212, 175, 55, 0.15);
  }

  .color-chip.active {
    border-color: var(--color-gold);
    box-shadow: 0 0 0 1px var(--color-gold), 0 5px 12px rgba(212, 175, 55, 0.25);
  }

  .color-dot {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background-color: var(--color-dot);
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
  }

  /* Size Chips */
  .size-chip {
    min-width: 2.75rem;
    height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--color-light-gray);
    background-color: white;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    /* Improved touch target */
    min-height: 44px;
    min-width: 44px;
    border-radius: 8px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
  }

  .size-chip:hover {
    border-color: var(--color-gold);
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(212, 175, 55, 0.15);
  }

  .size-chip.active {
    background: linear-gradient(145deg, var(--color-charcoal), #444);
    color: white;
    border-color: var(--color-charcoal);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.25);
  }

  /* Price Range */
  .price-range {
    margin-bottom: 1rem;
  }

  .price-slider-container {
    padding: 1.25rem 0.5rem 0.75rem;
    margin-bottom: 0.75rem;
    position: relative;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: #777;
    font-size: 0.75rem;
  }

  .slider-track {
    position: relative;
    width: 100%;
    height: 8px;
    background: linear-gradient(to right, #e6e6e6, #f0f0f0, #e6e6e6);
    border-radius: 5px;
    margin: 0.75rem 0 1.75rem;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .slider-fill {
    position: absolute;
    height: 100%;
    background: linear-gradient(to right, var(--color-gold), #c29d2e);
    border-radius: 5px;
    box-shadow: 0 1px 2px rgba(212, 175, 55, 0.2);
    transition: left 0.1s ease-out, right 0.1s ease-out;
  }

  .range-inputs {
    position: relative;
  }

  .price-range-slider {
    position: absolute;
    width: 100%;
    -webkit-appearance: none;
    height: 8px;
    opacity: 0;
    z-index: 2;
    top: -2.5rem;
    cursor: pointer;
  }

  .price-range-slider.min-slider {
    pointer-events: auto;
  }

  .price-range-slider.max-slider {
    pointer-events: auto;
  }

  .price-range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(145deg, var(--color-gold), #c29d2e);
    cursor: grab;
    border: 2px solid white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    pointer-events: auto;
    position: relative;
    z-index: 3;
  }

  .price-range-slider:active::-webkit-slider-thumb {
    cursor: grabbing;
    transform: scale(1.1);
    box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);
  }

  .price-range-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(145deg, var(--color-gold), #c29d2e);
    cursor: grab;
    border: 2px solid white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    pointer-events: auto;
    position: relative;
    z-index: 3;
  }

  .price-range-slider:active::-moz-range-thumb {
    cursor: grabbing;
    transform: scale(1.1);
    box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);
  }

  /* Tooltip bubbles for slider */
  .slider-tooltips {
    position: relative;
    width: 100%;
    height: 0;
  }

  .tooltip {
    position: absolute;
    top: -40px;
    transform: translateX(-50%);
    background: var(--color-gold);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    opacity: 0;
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: 5;
  }

  .tooltip.active {
    opacity: 1;
    transform: translateX(-50%) scale(1.1);
  }

  .tooltip::after {
    content: "";
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px 6px 0 6px;
    border-style: solid;
    border-color: var(--color-gold) transparent transparent transparent;
  }

  /* Price Inputs */
  .price-inputs {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.75rem;
    flex-wrap: wrap; /* Allow wrapping on very small screens */
  }

  .price-input-group {
    flex: 1;
    min-width: 100px; /* Ensure they don't get too narrow on small screens */
  }

  .price-input-group label {
    display: block;
    font-size: 0.8rem;
    color: #777;
    margin-bottom: 0.35rem;
  }

  .price-input-wrapper {
    position: relative;
  }

  .price-input-wrapper .currency-symbol {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: #777;
  }

  .price-input-wrapper input {
    width: 100%;
    padding: 0.85rem 0.85rem 0.85rem 1.9rem;
    border: 1px solid var(--color-light-gray);
    border-radius: 8px;
    font-size: 0.95rem;
    /* Improved for touch */
    min-height: 46px;
    -webkit-appearance: none;
    appearance: none;
    font-size: 16px; /* Prevents iOS zoom on focus */
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
  }

  .price-input-wrapper input:focus {
    outline: none;
    border-color: var(--color-gold);
    box-shadow: 0 3px 10px rgba(212, 175, 55, 0.1);
  }

  .price-range-divider {
    color: #777;
    font-weight: 300;
    font-size: 1.2rem;
  }

  /* Featured Products Filter */
  .featured-filter {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .featured-toggle-label {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    font-size: 0.95rem;
    color: var(--color-charcoal);
    cursor: pointer;
    user-select: none;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    transition: background-color 0.3s ease, transform 0.3s ease;
    background-color: white;
    border: 2px solid var(--color-light-gray);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
  }

  .featured-toggle-label:hover {
    background-color: rgba(212, 175, 55, 0.05);
    border-color: var(--color-gold);
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(212, 175, 55, 0.15);
  }

  .featured-toggle-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: var(--color-gold);
    border-radius: 4px;
    margin: 0;
  }

  /* Sort Select */
  .sort-select {
    width: 100%;
    padding: 0.85rem 1rem;
    border: 2px solid var(--color-light-gray);
    border-radius: 8px;
    background-color: white;
    color: var(--color-charcoal);
    font-size: 0.95rem;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.85rem center;
    background-size: 1rem;
    /* Improved for touch */
    min-height: 48px;
    font-size: 16px; /* Prevents iOS zoom on focus */
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
  }

  .sort-select:focus,
  .sort-select:hover {
    outline: none;
    border-color: var(--color-gold);
    box-shadow: 0 5px 12px rgba(212, 175, 55, 0.15);
  }

  /* Reset Filters Button */
  .reset-filters-button {
    margin-top: 1rem;
    padding: 0.85rem;
    border: 2px solid var(--color-light-gray);
    background-color: white;
    color: var(--color-charcoal);
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 8px;
    /* Improved touch target */
    min-height: 48px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
  }

  .reset-filters-button:hover {
    color: var(--color-gold);
    border-color: var(--color-gold);
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(212, 175, 55, 0.15);
  }

  /* Mobile-first Media Queries */
  @media (min-width: 480px) {
    .search-modal-content {
      padding: 2rem;
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
      padding: 2.25rem;
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

  /* Improved mobile experience */
  @media (max-width: 480px) {
    .search-modal-title {
      font-size: 1.5rem;
    }

    .search-close-button {
      width: 2.5rem;
      height: 2.5rem;
    }

    .search-input {
      padding: 0.9rem 0.9rem 0.9rem 2.9rem;
      min-height: 50px;
    }

    .filter-toggle-button,
    .search-button {
      padding: 0.8rem 1rem;
      min-height: 48px;
    }

    .search-filters {
      padding: 1.25rem;
      margin-top: 1.5rem;
    }

    .filter-title {
      font-size: 1rem;
    }

    .category-chip,
    .color-chip,
    .size-chip {
      font-size: 0.85rem;
    }

    .price-display-value {
      min-width: 80px;
      padding: 0.5rem 0.75rem;
    }
  }

  /* Mobile styles for price range */
  @media (max-width: 480px) {
    .price-slider-container {
      padding: 1rem 0.25rem 0.5rem;
    }

    .tooltip {
      top: -35px;
      font-size: 0.7rem;
      padding: 3px 6px;
    }

    .price-inputs {
      margin-top: 1.25rem;
    }

    .price-input-wrapper input {
      font-size: 14px;
      padding: 0.7rem 0.7rem 0.7rem 1.8rem;
      min-height: 42px;
    }
  }
</style>
