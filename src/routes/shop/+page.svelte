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

  function goToPage(newPage: number) {
    if (newPage < 1 || newPage > Math.ceil(data.totalCount / perPage)) return;
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
    document.body.style.overflow = 'hidden';
  }
  function handleCloseQuickView() {
    quickViewOpen = false;
    document.body.style.overflow = '';
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
    <div>
    {#if !data.products || data.products.length === 0}
      <div class="col-span-full text-center py-12">
        <p class="text-xl text-gray-500">No products found.</p>
      </div>
    {:else}
      <div class="products-grid">
        {#each data.products as product (product._id)}
          <div class="product-card-wrapper">
            <ProductCard {product} on:quickView={handleQuickView} />
          </div>
        {/each}
      </div>
      {#if Math.ceil(data.totalCount / perPage) > 1}
        <div class="pagination-bar mt-8 flex justify-center items-center gap-2">
          {#each Array(Math.ceil(data.totalCount / perPage)) as _, i}
            {#if i + 1 === page}
              <span class="pagination-page active">{i + 1}</span>
            {:else}
              <a class="pagination-page" href={`/shop?page=${i + 1}${perPage !== 10 ? `&perPage=${perPage}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${categories.length ? `&category=${categories.join(',')}` : ''}${sizes.length ? `&size=${sizes.join(',')}` : ''}${colors.length ? `&color=${colors.join(',')}` : ''}${minPrice != null ? `&minPrice=${minPrice}` : ''}${maxPrice != null ? `&maxPrice=${maxPrice}` : ''}${featured ? `&featured=true` : ''}`} rel="external">{i + 1}</a>
            {/if}
          {/each}
        </div>
      {/if}
    {/if}
    </div>
  </div>
</section>

{#if quickViewOpen && quickViewProduct}
  <QuickViewModal product={quickViewProduct} on:close={handleCloseQuickView} />
{/if}

<style>
  .products-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1.5rem;
  }
  @media (min-width: 640px) {
    .products-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .products-grid { grid-template-columns: repeat(3, 1fr); }
  }
  .pagination-bar {
    margin-top: 2rem;
  }
  .pagination-page {
    display: inline-block;
    min-width: 2.5rem;
    height: 2.5rem;
    line-height: 2.5rem;
    border-radius: 50%;
    background: #f5f5f5;
    color: #1a1a1a;
    font-weight: 500;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    transition: background 0.2s, color 0.2s;
    margin: 0 0.2rem;
  }
  .pagination-page.active, .pagination-page:disabled {
    background: var(--color-gold, #c7a033);
    color: #fff;
    cursor: default;
  }
</style>
