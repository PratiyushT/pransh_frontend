<script lang="ts">
  import { onMount } from 'svelte';
  import { isMenuOpen } from '$lib/stores/index';
  import { getCategories } from '$lib/utils/data';
  import gsap from 'gsap';

  const categories = getCategories();
  let menuLinks: HTMLElement;
  let menuFooter: HTMLElement;

  // Close menu when escape key is pressed
  onMount(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && $isMenuOpen) {
        $isMenuOpen = false;
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  });

  // Watch for menu open/close to trigger animations
  $: if ($isMenuOpen && menuLinks && menuFooter) {
    // Animation for open
    animateMenuOpen();
  } else if (!$isMenuOpen && menuLinks && menuFooter) {
    // Animation for close
    animateMenuClose();
  }

  function animateMenuOpen() {
    const links = menuLinks.querySelectorAll('.menu-link');

    // Preset the initial state
    gsap.set(links, {
      y: 30,
      opacity: 0
    });

    gsap.set(menuFooter, {
      y: 20,
      opacity: 0
    });

    // Animate links
    gsap.to(links, {
      y: 0,
      opacity: 1,
      stagger: 0.1,
      delay: 0.2,
      duration: 0.7,
      ease: "power3.out"
    });

    // Animate footer
    gsap.to(menuFooter, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      delay: 0.6,
      ease: "power2.out"
    });
  }

  function animateMenuClose() {
    // No need to animate out since the menu will be hidden with CSS transforms
    // Just reset the animation states for the next opening
    const links = menuLinks.querySelectorAll('.menu-link');

    gsap.set(links, {
      y: 30,
      opacity: 0
    });

    gsap.set(menuFooter, {
      y: 20,
      opacity: 0
    });
  }
</script>

<div class="fullscreen-menu" class:open={$isMenuOpen}>
  <div class="menu-glass-layer"></div>
  <div class="menu-content">
    <nav class="menu-nav py-20">
      <ul class="menu-links" bind:this={menuLinks}>
        <li>
          <a href="/" class="menu-link" on:click={() => ($isMenuOpen = false)}>Home</a>
        </li>

        <li>
          <a href="/category/women" class="menu-link" on:click={() => ($isMenuOpen = false)}>Women</a>
        </li>

        <li>
          <a href="/category/men" class="menu-link" on:click={() => ($isMenuOpen = false)}>Men</a>
        </li>

        <li>
          <a href="/category/accessories" class="menu-link" on:click={() => ($isMenuOpen = false)}>Accessories</a>
        </li>

        <li>
          <a href="/collection/new" class="menu-link" on:click={() => ($isMenuOpen = false)}>New Arrivals</a>
        </li>

        <li>
          <a href="/about" class="menu-link" on:click={() => ($isMenuOpen = false)}>Our Story</a>
        </li>

        <li>
          <a href="/contact" class="menu-link" on:click={() => ($isMenuOpen = false)}>Contact</a>
        </li>
      </ul>
    </nav>

    <div class="menu-footer mt-auto p-8 border-t border-gray-200" bind:this={menuFooter}>
      <div class="flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex gap-6">
          <a href="https://instagram.com" class="footer-social-icon" aria-label="Follow us on Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="https://facebook.com" class="footer-social-icon" aria-label="Follow us on Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="https://twitter.com" class="footer-social-icon" aria-label="Follow us on Twitter">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
        </div>

        <div class="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Pransh Luxury. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .fullscreen-menu {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    z-index: 100;
    transform: translateY(-100%);
    transition: transform 0.8s cubic-bezier(0.19, 1, 0.22, 1);
    overflow-y: auto;
    pointer-events: none;
  }

  .fullscreen-menu.open {
    transform: translateY(0);
    pointer-events: all;
  }

  .menu-glass-layer {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: -1;
    overflow: hidden;
  }

  .menu-glass-layer::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transform: skewX(-20deg);
    pointer-events: none;
    animation: shine 1.5s ease forwards 0.5s;
  }

  @keyframes shine {
    0% {
      left: -100%;
      opacity: 0.5;
    }
    100% {
      left: 200%;
      opacity: 0;
    }
  }

  .menu-content {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    padding: 0 1.5rem;
    position: relative;
    max-width: 1320px;
    width: 100%;
    margin: 0 auto;
  }

  .menu-nav {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem 0;
  }

  .menu-link {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    position: relative;
    display: inline-block;
    color: var(--color-charcoal);
    transition: color 0.4s ease, transform 0.4s ease;
    transform-origin: center;
    padding: 0.2rem 0.5rem;
    letter-spacing: 0.02em;
  }

  .menu-link::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1.5px;
    background-color: var(--color-gold);
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
    opacity: 0.7;
  }

  .menu-link:hover {
    color: var(--color-gold);
    transform: scale(1.05);
  }

  .menu-link:hover::before {
    transform: scaleX(1);
    transform-origin: left;
  }

  .menu-footer {
    opacity: 0;
  }

  .footer-social-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(212, 175, 55, 0.1);
    color: var(--color-charcoal);
    transition: all 0.3s ease;
  }

  .footer-social-icon:hover {
    background-color: var(--color-gold);
    color: white;
    transform: translateY(-3px);
  }

  @media (min-width: 768px) {
    .menu-link {
      font-size: 2.5rem;
    }
  }

  @media (min-width: 1024px) {
    .menu-link {
      font-size: 3rem;
    }
  }
</style>
