<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let id: string = '';
  export let label: string = '';
  export let type: string = 'text';
  export let value: string = '';
  export let placeholder: string = '';
  export let required: boolean = false;
  export let touched: boolean = false;
  export let valid: boolean = true;
  export let errorMessage: string = 'This field is required';
  export let disabled: boolean = false;
  export let readonly: boolean = false;
  export let autocomplete: string = '';
  export let optional: boolean = false;

  const dispatch = createEventDispatcher();

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    dispatch('input', { value });
    dispatch('resetError');
  }

  function handleBlur() {
    touched = true;
    dispatch('blur', { value, touched });
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
    {type}
    bind:value
    on:input={handleInput}
    on:blur={handleBlur}
    class="w-full px-3 py-2 border {touched && !valid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
    {placeholder}
    {required}
    {disabled}
    {readonly}
    autocomplete={autocomplete}
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
