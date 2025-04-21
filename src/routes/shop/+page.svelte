<script lang="ts">
  import ProductCard from '$lib/components/ProductCard.svelte';
  import type { Product } from '$lib/types';
  import { goto } from '$app/navigation';
  import QuickViewModal from '$lib/components/QuickViewModal.svelte';

  export let data: {
    products: Product[];
    totalCount: number;
    filters: {
      page: number;
      perPage: number;
      search: string;
      categories: string[];
      sizes: string[];
      colors: string[];
      minPrice: number|null;
      maxPrice: number|null;
      featured: boolean;
    }
  };

  // Destructure all relevant filters from data
  let { page, perPage, search, categories, sizes, colors, minPrice, maxPrice, featured } = data.filters;

  let quickViewProduct = null;
  let quickViewOpen = false;

  // Calculate pagination values in the script
  $: totalPages = Math.ceil(data.totalCount / perPage);
  $: maxDisplayedPages = 5; // Max page numbers to show at once
  $: halfMaxPages = Math.floor(maxDisplayedPages / 2);
  $: startPage = Math.max(1, Math.min(page - halfMaxPages, totalPages - maxDisplayedPages + 1));
  $: endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);
  $: startItem = (page - 1) * perPage + 1;
  $: endItem = Math.min(page * perPage, data.totalCount);

  function goToPage(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    page = newPage;
    applyFilters();
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (page > 1)            params.set('page', String(page));
    if (perPage !== 10)      params.set('perPage', String(perPage));
    if (search)              params.set('search',  search);
    if (categories.length)   params.set('category', categories.join(','));
    if (sizes.length)        params.set('size',     sizes.join(','));
    if (colors.length)       params.set('color',    colors.join(','));
    if (minPrice != null)    params.set('minPrice', String(minPrice));
    if (maxPrice != null)    params.set('maxPrice', String(maxPrice));
    if (featured)            params.set('featured','true');
    const qs = params.toString();
    goto(qs ? `/shop?${qs}` : '/shop');
  }

  function handleQuickView(event) {
    quickViewProduct = event.detail.product;
    quickViewOpen = true;
    document.body.style.overflow = 'hidden'; // Ensure body doesn't scroll when modal is open
  }
  function handleCloseQuickView() {
    quickViewOpen = false;
    document.body.style.overflow = ''; // Restore normal scrolling when modal is closed
  }
</script>

