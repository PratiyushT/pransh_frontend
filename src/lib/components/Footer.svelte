<script lang="ts">
  import { getCategories } from '$lib/utils/data';

  const categories = getCategories();
  const currentYear = new Date().getFullYear();
</script>

<footer class="bg-gray-light py-16">
  <div class="container mx-auto px-4 md:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <a href="/" class="block w-40 mb-6">
          <img src="/images/pransh-logo.png" alt="Pransh" class="w-full">
        </a>
        <p class="text-gray-dark mb-4">
          Luxury clothing for the discerning individual. Timeless elegance, exceptional quality.
        </p>
      </div>

      <div>
        <h3 class="text-lg font-serif font-medium mb-4">Shop</h3>
        <ul class="space-y-2">
          {#each categories as category}
            <li>
              <a
                href="/category/{category.name.toLowerCase()}"
                class="text-gray-dark hover:text-primary transition-colors"
              >
                {category.name}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <div>
        <h3 class="text-lg font-serif font-medium mb-4">Company</h3>
        <ul class="space-y-2">
          <li>
            <a href="/about" class="text-gray-dark hover:text-primary transition-colors">
              About Us
            </a>
          </li>
          <li>
            <a href="/contact" class="text-gray-dark hover:text-primary transition-colors">
              Contact
            </a>
          </li>
          <li>
            <a href="/terms" class="text-gray-dark hover:text-primary transition-colors">
              Terms & Conditions
            </a>
          </li>
          <li>
            <a href="/privacy" class="text-gray-dark hover:text-primary transition-colors">
              Privacy Policy
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-lg font-serif font-medium mb-4">Connect</h3>
        <div class="flex space-x-4 mb-6">
          <a href="https://instagram.com" target="_blank" rel="noopener" class="text-gray-dark hover:text-primary transition-colors" aria-label="Instagram">
            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener" class="text-gray-dark hover:text-primary transition-colors" aria-label="Twitter/X">
            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener" class="text-gray-dark hover:text-primary transition-colors" aria-label="Facebook">
            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
        </div>

        <h3 class="text-lg font-serif font-medium mb-4">Newsletter</h3>
        <form class="flex">
          <input
            type="email"
            placeholder="Your email"
            aria-label="Email for newsletter"
            class="px-4 py-2 border border-gray focus:border-primary focus:outline-none mr-2 flex-grow"
          >
          <button
            type="submit"
            class="btn-primary py-2"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>

    <div class="mt-12 pt-8 border-t border-gray text-center text-gray-dark">
      <p>&copy; {currentYear} Pransh Luxury. All rights reserved.</p>
    </div>
  </div>
</footer>
