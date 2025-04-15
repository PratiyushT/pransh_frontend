<script lang="ts">
  import { onMount } from 'svelte';
  import { cart, cartTotal, removeFromCart, updateCartItemQuantity, clearCart } from '$lib/stores';
  import { formatPrice } from '$lib/utils/data';
  import gsap from 'gsap';

  let shippingCost = 15.0;
  let subtotal = 0;
  let total = 0;
  let isRemoving = false;
  let cartElement: HTMLElement;

  // Calculate total and subtotal when cart changes
  $: {
    subtotal = $cartTotal;
    total = subtotal + (subtotal > 0 ? shippingCost : 0);
  }

  // Update quantity handler with animation
  const handleQuantityChange = (productId: string, variantSku: string, quantity: number) => {
    if (quantity > 0 && quantity <= 99) {
      const oldQuantity = $cart.find(item => item.productId === productId && item.variantSku === variantSku)?.quantity || 0;

      // Update the store
      updateCartItemQuantity(productId, variantSku, quantity);

      // Animate the price if quantity changed
      if (oldQuantity !== quantity) {
        const priceElement = document.getElementById(`price-${productId}-${variantSku}`);
        if (priceElement) {
          gsap.fromTo(priceElement,
            { scale: 1, color: 'var(--color-gold)' },
            { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1,
              onComplete: () => {
                gsap.to(priceElement, { color: 'var(--color-charcoal)', duration: 0.3 });
              }
            }
          );
        }
      }
    }
  };

  // Remove item handler with animation
  const handleRemoveItem = (productId: string, variantSku: string) => {
    if (isRemoving) return;
    isRemoving = true;

    const itemElement = document.getElementById(`cart-item-${productId}-${variantSku}`);

    if (itemElement) {
      gsap.to(itemElement, {
        opacity: 0,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          removeFromCart(productId, variantSku);
          isRemoving = false;
        }
      });
    } else {
      removeFromCart(productId, variantSku);
      isRemoving = false;
    }
  };

  // Clear cart with animation
  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      const cartItems = document.querySelectorAll('.cart-item');

      gsap.to(cartItems, {
        opacity: 0,
        y: -10,
        stagger: 0.05,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          clearCart();
        }
      });
    }
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    // In a real app, this would navigate to the checkout page
    // or show a checkout modal
    const checkoutBtn = document.querySelector('.checkout-btn');

    if (checkoutBtn) {
      gsap.to(checkoutBtn, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          alert('Proceeding to checkout...');
        }
      });
    } else {
      alert('Proceeding to checkout...');
    }
  };

  // Add animations when the component mounts
  onMount(() => {
    // Animate cart elements when loaded
    const cartItems = document.querySelectorAll('.cart-item');
    const summaryElement = document.querySelector('.order-summary');

    gsap.from(cartItems, {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out",
    });

    if (summaryElement) {
      gsap.from(summaryElement, {
        opacity: 0,
        x: 20,
        duration: 0.8,
        delay: 0.3,
        ease: "power2.out"
      });
    }
  });
</script>

<svelte:head>
  <title>Cart | Pransh</title>
  <meta name="description" content="Your shopping cart - Pransh luxury clothing with timeless elegance and exceptional quality.">
</svelte:head>

