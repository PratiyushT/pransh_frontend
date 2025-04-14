<script lang="ts">
  import { onMount } from 'svelte';
  import { wishlist, wishlistCount, isInWishlist, removeFromWishlist, addToCart } from '$lib/stores';
  import { formatPrice } from '$lib/utils/data';
  import type { Product } from '$lib/types';
  import gsap from 'gsap';
  import mockProductsData from '$lib/data/mockData.json';

  // Products data - we need to fetch complete products by their IDs
  let products: Product[] = [];
  let isLoading = true;

  // Fetch product data for each product in wishlist
  const fetchWishlistProducts = async () => {
    isLoading = true;

    try {
      // Simulate API fetch delay for a smoother UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use the mock data from the project instead of fetching from API
      const allProducts: Product[] = mockProductsData.products;

      // Filter only products that are in the wishlist
      products = allProducts.filter(p => $wishlist.includes(p._id));

    } catch (error) {
      console.error('Error fetching wishlist products:', error);
      // If fetch fails, we'll just use empty array
      products = [];
    } finally {
      isLoading = false;
    }
  };

  // Handle moving an item from wishlist to cart
  const moveToCart = (product: Product) => {
    addToCart(product, 0, 1); // Add the first variant to cart
    removeFromWishlist(product._id);

    // Show animated confirmation
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 right-8 bg-green-100 text-green-800 p-4 rounded-md shadow-lg z-50 flex items-center';
    toast.innerHTML = `
      <svg class="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Added to cart</span>
    `;

    document.body.appendChild(toast);

    gsap.fromTo(toast,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );

    setTimeout(() => {
      gsap.to(toast, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }
      });
    }, 2000);
  };

  // Handle removing an item from the wishlist
  const handleRemoveItem = (productId: string) => {
    removeFromWishlist(productId);
    // Update the products array
    products = products.filter(p => p._id !== productId);
  };

  // Load data on component mount
  onMount(async () => {
    // Load wishlist products
    await fetchWishlistProducts();

    // Subscribe to wishlist changes
    const unsubscribe = wishlist.subscribe(async ids => {
      if (ids.length !== products.length) {
        // Only refetch if the count of items changed
        await fetchWishlistProducts();
      }
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  <title>My Wishlist | Pransh</title>
  <meta name="description" content="Your saved wishlist items - Pransh luxury clothing with timeless elegance and exceptional quality.">
</svelte:head>

<div class="container mx-auto py-12 px-4">
  <h1 class="text-3xl font-serif mb-8 text-center">My Wishlist</h1>

  {#if isLoading}
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
      <p class="mt-4 text-gray-600">Loading your wishlist...</p>
    </div>
  {:else if $wishlistCount > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each products as product}
        <div class="bg-white p-4 shadow-sm transition-transform hover:shadow-md hover:-translate-y-1 duration-300">
          <div class="relative aspect-[3/4] overflow-hidden mb-4 group">
            <img
              src={product.variants[0]?.images?.[0]?.url || '/images/product-placeholder.jpg'}
              alt={product.name}
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            >
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>

            <div class="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                class="w-full py-2 bg-gold text-white hover:bg-gold-dark transition-colors duration-300"
                on:click={() => moveToCart(product)}
              >
                Add to Cart
              </button>
            </div>
          </div>

          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium text-lg mb-1">{product.name}</h3>
              <p class="text-gray-500 text-sm mb-2">{product.category}</p>
              <p class="font-medium text-gold">
                {formatPrice(product.variants[0]?.price || 0)}
              </p>
            </div>

            <button
              class="text-gray-400 hover:text-red-500 transition-colors"
              on:click={() => handleRemoveItem(product._id)}
              aria-label="Remove from wishlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>

    <div class="mt-8 flex justify-center">
      <a
        href="/category/all"
        class="flex items-center text-gold hover:text-gold-dark transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Continue Shopping
      </a>
    </div>
  {:else}
    <div class="bg-white p-12 text-center max-w-2xl mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-6 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <h2 class="font-serif text-2xl mb-4">Your wishlist is empty</h2>
      <p class="mb-8 text-gray">Looks like you haven't added any items to your wishlist yet.</p>
      <a href="/category/all" class="btn btn-primary">Start Shopping</a>
    </div>
  {/if}
</div>

<style>
  .btn-primary {
    @apply bg-gold text-white px-6 py-3 inline-block font-medium hover:bg-gold-dark transition-colors;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
