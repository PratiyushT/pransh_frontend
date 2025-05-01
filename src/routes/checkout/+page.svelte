<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { cart, keepOnlyLastCartItem, savedCart, savedCartCount, restoreSavedCart } from '$lib/stores';
  import { getCartProductDetails } from '$lib/sanity/sanityData';
  import { formatPrice } from '$lib/utils/data';
  import ReusableAddressForm from '$lib/components/ReusableAddressForm.svelte';
  import { page } from '$app/stores';
  import { getStripePromise } from '$lib/payments/client';

  let productDetails: Record<string, any> = {};
  let isLoadingProducts = true;
  let loadError = false;
  let subtotal = 0;
  let shippingCost = 15.0;
  let total = 0;

  let isDirectCheckout = false;
  let directCheckoutItem = null;
  let isDirectCheckoutActive = false;

  let formSubmitted = false;
  let errorMessage = '';
  let errorDetails = '';
  let checkoutError = false;

  let stripeInstance: any = null;

  // Update the shippingDetails object structure
  let shippingDetails = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      phoneNumber: ''
    }
  };

  // Create a mapped addressData object that references the shippingDetails.address structure
  let addressData = {
    get street() { return shippingDetails.address.street; },
    set street(val) { shippingDetails.address.street = val; },

    get addressLine2() { return shippingDetails.address.addressLine2; },
    set addressLine2(val) { shippingDetails.address.addressLine2 = val; },

    get city() { return shippingDetails.address.city; },
    set city(val) { shippingDetails.address.city = val; },

    get state() { return shippingDetails.address.state; },
    set state(val) { shippingDetails.address.state = val; },

    get postalCode() { return shippingDetails.address.postalCode; },
    set postalCode(val) { shippingDetails.address.postalCode = val; },

    get country() { return shippingDetails.address.country; },
    set country(val) { shippingDetails.address.country = val; },

    get phoneNumber() { return shippingDetails.address.phoneNumber; },
    set phoneNumber(val) { shippingDetails.address.phoneNumber = val; }
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
  let showManualAddressForm = false;
  let addressSelected = false;
  let mapboxLoadError = false;
  let addressFromMapbox = false;

  let buyNowProduct = null;

  $: displayedCart = $cart;

  $: {
    const url = $page.url || (typeof window !== 'undefined' && window.location ? new URL(window.location.href) : null);
    if (url) {
      const params = url.searchParams;
      isDirectCheckout = params.get('direct') === 'true';

      if (isDirectCheckout) {
        isDirectCheckoutActive = true;
      }

      if (isDirectCheckout && $cart && $cart.length > 0) {
        buyNowProduct = $cart[$cart.length - 1];
        keepOnlyLastCartItem();
      }
    }
  }

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

  $: subtotal = (displayedCart && Array.isArray(displayedCart))
    ? displayedCart.reduce((sum, item) => {
      const details = productDetails[`${item.productId}___${item.variantId}`];
      if (!details) {
        return sum + 0;
      }
      return sum + details.variant.price * item.quantity;
    }, 0)
    : 0;
  $: total = subtotal + (subtotal > 0 ? shippingCost : 0);

  $: isFirstNameValid = !firstNameTouched || shippingDetails.firstName.length > 1;
  $: isLastNameValid = !lastNameTouched || shippingDetails.lastName.length > 1;
  $: isEmailValid = !emailTouched || validateEmail(shippingDetails.email);
  $: isPhoneValid = !phoneTouched || shippingDetails.phone.length > 5;
  $: isAddressLine1Valid = !addressLine1Touched || shippingDetails.address.street.length > 3;
  $: isCityValid = !cityTouched || shippingDetails.address.city.length > 2;
  $: isStateValid = !stateTouched || shippingDetails.address.state.length > 1;
  $: isPostalCodeValid = !postalCodeTouched || shippingDetails.address.postalCode.length > 3;
  $: isCountryValid = !countryTouched || shippingDetails.address.country.length > 0;

  // Add address form validity tracking
  let isAddressFormValid = true;

  $: isFormValid =
    shippingDetails.firstName &&
    shippingDetails.lastName &&
    shippingDetails.email &&
    shippingDetails.phone &&
    shippingDetails.address.street &&
    shippingDetails.address.city &&
    shippingDetails.address.state &&
    shippingDetails.address.postalCode &&
    isFirstNameValid &&
    isLastNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isAddressLine1Valid &&
    isCityValid &&
    isStateValid &&
    isPostalCodeValid &&
    isCountryValid &&
    isAddressFormValid;

  onMount(async () => {
    try {
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

  let previousCartJson = '';

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

  async function goToPayment() {
    formSubmitted = true;
    checkoutError = false;

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

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          origin: window.location.origin,
          shippingDetails: {
            firstName: shippingDetails.firstName,
            lastName: shippingDetails.lastName,
            email: shippingDetails.email,
            phone: shippingDetails.phone,
            addressLine1: shippingDetails.address.street,
            addressLine2: shippingDetails.address.addressLine2 || '',
            city: shippingDetails.address.city,
            state: shippingDetails.address.state,
            postalCode: shippingDetails.address.postalCode,
            country: shippingDetails.address.country
          }
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

      if (!stripeInstance) {
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

    shippingDetails.address = {
      ...shippingDetails.address,
      street: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phoneNumber: address.phoneNumber || ''
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
    showManualAddressForm = true;
    errorMessage = '';
  }

  function toggleManualEntry() {
    showManualAddressForm = !showManualAddressForm;
    if (!showManualAddressForm) {
      shippingDetails.address.street = '';
      shippingDetails.address.addressLine2 = '';
      shippingDetails.address.city = '';
      shippingDetails.address.state = '';
      shippingDetails.address.postalCode = '';
      addressSelected = false;
      mapboxLoadError = false;
      addressFromMapbox = false;
    }
    resetFieldError();
  }

  function handleAddressSearchError() {
    mapboxLoadError = true;
    showManualAddressForm = true;
  }

  // Function to handle address form validity change
  function handleAddressFormValidityChange(event: CustomEvent) {
    isAddressFormValid = event.detail.valid;
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

            <ReusableAddressForm
              bind:addressData={addressData}
              showAddressFields={true}
              showAddressToggle={false}
              addressRequired={true}
              phoneNumberRequired={true}
              showPhoneNumber={true}
              showMapboxSearch={true}
              bind:firstNameTouched
              bind:lastNameTouched
              bind:emailTouched
              bind:phoneTouched
              bind:addressLine1Touched
              bind:cityTouched
              bind:stateTouched
              bind:postalCodeTouched
              bind:countryTouched
              bind:showManualAddressForm
              bind:addressSelected
              bind:mapboxLoadError
              bind:addressFromMapbox
              on:resetError={resetFieldError}
              on:touchField={(e) => touchField(e.detail)}
              on:addressSelected={handleAddressSelected}
              on:addressCleared={handleAddressCleared}
              on:showManualEntry={handleShowManualEntry}
              on:enableManualEdit={enableManualEdit}
              on:validityChange={handleAddressFormValidityChange}
            />
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
