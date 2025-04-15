<script lang="ts">
  import { onMount } from 'svelte';
  import { wishlist, wishlistCount, isInWishlist, removeFromWishlist, addToCart, clearCart, addToWishlist } from '$lib/stores';
  import { formatPrice, getProducts } from '$lib/utils/data';
  import type { Product } from '$lib/types';
  import gsap from 'gsap';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import QuickViewModal from '$lib/components/QuickViewModal.svelte';

  // Products data - we need to fetch complete products by their IDs
  let products: Product[] = [];
  let isLoading = true;
  let removingProduct = false;
  let showClearConfirm = false;
  let lastRemovedProduct: string | null = null;
  let addingAllToCart = false;
  let quickViewProduct = null;
  let quickViewOpen = false;

  // Handle quick view
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

  // Fetch product data for each product in wishlist
  const fetchWishlistProducts = async () => {
    isLoading = true;

    try {
      // Simulate API fetch delay for a smoother UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use the data utility function instead of accessing mockProductsData directly
      const allProducts: Product[] = getProducts();

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
    showToast('Added to cart', 'success');
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-8 right-8 p-4 rounded-md shadow-lg z-50 flex items-center ${
      type === 'success' ? 'bg-green-100 text-green-800' :
      type === 'error' ? 'bg-red-100 text-red-800' :
      'bg-blue-100 text-blue-800'
    }`;

    // Set icon based on type
    let icon = '';
    if (type === 'success') {
      icon = `<svg class="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>`;
    } else if (type === 'error') {
      icon = `<svg class="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>`;
    } else {
      icon = `<svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`;
    }

    toast.innerHTML = `${icon}<span>${message}</span>`;
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
    lastRemovedProduct = productId;

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

  // Clear all items from wishlist
  const clearWishlist = () => {
    if ($wishlistCount === 0) return;

    const favoriteItems = document.querySelectorAll('.favorite-card');

    gsap.to(favoriteItems, {
      scale: 0.9,
      opacity: 0,
      stagger: 0.05,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        wishlist.set([]);
        products = [];
        showClearConfirm = false;
        showToast('Wishlist cleared', 'info');
      }
    });
  };

  // Add all items to cart
  const addAllToCart = () => {
    if (addingAllToCart || $wishlistCount === 0) return;
    addingAllToCart = true;

    const cartIcon = document.querySelector('.cart-icon');

    if (cartIcon) {
      // Create small representative dots for each product
      const container = document.createElement('div');
      container.className = 'fixed inset-0 pointer-events-none z-50';
      document.body.appendChild(container);

      products.forEach((product, index) => {
        const card = document.querySelectorAll('.favorite-card')[index];
        if (!card) return;

        const cardRect = card.getBoundingClientRect();

        // Create dot
        const dot = document.createElement('div');
        dot.className = 'absolute w-4 h-4 bg-gold rounded-full';
        dot.style.top = `${cardRect.top + (cardRect.height / 2)}px`;
        dot.style.left = `${cardRect.left + (cardRect.width / 2)}px`;
        container.appendChild(dot);

        // Add to cart with a small delay between each
        setTimeout(() => {
          addToCart(product, 0, 1);
        }, index * 100);

        // Animate dot to cart
        const cartIconRect = cartIcon.getBoundingClientRect();
        gsap.to(dot, {
          x: cartIconRect.left - cardRect.left + (cartIconRect.width / 2) - 8, // 8 is half of dot size
          y: cartIconRect.top - cardRect.top + (cartIconRect.height / 2) - 8,
          delay: index * 0.1,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            dot.remove();
            if (index === products.length - 1) {
              // Last one, clear the container
              container.remove();

              // Clear wishlist after all animations complete
              wishlist.set([]);
              products = [];
              addingAllToCart = false;

              // Animate cart icon
              gsap.fromTo(cartIcon,
                { scale: 1 },
                { scale: 1.5, duration: 0.4, yoyo: true, repeat: 1, ease: "elastic.out(1, 0.3)" }
              );

              showToast('All items added to cart', 'success');
            }
          }
        });
      });
    } else {
      // Fallback if cart icon not found
      products.forEach(product => {
        addToCart(product, 0, 1);
      });
      wishlist.set([]);
      products = [];
      addingAllToCart = false;
      showToast('All items added to cart', 'success');
    }
  };

  // Restore last removed item
  const undoRemove = () => {
    if (lastRemovedProduct) {
      // Add back to wishlist
      addToWishlist(lastRemovedProduct);
      lastRemovedProduct = null;
      showToast('Item restored to wishlist', 'info');
    }
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
  <div class="flex flex-col md:flex-row justify-between items-center mb-8">
    <h1 class="page-title text-3xl font-serif text-center md:text-left relative">
      <span class="relative inline-block">
        My Favorites
        <span class="absolute h-[2px] w-16 bg-gold left-0 bottom-[-8px]"></span>
      </span>
    </h1>

    {#if $wishlistCount > 0}
      <div class="flex space-x-4 mt-4 md:mt-0">
        <button
          class="text-sm text-gray-600 hover:text-gold transition-colors duration-300 group flex items-center"
          on:click={() => showClearConfirm = true}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear All
        </button>
        <button
          class="text-sm text-gold hover:text-gold-dark transition-colors duration-300 group flex items-center"
          on:click={addAllToCart}
          disabled={addingAllToCart || $wishlistCount === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Add All to Cart
        </button>
      </div>
    {/if}
  </div>

  {#if isLoading}
    <div class="text-center py-12">
      <div class="loading-spinner inline-block w-12 h-12 relative">
        <div class="absolute w-full h-full border-4 border-gold border-opacity-10 rounded-full"></div>
        <div class="absolute w-full h-full border-4 border-transparent border-t-gold rounded-full animate-spin"></div>
      </div>
      <p class="mt-4 text-gray-600">Loading your favorites...</p>
    </div>
  {:else if $wishlistCount > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
      {#each products as product}
        <div class="product-card-wrapper">
          <ProductCard {product} on:quickview={handleQuickView} />
        </div>
      {/each}
    </div>

    <!-- QuickView Modal -->
    <QuickViewModal
      product={quickViewProduct}
      open={quickViewOpen}
      on:close={handleCloseQuickView}
    />

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
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h2 class="font-serif text-2xl mb-4 text-gold">Your favorites list is empty</h2>
      <p class="mb-8 text-gray-500">Discover and save your favorite luxury pieces for easy access later.</p>

      {#if lastRemovedProduct}
        <button
          class="text-gold hover:text-gold-dark underline mb-4 inline-block"
          on:click={undoRemove}
        >
          Undo last remove
        </button>
      {/if}

      <div>
        <a href="/category/all" class="btn bg-gold text-white px-6 py-3 inline-block font-medium hover:bg-gold-dark transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
          Start Exploring
        </a>
      </div>
    </div>
  {/if}
</div>

<!-- Confirmation modal for clear wishlist -->
{#if showClearConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-md p-6 max-w-sm w-full shadow-xl transform transition-all">
      <h3 class="text-xl font-medium mb-4">Clear Wishlist</h3>
      <p class="text-gray-500 mb-6">Are you sure you want to remove all items from your wishlist? This action cannot be undone.</p>
      <div class="flex justify-end space-x-4">
        <button
          class="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          on:click={() => showClearConfirm = false}
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors rounded"
          on:click={clearWishlist}
        >
          Clear All
        </button>
      </div>
    </div>
  </div>
{/if}

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

  .product-card-wrapper {
    height: 100%;
    transform: translateY(0);
    transition: transform 0.3s ease;
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

  /* Add line clamp utility for text truncation */
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Add gold color classes if they don't exist in the project */
  .bg-gold {
    background-color: #b8860b;
  }

  .text-gold {
    color: #b8860b;
  }

  .border-gold {
    border-color: #b8860b;
  }

  .hover\:bg-gold-dark:hover {
    background-color: #a67a09;
  }

  .hover\:text-gold-dark:hover {
    color: #a67a09;
  }
</style>
