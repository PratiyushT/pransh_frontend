<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { cart } from '$lib/stores';
  import { getCartProductDetails } from '$lib/sanity/sanityData';
  import { formatPrice } from '$lib/utils/data';
  import AddressSearch from '$lib/components/AddressSearch.svelte';

  // DEBUG: Log environment variables to console
  console.log('Environment variables available:', import.meta.env);

  let productDetails: Record<string, any> = {};
  let isLoadingProducts = true;
  let loadError = false;
  let subtotal = 0;
  let shippingCost = 15.0;
  let total = 0;

  // Form validation
  let formSubmitted = false;
  let errorMessage = '';

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
  let addressFromMapbox = false; // Track if address came from Mapbox

  $: subtotal = $cart.reduce((sum, item) => {
    const details = productDetails[`${item.productId}___${item.variantId}`];
    if (!details) return sum;
    return sum + details.variant.price * item.quantity;
  }, 0);
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

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function goToPayment() {
    formSubmitted = true;

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

    if (!$cart.length) {
      errorMessage = 'Your cart is empty';
      return;
    }

    // In a real implementation, you would save shipping details
    // and redirect to payment processing
    alert('Proceeding to payment...');
    // You would implement payment flow here
  }

  function handleAddressSelected(event) {
    const address = event.detail;

    // Populate address fields
    shippingDetails = {
      ...shippingDetails,
      addressLine1: address.addressLine1,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country
    };

    // Mark fields as touched for validation
    addressLine1Touched = true;
    cityTouched = true;
    stateTouched = true;
    postalCodeTouched = true;
    countryTouched = true;

    addressSelected = true;
    addressFromMapbox = true; // Flag that address was selected from Mapbox

    // Reset any error message
    resetFieldError();
  }

  function handleAddressCleared() {
    addressSelected = false;
    addressFromMapbox = false; // Reset the flag when address is cleared
  }

  // Add a function to edit manually
  function enableManualEdit() {
    addressFromMapbox = false;
  }

  function handleShowManualEntry() {
    showManualEntryForm = true;
    errorMessage = ''; // Clear any existing error messages
  }

  function toggleManualEntry() {
    showManualEntryForm = !showManualEntryForm;
    if (!showManualEntryForm) {
      // If switching back to address search, clear address fields
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

  // Reset form error when fields change
  const resetFieldError = () => {
    if (formSubmitted) {
      errorMessage = '';
    }
  };

  // Mark fields as touched
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
    <!-- Error message -->
    {#if errorMessage}
      <div class="checkout-error-message">
        {errorMessage}
      </div>
    {/if}

    <div class="checkout-content">
      <!-- Items in cart display -->
      <div class="checkout-left">
        <h2 class="section-title">Your Items</h2>
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

        <!-- Shipping details form -->
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

          <!-- Address Section -->
          <div class="form-group full-width address-section">
            <h3 class="address-section-title">Shipping Address</h3>

            <!-- Address Search Component - only show if no error -->
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

            <!-- Address fields - always visible when in manual mode -->
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

      <!-- Order Summary (now at the bottom) -->
      <div class="checkout-summary">
        <h2>Order Summary</h2>
        <div class="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>{subtotal > 0 ? formatPrice(shippingCost) : '-'}</span></div>
        <div class="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
        <button disabled={!$cart.length} class="summary-checkout-btn primary-btn" on:click={goToPayment}>Proceed to Payment</button>
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
.checkout-loading, .checkout-error, .checkout-empty {
  padding: 2.5rem 0;
  text-align: center;
  font-size: 1.13rem;
  color: var(--color-gold, #ad974f);
}

/* Error message styles */
.checkout-error-message {
  background-color: #fef2f2;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

/* Shipping form styles */
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

/* Address fields visibility */
.address-fields.hidden {
  display: none;
}
.address-fields.visible {
  display: block;
  animation: fadeIn 0.3s ease-in-out;
}

/* Address search container styling */
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
