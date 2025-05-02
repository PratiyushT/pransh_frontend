<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import gsap from 'gsap';
  import AddressForm from '$lib/components/FormElements/AddressForm.svelte';
  import { signUp } from '$lib/supabase/auth';
  import { Input, PhoneInput, EmailInput, PasswordInput, FormGroup } from '$lib/components/FormElements';

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
  let phoneNumberTouched = false;

  // Password strength & visibility
  let passwordStrength = 0;

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
      if (formSubmitted && isFormValid)
        errorMessage = '';
    }, 300);
  }

  // Simple validators
  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  // Address data
  let addressData = {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phoneNumber: ''
  };

  // Reset errors on input
  const resetFieldError = () => {
    if (formSubmitted) errorMessage = '';
    debouncedValidation();
  };

  // Handle address toggle
  function handleAddressToggle(event: CustomEvent) {
    showAddressFields = event.detail.show;
    if (!showAddressFields && formSubmitted) resetFieldError();
  }

  // Address form validity
  let isAddressFormValid = true;

  function handleAddressFormValidityChange(event: CustomEvent) {
    isAddressFormValid = event.detail.valid;
  }

  // Handle address changes
  function handleAddressChange(event: CustomEvent) {
    addressData = event.detail.addressData;
  }

  // Reactive validity flags
  $: isFirstNameValid = !firstNameTouched || firstName.length > 1;
  $: isLastNameValid = !lastNameTouched || lastName.length > 1;
  $: isEmailValid = !emailTouched || validateEmail(email);
  $: isPasswordValid = !passwordTouched || password.length >= 6;
  $: isConfirmPasswordValid = !confirmPasswordTouched || confirmPassword === password;
  $: isTermsAccepted = !termsTouched || acceptTerms;
  $: isPhoneNumberValid = !phoneNumberTouched || true; // We'll use the component's validation

  $: isFormValid = firstName && lastName && email && password && confirmPassword &&
                   password === confirmPassword && acceptTerms &&
                   isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid &&
                   (!showAddressFields || isAddressFormValid);

  async function handleSubmit() {
    formSubmitted = true;
    firstNameTouched = lastNameTouched = emailTouched = passwordTouched = confirmPasswordTouched = termsTouched = phoneNumberTouched = true;

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
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          postalCode: addressData.postalCode,
          country: addressData.country,
          phoneNumber: addressData.phoneNumber || phoneNumber || ''
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
      <FormGroup columns={2}>
        <Input
          id="firstName"
          label="First Name"
          bind:value={firstName}
          bind:touched={firstNameTouched}
          bind:valid={isFirstNameValid}
          placeholder="John"
          required={true}
          errorMessage="First name is required"
          on:input={resetFieldError}
          on:blur={() => touchField('firstName')}
        />

        <Input
          id="lastName"
          label="Last Name"
          bind:value={lastName}
          bind:touched={lastNameTouched}
          bind:valid={isLastNameValid}
          placeholder="Doe"
          required={true}
          errorMessage="Last name is required"
          on:input={resetFieldError}
          on:blur={() => touchField('lastName')}
        />
      </FormGroup>

      <div class="text-xs text-gray-500 mb-2">
        Please use your real name for shipping and account verification purposes.
      </div>

      <!-- Email -->
      <EmailInput
        id="email"
        label="Email Address"
        bind:value={email}
        bind:touched={emailTouched}
        bind:valid={isEmailValid}
        placeholder="your@email.com"
        required={true}
        on:input={resetFieldError}
        on:blur={() => touchField('email')}
      />

      <!-- Phone Number with validation -->
      <PhoneInput
        id="phoneNumber"
        label="Phone Number"
        bind:value={phoneNumber}
        bind:touched={phoneNumberTouched}
        bind:valid={isPhoneNumberValid}
        required={false}
        optional={true}
        on:input={resetFieldError}
        on:blur={() => touchField('phoneNumber')}
      />

      <!-- Password -->
      <PasswordInput
        id="password"
        label="Password"
        bind:value={password}
        bind:touched={passwordTouched}
        bind:valid={isPasswordValid}
        required={true}
        minLength={6}
        autocomplete="new-password"
        errorMessage="Password must be at least 6 characters"
        on:input={(e) => {
          resetFieldError();
          passwordStrength = e.detail.strength;
        }}
        on:blur={() => touchField('password')}
      />

      <!-- Confirm Password -->
      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        bind:value={confirmPassword}
        bind:touched={confirmPasswordTouched}
        bind:valid={isConfirmPasswordValid}
        required={true}
        isConfirmPassword={true}
        passwordToMatch={password}
        showStrengthIndicator={false}
        showRequirements={false}
        autocomplete="new-password"
        on:input={resetFieldError}
        on:blur={() => touchField('confirmPassword')}
      />

      <!-- Address form -->
      <AddressForm
        bind:showAddressFields
        bind:addressData
        showAddressToggle={true}
        addressRequired={false}
        phoneNumberRequired={true}
        showPhoneNumber={true}
        on:toggleAddress={handleAddressToggle}
        on:change={handleAddressChange}
        on:validityChange={handleAddressFormValidityChange}
        on:resetError={resetFieldError}
      />

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
            >
          </div>
          <div class="ml-3 text-sm">
            <label for="terms" class="text-gray-700">
              I agree to the <a href="#" class="text-gold hover:text-gold-dark underline">Terms of Service</a> and <a href="#" class="text-gold hover:text-gold-dark underline">Privacy Policy</a>
            </label>
            {#if termsTouched && !isTermsAccepted}
              <p class="mt-1 text-sm text-red-600">You must accept the terms and conditions</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Submit button -->
      <div class="form-actions">
        <button
          type="submit"
          class="w-full bg-gold hover:bg-gold-dark text-white font-medium py-2 px-4 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition disabled:opacity-50"
          disabled={isLoading}
        >
          {#if isLoading}
            <span class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          {:else}
            Create Account
          {/if}
        </button>
      </div>

      <!-- Login link -->
      <div class="text-center text-sm mt-6">
        Already have an account? <a href="/account/login" class="text-gold hover:text-gold-dark transition-colors">Sign in</a>
      </div>
    </form>
  </div>
</div>

<style>
  .text-gold { color: #b8860b; }
  .hover\:text-gold-dark:hover { color:#a67a09; }
  .bg-gold { background-color: #b8860b; }
  .hover\:bg-gold-dark:hover { background-color: #a67a09; }
  .focus\:ring-gold { --tw-ring-color: #b8860b; }
  .focus\:ring-gold\/50:focus { --tw-ring-color: rgb(184 134 11 / 0.5); }
  .border-gold { border-color: #b8860b; }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
