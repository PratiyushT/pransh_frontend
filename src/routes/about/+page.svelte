<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  gsap.registerPlugin(ScrollTrigger);

  let sections: HTMLElement[] = [];

  onMount(() => {
    // Animate sections on scroll
    sections.forEach((section, index) => {
      gsap.fromTo(
        section,
        {
          y: 50,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            once: true
          }
        }
      );
    });
  });
</script>

<svelte:head>
  <title>About | Pransh</title>
  <meta name="description" content="Learn about Pransh - luxury clothing with timeless elegance and exceptional quality.">
</svelte:head>

<div class="container mx-auto">
  <!-- Hero Section -->
  <section class="py-20 px-4 md:px-8 lg:px-12 bg-secondary text-white">
    <div class="max-w-3xl mx-auto text-center" bind:this={sections[0]}>
      <h1 class="font-serif text-5xl md:text-6xl lg:text-7xl mb-6">Our Story</h1>
      <p class="text-lg md:text-xl">
        Founded on the principles of exceptional craftsmanship and timeless design,
        Pransh is dedicated to creating luxury garments that transcend seasonal trends.
      </p>
    </div>
  </section>

  <section class="py-20 px-4 md:px-8 lg:px-12">
    <div class="container mx-auto">
      <div class="flex flex-col md:flex-row gap-12 items-center">
        <div class="md:w-1/2" bind:this={sections[1]}>
          <h2 class="font-serif text-3xl md:text-4xl mb-6">Exceptional Craftsmanship</h2>
          <p class="mb-4">
            Every piece in our collection is meticulously crafted by skilled artisans who bring decades of experience to their work.
            We believe that true luxury exists in the details, the refined finishing touches that elevate a simple garment to an extraordinary one.
          </p>
          <p>
            Our commitment to quality means we never rush the process. Each garment receives the time and attention it deserves,
            resulting in pieces that not only look beautiful but are built to last for years to come.
          </p>
        </div>
        <div class="md:w-1/2 bg-gray-light aspect-[4/3]" bind:this={sections[2]}>
          <img
            src="/images/product-placeholder.jpg"
            alt="Artisan crafting a garment"
            class="w-full h-auto rounded-lg shadow-md"
          >
        </div>
      </div>
    </div>
  </section>

  <!-- Values Section -->
  <section class="py-20 px-4 md:px-8 lg:px-12 bg-white">
    <div class="container mx-auto">
      <h2 class="font-serif text-4xl text-center mb-16" bind:this={sections[3]}>Our Values</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div class="text-center" bind:this={sections[4]}>
          <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="font-serif text-xl mb-4">Craftsmanship</h3>
          <p>
            Every Pransh garment is meticulously crafted by expert artisans,
            ensuring exceptional quality and attention to detail.
          </p>
        </div>

        <div class="text-center" bind:this={sections[5]}>
          <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h3 class="font-serif text-xl mb-4">Sustainability</h3>
          <p>
            We're committed to ethical practices and sustainable materials,
            reducing our environmental impact while creating luxury pieces.
          </p>
        </div>

        <div class="text-center" bind:this={sections[6]}>
          <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 class="font-serif text-xl mb-4">Innovation</h3>
          <p>
            While honoring traditional techniques, we embrace innovation
            to enhance comfort, durability, and design.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Process Section -->
  <section class="py-20 px-4 md:px-8 lg:px-12 bg-beige">
    <div class="container mx-auto">
      <h2 class="font-serif text-4xl text-center mb-16" bind:this={sections[7]}>Our Process</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div class="bg-white p-8 relative" bind:this={sections[8]}>
          <div class="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-serif text-xl">
            1
          </div>
          <h3 class="font-serif text-xl mb-4">Design</h3>
          <p>
            Our designers draw inspiration from art, architecture, and nature to create
            timeless designs that balance aesthetics and functionality.
          </p>
        </div>

        <div class="bg-white p-8 relative" bind:this={sections[9]}>
          <div class="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-serif text-xl">
            2
          </div>
          <h3 class="font-serif text-xl mb-4">Material Selection</h3>
          <p>
            We source only the finest sustainable materials from ethical suppliers
            around the world, ensuring quality and responsibility.
          </p>
        </div>

        <div class="bg-white p-8 relative" bind:this={sections[10]}>
          <div class="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-serif text-xl">
            3
          </div>
          <h3 class="font-serif text-xl mb-4">Crafting</h3>
          <p>
            Expert artisans meticulously craft each piece by hand,
            paying attention to every detail and stitch.
          </p>
        </div>

        <div class="bg-white p-8 relative" bind:this={sections[11]}>
          <div class="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-serif text-xl">
            4
          </div>
          <h3 class="font-serif text-xl mb-4">Quality Control</h3>
          <p>
            Each garment undergoes rigorous inspection to ensure
            it meets our exacting standards of excellence.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-32 px-4 md:px-8 lg:px-12 bg-secondary text-white">
    <div class="container mx-auto">
      <div class="max-w-3xl mx-auto text-center" bind:this={sections[12]}>
        <h2 class="font-serif text-4xl md:text-5xl mb-8">Experience Pransh Luxury</h2>
        <p class="text-lg mb-10">
          Discover our collection of meticulously crafted garments that
          embody timeless elegance and exceptional quality.
        </p>
        <a href="/shop" class="btn btn-primary">Shop Now</a>
      </div>
    </div>
  </section>
</div>
