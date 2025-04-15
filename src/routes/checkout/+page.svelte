<script lang="ts">
  import { onMount } from 'svelte';
  import { cart, cartTotal, clearCart } from '$lib/stores';
  import { formatPrice } from '$lib/utils/data';
  import gsap from 'gsap';
  import type { CartItem } from '$lib/types';

  // Shipping cost and calculations
  let shippingCost = 15.0;
  let subtotal = 0;
  let total = 0;
  let discountAmount = 0;
  let taxRate = 0.08; // 8% tax rate
  let taxAmount = 0;

  // Form data
  let shippingInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    saveInfo: false
  };

  let billingInfo = {
    sameAsShipping: true,
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States'
  };

  let paymentInfo = {
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    saveCard: false
  };

  // Form step management
  let currentStep = 1;
  const totalSteps = 3;
  let formValid = false;
  let shippingComplete = false;
  let billingComplete = false;
  let paymentComplete = false;

  // Validation status for required fields
  let validationErrors = {
    shipping: {
      firstName: false,
      lastName: false,
      email: false,
      phoneNumber: false,
      addressLine1: false,
      city: false,
      state: false,
      postalCode: false
    },
    billing: {
      firstName: false,
      lastName: false,
      addressLine1: false,
      city: false,
      state: false,
      postalCode: false
    },
    payment: {
      cardholderName: false,
      cardNumber: false,
      expiryDate: false,
      cvv: false
    }
  };

  // Reactive calculation of order totals
  $: {
    subtotal = $cartTotal;
    taxAmount = subtotal * taxRate;
    total = subtotal + (subtotal > 0 ? shippingCost : 0) + taxAmount - discountAmount;
  }

  // Handle shipping method selection
  const shippingMethods = [
    { id: 'standard', name: 'Standard Shipping', price: 15.0, days: '5-7 business days' },
    { id: 'express', name: 'Express Shipping', price: 25.0, days: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Shipping', price: 35.0, days: 'Next business day' }
  ];

  let selectedShippingMethod = shippingMethods[0].id;

  $: {
    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    if (method) {
      shippingCost = method.price;
    }
  }

  // Payment methods
  const paymentMethods = [
    { id: 'credit', name: 'Credit Card', icon: 'credit-card' },
    { id: 'paypal', name: 'PayPal', icon: 'paypal' }
  ];

  let selectedPaymentMethod = paymentMethods[0].id;

  // Promo code
  let promoCode = '';
  let promoApplied = false;
  let promoError = '';

  const applyPromoCode = () => {
    if (!promoCode) {
      promoError = 'Please enter a promo code';
      return;
    }

    // Sample promo code validation
    if (promoCode.toUpperCase() === 'WELCOME10') {
      discountAmount = subtotal * 0.1; // 10% discount
      promoApplied = true;
      promoError = '';

      // Animation for successful promo application
      const orderSummary = document.querySelector('.order-summary');
      if (orderSummary) {
        gsap.fromTo(
          orderSummary.querySelector('.discount-row'),
          { backgroundColor: 'rgba(212, 175, 55, 0.1)' },
          { backgroundColor: 'transparent', duration: 1.5 }
        );
      }
    } else {
      promoError = 'Invalid promo code';
      discountAmount = 0;
      promoApplied = false;
    }
  };

  // Navigation methods
  const nextStep = () => {
    if (currentStep < totalSteps) {
      // Validate current step before proceeding
      if (currentStep === 1 && validateShippingInfo()) {
        shippingComplete = true;
        currentStep += 1;
        animateStepTransition();
      } else if (currentStep === 2 && validateBillingInfo()) {
        billingComplete = true;
        currentStep += 1;
        animateStepTransition();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      currentStep -= 1;
      animateStepTransition();
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep ||
        (step === 2 && shippingComplete) ||
        (step === 3 && billingComplete)) {
      currentStep = step;
      animateStepTransition();
    }
  };

  // Form validation
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const validatePhone = (phone: string) => {
    // Basic validation for phone number (at least 10 digits)
    return phone.replace(/\D/g, '').length >= 10;
  };

  const validatePostalCode = (postalCode: string, country: string) => {
    if (country === 'United States') {
      // US ZIP code (5 digits or 5+4)
      return /^\d{5}(-\d{4})?$/.test(postalCode);
    }
    return postalCode.length > 3; // Simple validation for other countries
  };

  const validateCardNumber = (cardNumber: string) => {
    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');
    // Check if it's all digits and correct length (13-19 digits)
    return /^\d{13,19}$/.test(cleanNumber);
  };

  const validateCardExpiry = (expiry: string) => {
    // Format: MM/YY or MM/YYYY
    const re = /^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/;
    if (!re.test(expiry)) return false;

    // Verify it's not expired
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Convert 2-digit year to 4-digit
    const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);

    if (fullYear < currentYear) return false;
    if (fullYear === currentYear && parseInt(month) < currentMonth) return false;

    return true;
  };

  const validateCVV = (cvv: string) => {
    // CVV is typically 3-4 digits
    return /^\d{3,4}$/.test(cvv);
  };

  const validateShippingInfo = () => {
    // Reset validation errors
    Object.keys(validationErrors.shipping).forEach(key => {
      validationErrors.shipping[key] = false;
    });

    let valid = true;

    // Check required fields
    if (!shippingInfo.firstName.trim()) {
      validationErrors.shipping.firstName = true;
      valid = false;
    }

    if (!shippingInfo.lastName.trim()) {
      validationErrors.shipping.lastName = true;
      valid = false;
    }

    if (!shippingInfo.email.trim() || !validateEmail(shippingInfo.email)) {
      validationErrors.shipping.email = true;
      valid = false;
    }

    if (!shippingInfo.phoneNumber.trim() || !validatePhone(shippingInfo.phoneNumber)) {
      validationErrors.shipping.phoneNumber = true;
      valid = false;
    }

    if (!shippingInfo.addressLine1.trim()) {
      validationErrors.shipping.addressLine1 = true;
      valid = false;
    }

    if (!shippingInfo.city.trim()) {
      validationErrors.shipping.city = true;
      valid = false;
    }

    if (!shippingInfo.state.trim()) {
      validationErrors.shipping.state = true;
      valid = false;
    }

    if (!shippingInfo.postalCode.trim() || !validatePostalCode(shippingInfo.postalCode, shippingInfo.country)) {
      validationErrors.shipping.postalCode = true;
      valid = false;
    }

    // Trigger update
    validationErrors = {...validationErrors};

    return valid;
  };

  const validateBillingInfo = () => {
    // If same as shipping, no need to validate
    if (billingInfo.sameAsShipping) return true;

    // Reset validation errors
    Object.keys(validationErrors.billing).forEach(key => {
      validationErrors.billing[key] = false;
    });

    let valid = true;

    if (!billingInfo.firstName.trim()) {
      validationErrors.billing.firstName = true;
      valid = false;
    }

    if (!billingInfo.lastName.trim()) {
      validationErrors.billing.lastName = true;
      valid = false;
    }

    if (!billingInfo.addressLine1.trim()) {
      validationErrors.billing.addressLine1 = true;
      valid = false;
    }

    if (!billingInfo.city.trim()) {
      validationErrors.billing.city = true;
      valid = false;
    }

    if (!billingInfo.state.trim()) {
      validationErrors.billing.state = true;
      valid = false;
    }

    if (!billingInfo.postalCode.trim() || !validatePostalCode(billingInfo.postalCode, billingInfo.country)) {
      validationErrors.billing.postalCode = true;
      valid = false;
    }

    // Trigger update
    validationErrors = {...validationErrors};

    return valid;
  };

  const validatePaymentInfo = () => {
    if (selectedPaymentMethod === 'paypal') return true;

    // Reset validation errors
    Object.keys(validationErrors.payment).forEach(key => {
      validationErrors.payment[key] = false;
    });

    let valid = true;

    if (!paymentInfo.cardholderName.trim()) {
      validationErrors.payment.cardholderName = true;
      valid = false;
    }

    if (!paymentInfo.cardNumber.trim() || !validateCardNumber(paymentInfo.cardNumber)) {
      validationErrors.payment.cardNumber = true;
      valid = false;
    }

    if (!paymentInfo.expiryDate.trim() || !validateCardExpiry(paymentInfo.expiryDate)) {
      validationErrors.payment.expiryDate = true;
      valid = false;
    }

    if (!paymentInfo.cvv.trim() || !validateCVV(paymentInfo.cvv)) {
      validationErrors.payment.cvv = true;
      valid = false;
    }

    // Trigger update
    validationErrors = {...validationErrors};

    return valid;
  };

  // Checkout submission
  const handleSubmitOrder = () => {
    if (validatePaymentInfo()) {
      // Show loading state
      const placeOrderBtn = document.querySelector('.place-order-btn');
      if (placeOrderBtn) {
        placeOrderBtn.classList.add('processing');
        placeOrderBtn.textContent = 'Processing...';
      }

      // Simulate processing time
      setTimeout(() => {
        // Generate order number
        const orderNumber = `PRN-${Date.now().toString().slice(-8)}`;

        // Clear cart
        clearCart();

        // Redirect to confirmation page (would pass order number in a real app)
        window.location.href = `/order-confirmation?order=${orderNumber}`;
      }, 2000);
    }
  };

  // Animation for step transitions
  const animateStepTransition = () => {
    const stepContents = document.querySelectorAll('.step-content');
    const targetStep = stepContents[currentStep - 1];

    if (targetStep) {
      // Hide all steps
      stepContents.forEach(step => {
        step.classList.remove('active');
      });

      // Show target step with animation
      gsap.fromTo(
        targetStep,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          onStart: () => {
            targetStep.classList.add('active');
          }
        }
      );
    }
  };

  // Reactive handlers
  $: {
    if (billingInfo.sameAsShipping) {
      billingInfo.firstName = shippingInfo.firstName;
      billingInfo.lastName = shippingInfo.lastName;
      billingInfo.addressLine1 = shippingInfo.addressLine1;
      billingInfo.addressLine2 = shippingInfo.addressLine2;
      billingInfo.city = shippingInfo.city;
      billingInfo.state = shippingInfo.state;
      billingInfo.postalCode = shippingInfo.postalCode;
      billingInfo.country = shippingInfo.country;
    }
  }

  // Format card number with spaces
  const formatCardNumber = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = value.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      input.value = parts.join(' ');
    } else {
      input.value = value;
    }

    // Update the payment info
    paymentInfo.cardNumber = input.value;
  };

  // Format expiry date
  const formatExpiryDate = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

    if (value.length > 2) {
      input.value = value.substring(0, 2) + '/' + value.substring(2, 6);
    } else {
      input.value = value;
    }

    // Update the payment info
    paymentInfo.expiryDate = input.value;
  };

  // Lifecycle
  onMount(() => {
    // Check if we have cart items
    if ($cart.length === 0) {
      window.location.href = '/cart';
      return;
    }

    // Animate page
    gsap.from('.checkout-header', {
      opacity: 0,
      y: -20,
      duration: 0.8,
      ease: 'power2.out'
    });

    gsap.from('.checkout-container', {
      opacity: 0,
      y: 30,
      duration: 0.8,
      delay: 0.2,
      ease: 'power2.out'
    });

    // Initialize animation
    animateStepTransition();
  });
