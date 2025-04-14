<script lang="ts">
  import { getCategories } from '$lib/utils/data';
  import { onMount } from 'svelte';

  const categories = getCategories();
  const currentYear = new Date().getFullYear();
</script>

<footer class="footer">
  <!-- Main Footer Content -->
  <div class="footer-main">
    <div class="container mx-auto px-4 md:px-6 lg:px-8">
      <div class="footer-top py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-12">
        <div class="footer-brand col-span-2">
          <a href="/" class="footer-logo">HASHTAG<sup>®</sup></a>
          <p class="tagline">Social media for growing companies</p>
        </div>

        <div class="footer-links-col">
          <h3 class="footer-heading">Homepages</h3>
          <ul class="footer-links">
            <li>
              <a href="/" class="footer-link">Home 1</a>
            </li>
            <li>
              <a href="/" class="footer-link">Home 2</a>
            </li>
            <li>
              <a href="/" class="footer-link">Home 3</a>
            </li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h3 class="footer-heading">About</h3>
          <ul class="footer-links">
            <li>
              <a href="/about" class="footer-link">About 1</a>
            </li>
            <li>
              <a href="/about" class="footer-link">About 2</a>
            </li>
            <li>
              <a href="/about" class="footer-link">About 3</a>
            </li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h3 class="footer-heading">Cases</h3>
          <ul class="footer-links">
            <li>
              <a href="/cases" class="footer-link">Cases 1</a>
            </li>
            <li>
              <a href="/cases" class="footer-link">Cases 2</a>
            </li>
            <li>
              <a href="/cases" class="footer-link">Cases 3</a>
            </li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h3 class="footer-heading">Other</h3>
          <ul class="footer-links">
            <li>
              <a href="/services" class="footer-link">Services</a>
            </li>
            <li>
              <a href="/blog" class="footer-link">Blog</a>
            </li>
            <li>
              <a href="/blog/post" class="footer-link">Blog post</a>
            </li>
            <li>
              <a href="/careers" class="footer-link">Careers</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="social-links flex justify-end gap-4 mb-6">
        <a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon">
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
          </svg>
        </a>
        <a href="https://discord.com" target="_blank" rel="noopener" aria-label="Discord">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8.5 14.5a5.5 5.5 0 0 0 7 0"></path>
            <line x1="8" y1="9" x2="8" y2="9.01"></line>
            <line x1="16" y1="9" x2="16" y2="9.01"></line>
          </svg>
        </a>
        <a href="https://t.me" target="_blank" rel="noopener" aria-label="Telegram">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon">
            <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.91 6.763a2.24 2.24 0 0 0 .205 4.23l4.073 1.22"></path>
            <path d="M7.544 14.861 11.768 18l7.867-7.868a2.240 2.240 0 0 0 0-3.169l-1.464-1.464a2.240 2.240 0 0 0-3.169 0L7.544 14.861z"></path>
            <path d="M9 16v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5"></path>
          </svg>
        </a>
        <a href="https://reddit.com" target="_blank" rel="noopener" aria-label="Reddit">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M14.5 15c-.5.2-1.2.3-2.5.3s-2-.1-2.5-.3"></path>
            <path d="M8.4 9.8a1.6 1.6 0 0 0-1.5 0c-.4.2-.6.5-.7.9-.1.4 0 .8.2 1.2l.2.3"></path>
            <path d="M15.6 9.8a1.6 1.6 0 0 1 1.5 0c.4.2.6.5.7.9.1.4 0 .8-.2 1.2l-.2.3"></path>
            <path d="M9.6 12c.2-.1.3-.1.4-.1h4c.1 0 .2 0 .4.1"></path>
            <path d="M7.5 12c0 1.4 2 2.5 4.5 2.5s4.5-1.1 4.5-2.5"></path>
          </svg>
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener" aria-label="LinkedIn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
            <rect x="2" y="9" width="4" height="12"></rect>
            <circle cx="4" cy="4" r="2"></circle>
          </svg>
        </a>
      </div>

      <!-- Newsletter subscription remains in place but is hidden -->
      <div class="hidden newsletter-form flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <input type="email" placeholder="example@gmail.com" class="newsletter-input" />
        <button type="button" class="newsletter-button">Join the newsletter</button>
      </div>

      <div class="footer-bottom">
        <div class="footer-divider"></div>
        <div class="footer-bottom-content py-6 flex flex-col md:flex-row justify-between items-center">
          <p class="footer-copyright mb-4 md:mb-0">© {currentYear} Hashtag</p>
          <div class="footer-links-secondary flex gap-6">
            <a href="/instructions" class="footer-link-secondary">Instructions</a>
            <a href="/style-guide" class="footer-link-secondary">Style guide</a>
            <a href="/licenses" class="footer-link-secondary">Licenses</a>
            <a href="/changelog" class="footer-link-secondary">Changelog</a>
          </div>
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
    padding: 2rem 0 1rem;
    display: flex;
    flex-direction: column;
  }

  .footer-main {
    padding: 0 0 1rem;
  }

  .footer-logo {
    font-family: var(--heading-font);
    font-size: 2rem;
    color: var(--color-charcoal);
    margin-bottom: 1rem;
    display: inline-block;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .tagline {
    color: var(--color-charcoal);
    margin-top: 0.5rem;
    font-size: 1rem;
  }

  .footer-heading {
    font-family: var(--heading-font);
    font-size: 1.25rem;
    color: var(--color-charcoal);
    margin-bottom: 1.5rem;
    position: relative;
    padding-bottom: 0.5rem;
    display: inline-block;
  }

  .footer-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .footer-link {
    color: var(--color-charcoal-light);
    transition: var(--transition-smooth);
    position: relative;
    display: inline-block;
    font-size: 0.95rem;
  }

  .footer-link:hover {
    color: var(--color-gold);
  }

  /* Social links */
  .social-icon {
    color: var(--color-charcoal-light);
    transition: all 0.3s ease;
  }

  .social-icon:hover {
    color: var(--color-gold);
    transform: translateY(-3px);
  }

  /* Newsletter input */
  .newsletter-input {
    padding: 0.75rem 1rem;
    background-color: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    color: var(--color-charcoal);
    width: 100%;
    max-width: 300px;
  }

  .newsletter-button {
    padding: 0.75rem 1.5rem;
    background-color: var(--color-gold);
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .newsletter-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    background-color: var(--color-gold-dark);
  }

  /* Footer bottom */
  .footer-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    margin: 2rem 0 0.5rem;
  }

  .footer-copyright {
    color: var(--color-charcoal-light);
    font-size: 0.9rem;
  }

  .footer-link-secondary {
    color: var(--color-charcoal-light);
    font-size: 0.9rem;
    transition: all 0.3s ease;
  }

  .footer-link-secondary:hover {
    color: var(--color-gold);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .footer-links-secondary {
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }

    .social-links {
      justify-content: center;
      margin-top: 2rem;
    }

    .footer-top {
      grid-template-columns: repeat(1, 1fr);
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .footer-top {
      grid-template-columns: repeat(3, 1fr);
    }

    .footer-brand {
      grid-column: span 3;
    }
  }
</style>
