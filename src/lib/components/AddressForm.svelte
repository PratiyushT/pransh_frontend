<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { supabase } from '$lib/auth/client';
  import AddressSearch from './AddressSearch.svelte';
  import gsap from 'gsap';

  export let editMode = false;
  export let address = {
    id: null,
    label: 'Default',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    phone_number: '',
    is_default: true,
    profile_id: null
  };

  let isSubmitting = false;
  let errorMessage = '';
  let successMessage = '';
  let formSubmitted = false;
  let addressFromMapbox = false;
  let showManualAddressForm = false;

  // Field validation state
  let labelTouched = false;
  let streetTouched = false;
  let cityTouched = false;
  let stateTouched = false;
  let postalCodeTouched = false;
  let countryTouched = false;
  let phoneTouched = false;

  // Country options
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia',
    'India', 'Germany', 'France', 'Japan', 'China', 'Brazil', 'Other'
  ];

  const dispatch = createEventDispatcher();

  // Reactive validity checks
  $: isLabelValid = !labelTouched || address.label.length > 0;
  $: isStreetValid = !streetTouched || address.street.length > 3;
  $: isCityValid = !cityTouched || address.city.length > 2;
  $: isStateValid = !stateTouched || address.state.length > 1;
  $: isPostalCodeValid = !postalCodeTouched || address.postal_code.length > 3;
  $: isCountryValid = !countryTouched || address.country.length > 0;
  $: isPhoneValid = !phoneTouched || address.phone_number.length > 5;

  $: isFormValid = address && address.street && address.city && address.postal_code &&
                  address.country && address.phone_number && isStreetValid &&
                  isCityValid && isStateValid && isPostalCodeValid && isCountryValid && isPhoneValid;

  const handleSubmit = async () => {
    formSubmitted = true;
    labelTouched = streetTouched = cityTouched = stateTouched = postalCodeTouched = countryTouched = phoneTouched = true;

    if (!isFormValid) {
      errorMessage = 'Please fill in all required fields';
      return;
    }

    try {
      isSubmitting = true;
      errorMessage = '';
      successMessage = '';

      // Get current authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        errorMessage = 'You must be logged in to save an address';
        isSubmitting = false;
        return;
      }

      // Get profile ID if not provided
      if (!address.profile_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (profileData) {
          address.profile_id = profileData.id;
        } else {
          errorMessage = 'User profile not found';
          isSubmitting = false;
          return;
        }
      }

      let result;

      if (editMode && address.id) {
        // Update existing address
        result = await supabase
          .from('addresses')
          .update({
            label: address.label,
            street: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
            phone_number: address.phone_number,
            is_default: address.is_default,
            updated_at: new Date().toISOString()
          })
          .eq('id', address.id)
          .select();
      } else {
        // Create new address
        result = await supabase
          .from('addresses')
          .insert({
            profile_id: address.profile_id,
            label: address.label,
            street: address.street,
            city: address.city,
            state: address.state || null,
            postal_code: address.postal_code,
            country: address.country,
            phone_number: address.phone_number,
            is_default: address.is_default
          })
          .select();
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // If this is being set as default, update other addresses
      if (address.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .neq('id', result.data[0].id)
          .eq('profile_id', address.profile_id);
      }

      successMessage = editMode ? 'Address updated successfully' : 'Address added successfully';
      formSubmitted = false;

      // Notify parent component of success
      dispatch('saved', result.data[0]);

      // Reset form if adding new address
      if (!editMode) {
        address = {
          id: null,
          label: 'Default',
          street: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'United States',
          phone_number: '',
          is_default: true,
          profile_id: address.profile_id
        };

        // Reset touched state
        labelTouched = streetTouched = cityTouched = stateTouched = postalCodeTouched = countryTouched = phoneTouched = false;
        showManualAddressForm = false;
        addressFromMapbox = false;
      }
    } catch (error) {
      console.error('Error saving address:', error);
      errorMessage = error.message || 'Failed to save address';
    } finally {
      isSubmitting = false;
    }
  };

  const handleCancel = () => {
    dispatch('cancel');
  };

  // For address autocomplete
  const handleAddressSelected = (event) => {
    const selectedAddress = event.detail;
    address.street = selectedAddress.addressLine1 || '';
    address.city = selectedAddress.city || '';
    address.state = selectedAddress.state || '';
    address.postal_code = selectedAddress.postalCode || '';
    address.country = selectedAddress.country || 'United States';

    // Mark fields as touched
    streetTouched = cityTouched = stateTouched = postalCodeTouched = countryTouched = true;
    addressFromMapbox = true;
    showManualAddressForm = true;
    resetFieldError();
  };

  const handleAddressCleared = () => {
    addressFromMapbox = false;
    // Optionally, hide manual form if desired
    // showManualAddressForm = false;
  };

  const enableManualEdit = () => {
    addressFromMapbox = false;
  };

  const handleShowManualEntry = () => {
    showManualAddressForm = true;
  };

  // Reset error on field change
  const resetFieldError = () => {
    if (formSubmitted) errorMessage = '';
  };

  // Animation on mount
  onMount(() => {
    const timeline = gsap.timeline();
    timeline.from('.form-field', {
      y: 10,
      opacity: 0,
      stagger: 0.1,
      duration: 0.4,
      ease: 'power2.out'
    });
  });
