<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import gsap from 'gsap';

  // Form data
  let firstName = '';
  let lastName = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let acceptTerms = false;
  let isLoading = false;
  let errorMessage = '';
  let formSubmitted = false;

  // Address data
  let showAddressFields = false;
  let streetAddress = '';
  let city = '';
  let state = '';
  let zipCode = '';
  let country = '';

  // Country options
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia',
    'India', 'Germany', 'France', 'Japan', 'China', 'Brazil',
    'Other'
  ];

  // Form validation
  $: isFirstNameValid = !formSubmitted || firstName.length > 1;
  $: isLastNameValid = !formSubmitted || lastName.length > 1;
  $: isEmailValid = !formSubmitted || (email.includes('@') && email.includes('.'));
  $: isPasswordValid = !formSubmitted || password.length >= 6;
  $: isConfirmPasswordValid = !formSubmitted || password === confirmPassword;
  $: isTermsAccepted = !formSubmitted || acceptTerms;

  // Address validation
  $: isStreetAddressValid = !formSubmitted || !showAddressFields || streetAddress.length > 3;
  $: isCityValid = !formSubmitted || !showAddressFields || city.length > 2;
  $: isStateValid = !formSubmitted || !showAddressFields || state.length > 1;
  $: isZipCodeValid = !formSubmitted || !showAddressFields || zipCode.length > 3;
  $: isCountryValid = !formSubmitted || !showAddressFields || country.length > 0;

  $: isFormValid = firstName && lastName && email && password && confirmPassword &&
                password === confirmPassword && acceptTerms &&
                isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid &&
                (!showAddressFields || (isStreetAddressValid && isCityValid && isStateValid && isZipCodeValid && isCountryValid));

  // Toggle address fields visibility
  const toggleAddressFields = () => {
    showAddressFields = !showAddressFields;

    // If closing address section and there was an error, reset the fields
    if (!showAddressFields && formSubmitted) {
      resetFieldError();
    }
  };

  // Handle registration form submission
  const handleSubmit = async () => {
    formSubmitted = true;

    if (!isFormValid) {
      errorMessage = 'Please fix the errors in the form';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, you would make an API call here to register
      // For demonstration, we're just simulating success

      // Mock successful registration
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', `${firstName} ${lastName}`);

      // Store address if provided
      if (showAddressFields) {
        localStorage.setItem('userAddress', JSON.stringify({
          street: streetAddress,
          city,
          state,
          zipCode,
          country
        }));
      }

      // Navigate to account page after registration
      goto('/account');

    } catch (error) {
      console.error('Registration error:', error);
      errorMessage = 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
    }
  };

  // Reset form error when fields change
  const resetFieldError = () => {
    if (formSubmitted) {
      errorMessage = '';
    }
  };

  // Page animation
  onMount(() => {
    const timeline = gsap.timeline();

    timeline.from('.register-container', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out'
    });

    timeline.from('.form-field', {
      y: 10,
      opacity: 0,
      stagger: 0.1,
      duration: 0.4,
      ease: 'power2.out'
    }, '-=0.2');

    timeline.from('.form-actions', {
      y: 10,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out'
    }, '-=0.2');
  });
</script>

<svelte:head>
  <title>Create Account | Pransh</title>
  <meta name="description" content="Create your Pransh account to enjoy personalized shopping, faster checkout, and exclusive promotions.">
</svelte:head>

