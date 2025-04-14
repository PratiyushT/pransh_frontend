<script lang="ts">
  import { onMount } from 'svelte';
  import { cart, cartTotal, removeFromCart, updateCartItemQuantity, clearCart } from '$lib/stores';
  import { formatPrice } from '$lib/utils/data';

  let shippingCost = 15.0;
  let subtotal = 0;
  let total = 0;

  // Calculate total and subtotal when cart changes
  $: {
    subtotal = $cartTotal;
    total = subtotal + (subtotal > 0 ? shippingCost : 0);
  }

  // Update quantity handler
  const handleQuantityChange = (productId: string, variantSku: string, quantity: number) => {
    if (quantity > 0 && quantity <= 99) {
      updateCartItemQuantity(productId, variantSku, quantity);
    }
  };

  // Remove item handler
  const handleRemoveItem = (productId: string, variantSku: string) => {
    removeFromCart(productId, variantSku);
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    // In a real app, this would navigate to the checkout page
    // or show a checkout modal
    // For demo, we'll just show an alert
    alert('Proceeding to checkout...');
  };
</script>

<svelte:head>
  <title>Cart | Pransh</title>
  <meta name="description" content="Your shopping cart - Pransh luxury clothing with timeless elegance and exceptional quality.">
</svelte:head>

<div class="container mx-auto py-12 px-4">
  <h1 class="text-3xl font-serif mb-8 text-center">Shopping Cart</h1>

  <div class="flex flex-col lg:flex-row gap-8">
    {#if $cart.length > 0}
      <div class="lg:w-2/3">
        <div class="bg-white p-6">
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
            <div class="grid md:grid-cols-12 gap-4 py-6 border-b items-center">
              <!-- Product -->
              <div class="md:col-span-6 flex items-center">
                <div class="w-20 h-20 bg-gray-light mr-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    class="w-full h-full object-cover"
                    on:error={(e) => e.currentTarget.src = '/images/product-placeholder.jpg'}
                  >
                </div>
                <div>
                  <h3 class="font-medium">{item.name}</h3>
                  <p class="text-sm text-gray">
                    Size: {item.size} | Color: {item.color.name}
                  </p>
                  <button
                    class="text-sm text-red-500 hover:underline mt-1 md:hidden"
                    on:click={() => handleRemoveItem(item.productId, item.variantSku)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <!-- Price -->
              <div class="md:col-span-2 text-center">
                <span>{formatPrice(item.price)}</span>
              </div>

              <!-- Quantity -->
              <div class="md:col-span-2 flex justify-center">
                <div class="border border-gray flex items-center">
                  <button
                    class="w-8 h-8 flex items-center justify-center hover:bg-gray-light"
                    on:click={() => handleQuantityChange(item.productId, item.variantSku, item.quantity - 1)}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    class="w-10 h-8 text-center border-x border-gray"
                    value={item.quantity}
                    on:change={(e) => handleQuantityChange(item.productId, item.variantSku, parseInt(e.currentTarget.value))}
                  >
                  <button
                    class="w-8 h-8 flex items-center justify-center hover:bg-gray-light"
                    on:click={() => handleQuantityChange(item.productId, item.variantSku, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Total -->
              <div class="md:col-span-2 text-right flex justify-between md:block">
                <div class="md:hidden font-medium">Total:</div>
                <div class="flex items-center justify-end">
                  <span class="mr-3">{formatPrice(item.price * item.quantity)}</span>
                  <button
                    class="hidden md:block text-gray hover:text-red-500"
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
              class="text-gray hover:text-primary transition-colors flex items-center"
              on:click={() => window.history.back()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Continue Shopping
            </button>

            <button
              class="text-gray hover:text-red-500 transition-colors flex items-center"
              on:click={() => clearCart()}
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
        <div class="bg-white p-6">
          <h2 class="font-serif text-2xl mb-6">Order Summary</h2>

          <div class="space-y-4 mb-8">
            <div class="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div class="flex justify-between">
              <span>Shipping</span>
              <span>{subtotal > 0 ? formatPrice(shippingCost) : 'N/A'}</span>
            </div>

            <div class="border-t border-gray-light pt-4 flex justify-between font-medium">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <button
            class="btn btn-primary w-full mb-4"
            on:click={proceedToCheckout}
            disabled={$cart.length === 0}
          >
            Proceed to Checkout
          </button>

          <p class="text-sm text-center text-gray">
            Taxes and discounts calculated at checkout
          </p>
        </div>
      </div>
    {:else}
      <div class="bg-white p-12 text-center max-w-2xl mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-6 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 class="font-serif text-2xl mb-4">Your cart is empty</h2>
        <p class="mb-8 text-gray">Looks like you haven't added any items to your cart yet.</p>
        <a href="/category/all" class="btn btn-primary">Start Shopping</a>
      </div>
    {/if}
  </div>
</div>

<style>
  .btn-primary {
    @apply bg-gold text-white px-6 py-3 inline-block font-medium hover:bg-gold-dark transition-colors;
  }
</style>
