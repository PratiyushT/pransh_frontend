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

  // Field interaction tracking
  let firstNameTouched = false;
  let lastNameTouched = false;
  let emailTouched = false;
  let passwordTouched = false;
  let confirmPasswordTouched = false;
  let termsTouched = false;

  // Password strength
  let passwordStrength = 0; // 0: none, 1: weak, 2: medium, 3: strong

  // Password visibility toggles
  let showPassword = false;
  let showConfirmPassword = false;

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    showPassword = !showPassword;
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    showConfirmPassword = !showConfirmPassword;
  };

  // Debounce timeout
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  // Validate email with a more thorough regex
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check password strength
  function checkPasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 1;
    // Complexity checks
    if (/[A-Z]/.test(password)) strength += 0.5;
    if (/[a-z]/.test(password)) strength += 0.5;
    if (/[0-9]/.test(password)) strength += 0.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 0.5;

    // Cap at 3
    return Math.min(Math.floor(strength), 3);
  }

  // Debounced validation to prevent excessive validation
  function debouncedValidation() {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(() => {
      // Validate fields if touched
      if (emailTouched) {
        isEmailValid = validateEmail(email);
      }

      if (passwordTouched) {
        passwordStrength = checkPasswordStrength(password);
        isPasswordValid = password.length >= 6;
      }

      if (confirmPasswordTouched && password) {
        isConfirmPasswordValid = confirmPassword === password;
      }

      // Reset error message if all valid
      if (formSubmitted && isFormValid) {
        errorMessage = '';
      }
    }, 300);
  }

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
      case 'password':
        passwordTouched = true;
        break;
      case 'confirmPassword':
        confirmPasswordTouched = true;
        break;
      case 'terms':
        termsTouched = true;
        break;
    }
    debouncedValidation();
  };

  // Address data
  let showAddressFields = false;
  let streetAddress = '';
  let city = '';
  let state = '';
  let zipCode = '';
  let country = '';

  // Address fields interaction tracking
  let streetAddressTouched = false;
  let cityTouched = false;
  let stateTouched = false;
  let zipCodeTouched = false;
  let countryTouched = false;

  // Country options
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia',
    'India', 'Germany', 'France', 'Japan', 'China', 'Brazil',
    'Other'
  ];

  // Form validation
  $: isFirstNameValid = !firstNameTouched || firstName.length > 1;
  $: isLastNameValid = !lastNameTouched || lastName.length > 1;
  $: isEmailValid = !emailTouched || validateEmail(email);
  $: isPasswordValid = !passwordTouched || password.length >= 6;
  $: isConfirmPasswordValid = !confirmPasswordTouched || password === confirmPassword;
  $: isTermsAccepted = !termsTouched || acceptTerms;
  $: passwordStrength = checkPasswordStrength(password);

  // Address validation
  $: isStreetAddressValid = !streetAddressTouched || !showAddressFields || streetAddress.length > 3;
  $: isCityValid = !cityTouched || !showAddressFields || city.length > 2;
  $: isStateValid = !stateTouched || !showAddressFields || state.length > 1;
  $: isZipCodeValid = !zipCodeTouched || !showAddressFields || zipCode.length > 3;
  $: isCountryValid = !countryTouched || !showAddressFields || country.length > 0;

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
    firstNameTouched = true;
    lastNameTouched = true;
    emailTouched = true;
    passwordTouched = true;
    confirmPasswordTouched = true;
    termsTouched = true;

    if (showAddressFields) {
      streetAddressTouched = true;
      cityTouched = true;
      stateTouched = true;
      zipCodeTouched = true;
      countryTouched = true;
    }

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
    debouncedValidation();
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

    // Cleanup function to clear any pending timeouts
    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
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
            on:blur={() => touchField('firstName')}
            class="w-full px-3 py-2 border {firstNameTouched && !isFirstNameValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
            placeholder="John"
            required
          >
          {#if firstNameTouched && !isFirstNameValid}
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
            on:blur={() => touchField('lastName')}
            class="w-full px-3 py-2 border {lastNameTouched && !isLastNameValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
            placeholder="Doe"
            required
          >
          {#if lastNameTouched && !isLastNameValid}
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
          on:blur={() => touchField('email')}
          class="w-full px-3 py-2 border {emailTouched && !isEmailValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
          placeholder="your@email.com"
          required
        >
        {#if emailTouched && !isEmailValid}
          <p class="mt-1 text-sm text-red-600">Please enter a valid email address</p>
        {/if}
      </div>

      <!-- Password field -->
      <div class="form-field">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <div class="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            bind:value={password}
            on:input={resetFieldError}
            on:blur={() => touchField('password')}
            class="w-full px-3 py-2 border {passwordTouched && !isPasswordValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
            placeholder="••••••••"
            required
          >
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold focus:outline-none transition-colors"
            on:click={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {#if showPassword}
              <!-- Hide password icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            {:else}
              <!-- Show password icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {/if}
          </button>
        </div>
        {#if passwordTouched && password}
          <!-- Password strength indicator -->
          <div class="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              class="strength-meter-bar {passwordStrength === 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-yellow-500' : passwordStrength === 3 ? 'bg-green-500' : ''}"
              style="width: {passwordStrength * 33.33}%;"
            ></div>
          </div>
          <p class="mt-1 text-xs {passwordStrength === 1 ? 'text-red-600' : passwordStrength === 2 ? 'text-yellow-600' : passwordStrength === 3 ? 'text-green-600' : 'text-gray-500'}">
            {#if passwordStrength === 0}
              Enter a password
            {:else if passwordStrength === 1}
              Weak password
            {:else if passwordStrength === 2}
              Medium strength
            {:else}
              Strong password
            {/if}
          </p>
          <ul class="mt-1 text-xs text-gray-500 list-disc pl-4">
            <li class="{password.length >= 8 ? 'text-green-600' : ''}">At least 8 characters</li>
            <li class="{/[A-Z]/.test(password) ? 'text-green-600' : ''}">At least one uppercase letter</li>
            <li class="{/[0-9]/.test(password) ? 'text-green-600' : ''}">At least one number</li>
            <li class="{/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}">At least one special character</li>
          </ul>
        {/if}
        {#if passwordTouched && !isPasswordValid}
          <p class="mt-1 text-sm text-red-600">Password must be at least 6 characters</p>
        {/if}
      </div>

      <!-- Confirm password field -->
      <div class="form-field">
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <div class="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            bind:value={confirmPassword}
            on:input={resetFieldError}
            on:blur={() => touchField('confirmPassword')}
            class="w-full px-3 py-2 border {confirmPasswordTouched && !isConfirmPasswordValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
            placeholder="••••••••"
            required
          >
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold focus:outline-none transition-colors"
            on:click={toggleConfirmPasswordVisibility}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {#if showConfirmPassword}
              <!-- Hide password icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            {:else}
              <!-- Show password icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {/if}
          </button>
        </div>
        {#if confirmPasswordTouched && !isConfirmPasswordValid}
          <p class="mt-1 text-sm text-red-600">Passwords do not match</p>
        {/if}
        {#if confirmPasswordTouched && confirmPassword && confirmPassword === password}
          <p class="mt-1 text-sm text-green-600">Passwords match</p>
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
              on:blur={() => streetAddressTouched = true}
              class="w-full px-3 py-2 border {streetAddressTouched && !isStreetAddressValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
              placeholder="123 Main St, Apt 4B"
              required={showAddressFields}
            >
            {#if streetAddressTouched && !isStreetAddressValid}
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
                on:blur={() => cityTouched = true}
                class="w-full px-3 py-2 border {cityTouched && !isCityValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
                placeholder="New York"
                required={showAddressFields}
              >
              {#if cityTouched && !isCityValid}
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
                on:blur={() => stateTouched = true}
                class="w-full px-3 py-2 border {stateTouched && !isStateValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
                placeholder="NY"
                required={showAddressFields}
              >
              {#if stateTouched && !isStateValid}
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
                on:blur={() => zipCodeTouched = true}
                class="w-full px-3 py-2 border {zipCodeTouched && !isZipCodeValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
                placeholder="10001"
                required={showAddressFields}
              >
              {#if zipCodeTouched && !isZipCodeValid}
                <p class="mt-1 text-sm text-red-600">Zip/Postal code is required</p>
              {/if}
            </div>

            <div class="form-field">
              <label for="country" class="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                id="country"
                bind:value={country}
                on:change={resetFieldError}
                on:blur={() => countryTouched = true}
                class="w-full px-3 py-2 border {countryTouched && !isCountryValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm bg-white"
                required={showAddressFields}
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
              on:change={() => touchField('terms')}
              class="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
              required
            >
          </div>
          <div class="ml-3 text-sm">
            <label for="terms" class="{termsTouched && !isTermsAccepted ? 'text-red-600' : 'text-gray-600'}">
              I agree to the <a href="/terms" class="text-gold hover:text-gold-dark underline">Terms of Service</a> and <a href="/privacy" class="text-gold hover:text-gold-dark underline">Privacy Policy</a>
            </label>
            {#if termsTouched && !isTermsAccepted}
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

  /* Password strength meter bar animation */
  .strength-meter-bar {
    transition: width 0.5s ease-in-out, background-color 0.5s ease-in-out;
    height: 100%;
  }

  /* Other animations */
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

  /* Add transition for password strength indicator */
  [transition\:slide] {
    transition: width 0.3s ease-in-out;
  }
</style>
