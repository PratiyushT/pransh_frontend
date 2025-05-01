<script>
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>Error {page.status} | Pransh</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-[70vh] container mx-auto px-4 py-12 text-center">
  <h1 class="text-6xl font-serif mb-4">{page.status}</h1>
  <p class="text-xl mb-8">{page.error?.message || "Page not found"}</p>
  <a href="/" class="btn btn-primary">Return to Home</a>
</div>
