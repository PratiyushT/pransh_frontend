<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import gsap from 'gsap';

  // Form data
  let email = '';
  let password = '';
  let rememberMe = false;
  let isLoading = false;
  let errorMessage = '';
  let formSubmitted = false;

  // Form validation
  $: isEmailValid = !formSubmitted || (email.includes('@') && email.includes('.'));
  $: isPasswordValid = !formSubmitted || password.length >= 6;
  $: isFormValid = email && password && isEmailValid && isPasswordValid;

  // Handle login form submission
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

      // In a real app, you would make an API call here to authenticate
      // For demonstration, we're just simulating success

      // Mock successful login
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);

      // Navigate to account page after login
      goto('/account');

    } catch (error) {
      console.error('Login error:', error);
      errorMessage = 'Invalid email or password';
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

    timeline.from('.login-container', {
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
  <title>Login | Pransh</title>
  <meta name="description" content="Sign in to your Pransh account to access your orders, wishlist, and personalized recommendations.">
</svelte:head>

<div class="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4">
  <div class="login-container max-w-md w-full bg-white p-8 md:p-10 shadow-sm rounded-sm">
    <!-- Logo -->
    <div class="text-center mb-8">
      <img src="/images/Website-logo-gold-svg.svg" alt="Pransh Logo" class="h-12 mx-auto mb-4">
      <h1 class="text-2xl font-serif text-gray-800">Sign In</h1>
    </div>

    <!-- Error message -->
    {#if errorMessage}
      <div class="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-sm">
        {errorMessage}
      </div>
    {/if}

    <!-- Login form -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
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
        <div class="flex justify-between mb-1">
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <a href="/account/reset-password" class="text-xs text-gold hover:text-gold-dark transition-colors">
            Forgot Password?
          </a>
        </div>
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

      <!-- Remember me checkbox -->
      <div class="form-field flex items-center">
        <input
          type="checkbox"
          id="remember-me"
          bind:checked={rememberMe}
          class="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
        >
        <label for="remember-me" class="ml-2 block text-sm text-gray-700">
          Remember me
        </label>
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
            Signing In...
          {:else}
            Sign In
          {/if}
        </button>
      </div>

      <!-- Register link -->
      <div class="text-center text-sm mt-6">
        <span class="text-gray-600">Don't have an account?</span>
        <a href="/account/register" class="text-gold hover:text-gold-dark ml-1 transition-colors">
          Create one
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
</style>
