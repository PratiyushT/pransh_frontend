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
