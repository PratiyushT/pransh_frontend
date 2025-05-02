<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let id: string = 'phoneNumber';
  export let label: string = 'Phone Number';
  export let value: string = '';
  export let placeholder: string = '(555) 555-5555';
  export let required: boolean = false;
  export let touched: boolean = false;
  export let valid: boolean = true;
  export let disabled: boolean = false;
  export let optional: boolean = false;

  let errorMessage: string = '';

  const dispatch = createEventDispatcher();

  // Format phone number as user types
  function formatPhoneNumber(input: string): string {
    if (!input) return '';

    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');

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

    // For longer numbers (international), just keep as is
    return input;
  }

  // Validate phone number
  function validatePhoneNumber(phone: string): boolean {
    if (!phone) {
      return !required;
    }

    // Remove all non-numeric characters for validation
    const digits = phone.replace(/\D/g, '');

    // Basic validation: 10-15 digits (international numbers can be longer)
    if (digits.length < 10 || digits.length > 15) {
      errorMessage = 'Phone number must have 10-15 digits';
      return false;
    }

    // US format validation
    const usPhoneRegex = /^(\+?1)?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})$/;
    if (!usPhoneRegex.test(phone) && digits.length === 10) {
      errorMessage = 'Format should be (555) 555-5555 or similar';
      return false;
    }

    errorMessage = '';
    return true;
  }

  // Handle phone number input
  function handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    touched = true;

    // Format the phone number
    const formattedNumber = formatPhoneNumber(input.value);
    value = formattedNumber;

    // Validate
    valid = validatePhoneNumber(value);

    dispatch('input', { value, valid });
    dispatch('resetError');
  }

  function handleBlur() {
    touched = true;
    valid = validatePhoneNumber(value);
    dispatch('blur', { value, touched, valid });
  }
</script>

<div class="form-field">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {#if required}<span class="text-red-500">*</span>
      {:else if optional}<span class="text-gray-400 text-xs">(Optional)</span>{/if}
    </label>
  {/if}

  <input
    {id}
    type="tel"
    value={value}
    on:input={handleInput}
    on:blur={handleBlur}
    class="w-full px-3 py-2 border {touched && !valid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
    {placeholder}
    {required}
    {disabled}
    autocomplete="tel"
  />

  {#if touched && !valid}
    <p class="mt-1 text-sm text-red-600">{errorMessage}</p>
  {/if}
</div>

<style>
  /* Add component styles */
  .focus\:border-gold:focus { border-color: #b8860b; }
  .focus\:ring-gold\/20:focus { --tw-ring-color: rgb(184 134 11 / 0.2); }
</style>