<section class="section shop-section">
  <div class="container">
    <div class="section-title mb-12">
      <h1 class="hero-title fade-in">Shop</h1>
      <p class="section-subtitle fade-in">
        Discover our exquisite collection, crafted with premium materials.
      </p>
      <div class="hero-line"></div>
    </div>
    {#if !data.products || data.products.length === 0}
      <div class="col-span-full text-center py-12">
        <p class="text-xl text-gray-500">No products found.</p>
      </div>
    {:else}
      <div class="product-count-indicator">
        Showing {startItem}-{endItem} of {data.totalCount} products
      </div>
      <div class="products-grid">
        {#each data.products as product (product._id)}
          <ProductCard {product} on:quickView={handleQuickView} />
        {/each}
      </div>
      {#if totalPages > 1}
        <nav class="pagination-bar mt-8" aria-label="Pagination">
          <div class="pagination-controls">
            {#if page > 1}
              <a
                class="pagination-btn prev"
                href={`/shop?page=${page - 1}${perPage !== 10 ? `&perPage=${perPage}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${categories.length ? `&category=${categories.join(',')}` : ''}${sizes.length ? `&size=${sizes.join(',')}` : ''}${colors.length ? `&color=${colors.join(',')}` : ''}${minPrice != null ? `&minPrice=${minPrice}` : ''}${maxPrice != null ? `&maxPrice=${maxPrice}` : ''}${featured ? `&featured=true` : ''}`}
                aria-label="Go to previous page"
                rel="external"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </a>
            {:else}
              <span class="pagination-btn prev disabled" aria-disabled="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </span>
            {/if}

            {#if startPage > 1}
              <a
                class="pagination-page"
                href={`/shop?page=1${perPage !== 10 ? `&perPage=${perPage}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${categories.length ? `&category=${categories.join(',')}` : ''}${sizes.length ? `&size=${sizes.join(',')}` : ''}${colors.length ? `&color=${colors.join(',')}` : ''}${minPrice != null ? `&minPrice=${minPrice}` : ''}${maxPrice != null ? `&maxPrice=${maxPrice}` : ''}${featured ? `&featured=true` : ''}`}
                rel="external"
              >
                1
              </a>
              {#if startPage > 2}
                <span class="pagination-ellipsis">…</span>
              {/if}
            {/if}

            {#each Array(endPage - startPage + 1) as _, i}
              {#if startPage + i === page}
                <span class="pagination-page active">{startPage + i}</span>
              {:else}
                <a
                  class="pagination-page"
                  href={`/shop?page=${startPage + i}${perPage !== 10 ? `&perPage=${perPage}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${categories.length ? `&category=${categories.join(',')}` : ''}${sizes.length ? `&size=${sizes.join(',')}` : ''}${colors.length ? `&color=${colors.join(',')}` : ''}${minPrice != null ? `&minPrice=${minPrice}` : ''}${maxPrice != null ? `&maxPrice=${maxPrice}` : ''}${featured ? `&featured=true` : ''}`}
                  rel="external"
                >
                  {startPage + i}
                </a>
              {/if}
            {/each}

            {#if endPage < totalPages}
              {#if endPage < totalPages - 1}
                <span class="pagination-ellipsis">…</span>
              {/if}
              <a
                class="pagination-page"
                href={`/shop?page=${totalPages}${perPage !== 10 ? `&perPage=${perPage}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${categories.length ? `&category=${categories.join(',')}` : ''}${sizes.length ? `&size=${sizes.join(',')}` : ''}${colors.length ? `&color=${colors.join(',')}` : ''}${minPrice != null ? `&minPrice=${minPrice}` : ''}${maxPrice != null ? `&maxPrice=${maxPrice}` : ''}${featured ? `&featured=true` : ''}`}
                rel="external"
              >
                {totalPages}
              </a>
            {/if}

            {#if page < totalPages}
              <a
                class="pagination-btn next"
                href={`/shop?page=${page + 1}${perPage !== 10 ? `&perPage=${perPage}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${categories.length ? `&category=${categories.join(',')}` : ''}${sizes.length ? `&size=${sizes.join(',')}` : ''}${colors.length ? `&color=${colors.join(',')}` : ''}${minPrice != null ? `&minPrice=${minPrice}` : ''}${maxPrice != null ? `&maxPrice=${maxPrice}` : ''}${featured ? `&featured=true` : ''}`}
                aria-label="Go to next page"
                rel="external"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </a>
            {:else}
              <span class="pagination-btn next disabled" aria-disabled="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            {/if}
          </div>
        </nav>
      {/if}
    {/if}
  </div>
</section>

{#if quickViewOpen && quickViewProduct}
  <QuickViewModal product={quickViewProduct} open={quickViewOpen} on:close={handleCloseQuickView} />
{/if}

<style>
  .products-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-top: 1.5rem;
    width: 100%;
  }

  .product-count-indicator {
    font-size: 0.95rem;
    color: var(--color-charcoal-light);
    padding: 0.5rem 1rem;
    background-color: #f8f8f8;
    border-radius: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: inline-block;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 640px) {
    .products-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
  }
  @media (min-width: 1024px) {
    .products-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 2.5rem;
    }
  }

  .pagination-bar {
    margin-top: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pagination-page {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: #f8f8f8;
    color: var(--color-charcoal);
    font-weight: 500;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    text-decoration: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .pagination-page:hover {
    background: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
  }

  .pagination-page.active {
    background: var(--color-gold);
    color: #fff;
    cursor: default;
    box-shadow: 0 3px 8px rgba(199, 160, 51, 0.3);
  }

  .pagination-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: #f8f8f8;
    color: var(--color-charcoal);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .pagination-btn:hover {
    background: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
  }

  .pagination-btn.prev:hover {
    transform: translateY(-2px) translateX(-2px);
  }

  .pagination-btn.next:hover {
    transform: translateY(-2px) translateX(2px);
  }

  .pagination-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .pagination-ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    color: var(--color-charcoal-light);
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .products-grid {
      grid-template-columns: 1fr;
      gap: 1.2rem;
    }
    .pagination-page, .pagination-btn {
      min-width: 2.2rem;
      height: 2.2rem;
      font-size: 0.9rem;
    }

    .pagination-info {
      font-size: 0.8rem;
    }

    .pagination-top {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  }
</style>
