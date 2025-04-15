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
  let removingProduct = false;

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

  // Handle moving an item from wishlist to cart with enhanced animation
  const moveToCart = (product: Product, event: MouseEvent) => {
    // Add ripple effect to button
    const button = event.currentTarget as HTMLElement;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - (button.getBoundingClientRect().left + radius)}px`;
    circle.style.top = `${event.clientY - (button.getBoundingClientRect().top + radius)}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);

    // Add the first variant to cart
    addToCart(product, 0, 1);

    // Create a visual clone of the product card that moves to the cart icon
    const productCard = (event.currentTarget as HTMLElement).closest('.favorite-card');
    const cartIcon = document.querySelector('.cart-icon') as HTMLElement;

    if (productCard && cartIcon) {
      const clone = productCard.cloneNode(true) as HTMLElement;
      const productCardRect = productCard.getBoundingClientRect();
      const cartIconRect = cartIcon.getBoundingClientRect();

      // Style the clone
      clone.style.position = 'fixed';
      clone.style.top = `${productCardRect.top}px`;
      clone.style.left = `${productCardRect.left}px`;
      clone.style.width = `${productCardRect.width}px`;
      clone.style.height = `${productCardRect.height}px`;
      clone.style.zIndex = '1000';
      clone.style.pointerEvents = 'none';
      clone.style.transition = 'none';
      document.body.appendChild(clone);

      // Animate the clone to the cart
      gsap.to(clone, {
        duration: 0.6,
        x: cartIconRect.left - productCardRect.left + cartIconRect.width / 2 - productCardRect.width / 2,
        y: cartIconRect.top - productCardRect.top + cartIconRect.height / 2 - productCardRect.height / 2,
        scale: 0.1,
        opacity: 0,
        ease: "power3.in",
        onComplete: () => {
          clone.remove();

          // Animate cart icon
          gsap.fromTo(cartIcon,
            { scale: 1 },
            { scale: 1.3, duration: 0.3, yoyo: true, repeat: 1, ease: "elastic.out(1, 0.3)" }
          );

          // Remove from wishlist
          removeFromWishlist(product._id);
        }
      });
    } else {
      // Fallback if card or icon not found
      removeFromWishlist(product._id);
    }

    // Show animated confirmation toast
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

  // Handle removing an item from the wishlist with animation
  const handleRemoveItem = (productId: string, element: HTMLElement) => {
    if (removingProduct) return;
    removingProduct = true;

    gsap.to(element, {
      scale: 0.9,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        removeFromWishlist(productId);
        // Update the products array
        products = products.filter(p => p._id !== productId);
        removingProduct = false;
      }
    });
  };

  // Load data on component mount
  onMount(async () => {
    // Load wishlist products
    await fetchWishlistProducts();

    // Add page animations
    const favoriteItems = document.querySelectorAll('.favorite-card');
    const pageTitle = document.querySelector('.page-title');

    if (pageTitle) {
      gsap.from(pageTitle, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: "power2.out"
      });
    }

    gsap.from(favoriteItems, {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.2
    });

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
  <title>My Favorites | Pransh</title>
  <meta name="description" content="Your favorite items - Pransh luxury clothing with timeless elegance and exceptional quality.">
</svelte:head>

<div class="container mx-auto py-12 px-4">
  <h1 class="page-title text-3xl font-serif mb-8 text-center relative">
    <span class="relative inline-block">
      My Favorites
      <span class="absolute h-[2px] w-20 bg-gold left-1/2 -translate-x-1/2 bottom-[-12px]"></span>
    </span>
  </h1>

  {#if isLoading}
    <div class="text-center py-12">
      <div class="loading-spinner inline-block w-12 h-12 relative">
        <div class="absolute w-full h-full border-4 border-gold border-opacity-10 rounded-full"></div>
        <div class="absolute w-full h-full border-4 border-transparent border-t-gold rounded-full animate-spin"></div>
      </div>
      <p class="mt-4 text-gray-600">Loading your favorites...</p>
    </div>
  {:else if $wishlistCount > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each products as product}
        <div class="favorite-card bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md rounded-sm">
          <div class="relative aspect-[3/4] overflow-hidden mb-4 group">
            <img
              src={product.variants[0]?.images?.[0]?.url || '/images/product-placeholder.jpg'}
              alt={product.name}
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            >
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>

            <div class="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <button
                class="w-full py-2 bg-gold text-white hover:bg-gold-dark transition-colors duration-300 overflow-hidden relative"
                on:click={(e) => moveToCart(product, e)}
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
              class="text-gray-400 hover:text-red-500 transition-colors duration-300 transform hover:rotate-90"
              on:click={(e) => handleRemoveItem(product._id, e.currentTarget.closest('.favorite-card'))}
              aria-label="Remove from favorites"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>

    <div class="mt-12 flex justify-center">
      <a
        href="/category/all"
        class="group flex items-center text-gold hover:text-gold-dark transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Continue Shopping
      </a>
    </div>
  {:else}
    <div class="bg-white p-12 text-center max-w-2xl mx-auto shadow-sm rounded-sm">
      <div class="w-24 h-24 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h2 class="font-serif text-2xl mb-4 text-gold">Your favorites list is empty</h2>
      <p class="mb-8 text-gray">Discover and save your favorite luxury pieces for easy access later.</p>
      <a href="/category/all" class="btn bg-gold text-white px-6 py-3 inline-block font-medium hover:bg-gold-dark transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
        Start Exploring
      </a>
    </div>
  {/if}
</div>

<style>
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

  .ripple {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s linear;
    background-color: rgba(255, 255, 255, 0.7);
  }

  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  .favorite-card {
    transform: translateY(0);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .favorite-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.07);
  }

  .loading-spinner {
    animation: pulse 1.5s infinite ease-in-out;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      opacity: 0.7;
    }
    50% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0.95);
      opacity: 0.7;
    }
  }
</style>
