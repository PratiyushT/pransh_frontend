<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/auth/client';
  import AddressSearch from './AddressSearch.svelte';

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

  // Track Mapbox address selection state
  let addressFromMapbox = false;
  let selectedFromMapbox = false;
  let showManualAddressForm = editMode; // Show manual form immediately only in edit mode
  let phoneNumberTouched = false;
  let phoneNumberError = '';

  const dispatch = createEventDispatcher();

  // Phone number validation
  function validatePhoneNumber(phone) {
    if (!phone) return false;

    // Remove all non-numeric characters for validation
    const digits = phone.replace(/\D/g, '');

    // Basic validation: 10-15 digits (international numbers can be longer)
    if (digits.length < 10 || digits.length > 15) {
      phoneNumberError = 'Phone number must have 10-15 digits';
      return false;
    }

    // US format validation (optional)
    const usPhoneRegex = /^(\+?1)?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})$/;
    if (!usPhoneRegex.test(phone) && digits.length === 10) {
      phoneNumberError = 'Format should be (555) 555-5555 or similar';
      return false;
    }

    phoneNumberError = '';
    return true;
  }

  // Format phone number as user types (optional)
  function formatPhoneNumber(value) {
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
  function handlePhoneInput(event) {
    const value = event.target.value;
    phoneNumberTouched = true;

    // Format the phone number
    const formattedNumber = formatPhoneNumber(value);
    address.phone_number = formattedNumber;

    // Validate on input
    validatePhoneNumber(address.phone_number);
  }

  const handleSubmit = async () => {
    try {
      phoneNumberTouched = true;
      isSubmitting = true;
      errorMessage = '';
      successMessage = '';

      // Validate form
      if (!address.street || !address.city || !address.postal_code || !address.country) {
        errorMessage = 'Please fill in all required address fields';
        isSubmitting = false;
        return;
      }

      // Validate phone number
      if (!validatePhoneNumber(address.phone_number)) {
        errorMessage = phoneNumberError || 'Please enter a valid phone number';
        isSubmitting = false;
        return;
      }

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

      // If this address is being set as default, first update all other addresses to not be default
      if (address.is_default) {
        // If editing, exclude the current address from the update
        if (editMode && address.id) {
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('profile_id', address.profile_id)
            .neq('id', address.id);
        } else {
          // If creating a new address, update all existing addresses to not be default
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('profile_id', address.profile_id);
        }
      }

      // Now update or create the address
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

      successMessage = editMode ? 'Address updated successfully' : 'Address added successfully';

      // Fetch all updated addresses to ensure UI has latest data
      const { data: updatedAddresses, error: addressesError } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', address.profile_id)
        .order('is_default', { ascending: false });

      if (addressesError) {
        console.error('Error fetching updated addresses:', addressesError);
      }

      // Notify parent component of success with all addresses and the specific saved address
      dispatch('saved', {
        savedAddress: result.data[0],
        allAddresses: updatedAddresses || [],
        action: editMode ? 'update' : 'create'
      });

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

        // Reset Mapbox state
        addressFromMapbox = false;
        selectedFromMapbox = false;
        showManualAddressForm = false;
        phoneNumberTouched = false;
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

    // Set flags to indicate the address was selected from Mapbox
    addressFromMapbox = true;
    selectedFromMapbox = true;
    showManualAddressForm = true;
  };

  // Handle address cleared from Mapbox
  const handleAddressCleared = () => {
    addressFromMapbox = false;
    selectedFromMapbox = false;
  };

  // Enable manual editing of address fields
  const enableManualEdit = () => {
    addressFromMapbox = false;
  };

  // Show manual address form
  const handleShowManualEntry = () => {
    showManualAddressForm = true;
  };
</script>

<div class="bg-white p-6 rounded-sm shadow-sm">
  <h3 class="text-lg font-medium mb-4">{editMode ? 'Edit Address' : 'Add New Address'}</h3>

  {#if errorMessage}
    <div class="bg-red-50 text-red-700 p-3 rounded-sm mb-4">
      {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div class="bg-green-50 text-green-700 p-3 rounded-sm mb-4">
      {successMessage}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="label" class="block text-sm font-medium text-gray-700 mb-1">Address Label</label>
      <input
        type="text"
        id="label"
        bind:value={address.label}
        placeholder="Home, Office, etc."
        class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </div>

    <div>
      <label for="address-search" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
      <AddressSearch
        id="address-search"
        on:addressSelected={handleAddressSelected}
        on:addressCleared={handleAddressCleared}
        on:showManualEntry={handleShowManualEntry}
      />
    </div>

    <!-- Show the address forms only when showManualAddressForm is true -->
    {#if showManualAddressForm}
      <div class="space-y-4 animate-fade-in">
        {#if addressFromMapbox}
          <div class="mapbox-selection-notice bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-700 mb-4">
            <div class="mapbox-notice-content flex justify-between items-center">
              <p>Address selected from search</p>
              <button type="button" class="text-blue-600 hover:text-blue-800 font-medium" on:click={enableManualEdit}>
                Edit address manually
              </button>
            </div>
          </div>
        {/if}

        <div>
          <label for="street" class="block text-sm font-medium text-gray-700 mb-1">
            Street Address <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="street"
            bind:value={address.street}
            placeholder="Street address"
            readonly={addressFromMapbox}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold {addressFromMapbox ? 'bg-gray-50 cursor-not-allowed' : ''}"
          />
        </div>

        <div>
          <label for="phone_number" class="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span class="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone_number"
            value={address.phone_number}
            on:input={handlePhoneInput}
            placeholder="(555) 555-5555"
            required
            class="w-full px-3 py-2 border {phoneNumberTouched && phoneNumberError ? 'border-red-300' : 'border-gray-300'} rounded-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
          {#if phoneNumberTouched && phoneNumberError}
            <p class="mt-1 text-sm text-red-600">{phoneNumberError}</p>
          {/if}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
              City <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="city"
              bind:value={address.city}
              readonly={addressFromMapbox}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold {addressFromMapbox ? 'bg-gray-50 cursor-not-allowed' : ''}"
            />
          </div>

          <div>
            <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
              State <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="state"
              bind:value={address.state}
              readonly={addressFromMapbox}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold {addressFromMapbox ? 'bg-gray-50 cursor-not-allowed' : ''}"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="postal_code" class="block text-sm font-medium text-gray-700 mb-1">
              Postal Code <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="postal_code"
              bind:value={address.postal_code}
              readonly={addressFromMapbox}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold {addressFromMapbox ? 'bg-gray-50 cursor-not-allowed' : ''}"
            />
          </div>

          <div>
            <label for="country" class="block text-sm font-medium text-gray-700 mb-1">
              Country <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="country"
              bind:value={address.country}
              readonly={addressFromMapbox}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold {addressFromMapbox ? 'bg-gray-50 cursor-not-allowed' : ''}"
            />
          </div>
        </div>
      </div>
    {/if}

    <div class="flex items-center">
      <input
        type="checkbox"
        id="is_default"
        bind:checked={address.is_default}
        class="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
      />
      <label for="is_default" class="ml-2 block text-sm text-gray-700">Set as default shipping address</label>
    </div>

    <div class="flex justify-end space-x-3 pt-4">
      <button
        type="button"
        on:click={handleCancel}
        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-4 py-2 bg-gold text-white rounded-sm hover:bg-gold-dark disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : (editMode ? 'Update Address' : 'Save Address')}
      </button>
    </div>
  </form>
</div>

<style>
  .bg-gold { background-color: #b8860b; }
  .hover\:bg-gold-dark:hover { background-color: #a67a09; }
  .text-gold { color: #b8860b; }
  .focus\:ring-gold:focus { --tw-ring-color: rgb(184 134 11); }

  /* Animation for fade in effect */
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
