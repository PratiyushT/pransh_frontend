<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import gsap from 'gsap';

  let orderNumber = '';
  let loading = true;

  onMount(() => {
    // Get order number from URL query parameter
    orderNumber = $page.url.searchParams.get('order') || 'PRN-00000000';
    loading = false;

    // Add animation
    gsap.from('.confirmation-icon', {
      scale: 0.5,
      opacity: 0,
      duration: 0.8,
      ease: 'back.out(1.7)',
    });

    gsap.from('.confirmation-content', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      delay: 0.4,
      ease: 'power2.out',
    });
  });

  // Format date as Month Day, Year
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate estimated delivery date (7-10 business days from now)
  const getEstimatedDelivery = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7 + Math.floor(Math.random() * 4)); // Random between 7-10 days
    return formatDate(deliveryDate);
  };
</script>

<svelte:head>
  <title>Order Confirmation | Pransh</title>
  <meta name="description" content="Thank you for your order! Your order has been confirmed and is being processed." />
</svelte:head>

<div class="confirmation-page py-16 px-6 sm:px-10 min-h-screen">
  <div class="max-w-[800px] mx-auto">
    {#if loading}
      <div class="flex justify-center items-center h-96">
        <div class="loader h-10 w-10 border-4 border-t-gold rounded-full animate-spin"></div>
      </div>
    {:else}
      <div class="text-center mb-16">
        <div class="confirmation-icon mx-auto mb-10 w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div class="confirmation-content">
          <h1 class="text-3xl sm:text-4xl font-serif mb-4 text-gold">Thank You for Your Order!</h1>
          <p class="text-gray-600 max-w-lg mx-auto text-lg">
            Your order has been received and is now being processed. We've sent a confirmation email with the order details.
          </p>
        </div>
      </div>

      <div class="bg-white p-8 sm:p-12 shadow-xl rounded-md transition-all duration-300 border border-gray-300 mb-12">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-10 border-b">
          <div>
            <h2 class="text-2xl font-serif text-gold mb-1">Order #{orderNumber}</h2>
            <p class="text-gray-500">Placed on {formatDate(new Date())}</p>
          </div>

          <div class="mt-4 sm:mt-0">
            <span class="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Order Confirmed
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          <div>
            <h3 class="text-xl font-serif mb-4 text-gray-700">Shipping Information</h3>
            <p class="mb-1 font-medium">Estimated Delivery Date:</p>
            <p class="text-gray-600 mb-4">{getEstimatedDelivery()}</p>

            <p class="mb-1 font-medium">Shipping Method:</p>
            <p class="text-gray-600 mb-4">Standard Shipping</p>

            <p class="mb-1 font-medium">Shipping Address:</p>
            <div class="text-gray-600">
              <p>Your name will appear here</p>
              <p>123 Shipping Address</p>
              <p>City, State ZIP</p>
              <p>Country</p>
            </div>
          </div>

          <div>
            <h3 class="text-xl font-serif mb-4 text-gray-700">Payment Information</h3>
            <p class="mb-1 font-medium">Payment Method:</p>
            <p class="text-gray-600 mb-4">Credit Card (•••• 1234)</p>

            <p class="mb-1 font-medium">Billing Address:</p>
            <div class="text-gray-600">
              <p>Your name will appear here</p>
              <p>123 Billing Address</p>
              <p>City, State ZIP</p>
              <p>Country</p>
            </div>
          </div>
        </div>

        <div class="mb-8 pb-8 border-b">
          <h3 class="text-xl font-serif mb-6 text-gray-700">Order Summary</h3>

          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600">Subtotal</span>
            <span class="font-medium">$XXX.XX</span>
          </div>

          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600">Shipping</span>
            <span>$XX.XX</span>
          </div>

          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600">Tax</span>
            <span>$XX.XX</span>
          </div>

          <div class="flex justify-between items-center pt-4 mt-2 border-t">
            <span class="text-xl font-serif text-gray-700">Total</span>
            <span class="text-xl text-gold font-medium">$XXX.XX</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row justify-center sm:justify-between items-center">
          <a href="/" class="btn btn-secondary flex items-center group mb-4 sm:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Home
          </a>

          <a href="/account" class="btn btn-primary flex items-center group">
            View My Orders
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .confirmation-page {
    background-color: var(--color-cream);
  }

  .btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border-radius: 0.25rem;
    letter-spacing: 0.5px;
  }

  .btn-primary {
    background-color: var(--color-gold);
    color: white;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
  }

  .btn-primary:hover {
    background-color: var(--color-gold-dark);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
    transform: translateY(-2px);
  }

  .btn-secondary {
    border: 1px solid var(--color-gold);
    color: var(--color-gold);
  }

  .btn-secondary:hover {
    background-color: var(--color-gold);
    color: white;
    transform: translateY(-2px);
  }

  .loader {
    border-color: #e5e7eb;
    border-top-color: var(--color-gold);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
