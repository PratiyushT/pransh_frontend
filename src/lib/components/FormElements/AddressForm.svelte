<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AddressSearch from '$lib/components/FormElements/AddressSearch.svelte';
  import { Input, PhoneInput } from './index';

  export let showAddressFields = true; // Whether to show address fields by default
  export let addressRequired = true; // For checkout vs registration
  export let showMapboxSearch = true; // Whether to show the address search component
  export let showHeading = false; // Whether to show a heading
  export let headingText = 'Shipping Address'; // Customizable heading text
  export let showPhoneNumber = true; // Whether to show the phone number field
  export let phoneNumberRequired = true; // Whether the phone number is required
  export let showAddressToggle = false; // For registration page where address is optional
  export let buttonLabel = ''; // Optional button label for form submission
  export let showCancelButton = false; // Whether to show a cancel button
  export let cancelButtonLabel = 'Cancel'; // Customizable cancel button label

  // For compatibility with checkout page structure
  export let firstNameTouched = false;
  export let lastNameTouched = false;
  export let emailTouched = false;
  export let phoneTouched = false;
  export let addressLine1Touched = false;
  export let cityTouched = false;
  export let stateTouched = false;
  export let postalCodeTouched = false;
  export let countryTouched = false;
  export let showManualAddressForm = false;
  export let addressSelected = false;
  export let mapboxLoadError = false;
  export let addressFromMapbox = false;

  // Address data
  export let addressData = {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phoneNumber: ''
  };

  // Field interaction tracking
  let streetAddressTouched = false;
  let zipCodeTouched = false;
  let phoneNumberTouched = false;

  let phoneNumberError = '';

  const countries = [
    'United States','Canada','United Kingdom','Australia',
    'India','Germany','France','Japan','China','Brazil','Other'
  ];

  const dispatch = createEventDispatcher();

  // Phone number validation
  function validatePhoneNumber(phone: string) {
    if (!phone) {
      return !phoneNumberRequired;
    }

    // Remove all non-numeric characters for validation
    const digits = phone.replace(/\D/g, '');

    // Basic validation: 10-15 digits (international numbers can be longer)
    if (digits.length < 10 || digits.length > 15) {
      phoneNumberError = 'Phone number must have 10-15 digits';
      return false;
    }

    // US format validation
    const usPhoneRegex = /^(\+?1)?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})$/;
    if (!usPhoneRegex.test(phone) && digits.length === 10) {
      phoneNumberError = 'Format should be (555) 555-5555 or similar';
      return false;
    }

    phoneNumberError = '';
    return true;
  }

  // Format phone number as user types
  function formatPhoneNumber(value: string) {
    if (!value) return '';

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX if it looks like a US number
    if (digits.length <= 10) {
      if (digits.length < 4) {
        return digits;
      } else if (digits.length < 7) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      }
    }

    // For longer numbers (international), just keep as is with country code
    return value;
  }

  // Handle phone number input
  function handlePhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    phoneNumberTouched = true;

    // Format the phone number
    const formattedNumber = formatPhoneNumber(input.value);
    addressData.phoneNumber = formattedNumber;

    // Validate and emit change
    validatePhoneNumber(addressData.phoneNumber);
    resetFieldError();
    emitChange();
  }

  function handleAddressSelected(event: CustomEvent) {
    const addr = event.detail;
    addressData.street = addr.addressLine1;
    addressData.city = addr.city;
    addressData.state = addr.state;
    addressData.postalCode = addr.postalCode;
    addressData.country = addr.country;

    streetAddressTouched = cityTouched = stateTouched = zipCodeTouched = countryTouched = true;
    addressSelected = true;
    addressFromMapbox = true;

    // For checkout page compatibility
    addressLine1Touched = cityTouched = stateTouched = postalCodeTouched = countryTouched = true;

    resetFieldError();
    emitChange();
    dispatch('addressSelected', addr);
  }

  function handleAddressCleared() {
    addressSelected = addressFromMapbox = false;
    emitChange();
    dispatch('addressCleared');
  }

  const handleShowManualEntry = () => {
    showManualAddressForm = true;
    dispatch('showManualEntry');
  };

  const enableManualEdit = () => {
    addressFromMapbox = false;
    emitChange();
    dispatch('enableManualEdit');
  };

  const toggleAddressFields = () => {
    showAddressFields = !showAddressFields;
    dispatch('toggleAddress', { show: showAddressFields });
    emitChange();
  };

  // Synchronize touched states for compatibility
  $: {
    if (streetAddressTouched) addressLine1Touched = true;
    if (zipCodeTouched) postalCodeTouched = true;
    if (cityTouched && stateTouched && postalCodeTouched) {
      dispatch('touchField', 'addressLine1');
      dispatch('touchField', 'city');
      dispatch('touchField', 'state');
      dispatch('touchField', 'postalCode');
      dispatch('touchField', 'country');
    }
  }

  // Field validation
  $: isStreetAddressValid = !streetAddressTouched || !showAddressFields || addressData.street.length > 3;
  $: isCityValid = !cityTouched || !showAddressFields || addressData.city.length > 2;
  $: isStateValid = !stateTouched || !showAddressFields || addressData.state.length > 1;
  $: isZipCodeValid = !zipCodeTouched || !showAddressFields || addressData.postalCode.length > 3;
  $: isCountryValid = !countryTouched || !showAddressFields || addressData.country.length > 0;
  $: isPhoneNumberValid = !phoneNumberTouched || (addressData.phoneNumber ? validatePhoneNumber(addressData.phoneNumber) : !phoneNumberRequired);

  // Overall form validity
  $: isFormValid = !showAddressFields || (
    isStreetAddressValid && isCityValid && isStateValid &&
    isZipCodeValid && isCountryValid &&
    (!showPhoneNumber || (addressData.phoneNumber && addressData.phoneNumber.length > 0 ? isPhoneNumberValid : !phoneNumberRequired))
  );

  // Notify parent of form validity and data
  $: {
    dispatch('validityChange', { valid: isFormValid });
  }

  // Reset errors
  const resetFieldError = () => {
    dispatch('resetError');
  };

  // Emit changes to parent component
  function emitChange() {
    dispatch('change', { addressData, valid: isFormValid });
  }

  // Handle submit
  function handleSubmit() {
    streetAddressTouched = cityTouched = stateTouched = zipCodeTouched = countryTouched = phoneNumberTouched = true;
    addressLine1Touched = cityTouched = stateTouched = postalCodeTouched = countryTouched = true;

    if (isFormValid) {
      dispatch('submit', { addressData });
    } else {
      dispatch('validationFailed');
    }
  }

  // Handle cancel
  function handleCancel() {
    dispatch('cancel');
  }
