<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let id: string = 'email';
  export let label: string = 'Email Address';
  export let value: string = '';
  export let placeholder: string = 'your@email.com';
  export let required: boolean = true;
  export let touched: boolean = false;
  export let valid: boolean = true;
  export let errorMessage: string = 'Please enter a valid email address';
  export let disabled: boolean = false;
  export let readonly: boolean = false;

  const dispatch = createEventDispatcher();

  // Validate email with a thorough regex
  function validateEmail(email: string): boolean {
    if (!email) return !required;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;

    if (touched) {
      valid = validateEmail(value);
    }

    dispatch('input', { value, valid });
    dispatch('resetError');
  }

  function handleBlur() {
    touched = true;
    valid = validateEmail(value);
    dispatch('blur', { value, touched, valid });
  }
</script>

<div class="form-field">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
      {label}{#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}

  <input
    {id}
    type="email"
    bind:value
    on:input={handleInput}
    on:blur={handleBlur}
    class="w-full px-3 py-2 border {touched && !valid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
    {placeholder}
    {required}
    {disabled}
    {readonly}
    autocomplete="email"
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
