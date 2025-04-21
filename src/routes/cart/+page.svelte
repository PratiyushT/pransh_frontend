<script lang="ts">
  export const ssr = false;

  import { onMount } from "svelte";
  import {
    cart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    savedCart,
    savedCartCount,
    restoreSavedCart,
  } from "$lib/stores";
  import { formatPrice } from "$lib/utils/data";
  import gsap from "gsap";
  import { getCartProductDetails } from "$lib/sanity/sanityData";
  import ColorPieChart from "$lib/components/ColorPieChart.svelte";

  let shippingCost = 15.0;
  let subtotal = 0;
  let total = 0;
  let isRemoving = false;
  let cartElement: HTMLElement;
  let productDetails: Record<string, any> = {};
  let isLoadingProducts = true;
  let loadError = false;
  let hasSavedItems = false;
  let isMergingCart = false;

  // Calculate subtotal from up-to-date Sanity data
  $: subtotal = $cart.reduce((sum, item) => {
    const details = productDetails[`${item.productId}___${item.variantId}`];
    if (!details) return sum;
    return sum + details.variant.price * item.quantity;
  }, 0);

  $: total = subtotal + (subtotal > 0 ? shippingCost : 0);

  // Improved function to fetch product data from Sanity
  async function loadProductDetails() {
    isLoadingProducts = true;
    loadError = false;

    try {
      productDetails = await getCartProductDetails($cart);
    } catch (e) {
      console.error(e);
      loadError = true;
    } finally {
      isLoadingProducts = false;
    }
  }

  // Update quantity handler with animation
  const handleQuantityChange = (
    productId: string,
    variantId: string,
    quantity: number
  ) => {
    if (quantity > 0 && quantity <= 99) {
      const oldQuantity =
        $cart.find(
          (item) => item.productId === productId && item.variantId === variantId
        )?.quantity || 0;

      // Update the store
      updateCartItemQuantity(productId, variantId, quantity);

      // Animate the price if quantity changed
      if (oldQuantity !== quantity) {
        const priceElement = document.getElementById(
          `price-${productId}-${variantId}`
        );
        if (priceElement) {
          gsap.fromTo(
            priceElement,
            { scale: 1, color: "var(--color-gold)" },
            {
              scale: 1.1,
              duration: 0.2,
              yoyo: true,
              repeat: 1,
              onComplete: () => {
                gsap.to(priceElement, {
                  color: "var(--color-charcoal)",
                  duration: 0.3,
                });
              },
            }
          );
        }
      }
    }
  };

  // Remove item handler with animation
  const handleRemoveItem = (productId: string, variantId: string) => {
    if (isRemoving) return;
    isRemoving = true;

    // Ensure we're using the correct unique ID for the cart item
    const itemId = `cart-item-${productId}-${variantId}`;
    const itemElement = document.getElementById(itemId);

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
          removeFromCart(productId, variantId);
          isRemoving = false;
        },
      });
    } else {
      removeFromCart(productId, variantId);
      isRemoving = false;
    }
  };

  // Clear cart with animation
  const handleClearCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      const cartItems = document.querySelectorAll(".cart-item");

      gsap.to(cartItems, {
        opacity: 0,
        y: -10,
        stagger: 0.05,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          clearCart();
        },
      });
    }
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    // Navigate to the checkout page
    const checkoutBtn = document.querySelector(".checkout-btn");

    if (checkoutBtn) {
      gsap.to(checkoutBtn, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          window.location.href = "/checkout";
        },
      });
    } else {
      window.location.href = "/checkout";
    }
  };

  // Handler to restore saved cart
  function handleRestoreSavedCart() {
    isMergingCart = true;
    restoreSavedCart();
    setTimeout(() => {
      isMergingCart = false;
    }, 1000);
  }

  // Initialize data fetching when the component mounts
  onMount(() => {
    // Fetch data on mount if cart has items
    if ($cart.length > 0) {
      loadProductDetails();
    } else {
      isLoadingProducts = false;
    }

    // Add animations
    const cartItems = document.querySelectorAll(".cart-item");
    const summaryElement = document.querySelector(".order-summary");

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
        ease: "power2.out",
      });
    }
  });

  // Watch for cart changes and fetch data when needed
  $: {
    if ($cart.length > 0) {
      loadProductDetails();
    } else {
      // Clear product details and loading state when cart is empty
      productDetails = {};
      isLoadingProducts = false;
    }
  }

  // Watch for saved cart items to show restore notification
  $: hasSavedItems =
    $cart.length === 0 && $savedCartCount > 0 && Array.isArray($savedCart) && $savedCart.length > 0;
</script>

<svelte:head>
  <title>Cart | Pransh</title>
  <meta
    name="description"
    content="Your shopping cart - Pransh luxury clothing with timeless elegance and exceptional quality."
  />