<div class="container mx-auto py-12 px-4" bind:this={cartElement}>
  <h1 class="text-3xl font-serif mb-8 text-center elegant-title">Shopping Cart</h1>

  <div class="flex flex-col lg:flex-row gap-8">
    {#if $cart.length > 0}
      <div class="lg:w-2/3">
        <div class="bg-white p-6 shadow-sm rounded-sm transition-all duration-300">
          <div class="hidden md:grid md:grid-cols-12 border-b pb-4 mb-6">
            <div class="md:col-span-6">
              <span class="font-medium">Product</span>
            </div>
            <div class="md:col-span-2 text-center">
              <span class="font-medium">Price</span>
            </div>
            <div class="md:col-span-2 text-center">
              <span class="font-medium">Quantity</span>
            </div>
            <div class="md:col-span-2 text-right">
              <span class="font-medium">Total</span>
            </div>
          </div>

          {#each $cart as item}
            <div
              id={`cart-item-${item.productId}-${item.variantSku}`}
              class="cart-item grid md:grid-cols-12 gap-4 py-6 border-b items-center hover:bg-gray-50 transition-colors duration-300"
            >
              <!-- Product -->
              <div class="md:col-span-6 flex items-center">
                <div class="w-20 h-20 bg-gray-light mr-4 overflow-hidden rounded-sm shadow-sm">
                  <img
                    src={item.image}
                    alt={item.name}
                    class="w-full h-full object-cover transform transition-transform duration-500 hover:scale-105"
                    on:error={(e) => e.currentTarget.src = '/images/product-placeholder.jpg'}
                  >
                </div>
                <div>
                  <h3 class="font-medium">{item.name}</h3>
                  <p class="text-sm text-gray">
                    Size: <span class="text-gold">{item.size}</span> | Color:
                    <span class="flex items-center gap-1 inline-flex">
                      <span class="inline-block w-3 h-3 rounded-full" style={`background-color: ${item.color.hex};`}></span>
                      {item.color.name}
                    </span>
                  </p>
                  <button
                    class="text-sm text-red-500 hover:underline mt-1 md:hidden flex items-center"
                    on:click={() => handleRemoveItem(item.productId, item.variantSku)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>

              <!-- Price -->
              <div class="md:col-span-2 text-center">
                <span class="text-gold font-medium">{formatPrice(item.price)}</span>
              </div>

              <!-- Quantity -->
              <div class="md:col-span-2 flex justify-center">
                <div class="quantity-control border border-gold rounded-sm flex items-center overflow-hidden shadow-sm">
                  <button
                    class="w-8 h-8 flex items-center justify-center hover:bg-gold hover:text-white transition-colors duration-300"
                    on:click={() => handleQuantityChange(item.productId, item.variantSku, item.quantity - 1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    class="w-10 h-8 text-center border-x border-gold bg-white focus:outline-none"
                    value={item.quantity}
                    on:change={(e) => handleQuantityChange(item.productId, item.variantSku, parseInt(e.currentTarget.value))}
                  >
                  <button
                    class="w-8 h-8 flex items-center justify-center hover:bg-gold hover:text-white transition-colors duration-300"
                    on:click={() => handleQuantityChange(item.productId, item.variantSku, item.quantity + 1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Total -->
              <div class="md:col-span-2 text-right flex justify-between md:block">
                <div class="md:hidden font-medium">Total:</div>
                <div class="flex items-center justify-end">
                  <span id={`price-${item.productId}-${item.variantSku}`} class="mr-3 font-medium">{formatPrice(item.price * item.quantity)}</span>
                  <button
                    class="hidden md:block text-gray hover:text-red-500 transition-colors duration-300"
                    on:click={() => handleRemoveItem(item.productId, item.variantSku)}
                    aria-label="Remove {item.name} from cart"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          {/each}

          <div class="mt-6 flex justify-between">
            <button
              class="text-gray hover:text-gold transition-colors flex items-center group"
              on:click={() => window.history.back()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Continue Shopping
            </button>

            <button
              class="text-gray hover:text-red-500 transition-colors flex items-center group"
              on:click={handleClearCart}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="lg:w-1/3">
        <div class="order-summary bg-white p-6 shadow-sm rounded-sm transition-all duration-300 hover:shadow-md">
          <h2 class="font-serif text-2xl mb-6 text-gold">Order Summary</h2>

          <div class="space-y-4 mb-8">
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Subtotal</span>
              <span class="font-medium">{formatPrice(subtotal)}</span>
            </div>

            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Shipping</span>
              <span>{subtotal > 0 ? formatPrice(shippingCost) : 'N/A'}</span>
            </div>

            <div class="pt-4 flex justify-between font-medium">
              <span class="text-lg">Total</span>
              <span class="text-xl text-gold">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            class="checkout-btn btn btn-primary w-full mb-4 transform transition-transform hover:translate-y-[-2px]"
            on:click={proceedToCheckout}
            disabled={$cart.length === 0}
          >
            Proceed to Checkout
          </button>

          <p class="text-sm text-center text-gray italic">
            Taxes and discounts calculated at checkout
          </p>
        </div>
      </div>
    {:else}
      <div class="bg-white p-12 text-center max-w-2xl mx-auto shadow-sm rounded-sm">
        <div class="flex justify-center mb-6">
          <div class="h-20 w-20 text-gray bg-gray-50 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <h2 class="font-serif text-2xl mb-4 text-gold">Your cart is empty</h2>
        <p class="mb-8 text-gray">Looks like you haven't added any items to your cart yet.</p>
        <a href="/category/all" class="btn btn-primary transform transition-transform hover:translate-y-[-2px] inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Start Shopping
        </a>
      </div>
    {/if}
  </div>
</div>

<style>
  .btn-primary {
    display: inline-block;
    background-color: var(--color-gold);
    color: white;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border-radius: 0.125rem;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
  }

  .btn-primary:hover {
    background-color: var(--color-gold-dark);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
  }

  .elegant-title {
    position: relative;
    display: inline-block;
    letter-spacing: 1px;
  }

  .elegant-title::after {
    content: '';
    position: absolute;
    width: 60px;
    height: 2px;
    background-color: var(--color-gold);
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
  }

  .quantity-control button:active {
    transform: scale(0.95);
  }

  /* Hide number input arrows in Safari, Chrome, Edge, Opera */
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Hide number input arrows in Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }

  .cart-item {
    position: relative;
    overflow: hidden;
  }

  .cart-item::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 1px;
    background-color: var(--color-gold);
    transition: width 0.3s ease;
  }

  .cart-item:hover::before {
    width: 100%;
  }
</style>
