<script>
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  onMount(() => {
    const tl = gsap.timeline();
    tl.from('.verify-container', { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out' });
    tl.from('.verify-icon', { scale: 0.8, opacity: 0, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.3');
    tl.from('.verify-content > *', { y: 10, opacity: 0, stagger: 0.1, duration: 0.4 }, '-=0.2');
  });
</script>

<svelte:head>
  <title>Verify Your Email | Pransh</title>
  <meta name="description" content="Please verify your email address to complete your Pransh account registration.">
</svelte:head>

<div class="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4">
  <div class="verify-container max-w-md w-full bg-white p-8 md:p-10 shadow-sm rounded-sm text-center">
    <div class="verify-icon mx-auto mb-6 w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>

    <div class="verify-content">
      <h1 class="text-2xl font-serif text-gray-800 mb-4">Check Your Email</h1>
      <p class="text-gray-600 mb-6">
        We've sent a verification link to your email address. Please click it to activate your account.
      </p>

      <div class="bg-blue-50 p-4 rounded-sm text-blue-800 text-sm mb-6">
        <p class="font-medium">Important:</p>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li>The verification link will expire in 24 hours</li>
          <li>If you don't see the email, check your spam folder</li>
          <li>Make sure to click the link to complete your registration</li>
        </ul>
      </div>

      <div class="space-y-4">
        <a href="/account/login" class="block w-full bg-gold hover:bg-gold-dark text-white py-2.5 px-4 rounded-sm transition-colors duration-300">
          Go to Login
        </a>
        <p class="text-sm text-gray-500">
          Need help? <a href="/contact" class="text-gold hover:text-gold-dark">Contact Support</a>
        </p>
      </div>
    </div>
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
  .text-gold { color: #b8860b; }
  .bg-gold { background-color: #b8860b; }
  .hover\:bg-gold-dark:hover { background-color: #a67a09; }
  .hover\:text-gold-dark:hover { color: #a67a09; }
  .bg-gold\/10 { background-color: rgba(184, 134, 11, 0.1); }
</style>