</svelte:head>

<div class="cart-page py-20 px-6 sm:px-10 min-h-screen" bind:this={cartElement}>
  <div class="max-w-[1320px] mx-auto">
    <h1 class="text-3xl sm:text-4xl font-serif mb-16 text-center elegant-title">
      Shopping Cart
    </h1>

    {#if hasSavedItems}
      <div class="saved-cart-notification flex flex-col sm:flex-row items-center justify-center bg-gold-light border border-gold rounded-lg px-6 py-5 mb-10 shadow-lg gap-4 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-gold-dark flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1 text-center sm:text-left">
          <span class="text-gold-dark font-semibold text-lg">You have { $savedCartCount } saved item{ $savedCartCount === 1 ? '' : 's' } in your previous cart.</span>
          <span class="block text-gold-dark/80 text-sm mt-1">Would you like to restore your saved cart?</span>
        </div>
        <button
          class="btn btn-gold px-6 py-2 text-base font-medium rounded transition-colors duration-200 flex items-center gap-2"
          on:click={handleRestoreSavedCart}
          disabled={isMergingCart}
        >
          {isMergingCart
            ? (
              <>
                <span class="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                Restoring...
              </>
            )
            : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h7V3m0 0l-9 9 9 9m4-7h7v7m0 0l-9-9 9-9" /></svg>
                Restore Cart
              </>
            )
          }
        </button>
      </div>
    {/if}

    <div
      class="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-16 w-full px-2 sm:px-4 xl:px-0"
    >
      {#if $cart.length > 0}
        <div class="xl:col-span-2">
          <div
            class="bg-white p-6 sm:p-10 shadow-xl rounded-md transition-all duration-300 border border-gray-300"
          >
            <div class="hidden md:grid md:grid-cols-12 border-b pb-8 mb-10">
              <div class="md:col-span-6">
                <span class="font-medium text-gray-600 text-lg">Product</span>
              </div>
              <div class="md:col-span-2 text-center">
                <span class="font-medium text-gray-600 text-lg">Price</span>
              </div>
              <div class="md:col-span-2 text-center">
                <span class="font-medium text-gray-600 text-lg">Quantity</span>
              </div>
              <div class="md:col-span-2 text-right">
                <span class="font-medium text-gray-600 text-lg">Total</span>
              </div>
            </div>

            {#if isLoadingProducts}
              <div class="text-center py-20">
                <div
                  class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent mb-4"
                ></div>
                <p>Loading cart products...</p>
              </div>
            {:else if loadError}
              <div class="text-center text-red-500 py-20">
                <p>Failed to load products. Please try again later.</p>
                <button
                  class="mt-4 px-4 py-2 bg-gold text-white rounded hover:bg-gold-dark transition-colors"
                  on:click={loadProductDetails}
                >
                  Retry
                </button>
              </div>
            {:else if Object.keys(productDetails).length === 0 && $cart.length > 0}
              <div class="text-center text-amber-600 py-20">
                <p>
                  No matching products found in database. Some items in your
                  cart may be unavailable.
                </p>
                <button
                  class="mt-4 px-4 py-2 bg-gold text-white rounded hover:bg-gold-dark transition-colors"
                  on:click={loadProductDetails}
                >
                  Refresh
                </button>
              </div>
            {:else}
              {#each $cart as item, i}
                {@const productKey = `${item.productId}___${item.variantId}`}
                {#if productDetails[productKey]}
                  <div
                    id={`cart-item-${item.productId}-${item.variantId}`}
                    class="cart-item grid md:grid-cols-12 gap-8 py-10 border-b items-center hover:bg-gray-100 transition-colors duration-300 {i !==
                    0
                      ? 'mt-6'
                      : ''}"
                  >
                    <!-- Product -->
                    <div class="md:col-span-6 flex items-center space-x-8">
                      <div
                        class="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 mr-2 overflow-hidden rounded-md shadow-md relative group"
                      >
                        <img
                        src={(productDetails[productKey].variant.images &&
    productDetails[productKey].variant.images[0]) ||
                            "/images/product-placeholder.jpg"}
                          alt={productDetails[productKey].product.name}
                          class="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                          on:error={(e) =>
                            (e.currentTarget.src =
                              "/images/product-placeholder.jpg")}
                        />
                        <div
                          class="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                        ></div>
                      </div>
                      <div class="ml-2">
                        <h3 class="font-medium text-gray-700 text-lg mb-3">
                          {productDetails[productKey].product.name}
                        </h3>
                        <p class="text-sm text-gray-600 mt-3 mb-4">
                          Size: <span class="text-gold font-medium"
                            >{productDetails[productKey].variant.size ||
                              "N/A"}</span
                          >
                          | Color:
                          <span
                            class="flex items-center gap-2 inline-flex ml-1"
                          >
                            {#if productDetails[productKey].variant.color?.hex && Array.isArray(productDetails[productKey].variant.color.hex) && productDetails[productKey].variant.color.hex.length > 1}
                              <ColorPieChart
                                hexColors={productDetails[productKey].variant.color.hex}
                                size={16}
                                border={true}
                                borderWidth={1}
                              />
                            {:else}
                              <span
                                class="inline-block w-4 h-4 rounded-full border border-gray-300"
                                style={`background-color: ${Array.isArray(productDetails[productKey].variant.color?.hex)
                                  ? productDetails[productKey].variant.color.hex[0]
                                  : productDetails[productKey].variant.color?.hex || "#888888"};`}
                              ></span>
                            {/if}
                            <span class="text-gray-600"
                              >{productDetails[productKey].variant.color
                                ?.name || "N/A"}</span
                            >
                          </span>
                        </p>
                        <button
                          class="text-sm text-red-500 hover:text-red-500 hover:underline mt-3 md:hidden flex items-center transition-colors duration-300"
                          on:click={() =>
                            handleRemoveItem(item.productId, item.variantId)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3 w-3 mr-2"
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
                          Remove
                        </button>
                      </div>
                    </div>

                    <!-- Price -->
                    <div class="md:col-span-2 text-center">
                      <span class="text-gold font-medium text-lg"
                        >{formatPrice(
                          productDetails[productKey].variant.price
                        )}</span
                      >
                    </div>

                    <!-- Quantity -->
                    <div class="md:col-span-2 flex justify-center">
                      <div
                        class="quantity-control border border-gold rounded-md flex items-center overflow-hidden shadow-sm"
                      >
                        <button
                          class="w-10 h-10 flex items-center justify-center hover:bg-gold hover:text-white transition-colors duration-300"
                          on:click={() =>
                            handleQuantityChange(
                              item.productId,
                              item.variantId,
                              item.quantity - 1
                            )}
                          aria-label="Decrease quantity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M20 12H4"
                            />
                          </svg>
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          class="w-12 h-10 text-center border-x border-gold bg-white focus:outline-none"
                          value={item.quantity}
                          on:change={(e) =>
                            handleQuantityChange(
                              item.productId,
                              item.variantId,
                              parseInt(e.currentTarget.value)
                            )}
                        />
                        <button
                          class="w-10 h-10 flex items-center justify-center hover:bg-gold hover:text-white transition-colors duration-300"
                          on:click={() =>
                            handleQuantityChange(
                              item.productId,
                              item.variantId,
                              item.quantity + 1
                            )}
                          aria-label="Increase quantity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Total -->
                    <div
                      class="md:col-span-2 text-right flex justify-between md:block"
                    >
                      <div class="md:hidden font-medium text-gray-600">
                        Total:
                      </div>
                      <div class="flex items-center justify-end">
                        <span
                          id={`price-${item.productId}-${item.variantId}`}
                          class="mr-4 font-medium text-lg"
                          >{formatPrice(
                            productDetails[productKey].variant.price *
                              item.quantity
                          )}</span
                        >
                        <button
                          class="hidden md:block text-gray-500 hover:text-red-500 transition-colors duration-300"
                          on:click={() =>
                            handleRemoveItem(item.productId, item.variantId)}
                          aria-label="Remove {productDetails[productKey].product
                            .name} from cart"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-6 w-6"
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
                {:else}
                  <div
                    class="cart-item py-10 text-center text-amber-500 border-b"
                  >
                    <p>Product information unavailable</p>
                    <button
                      class="mt-2 text-sm text-red-500 hover:underline"
                      on:click={() =>
                        handleRemoveItem(item.productId, item.variantId)}
                    >
                      Remove from cart
                    </button>
                  </div>
                {/if}
              {/each}
            {/if}

            <div
              class="mt-16 flex flex-col sm:flex-row justify-between items-center"
            >
              <button
                class="text-gray-600 hover:text-gold transition-colors flex items-center group mb-6 sm:mb-0 text-lg"
                on:click={() => window.history.back()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-3 transform group-hover:-translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Continue Shopping
              </button>

              <button
                class="text-gray-600 hover:text-red-500 transition-colors flex items-center group text-lg"
                on:click={handleClearCart}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear Cart
              </button>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="w-full mt-0 xl:mt-0 relative z-10">
          <div
            class="order-summary bg-white p-6 sm:p-10 shadow-xl rounded-md transition-all duration-300 border border-gray-300 sticky top-24 w-full sm:w-auto"
          >
            <h2
              class="font-serif text-2xl sm:text-3xl mb-10 text-gold text-center"
            >
              Order Summary
            </h2>

            <div class="space-y-8 mb-10">
              <div
                class="flex justify-between items-center py-4 border-b border-gray-300"
              >
                <span class="text-gray-600 text-lg">Subtotal</span>
                <span class="font-medium text-gray-700 text-lg"
                  >{formatPrice(subtotal)}</span
                >
              </div>

              <div
                class="flex justify-between items-center py-4 border-b border-gray-300"
              >
                <span class="text-gray-600 text-lg">Shipping</span>
                <span class="text-gray-700 text-lg"
                  >{subtotal > 0 ? formatPrice(shippingCost) : "N/A"}</span
                >
              </div>

              <div class="pt-4 flex justify-between items-center">
                <span class="text-xl font-serif text-gray-700">Total</span>
                <span class="text-2xl text-gold font-medium"
                  >{formatPrice(total)}</span
                >
              </div>
            </div>

            <button
              class="checkout-btn btn btn-primary w-full mb-8 transform transition-transform hover:translate-y-[-2px] shadow-md text-lg py-4"
              on:click={proceedToCheckout}
              disabled={$cart.length === 0 || isLoadingProducts}
            >
              {isLoadingProducts ? "Loading..." : "Proceed to Checkout"}
            </button>

            <div class="text-center">
              <p class="text-sm text-gray-500 italic mb-6">
                Taxes and discounts calculated at checkout
              </p>

              <div class="flex justify-center space-x-4 mt-8">
                <img
                  src="https://same-assets.com/payment-visa.svg"
                  alt="Visa"
                  class="h-8 opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
                <img
                  src="https://same-assets.com/payment-mastercard.svg"
                  alt="Mastercard"
                  class="h-8 opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
                <img
                  src="https://same-assets.com/payment-amex.svg"
                  alt="American Express"
                  class="h-8 opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div
          class="bg-white p-16 sm:p-20 text-center max-w-2xl mx-auto shadow-xl rounded-md border border-gray-300 xl:col-span-3"
        >
          <div class="flex justify-center mb-16">
            <div
              class="h-36 w-36 text-gray-500 bg-gray-100 rounded-full flex items-center justify-center shadow-inner"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-20 w-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <h2 class="font-serif text-3xl sm:text-4xl mb-8 text-gold">
            Your cart is empty
          </h2>
          <p class="mb-16 text-gray-600 max-w-md mx-auto text-lg">
            Looks like you haven't added any items to your cart yet. Discover
            our collection of luxury products.
          </p>
          <a
            href="/shop"
            class="btn btn-gold rounded-md inline-flex items-center py-3 px-6 text-white font-medium shadow-md text-base whitespace-nowrap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Start Shopping
          </a>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .cart-page {
    background-color: var(--color-cream);
  }

  .btn-gold {
    display: inline-block;
    background-color: var(--color-gold);
    color: white;
    font-weight: 500;
    transition: all 0.3s ease;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
  }

  .btn-gold:hover {
    background-color: var(--color-gold-dark);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
    transform: translateY(-2px);
  }

  .btn-primary {
    display: inline-block;
    background-color: var(--color-gold);
    color: white;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border-radius: 0.25rem;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
  }

  .btn-primary:hover {
    background-color: var(--color-gold-dark);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
  }

  .btn-primary:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none;
  }

  .elegant-title {
    position: relative;
    display: inline-block;
    letter-spacing: 2px;
    font-weight: 500;
    color: var(--color-charcoal);
  }

  .elegant-title::after {
    content: "";
    position: absolute;
    width: 100px;
    height: 2px;
    background-color: var(--color-gold);
    bottom: -16px;
    left: 50%;
    transform: translateX(-50%);
  }

  .quantity-control button:active {
    transform: scale(0.95);
  }

  /* Hide number input arrows in Safari, Chrome, Edge, Opera */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Hide number input arrows in Firefox */
  input[type="number"] {
    -moz-appearance: textfield;
  }

  .cart-item {
    position: relative;
    overflow: hidden;
  }

  .cart-item::before {
    content: "";
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

  /* Fix for Order Summary visibility and alignment */
  .order-summary {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 10 !important;
    height: fit-content;
  }

  /* Ensure consistent card styling */
  .cart-page .bg-white {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
  }

  /* Saved cart notification styles */
  .saved-cart-notification {
    animation: fadeInDown 0.5s cubic-bezier(0.4,0,0.2,1);
  }
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-24px);}
    to { opacity: 1; transform: translateY(0);}
  }

  .bg-gold-light {
    background: rgba(255, 245, 217, 0.85);
  }
  .text-gold-dark {
    color: #bfa043;
  }

  @media (max-width: 639px) {
    .elegant-title::after {
      width: 80px;
      bottom: -12px;
    }
    .saved-cart-notification {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
      gap: 0.5rem;
    }
    .saved-cart-notification button {
      width: 100%;
      justify-content: center;
    }
  }
</style>
