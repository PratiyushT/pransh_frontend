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

  const dispatch = createEventDispatcher();

  const handleSubmit = async () => {
    try {
      isSubmitting = true;
      errorMessage = '';
      successMessage = '';

      // Validate form
      if (!address.street || !address.city || !address.postal_code || !address.country || !address.phone_number) {
        errorMessage = 'Please fill in all required fields';
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
    address.street = selectedAddress.street || '';
    address.city = selectedAddress.city || '';
    address.state = selectedAddress.state || '';
    address.postal_code = selectedAddress.postalCode || '';
    address.country = selectedAddress.country || 'United States';
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
      <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
      <AddressSearch on:addressSelected={handleAddressSelected} />
    </div>

    <div>
      <label for="street" class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
      <input
        type="text"
        id="street"
        bind:value={address.street}
        placeholder="Street address"
        class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </div>

    <div>
      <label for="phone_number" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
      <input
        type="tel"
        id="phone_number"
        bind:value={address.phone_number}
        placeholder="(555) 555-5555"
        class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input
          type="text"
          id="city"
          bind:value={address.city}
          class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label for="state" class="block text-sm font-medium text-gray-700 mb-1">State</label>
        <input
          type="text"
          id="state"
          bind:value={address.state}
          class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="postal_code" class="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
        <input
          type="text"
          id="postal_code"
          bind:value={address.postal_code}
          class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label for="country" class="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <input
          type="text"
          id="country"
          bind:value={address.country}
          class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>
    </div>

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
