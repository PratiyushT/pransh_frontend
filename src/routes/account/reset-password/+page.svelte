<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import gsap from 'gsap';
  import { EmailInput } from '$lib/components/FormElements';

  // Form data
  let email = '';
  let emailTouched = false; // Add this for EmailInput
  let isLoading = false;
  let formSubmitted = false;
  let resetRequested = false;
  let errorMessage = '';

  // Form validation
  $: isEmailValid = !formSubmitted || (email.includes('@') && email.includes('.'));

  // Handle email input reset
  function resetFieldError() {
    if (formSubmitted) {
      errorMessage = '';
    }
  }

  // Handle reset password request
  const handleSubmit = async () => {
    formSubmitted = true;
    emailTouched = true;

    if (!isEmailValid || !email) {
      errorMessage = 'Please enter a valid email address';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, you would make an API call here to request password reset
      // For demonstration, we're just simulating success
      resetRequested = true;

    } catch (error) {
      console.error('Reset password error:', error);
      errorMessage = 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
    }
  };

  // Page animation
  onMount(() => {
    const timeline = gsap.timeline();

    timeline.from('.reset-container', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out'
    });

    timeline.from('.form-field', {
      y: 10,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out'
    }, '-=0.2');
  });
</script>

<svelte:head>
  <title>Reset Password | Pransh</title>
  <meta name="description" content="Reset your password to regain access to your Pransh account.">
</svelte:head>

<div class="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4">
  <div class="reset-container max-w-md w-full bg-white p-8 md:p-10 shadow-sm rounded-sm">
    <!-- Logo -->
    <div class="text-center mb-8">
      <img src="/images/Website-logo-gold-svg.svg" alt="Pransh Logo" class="h-12 mx-auto mb-4">
      <h1 class="text-2xl font-serif text-gray-800">Reset Password</h1>
    </div>

    {#if resetRequested}
      <!-- Success message -->
      <div class="text-center py-6">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900">Reset Link Sent</h3>
        <div class="mt-3">
          <p class="text-sm text-gray-500">
            If an account exists with {email}, we've sent password reset instructions to this email address.
          </p>
        </div>
        <div class="mt-6">
          <a href="/account/login" class="text-gold hover:text-gold-dark">
            Return to Sign In
          </a>
        </div>
      </div>
    {:else}
      <!-- Error message -->
      {#if errorMessage}
        <div class="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-sm">
          {errorMessage}
        </div>
      {/if}

      <!-- Form description -->
      <p class="text-gray-600 text-sm mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <!-- Reset password form -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <!-- Email field -->
        <EmailInput
          id="email"
          label="Email Address"
          bind:value={email}
          bind:touched={emailTouched}
          bind:valid={isEmailValid}
          placeholder="your@email.com"
          required={true}
          errorMessage="Please enter a valid email address"
          on:input={resetFieldError}
          on:blur={() => emailTouched = true}
        />

        <!-- Form actions -->
        <div class="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            class="w-full bg-gold hover:bg-gold-dark text-white py-2.5 px-4 rounded-sm transition-colors duration-300 flex justify-center"
          >
            {#if isLoading}
              <span class="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              Sending Link...
            {:else}
              Send Reset Link
            {/if}
          </button>
        </div>

        <!-- Back to login link -->
        <div class="text-center text-sm mt-6">
          <a href="/account/login" class="text-gold hover:text-gold-dark transition-colors">
            Back to Sign In
          </a>
        </div>
      </form>
    {/if}
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
</style>
