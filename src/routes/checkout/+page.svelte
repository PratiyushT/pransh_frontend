<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { cart, keepOnlyLastCartItem, savedCart, savedCartCount, restoreSavedCart } from '$lib/stores';
  import { getCartProductDetails } from '$lib/sanity/sanityData';
  import { formatPrice } from '$lib/utils/data';
  import AddressSearch from '$lib/components/AddressSearch.svelte';
  import { page } from '$app/stores';
  import { getStripePromise } from '$lib/payments/client';

  // DEBUG: Log environment variables to console
  console.log('Environment variables available:', import.meta.env);

  let productDetails: Record<string, any> = {};
  let isLoadingProducts = true;
  let loadError = false;
  let subtotal = 0;
  let shippingCost = 15.0;
  let total = 0;

  // Check if this is a direct checkout (Buy Now functionality)
  let isDirectCheckout = false;
  let directCheckoutItem = null;

  // Use the $page store to detect when direct checkout is active
  // and handle restoration when component is destroyed
  let isDirectCheckoutActive = false;

  // Form validation
  let formSubmitted = false;
  let errorMessage = '';
  let errorDetails = '';
  let checkoutError = false;

  // Stripe instance
  let stripeInstance: any = null;

  // Shipping form fields
  let shippingDetails = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States'
  };

  // Field interaction tracking
  let firstNameTouched = false;
  let lastNameTouched = false;
  let emailTouched = false;
  let phoneTouched = false;
  let addressLine1Touched = false;
  let cityTouched = false;
  let stateTouched = false;
  let postalCodeTouched = false;
  let countryTouched = false;

  // Address search state
  let showManualEntryForm = false;
  let addressSelected = false;
  let mapboxLoadError = false;
  let addressFromMapbox = false;

  // For storing the buy now product (if any)
  let buyNowProduct = null;

  // Compute the cart items to display
  $: displayedCart = $cart;

  // Watch for direct checkout param and track it
  $: {
    const url = $page.url || (typeof window !== 'undefined' && window.location ? new URL(window.location.href) : null);
    if (url) {
      const params = url.searchParams;
      isDirectCheckout = params.get('direct') === 'true';

      // Set active flag for restoration on destroy
      if (isDirectCheckout) {
        isDirectCheckoutActive = true;
      }

      // If this is a direct checkout, keep only the last item (most recently added)
      if (isDirectCheckout && $cart && $cart.length > 0) {
        buyNowProduct = $cart[$cart.length - 1];
        keepOnlyLastCartItem();
      }
    }
  }

  // Add an onDestroy hook to ensure cart restoration when component is unmounted
  onDestroy(() => {
    try {
      if (isDirectCheckoutActive && $savedCartCount > 0) {
        restoreSavedCart();

        if (buyNowProduct) {
          const found = $cart && $cart.find(
            (item) =>
              item.productId === buyNowProduct.productId &&
              item.variantId === buyNowProduct.variantId
          );
          if (!found) {
            cart.update((items) => [...items, buyNowProduct]);
          }
        }
      }
    } catch (error) {
      console.error('Error during component unmount cart restoration:', error);
    }
  });

  // Update subtotal and total
  $: subtotal = (displayedCart && Array.isArray(displayedCart))
    ? displayedCart.reduce((sum, item) => {
      const details = productDetails[`${item.productId}___${item.variantId}`];
      if (!details) {
        console.log(`No details for item: ${item.productId}___${item.variantId}`);
        return sum + 0;
      }
      return sum + details.variant.price * item.quantity;
    }, 0)
    : 0;
  $: total = subtotal + (subtotal > 0 ? shippingCost : 0);

  // Form validation
  $: isFirstNameValid = !firstNameTouched || shippingDetails.firstName.length > 1;
  $: isLastNameValid = !lastNameTouched || shippingDetails.lastName.length > 1;
  $: isEmailValid = !emailTouched || validateEmail(shippingDetails.email);
  $: isPhoneValid = !phoneTouched || shippingDetails.phone.length > 5;
  $: isAddressLine1Valid = !addressLine1Touched || shippingDetails.addressLine1.length > 3;
  $: isCityValid = !cityTouched || shippingDetails.city.length > 2;
  $: isStateValid = !stateTouched || shippingDetails.state.length > 1;
  $: isPostalCodeValid = !postalCodeTouched || shippingDetails.postalCode.length > 3;
  $: isCountryValid = !countryTouched || shippingDetails.country.length > 0;

  $: isFormValid =
    shippingDetails.firstName &&
    shippingDetails.lastName &&
    shippingDetails.email &&
    shippingDetails.phone &&
    shippingDetails.addressLine1 &&
    shippingDetails.city &&
    shippingDetails.state &&
    shippingDetails.postalCode &&
    isFirstNameValid &&
    isLastNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isAddressLine1Valid &&
    isCityValid &&
    isStateValid &&
    isPostalCodeValid &&
    isCountryValid;

  // Automatically restore saved cart on mount if not direct checkout
  onMount(async () => {
    try {
      // Initialize Stripe instance
      stripeInstance = await getStripePromise();
      if (!stripeInstance) {
        console.warn('Stripe.js failed to initialize on page load');
      }

      isLoadingProducts = true;

      if ($savedCartCount > 0 && !isDirectCheckout) {
        restoreSavedCart();
      }

      if ($cart && $cart.length > 0) {
        productDetails = await getCartProductDetails($cart);
      }

      isLoadingProducts = false;
    } catch (error) {
      console.error('Error loading product details:', error);
      loadError = true;
      isLoadingProducts = false;
    }
  });

  // We need to track the cart to avoid infinite refetching
  let previousCartJson = '';

  // Only update when cart actually changes
  $: {
    if ($cart && Array.isArray($cart)) {
      const currentCartJson = JSON.stringify($cart);

      if (currentCartJson !== previousCartJson) {
        previousCartJson = currentCartJson;

        displayedCart = [...$cart];

        if (!isLoadingProducts && displayedCart.length > 0) {
          const loadTimeout = setTimeout(() => {
            loadProductDetails();
          }, 300);

          onDestroy(() => {
            clearTimeout(loadTimeout);
          });
        }
      }
    }
  }

  async function loadProductDetails() {
    if (isLoadingProducts || !displayedCart || displayedCart.length === 0) {
      return;
    }

    isLoadingProducts = true;
    loadError = false;

    try {
      productDetails = await getCartProductDetails(displayedCart);
    } catch (error) {
      console.error('Error loading product details:', error);
      loadError = true;
    } finally {
      isLoadingProducts = false;
    }
  }

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // UPDATED FUNCTION: goToPayment
  async function goToPayment() {
    formSubmitted = true;
    checkoutError = false;

    // Mark all fields as touched for validation
    firstNameTouched = true;
    lastNameTouched = true;
    emailTouched = true;
    phoneTouched = true;
    addressLine1Touched = true;
    cityTouched = true;
    stateTouched = true;
    postalCodeTouched = true;
    countryTouched = true;

    if (!isFormValid) {
      errorMessage = 'Please fix the errors in the form';
      return;
    }

    if (!displayedCart || !displayedCart.length) {
      errorMessage = 'Your cart is empty';
      return;
    }

    try {
      isLoadingProducts = true;
      errorMessage = '';
      errorDetails = '';
      checkoutError = false;

      const items = displayedCart.map(item => {
        const details = productDetails[`${item.productId}___${item.variantId}`];
        if (!details) {
          throw new Error(`Product details not found for ${item.productId}___${item.variantId}`);
        }

        const formattedName = `${details.product.name}${details.variant.color?.name ? ` - ${details.variant.color.name}` : ''}${details.variant.size ? ` (${details.variant.size})` : ''}`.trim();

        return {
          id: item.productId,
          sku: item.variantId,
          name: formattedName,
          price: details.variant.price,
          quantity: item.quantity
        };
      });

      console.log('Sending items to API:', items);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          origin: window.location.origin,
          shippingDetails: shippingDetails
        })
      });

      const data = await response.json();

      if (!response.ok) {
        checkoutError = true;
        errorMessage = data.error || 'Error creating checkout session';
        errorDetails = `Status: ${response.status}. Please try again or contact support if the problem persists.`;
        console.error('Checkout error response:', data);
        isLoadingProducts = false;
        return;
      }

      // Redirect to Stripe Checkout
      if (!stripeInstance) {
        // Try to initialize Stripe again if it failed during page load
        stripeInstance = await getStripePromise();
      }

      if (!stripeInstance) {
        errorMessage = 'Failed to load payment processor';
        errorDetails = 'Check your internet connection and try again, or contact support if the problem persists.';
        checkoutError = true;
        isLoadingProducts = false;
        return;
      }

      const { error: stripeError } = await stripeInstance.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (stripeError) {
        console.error('Stripe checkout error:', stripeError);
        errorMessage = stripeError.message || 'An error occurred during checkout';
        errorDetails = 'Your payment provider encountered an error. Please try again.';
        checkoutError = true;
        isLoadingProducts = false;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      errorDetails = 'There was a problem processing your checkout. Please try again later.';
      checkoutError = true;
      isLoadingProducts = false;
    }
  }

  function handleAddressSelected(event) {
    const address = event.detail;

    shippingDetails = {
      ...shippingDetails,
      addressLine1: address.addressLine1,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country
    };

    addressLine1Touched = true;
    cityTouched = true;
    stateTouched = true;
    postalCodeTouched = true;
    countryTouched = true;

    addressSelected = true;
    addressFromMapbox = true;

    resetFieldError();
  }

  function handleAddressCleared() {
    addressSelected = false;
    addressFromMapbox = false;
  }

  function enableManualEdit() {
    addressFromMapbox = false;
  }

  function handleShowManualEntry() {
    showManualEntryForm = true;
    errorMessage = '';
  }

  function toggleManualEntry() {
    showManualEntryForm = !showManualEntryForm;
    if (!showManualEntryForm) {
      shippingDetails.addressLine1 = '';
      shippingDetails.addressLine2 = '';
      shippingDetails.city = '';
      shippingDetails.state = '';
      shippingDetails.postalCode = '';
      addressSelected = false;
      mapboxLoadError = false;
      addressFromMapbox = false;
    }
    resetFieldError();
  }

  function handleAddressSearchError() {
    console.log('Address search component reported an error');
    mapboxLoadError = true;
    showManualEntryForm = true;
  }

  const resetFieldError = () => {
    if (formSubmitted) {
      errorMessage = '';
      errorDetails = '';
      checkoutError = false;
    }
  };

  const touchField = (field: string) => {
    switch(field) {
      case 'firstName':
        firstNameTouched = true;
        break;
      case 'lastName':
        lastNameTouched = true;
        break;
      case 'email':
        emailTouched = true;
        break;
      case 'phone':
        phoneTouched = true;
        break;
      case 'addressLine1':
        addressLine1Touched = true;
        break;
      case 'city':
        cityTouched = true;
        break;
      case 'state':
        stateTouched = true;
        break;
      case 'postalCode':
        postalCodeTouched = true;
        break;
      case 'country':
        countryTouched = true;
        break;
    }
    resetFieldError();
  };

  function handleImageError(event) {
    event.target.src = '/static/images/product-placeholder.jpg';
    event.target.onerror = null;
  }
