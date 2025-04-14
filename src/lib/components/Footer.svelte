<script lang="ts">
  import { getCategories } from '$lib/utils/data';
  import { onMount } from 'svelte';

  const categories = getCategories();
  const currentYear = new Date().getFullYear();

  let newsletterSection: HTMLElement;

  onMount(() => {
    if (newsletterSection) {
      // Add mousemove effect to the newsletter section for a shiny effect
      newsletterSection.addEventListener('mousemove', handleMouseMove);

      return () => {
        newsletterSection.removeEventListener('mousemove', handleMouseMove);
      };
    }
  });

  function handleMouseMove(e: MouseEvent) {
    if (!newsletterSection) return;

    const rect = newsletterSection.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element

    // Calculate percentage positions
    const xPercent = Math.floor((x / rect.width) * 100);
    const yPercent = Math.floor((y / rect.height) * 100);

    // Update the radial gradient position
    newsletterSection.style.setProperty('--x-position', `${xPercent}%`);
    newsletterSection.style.setProperty('--y-position', `${yPercent}%`);
  }
</script>

<footer class="footer">
  <div class="newsletter-section" bind:this={newsletterSection}>
    <div class="newsletter-overlay"></div>
    <div class="container mx-auto px-6 py-24 sm:py-32 relative z-10"> <!-- Updated padding for bigger newsletter -->
      <div class="text-center max-w-3xl mx-auto">
        <h2 class="text-3xl md:text-5xl font-serif mb-8 text-white">Join Our Exclusive Circle</h2>
        <p class="mb-12 text-white/90 max-w-xl mx-auto leading-relaxed text-lg">Subscribe to receive exclusive offers, early access to new collections, and personalized style recommendations.</p>

        <form class="newsletter-form">
          <div class="flex flex-col md:flex-row gap-8">
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Email for newsletter"
              class="newsletter-input"
              required
            >
            <button
              type="submit"
              class="newsletter-button"
            >
              Subscribe
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Main Footer Content -->
  <div class="footer-main">
    <div class="container mx-auto px-4 md:px-6 lg:px-8">
      <div class="footer-top py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        <div class="footer-brand pr-4">
          <a href="/" class="footer-logo">Pransh</a>
          <p class="text-gray mb-6 leading-relaxed">
            Luxury clothing for the discerning individual. Timeless elegance, exceptional quality, and meticulous attention to detail.
          </p>
          <div class="social-icons flex gap-3">
            <a href="https://instagram.com" target="_blank" rel="noopener" class="social-icon" aria-label="Instagram">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener" class="social-icon" aria-label="Twitter/X">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener" class="social-icon" aria-label="Facebook">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener" class="social-icon" aria-label="Pinterest">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 20l4-9"/>
                <path d="M10.7 13.5C20 13 22 8.3 22 6.3c0-4.5-3.5-6.3-7-6.3C8.2 0 4 5.8 4 11.3c0 3.1 1.5 5.5 4.5 6 1.8.3 2-1.1 2.8-2.8"/>
              </svg>
            </a>
          </div>
        </div>

        <div class="footer-links-col">
          <h3 class="footer-heading">Quick Links</h3>
          <ul class="footer-links">
            <li>
              <a href="/" class="footer-link">Home</a>
            </li>
            <li>
              <a href="/category/all" class="footer-link">Shop</a>
            </li>
            <li>
              <a href="/about" class="footer-link">About & Contact</a>
            </li>
            <li>
              <a href="/terms" class="footer-link">Terms & Conditions</a>
            </li>
            <li>
              <a href="/privacy" class="footer-link">Privacy Policy</a>
            </li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h3 class="footer-heading">Customer Service</h3>
          <ul class="footer-links">
            <li>
              <a href="/faq" class="footer-link">FAQ</a>
            </li>
            <li>
              <a href="/shipping" class="footer-link">Shipping & Returns</a>
            </li>
            <li>
              <a href="/care" class="footer-link">Product Care</a>
            </li>
            <li>
              <a href="/size-guide" class="footer-link">Size Guide</a>
            </li>
          </ul>
        </div>

        <div class="footer-contact">
          <h3 class="footer-heading">Contact Us</h3>
          <div class="contact-info">
            <div class="contact-item">
              <div class="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div class="contact-text">
                <span>+1 (800) 123-4567</span>
              </div>
            </div>

            <div class="contact-item">
              <div class="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div class="contact-text">
                <a href="mailto:info@pransh.com" class="contact-link">info@pransh.com</a>
              </div>
            </div>

            <div class="contact-item">
              <div class="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="contact-text">
                <span>123 Luxury Avenue<br>New York, NY 10001</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-divider"></div>
        <div class="footer-bottom-content py-6 flex flex-col md:flex-row justify-between items-center">
          <p class="mb-4 md:mb-0">&copy; {currentYear} Pransh Luxury. All rights reserved.</p>
          <div class="payment-methods flex items-center gap-3">
            <div class="payment-icon" aria-label="Visa">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" fill="none" class="w-8 h-5">
                <rect width="24" height="16" rx="2" fill="#F0EBE1"/>
                <path d="M9.5 6L7 10.5H5L3.5 7L3 10.5H1L2 5H4L5.5 8.5L7.5 5H9.5Z" fill="#333333"/>
                <path d="M10 5H12L11 10.5H9L10 5Z" fill="#333333"/>
                <path d="M15 5L13 8L15 10.5H13L11.5 8.5L12.5 5H15Z" fill="#333333"/>
                <path d="M18.5 5L17.5 7H19.5L19 8H17L16 10.5H14L15.5 5H18.5Z" fill="#333333"/>
              </svg>
            </div>
            <div class="payment-icon" aria-label="Mastercard">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" fill="none" class="w-8 h-5">
                <rect width="24" height="16" rx="2" fill="#F0EBE1"/>
                <circle cx="9" cy="8" r="4" fill="#333333" fill-opacity="0.8"/>
                <circle cx="15" cy="8" r="4" fill="#D4AF37" fill-opacity="0.9"/>
              </svg>
            </div>
            <div class="payment-icon" aria-label="PayPal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" fill="none" class="w-8 h-5">
                <rect width="24" height="16" rx="2" fill="#F0EBE1"/>
                <path d="M6 7C6 5.5 7.5 5 9 5H11C11.8 5 13 5.3 13 7C13 8.4 12 9 11 9H8.5C8 9 7.5 9.4 7.2 10L6.5 12.5H4.5L6 7Z" fill="#333333"/>
                <path d="M13 7C13 5.3 14.2 5 15 5H17C18.5 5 20 5.5 20 7L18.5 12.5H16.5L15.8 10C15.5 9.4 15 9 14.5 9H12C11 9 10 8.4 10 7H13Z" fill="#333333"/>
              </svg>
            </div>
            <div class="payment-icon" aria-label="Apple Pay">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" fill="none" class="w-8 h-5">
                <rect width="24" height="16" rx="2" fill="#F0EBE1"/>
                <path d="M8 7C8 5.8 9 5 10.5 5C12 5 13 5.8 13 7C13 8.2 12 9 10.5 9C9 9 8 8.2 8 7Z" fill="#333333"/>
                <path d="M14 7C14 5.8 15 5 16.5 5C18 5 19 5.8 19 7L17 11H14L14 7Z" fill="#333333"/>
                <path d="M5 7L7 11H10L12 7L10 5H7L5 7Z" fill="#333333"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>