<div class="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4">
  <div class="register-container max-w-lg w-full bg-white p-8 md:p-10 shadow-sm rounded-sm">
    <!-- Logo -->
    <div class="text-center mb-8">
      <img src="/images/Website-logo-gold-svg.svg" alt="Pransh Logo" class="h-12 mx-auto mb-4">
      <h1 class="text-2xl font-serif text-gray-800">Create Account</h1>
    </div>

    <!-- Error message -->
    {#if errorMessage}
      <div class="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-sm">
        {errorMessage}
      </div>
    {/if}

    <!-- Registration form -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <!-- Name fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- First name field -->
        <div class="form-field">
          <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            id="firstName"
            bind:value={firstName}
            on:input={resetFieldError}
            class="w-full px-3 py-2 border {!isFirstNameValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
            placeholder="John"
            required
          >
          {#if !isFirstNameValid}
            <p class="mt-1 text-sm text-red-600">First name is required</p>
          {/if}
        </div>

        <!-- Last name field -->
        <div class="form-field">
          <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            id="lastName"
            bind:value={lastName}
            on:input={resetFieldError}
            class="w-full px-3 py-2 border {!isLastNameValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
            placeholder="Doe"
            required
          >
          {#if !isLastNameValid}
            <p class="mt-1 text-sm text-red-600">Last name is required</p>
          {/if}
        </div>
      </div>

      <!-- Email field -->
      <div class="form-field">
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          on:input={resetFieldError}
          class="w-full px-3 py-2 border {!isEmailValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
          placeholder="your@email.com"
          required
        >
        {#if !isEmailValid}
          <p class="mt-1 text-sm text-red-600">Please enter a valid email address</p>
        {/if}
      </div>

      <!-- Password field -->
      <div class="form-field">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          on:input={resetFieldError}
          class="w-full px-3 py-2 border {!isPasswordValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
          placeholder="••••••••"
          required
        >
        {#if !isPasswordValid}
          <p class="mt-1 text-sm text-red-600">Password must be at least 6 characters</p>
        {/if}
      </div>

      <!-- Confirm password field -->
      <div class="form-field">
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          bind:value={confirmPassword}
          on:input={resetFieldError}
          class="w-full px-3 py-2 border {!isConfirmPasswordValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
          placeholder="••••••••"
          required
        >
        {#if !isConfirmPasswordValid}
          <p class="mt-1 text-sm text-red-600">Passwords do not match</p>
        {/if}
      </div>

      <!-- Address toggle -->
      <div class="form-field">
        <button
          type="button"
          class="text-gold hover:text-gold-dark flex items-center text-sm font-medium transition-colors"
          on:click={toggleAddressFields}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={showAddressFields ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
          </svg>
          {showAddressFields ? 'Hide Shipping Address' : 'Add Shipping Address'}
        </button>
      </div>

      {#if showAddressFields}
        <div class="address-fields space-y-6 border-t border-b border-gray-200 py-6 mt-4 animate-fade-in">
          <!-- Street Address -->
          <div class="form-field">
            <label for="streetAddress" class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              id="streetAddress"
              bind:value={streetAddress}
              on:input={resetFieldError}
              class="w-full px-3 py-2 border {!isStreetAddressValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
              placeholder="123 Main St, Apt 4B"
              required={showAddressFields}
            >
            {#if !isStreetAddressValid}
              <p class="mt-1 text-sm text-red-600">Please enter a valid street address</p>
            {/if}
          </div>

          <!-- City and State -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-field">
              <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                id="city"
                bind:value={city}
                on:input={resetFieldError}
                class="w-full px-3 py-2 border {!isCityValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
                placeholder="New York"
                required={showAddressFields}
              >
              {#if !isCityValid}
                <p class="mt-1 text-sm text-red-600">City is required</p>
              {/if}
            </div>

            <div class="form-field">
              <label for="state" class="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                id="state"
                bind:value={state}
                on:input={resetFieldError}
                class="w-full px-3 py-2 border {!isStateValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
                placeholder="NY"
                required={showAddressFields}
              >
              {#if !isStateValid}
                <p class="mt-1 text-sm text-red-600">State/Province is required</p>
              {/if}
            </div>
          </div>

          <!-- Zip and Country -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-field">
              <label for="zipCode" class="block text-sm font-medium text-gray-700 mb-1">Zip/Postal Code</label>
              <input
                type="text"
                id="zipCode"
                bind:value={zipCode}
                on:input={resetFieldError}
                class="w-full px-3 py-2 border {!isZipCodeValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
                placeholder="10001"
                required={showAddressFields}
              >
              {#if !isZipCodeValid}
                <p class="mt-1 text-sm text-red-600">Zip/Postal code is required</p>
              {/if}
            </div>

            <div class="form-field">
              <label for="country" class="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                id="country"
                bind:value={country}
                on:change={resetFieldError}
                class="w-full px-3 py-2 border {!isCountryValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm bg-white"
                required={showAddressFields}
              >
                <option value="">Select Country</option>
                {#each countries as countryOption}
                  <option value={countryOption}>{countryOption}</option>
                {/each}
              </select>
              {#if !isCountryValid}
                <p class="mt-1 text-sm text-red-600">Country is required</p>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Terms and conditions -->
      <div class="form-field">
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="terms"
              type="checkbox"
              bind:checked={acceptTerms}
              class="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
              required
            >
          </div>
          <div class="ml-3 text-sm">
            <label for="terms" class="{!isTermsAccepted ? 'text-red-600' : 'text-gray-600'}">
              I agree to the <a href="/terms" class="text-gold hover:text-gold-dark underline">Terms of Service</a> and <a href="/privacy" class="text-gold hover:text-gold-dark underline">Privacy Policy</a>
            </label>
            {#if !isTermsAccepted}
              <p class="mt-1 text-sm text-red-600">You must accept the terms and conditions</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Form actions -->
      <div class="form-actions">
        <button
          type="submit"
          disabled={isLoading}
          class="w-full bg-gold hover:bg-gold-dark text-white py-2.5 px-4 rounded-sm transition-colors duration-300 flex justify-center"
        >
          {#if isLoading}
            <span class="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            Creating Account...
          {:else}
            Create Account
          {/if}
        </button>
      </div>

      <!-- Sign in link -->
      <div class="text-center text-sm mt-6">
        <span class="text-gray-600">Already have an account?</span>
        <a href="/account/login" class="text-gold hover:text-gold-dark ml-1 transition-colors">
          Sign In
        </a>
      </div>
    </form>
  </div>

  <!-- Return to shopping -->
  <div class="mt-8">
    <a
      href="/"
      class="text-sm text-gray-600 hover:text-gold transition-colors flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Return to Shopping
    </a>
  </div>
</div>

<style>
  /* Add gold color classes if they don't exist in the project */
  .text-gold {
    color: #b8860b;
  }

  .bg-gold {
    background-color: #b8860b;
  }

  .border-gold {
    border-color: #b8860b;
  }

  .hover\:bg-gold-dark:hover {
    background-color: #a67a09;
  }

  .hover\:text-gold-dark:hover {
    color: #a67a09;
  }

  .focus\:border-gold:focus {
    border-color: #b8860b;
  }

  .focus\:ring-gold\/20:focus {
    --tw-ring-color: rgb(184 134 11 / 0.2);
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
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
