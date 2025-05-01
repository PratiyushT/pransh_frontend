<script lang="ts">
  import { onMount } from 'svelte';
  import { isSearchOpen, closeSearch, performSearch, searchQuery } from '$lib/stores/index';
  import { categoriesStore, colorsStore, sizesStore, isLoadingFilters, filtersError, initializeFilterData } from '$lib/stores/filters';
  import gsap from 'gsap';
  import { page } from '$app/stores';
  import ColorPieChart from '$lib/components/ColorPieChart.svelte';

  // DOM references
  let searchInput: HTMLInputElement;
  let searchModalContent: HTMLElement;

  // Search state
  let searchValue = '';
  let showFilters = false;

  // State for showing/hiding the applied filters - collapsed by default if there are many filters
  let showAppliedFilters = true;

  // Check applied filter count
  $: {
    // Count how many filter types are applied
    const appliedFilterCount = [
      filterState.categories.length > 0,
      filterState.colors.length > 0,
      filterState.sizes.length > 0,
      filterState.minPrice > 0 || filterState.maxPrice < 1000,
      filterState.sortBy !== 'featured',
      filterState.featuredOnly
    ].filter(Boolean).length;

    // Auto-collapse if more than 3 filter types are applied
    if (appliedFilterCount > 3) {
      showAppliedFilters = false;
    }
  }

  // Filter states - wrapped in objects to maintain reference stability
  const filterState = {
    categories: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
    minPrice: 0,
    maxPrice: 1000,
    sortBy: 'featured',
    featuredOnly: false
  };

  // Function to get total filter count
  function getTotalFilterCount() {
    return filterState.categories.length +
           filterState.colors.length +
           filterState.sizes.length +
           (filterState.minPrice > 0 || filterState.maxPrice < 1000 ? 1 : 0) +
           (filterState.sortBy !== 'featured' ? 1 : 0) +
           (filterState.featuredOnly ? 1 : 0);
  }

  // Tracking states for price range slider
  let isDraggingMinSlider = false;
  let isDraggingMaxSlider = false;
  let minTooltipPosition = "0%";
  let maxTooltipPosition = "100%";

  // Global price range
  let globalMinPrice = 0;
  let globalMaxPrice = 1000;

  // Recalculate tooltip positions when price changes
  $: {
    minTooltipPosition = `${(filterState.minPrice / 1000) * 100}%`;
    maxTooltipPosition = `${(filterState.maxPrice / 1000) * 100}%`;
  }

  // Ensure that min doesn't exceed max and max doesn't go below min
  $: {
    if (filterState.minPrice > filterState.maxPrice) filterState.minPrice = filterState.maxPrice;
    if (filterState.maxPrice < filterState.minPrice) filterState.maxPrice = filterState.minPrice;
  }

  // Handle slider drag start with improved tooltip display
  const handleSliderDragStart = (type: 'min' | 'max') => {
    if (type === 'min') {
      isDraggingMinSlider = true;
      // Immediately show the tooltip
      const tooltip = document.querySelector('.min-tooltip');
      if (tooltip) {
        tooltip.classList.add('active');
      }
    } else {
      isDraggingMaxSlider = true;
      // Immediately show the tooltip
      const tooltip = document.querySelector('.max-tooltip');
      if (tooltip) {
        tooltip.classList.add('active');
      }
    }
  };

  // Handle slider drag end with smooth tooltip hiding
  const handleSliderDragEnd = () => {
    // Add a tiny delay before hiding tooltips for better UX
    setTimeout(() => {
      isDraggingMinSlider = false;
      isDraggingMaxSlider = false;
    }, 150);
  };

  // Initialize filters from URL parameters
  const loadFiltersFromURL = () => {
    if (typeof window === 'undefined') return;

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
      filterState.categories = categoryParam.split(',').map(c => c.toLowerCase());
      // Show filters if categories are present
      if (filterState.categories.length > 0) {
        showFilters = true;
      }
    } else {
      filterState.categories = [];
    }

    // Get color filter
    if (params.has('color')) {
      const colorParam = params.get('color') || '';
      filterState.colors = colorParam.split(',').map(c => c.toLowerCase());
      // Show filters if colors are present
      if (filterState.colors.length > 0) {
        showFilters = true;
      }
    } else {
      filterState.colors = [];
    }

    // Get size filter
    if (params.has('size')) {
      const sizeParam = params.get('size') || '';
      filterState.sizes = sizeParam.split(',');
      // Show filters if sizes are present
      if (filterState.sizes.length > 0) {
        showFilters = true;
      }
    } else {
      filterState.sizes = [];
    }

    // Get price range
    if (params.has('minPrice')) {
      filterState.minPrice = parseInt(params.get('minPrice') || '0');
      // Show filters if min price is set
      if (filterState.minPrice > 0) {
        showFilters = true;
      }
    } else {
      filterState.minPrice = 0;
    }

    if (params.has('maxPrice')) {
      filterState.maxPrice = parseInt(params.get('maxPrice') || '1000');
      // Show filters if max price is not default
      if (filterState.maxPrice < globalMaxPrice) {
        showFilters = true;
      }
    } else {
      filterState.maxPrice = 1000;
    }

    // Get sort order
    if (params.has('sort')) {
      filterState.sortBy = params.get('sort') || 'featured';
      // Show filters if sort is not default
      if (filterState.sortBy !== 'featured') {
        showFilters = true;
      }
    } else {
      filterState.sortBy = 'featured';
    }

    // Get featured filter
    if (params.has('featured')) {
      filterState.featuredOnly = params.get('featured') === 'true';
      if (filterState.featuredOnly) {
        showFilters = true;
      }
    } else {
      filterState.featuredOnly = false;
    }

    // Ensure the searchValue is updated in the store
    searchQuery.set(searchValue);
  };

  // Animation functions
  const animateOpeningElements = () => {
    if (!searchModalContent) return;

    // Enhanced opening animation for the modal
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
  };

  const animateFilterSection = (show: boolean) => {
    if (!showFilters || !searchModalContent) return;

    const filterSection = searchModalContent.querySelector('.search-filters');
    if (filterSection) {
      if (show) {
        gsap.fromTo(filterSection,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
        );

        // Animate filter groups with staggered effect
        const filterGroups = filterSection.querySelectorAll('.filter-group');
        gsap.fromTo(filterGroups,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
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
  };

  // Reset all filters
  const resetFilters = () => {
    filterState.categories = [];
    filterState.colors = [];
    filterState.sizes = [];
    filterState.minPrice = 0;
    filterState.maxPrice = 1000;
    filterState.sortBy = 'featured';
    filterState.featuredOnly = false;
  };

  // Filter toggles - optimized to prevent UI refreshes
  const toggleCategory = (category: string) => {
    const index = filterState.categories.indexOf(category);
    if (index >= 0) {
      // Remove category
      filterState.categories = filterState.categories.filter(c => c !== category);
    } else {
      // Add category
      filterState.categories = [...filterState.categories, category];
    }
  };

  const toggleColor = (color: string) => {
    const index = filterState.colors.indexOf(color);
    if (index >= 0) {
      // Remove color
      filterState.colors = filterState.colors.filter(c => c !== color);
    } else {
      // Add color
      filterState.colors = [...filterState.colors, color];
    }
  };

  const toggleSize = (size: string) => {
    const index = filterState.sizes.indexOf(size);
    if (index >= 0) {
      // Remove size
      filterState.sizes = filterState.sizes.filter(s => s !== size);
    } else {
      // Add size
      filterState.sizes = [...filterState.sizes, size];
    }
  };

  // Handle form submission
  const handleSubmit = (e: Event) => {
    e.preventDefault();

    // Create filters object with all the current filter values
    const filters = {
      categories: filterState.categories.length > 0 ? filterState.categories : undefined,
      colors: filterState.colors.length > 0 ? filterState.colors : undefined,
      sizes: filterState.sizes.length > 0 ? filterState.sizes : undefined,
      minPrice: filterState.minPrice > 0 ? filterState.minPrice : undefined,
      maxPrice: filterState.maxPrice < 1000 ? filterState.maxPrice : undefined,
      sort: filterState.sortBy !== 'featured' ? filterState.sortBy : undefined,
      featured: filterState.featuredOnly ? true : undefined
    };

    // Use the performSearch function from the store
    performSearch(searchValue, filters);
  };

  // Toggle filter visibility - updated to ensure it affects both forms
  const toggleFilters = () => {
    showFilters = !showFilters;

    // If showing filters, animate them in after a slight delay
    if (showFilters && searchModalContent) {
      setTimeout(() => {
        const filterSection = searchModalContent.querySelector('.search-filters');
        if (filterSection) {
          gsap.fromTo(filterSection,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
          );

          // Animate filter groups with staggered effect
          const filterGroups = filterSection.querySelectorAll('.filter-group');
          gsap.fromTo(filterGroups,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
          );
        }
      }, 50);
    }
  };

  // Reset price range
  const resetPriceRange = () => {
    filterState.minPrice = 0;
    filterState.maxPrice = 1000;
  };

  // Reset sort selection
  const resetSort = () => {
    filterState.sortBy = 'featured';
  };

  // Toggle applied filters visibility with better animation handling
  const toggleAppliedFilters = () => {
    showAppliedFilters = !showAppliedFilters;

    // Animate collapse/expand
    if (searchModalContent) {
      const appliedFiltersContent = searchModalContent.querySelector('.current-filters-list');
      if (appliedFiltersContent) {
        if (showAppliedFilters) {
          // First set height to 0, then animate to auto
          const element = appliedFiltersContent as HTMLElement;

          // Temporarily set height to 'auto' to measure natural height
          element.style.height = 'auto';
          element.style.opacity = '0';
          element.style.position = 'absolute';
          element.style.visibility = 'hidden';
          element.style.display = 'flex';

          // Get the natural height
          const naturalHeight = element.offsetHeight;

          // Reset to collapsed state for animation
          element.style.position = '';
          element.style.visibility = '';
          element.style.height = '0px';
          element.style.display = 'flex';

          // Force a reflow to ensure the browser recognizes the starting state
          void element.offsetHeight;

          // Animate to natural height
          gsap.to(element, {
            height: naturalHeight,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
              // Set back to auto after animation completes
              element.style.height = 'auto';
            }
          });
        } else {
          // Get current height before collapsing
          const element = appliedFiltersContent as HTMLElement;
          const currentHeight = element.offsetHeight;

          // Set fixed height before animating to 0
          element.style.height = `${currentHeight}px`;

          // Force a reflow to ensure the browser recognizes the fixed height
          void element.offsetHeight;

          // Animate to 0
          gsap.to(element, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in"
          });
        }
      }
    }
  };

  onMount(() => {
    // Load filters from URL when component mounts (only once)
    loadFiltersFromURL();

    // Focus input when search modal opens
    const unsubscribe = isSearchOpen.subscribe(value => {
      if (value) {
        // Apply opening animations
        setTimeout(() => {
          if (searchInput) searchInput.focus();
          animateOpeningElements();

          // Animate filter section if it should be shown
          if (showFilters) {
            setTimeout(() => animateFilterSection(true), 300);
          }
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
    if (filterState.categories.length > 0 || filterState.colors.length > 0 ||
        filterState.sizes.length > 0 || filterState.minPrice > 0 ||
        filterState.maxPrice < 1000 || filterState.sortBy !== 'featured' ||
        filterState.featuredOnly) {
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
</script>

<div class="search-modal-overlay" class:open={$isSearchOpen}>
  <div class="search-modal-container" class:with-filters={showFilters}>
    <div class="search-modal-content" bind:this={searchModalContent}>
      <div class="search-modal-sticky-header">
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

        <div class="search-form-sticky">
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
            <button type="button" class="search-button" on:click={handleSubmit}>Search</button>
          </div>
        </div>
      </div>

      <div class="search-modal-scrollable-content">
        <!-- Applied filters summary with collapsible functionality -->
        {#if (filterState.categories.length > 0 || filterState.colors.length > 0 || filterState.sizes.length > 0 || filterState.minPrice > 0 || filterState.maxPrice < 1000 || filterState.sortBy !== 'featured' || filterState.featuredOnly)}
          <div class="current-filters-container">
            <div class="current-filters-header">
              <h3 class="filter-title">
                Applied Filters
                {#if getTotalFilterCount() > 0}
                  <span class="filter-count">{getTotalFilterCount()}</span>
                {/if}
              </h3>
              <button
                type="button"
                class="collapse-filters-button"
                on:click={toggleAppliedFilters}
                aria-label={showAppliedFilters ? 'Collapse filters' : 'Expand filters'}
                title={showAppliedFilters ? 'Collapse filters' : 'Expand filters'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class:rotated={!showAppliedFilters}>
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
            </div>
            <div class="current-filters-list" class:collapsed={!showAppliedFilters}>
              <!-- Categories -->
              {#if filterState.categories.length > 0}
                <div class="current-filter-group">
                  <span class="filter-label">Categories:</span>
                  <div class="filter-chips">
                    {#each filterState.categories as category}
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
              {#if filterState.colors.length > 0}
                <div class="current-filter-group">
                  <span class="filter-label">Colors:</span>
                  <div class="filter-chips">
                    {#each filterState.colors as color}
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
              {#if filterState.sizes.length > 0}
                <div class="current-filter-group">
                  <span class="filter-label">Sizes:</span>
                  <div class="filter-chips">
                    {#each filterState.sizes as size}
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
              {#if filterState.minPrice > 0 || filterState.maxPrice < 1000}
                <div class="current-filter-group">
                  <span class="filter-label">Price:</span>
                  <div class="filter-chips">
                    <div class="filter-chip">
                      ${filterState.minPrice} - ${filterState.maxPrice}
                      <button
                        type="button"
                        class="remove-filter"
                        on:click={resetPriceRange}
                        aria-label="Reset price range"
                      >×</button>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Sort -->
              {#if filterState.sortBy !== 'featured'}
                <div class="current-filter-group">
                  <span class="filter-label">Sort:</span>
                  <div class="filter-chips">
                    <div class="filter-chip">
                      {filterState.sortBy === 'price-asc' ? 'Price: Low to High' :
                       filterState.sortBy === 'price-desc' ? 'Price: High to Low' :
                       filterState.sortBy === 'rating' ? 'Customer Rating' :
                       filterState.sortBy === 'newest' ? 'Newest Arrivals' : filterState.sortBy}
                      <button
                        type="button"
                        class="remove-filter"
                        on:click={resetSort}
                        aria-label="Reset sort order"
                      >×</button>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Featured Filter -->
              {#if filterState.featuredOnly}
                <div class="current-filter-group">
                  <span class="filter-label">Featured:</span>
                  <div class="filter-chips">
                    <div class="filter-chip">
                      Featured Only
                      <button
                        type="button"
                        class="remove-filter"
                        on:click={() => {
                          filterState.featuredOnly = false;
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
                {#if $isLoadingFilters}
                  <p class="loading-message">Loading categories...</p>
                {:else if $categoriesStore.length === 0}
                  <p class="no-data-message">No categories available</p>
                {:else}
                  {#each $categoriesStore as category}
                    <button
                      type="button"
                      class="category-chip {filterState.categories.includes(category.name.toLowerCase()) ? 'active' : ''}"
                      on:click={() => toggleCategory(category.name.toLowerCase())}
                    >
                      {category.name}
                    </button>
                  {/each}
                {/if}
              </div>
            </div>

            <!-- Colors Filter -->
            <div class="filter-group">
              <h3 class="filter-title">Colors</h3>
              <div class="filter-options colors">
                {#if $isLoadingFilters}
                  <p class="loading-message">Loading colors...</p>
                {:else if $colorsStore.length === 0}
                  <p class="no-data-message">No colors available</p>
                {:else}
                  {#each $colorsStore as color}
                    <button
                      type="button"
                      class="color-chip {filterState.colors.includes(color.name.toLowerCase()) ? 'active' : ''}"
                      on:click={() => toggleColor(color.name.toLowerCase())}
                    >
                      {#if color.hex && Array.isArray(color.hex) && color.hex.length > 1}
                        <span class="color-dot">
                          <ColorPieChart hexColors={color.hex} size={18} border={true} borderWidth={1} />
                        </span>
                      {:else}
                        <span
                          class="color-dot"
                          style="background-color: {Array.isArray(color.hex) ? color.hex[0] : (typeof color.hex === 'string' ? color.hex : '#ccc')};"
                        ></span>
                      {/if}
                      <span class="color-name">{color.name}</span>
                    </button>
                  {/each}
                {/if}
              </div>
            </div>

            <!-- Sizes Filter -->
            <div class="filter-group">
              <h3 class="filter-title">Sizes</h3>
              <div class="filter-options sizes">
                {#if $isLoadingFilters}
                  <p class="loading-message">Loading sizes...</p>
                {:else if $sizesStore.length === 0}
                  <p class="no-data-message">No sizes available</p>
                {:else}
                  {#each $sizesStore as size}
                    <button
                      type="button"
                      class="size-chip {filterState.sizes.includes(size.name) ? 'active' : ''}"
                      on:click={() => toggleSize(size.name)}
                    >
                      {size.name}
                    </button>
                  {/each}
                {/if}
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
                    style="left: {(filterState.minPrice / 1000) * 100}%; right: {100 - (filterState.maxPrice / 1000) * 100}%;"
                  ></div>

                  <!-- Thumb indicators that are always visible -->
                  <div
                    class="slider-thumb min-thumb {isDraggingMinSlider ? 'active' : ''}"
                    style="left: {(filterState.minPrice / 1000) * 100}%;"
                  ></div>
                  <div
                    class="slider-thumb max-thumb {isDraggingMaxSlider ? 'active' : ''}"
                    style="left: {(filterState.maxPrice / 1000) * 100}%;"
                  ></div>
                </div>

                <div class="range-inputs">
                  <input
                    type="range"
                    class="price-range-slider min-slider"
                    min="0"
                    max="1000"
                    step="10"
                    bind:value={filterState.minPrice}
                    on:mousedown={() => handleSliderDragStart('min')}
                    on:touchstart={() => handleSliderDragStart('min')}
                    on:mouseup={handleSliderDragEnd}
                    on:touchend={handleSliderDragEnd}
                    on:mouseleave={handleSliderDragEnd}
                    on:input={() => {
                      // Update tooltips while dragging
                      minTooltipPosition = `${(filterState.minPrice / 1000) * 100}%`;
                    }}
                    aria-label="Minimum price"
                  />
                  <input
                    type="range"
                    class="price-range-slider max-slider"
                    min="0"
                    max="1000"
                    step="10"
                    bind:value={filterState.maxPrice}
                    on:mousedown={() => handleSliderDragStart('max')}
                    on:touchstart={() => handleSliderDragStart('max')}
                    on:mouseup={handleSliderDragEnd}
                    on:touchend={handleSliderDragEnd}
                    on:mouseleave={handleSliderDragEnd}
                    on:input={() => {
                      // Update tooltips while dragging
                      maxTooltipPosition = `${(filterState.maxPrice / 1000) * 100}%`;
                    }}
                    aria-label="Maximum price"
                  />
                </div>

                <!-- Tooltip bubbles that follow the sliders -->
                <div class="slider-tooltips">
                  <div
                    class="tooltip min-tooltip {isDraggingMinSlider ? 'active' : ''}"
                    style="left: {minTooltipPosition};"
                  >
                    ${filterState.minPrice}
                  </div>
                  <div
                    class="tooltip max-tooltip {isDraggingMaxSlider ? 'active' : ''}"
                    style="left: {maxTooltipPosition};"
                  >
                    ${filterState.maxPrice}
                  </div>
                </div>

                <!-- Current range display - always visible -->
                <div class="price-range-display">
                  <span>Current range: <strong>${filterState.minPrice} - ${filterState.maxPrice}</strong></span>
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
                        bind:value={filterState.minPrice}
                        min="0"
                        max={filterState.maxPrice}
                        step="10"
                        on:input={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val) || val < 0) val = 0;
                          if (val > filterState.maxPrice) val = filterState.maxPrice;
                          filterState.minPrice = val;
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
                        bind:value={filterState.maxPrice}
                        min={filterState.minPrice}
                        max="10000"
                        step="10"
                        on:input={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val) || val > 10000) val = 10000;
                          if (val < filterState.minPrice) val = filterState.minPrice;
                          filterState.maxPrice = val;
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
                <select
                  bind:value={filterState.sortBy}
                  class="sort-select"
                >
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
                  bind:checked={filterState.featuredOnly}
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

  /* Update modal content styles to accommodate sticky header */
  .search-modal-content {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25), 0 0 15px rgba(212, 175, 55, 0.2);
    padding: 1.75rem;
    position: relative;
    max-height: 80vh;
    overflow: hidden; /* Changed from overflow-y: auto to hidden */
    -webkit-overflow-scrolling: touch;
    border: 1px solid rgba(212, 175, 55, 0.1);
    display: flex;
    flex-direction: column;
  }

  /* Sticky header styles - removed background color and box shadow */
  .search-modal-sticky-header {
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid rgba(212, 175, 55, 0.08);
    padding-bottom: 1.25rem;
    margin-bottom: 1.25rem;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }

  .search-form-sticky {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .search-modal-scrollable-content {
    overflow-y: auto;
    max-height: calc(80vh - 160px); /* Adjust height to account for sticky header */
    -webkit-overflow-scrolling: touch; /* Smooth scrolling for iOS */
  }

  /* Hide the duplicate form that's only needed for form submission */
  .search-form {
    display: none;
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

  /* Search input container */
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

  /* Current filters header styles */
  .current-filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    background: linear-gradient(145deg, #f8f8f8, #f0f0f0);
    padding: 0.8rem 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(212, 175, 55, 0.1);
  }

  .filter-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-gold);
    color: white;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    font-size: 0.8rem;
    font-weight: 700;
    margin-left: 0.5rem;
    box-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);
  }

  .collapse-filters-button {
    background: none;
    border: none;
    padding: 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #666;
    /* Improved touch target */
    min-width: 32px;
    min-height: 32px;
  }

  .collapse-filters-button:hover {
    background-color: rgba(212, 175, 55, 0.1);
    color: var(--color-gold);
  }

  .collapse-filters-button svg {
    transition: transform 0.3s ease;
  }

  .collapse-filters-button svg.rotated {
    transform: rotate(180deg);
  }

  /* Animation styles for collapse/expand */
  .current-filters-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
    transition: height 0.3s ease, opacity 0.3s ease;
    overflow: hidden;
  }

  .current-filters-list.collapsed {
    height: 0;
    opacity: 0;
    margin-top: 0;
    pointer-events: none;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    margin-right: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
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

  /* Added back slider-labels CSS */
  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: #777;
    font-size: 0.75rem;
  }

  /* Price Range Slider Enhancements */
  .slider-track {
    position: relative;
    width: 100%;
    height: 8px;
    background: linear-gradient(to right, #e6e6e6, #f0f0f0, #e6e6e6);
    border-radius: 5px;
    margin: 0.75rem 0 2.25rem; /* Increased margin to accommodate the thumbs */
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

  /* Range inputs need higher z-index than thumbs */
  .range-inputs {
    position: relative;
    z-index: 10; /* Ensure inputs are above thumbs */
  }

  .price-range-slider {
    position: absolute;
    width: 100%;
    -webkit-appearance: none;
    height: 8px;
    opacity: 0;
    z-index: 10; /* Higher than the visible thumbs */
    top: -2.5rem;
    cursor: pointer;
  }

  /* Visible thumbs with lower z-index */
  .slider-thumb {
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    border: 2px solid var(--color-gold);
    top: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-width 0.2s ease;
    z-index: 4; /* Lower than range inputs */
    pointer-events: none; /* Don't intercept pointer events */
  }

  .slider-thumb.min-thumb {
    background: linear-gradient(to bottom right, white, #f0f0f0);
  }

  .slider-thumb.max-thumb {
    background: linear-gradient(to bottom right, var(--color-gold), #c29d2e);
    border-color: white;
  }

  .slider-thumb.active {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
    border-width: 3px;
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
    top: -36px;
    transform: translateX(-50%);
    background: var(--color-gold);
    color: white;
    padding: 4px 10px;
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

  .tooltip.min-tooltip {
    background: #777;
  }

  .tooltip.max-tooltip {
    background: var(--color-gold);
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
  }

  .tooltip.min-tooltip::after {
    border-color: #777 transparent transparent transparent;
  }

  .tooltip.max-tooltip::after {
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

  /* Price range current display */
  .price-range-display {
    text-align: center;
    margin: 1.25rem 0 1rem;
    font-size: 0.9rem;
    color: #555;
  }

  .price-range-display strong {
    color: var(--color-gold);
    font-weight: 600;
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
      padding: 1.5rem 0.25rem 0.5rem; /* Increased padding for better touch area */
    }

    .slider-track {
      height: 10px; /* Thicker track for easier mobile targeting */
      margin: 1rem 0 2.5rem; /* More vertical space for touch */
    }

    .slider-thumb {
      width: 22px; /* Larger thumbs on mobile */
      height: 22px;
    }

    .tooltip {
      top: -40px; /* Position tooltips higher on mobile */
      font-size: 0.8rem;
      padding: 5px 8px;
    }

    .price-range-display {
      font-size: 1rem; /* Larger font for the current range display */
      margin: 1.5rem 0 1.2rem;
    }

    .price-inputs {
      margin-top: 1.5rem;
    }

    .price-input-wrapper input {
      font-size: 16px; /* Larger font to prevent iOS zoom */
      padding: 0.8rem 0.8rem 0.8rem 1.9rem;
      min-height: 48px; /* Larger touch targets */
    }

    /* Make price inputs stack on very small screens */
    @media (max-width: 360px) {
      .price-inputs {
        flex-direction: column;
        gap: 1rem;
      }

      .price-range-divider {
        display: none;
      }
    }
  }

  /* Mobile adjustments for sticky header */
  @media (max-width: 640px) {
    .search-modal-sticky-header {
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }

    .search-modal-scrollable-content {
      max-height: calc(80vh - 140px);
    }

    .search-actions {
      flex-direction: row; /* Keep buttons side by side on smaller screens */
    }
  }

  /* Loading and no-data messages */
  .loading-message,
  .no-data-message {
    font-size: 0.9rem;
    color: #777;
    font-style: italic;
    padding: 0.5rem 0;
    width: 100%;
    text-align: center;
  }
</style>
