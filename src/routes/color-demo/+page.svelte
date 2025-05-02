<script lang="ts">
  import ColorPieChart from '$lib/components/UI/ColorPieChart.svelte';

  // Example color combinations
  const twoColorCombinations = [
    ['#E32D2D', '#0048A5'], // Red and Blue (like in first reference image)
    ['#E32D2D', '#FFD500'], // Red and Yellow
    ['#0048A5', '#00CC00'], // Blue and Green
    ['#FF00FF', '#00FFFF'], // Magenta and Cyan
    ['#000000', '#FFFFFF'], // Black and White
  ];

  const threeColorCombinations = [
    ['#E32D2D', '#0048A5', '#FFD500'], // Red, Blue, Yellow (like in second reference image)
    ['#E32D2D', '#00CC00', '#0048A5'], // Red, Green, Blue
    ['#FF00FF', '#FFD500', '#00FFFF'], // Magenta, Yellow, Cyan
    ['#FF6600', '#0066FF', '#66FF00'], // Orange, Light Blue, Light Green
    ['#000000', '#888888', '#FFFFFF'], // Black, Gray, White
  ];

  // Size options
  const sizes = [24, 32, 48, 64, 96];
  let selectedSize = 48;
</script>

<svelte:head>
  <title>Color Pie Chart Demo</title>
</svelte:head>

<div class="container">
  <header>
    <h1>Color Pie Chart Demo</h1>
    <p>
      This page demonstrates the ColorPieChart component which displays multiple
      hex colors as a pie chart. The chart supports 1-3 colors.
    </p>
  </header>

  <section>
    <h2>Size Options</h2>
    <div class="size-options">
      {#each sizes as size}
        <button
          class="size-option {selectedSize === size ? 'active' : ''}"
          on:click={() => selectedSize = size}
        >
          {size}px
        </button>
      {/each}
    </div>
  </section>

  <section>
    <h2>Two-Color Combinations</h2>
    <div class="color-combinations">
      {#each twoColorCombinations as colors}
        <div class="color-combination">
          <ColorPieChart
            hexColors={colors}
            size={selectedSize}
            border={true}
            borderWidth={2}
          />
          <div class="color-info">
            {#each colors as color}
              <div class="color-code" style="color: {color}">
                {color}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2>Three-Color Combinations</h2>
    <div class="color-combinations">
      {#each threeColorCombinations as colors}
        <div class="color-combination">
          <ColorPieChart
            hexColors={colors}
            size={selectedSize}
            border={true}
            borderWidth={2}
          />
          <div class="color-info">
            {#each colors as color}
              <div class="color-code" style="color: {color}">
                {color}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    margin-bottom: 2rem;
    text-align: center;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.8rem;
    margin: 2rem 0 1rem;
  }

  section {
    margin-bottom: 3rem;
  }

  .size-options {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .size-option {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    background: white;
    cursor: pointer;
  }

  .size-option.active {
    background: var(--color-gold, #d4af37);
    color: white;
    border-color: var(--color-gold, #d4af37);
  }

  .color-combinations {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2rem;
  }

  .color-combination {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border: 1px solid #eee;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .color-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .color-code {
    font-family: monospace;
    font-weight: bold;
    margin-top: 0.25rem;
    font-size: 0.9rem;
  }
</style>