</script>

<svelte:head>
  <title>Checkout | Pransh</title>
  <meta name="description" content="Complete your purchase - Pransh luxury clothing with timeless elegance and exceptional quality." />
</svelte:head>

<div class="checkout-page py-16 px-6 sm:px-10 min-h-screen">
  <div class="max-w-[1320px] mx-auto">
    <h1 class="checkout-header text-3xl sm:text-4xl font-serif mb-16 text-center elegant-title">Checkout</h1>

    <div class="checkout-container grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-16 w-full px-2 sm:px-4 xl:px-0">
      <!-- Checkout Form Section -->
      <div class="xl:col-span-2">
        <div class="bg-white p-6 sm:p-10 shadow-xl rounded-md transition-all duration-300 border border-gray-300">
          <!-- Step indicators -->
          <div class="checkout-steps flex items-center justify-center border-b pb-8 mb-10">
            <div class="step-indicator flex flex-col sm:flex-row items-center justify-between w-full max-w-2xl mx-auto relative">
              <!-- Progress bar -->
              <div class="step-progress-bar absolute top-5 left-0 h-[2px] bg-gray-200 w-full hidden sm:block"></div>
              <div
                class="step-progress-bar-active absolute top-5 left-0 h-[2px] bg-gold transition-all duration-500"
                style={`width: ${(currentStep - 1) / (totalSteps - 1) * 100}%`}
              ></div>

              <!-- Step 1: Shipping -->
              <div
                class="step-circle relative z-10 flex flex-col items-center cursor-pointer mb-4 sm:mb-0"
                class:active={currentStep >= 1}
                class:completed={shippingComplete}
                on:click={() => goToStep(1)}
              >
                <div class="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white transition-all duration-300 mb-2">
                  {#if shippingComplete}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {:else}
                    <span class="text-gray-600">1</span>
                  {/if}
                </div>
                <span class="text-sm font-medium">Shipping</span>
              </div>

              <!-- Step 2: Billing -->
              <div
                class="step-circle relative z-10 flex flex-col items-center cursor-pointer mb-4 sm:mb-0"
                class:active={currentStep >= 2}
                class:completed={billingComplete}
                on:click={() => goToStep(2)}
              >
                <div class="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white transition-all duration-300 mb-2">
                  {#if billingComplete}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {:else}
                    <span class="text-gray-600">2</span>
                  {/if}
                </div>
                <span class="text-sm font-medium">Billing</span>
              </div>

              <!-- Step 3: Payment -->
              <div
                class="step-circle relative z-10 flex flex-col items-center cursor-pointer"
                class:active={currentStep >= 3}
                class:completed={paymentComplete}
                on:click={() => goToStep(3)}
              >
                <div class="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white transition-all duration-300 mb-2">
                  {#if paymentComplete}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {:else}
                    <span class="text-gray-600">3</span>
                  {/if}
                </div>
                <span class="text-sm font-medium">Payment</span>
              </div>
            </div>
          </div>

          <!-- Step content will be added here in the next edit -->
          <div class="checkout-form mt-10">
            <!-- Step 1: Shipping information -->
            <div class="step-content" class:active={currentStep === 1}>
              <h3 class="text-2xl font-serif mb-8 text-gold">Shipping Information</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- First Name -->
                <div class="form-group">
                  <label for="shipping-first-name" class="block text-sm font-medium text-gray-700 mb-1">First Name <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="shipping-first-name"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    class:error={validationErrors.shipping.firstName}
                    bind:value={shippingInfo.firstName}
                    placeholder="Enter your first name"
                  />
                  {#if validationErrors.shipping.firstName}
                    <p class="text-red-500 text-sm mt-1">First name is required</p>
                  {/if}
                </div>

                <!-- Last Name -->
                <div class="form-group">
                  <label for="shipping-last-name" class="block text-sm font-medium text-gray-700 mb-1">Last Name <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="shipping-last-name"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    class:error={validationErrors.shipping.lastName}
                    bind:value={shippingInfo.lastName}
                    placeholder="Enter your last name"
                  />
                  {#if validationErrors.shipping.lastName}
                    <p class="text-red-500 text-sm mt-1">Last name is required</p>
                  {/if}
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label for="shipping-email" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-red-500">*</span></label>
                  <input
                    type="email"
                    id="shipping-email"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    class:error={validationErrors.shipping.email}
                    bind:value={shippingInfo.email}
                    placeholder="Enter your email address"
                  />
                  {#if validationErrors.shipping.email}
                    <p class="text-red-500 text-sm mt-1">Please enter a valid email address</p>
                  {/if}
                </div>

                <!-- Phone -->
                <div class="form-group">
                  <label for="shipping-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number <span class="text-red-500">*</span></label>
                  <input
                    type="tel"
                    id="shipping-phone"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    class:error={validationErrors.shipping.phoneNumber}
                    bind:value={shippingInfo.phoneNumber}
                    placeholder="Enter your phone number"
                  />
                  {#if validationErrors.shipping.phoneNumber}
                    <p class="text-red-500 text-sm mt-1">Please enter a valid phone number</p>
                  {/if}
                </div>
              </div>

              <div class="mt-6">
                <!-- Address Line 1 -->
                <div class="form-group mb-6">
                  <label for="shipping-address-1" class="block text-sm font-medium text-gray-700 mb-1">Address Line 1 <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="shipping-address-1"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    class:error={validationErrors.shipping.addressLine1}
                    bind:value={shippingInfo.addressLine1}
                    placeholder="Street address, P.O. box, company name, etc."
                  />
                  {#if validationErrors.shipping.addressLine1}
                    <p class="text-red-500 text-sm mt-1">Address is required</p>
                  {/if}
                </div>

                <!-- Address Line 2 -->
                <div class="form-group mb-6">
                  <label for="shipping-address-2" class="block text-sm font-medium text-gray-700 mb-1">Address Line 2 <span class="text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    id="shipping-address-2"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    bind:value={shippingInfo.addressLine2}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
                <!-- City -->
                <div class="form-group md:col-span-2">
                  <label for="shipping-city" class="block text-sm font-medium text-gray-700 mb-1">City <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="shipping-city"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    class:error={validationErrors.shipping.city}
                    bind:value={shippingInfo.city}
                    placeholder="Enter your city"
                  />
                  {#if validationErrors.shipping.city}
                    <p class="text-red-500 text-sm mt-1">City is required</p>
                  {/if}
                </div>

                <!-- State/Province -->
                <div class="form-group md:col-span-2">
                  <label for="shipping-state" class="block text-sm font-medium text-gray-700 mb-1">State/Province <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="shipping-state"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    class:error={validationErrors.shipping.state}
                    bind:value={shippingInfo.state}
                    placeholder="Enter your state/province"
                  />
                  {#if validationErrors.shipping.state}
                    <p class="text-red-500 text-sm mt-1">State/Province is required</p>
                  {/if}
                </div>

                <!-- ZIP/Postal Code -->
                <div class="form-group md:col-span-2">
                  <label for="shipping-zip" class="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="shipping-zip"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    class:error={validationErrors.shipping.postalCode}
                    bind:value={shippingInfo.postalCode}
                    placeholder="Enter your ZIP/postal code"
                  />
                  {#if validationErrors.shipping.postalCode}
                    <p class="text-red-500 text-sm mt-1">Please enter a valid postal code</p>
                  {/if}
                </div>
              </div>

              <!-- Country -->
              <div class="form-group mt-6">
                <label for="shipping-country" class="block text-sm font-medium text-gray-700 mb-1">Country <span class="text-red-500">*</span></label>
                <select
                  id="shipping-country"
                  class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                  bind:value={shippingInfo.country}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="New Zealand">New Zealand</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Italy">Italy</option>
                  <option value="Spain">Spain</option>
                  <option value="Japan">Japan</option>
                </select>
              </div>

              <!-- Shipping Method -->
              <div class="mt-10">
                <h4 class="text-xl font-serif mb-6 text-gray-700">Shipping Method</h4>

                <div class="shipping-methods space-y-4">
                  {#each shippingMethods as method}
                    <label
                      class="shipping-method-option block p-4 border rounded-md cursor-pointer transition-all duration-300 hover:border-gold"
                      class:selected={selectedShippingMethod === method.id}
                    >
                      <div class="flex items-start">
                        <input
                          type="radio"
                          name="shipping-method"
                          value={method.id}
                          bind:group={selectedShippingMethod}
                          class="mt-1 mr-3"
                        />
                        <div class="flex-1">
                          <div class="flex justify-between">
                            <span class="font-medium text-gray-700">{method.name}</span>
                            <span class="font-medium text-gold">{formatPrice(method.price)}</span>
                          </div>
                          <p class="text-sm text-gray-500 mt-1">{method.days}</p>
                        </div>
                      </div>
                    </label>
                  {/each}
                </div>
              </div>

              <!-- Save Information Checkbox -->
              <div class="mt-8">
                <label class="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={shippingInfo.saveInfo}
                    class="h-5 w-5 text-gold rounded focus:ring-gold/50 cursor-pointer"
                  />
                  <span class="ml-2 text-gray-600">Save this information for next time</span>
                </label>
              </div>

              <!-- Navigation Buttons -->
              <div class="mt-10 pt-8 border-t flex justify-between">
                <button
                  class="btn btn-secondary flex items-center group"
                  on:click={() => window.history.back()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Cart
                </button>

                <button
                  class="btn btn-primary flex items-center group"
                  on:click={nextStep}
                >
                  Continue to Billing
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Step 2: Billing information -->
            <div class="step-content" class:active={currentStep === 2}>
              <h3 class="text-2xl font-serif mb-8 text-gold">Billing Details</h3>

              <!-- Same as Shipping checkbox -->
              <div class="mb-8">
                <label class="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={billingInfo.sameAsShipping}
                    class="h-5 w-5 text-gold rounded focus:ring-gold/50 cursor-pointer"
                  />
                  <span class="ml-2 font-medium text-gray-700">Same as shipping address</span>
                </label>
              </div>

              {#if !billingInfo.sameAsShipping}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- First Name -->
                  <div class="form-group">
                    <label for="billing-first-name" class="block text-sm font-medium text-gray-700 mb-1">First Name <span class="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="billing-first-name"
                      class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                      class:error={validationErrors.billing.firstName}
                      bind:value={billingInfo.firstName}
                      placeholder="Enter first name"
                    />
                    {#if validationErrors.billing.firstName}
                      <p class="text-red-500 text-sm mt-1">First name is required</p>
                    {/if}
                  </div>

                  <!-- Last Name -->
                  <div class="form-group">
                    <label for="billing-last-name" class="block text-sm font-medium text-gray-700 mb-1">Last Name <span class="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="billing-last-name"
                      class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                      class:error={validationErrors.billing.lastName}
                      bind:value={billingInfo.lastName}
                      placeholder="Enter last name"
                    />
                    {#if validationErrors.billing.lastName}
                      <p class="text-red-500 text-sm mt-1">Last name is required</p>
                    {/if}
                  </div>
                </div>

                <div class="mt-6">
                  <!-- Address Line 1 -->
                  <div class="form-group mb-6">
                    <label for="billing-address-1" class="block text-sm font-medium text-gray-700 mb-1">Address Line 1 <span class="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="billing-address-1"
                      class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                      class:error={validationErrors.billing.addressLine1}
                      bind:value={billingInfo.addressLine1}
                      placeholder="Street address, P.O. box, company name, etc."
                    />
                    {#if validationErrors.billing.addressLine1}
                      <p class="text-red-500 text-sm mt-1">Address is required</p>
                    {/if}
                  </div>

                  <!-- Address Line 2 -->
                  <div class="form-group mb-6">
                    <label for="billing-address-2" class="block text-sm font-medium text-gray-700 mb-1">Address Line 2 <span class="text-gray-400">(optional)</span></label>
                    <input
                      type="text"
                      id="billing-address-2"
                      class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                      bind:value={billingInfo.addressLine2}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <!-- City -->
                  <div class="form-group md:col-span-2">
                    <label for="billing-city" class="block text-sm font-medium text-gray-700 mb-1">City <span class="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="billing-city"
                      class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                      class:error={validationErrors.billing.city}
                      bind:value={billingInfo.city}
                      placeholder="Enter your city"
                    />
                    {#if validationErrors.billing.city}
                      <p class="text-red-500 text-sm mt-1">City is required</p>
                    {/if}
                  </div>

                  <!-- State/Province -->
                  <div class="form-group md:col-span-2">
                    <label for="billing-state" class="block text-sm font-medium text-gray-700 mb-1">State/Province <span class="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="billing-state"
                      class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                      class:error={validationErrors.billing.state}
                      bind:value={billingInfo.state}
                      placeholder="Enter your state/province"
                    />
                    {#if validationErrors.billing.state}
                      <p class="text-red-500 text-sm mt-1">State/Province is required</p>
                    {/if}
                  </div>

                  <!-- ZIP/Postal Code -->
                  <div class="form-group md:col-span-2">
                    <label for="billing-zip" class="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code <span class="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="billing-zip"
                      class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                      class:error={validationErrors.billing.postalCode}
                      bind:value={billingInfo.postalCode}
                      placeholder="Enter your ZIP/postal code"
                    />
                    {#if validationErrors.billing.postalCode}
                      <p class="text-red-500 text-sm mt-1">Please enter a valid postal code</p>
                    {/if}
                  </div>
                </div>

                <!-- Country -->
                <div class="form-group mt-6">
                  <label for="billing-country" class="block text-sm font-medium text-gray-700 mb-1">Country <span class="text-red-500">*</span></label>
                  <select
                    id="billing-country"
                    class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                    bind:value={billingInfo.country}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Italy">Italy</option>
                    <option value="Spain">Spain</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>
              {:else}
                <!-- If same as shipping, display summary of shipping address -->
                <div class="bg-gray-50 p-6 rounded-md mb-8">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-medium text-gray-700">{shippingInfo.firstName} {shippingInfo.lastName}</p>
                      <p class="text-gray-600 mt-1">{shippingInfo.addressLine1}</p>
                      {#if shippingInfo.addressLine2}
                        <p class="text-gray-600">{shippingInfo.addressLine2}</p>
                      {/if}
                      <p class="text-gray-600">
                        {shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}
                      </p>
                      <p class="text-gray-600">{shippingInfo.country}</p>
                    </div>
                    <button
                      class="text-gold hover:underline text-sm"
                      on:click={() => billingInfo.sameAsShipping = false}
                    >
                      Change
                    </button>
                  </div>
                </div>
              {/if}

              <!-- Navigation Buttons -->
              <div class="mt-10 pt-8 border-t flex justify-between">
                <button
                  class="btn btn-secondary flex items-center group"
                  on:click={prevStep}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Shipping
                </button>

                <button
                  class="btn btn-primary flex items-center group"
                  on:click={nextStep}
                >
                  Continue to Payment
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Step 3: Payment information -->
            <div class="step-content" class:active={currentStep === 3}>
              <h3 class="text-2xl font-serif mb-8 text-gold">Payment Information</h3>

              <!-- Payment methods selector -->
              <div class="mb-8">
                <p class="block text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {#each paymentMethods as method}
                    <label
                      class="payment-method-option block p-4 border rounded-md cursor-pointer transition-all duration-300 hover:border-gold relative"
                      class:selected={selectedPaymentMethod === method.id}
                    >
                      <div class="flex items-center">
                        <input
                          type="radio"
                          name="payment-method"
                          value={method.id}
                          bind:group={selectedPaymentMethod}
                          class="mr-3"
                        />
                        <div>
                          <div class="font-medium text-gray-700">{method.name}</div>
                        </div>
                        {#if method.id === 'credit'}
                          <div class="ml-auto flex space-x-2">
                            <img src="https://same-assets.com/payment-visa.svg" alt="Visa" class="h-6" />
                            <img src="https://same-assets.com/payment-mastercard.svg" alt="Mastercard" class="h-6" />
                            <img src="https://same-assets.com/payment-amex.svg" alt="American Express" class="h-6" />
                          </div>
                        {:else if method.id === 'paypal'}
                          <div class="ml-auto">
                            <img src="https://same-assets.com/payment-paypal.svg" alt="PayPal" class="h-6" />
                          </div>
                        {/if}
                      </div>
                    </label>
                  {/each}
                </div>
              </div>

              {#if selectedPaymentMethod === 'credit'}
                <div class="credit-card-form mt-10">
                  <!-- Cardholder Name -->
                  <div class="form-group mb-6">
                    <label for="card-name" class="block text-sm font-medium text-gray-700 mb-1">Cardholder Name <span class="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="card-name"
                      class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                      class:error={validationErrors.payment.cardholderName}
                      bind:value={paymentInfo.cardholderName}
                      placeholder="Name as it appears on the card"
                    />
                    {#if validationErrors.payment.cardholderName}
                      <p class="text-red-500 text-sm mt-1">Cardholder name is required</p>
                    {/if}
                  </div>

                  <!-- Card Number -->
                  <div class="form-group mb-6">
                    <label for="card-number" class="block text-sm font-medium text-gray-700 mb-1">Card Number <span class="text-red-500">*</span></label>
                    <div class="relative">
                      <input
                        type="text"
                        id="card-number"
                        class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300 pr-12"
                        class:error={validationErrors.payment.cardNumber}
                        value={paymentInfo.cardNumber}
                        on:input={formatCardNumber}
                        placeholder="1234 5678 9012 3456"
                        maxlength="19"
                      />
                      <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    {#if validationErrors.payment.cardNumber}
                      <p class="text-red-500 text-sm mt-1">Please enter a valid card number</p>
                    {/if}
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Expiration Date -->
                    <div class="form-group">
                      <label for="card-expiry" class="block text-sm font-medium text-gray-700 mb-1">Expiration Date <span class="text-red-500">*</span></label>
                      <input
                        type="text"
                        id="card-expiry"
                        class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                        class:error={validationErrors.payment.expiryDate}
                        value={paymentInfo.expiryDate}
                        on:input={formatExpiryDate}
                        placeholder="MM/YY"
                        maxlength="5"
                      />
                      {#if validationErrors.payment.expiryDate}
                        <p class="text-red-500 text-sm mt-1">Please enter a valid expiration date</p>
                      {/if}
                    </div>

                    <!-- CVV -->
                    <div class="form-group">
                      <label for="card-cvv" class="block text-sm font-medium text-gray-700 mb-1">
                        CVV/CVC <span class="text-red-500">*</span>
                        <span class="ml-1 text-gray-400 text-xs cursor-help" title="The 3-4 digit code on the back of your card">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      </label>
                      <input
                        type="text"
                        id="card-cvv"
                        class="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                        class:error={validationErrors.payment.cvv}
                        bind:value={paymentInfo.cvv}
                        placeholder="123"
                        maxlength="4"
                        pattern="\d*"
                        inputmode="numeric"
                      />
                      {#if validationErrors.payment.cvv}
                        <p class="text-red-500 text-sm mt-1">Please enter a valid CVV/CVC code</p>
                      {/if}
                    </div>
                  </div>

                  <!-- Save Card checkbox -->
                  <div class="mt-8">
                    <label class="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        bind:checked={paymentInfo.saveCard}
                        class="h-5 w-5 text-gold rounded focus:ring-gold/50 cursor-pointer"
                      />
                      <span class="ml-2 text-gray-600">Save card for future purchases</span>
                    </label>
                  </div>
                </div>
              {:else if selectedPaymentMethod === 'paypal'}
                <div class="paypal-info p-6 bg-gray-50 rounded-md mt-8">
                  <p class="text-gray-600">You'll be redirected to PayPal to complete your payment securely.</p>
                  <div class="mt-4 flex justify-center">
                    <img src="https://same-assets.com/payment-paypal.svg" alt="PayPal" class="h-12" />
                  </div>
                </div>
              {/if}

              <!-- Navigation Buttons -->
              <div class="mt-10 pt-8 border-t flex justify-between">
                <button
                  class="btn btn-secondary flex items-center group"
                  on:click={prevStep}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Billing
                </button>

                <button
                  class="btn btn-primary flex items-center group place-order-btn"
                  on:click={handleSubmitOrder}
                >
                  Place Order
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Summary Section -->
      <div class="w-full mt-0 xl:mt-0 relative z-10">
        <div class="order-summary bg-white p-6 sm:p-10 shadow-xl rounded-md transition-all duration-300 border border-gray-300 sticky top-24">
          <h2 class="font-serif text-2xl sm:text-3xl mb-10 text-gold text-center">Order Summary</h2>

          <!-- Cart Items Summary -->
          <div class="cart-items-summary mb-8">
            {#if $cart.length > 0}
              <div class="max-h-60 overflow-y-auto pr-2">
                {#each $cart as item}
                  <div class="flex items-center py-4 border-b border-gray-100">
                    <div class="h-16 w-16 rounded-md overflow-hidden shadow-sm bg-gray-100 flex-shrink-0">
                      <img src={item.image} alt={item.name} class="w-full h-full object-cover" on:error={(e) => e.currentTarget.src = '/images/product-placeholder.jpg'} />
                    </div>
                    <div class="ml-4 flex-1 min-w-0">
                      <p class="text-gray-700 font-medium text-sm truncate">{item.name}</p>
                      <p class="text-gray-500 text-xs">
                        Size: {item.size} | Color: {item.color.name} | Qty: {item.quantity}
                      </p>
                    </div>
                    <div class="ml-2 text-gold font-medium">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-4 text-gray-500">Your cart is empty</div>
            {/if}
          </div>

          <!-- Promo Code -->
          <div class="promo-code-section mb-8">
            <div class="flex items-center mb-2">
              <input
                type="text"
                placeholder="Enter promo code"
                class="flex-1 px-4 py-3 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-300"
                bind:value={promoCode}
                disabled={promoApplied}
              />
              <button
                class="px-4 py-3 bg-gold text-white rounded-r-md hover:bg-gold-dark transition-colors duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
                on:click={applyPromoCode}
                disabled={promoApplied}
              >
                {promoApplied ? 'Applied' : 'Apply'}
              </button>
            </div>
            {#if promoError}
              <p class="text-red-500 text-sm mt-1">{promoError}</p>
            {:else if promoApplied}
              <p class="text-green-600 text-sm mt-1">Promo code applied successfully!</p>
            {/if}
          </div>

          <!-- Order Total Calculations -->
          <div class="order-totals space-y-4">
            <div class="flex justify-between items-center py-2 border-b border-gray-200">
              <span class="text-gray-600">Subtotal</span>
              <span class="font-medium">{formatPrice(subtotal)}</span>
            </div>

            <div class="flex justify-between items-center py-2 border-b border-gray-200">
              <span class="text-gray-600">Shipping</span>
              <span>{formatPrice(shippingCost)}</span>
            </div>

            <div class="flex justify-between items-center py-2 border-b border-gray-200">
              <span class="text-gray-600">Tax ({(taxRate * 100).toFixed(0)}%)</span>
              <span>{formatPrice(taxAmount)}</span>
            </div>

            {#if discountAmount > 0}
              <div class="flex justify-between items-center py-2 border-b border-gray-200 discount-row">
                <span class="text-gray-600">Discount</span>
                <span class="text-green-600">-{formatPrice(discountAmount)}</span>
              </div>
            {/if}

            <div class="flex justify-between items-center py-4 border-b border-gray-200">
              <span class="text-xl font-serif text-gray-700">Total</span>
              <span class="text-2xl text-gold font-medium">{formatPrice(total)}</span>
            </div>
          </div>

          <!-- Order Policies -->
          <div class="mt-8 text-center">
            <p class="text-sm text-gray-500 mb-6">
              By placing your order, you agree to our <br>
              <a href="/terms" class="text-gold hover:underline">Terms of Service</a> and <a href="/privacy" class="text-gold hover:underline">Privacy Policy</a>
            </p>

            <div class="flex justify-center space-x-4 mt-6">
              <img src="https://same-assets.com/payment-visa.svg" alt="Visa" class="h-8 opacity-70 hover:opacity-100 transition-opacity duration-300" />
              <img src="https://same-assets.com/payment-mastercard.svg" alt="Mastercard" class="h-8 opacity-70 hover:opacity-100 transition-opacity duration-300" />
              <img src="https://same-assets.com/payment-amex.svg" alt="American Express" class="h-8 opacity-70 hover:opacity-100 transition-opacity duration-300" />
              <img src="https://same-assets.com/payment-paypal.svg" alt="PayPal" class="h-8 opacity-70 hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div class="mt-8 text-sm text-gray-400">
              <p class="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure Checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .checkout-page {
    background-color: var(--color-cream);
  }

  .elegant-title {
    position: relative;
    display: inline-block;
    letter-spacing: 2px;
    font-weight: 500;
    color: var(--color-charcoal);
  }

  .elegant-title::after {
    content: '';
    position: absolute;
    width: 100px;
    height: 2px;
    background-color: var(--color-gold);
    bottom: -16px;
    left: 50%;
    transform: translateX(-50%);
  }

  /* Form styling */
  .form-group input, .form-group select {
    border-color: #e5e7eb;
  }

  .form-group input:focus, .form-group select:focus {
    border-color: var(--color-gold);
  }

  .form-group input.error, .form-group select.error {
    border-color: #ef4444;
  }

  /* Step indicators */
  .step-circle.active .w-10 {
    border-color: var(--color-gold);
    color: var(--color-gold);
  }

  .step-circle.completed .w-10 {
    background-color: var(--color-gold);
    border-color: var(--color-gold);
    color: white;
  }

  /* Step content */
  .step-content {
    display: none;
  }

  .step-content.active {
    display: block;
  }

  /* Payment method styling */
  .payment-method-option.selected {
    border-color: var(--color-gold);
    background-color: rgba(212, 175, 55, 0.05);
  }

  .shipping-method-option.selected {
    border-color: var(--color-gold);
    background-color: rgba(212, 175, 55, 0.05);
  }

  /* Custom styling for radio buttons */
  input[type="radio"] {
    accent-color: var(--color-gold);
  }

  input[type="checkbox"] {
    accent-color: var(--color-gold);
  }

  /* Order summary card */
  .order-summary {
    height: fit-content;
  }

  /* Place order button processing state */
  .place-order-btn.processing {
    background-color: var(--color-gold);
    opacity: 0.7;
    pointer-events: none;
  }

  /* Custom scrollbar for cart items summary */
  .cart-items-summary .max-h-60::-webkit-scrollbar {
    width: 4px;
  }

  .cart-items-summary .max-h-60::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  .cart-items-summary .max-h-60::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 10px;
  }

  .cart-items-summary .max-h-60::-webkit-scrollbar-thumb:hover {
    background: var(--color-gold);
  }

  @media (max-width: 639px) {
    .elegant-title::after {
      width: 80px;
      bottom: -12px;
    }
  }
</style>