</script>

<div class="bg-white rounded-sm shadow-sm">
  <div class="px-6 py-4 border-b border-gray-200">
    <h3 class="text-xl font-serif text-gray-800">{editMode ? 'Edit Address' : 'Add New Address'}</h3>
  </div>

  <div class="p-6">
    {#if errorMessage}
      <div class="p-3 bg-red-50 text-red-700 text-sm rounded-sm mb-6 animate-fade-in">
        {errorMessage}
      </div>
    {/if}

    {#if successMessage}
      <div class="p-3 bg-green-50 text-green-700 text-sm rounded-sm mb-6 animate-fade-in">
        {successMessage}
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <!-- Phone Number Field (Moved Outside) -->
      <div class="form-field">
        <label for="phone_number" class="block text-sm font-medium text-gray-700 mb-1">Phone Number <span class="text-red-500">*</span></label>
        <input
          type="tel"
          id="phone_number"
          bind:value={address.phone_number}
          on:input={resetFieldError}
          on:blur={() => phoneTouched = true}
          placeholder="(123) 456-7890"
          required
          class="w-full px-3 py-2 border {phoneTouched && !isPhoneValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm text-gray-800"
        />
        {#if phoneTouched && !isPhoneValid}
          <p class="mt-1 text-sm text-red-600">Phone number is required for shipping</p>
        {/if}
      </div>

      <!-- Address Section with Label -->
      <div class="form-section p-4 border border-gray-200 rounded-sm bg-gray-50">
        <div class="form-section-title mb-4">
          <h4 class="text-base font-medium text-gray-800">Address Details</h4>
        </div>

        <div class="space-y-4">
          <div class="form-field">
            <label for="label" class="block text-sm font-medium text-gray-700 mb-1">Address Label</label>
            <input
              type="text"
              id="label"
              bind:value={address.label}
              on:input={resetFieldError}
              on:blur={() => labelTouched = true}
              placeholder="Home, Office, etc."
              class="w-full px-3 py-2 border {labelTouched && !isLabelValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm text-gray-800"
            />
            {#if labelTouched && !isLabelValid}
              <p class="mt-1 text-sm text-red-600">Please provide a label for this address</p>
            {/if}
          </div>

          <div class="form-field">
            <AddressSearch
              on:addressSelected={handleAddressSelected}
              on:addressCleared={handleAddressCleared}
            />
          </div>

          {#if !showManualAddressForm}
            <div class="flex justify-center">
              <button
                type="button"
                class="text-gold underline text-sm font-medium hover:text-gold-dark transition"
                on:click={handleShowManualEntry}
              >
                Enter address manually
              </button>
            </div>
          {/if}

          {#if showManualAddressForm}
            <div class="form-field">
              {#if addressFromMapbox}
                <div class="mapbox-selection-notice mb-4">
                  <div class="mapbox-notice-content">
                    <p>Address selected from search</p>
                    <button type="button" class="edit-address-btn" on:click={enableManualEdit}>Edit address manually</button>
                  </div>
                </div>
              {/if}
              <label for="street" class="block text-sm font-medium text-gray-700 mb-1">Street Address <span class="text-red-500">*</span></label>
              <input
                type="text"
                id="street"
                bind:value={address.street}
                on:input={resetFieldError}
                on:blur={() => streetTouched = true}
                readonly={addressFromMapbox}
                placeholder="123 Main St, Apt 4B"
                required
                class="w-full px-3 py-2 border {streetTouched && !isStreetValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm text-gray-800 {addressFromMapbox ? 'input-readonly' : ''}"
              />
              {#if streetTouched && !isStreetValid}
                <p class="mt-1 text-sm text-red-600">Please enter a valid street address</p>
              {/if}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City <span class="text-red-500">*</span></label>
                <input
                  type="text"
                  id="city"
                  bind:value={address.city}
                  on:input={resetFieldError}
                  on:blur={() => cityTouched = true}
                  readonly={addressFromMapbox}
                  required
                  class="w-full px-3 py-2 border {cityTouched && !isCityValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm text-gray-800 {addressFromMapbox ? 'input-readonly' : ''}"
                />
                {#if cityTouched && !isCityValid}
                  <p class="mt-1 text-sm text-red-600">City is required</p>
                {/if}
              </div>

              <div class="form-field">
                <label for="state" class="block text-sm font-medium text-gray-700 mb-1">State/Province <span class="text-red-500">*</span></label>
                <input
                  type="text"
                  id="state"
                  bind:value={address.state}
                  on:input={resetFieldError}
                  on:blur={() => stateTouched = true}
                  readonly={addressFromMapbox}
                  required
                  class="w-full px-3 py-2 border {stateTouched && !isStateValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm text-gray-800 {addressFromMapbox ? 'input-readonly' : ''}"
                />
                {#if stateTouched && !isStateValid}
                  <p class="mt-1 text-sm text-red-600">State/Province is required</p>
                {/if}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label for="postal_code" class="block text-sm font-medium text-gray-700 mb-1">Zip/Postal Code <span class="text-red-500">*</span></label>
                <input
                  type="text"
                  id="postal_code"
                  bind:value={address.postal_code}
                  on:input={resetFieldError}
                  on:blur={() => postalCodeTouched = true}
                  readonly={addressFromMapbox}
                  required
                  class="w-full px-3 py-2 border {postalCodeTouched && !isPostalCodeValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm text-gray-800 {addressFromMapbox ? 'input-readonly' : ''}"
                />
                {#if postalCodeTouched && !isPostalCodeValid}
                  <p class="mt-1 text-sm text-red-600">Zip/Postal code is required</p>
                {/if}
              </div>

              <div class="form-field">
                <label for="country" class="block text-sm font-medium text-gray-700 mb-1">Country <span class="text-red-500">*</span></label>
                <select
                  id="country"
                  bind:value={address.country}
                  on:change={resetFieldError}
                  on:blur={() => countryTouched = true}
                  disabled={addressFromMapbox}
                  required
                  class="w-full px-3 py-2 border {countryTouched && !isCountryValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm bg-white text-gray-800 {addressFromMapbox ? 'input-readonly' : ''}"
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

            <div class="form-field flex items-center">
              <input
                type="checkbox"
                id="is_default"
                bind:checked={address.is_default}
                class="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
              />
              <label for="is_default" class="ml-2 block text-sm text-gray-700">Set as default shipping address</label>
            </div>
          {/if}
        </div>
      </div>

      <div class="mt-8">
        <button
          type="submit"
          class="w-full py-3 bg-gold text-white hover:bg-gold-dark disabled:opacity-50 transition-colors duration-300 font-medium text-base"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <span class="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            {editMode ? 'Updating...' : 'Saving...'}
          {:else}
            {editMode ? 'Update Address' : 'Save Address'}
          {/if}
        </button>
      </div>

      <div class="text-center mt-4">
        <button
          type="button"
          on:click={handleCancel}
          class="text-gray-600 hover:text-gold transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .mapbox-selection-notice {
    padding: 0.75rem;
    background-color: rgba(212, 175, 55, 0.05);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 0.25rem;
  }

  .mapbox-notice-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .mapbox-notice-content p {
    font-size: 0.875rem;
    color: #D4AF37;
    margin: 0;
    font-weight: 500;
  }

  .edit-address-btn {
    font-size: 0.75rem;
    color: #D4AF37;
    background: none;
    border: none;
    padding: 0;
    text-decoration: underline;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .edit-address-btn:hover {
    color: #B8941F;
  }

  .input-readonly {
    background-color: #f8f8f8;
    cursor: not-allowed;
    opacity: 0.8;
    border-color: #e2e8f0 !important;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
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
</style>