</script>

{#if showHeading}
  <h3 class="text-lg font-medium mb-4">{headingText}</h3>
{/if}

{#if showAddressToggle}
  <div class="form-field">
    <button type="button" class="text-gold hover:text-gold-dark flex items-center text-sm font-medium transition-colors" on:click={toggleAddressFields}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={showAddressFields ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
      </svg>
      {showAddressFields ? 'Hide Shipping Address' : 'Add Shipping Address'}
    </button>
  </div>
{/if}

{#if showAddressFields}
  <div class="address-fields space-y-6 {showAddressToggle ? 'border-t border-b border-gray-200 py-6 mt-4 animate-fade-in' : ''}">
    {#if showMapboxSearch}
      <div class="form-field">
        <AddressSearch
          on:addressSelected={handleAddressSelected}
          on:addressCleared={handleAddressCleared}
          on:showManualEntry={handleShowManualEntry}
          on:error={() => { mapboxLoadError = true; }}
        />
      </div>
    {/if}

    {#if showManualAddressForm || addressSelected || !showMapboxSearch}
      <div class="form-field animate-fade-in">
        {#if addressFromMapbox}
          <div class="mapbox-selection-notice">
            <div class="mapbox-notice-content">
              <p>Address selected from search</p>
              <button type="button" class="edit-address-btn" on:click={enableManualEdit}>Edit address manually</button>
            </div>
          </div>
        {/if}

        <Input
          id="streetAddress"
          label="Street Address"
          bind:value={addressData.street}
          bind:touched={streetAddressTouched}
          bind:valid={isStreetAddressValid}
          placeholder="123 Main St, Apt 4B"
          required={addressRequired}
          readonly={addressFromMapbox}
          errorMessage="Please enter a valid street address"
          on:input={() => { resetFieldError(); emitChange(); }}
          on:blur={() => {
            streetAddressTouched = true;
            addressLine1Touched = true;
            emitChange();
            dispatch('touchField', 'addressLine1');
          }}
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input
          id="city"
          label="City"
          bind:value={addressData.city}
          bind:touched={cityTouched}
          bind:valid={isCityValid}
          placeholder="New York"
          required={addressRequired}
          readonly={addressFromMapbox}
          errorMessage="City is required"
          on:input={() => { resetFieldError(); emitChange(); }}
          on:blur={() => {
            cityTouched = true;
            emitChange();
            dispatch('touchField', 'city');
          }}
        />

        <Input
          id="state"
          label="State/Province"
          bind:value={addressData.state}
          bind:touched={stateTouched}
          bind:valid={isStateValid}
          placeholder="NY"
          required={addressRequired}
          readonly={addressFromMapbox}
          errorMessage="State/Province is required"
          on:input={() => { resetFieldError(); emitChange(); }}
          on:blur={() => {
            stateTouched = true;
            emitChange();
            dispatch('touchField', 'state');
          }}
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Input
          id="zipCode"
          label="Zip/Postal Code"
          bind:value={addressData.postalCode}
          bind:touched={zipCodeTouched}
          bind:valid={isZipCodeValid}
          placeholder="10001"
          required={addressRequired}
          readonly={addressFromMapbox}
          errorMessage="Zip/Postal code is required"
          on:input={() => { resetFieldError(); emitChange(); }}
          on:blur={() => {
            zipCodeTouched = true;
            postalCodeTouched = true;
            emitChange();
            dispatch('touchField', 'postalCode');
          }}
        />

        <div class="form-field">
          <label for="country" class="block text-sm font-medium text-gray-700 mb-1">
            Country {#if addressRequired}<span class="text-red-500">*</span>{/if}
          </label>
          <select
            id="country"
            bind:value={addressData.country}
            on:change={() => { resetFieldError(); emitChange(); }}
            on:blur={() => { countryTouched = true; emitChange(); dispatch('touchField', 'country'); }}
            disabled={addressFromMapbox}
            required={addressRequired}
            class="w-full px-3 py-2 border {countryTouched && !isCountryValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm bg-white {addressFromMapbox ? 'input-readonly' : ''}"
          >
            <option value="">Select Country</option>
            {#each countries as countryOption}
              <option value={countryOption}>{countryOption}</option>
            {/each}
          </select>
          {#if countryTouched && !isCountryValid}
            <p class="mt-1 text-sm text-red-600">Country is required</p>
          {/if}
        </div>
      </div>

      {#if showPhoneNumber}
        <div class="animate-fade-in">
          <PhoneInput
            id="shippingPhoneNumber"
            label="Phone Number"
            bind:value={addressData.phoneNumber}
            bind:touched={phoneNumberTouched}
            bind:valid={isPhoneNumberValid}
            required={phoneNumberRequired && showAddressFields}
            optional={!phoneNumberRequired}
            on:input={(e) => {
              // Use the formatted number from the component
              resetFieldError();
              emitChange();
            }}
            on:blur={() => {
              phoneNumberTouched = true;
              streetAddressTouched = true;
              phoneTouched = true;
              emitChange();
              dispatch('touchField', 'phone');
            }}
          />
        </div>
      {/if}
    {/if}

    {#if buttonLabel}
      <div class="form-actions flex justify-end space-x-3 pt-4">
        {#if showCancelButton}
          <button
            type="button"
            on:click={handleCancel}
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50"
          >
            {cancelButtonLabel}
          </button>
        {/if}
        <button
          type="button"
          on:click={handleSubmit}
          class="px-4 py-2 bg-gold text-white rounded-sm hover:bg-gold-dark disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Add custom styles */
  .text-gold { color: #b8860b; }
  .bg-gold { background-color: #b8860b; }
  .border-gold { border-color: #b8860b; }
  .hover\:bg-gold-dark:hover { background-color: #a67a09; }
  .hover\:text-gold-dark:hover { color:#a67a09; }
  .focus\:border-gold:focus { border-color: #b8860b; }
  .focus\:ring-gold\/20:focus { --tw-ring-color: rgb(184 134 11 / 0.2); }

  .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

  .input-readonly { background-color: #f8f8f8; cursor: not-allowed; opacity: 0.8; border-color: #e2e8f0 !important; }
  .mapbox-selection-notice { margin-bottom:1rem; padding:0.75rem; background-color:#f0f9ff; border:1px solid #bae6fd; border-radius:0.375rem; }
  .mapbox-notice-content { display:flex; justify-content:space-between; align-items:center; }
  .mapbox-notice-content p { font-size:0.875rem; color:#0284c7; margin:0; }
  .edit-address-btn { font-size:0.75rem; color:#0284c7; background:none; border:none; padding:0; text-decoration:underline; cursor:pointer; }
  .edit-address-btn:hover { color:#0369a1; }
</style>
