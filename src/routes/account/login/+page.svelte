<script lang="ts">
  import { onMount, tick } from "svelte";
  import { goto } from "$app/navigation";
  import gsap from "gsap";
  import { supabase } from "$lib/supabase/client";
  import { EmailInput, PasswordInput } from "$lib/components/FormElements";

  // Form data
  let email = "";
  let password = "";
  let rememberMe = false;
  let isLoading = false;
  let errorMessage = "";
  let formSubmitted = false;

  // Field interaction tracking
  let emailTouched = false;
  let passwordTouched = false;

  // Debounce timeout
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  // Validate email with a more thorough regex
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Debounced validation to prevent excessive validation
  function debouncedValidation() {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(() => {
      // Validate email if touched
      if (emailTouched) {
        isEmailValid = validateEmail(email);
      }

      // Check password if touched
      if (passwordTouched) {
        isPasswordValid = password.trim() !== "";
      }

      // Reset error message if all valid
      if (formSubmitted && isFormValid) {
        errorMessage = "";
      }
    }, 300);
  }

  // Reset form error when fields change
  const resetFieldError = () => {
    if (formSubmitted) {
      errorMessage = "";
    }
    debouncedValidation();
  };

  // Form validation
  $: isEmailValid = !emailTouched || validateEmail(email);
  $: isPasswordValid = !passwordTouched || password.trim() !== "";
  $: isFormValid = email && password && isEmailValid && isPasswordValid;

  const handleSubmit = async () => {
    formSubmitted = true;
    emailTouched = true;
    passwordTouched = true;

    if (!isFormValid) {
      errorMessage = "Please fix the errors in the form";
      return;
    }

    isLoading = true;
    errorMessage = "";

    try {
      // 1️⃣ Sign in via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage =
            "Please verify your email address first before logging in.";
        } else {
          errorMessage =
            error.message || "Something went wrong. Please try again.";
        }
        return;
      }

      if (!data?.session) {
        errorMessage = "Login failed. Please try again.";
        return;
      }

      // 2️⃣ Login successful
      if (rememberMe) {
        // Tell Supabase to persist session (handled by Supabase client)
        // No need to store anything in localStorage for authentication
        console.log("Remember me enabled - session persistence handled by Supabase");
      }

      if (data.session && data.user.email_confirmed_at) {
        // Only store non-sensitive UI display data
        if (data.user.user_metadata?.first_name) {
          localStorage.setItem("userDisplayName", data.user.user_metadata.first_name);
        } else if (data.user.user_metadata?.full_name) {
          const nameParts = data.user.user_metadata.full_name.split(' ');
          localStorage.setItem("userDisplayName", nameParts[0] || '');
        }

        // Store user initials for UI elements like avatars
        if (data.user.user_metadata?.first_name && data.user.user_metadata?.last_name) {
          const initials = `${data.user.user_metadata.first_name.charAt(0)}${data.user.user_metadata.last_name.charAt(0)}`;
          localStorage.setItem("userInitials", initials);
        }

        // No sensitive data or authentication state stored in localStorage

        // 🚀 Safe to go to /account
        await tick();
        goto("/account");
      } else {
        errorMessage = "Please verify your email before logging in.";
      }
      console.log("OK!");
    } catch (e) {
      console.error("Unexpected login error:", e);
      errorMessage = "Something went wrong. Please try again.";
    } finally {
      isLoading = false;
    }
  };

  // Page animation
  onMount(() => {
    const timeline = gsap.timeline();

    timeline.from(".login-container", {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
    });

    timeline.from(
      ".form-field",
      {
        y: 10,
        opacity: 0,
        stagger: 0.1,
        duration: 0.4,
        ease: "power2.out",
      },
      "-=0.2"
    );

    timeline.from(
      ".form-actions",
      {
        y: 10,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      },
      "-=0.2"
    );

    // Cleanup function to clear any pending timeouts
    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  });
</script>

<svelte:head>
  <title>Login | Pransh</title>
  <meta
    name="description"
    content="Sign in to your Pransh account to access your orders, wishlist, and personalized recommendations."
  />
</svelte:head>

<div class="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4">
  <div
    class="login-container max-w-md w-full bg-white p-8 md:p-10 shadow-sm rounded-sm"
  >
    <!-- Logo -->
    <div class="text-center mb-8">
      <img
        src="/images/Website-logo-gold-svg.svg"
        alt="Pransh Logo"
        class="h-12 mx-auto mb-4"
      />
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
      <EmailInput
        id="email"
        label="Email Address"
        bind:value={email}
        bind:touched={emailTouched}
        bind:valid={isEmailValid}
        placeholder="your@email.com"
        required={true}
        on:input={resetFieldError}
        on:blur={() => emailTouched = true}
      />

      <!-- Password field -->
      <div class="form-field">
        <div class="flex justify-between mb-1">
          <label for="password" class="block text-sm font-medium text-gray-700"
            >Password</label
          >
          <a
            href="/account/reset-password"
            class="text-xs text-gold hover:text-gold-dark transition-colors"
          >
            Forgot Password?
          </a>
        </div>

        <PasswordInput
          id="password"
          bind:value={password}
          bind:touched={passwordTouched}
          bind:valid={isPasswordValid}
          required={true}
          showStrengthIndicator={false}
          showRequirements={false}
          errorMessage="Please enter your password"
          on:input={resetFieldError}
          on:blur={() => passwordTouched = true}
        />
      </div>

      <!-- Remember me checkbox -->
      <div class="form-field flex items-center">
        <input
          type="checkbox"
          id="remember-me"
          bind:checked={rememberMe}
          class="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
        />
        <label for="remember-me" class="ml-2 block text-sm text-gray-700">
          Remember me
        </label>
      </div>

      <!-- Form actions -->
      <div class="form-actions">
        <button
          type="submit"
          class="w-full bg-gold hover:bg-gold-dark text-white font-medium py-2 px-4 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition disabled:opacity-50"
          disabled={isLoading}
        >
          {#if isLoading}
            <span class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing In...
            </span>
          {:else}
            Sign In
          {/if}
        </button>
      </div>

      <!-- Registration link -->
      <div class="text-center text-sm mt-6">
        Don't have an account?{" "}
        <a href="/account/register" class="text-gold hover:text-gold-dark transition-colors"
          >Create an account</a
        >
      </div>
    </form>
  </div>

  <!-- Return to shopping -->
  <div class="mt-8">
    <a
      href="/"
      class="text-sm text-gray-600 hover:text-gold transition-colors flex items-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 mr-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Return to Shopping
    </a>
  </div>
</div>

<style>
  .text-gold { color: #b8860b; }
  .hover\:text-gold-dark:hover { color:#a67a09; }
  .bg-gold { background-color: #b8860b; }
  .hover\:bg-gold-dark:hover { background-color: #a67a09; }
  .focus\:ring-gold\/50:focus { --tw-ring-color: rgb(184 134 11 / 0.5); }
  .focus\:ring-gold:focus { --tw-ring-color: #b8860b; }
  .border-gold { border-color: #b8860b; }
  .rounded-sm { border-radius: 0.125rem; }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg);}
    to { transform: rotate(360deg);}
  }
</style>