</script>

<section class="checkout-wrapper section">
  <h1 class="checkout-title">Checkout</h1>

  {#if isLoadingProducts}
    <div class="checkout-loading">
      <div class="loading-spinner"></div>
      <p>Loading cart details...</p>
      <p class="loading-text-small">This may take a moment if you have many items</p>
    </div>
  {:else if loadError}
    <div class="checkout-error">Failed to load cart. Please try again.</div>
  {:else if !displayedCart || displayedCart.length === 0}
    <div class="checkout-empty">Your cart is empty.</div>
  {:else}
    {#if errorMessage}
      <div class="checkout-error-message {checkoutError ? 'checkout-error-alert' : ''}">
        <div class="error-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{errorMessage}</span>
        </div>
        {#if errorDetails}
          <div class="error-details">{errorDetails}</div>
        {/if}
        {#if checkoutError}
          <div class="error-suggestions">
            <p>Suggestions:</p>
            <ul>
              <li>Check that your cart items are still in stock</li>
              <li>Refresh the page and try again</li>
              <li>Ensure your browser has cookies enabled</li>
              <li>Try again in a few minutes</li>
            </ul>
          </div>
        {/if}
      </div>
    {/if}

    <div class="checkout-content">
      <div class="checkout-left">
        <h2 class="section-title">Your Items</h2>
        <div class="checkout-items">
          {#each displayedCart as item}
            {#key item.productId + '-' + item.variantId}
              {#if productDetails && productDetails[`${item.productId}___${item.variantId}`]}
                <div class="checkout-item">
                  <img
                    class="checkout-item-img"
                    src={productDetails[`${item.productId}___${item.variantId}`].variant.images?.[0] ?? '/static/images/product-placeholder.jpg'}
                    alt={productDetails[`${item.productId}___${item.variantId}`].product.name}
                    on:error={handleImageError}
                  />
                  <div class="checkout-item-info">
                    <div class="checkout-item-title">{productDetails[`${item.productId}___${item.variantId}`].product.name}</div>
                    <div class="checkout-item-meta">
                      <span>Color: {productDetails[`${item.productId}___${item.variantId}`].variant.color?.name ?? '—'}</span>
                      <span>Size: {productDetails[`${item.productId}___${item.variantId}`].variant.size ?? '—'}</span>
                    </div>
                    <div class="checkout-item-price">{formatPrice(productDetails[`${item.productId}___${item.variantId}`].variant.price)}</div>
                    <div class="checkout-item-qty">Qty: {item.quantity}</div>
                  </div>
                </div>
              {:else}
                <div class="checkout-item">
                  <img class="checkout-item-img" src="/static/images/product-placeholder.jpg" alt="Product image unavailable" />
                  <div class="checkout-item-info">
                    <div class="checkout-item-title">Product details unavailable</div>
                    <div class="checkout-item-meta">
                      <span>Color: —</span>
                      <span>Size: —</span>
                    </div>
                    <div class="checkout-item-price">—</div>
                    <div class="checkout-item-qty">Qty: {item.quantity}</div>
                  </div>
                </div>
              {/if}
            {/key}
          {/each}
        </div>

        <div class="shipping-form">
          <h2 class="section-title">Shipping Details</h2>

          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name*</label>
              <input
                type="text"
                id="firstName"
                bind:value={shippingDetails.firstName}
                on:input={resetFieldError}
                on:blur={() => touchField('firstName')}
                class="form-input {firstNameTouched && !isFirstNameValid ? 'input-error' : ''}"
                required
              />
              {#if firstNameTouched && !isFirstNameValid}
                <p class="form-error">First name is required</p>
              {/if}
            </div>
            <div class="form-group">
              <label for="lastName">Last Name*</label>
              <input
                type="text"
                id="lastName"
                bind:value={shippingDetails.lastName}
                on:input={resetFieldError}
                on:blur={() => touchField('lastName')}
                class="form-input {lastNameTouched && !isLastNameValid ? 'input-error' : ''}"
                required
              />
              {#if lastNameTouched && !isLastNameValid}
                <p class="form-error">Last name is required</p>
              {/if}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Email*</label>
              <input
                type="email"
                id="email"
                bind:value={shippingDetails.email}
                on:input={resetFieldError}
                on:blur={() => touchField('email')}
                class="form-input {emailTouched && !isEmailValid ? 'input-error' : ''}"
                required
              />
              {#if emailTouched && !isEmailValid}
                <p class="form-error">Please enter a valid email address</p>
              {/if}
            </div>
            <div class="form-group">
              <label for="phone">Phone*</label>
              <input
                type="tel"
                id="phone"
                bind:value={shippingDetails.phone}
                on:input={resetFieldError}
                on:blur={() => touchField('phone')}
                class="form-input {phoneTouched && !isPhoneValid ? 'input-error' : ''}"
                required
              />
              {#if phoneTouched && !isPhoneValid}
                <p class="form-error">Please enter a valid phone number</p>
              {/if}
            </div>
          </div>

          <div class="form-group full-width address-section">
            <h3 class="address-section-title">Shipping Address</h3>

            {#if !showManualEntryForm && !mapboxLoadError}
              <div class="form-group full-width address-search-wrapper">
                <AddressSearch
                  {showManualEntryForm}
                  on:addressSelected={handleAddressSelected}
                  on:addressCleared={handleAddressCleared}
                  on:showManualEntry={handleShowManualEntry}
                  on:error={handleAddressSearchError}
                />
              </div>
            {:else}
              {#if !mapboxLoadError}
                <div class="manual-entry-header">
                  <button
                    type="button"
                    class="toggle-manual-btn"
                    on:click={toggleManualEntry}
                  >
                    ← Back to Address Search
                  </button>
                </div>
              {/if}
            {/if}

            <div class="address-fields {addressSelected || showManualEntryForm || mapboxLoadError ? 'visible' : 'hidden'}">

              {#if addressFromMapbox}
                <div class="mapbox-selection-notice">
                  <div class="mapbox-notice-content">
                    <p>Address selected from search</p>
                    <button
                      type="button"
                      class="edit-address-btn"
                      on:click={enableManualEdit}
                    >
                      Edit address manually
                    </button>
                  </div>
                </div>
              {/if}

              <div class="form-group full-width">
                <label for="addressLine1">Address Line 1*</label>
                <input
                  type="text"
                  id="addressLine1"
                  bind:value={shippingDetails.addressLine1}
                  on:input={resetFieldError}
                  on:blur={() => touchField('addressLine1')}
                  class="form-input {addressLine1Touched && !isAddressLine1Valid ? 'input-error' : ''} {addressFromMapbox ? 'input-readonly' : ''}"
                  readonly={addressFromMapbox}
                  required
                />
                {#if addressLine1Touched && !isAddressLine1Valid}
                  <p class="form-error">Please enter a valid address</p>
                {/if}
              </div>

              <div class="form-group full-width">
                <label for="addressLine2">Address Line 2</label>
                <input
                  type="text"
                  id="addressLine2"
                  bind:value={shippingDetails.addressLine2}
                  class="form-input {addressFromMapbox ? 'input-readonly' : ''}"
                  readonly={addressFromMapbox}
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="city">City*</label>
                  <input
                    type="text"
                    id="city"
                    bind:value={shippingDetails.city}
                    on:input={resetFieldError}
                    on:blur={() => touchField('city')}
                    class="form-input {cityTouched && !isCityValid ? 'input-error' : ''} {addressFromMapbox ? 'input-readonly' : ''}"
                    readonly={addressFromMapbox}
                    required
                  />
                  {#if cityTouched && !isCityValid}
                    <p class="form-error">City is required</p>
                  {/if}
                </div>
                <div class="form-group">
                  <label for="state">State/Province*</label>
                  <input
                    type="text"
                    id="state"
                    bind:value={shippingDetails.state}
                    on:input={resetFieldError}
                    on:blur={() => touchField('state')}
                    class="form-input {stateTouched && !isStateValid ? 'input-error' : ''} {addressFromMapbox ? 'input-readonly' : ''}"
                    readonly={addressFromMapbox}
                    required
                  />
                  {#if stateTouched && !isStateValid}
                    <p class="form-error">State/Province is required</p>
                  {/if}
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="postalCode">Postal Code*</label>
                  <input
                    type="text"
                    id="postalCode"
                    bind:value={shippingDetails.postalCode}
                    on:input={resetFieldError}
                    on:blur={() => touchField('postalCode')}
                    class="form-input {postalCodeTouched && !isPostalCodeValid ? 'input-error' : ''} {addressFromMapbox ? 'input-readonly' : ''}"
                    readonly={addressFromMapbox}
                    required
                  />
                  {#if postalCodeTouched && !isPostalCodeValid}
                    <p class="form-error">Postal code is required</p>
                  {/if}
                </div>
                <div class="form-group">
                  <label for="country">Country*</label>
                  <select
                    id="country"
                    bind:value={shippingDetails.country}
                    on:change={resetFieldError}
                    on:blur={() => touchField('country')}
                    class="form-input {countryTouched && !isCountryValid ? 'input-error' : ''} {addressFromMapbox ? 'input-readonly' : ''}"
                    disabled={addressFromMapbox}
                    required
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="New Zealand">New Zealand</option>
                  </select>
                  {#if countryTouched && !isCountryValid}
                    <p class="form-error">Country is required</p>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="checkout-summary">
        <h2>Order Summary</h2>
        <div class="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>{subtotal > 0 ? formatPrice(shippingCost) : '-'}</span></div>
        <div class="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
        <button
          disabled={!displayedCart || !displayedCart.length || isLoadingProducts}
          class="summary-checkout-btn primary-btn {isLoadingProducts ? 'loading' : ''}"
          on:click={goToPayment}
        >
          {#if isLoadingProducts}
            <div class="button-spinner"></div>
            Processing...
          {:else}
            Proceed to Payment
          {/if}
        </button>
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
  flex-direction: column;
  gap: 2rem;
}
.checkout-left {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--color-gold, #ad974f);
}
.checkout-items {
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
  background: var(--color-white, #fff);
  border-radius: 12px;
  padding: 1.5rem 1.25rem;
  box-shadow: 0 1px 6px 0 #d9d7ca22;
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

.summary-checkout-btn.loading {
  position: relative;
  cursor: not-allowed;
  background-color: #c4b06b;
}

.button-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
  vertical-align: middle;
}

.checkout-loading, .checkout-error, .checkout-empty {
  padding: 2.5rem 0;
  text-align: center;
  font-size: 1.13rem;
  color: var(--color-gold, #ad974f);
}

.checkout-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 220px;
  justify-content: center;
}
.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--color-gold, #ad974f);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  animation: spin 1.1s linear infinite;
  margin-bottom: 1.1rem;
}
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}
.loading-text-small {
  font-size: 0.93rem;
  color: #b3a26a;
  margin-top: 0.35rem;
}

.checkout-error-message {
  background-color: #fef2f2;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  border-left: 4px solid #ef4444;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.error-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
}

.error-details {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  opacity: 0.9;
}

.error-suggestions {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  border-top: 1px solid rgba(185, 28, 28, 0.2);
  padding-top: 0.5rem;
}

.error-suggestions p {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.error-suggestions ul {
  padding-left: 1.5rem;
  margin: 0.25rem 0;
}

.checkout-error-alert {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-left: 4px solid #ef4444;
  animation: errorPulse 2s 1;
}

@keyframes errorPulse {
  0% { background-color: #fecaca; }
  100% { background-color: #fef2f2; }
}

.shipping-form {
  background: var(--color-white, #fff);
  border-radius: 12px;
  padding: 1.5rem 1.25rem;
  box-shadow: 0 1px 6px 0 #d9d7ca22;
}
.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
.form-group.full-width {
  width: 100%;
}
.form-group label {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: var(--color-charcoal, #23231a);
}
.form-input {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: all 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: var(--color-gold, #ad974f);
  box-shadow: 0 0 0 2px rgba(173, 151, 79, 0.2);
}
.input-error {
  border-color: #ef4444 !important;
}
.form-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.35rem;
}

.address-fields.hidden {
  display: none;
}
.address-fields.visible {
  display: block;
  animation: fadeIn 0.3s ease-in-out;
}

.address-search-wrapper {
  margin-bottom: 1.5rem;
}

.manual-entry-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
}

.toggle-manual-btn {
  font-size: 0.85rem;
  color: var(--color-gold, #ad974f);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
}

.toggle-manual-btn:hover {
  color: #8e783a;
}

.address-section {
  margin-top: 1.5rem;
}

.address-section-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--color-charcoal, #23231a);
}

.input-readonly {
  background-color: #f8f8f8;
  cursor: not-allowed;
  opacity: 0.8;
  border-color: #e2e8f0 !important;
}

.mapbox-selection-notice {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.375rem;
}

.mapbox-notice-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mapbox-notice-content p {
  font-size: 0.875rem;
  color: #0284c7;
  margin: 0;
}

.edit-address-btn {
  font-size: 0.75rem;
  color: #0284c7;
  background: none;
  border: none;
  padding: 0;
  text-decoration: underline;
  cursor: pointer;
}

.edit-address-btn:hover {
  color: #0369a1;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 840px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  .checkout-content {
    gap: 2rem;
  }
}
@media (max-width: 500px) {
  .checkout-title { font-size: 1.25rem; margin-bottom: 1.1rem; }
  .checkout-wrapper { padding: 1.1rem 0.1rem; }
  .checkout-item-img { width: 54px; height: 54px; }
  .checkout-item-title { font-size: 1rem; }
  .checkout-summary { padding: 1rem 0.7rem; }
  .section-title { font-size: 1.25rem; }
}
</style>
