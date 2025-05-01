<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import gsap from 'gsap';
  import AddressSearch from '$lib/components/AddressSearch.svelte';
  import { signUp } from '$lib/auth/auth';

  // Form data
  let firstName = '';
  let lastName = '';
  let email = '';
  let phoneNumber = '';
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

  // For phone number validation
  let phoneNumberTouched = false;
  let phoneNumberError = '';

  // Password strength & visibility
  let passwordStrength = 0;
  let showPassword = false;
  let showConfirmPassword = false;

  const togglePasswordVisibility = () => showPassword = !showPassword;
  const toggleConfirmPasswordVisibility = () => showConfirmPassword = !showConfirmPassword;

  // Debounce helper
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  function debouncedValidation() {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (emailTouched)    isEmailValid = validateEmail(email);
      if (passwordTouched) {
        passwordStrength = checkPasswordStrength(password);
        isPasswordValid = password.length >= 6;
      }
      if (confirmPasswordTouched && password)
        isConfirmPasswordValid = confirmPassword === password;
      if (phoneNumberTouched)
        validatePhoneNumber(phoneNumber);
      if (formSubmitted && isFormValid)
        errorMessage = '';
    }, 300);
  }

  // Simple validators
  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Phone number validation
  function validatePhoneNumber(phone: string) {
    if (!phone) {
      phoneNumberError = '';
      return true; // Phone is optional in registration
    }
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
    phoneNumber = formattedNumber;
    // Reset error field
    resetFieldError();
  }

  function checkPasswordStrength(p: string) {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s += 1;
    if (/[A-Z]/.test(p)) s += 0.5;
    if (/[a-z]/.test(p)) s += 0.5;
    if (/[0-9]/.test(p)) s += 0.5;
    if (/[^A-Za-z0-9]/.test(p)) s += 0.5;
    return Math.min(Math.floor(s), 3);
  }

  const touchField = (field: string) => {
    switch(field) {
      case 'firstName': firstNameTouched = true; break;
      case 'lastName':  lastNameTouched = true;  break;
      case 'email':     emailTouched = true;     break;
      case 'password':  passwordTouched = true;  break;
      case 'confirmPassword': confirmPasswordTouched = true; break;
      case 'terms':     termsTouched = true;     break;
      case 'phoneNumber': phoneNumberTouched = true; break;
    }
    debouncedValidation();
  };

  // Address state
  let showAddressFields = false;
  let showManualAddressForm = false;
  let streetAddress = '';
  let city = '';
  let state = '';
  let zipCode = '';
  let country = 'United States';
  let addressSelected = false;
  let addressFromMapbox = false;

  // Address interaction
  let streetAddressTouched = false;
  let cityTouched = false;
  let stateTouched = false;
  let zipCodeTouched = false;
  let countryTouched = false;

  const countries = [
    'United States','Canada','United Kingdom','Australia',
    'India','Germany','France','Japan','China','Brazil','Other'
  ];

  function handleAddressSelected(event: CustomEvent) {
    const addr = event.detail;
    streetAddress = addr.addressLine1;
    city          = addr.city;
    state         = addr.state;
    zipCode       = addr.postalCode;
    country       = addr.country;
    streetAddressTouched = cityTouched = stateTouched = zipCodeTouched = countryTouched = true;
    addressSelected = true;
    addressFromMapbox = true;
    resetFieldError();
  }
  function handleAddressCleared() {
    addressSelected = addressFromMapbox = false;
  }
  const handleShowManualEntry = () => showManualAddressForm = true;
  const enableManualEdit = () => addressFromMapbox = false;
  const toggleAddressFields = () => {
    showAddressFields = !showAddressFields;
    if (!showAddressFields && formSubmitted) resetFieldError();
  };

  // Reactive validity flags
  $: isFirstNameValid       = !firstNameTouched      || firstName.length > 1;
  $: isLastNameValid        = !lastNameTouched       || lastName.length > 1;
  $: isEmailValid           = !emailTouched          || validateEmail(email);
  $: isPasswordValid        = !passwordTouched       || password.length >= 6;
  $: isConfirmPasswordValid = !confirmPasswordTouched|| confirmPassword === password;
  $: isTermsAccepted        = !termsTouched          || acceptTerms;

  $: isStreetAddressValid   = !streetAddressTouched  || !showAddressFields || streetAddress.length > 3;
  $: isCityValid            = !cityTouched           || !showAddressFields || city.length > 2;
  $: isStateValid           = !stateTouched          || !showAddressFields || state.length > 1;
  $: isZipCodeValid         = !zipCodeTouched        || !showAddressFields || zipCode.length > 3;
  $: isCountryValid         = !countryTouched        || !showAddressFields || country.length > 0;

  // Update isPhoneNumberValid to use the validatePhoneNumber function
  $: isPhoneNumberValid = !phoneNumberTouched || (phoneNumber ? validatePhoneNumber(phoneNumber) : true);

  $: isFormValid = firstName && lastName && email && password && confirmPassword &&
                   password === confirmPassword && acceptTerms &&
                   isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid &&
                   (!showAddressFields || (isStreetAddressValid && isCityValid && isStateValid &&
                                          isZipCodeValid && isCountryValid && (phoneNumber && phoneNumber.length > 0 ? isPhoneNumberValid : true)));

  // Reset errors on input
  const resetFieldError = () => {
    if (formSubmitted) errorMessage = '';
    debouncedValidation();
  };

  // Update handleSubmit to validate phone number before submission
  async function handleSubmit() {
    formSubmitted = true;
    firstNameTouched = lastNameTouched = emailTouched = passwordTouched = confirmPasswordTouched = termsTouched = phoneNumberTouched = true;
    if (showAddressFields) streetAddressTouched = cityTouched = stateTouched = zipCodeTouched = countryTouched = true;

    // Validate phone number if provided
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      errorMessage = phoneNumberError || 'Please provide a valid phone number';
      return;
    }

    if (!isFormValid) {
      errorMessage = 'Please fix the errors in the form';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      // 1️⃣ Sign up — store all metadata
      const data = await signUp({
        email,
        password,
        firstName,
        lastName,
        address: showAddressFields ? {
          street: streetAddress,
          city,
          state,
          postalCode: zipCode,
          country,
          phoneNumber: phoneNumber || ''
        } : undefined
      });

      console.log(data)
      // 🚨 Check if session already exists (means user is already registered and verified)
      if (data?.user && data?.user.identities?.length === 0) {
        errorMessage = 'An account with this email already exists. Please Log in or use a different email.';
        return;
      }
      // 2️⃣ After signup success → Show success and redirect to verification page
      formSubmitted = false;
      goto('/account/verify-email');
    } catch (e: any) {
      errorMessage = e.message || 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  // Animate in
  onMount(() => {
    const tl = gsap.timeline();
    tl.from('.register-container', { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out' });
    tl.from('.form-field',       { y: 10, opacity: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out' }, '-=0.2');
    tl.from('.form-actions',     { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
    return () => { if (debounceTimeout) clearTimeout(debounceTimeout); };
  });
</script>

<svelte:head>
  <title>Create Account | Pransh</title>
  <meta name="description" content="Create your Pransh account to enjoy personalized shopping, faster checkout, and exclusive promotions.">
</svelte:head>

<div class="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4">
  <div class="register-container max-w-lg w-full bg-white p-8 md:p-10 shadow-sm rounded-sm">
    <div class="text-center mb-8">
      <img src="/images/Website-logo-gold-svg.svg" alt="Pransh Logo" class="h-12 mx-auto mb-4">
      <h1 class="text-2xl font-serif text-gray-800">Create Account</h1>
    </div>

    {#if errorMessage}
      <div class="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-sm">
        {errorMessage}
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <!-- Name grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-field">
          <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            id="firstName"
            type="text"
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
        <div class="form-field">
          <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            id="lastName"
            type="text"
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
      <div class="text-xs text-gray-500 mb-2">
        Please use your real name for shipping and account verification purposes.
      </div>

      <!-- Email -->
      <div class="form-field">
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          id="email"
          type="email"
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

      <!-- Phone Number with validation -->
      <div class="form-field">
        <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span class="text-gray-400 text-xs">(Optional)</span>
        </label>
        <input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          on:input={handlePhoneInput}
          on:blur={() => touchField('phoneNumber')}
          class="w-full px-3 py-2 border {phoneNumberTouched && !isPhoneNumberValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
          placeholder="(555) 555-5555"
        >
        {#if phoneNumberTouched && phoneNumberError}
          <p class="mt-1 text-sm text-red-600">{phoneNumberError}</p>
        {/if}
      </div>

      <!-- Password -->
      <div class="form-field">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <div class="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            bind:value={password}
            on:input={resetFieldError}
            on:blur={() => touchField('password')}
            class="w-full px-3 py-2 border {passwordTouched && !isPasswordValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
            placeholder="••••••••"
            required
          >
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold focus:outline-none transition-colors" on:click={togglePasswordVisibility}>
            {#if showPassword}
              <!-- hide icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59"/></svg>
            {:else}
              <!-- show icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            {/if}
          </button>
        </div>
        {#if passwordTouched}
          <div class="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div class="strength-meter-bar {passwordStrength === 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-yellow-500' : passwordStrength === 3 ? 'bg-green-500' : ''}" style="width: {passwordStrength * 33.33}%;"></div>
          </div>
          <p class="mt-1 text-xs {passwordStrength === 1 ? 'text-red-600' : passwordStrength === 2 ? 'text-yellow-600' : passwordStrength === 3 ? 'text-green-600' : 'text-gray-500'}">
            {#if passwordStrength === 0} Enter a password
            {:else if passwordStrength === 1} Weak password
            {:else if passwordStrength === 2} Medium strength
            {:else} Strong password {/if}
          </p>
          <ul class="mt-1 text-xs text-gray-500 list-disc pl-4">
            <li class="{password.length >= 8 ? 'text-green-600' : ''}">At least 8 characters</li>
            <li class="{/[A-Z]/.test(password) ? 'text-green-600' : ''}">At least one uppercase letter</li>
            <li class="{/[0-9]/.test(password) ? 'text-green-600' : ''}">At least one number</li>
            <li class="{/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}">At least one special character</li>
          </ul>
          {#if passwordTouched && !isPasswordValid}
            <p class="mt-1 text-sm text-red-600">Password must be at least 6 characters</p>
          {/if}
        {/if}
      </div>

      <!-- Confirm Password -->
      <div class="form-field">
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <div class="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            bind:value={confirmPassword}
            on:input={resetFieldError}
            on:blur={() => touchField('confirmPassword')}
            class="w-full px-3 py-2 border {confirmPasswordTouched && !isConfirmPasswordValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
            placeholder="••••••••"
            required
          >
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold focus:outline-none transition-colors" on:click={toggleConfirmPasswordVisibility}>
            {#if showConfirmPassword}
              <!-- hide icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59"/></svg>
            {:else}
              <!-- show icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            {/if}
          </button>
        </div>
        {#if confirmPasswordTouched && !isConfirmPasswordValid}
          <p class="mt-1 text-sm text-red-600">Passwords do not match</p>
        {/if}
        {#if confirmPasswordTouched && confirmPassword === password}
          <p class="mt-1 text-sm text-green-600">Passwords match</p>
        {/if}
      </div>

      <!-- Address toggle -->
      <div class="form-field">
        <button type="button" class="text-gold hover:text-gold-dark flex items-center text-sm font-medium transition-colors" on:click={toggleAddressFields}>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={showAddressFields ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
          </svg>
          {showAddressFields ? 'Hide Shipping Address' : 'Add Shipping Address'}
        </button>
      </div>

      {#if showAddressFields}
        <div class="address-fields space-y-6 border-t border-b border-gray-200 py-6 mt-4 animate-fade-in">
          <div class="form-field">
            <AddressSearch
              on:addressSelected={handleAddressSelected}
              on:addressCleared={handleAddressCleared}
              on:showManualEntry={handleShowManualEntry}
            />
          </div>

          {#if showManualAddressForm || addressSelected}
            <div class="form-field animate-fade-in">
              {#if addressFromMapbox}
                <div class="mapbox-selection-notice">
                  <div class="mapbox-notice-content">
                    <p>Address selected from search</p>
                    <button type="button" class="edit-address-btn" on:click={enableManualEdit}>Edit address manually</button>
                  </div>
                </div>
              {/if}
              <label for="streetAddress" class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                id="streetAddress"
                type="text"
                bind:value={streetAddress}
                on:input={resetFieldError}
                on:blur={() => streetAddressTouched = true}
                readonly={addressFromMapbox}
                required={showAddressFields}
                class="w-full px-3 py-2 border {streetAddressTouched && !isStreetAddressValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm {addressFromMapbox ? 'input-readonly' : ''}"
                placeholder="123 Main St, Apt 4B"
              >
              {#if streetAddressTouched && !isStreetAddressValid}
                <p class="mt-1 text-sm text-red-600">Please enter a valid street address</p>
              {/if}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div class="form-field">
                <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  id="city"
                  type="text"
                  bind:value={city}
                  on:input={resetFieldError}
                  on:blur={() => cityTouched = true}
                  readonly={addressFromMapbox}
                  required={showAddressFields}
                  class="w-full px-3 py-2 border {cityTouched && !isCityValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm {addressFromMapbox ? 'input-readonly' : ''}"
                  placeholder="New York"
                >
                {#if cityTouched && !isCityValid}
                  <p class="mt-1 text-sm text-red-600">City is required</p>
                {/if}
              </div>
              <div class="form-field">
                <label for="state" class="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                <input
                  id="state"
                  type="text"
                  bind:value={state}
                  on:input={resetFieldError}
                  on:blur={() => stateTouched = true}
                  readonly={addressFromMapbox}
                  required={showAddressFields}
                  class="w-full px-3 py-2 border {stateTouched && !isStateValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm {addressFromMapbox ? 'input-readonly' : ''}"
                  placeholder="NY"
                >
                {#if stateTouched && !isStateValid}
                  <p class="mt-1 text-sm text-red-600">State/Province is required</p>
                {/if}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div class="form-field">
                <label for="zipCode" class="block text-sm font-medium text-gray-700 mb-1">Zip/Postal Code</label>
                <input
                  id="zipCode"
                  type="text"
                  bind:value={zipCode}
                  on:input={resetFieldError}
                  on:blur={() => zipCodeTouched = true}
                  readonly={addressFromMapbox}
                  required={showAddressFields}
                  class="w-full px-3 py-2 border {zipCodeTouched && !isZipCodeValid ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm {addressFromMapbox ? 'input-readonly' : ''}"
                  placeholder="10001"
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
                  disabled={addressFromMapbox}
                  required={showAddressFields}
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

            <!-- Mandatory Phone Number for Shipping Address -->
            <div class="form-field animate-fade-in">
              <label for="shippingPhoneNumber" class="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span class="text-red-500">*</span>
              </label>
              <input
                id="shippingPhoneNumber"
                type="tel"
                value={phoneNumber}
                on:input={handlePhoneInput}
                on:blur={() => {
                  phoneNumberTouched = true;
                  streetAddressTouched = true;
                  debouncedValidation();
                }}
                required={showAddressFields}
                class="w-full px-3 py-2 border {streetAddressTouched && (!phoneNumber || !isPhoneNumberValid) && showAddressFields ? 'border-red-300' : 'border-gray-300'} focus:border-gold focus:ring focus:ring-gold/20 outline-none transition rounded-sm"
                placeholder="(555) 555-5555"
              >
              {#if streetAddressTouched && (!phoneNumber || !isPhoneNumberValid) && showAddressFields}
                <p class="mt-1 text-sm text-red-600">{phoneNumberError || 'Phone number is required for shipping'}</p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Terms -->
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

      <!-- Actions -->
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

      <!-- Sign In Link -->
      <div class="text-center text-sm mt-6">
        <span class="text-gray-600">Already have an account?</span>
        <a href="/account/login" class="text-gold hover:text-gold-dark ml-1 transition-colors">Sign In</a>
      </div>
    </form>
  </div>

  <div class="mt-8">
    <a href="/" class="text-sm text-gray-600 hover:text-gold transition-colors flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Return to Shopping
    </a>
  </div>
</div>

<style>
  /* (all your existing styles unchanged) */
  .text-gold { color: #b8860b; }
  .bg-gold { background-color: #b8860b; }
  .border-gold { border-color: #b8860b; }
  .hover\:bg-gold-dark:hover { background-color: #a67a09; }
  .hover\:text-gold-dark:hover { color:#a67a09; }
  .focus\:border-gold:focus { border-color: #b8860b; }
  .focus\:ring-gold\/20:focus { --tw-ring-color: rgb(184 134 11 / 0.2); }
  .strength-meter-bar { transition: width 0.5s ease-in-out, background-color 0.5s ease-in-out; height: 100%; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .animate-spin { animation: spin 1s linear infinite; }
  .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  .input-readonly { background-color: #f8f8f8; cursor: not-allowed; opacity: 0.8; border-color: #e2e8f0 !important; }
  .mapbox-selection-notice { margin-bottom:1rem; padding:0.75rem; background-color:#f0f9ff; border:1px solid #bae6fd; border-radius:0.375rem; }
  .mapbox-notice-content { display:flex; justify-content:space-between; align-items:center; }
  .mapbox-notice-content p { font-size:0.875rem; color:#0284c7; margin:0; }
  .edit-address-btn { font-size:0.75rem; color:#0284c7; background:none; border:none; padding:0; text-decoration:underline; cursor:pointer; }
  .edit-address-btn:hover { color:#0369a1; }
</style>
