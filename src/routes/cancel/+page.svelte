<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // Set timer for auto-redirect
  onMount(() => {
    const redirectTimer = setTimeout(() => {
      goto('/checkout');
    }, 10000);

    return () => {
      clearTimeout(redirectTimer);
    };
  });
</script>

<section class="cancel-container">
  <div class="cancel-content">
    <div class="cancel-icon">×</div>
    <h1>Payment Canceled</h1>
    <p>Your payment process has been canceled.</p>
    <p>Your cart items are still saved and you can complete your purchase at any time.</p>

    <div class="action-buttons">
      <a href="/checkout" class="primary-btn">Return to Checkout</a>
      <a href="/" class="secondary-btn">Continue Shopping</a>
    </div>

    <p class="redirect-note">You will be redirected back to checkout in 10 seconds...</p>
  </div>
</section>

<style>
  .cancel-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 2rem;
  }

  .cancel-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 3rem 2rem;
    text-align: center;
    max-width: 600px;
    width: 100%;
  }

  .cancel-icon {
    background-color: #f44336;
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

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 2rem 0;
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
    .cancel-content {
      padding: 2rem 1rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    .action-buttons {
      flex-direction: column;
    }

    .cancel-icon {
      width: 60px;
      height: 60px;
      font-size: 30px;
    }
  }
</style>