<style>
  /* Newsletter Section with Gold Shine */
  .newsletter-section {
    position: relative;
    background: linear-gradient(135deg, var(--color-gold-dark), var(--color-gold), var(--color-gold-light));
    overflow: hidden;
    --x-position: 50%;
    --y-position: 50%;
    margin-top: -1px; /* Ensure overlap to prevent any gap */
    transform: translateY(-20px); /* Pull the newsletter section up to cover the gap */
  }

  .newsletter-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--x-position) var(--y-position),
                rgba(255, 255, 255, 0.4) 0%,
                rgba(255, 255, 255, 0.1) 20%,
                transparent 60%);
    z-index: 1;
  }

  .newsletter-section::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 20%,
      rgba(255, 255, 255, 0.5) 50%,
      rgba(255, 255, 255, 0.2) 80%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: rotate(30deg);
    animation: shine 8s infinite ease-in-out;
    z-index: 0;
    will-change: transform;
  }

  @keyframes shine {
    0% {
      transform: translateX(-100%) rotate(30deg);
    }
    20%, 100% {
      transform: translateX(100%) rotate(30deg);
    }
  }

  .newsletter-form {
    max-width: 700px;
    margin: 0 auto;
  }

  .newsletter-input {
    padding: 1.4rem 1.5rem;
    border: none;
    border-radius: 3px;
    font-size: 1.1rem;
    flex-grow: 1;
    width: 100%;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
    background-color: rgba(255, 255, 255, 0.95);
    color: var(--color-charcoal);
    transition: all 0.3s ease;
  }

  .newsletter-input:focus {
    outline: none;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
    background-color: white;
  }

  .newsletter-button {
    padding: 1.4rem 2.5rem;
    border: 2px solid white;
    background-color: transparent;
    color: white;
    font-weight: 500;
    border-radius: 3px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: all 0.3s ease;
    font-size: 1rem;
    white-space: nowrap;
  }

  .newsletter-button:hover {
    background-color: white;
    color: var(--color-gold);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  /* Main Footer Styling */
  .footer {
    background-color: var(--color-cream);
    color: var(--color-charcoal);
    margin-top: -20px; /* Negative margin to pull everything up */
    padding-top: 0;
    display: flex;
    flex-direction: column;
  }

  .footer-main {
    padding: 0 0 1rem;
  }

  .footer-logo {
    font-family: var(--heading-font);
    font-size: 2.25rem;
    color: var(--color-gold);
    margin-bottom: 1.5rem;
    display: inline-block;
    font-weight: 600;
    letter-spacing: 0.05em;
    transition: transform 0.3s ease;
  }

  .footer-logo:hover {
    transform: translateY(-2px);
  }

  .footer-heading {
    font-family: var(--heading-font);
    font-size: 1.25rem;
    color: rgba(0, 0, 0, 0.7); /* Updated to match cream background */
    margin-bottom: 1.5rem;
    position: relative;
    padding-bottom: 0.75rem;
    display: inline-block;
  }

  .footer-heading::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 2px;
    background-color: var(--color-gold);
    transition: width 0.3s ease;
  }

  .footer-links-col:hover .footer-heading::after {
    width: 60px;
  }

  .footer-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .footer-link {
    color: rgba(0, 0, 0, 0.5); /* Updated to match cream background */
    transition: var(--transition-smooth);
    position: relative;
    display: inline-block;
    padding-left: 1rem;
    font-size: 0.95rem;
  }

  .footer-link::before {
    content: '›';
    position: absolute;
    left: 0;
    color: var(--color-gold);
    transition: transform 0.3s ease;
  }

  .footer-link:hover {
    color: var(--color-charcoal);
  }

  .footer-link:hover::before {
    transform: translateX(3px);
  }

  .social-icons {
    margin-top: 1rem;
  }

  .social-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    color: var(--color-charcoal);
    transition: all 0.3s ease;
  }

  .social-icon:hover {
    background-color: var(--color-gold);
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  /* Contact info styling */
  .contact-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }

  .contact-icon {
    width: 2.5rem;
    height: 2.5rem;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    color: var(--color-gold);
    flex-shrink: 0;
  }

  .contact-text {
    padding-top: 0.5rem;
    line-height: 1.5;
    color: var(--color-charcoal-light);
  }

  .contact-link {
    color: var(--color-charcoal-light);
    transition: color 0.3s ease;
    position: relative;
    display: inline-block;
  }

  .contact-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background-color: var(--color-gold);
    transition: width 0.3s ease;
  }

  .contact-link:hover {
    color: var(--color-gold);
  }

  .contact-link:hover::after {
    width: 100%;
  }

  /* Footer bottom */
  .footer-divider {
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(0, 0, 0, 0.1) 15%,
      rgba(0, 0, 0, 0.1) 85%,
      transparent
    );
  }

  .footer-bottom {
    margin-top: 1rem;
  }

  .footer-bottom p {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .payment-methods {
    display: flex;
  }

  .payment-icon {
    transition: transform 0.3s ease;
  }

  .payment-icon:hover {
    transform: translateY(-2px);
  }

  /* Text utilities */
  .text-gray {
    color: rgba(255, 255, 255, 0.7);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .newsletter-section::before {
      animation-duration: 8s;
    }

    .newsletter-form {
      padding: 0 1rem;
    }

    /* Increase gap on mobile */
    .newsletter-form .flex {
      gap: 1rem;
    }

    .footer-brand, .footer-links-col, .footer-contact {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }

    .footer-top {
      padding-top: 3rem;
      padding-bottom: 2rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .footer-contact {
      grid-column: span 2;
    }
  }
</style>
