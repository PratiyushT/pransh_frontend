<script lang="ts">
  import { onMount } from 'svelte';
  import { getFeaturedProducts } from '$lib/utils/data';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import QuickViewModal from '$lib/components/QuickViewModal.svelte';
  import gsap from 'gsap';

  const featuredProducts = getFeaturedProducts();

  let quickViewProduct = null;
  let quickViewOpen = false;
  let heroSection: HTMLElement;
  let heroContent: HTMLElement;
  let featuredSection: HTMLElement;
  let experienceSection: HTMLElement;
  let heroTitle: HTMLElement;
  let heroSubtitle: HTMLElement;
  let heroBtns: HTMLElement;
  let isMobile = false;

  const handleQuickView = (event) => {
    quickViewProduct = event.detail.product;
    quickViewOpen = true;
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleCloseQuickView = () => {
    quickViewOpen = false;
    // Re-enable scrolling when modal closes
    document.body.style.overflow = '';
  };

  // Enhanced intersection observer for lazy loading and animations
  function createIntersectionObserver(callback) {
    const options = {
      rootMargin: isMobile ? '50px' : '100px',
      threshold: isMobile ? 0.1 : 0.01
    };

    return new IntersectionObserver(callback, options);
  }

  // Function to check if element is in viewport
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Function to handle scroll animations with performance optimizations
  function handleScrollAnimations() {
    // Featured section animations
    if (featuredSection && isInViewport(featuredSection)) {
      const title = featuredSection.querySelector('.section-title');
      const subtitle = featuredSection.querySelector('.section-subtitle');

      if (title && !title.classList.contains('animated')) {
        title.classList.add('animated');
        gsap.from(title, {
          duration: isMobile ? 0.6 : 0.8,  // Faster on mobile
          opacity: 0,
          y: isMobile ? 20 : 30,  // Smaller movement on mobile
          ease: "power2.out"
        });
      }

      if (subtitle && !subtitle.classList.contains('animated')) {
        subtitle.classList.add('animated');
        gsap.from(subtitle, {
          duration: isMobile ? 0.6 : 0.8,
          opacity: 0,
          y: isMobile ? 15 : 20,
          delay: isMobile ? 0.1 : 0.2,  // Faster delay on mobile
          ease: "power2.out"
        });
      }

      const productCards = featuredSection.querySelectorAll('.product-card-container');
      productCards.forEach((card, index) => {
        if (!card.classList.contains('animated') && isInViewport(card)) {
          card.classList.add('animated');
          gsap.from(card, {
            duration: isMobile ? 0.6 : 0.8,
            opacity: 0,
            y: isMobile ? 30 : 40,
            delay: isMobile ? 0.05 * index : 0.1 * index,  // Stagger faster on mobile
            ease: "power2.out"
          });
        }
      });
    }

    // Experience section animations
    if (experienceSection && isInViewport(experienceSection)) {
      const elements = experienceSection.querySelectorAll('h2, p, a, .section-accent');
      elements.forEach((el, index) => {
        if (!el.classList.contains('animated')) {
          el.classList.add('animated');
          gsap.from(el, {
            duration: isMobile ? 0.6 : 0.8,
            opacity: 0,
            y: isMobile ? 20 : 30,
            delay: isMobile ? 0.05 * index : 0.1 * index,
            ease: "power2.out"
          });
        }
      });

      const image = experienceSection.querySelector('.experience-image');
      if (image && !image.classList.contains('animated')) {
        image.classList.add('animated');
        gsap.from(image, {
          duration: isMobile ? 0.8 : 1,
          opacity: 0,
          scale: 0.95,
          delay: isMobile ? 0.2 : 0.3,
          ease: "power2.out"
        });
      }

      const accent = experienceSection.querySelector('.experience-image-accent');
      if (accent && !accent.classList.contains('animated')) {
        accent.classList.add('animated');
        gsap.from(accent, {
          duration: isMobile ? 0.8 : 1,
          opacity: 0,
          scale: 0.8,
          delay: isMobile ? 0.3 : 0.5,
          ease: "power2.out"
        });
      }
    }
  }

  // Add touch interaction
  function initTouchInteractions() {
    const heroImage = heroSection.querySelector('.hero');
    if (!heroImage) return;

    // Add parallax effect on touch move
    let startY = 0;

    heroSection.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    heroSection.addEventListener('touchmove', (e) => {
      const moveY = e.touches[0].clientY - startY;
      const parallaxAmount = moveY * 0.05; // Less movement for subtle effect

      // Apply subtle parallax effect to hero elements
      if (heroTitle) {
        gsap.to(heroTitle, {
          y: parallaxAmount * 0.5,
          duration: 0.2,
          ease: "power1.out"
        });
      }

      if (heroSubtitle) {
        gsap.to(heroSubtitle, {
          y: parallaxAmount * 0.3,
          duration: 0.2,
          ease: "power1.out"
        });
      }
    }, { passive: true });

    heroSection.addEventListener('touchend', () => {
      // Reset positions
      gsap.to([heroTitle, heroSubtitle], {
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    }, { passive: true });
  }

  onMount(() => {
    // Check if mobile/touch device
    isMobile = 'ontouchstart' in window ||
               navigator.maxTouchPoints > 0 ||
               (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    // New exact animation sequence as specified - but faster
    const heroTl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // First prepare the elements - ensure they're invisible
    gsap.set('.hero-line', { opacity: 0, x: 100 });
    gsap.set('.hero-button', { opacity: 0, y: 20 });
    gsap.set('.hero-subtitle', { opacity: 0, y: 20 });

    // 1. "First Line" slides in from the right with soft ease-out - FASTER
    heroTl.to('.hero-line-1', {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.5, // Reduced from 0.8
    });

    // 2. "Second Line" slides in from the right with shorter delay
    heroTl.to('.hero-line-2', {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.5, // Reduced from 0.8
    }, "+=0.15"); // Reduced from 0.3

    // 3. "Third Line" - larger, bolder, slides from right with shorter delay
    heroTl.to('.hero-line-3', {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.5, // Reduced from 0.8
    }, "+=0.15"); // Reduced from 0.3

    // Animate subtitle - faster
    heroTl.to('.hero-subtitle', {
      y: 0,
      opacity: 1,
      duration: 0.4, // Reduced from 0.6
    }, "+=0.1"); // Reduced from 0.2

    // 4. Call-to-Action Button fades in faster - single button now, no stagger needed
    heroTl.to('.hero-button', {
      y: 0,
      opacity: 1,
      duration: 0.4,
      // stagger removed since we only have one button now
    }, "+=0.1");

    // 5. Animate the accent element with a slight delay - faster
    heroTl.from('.hero-accent', {
      opacity: 0,
      scale: 0.9,
      duration: 0.5, // Reduced from 0.8
    }, "-=0.3"); // Slightly more overlap

    // Add subtle continuous animation for accent on desktop only
    if (!isMobile) {
      gsap.to('.hero-accent', {
        y: -20,
        duration: 4, // Reduced from 5 for faster movement
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    // Initialize touch-specific interactions for mobile
    if (isMobile) {
      initTouchInteractions();
    }

    // Use intersection observer for scroll animations on mobile for better performance
    if ('IntersectionObserver' in window) {
      const animateOnScrollObserver = createIntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Apply will-change before animation
            if (entry.target instanceof HTMLElement) {
              entry.target.style.willChange = 'opacity, transform';
            }

            // Trigger animation based on the target element
            if (entry.target === featuredSection) {
              handleScrollAnimations();
            } else if (entry.target === experienceSection) {
              handleScrollAnimations();
            }

            // Remove will-change after animation completes
            setTimeout(() => {
              if (entry.target instanceof HTMLElement) {
                entry.target.style.willChange = 'auto';
              }
            }, 1000);

            // Stop observing after animation
            animateOnScrollObserver.unobserve(entry.target);
          }
        });
      });

      if (featuredSection) animateOnScrollObserver.observe(featuredSection);
      if (experienceSection) animateOnScrollObserver.observe(experienceSection);
    } else {
      // Fallback to scroll listener for older browsers
      window.addEventListener('scroll', handleScrollAnimations, { passive: true });
    }

    // Run once to check for elements already in view
    handleScrollAnimations();

    return () => {
      // Clean up on Page unmount
      window.removeEventListener('scroll', handleScrollAnimations);
    };
  });
</script>

<svelte:head>
  <title>Pransh - Luxury Clothing</title>
  <meta name="description" content="Discover Pransh, a luxury clothing brand offering timeless elegance and exceptional quality.">
</svelte:head>

<!-- New Hero Section with exact animation sequence -->
<section class="hero-container" bind:this={heroSection}>
  <div class="hero milano-hero">
    <div class="hero-overlay"></div>

    <div class="container mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 items-center">
        <!-- Left column with text content -->
        <div class="hero-content-left" bind:this={heroContent}>
          <h1 class="hero-title" bind:this={heroTitle}>
            <div class="hero-line hero-line-1">Timeless</div>
            <div class="hero-line hero-line-2">Elegance</div>
            <div class="hero-line hero-line-3">Redefined</div>
          </h1>

          <p class="hero-subtitle" bind:this={heroSubtitle}>
            Discover our exquisite collection of luxury garments crafted with the finest materials and meticulous attention to detail.
          </p>

          <div class="hero-btns" bind:this={heroBtns}>
            <a href="/shop" class="btn btn-primary hero-button">Shop Now</a>
          </div>
        </div>

        <!-- Right column with image -->
        <div class="hero-image-container">
          <img src="/images/products/saree.jpg" alt="Luxury Fashion" class="hero-image">
          <div class="hero-accent"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Elegant Divider -->
<div class="luxury-divider">
  <div class="luxury-divider-line"></div>
  <div class="luxury-divider-emblem">P</div>
  <div class="luxury-divider-line"></div>
</div>

<!-- Featured Products Section -->
<section class="section" bind:this={featuredSection}>
  <div class="container">
    <div class="section-title">
      <h2>Featured Collection</h2>
    </div>
    <p class="section-subtitle">Explore our curated selection of luxury pieces, each representing the pinnacle of craftsmanship and design.</p>

    <div class="product-grid">
      {#each featuredProducts as product}
        <div class="product-card-container">
          <ProductCard {product} on:quickview={handleQuickView} />
        </div>
      {/each}
    </div>

    <div class="text-center mt-12">
      <a href="/shop" class="btn btn-secondary">View All Products</a>
    </div>
  </div>
</section>

<!-- Luxury Experience Section -->
<section class="section experience-section" bind:this={experienceSection}>
  <div class="container">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div class="experience-content">
        <div class="section-accent">Our Expertise</div>
        <h2 class="mb-6">The Pransh Experience</h2>
        <p class="mb-4">At Pransh, we believe that luxury isn't just about the price tag—it's about the experience, the quality, and the attention to detail that goes into every piece.</p>
        <p class="mb-6">Each garment in our collection is meticulously crafted using only the finest materials, sourced from renowned suppliers who share our commitment to quality and sustainability.</p>
        <a href="/about" class="btn btn-primary">Learn More</a>
      </div>
      <div class="experience-image-container">
        <img src="/images/products/saree.jpg" alt="Luxury Experience" class="experience-image" loading="lazy">
        <div class="experience-image-accent"></div>
      </div>
    </div>
  </div>
</section>

<!-- QuickView Modal -->
<QuickViewModal
  product={quickViewProduct}
  open={quickViewOpen}
  on:close={handleCloseQuickView}
/>

<style>
  /* Elements with animations will have this class added */
  :global(.animated) {
    will-change: transform, opacity;
  }

  /* Milano-style hero styles */
  .milano-hero {
    position: relative;
    height: auto;
    min-height: 90vh;
    display: flex;
    align-items: center;
    background-color: #e1dbda; /* Updated to match Az-Milano's background color */
    overflow: hidden;
    padding: 6rem 0;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(33,33,33,0.03) 0%, rgba(33,33,33,0.01) 100%);
    z-index: 1;
  }

  .hero-content-left {
    position: relative;
    z-index: 2;
    padding-right: 2rem;
    max-width: 600px;
  }

  .hero-title {
    font-size: 3.5rem;
    margin-bottom: 2rem;
    line-height: 1.1;
    font-weight: 700;
    overflow: visible;
  }

  .hero-line {
    display: block;
    color: var(--color-charcoal);
    margin-bottom: 0.5rem;
    transform: translateX(100px);
    opacity: 0;
  }

  .hero-line-3 {
    font-size: 1.25em; /* Larger than other lines */
    font-weight: 800; /* Bolder than other lines */
    color: var(--color-white);
  }

  .hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2.5rem;
    font-weight: 300;
    max-width: 500px;
    color: var(--color-white);
    transform: translateY(20px);
    opacity: 0;
  }

  .hero-button {
    opacity: 0;
    transform: translateY(20px);
    font-size: 1.1rem;
    padding: 0.9rem 2.5rem;
    letter-spacing: 0.15em;
    font-weight: 600; /* Make it bolder */
    border-radius: 2px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    background-color: var(--color-gold-dark); /* Darker gold background */
    color: var(--color-white); /* White text for contrast */
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* Add slight text shadow for better readability */
  }

  .hero-button:hover {
    transform: translateY(-7px) !important;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25) !important;
    background-color: var(--color-gold); /* Lighter on hover */
  }

  /* Override the btn-primary styles specifically for the hero button */
  .hero-btns .btn-primary {
    background-color: var(--color-gold-dark);
    color: var(--color-white);
    border: none;
  }

  .hero-btns .btn-primary:hover {
    background-color: var(--color-gold);
  }

  .hero-btns {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .hero-image-container {
    position: relative;
    z-index: 2;
    height: 100%;
  }

  .hero-image {
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: 2px;
    position: relative;
    z-index: 3;
  }

  .hero-accent {
    position: absolute;
    bottom: -40px;
    right: -40px;
    width: 180px;
    height: 180px;
    background-color: var(--color-gold);
    opacity: 0.2;
    z-index: 1;
  }

  @media (min-width: 768px) {
    .hero-title {
      font-size: 4.5rem;
    }

    .hero-subtitle {
      font-size: 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .hero-title {
      font-size: 5.5rem;
    }
  }

  /* Mobile optimization styles */
  @media (max-width: 767px) {
    .milano-hero {
      padding: 4rem 0;
      min-height: 80vh;
      text-align: center; /* Center text on mobile */
    }

    .hero-title {
      font-size: 2.8rem;
    }

    .hero-subtitle {
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
      margin-left: auto;
      margin-right: auto;
      text-align: center;
    }

    .hero-image-container {
      margin-top: 2rem;
      order: -1;
    }

    .hero-accent {
      bottom: -20px;
      right: -20px;
      width: 100px;
      height: 100px;
    }

    .hero-content-left {
      padding-right: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-btns {
      flex-direction: column;
      width: 100%;
      max-width: 300px;
    }

    .hero-btns .btn {
      width: 100%;
      margin-bottom: 0.75rem;
      padding: 1rem; /* Larger touch target */
    }
  }

  /* Existing styles */
  .hero {
    position: relative;
    height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-cream-dark);
    background-image: url('/images/products/saree.jpg');
    background-size: cover;
    background-position: center;
    color: var(--color-white);
    overflow: hidden;
  }

  .luxury-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
    background-color: var(--color-cream);
  }

  .luxury-divider-line {
    height: 1px;
    width: 100px;
    background-color: var(--color-gold);
    opacity: 0.7;
  }

  .luxury-divider-emblem {
    font-family: var(--heading-font);
    font-size: 2rem;
    color: var(--color-gold);
    margin: 0 1.5rem;
    font-weight: 500;
  }

  .product-card-container {
    height: 100%;
    opacity: 1;
  }

  .experience-section {
    background-color: var(--color-cream-dark);
    position: relative;
    overflow: hidden;
  }

  .experience-section::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background-color: rgba(212, 175, 55, 0.1);
    z-index: 1;
  }

  .experience-content {
    position: relative;
    z-index: 2;
  }

  .section-accent {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--color-gold);
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .experience-image-container {
    position: relative;
    z-index: 2;
  }

  .experience-image {
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: 2px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }

  .experience-image-accent {
    position: absolute;
    bottom: -20px;
    right: -20px;
    width: 50%;
    height: 50%;
    border: 1px solid var(--color-gold);
    border-radius: 2px;
    z-index: -1;
  }

  @media (min-width: 768px) {
    .luxury-divider-line {
      width: 150px;
    }

    .luxury-divider-emblem {
      font-size: 2.5rem;
    }
  }

  @media (max-width: 767px) {
    /* Improved featured products grid for mobile */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr); /* Single column on small mobile */
      gap: 1.5rem;
      margin: 1rem 0;
    }

    /* Target section title spacing */
    .section-title {
      margin-bottom: 0.5rem;
    }

    .section-subtitle {
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }

    /* Container padding adjustments */
    .container {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }

  /* Medium mobile devices (480px and up) */
  @media (min-width: 480px) and (max-width: 767px) {
    .product-grid {
      grid-template-columns: repeat(2, 1fr); /* 2 columns on larger mobile */
      gap: 1rem;
    }
  }
</style>
