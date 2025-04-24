<script lang="ts">
  import { onMount } from 'svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import QuickViewModal from '$lib/components/QuickViewModal.svelte';
  import gsap from 'gsap';
  import type { Product } from '$lib/types';
  import LazyImage from '../components/LazyImage.svelte';

  // SSR‐injected data
  export let data: {
    featuredProducts: Product[];
    categories:       any[];
    totalProductCount: number;
  };

  // Use the server‑rendered products directly
  let featuredProducts: Product[] = data.featuredProducts;

  let quickViewProduct: Product | null = null;
  let quickViewOpen = false;
  let heroSection: HTMLElement;
  let heroContent: HTMLElement;
  let featuredSection: HTMLElement;
  let experienceSection: HTMLElement;
  let heroTitle: HTMLElement;
  let heroSubtitle: HTMLElement;
  let heroBtns: HTMLElement;
  let isMobile = false;

  const handleQuickView = (event: CustomEvent<{product: Product}>) => {
    quickViewProduct = event.detail.product;
    quickViewOpen = true;
    document.body.style.overflow = 'hidden';
  };

  const handleCloseQuickView = () => {
    quickViewOpen = false;
    document.body.style.overflow = '';
  };

  function createIntersectionObserver(callback: IntersectionObserverCallback) {
    const options = {
      rootMargin: isMobile ? '50px' : '100px',
      threshold: isMobile ? 0.1 : 0.01
    };

    return new IntersectionObserver(callback, options);
  }

  function isInViewport(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  function handleScrollAnimations() {
    // Featured section animations
    if (featuredSection && isInViewport(featuredSection)) {
      const title = featuredSection.querySelector('.section-title') as HTMLElement;
      const subtitle = featuredSection.querySelector('.section-subtitle') as HTMLElement;

      if (title && !title.classList.contains('animated')) {
        title.classList.add('animated');
        gsap.from(title, {
          duration: isMobile ? 0.6 : 0.8,
          opacity: 0,
          y: isMobile ? 20 : 30,
          ease: "power2.out"
        });
      }

      if (subtitle && !subtitle.classList.contains('animated')) {
        subtitle.classList.add('animated');
        gsap.from(subtitle, {
          duration: isMobile ? 0.6 : 0.8,
          opacity: 0,
          y: isMobile ? 15 : 20,
          delay: isMobile ? 0.1 : 0.2,
          ease: "power2.out"
        });
      }

      const productCards = featuredSection.querySelectorAll('.product-card-container');
      productCards.forEach((card, index) => {
        if (!card.classList.contains('animated') && isInViewport(card as HTMLElement)) {
          card.classList.add('animated');
          gsap.from(card, {
            duration: isMobile ? 0.6 : 0.8,
            opacity: 0,
            y: isMobile ? 30 : 40,
            delay: (isMobile ? 0.05 : 0.1) * index,
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
            delay: (isMobile ? 0.05 : 0.1) * index,
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

  function initTouchInteractions() {
    if (!heroSection) return;
    const heroImage = heroSection.querySelector('.hero');
    if (!heroImage) return;

    let startY = 0;

    heroSection.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    heroSection.addEventListener('touchmove', (e) => {
      const moveY = e.touches[0].clientY - startY;
      const parallaxAmount = moveY * 0.05;

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
      gsap.to([heroTitle, heroSubtitle], {
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    }, { passive: true });
  }

  // Svelte 5: use onMount instead of afterPaint
  function initialize() {
    if (typeof window === 'undefined') return;

    isMobile = window.innerWidth < 768;
    window.addEventListener('resize', () => {
      isMobile = window.innerWidth < 768;
    });

    const heroTl = gsap.timeline({ defaults: { ease: "power2.out" } });

    gsap.set('.hero-line', { opacity: 0, x: 100 });
    gsap.set('.hero-button', { opacity: 0, y: 20 });
    gsap.set('.hero-subtitle', { opacity: 0, y: 20 });

    heroTl.to('.hero-line-1', { x: 0, y: 0, opacity: 1, duration: 0.5 });
    heroTl.to('.hero-line-2', { x: 0, y: 0, opacity: 1, duration: 0.5 }, "+=0.15");
    heroTl.to('.hero-line-3', { x: 0, y: 0, opacity: 1, duration: 0.5 }, "+=0.15");
    heroTl.to('.hero-subtitle', { y: 0, opacity: 1, duration: 0.4 }, "+=0.1");
    heroTl.to('.hero-button', { y: 0, opacity: 1, duration: 0.4 }, "+=0.1");
    heroTl.from('.hero-accent', { opacity: 0, scale: 0.9, duration: 0.5 }, "-=0.3");

    if (!isMobile) {
      gsap.to('.hero-accent', {
        y: -20,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    if (isMobile) {
      initTouchInteractions();
    }

    if ('IntersectionObserver' in window) {
      const observer = createIntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target instanceof HTMLElement) {
              entry.target.style.willChange = 'opacity, transform';
            }
            handleScrollAnimations();
            setTimeout(() => {
              if (entry.target instanceof HTMLElement) {
                entry.target.style.willChange = 'auto';
              }
            }, 1000);
            observer.unobserve(entry.target);
          }
        });
      });

      if (featuredSection) observer.observe(featuredSection);
      if (experienceSection) observer.observe(experienceSection);
    } else {
      window.addEventListener('scroll', handleScrollAnimations, { passive: true });
    }

    handleScrollAnimations();

    return () => {
      window.removeEventListener('scroll', handleScrollAnimations);
    };
  }

  onMount(initialize);
</script>

<svelte:head>
  <title>Pransh - Luxury Clothing</title>
  <meta name="description" content="Discover Pransh, a luxury clothing brand offering timeless elegance and exceptional quality.">
</svelte:head>

<!-- Hero Section -->
<section class="hero-container" bind:this={heroSection}>
  <div class="hero milano-hero">
    <div class="hero-overlay"></div>
    <div class="container mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 items-center">
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
        <div class="hero-image-container">
          <LazyImage
            src="/images/products/saree.jpg"
            alt="Luxury Fashion"
            className="hero-image"
            height="600px"
            borderRadius="2px"
          />
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
<div class="featured-products" bind:this={featuredSection}>
  <div class="container mx-auto px-4 py-12">
    <h2 class="section-title text-3xl md:text-4xl font-serif text-center mb-4">Featured Products</h2>
    <p class="section-subtitle text-gray-600 text-center mb-10">Discover our most popular luxury items</p>
    {#if featuredProducts.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-600">No featured products available at the moment.</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {#each featuredProducts as product}
          <div class="product-card-container">
            <ProductCard {product} on:quickView={handleQuickView} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

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
        <LazyImage
          src="/images/products/saree.jpg"
          alt="Luxury Experience"
          className="experience-image"
          height="500px"
          borderRadius="2px"
        />
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
    background-color: #e1dbda;
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
    font-size: 1.25em;
    font-weight: 800;
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
    font-weight: 600;
    border-radius: 2px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    background-color: var(--color-gold-dark);
    color: var(--color-white);
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  .hero-button:hover {
    transform: translateY(-7px) !important;
    box-shadow: 0 15px 30px rgba(0,0,0,0.25) !important;
    background-color: var(--color-gold);
  }
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
    height: 600px;
  }
  .hero-image {
    width: 100%;
    height: 100%;
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
  @media (max-width: 767px) {
    .milano-hero {
      padding: 4rem 0;
      min-height: 80vh;
      text-align: center;
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
      padding: 1rem;
    }
  }
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
    /* Make product cards smaller for homepage grid */
    padding: 0.25rem 0;
    /* Optionally, force max-width if ProductCard does not have it */
    /* max-width: 250px; */
  }
  .featured-products .grid {
    /* Override grid gap for smaller look */
    gap: 1rem !important;
  }
  @media (max-width: 767px) {
    .featured-products .grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.75rem !important;
    }
  }
  @media (min-width: 768px) {
    .luxury-divider-line { width: 150px; }
    .luxury-divider-emblem { font-size: 2.5rem; }
    .featured-products .grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 1.5rem !important;
    }
  }
  @media (min-width: 1024px) {
    .featured-products .grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 2rem !important;
    }
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
    background-color: rgba(212,175,55,0.1);
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
  .experience-image-container { position: relative; z-index: 2; height: 500px; }
  .experience-image { width: 100%; height: 100%; }
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
  @media (max-width: 767px) {
    .product-grid {
      display: grid;
      grid-template-columns: repeat(1,1fr);
      gap: 1.5rem;
      margin: 1rem 0;
    }
    .section-title { margin-bottom: 0.5rem; }
    .section-subtitle { font-size: 0.95rem; margin-bottom: 1.5rem; }
    .container { padding-left: 1rem; padding-right: 1rem; }
  }
  @media (min-width: 480px) and (max-width:767px) {
    .product-grid { grid-template-columns: repeat(2,1fr); gap: 1rem; }
  }
</style>
