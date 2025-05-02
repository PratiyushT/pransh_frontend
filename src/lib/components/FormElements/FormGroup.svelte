<script lang="ts">
  export let columns: number = 1; // Number of columns
  export let gap: number = 4; // Gap size in Tailwind units (1-12)
</script>

<div class="form-group {columns > 1 ? `grid grid-cols-1 md:grid-cols-${columns} gap-${gap}` : ''}">
  <slot />
</div>

<style>
  .form-group {
    margin-bottom: 1.5rem;
  }
  .grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .gap-2 {
    gap: 0.5rem;
  }
  .gap-4 {
    gap: 1rem;
  }
  .gap-6 {
    gap: 1.5rem;
  }
  .gap-8 {
    gap: 2rem;
  }
</style>
