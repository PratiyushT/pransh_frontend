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

  // Function to handle scroll animations
  function handleScrollAnimations() {
    // Featured section animations
    if (featuredSection && isInViewport(featuredSection)) {
      const title = featuredSection.querySelector('.section-title');
      const subtitle = featuredSection.querySelector('.section-subtitle');

      if (title && !title.classList.contains('animated')) {
        title.classList.add('animated');
        gsap.from(title, {
          duration: 0.8,
          opacity: 0,
          y: 30,
          ease: "power2.out"
        });
      }

      if (subtitle && !subtitle.classList.contains('animated')) {
        subtitle.classList.add('animated');
        gsap.from(subtitle, {
          duration: 0.8,
          opacity: 0,
          y: 20,
          delay: 0.2,
          ease: "power2.out"
        });
      }

      const productCards = featuredSection.querySelectorAll('.product-card-container');
      productCards.forEach((card, index) => {
        if (!card.classList.contains('animated') && isInViewport(card)) {
          card.classList.add('animated');
          gsap.from(card, {
            duration: 0.8,
            opacity: 0,
            y: 40,
            delay: 0.1 * index,
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
            duration: 0.8,
            opacity: 0,
            y: 30,
            delay: 0.1 * index,
            ease: "power2.out"
          });
        }
      });

      const image = experienceSection.querySelector('.experience-image');
      if (image && !image.classList.contains('animated')) {
        image.classList.add('animated');
        gsap.from(image, {
          duration: 1,
          opacity: 0,
          scale: 0.95,
          delay: 0.3,
          ease: "power2.out"
        });
      }

      const accent = experienceSection.querySelector('.experience-image-accent');
      if (accent && !accent.classList.contains('animated')) {
        accent.classList.add('animated');
        gsap.from(accent, {
          duration: 1,
          opacity: 0,
          scale: 0.8,
          delay: 0.5,
          ease: "power2.out"
        });
      }
    }
  }

  onMount(() => {
    // Hero section animation
    const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTl
      .from(heroContent.querySelector('.hero-title'), {
        duration: 1.2,
        opacity: 0,
        y: 50,
        delay: 0.5
      })
      .from(heroContent.querySelector('.hero-subtitle'), {
        duration: 1,
        opacity: 0,
        y: 30
      }, "-=0.7")
      .from(heroContent.querySelector('.hero-btns'), {
        duration: 0.8,
        opacity: 0,
        y: 20
      }, "-=0.5");

    // Add more subtle animations
    gsap.from('.luxury-divider', {
      duration: 1,
      opacity: 0,
      y: 20,
      ease: "power2.out",
      delay: 0.5
    });

    // Set up scroll listener for animations
    window.addEventListener('scroll', handleScrollAnimations);

    // Run once to check for elements already in view
    handleScrollAnimations();

    return () => {
      // Clean up on component unmount
      window.removeEventListener('scroll', handleScrollAnimations);
    };
  });
</script>

<svelte:head>
  <title>Pransh - Luxury Clothing</title>
  <meta name="description" content="Discover Pransh, a luxury clothing brand offering timeless elegance and exceptional quality.">
</svelte:head>

<!-- Hero Section -->
<section class="hero" bind:this={heroSection}>
  <div class="hero-overlay"></div>
  <div class="hero-content" bind:this={heroContent}>
    <h1 class="hero-title">Timeless Elegance<br>Exceptional Quality</h1>
    <p class="hero-subtitle">
      Discover our exquisite collection of luxury garments crafted with the finest materials and meticulous attention to detail.
    </p>
    <div class="hero-btns">
      <a href="/category/all" class="btn btn-primary">Shop Collection</a>
      <a href="/about" class="btn btn-secondary">About & Contact</a>
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
      <a href="/category/all" class="btn btn-secondary">View All Products</a>
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
        <img src="/images/products/saree.jpg" alt="Luxury Experience" class="experience-image">
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

  .hero {
    position: relative;
    height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-cream-dark);
    background-image: url('/images/products/dress.jpg');
    background-size: cover;
    background-position: center;
    color: var(--color-white);
    overflow: hidden;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%);
    z-index: 1;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 800px;
    padding: 0 1.5rem;
  }

  .hero-title {
    font-size: 3.5rem;
    margin-bottom: 1.5rem;
    line-height: 1.1;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }

  .hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    font-weight: 300;
    text-shadow: 0 1px 5px rgba(0,0,0,0.3);
  }

  .hero-btns {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
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
    .hero-title {
      font-size: 4.5rem;
    }

    .hero-subtitle {
      font-size: 1.5rem;
    }

    .luxury-divider-line {
      width: 150px;
    }

    .luxury-divider-emblem {
      font-size: 2.5rem;
    }
  }

  @media (min-width: 1024px) {
    .hero-title {
      font-size: 5.5rem;
    }
  }
</style>
