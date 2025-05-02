<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let id: string = 'password';
  export let label: string = 'Password';
  export let value: string = '';
  export let placeholder: string = '••••••••';
  export let required: boolean = true;
  export let touched: boolean = false;
  export let valid: boolean = true;
  export let errorMessage: string = 'Password must be at least 6 characters';
  export let disabled: boolean = false;
  export let showStrengthIndicator: boolean = true;
  export let showRequirements: boolean = true;
  export let minLength: number = 6;
  export let isConfirmPassword: boolean = false;
  export let passwordToMatch: string = '';
  export let confirmErrorMessage: string = 'Passwords do not match';
  export let autocomplete: string = 'current-password';

  // Password visibility toggle
  let showPassword: boolean = false;
  let passwordStrength: number = 0;

  const dispatch = createEventDispatcher();

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  // Check password strength on a scale of 0-3
  function checkPasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 0.5;
    if (/[a-z]/.test(password)) strength += 0.5;
    if (/[0-9]/.test(password)) strength += 0.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 0.5;

    return Math.min(Math.floor(strength), 3);
  }

  // Validate password
  function validatePassword(password: string): boolean {
    // Basic validation - minimum length
    if (!password) return !required;
    if (password.length < minLength) return false;

    // For confirm password
    if (isConfirmPassword && password !== passwordToMatch) {
      return false;
    }

    return true;
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;

    // Check strength
    passwordStrength = checkPasswordStrength(value);

    // Validate
    if (touched) {
      valid = validatePassword(value);
    }

    dispatch('input', { value, valid, strength: passwordStrength });
    dispatch('resetError');
  }

  function handleBlur() {
    touched = true;
    valid = validatePassword(value);
    dispatch('blur', { value, touched, valid, strength: passwordStrength });
  }

  // Reactive validation for confirm password
  $: if (isConfirmPassword && touched) {
    valid = (value === passwordToMatch);
  }

  // Update strength when value changes
  $: passwordStrength = checkPasswordStrength(value);
</script>

<div class="form-field">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
      {label}{#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}

  <div class="relative">
    <input
      {id}
      type={showPassword ? "text" : "password"}
      bind:value
      on:input={handleInput}
      on:blur={handleBlur}
      class="w-full px-3 py-2 border {touched && !valid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
      {placeholder}
      {required}
      {disabled}
      autocomplete={autocomplete}
    />
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold focus:outline-none transition-colors"
      on:click={togglePasswordVisibility}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {#if showPassword}
        <!-- Hide password icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59"/>
        </svg>
      {:else}
        <!-- Show password icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      {/if}
    </button>
  </div>

  <!-- Show error message for invalid input -->
  {#if touched && !valid}
    <p class="mt-1 text-sm text-red-600">
      {isConfirmPassword ? confirmErrorMessage : errorMessage}
    </p>
  {/if}

  <!-- Show success message for confirm password -->
  {#if isConfirmPassword && touched && valid && value}
    <p class="mt-1 text-sm text-green-600">Passwords match</p>
  {/if}

  <!-- Password strength meter -->
  {#if !isConfirmPassword && showStrengthIndicator && touched && value}
    <div class="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
      <div
        class="strength-meter-bar {
          passwordStrength === 1 ? 'bg-red-500' :
          passwordStrength === 2 ? 'bg-yellow-500' :
          passwordStrength === 3 ? 'bg-green-500' : ''
        }"
        style="width: {passwordStrength * 33.33}%;"
      ></div>
    </div>
    <p class="mt-1 text-xs {
      passwordStrength === 1 ? 'text-red-600' :
      passwordStrength === 2 ? 'text-yellow-600' :
      passwordStrength === 3 ? 'text-green-600' : 'text-gray-500'
    }">
      {#if passwordStrength === 0} Enter a password
      {:else if passwordStrength === 1} Weak password
      {:else if passwordStrength === 2} Medium strength
      {:else} Strong password
      {/if}
    </p>
  {/if}

  <!-- Password requirements checklist -->
  {#if !isConfirmPassword && showRequirements && touched && value}
    <ul class="mt-1 text-xs text-gray-500 list-disc pl-4">
      <li class="{value.length >= 8 ? 'text-green-600' : ''}">At least 8 characters</li>
      <li class="{/[A-Z]/.test(value) ? 'text-green-600' : ''}">At least one uppercase letter</li>
      <li class="{/[0-9]/.test(value) ? 'text-green-600' : ''}">At least one number</li>
      <li class="{/[^A-Za-z0-9]/.test(value) ? 'text-green-600' : ''}">At least one special character</li>
    </ul>
  {/if}
</div>

<style>
  /* Add component styles */
  .focus\:border-gold:focus { border-color: #b8860b; }
  .focus\:ring-gold\/20:focus { --tw-ring-color: rgb(184 134 11 / 0.2); }

  .strength-meter-bar {
    height: 100%;
    transition: width 0.3s ease;
  }
</style>
