<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { cart } from '$lib/stores';

  // Clear the cart on successful purchase
  onMount(() => {
    // Empty the cart since purchase is complete
    cart.set([]);

    // Set a timeout to automatically redirect after 10 seconds
    const redirectTimer = setTimeout(() => {
      goto('/');
    }, 10000);

    return () => {
      clearTimeout(redirectTimer);
    };
  });
</script>

<section class="success-container">
  <div class="success-content">
    <div class="success-icon">✓</div>
    <h1>Payment Successful!</h1>
    <p>Thank you for your purchase. Your order has been processed successfully.</p>
    <p class="order-note">Order confirmation details have been sent to your email.</p>

    <div class="action-buttons">
      <a href="/" class="primary-btn">Continue Shopping</a>
      <a href="/account/orders" class="secondary-btn">View Orders</a>
    </div>

    <p class="redirect-note">You will be redirected to the homepage in 10 seconds...</p>
  </div>
</section>

<style>
  .success-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 2rem;
  }

  .success-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 3rem 2rem;
    text-align: center;
    max-width: 600px;
    width: 100%;
  }

  .success-icon {
    background-color: #4CAF50;
    color: white;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    font-size: 40px;
    font-weight: bold;
  }

  h1 {
    color: var(--color-gold, #ad974f);
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  p {
    color: #555;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .order-note {
    font-weight: 500;
    margin-bottom: 2rem;
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .primary-btn, .secondary-btn {
    padding: 0.85rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
  }

  .primary-btn {
    background: var(--color-gold, #ad974f);
    color: white;
  }

  .primary-btn:hover {
    background: #8e783a;
  }

  .secondary-btn {
    background: #f3f3f3;
    color: #333;
    border: 1px solid #ddd;
  }

  .secondary-btn:hover {
    background: #e8e8e8;
  }

  .redirect-note {
    font-size: 0.9rem;
    color: #888;
    margin-top: 2rem;
  }

  @media (max-width: 600px) {
    .success-content {
      padding: 2rem 1rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    .action-buttons {
      flex-direction: column;
    }

    .success-icon {
      width: 60px;
      height: 60px;
      font-size: 30px;
    }
  }
</style>
