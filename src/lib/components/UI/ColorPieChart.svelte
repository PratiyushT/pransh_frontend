<script lang="ts">
  // Props - Array of hex color codes to display in the pie chart
  export let hexColors: string[] = [];
  export let size: number = 24; // Size of the circle in pixels
  export let border: boolean = true; // Whether to show a border
  export let borderColor: string = "#e2e2e2"; // Border color
  export let borderWidth: number = 1; // Border width

  // Making sure we only use up to 3 colors
  $: validColors = hexColors.slice(0, 3);
</script>

<div
  class="color-pie-chart"
  style="width: {size}px; height: {size}px;"
>
  {#if validColors.length === 1}
    <!-- Single color is just a simple circle -->
    <div
      class="color-circle"
      style="
        background-color: {validColors[0]};
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: {border ? `${borderWidth}px solid ${borderColor}` : 'none'};
      "
    ></div>
  {:else if validColors.length === 2}
    <!-- Two-color diagonal split exactly like the first reference image -->
    <div
      class="color-split two-colors"
      style="
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
        border: {border ? `${borderWidth}px solid ${borderColor}` : 'none'};
        position: relative;
      "
    >
      <!-- First color (top-left) -->
      <div
        class="color-part"
        style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: {validColors[0]};
          clip-path: polygon(0 0, 100% 0, 0 100%);
        "
      ></div>
      <!-- Second color (bottom-right) -->
      <div
        class="color-part"
        style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: {validColors[1]};
          clip-path: polygon(100% 0, 100% 100%, 0 100%);
        "
      ></div>
    </div>
  {:else if validColors.length === 3}
    <!-- Three-color split exactly like the second reference image -->
    <div
      class="color-split three-colors"
      style="
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
        border: {border ? `${borderWidth}px solid ${borderColor}` : 'none'};
        position: relative;
      "
    >
      <!-- Yellow part (right half) -->
      <div
        class="color-part"
        style="
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          background-color: {validColors[2]};
        "
      ></div>
      <!-- Red part (top left) -->
      <div
        class="color-part"
        style="
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 50%;
          background-color: {validColors[0]};
        "
      ></div>
      <!-- Blue part (bottom left) -->
      <div
        class="color-part"
        style="
          position: absolute;
          top: 50%;
          left: 0;
          width: 50%;
          height: 50%;
          background-color: {validColors[1]};
        "
      ></div>
    </div>
  {/if}
</div>

<style>
  .color-pie-chart {
    display: inline-block;
    position: relative;
  }
</style>
