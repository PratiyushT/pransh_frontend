<script lang="ts">
  import { onMount } from 'svelte';
  import { getProducts, getCategories, getSizes, getColors } from '$lib/utils/data';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import QuickViewModal from '$lib/components/QuickViewModal.svelte';
  import type { Product } from '$lib/types';
  import gsap from 'gsap';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Access the page data from the load function
  export let data;

  // Initialize with all products by default
  let products: Product[] = getProducts();
  let isFilterOpen = false;
  let selectedSort = 'featured';
  let pageContainer: HTMLElement;
  let heroSection: HTMLElement;
  let productGrid: HTMLElement;
  let filterSection: HTMLElement;
  let isInitialLoad = true;
  let searchQuery = '';

  // Current applied filters
  let selectedCategory = '';
  let selectedCategories: string[] = [];  // For multiple category selection
  let selectedSizes: string[] = [];
  let selectedColors: string[] = [];
  let minPrice = 0;
  let maxPrice = 100;
  let sortBy = 'featured';

  // Pending filter changes (not applied until user clicks Apply button)
  let pendingCategory = selectedCategory;
  let pendingCategories: string[] = [];  // For pending category selections
  let pendingSizes: string[] = [];
  let pendingColors: string[] = [];
  let pendingMinPrice = 0;
  let pendingMaxPrice = 100;
  let pendingSortBy = 'featured';

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
  pendingMinPrice = globalMinPrice;
  pendingMaxPrice = globalMaxPrice;

  // Function to format price
  const formatPrice = (price) => {
    return Math.round(price);
  };

  // Variables for price slider
  let priceSliderContainer;
  let minPriceThumb;
  let maxPriceThumb;
  let priceTrack;
  let isDraggingMin = false;
  let isDraggingMax = false;
  let startX = 0;
  let startLeft = 0;

  // Function to update the URL based on current filters
  const updateURL = () => {
    try {
      // Build URL params
      const params = new URLSearchParams();

      // Add search query if exists
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      // Add categories if selected
      if (selectedCategories.length > 0) {
        params.set('category', selectedCategories.join(','));
      }

      // Add sizes if selected
      if (selectedSizes.length > 0) {
        params.set('size', selectedSizes.join(','));
      }

      // Add colors if selected
      if (selectedColors.length > 0) {
        params.set('color', selectedColors.join(','));
      }

      // Add price range if not at defaults
      if (minPrice !== globalMinPrice) {
        params.set('minPrice', minPrice.toString());
      }

      if (maxPrice !== globalMaxPrice) {
        params.set('maxPrice', maxPrice.toString());
      }

      // Add sort if not default
      if (sortBy !== 'featured') {
        params.set('sort', sortBy);
      }

      // Update the URL without refreshing the page
      const url = `/shop${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Updating URL to:', url);

      // Use history API directly instead of goto to avoid potential issues
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', url);
      }
    } catch (error) {
      console.error('Error updating URL:', error);
    }
  };

  // Apply URL parameters to filters
  const applyURLFilters = () => {
    console.log('Applying URL filters from data:', data.filters);

    if (data.filters) {
      // Set search query
      if (data.filters.searchQuery) {
        searchQuery = data.filters.searchQuery.replace(/"/g, ''); // Remove quotes if present
        console.log('Applied search query:', searchQuery);
      }

      // Set categories
      if (data.filters.categories && data.filters.categories.length > 0) {
        // Convert to lowercase for consistent comparison
        selectedCategories = [...data.filters.categories.map(cat => cat.toLowerCase())];
        pendingCategories = [...selectedCategories];
        console.log('Applied categories:', selectedCategories);
      }

      // Set colors
      if (data.filters.colors && data.filters.colors.length > 0) {
        // Convert to lowercase for consistent comparison
        selectedColors = [...data.filters.colors.map(color => color.toLowerCase())];
        pendingColors = [...selectedColors];
        console.log('Applied colors:', selectedColors);
      }

      // Set sizes
      if (data.filters.sizes && data.filters.sizes.length > 0) {
        // Keep original case for sizes (since sizes like 'S', 'M', 'L' are case-sensitive)
        selectedSizes = [...data.filters.sizes];
        pendingSizes = [...selectedSizes];
        console.log('Applied sizes:', selectedSizes);
      }

      // Set price range
      if (data.filters.minPrice !== null) {
        minPrice = data.filters.minPrice;
        pendingMinPrice = minPrice;
        console.log('Applied minPrice:', minPrice);
      }

      if (data.filters.maxPrice !== null) {
        maxPrice = data.filters.maxPrice;
        pendingMaxPrice = maxPrice;
        console.log('Applied maxPrice:', maxPrice);
      }

      // Set sort order
      if (data.filters.sort) {
        sortBy = data.filters.sort;
        pendingSortBy = sortBy;
        selectedSort = sortBy;
        console.log('Applied sort:', sortBy);
      }
    }
  };

  // Initialize products
  onMount(() => {
    // Apply URL filters first
    applyURLFilters();

    // Initialize the price slider functionality
    initPriceSlider();

    // Update products based on filters (in case there are any default filters)
    updateProducts();

    // Animate page elements on load
    if (isInitialLoad && heroSection && filterSection && productGrid) {
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

    // Initialize pending filters
    initPendingFilters();
  });

  // Handle keyboard navigation for accessibility
  function handleKeyDown(e, isMinThumb) {
    const range = globalMaxPrice - globalMinPrice;
    const step = range / 100; // 1% increment
    let newPrice;

    // Left/right or up/down arrow keys to adjust values
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      if (isMinThumb) {
        newPrice = Math.max(globalMinPrice, pendingMinPrice - step);
        pendingMinPrice = Math.round(newPrice);
      } else {
        newPrice = Math.max(pendingMinPrice, pendingMaxPrice - step);
        pendingMaxPrice = Math.round(newPrice);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      if (isMinThumb) {
        newPrice = Math.min(pendingMaxPrice, pendingMinPrice + step);
        pendingMinPrice = Math.round(newPrice);
      } else {
        newPrice = Math.min(globalMaxPrice, pendingMaxPrice + step);
        pendingMaxPrice = Math.round(newPrice);
      }
      e.preventDefault();
    }

    // Update slider positions
    updateSliderPositions();
  }

  // Function to initialize and handle the price slider
  function initPriceSlider() {
    if (!priceSliderContainer) return;

    // Set initial values if they haven't been set
    if (pendingMinPrice === globalMinPrice && pendingMaxPrice === globalMaxPrice) {
      // Default to showing products in the 25%-75% price range initially
      pendingMinPrice = Math.round(globalMinPrice + (globalMaxPrice - globalMinPrice) * 0.25);
      pendingMaxPrice = Math.round(globalMinPrice + (globalMaxPrice - globalMinPrice) * 0.75);
    }

    // Initial setup of the slider positions
    setTimeout(() => {
      updateSliderPositions();
    }, 100);

    // Listen for window resize to recalculate slider positions
    window.addEventListener('resize', updateSliderPositions);

    return () => {
      window.removeEventListener('resize', updateSliderPositions);
    };
  }

  // Update the slider thumbs' positions based on current min/max values
  function updateSliderPositions() {
    if (!priceSliderContainer || !minPriceThumb || !maxPriceThumb || !priceTrack) return;

    const containerWidth = priceSliderContainer.clientWidth;
    const range = globalMaxPrice - globalMinPrice;

    // Calculate percentage positions for min and max thumbs
    const minPercent = ((pendingMinPrice - globalMinPrice) / range) * 100;
    const maxPercent = ((pendingMaxPrice - globalMinPrice) / range) * 100;

    // Apply positions to thumbs
    minPriceThumb.style.left = `${minPercent}%`;
    maxPriceThumb.style.left = `${maxPercent}%`;

    // Update track width and position to show selected range
    priceTrack.style.left = `${minPercent}%`;
    priceTrack.style.width = `${maxPercent - minPercent}%`;
  }

  // Handle mouse down on min thumb
  function handleMinThumbMouseDown(e) {
    isDraggingMin = true;
    startX = e.clientX;
    startLeft = parseInt(minPriceThumb.style.left, 10) || 0;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  }

  // Handle mouse down on max thumb
  function handleMaxThumbMouseDown(e) {
    isDraggingMax = true;
    startX = e.clientX;
    startLeft = parseInt(maxPriceThumb.style.left, 10) || 100;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  }

  // Handle touch start on min thumb
  function handleMinThumbTouchStart(e) {
    isDraggingMin = true;
    startX = e.touches[0].clientX;
    startLeft = parseInt(minPriceThumb.style.left, 10) || 0;
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    e.preventDefault();
  }

  // Handle touch start on max thumb
  function handleMaxThumbTouchStart(e) {
    isDraggingMax = true;
    startX = e.touches[0].clientX;
    startLeft = parseInt(maxPriceThumb.style.left, 10) || 100;
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    e.preventDefault();
  }

  // Handle mouse move during drag
  function handleMouseMove(e) {
    if (!isDraggingMin && !isDraggingMax) return;

    const containerWidth = priceSliderContainer.clientWidth;
    const range = globalMaxPrice - globalMinPrice;
    const moveX = e.clientX - startX;
    const movePercent = (moveX / containerWidth) * 100;
    let newLeft = startLeft + movePercent;

    // Constrain to 0-100% range
    newLeft = Math.max(0, Math.min(100, newLeft));

    if (isDraggingMin) {
      // Ensure min thumb doesn't go beyond max thumb
      const maxLeft = parseInt(maxPriceThumb.style.left, 10) || 100;
      newLeft = Math.min(newLeft, maxLeft);

      // Update min thumb position
      minPriceThumb.style.left = `${newLeft}%`;

      // Calculate new min price
      pendingMinPrice = Math.round(globalMinPrice + (newLeft / 100) * range);

      // Update track
      priceTrack.style.left = `${newLeft}%`;
      priceTrack.style.width = `${maxLeft - newLeft}%`;
    } else if (isDraggingMax) {
      // Ensure max thumb doesn't go behind min thumb
      const minLeft = parseInt(minPriceThumb.style.left, 10) || 0;
      newLeft = Math.max(newLeft, minLeft);

      // Update max thumb position
      maxPriceThumb.style.left = `${newLeft}%`;

      // Calculate new max price
      pendingMaxPrice = Math.round(globalMinPrice + (newLeft / 100) * range);

      // Update track
      priceTrack.style.width = `${newLeft - minLeft}%`;
    }
  }

  // Handle touch move during drag
  function handleTouchMove(e) {
    if (!isDraggingMin && !isDraggingMax) return;

    const containerWidth = priceSliderContainer.clientWidth;
    const range = globalMaxPrice - globalMinPrice;
    const moveX = e.touches[0].clientX - startX;
    const movePercent = (moveX / containerWidth) * 100;
    let newLeft = startLeft + movePercent;

    // Constrain to 0-100% range
    newLeft = Math.max(0, Math.min(100, newLeft));

    if (isDraggingMin) {
      // Ensure min thumb doesn't go beyond max thumb
      const maxLeft = parseInt(maxPriceThumb.style.left, 10) || 100;
      newLeft = Math.min(newLeft, maxLeft);

      // Update min thumb position
      minPriceThumb.style.left = `${newLeft}%`;

      // Calculate new min price
      pendingMinPrice = Math.round(globalMinPrice + (newLeft / 100) * range);

      // Update track
      priceTrack.style.left = `${newLeft}%`;
      priceTrack.style.width = `${maxLeft - newLeft}%`;
    } else if (isDraggingMax) {
      // Ensure max thumb doesn't go behind min thumb
      const minLeft = parseInt(minPriceThumb.style.left, 10) || 0;
      newLeft = Math.max(newLeft, minLeft);

      // Update max thumb position
      maxPriceThumb.style.left = `${newLeft}%`;

      // Calculate new max price
      pendingMaxPrice = Math.round(globalMinPrice + (newLeft / 100) * range);

      // Update track
      priceTrack.style.width = `${newLeft - minLeft}%`;
    }

    e.preventDefault(); // Prevent scrolling while dragging
  }

  // Handle mouse up to end dragging
  function handleMouseUp() {
    isDraggingMin = false;
    isDraggingMax = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  // Handle touch end to stop dragging
  function handleTouchEnd() {
    isDraggingMin = false;
    isDraggingMax = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }

  // Update slider when min or max price changes
  $: if (pendingMinPrice !== undefined && pendingMaxPrice !== undefined && priceSliderContainer) {
    updateSliderPositions();
  }

  // Function to update products based on filters
  const updateProducts = () => {
    console.log("Updating products with filters:", {
      searchQuery,
      selectedCategories,
      selectedSizes,
      selectedColors,
      minPrice,
      maxPrice,
      sortBy
    });

    // Start with all products
    let filteredProducts = getProducts();
    console.log(`Starting with ${filteredProducts.length} products`);

    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
      console.log(`After search query filter: ${filteredProducts.length} products`);
    }

    // Filter by categories if selected
    if (selectedCategories.length > 0) {
      filteredProducts = filteredProducts.filter(product => {
        const productCategory = product.category.toLowerCase();
        return selectedCategories.some(cat => productCategory === cat.toLowerCase());
      });
      console.log(`After category filter: ${filteredProducts.length} products`);
    }

    // Filter by size
    if (selectedSizes.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.variants.some(variant => selectedSizes.includes(variant.size))
      );
      console.log(`After size filter: ${filteredProducts.length} products`);
    }

    // Filter by color
    if (selectedColors.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.variants.some(variant =>
          selectedColors.some(color =>
            variant.color.name.toLowerCase() === color.toLowerCase()
          )
        )
      );
      console.log(`After color filter: ${filteredProducts.length} products`);
    }

    // Filter by price
    filteredProducts = filteredProducts.filter(product =>
      product.variants.some(variant =>
        variant.price >= minPrice && variant.price <= maxPrice
      )
    );
    console.log(`After price filter: ${filteredProducts.length} products`);

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
    console.log(`After sorting: ${filteredProducts.length} products`);

    // Update URL with current filters
    updateURL();

    // Update products without animations for now to simplify
    products = filteredProducts;
    console.log(`Set products array to ${products.length} products`);
  };

  // Initialize pending filters with current values
  const initPendingFilters = () => {
    pendingCategory = selectedCategory;
    pendingCategories = [...selectedCategories];
    pendingSizes = [...selectedSizes];
    pendingColors = [...selectedColors];
    pendingMinPrice = minPrice;
    pendingMaxPrice = maxPrice;
    pendingSortBy = sortBy;
  };

  // Apply pending filters
  const applyFilters = () => {
    selectedCategory = pendingCategory;
    selectedCategories = [...pendingCategories];
    selectedSizes = [...pendingSizes];
    selectedColors = [...pendingColors];
    minPrice = pendingMinPrice;
    maxPrice = pendingMaxPrice;
    sortBy = pendingSortBy;
    updateProducts();
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchQuery = searchQuery; // Keep the search logic intact
    updateProducts();
  };

  // Handle pending category changes
  const handlePendingCategoryToggle = (category: string) => {
    // If "All Categories" is selected, clear other selections
    if (category === '') {
      pendingCategories = [];
      return;
    }

    // If category is already selected, remove it
    if (pendingCategories.includes(category)) {
      pendingCategories = pendingCategories.filter(c => c !== category);
    } else {
      // Otherwise add it
      pendingCategories = [...pendingCategories, category];
    }
  };

  // Handle pending filter changes
  const handlePendingSizeChange = (size: string) => {
    if (pendingSizes.includes(size)) {
      pendingSizes = pendingSizes.filter(s => s !== size);
    } else {
      pendingSizes = [...pendingSizes, size];
    }
  };

  const handlePendingColorChange = (color: string) => {
    if (pendingColors.includes(color)) {
      pendingColors = pendingColors.filter(c => c !== color);
    } else {
      pendingColors = [...pendingColors, color];
    }
  };

  const handleSortChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    pendingSortBy = target.value;
    sortBy = pendingSortBy; // Apply sort immediately for better UX
    updateProducts();
  };

  const resetFilters = () => {
    // Reset active filters
    selectedCategory = '';
    selectedCategories = [];
    selectedSizes = [];
    selectedColors = [];
    minPrice = globalMinPrice;
    maxPrice = globalMaxPrice;
    sortBy = 'featured';
    searchQuery = '';

    // Reset pending filters
    initPendingFilters();

    updateProducts();
  };

  // Initialize pending filters on mount
  onMount(() => {
    initPendingFilters();
  });

  const toggleFilter = () => {
    isFilterOpen = !isFilterOpen;

    // Animate filter opening/closing only on mobile
    if (filterSection) {
      // Only perform animations on mobile screens
      if (window.innerWidth < 1024) {
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

  // Category name for display
  $: categoryName = selectedCategory
    ? categories.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase())?.name || selectedCategory
    : selectedCategories.length > 0
      ? `${selectedCategories.length} Categories Selected`
      : 'All Products';
</script>

<svelte:head>
  <title>Pransh - Shop</title>
  <meta name="description" content="Browse our luxury collection - clothing with timeless elegance and exceptional quality.">
</svelte:head>

<section class="section shop-section" bind:this={pageContainer}>
  <div class="container">
    <!-- Page Header -->
    <div class="section-title mb-12" bind:this={heroSection}>
      <h1 class="hero-title fade-in">Shop</h1>
      <p class="section-subtitle fade-in">
        Discover our exquisite collection,
        crafted with premium materials for the discerning customer.
      </p>
      <div class="hero-line"></div>
    </div>

    <!-- Filters and Products -->
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Mobile Filter Toggle -->
      <div class="lg:hidden mb-6 w-full">
        <button
          class="luxury-filter-toggle"
          on:click={toggleFilter}
        >
          <div class="filter-toggle-content">
            <span class="filter-toggle-text">Filters & Sorting</span>
            <div class="filter-toggle-icon">
              {#if isFilterOpen}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              {/if}
            </div>
          </div>
        </button>
      </div>

      <!-- Filters Section - Now comes first in the DOM -->
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
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-500">
                {pendingCategories.length ? `${pendingCategories.length} selected` : 'All products'}
              </span>
              {#if pendingCategories.length > 0}
                <button
                  class="text-xs text-gold hover:underline"
                  on:click={() => {
                    pendingCategories = [];
                  }}
                >
                  Clear
                </button>
              {/if}
            </div>
            <div class="category-options">
              <div
                class={`category-chip ${pendingCategories.length === 0 ? 'active' : ''}`}
                on:click={() => {
                  pendingCategories = [];
                }}
              >
                All
              </div>

              {#each categories as category}
                <div
                  class={`category-chip ${pendingCategories.includes(category.name.toLowerCase()) ? 'active' : ''}`}
                  on:click={() => handlePendingCategoryToggle(category.name.toLowerCase())}
                >
                  {category.name}
                </div>
              {/each}
            </div>
          </div>

          <!-- Sizes -->
          <div class="filter-group">
            <h3 class="filter-title">Sizes</h3>
            <div class="flex flex-wrap gap-3 mt-4">
              {#each sizes as size}
                <label
                  class="luxury-size-selector {pendingSizes.includes(size.name) ? 'active' : ''}"
                >
                  <input
                    type="checkbox"
                    class="sr-only"
                    value={size.name}
                    checked={pendingSizes.includes(size.name)}
                    on:change={() => handlePendingSizeChange(size.name)}
                  >
                  <span>{size.name}</span>
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
                  class="luxury-color-selector {pendingColors.includes(color.name) ? 'active' : ''}"
                  style="--color-dot: {color.hex};"
                >
                  <input
                    type="checkbox"
                    class="sr-only"
                    value={color.name}
                    checked={pendingColors.includes(color.name)}
                    on:change={() => handlePendingColorChange(color.name)}
                  >
                  <span class="color-dot"></span>
                  <span class="sr-only">{color.name}</span>
                </label>
              {/each}
            </div>
          </div>

          <!-- Price Range -->
          <div class="filter-group">
            <h3 class="filter-title">Price Range</h3>
            <div class="price-range mt-6">
              <div class="custom-price-slider" bind:this={priceSliderContainer}>
                <div class="price-slider-base"></div>
                <div class="price-slider-track" bind:this={priceTrack}></div>
                <div
                  class="price-slider-thumb min-thumb"
                  bind:this={minPriceThumb}
                  on:mousedown={handleMinThumbMouseDown}
                  on:touchstart={handleMinThumbTouchStart}
                  on:keydown={(e) => handleKeyDown(e, true)}
                  role="slider"
                  aria-valuemin={globalMinPrice}
                  aria-valuemax={globalMaxPrice}
                  aria-valuenow={pendingMinPrice}
                  aria-label="Minimum price"
                  tabindex="0"
                ></div>
                <div
                  class="price-slider-thumb max-thumb"
                  bind:this={maxPriceThumb}
                  on:mousedown={handleMaxThumbMouseDown}
                  on:touchstart={handleMaxThumbTouchStart}
                  on:keydown={(e) => handleKeyDown(e, false)}
                  role="slider"
                  aria-valuemin={globalMinPrice}
                  aria-valuemax={globalMaxPrice}
                  aria-valuenow={pendingMaxPrice}
                  aria-label="Maximum price"
                  tabindex="0"
                ></div>
              </div>
              <div class="flex justify-between mt-4">
                <span class="price-label">${formatPrice(pendingMinPrice)}</span>
                <span class="price-label">${formatPrice(pendingMaxPrice)}</span>
              </div>
            </div>
          </div>

          <!-- Apply Filters Button -->
          <button
            class="apply-filters-button"
            on:click={applyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>

      <!-- Products Section -->
      <div class="lg:w-3/4">
        <!-- Sort and Results Info -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div class="results-info mb-4 sm:mb-0">
            <span class="text-sm text-gray-600">{products.length} products</span>
          </div>

          <div class="sort-container">
            <label for="sort-select" class="sort-label">Sort by:</label>
            <select
              id="sort-select"
              class="sort-select"
              bind:value={selectedSort}
              on:change={handleSortChange}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="products-grid" bind:this={productGrid}>
          {#if products && products.length > 0}
            {#each products as product (product._id)}
              <div class="product-card-wrapper">
                <ProductCard {product} on:quickView={handleQuickView} />
              </div>
            {/each}
          {:else}
            <div class="col-span-full text-center py-12">
              <p class="text-xl text-gray-500">No products found matching your criteria.</p>
              <button
                class="mt-4 inline-block px-6 py-2 border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors duration-300"
                on:click={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</section>

{#if quickViewOpen && quickViewProduct}
  <QuickViewModal product={quickViewProduct} on:close={handleCloseQuickView} />
{/if}

<style>
  /* Hero Section */
  .hero-title {
    font-family: var(--heading-font);
    font-size: 2.5rem;
    color: var(--color-charcoal);
    text-align: center;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .section-subtitle {
    text-align: center;
    max-width: 600px;
    margin: 0 auto 1.5rem;
    font-size: 1.1rem;
    line-height: 1.6;
    color: var(--color-gray);
  }

  .hero-line {
    width: 60px;
    height: 2px;
    background-color: var(--color-gold);
    margin: 0 auto;
  }

  /* Products Grid */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1.5rem;
  }

  @media (min-width: 640px) {
    .products-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .products-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Filter Toggle Button */
  .luxury-filter-toggle {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-light-gray);
    background-color: #fff;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .luxury-filter-toggle:hover {
    border-color: var(--color-gold);
  }

  .filter-toggle-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-toggle-text {
    font-weight: 500;
  }

  /* Filter Styles */
  .filter-container {
    overflow: hidden;
  }

  .filter-wrapper {
    background-color: #fbfbfb;
    padding: 1.25rem;
    border: 1px solid var(--color-light-gray);
  }

  .filter-heading {
    font-family: var(--heading-font);
    font-size: 1.3rem;
    font-weight: 500;
  }

  .reset-button {
    font-size: 0.875rem;
    color: var(--color-gold);
    background: none;
    border: none;
    cursor: pointer;
    transition: opacity 0.3s ease;
  }

  .reset-button:hover {
    opacity: 0.7;
  }

  .filter-group {
    margin-bottom: 1.75rem;
    padding-bottom: 1.75rem;
    border-bottom: 1px solid var(--color-light-gray);
  }

  .filter-group:last-child {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .filter-title {
    font-weight: 500;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  /* Category Styling */
  .category-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .category-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-light-gray);
    border-radius: 30px;
    font-size: 0.875rem;
    background-color: white;
    color: var(--color-charcoal);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .category-chip:hover {
    border-color: var(--color-gold);
    background-color: rgba(212, 175, 55, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .category-chip.active {
    background-color: var(--color-gold);
    color: white;
    border-color: var(--color-gold);
    box-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);
    font-weight: 500;
  }

  /* Category Radio Buttons */
  .filter-option {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .filter-radio {
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
    accent-color: var(--color-gold);
  }

  .filter-text {
    font-size: 0.95rem;
  }

  /* Size Selectors */
  .luxury-size-selector {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.25rem;
    height: 2.25rem;
    padding: 0 0.5rem;
    border: 1px solid var(--color-light-gray);
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.3s ease;
  }

  .luxury-size-selector:hover {
    border-color: var(--color-charcoal);
  }

  .luxury-size-selector.active {
    background-color: var(--color-charcoal);
    color: white;
    border-color: var(--color-charcoal);
  }

  /* Color Selectors */
  .luxury-color-selector {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    cursor: pointer;
    border: 1px solid var(--color-light-gray);
    transition: all 0.3s ease;
  }

  .color-dot {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background-color: var(--color-dot);
  }

  .luxury-color-selector.active {
    transform: scale(1.1);
    box-shadow: 0 0 0 2px white, 0 0 0 3px var(--color-gold);
  }

  /* Price Range Slider */
  .price-range {
    position: relative;
    padding: 0 10px;
    margin-top: 1.5rem;
  }

  .price-label {
    font-size: 0.95rem;
    color: var(--color-charcoal);
  }

  /* Custom Price Slider */
  .custom-price-slider {
    position: relative;
    height: 30px;
    width: 100%;
    margin-bottom: 10px;
    cursor: pointer;
  }

  .price-slider-base {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 0;
    right: 0;
    height: 3px;
    background-color: var(--color-light-gray);
    border-radius: 3px;
  }

  .price-slider-track {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 3px;
    background-color: var(--color-gold);
    border-radius: 3px;
  }

  .price-slider-thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    background-color: var(--color-gold);
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    cursor: grab;
    z-index: 3;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .price-slider-thumb:hover {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .price-slider-thumb:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  }

  /* Apply Button */
  .apply-filters-button {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: var(--color-gold);
    color: white;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .apply-filters-button:hover {
    background-color: #c29d2e;
  }

  /* Sort Container */
  .sort-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sort-label {
    font-size: 0.875rem;
    color: var(--color-gray);
  }

  .sort-select {
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 1px solid var(--color-light-gray);
    background-color: white;
    font-size: 0.875rem;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1rem;
    -webkit-appearance: none;
    appearance: none;
  }

  .fade-in {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.8s ease forwards;
  }

  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
