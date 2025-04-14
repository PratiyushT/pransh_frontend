<script lang="ts">
  import { getCategories } from '$lib/utils/data';
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  const categories = getCategories();
  const currentYear = new Date().getFullYear();

  let footerElement: HTMLElement;

  onMount(() => {
    // Subtle entrance animation for footer elements
    if (footerElement) {
      const elements = footerElement.querySelectorAll('.footer-content > *, .footer-logo, .footer-links-col, .footer-bottom');

      // Don't set initial opacity to 0, this ensures content is visible even without animation
      const handleScroll = () => {
        const rect = footerElement.getBoundingClientRect();
        const isVisible = (
          rect.top < window.innerHeight &&
          rect.bottom >= 0
        );

        if (isVisible && !footerElement.classList.contains('animated')) {
          footerElement.classList.add('animated');
          gsap.from(elements, {
            y: 20,
            opacity: 0.6,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out"
          });
        }
      };

      // Add scroll listener
      window.addEventListener('scroll', handleScroll);
      // Check initial position
      handleScroll();

      // Clean up
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  });
</script>

<footer class="footer" bind:this={footerElement}>
  <div class="footer-main">
    <div class="container">
      <div class="footer-content">
        <!-- Logo and Brand Information -->
        <div class="footer-brand">
          <a href="/" class="footer-logo">
            <img src="/images/pransh-logo.svg" alt="Pransh Logo" class="footer-logo-img" />
          </a>
          <p class="tagline">Timeless Elegance, Exceptional Quality</p>
          <div class="footer-social">
            <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram" class="social-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener" aria-label="Pinterest" class="social-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
                <path d="M21 12c0 -5 -2.5 -8 -9 -8s-9 3 -9 8c0 3.768 2.328 7 6 8.87c-.5 -2.798 -1 -4.87 2 -5.87c3 1 6 1 9 -3c.5 2 2 4 5 5c-1 1 -2 3 -3 5"></path>
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook" class="social-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" class="social-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
          </div>
        </div>

        <!-- Shop Navigation -->
        <div class="footer-links-col">
          <h3 class="footer-heading">Shop</h3>
          <ul class="footer-links">
            <li>
              <a href="/category/all" class="footer-link">All Collections</a>
            </li>
            {#each categories as category}
              <li>
                <a href={`/category/${category.slug}`} class="footer-link">{category.name}</a>
              </li>
            {/each}
            <li>
              <a href="/category/new" class="footer-link">New Arrivals</a>
            </li>
          </ul>
        </div>

        <!-- Company Information -->
        <div class="footer-links-col">
          <h3 class="footer-heading">Company</h3>
          <ul class="footer-links">
            <li>
              <a href="/about" class="footer-link">About Us</a>
            </li>
            <li>
              <a href="/contact" class="footer-link">Contact</a>
            </li>
            <li>
              <a href="/about#sustainability" class="footer-link">Sustainability</a>
            </li>
            <li>
              <a href="/about#careers" class="footer-link">Careers</a>
            </li>
          </ul>
        </div>

        <!-- Customer Service -->
        <div class="footer-links-col">
          <h3 class="footer-heading">Customer Service</h3>
          <ul class="footer-links">
            <li>
              <a href="/shipping" class="footer-link">Shipping & Returns</a>
            </li>
            <li>
              <a href="/faq" class="footer-link">FAQ</a>
            </li>
            <li>
              <a href="/care" class="footer-link">Care Instructions</a>
            </li>
            <li>
              <a href="/size-guide" class="footer-link">Size Guide</a>
            </li>
          </ul>
        </div>

        <!-- Newsletter Signup -->
        <div class="footer-newsletter">
          <div class="newsletter-background">
            <div class="shine-effect"></div>
          </div>
          <div class="newsletter-content">
            <h3 class="footer-heading newsletter-heading">Stay Connected</h3>
            <p class="newsletter-text">Join our mailing list for exclusive updates and offers.</p>
            <form class="newsletter-form">
              <div class="newsletter-input-group">
                <input type="email" placeholder="Your email address" class="newsletter-input" aria-label="Email for newsletter" />
                <button type="submit" class="newsletter-button">
                  <span class="sr-only">Subscribe</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      <!-- Divider -->
      <div class="footer-divider"></div>

      <!-- Footer Bottom -->
      <div class="footer-bottom">
        <div class="footer-copyright">
          <p>&copy; {currentYear} Pransh. All rights reserved.</p>
        </div>
        <div class="footer-legal-links">
          <a href="/privacy-policy" class="footer-legal-link">Privacy Policy</a>
          <a href="/terms-of-service" class="footer-legal-link">Terms of Service</a>
          <a href="/accessibility" class="footer-legal-link">Accessibility</a>
        </div>
      </div>
    </div>
  </div>
</footer>

<style>
  /* Main Footer Styling */
  .footer {
    background-color: var(--color-cream);
    color: var(--color-charcoal);
    padding-top: 5rem;
    padding-bottom: 2rem;
    position: relative;
    overflow: hidden;
  }

  .footer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--color-gold), transparent);
    opacity: 0.5;
  }

  .footer-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
    margin-bottom: 4rem;
  }

  /* Brand Section */
  .footer-brand {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-logo {
    margin-bottom: 1.25rem;
    display: inline-block;
  }

  .footer-logo-img {
    height: 40px;
    width: auto;
  }

  .tagline {
    font-family: var(--heading-font);
    color: var(--color-charcoal);
    margin-bottom: 1.5rem;
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: 0.05em;
  }

  .footer-social {
    display: flex;
    gap: 1.25rem;
    margin-top: 0.5rem;
  }

  .social-link {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-charcoal);
    background-color: rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;
  }

  .social-link:hover {
    background-color: var(--color-gold);
    color: var(--color-white);
    transform: translateY(-3px);
  }

  /* Footer Links */
  .footer-heading {
    font-family: var(--heading-font);
    font-size: 1.25rem;
    color: var(--color-charcoal);
    margin-bottom: 1.5rem;
    position: relative;
    font-weight: 500;
  }

  .footer-heading::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 30px;
    height: 1px;
    background-color: var(--color-gold);
  }

  .footer-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .footer-link {
    color: var(--color-charcoal-light);
    transition: all 0.3s ease;
    position: relative;
    display: inline-block;
    font-size: 0.95rem;
  }

  .footer-link:hover {
    color: var(--color-gold);
    transform: translateX(4px);
  }

  /* Newsletter */
  .footer-newsletter {
    position: relative;
    padding: 2rem;
    border-radius: 8px;
    overflow: hidden;
    color: var(--color-white);
    z-index: 1;
  }

  .newsletter-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--color-gold-dark) 0%, var(--color-gold) 50%, var(--color-gold-light) 100%);
    z-index: -1;
    box-shadow: 0 6px 15px rgba(212, 175, 55, 0.25);
  }

  .shine-effect {
    position: absolute;
    top: -50%;
    left: -50%;
    right: -50%;
    bottom: -50%;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0) 45%,
      rgba(255, 255, 255, 0.15) 48%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0.15) 52%,
      rgba(255, 255, 255, 0) 55%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: shine 12s ease-in-out infinite;
    transform: rotate(25deg);
  }

  @keyframes shine {
    0% {
      transform: translateX(-150%) rotate(25deg);
    }
    25%, 100% {
      transform: translateX(350%) rotate(25deg);
    }
  }

  .newsletter-content {
    position: relative;
    z-index: 1;
  }

  .newsletter-heading {
    color: var(--color-white);
  }

  .newsletter-heading::after {
    background-color: var(--color-white);
    opacity: 0.7;
  }

  .newsletter-text {
    color: var(--color-white);
    font-size: 0.95rem;
    margin-bottom: 1.25rem;
    line-height: 1.6;
    opacity: 0.9;
  }

  .newsletter-form {
    width: 100%;
  }

  .newsletter-input-group {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.6);
    transition: all 0.3s ease;
  }

  .newsletter-input-group:focus-within {
    border-color: var(--color-white);
  }

  .newsletter-input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0.75rem 0;
    color: var(--color-white);
    font-size: 0.95rem;
    outline: none;
  }

  .newsletter-input::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  .newsletter-button {
    background: transparent;
    border: none;
    padding: 0.5rem 0 0.5rem 0.5rem;
    color: var(--color-white);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .newsletter-button:hover {
    transform: translateX(4px);
  }

  /* Divider */
  .footer-divider {
    height: 1px;
    margin: 0 auto;
    background: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%);
    margin-bottom: 2rem;
  }

  /* Footer bottom */
  .footer-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .footer-copyright {
    font-size: 0.85rem;
    color: var(--color-charcoal-light);
  }

  .footer-legal-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
  }

  .footer-legal-link {
    color: var(--color-charcoal-light);
    font-size: 0.85rem;
    transition: color 0.3s ease;
  }

  .footer-legal-link:hover {
    color: var(--color-gold);
  }

  /* Responsive adjustments */
  @media (min-width: 640px) {
    .footer-bottom {
      flex-direction: row;
      justify-content: space-between;
    }

    .footer-legal-links {
      justify-content: flex-end;
    }
  }

  @media (min-width: 768px) {
    .footer-content {
      grid-template-columns: repeat(2, 1fr);
      gap: 3rem 2rem;
    }

    .footer-brand {
      grid-column: span 2;
    }
  }

  @media (min-width: 1024px) {
    .footer-content {
      grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
      gap: 2rem;
    }

    .footer-brand {
      grid-column: span 1;
    }

    .footer-social {
      margin-top: 1rem;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
