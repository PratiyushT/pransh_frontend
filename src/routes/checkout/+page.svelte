<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { cart } from '$lib/stores';
  import { getCartProductDetails } from '$lib/sanity/sanityData';
  import { formatPrice } from '$lib/utils/data';

  let productDetails: Record<string, any> = {};
  let isLoadingProducts = true;
  let loadError = false;
  let subtotal = 0;
  let shippingCost = 15.0;
  let total = 0;

  $: subtotal = $cart.reduce((sum, item) => {
    const details = productDetails[`${item.productId}___${item.variantId}`];
    if (!details) return sum;
    return sum + details.variant.price * item.quantity;
  }, 0);
  $: total = subtotal + (subtotal > 0 ? shippingCost : 0);

  async function fetchDetails() {
    isLoadingProducts = true;
    loadError = false;
    try {
      productDetails = await getCartProductDetails($cart);
    } catch (e) {
      loadError = true;
    } finally {
      isLoadingProducts = false;
    }
  }

  onMount(fetchDetails);
  $: if ($cart) fetchDetails();

  function goToShipping() {
    goto('/checkout/shipping');
  }
</script>

<section class="checkout-wrapper section">
  <h1 class="checkout-title">Checkout</h1>

  {#if isLoadingProducts}
    <div class="checkout-loading">Loading cart details…</div>
  {:else if loadError}
    <div class="checkout-error">Failed to load cart. Please try again.</div>
  {:else if $cart.length === 0}
    <div class="checkout-empty">Your cart is empty.</div>
  {:else}
    <div class="checkout-content">
      <div class="checkout-items">
        {#each $cart as item}
          {#key item.productId + '-' + item.variantId}
            {#if productDetails[`${item.productId}___${item.variantId}`]}
              <div class="checkout-item">
                <img class="checkout-item-img" src={productDetails[`${item.productId}___${item.variantId}`].variant.images?.[0] ?? '/images/no-image.png'} alt={productDetails[`${item.productId}___${item.variantId}`].product.name} />
                <div class="checkout-item-info">
                  <div class="checkout-item-title">{productDetails[`${item.productId}___${item.variantId}`].product.name}</div>
                  <div class="checkout-item-meta">
                    <span>Color: {productDetails[`${item.productId}___${item.variantId}`].variant.color?.name}</span>
                    <span>Size: {productDetails[`${item.productId}___${item.variantId}`].variant.size}</span>
                  </div>
                  <div class="checkout-item-price">{formatPrice(productDetails[`${item.productId}___${item.variantId}`].variant.price)}</div>
                  <div class="checkout-item-qty">Qty: {item.quantity}</div>
                </div>
              </div>
            {/if}
          {/key}
        {/each}
      </div>

      <div class="checkout-summary">
        <h2>Order Summary</h2>
        <div class="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>{subtotal > 0 ? formatPrice(shippingCost) : '-'}</span></div>
        <div class="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
        <button disabled={!$cart.length} class="summary-checkout-btn primary-btn" on:click={goToShipping}>Proceed to Shipping</button>
      </div>
    </div>
  {/if}
</section>

<style>
.checkout-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.checkout-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  letter-spacing: 0.02em;
  color: var(--color-gold, #ad974f);
}
.checkout-content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}
.checkout-items {
  flex: 2;
  min-width: 270px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.checkout-item {
  background: var(--color-white, #fff);
  border-radius: 12px;
  box-shadow: 0 1px 6px 0 #d9d7ca22;
  display: flex;
  align-items: flex-start;
  padding: 1rem 1rem 1rem 0.5rem;
  gap: 1rem;
}
.checkout-item-img {
  width: 82px;
  height: 82px;
  object-fit: cover;
  border-radius: 8px;
  background: #f5f4f0;
  border: 1px solid #eee7c1;
}
.checkout-item-info {
  flex: 1;
}
.checkout-item-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-charcoal, #23231a);
}
.checkout-item-meta {
  font-size: 0.97rem;
  color: var(--color-gray, #817c5c);
  margin: 0.15rem 0 0.5rem 0;
  display: flex;
  gap: 1.1rem;
}
.checkout-item-price {
  font-size: 1.11rem;
  font-weight: 600;
  color: var(--color-black, #1a1915);
  margin-bottom: 0.25rem;
}
.checkout-item-qty {
  font-size: 1rem;
  color: #a0965a;
}
.checkout-summary {
  flex: 1;
  min-width: 240px;
  background: var(--color-white, #fff);
  border-radius: 12px;
  padding: 1.5rem 1.25rem;
  box-shadow: 0 1px 6px 0 #d9d7ca22;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.02rem;
  margin-bottom: 0.3rem;
}
.summary-row.total {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-gold, #ad974f);
}
.summary-checkout-btn.primary-btn {
  background: var(--color-gold, #ad974f);
  color: var(--color-white, #fff);
  padding: 0.85rem 0;
  width: 100%;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.15rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.22s;
}
.summary-checkout-btn.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.checkout-loading, .checkout-error, .checkout-empty {
  padding: 2.5rem 0;
  text-align: center;
  font-size: 1.13rem;
  color: var(--color-gold, #ad974f);
}
@media (max-width: 840px) {
  .checkout-content {
    flex-direction: column;
    gap: 2rem;
  }
  .checkout-summary {
    width: auto;
    min-width: unset;
  }
}
@media (max-width: 500px) {
  .checkout-title { font-size: 1.25rem; margin-bottom: 1.1rem; }
  .checkout-wrapper { padding: 1.1rem 0.1rem; }
  .checkout-item-img { width: 54px; height: 54px; }
  .checkout-item-title { font-size: 1rem; }
  .checkout-summary { padding: 1rem 0.7rem; }
}
</style>
