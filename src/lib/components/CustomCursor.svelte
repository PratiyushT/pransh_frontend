<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  let customCursor: HTMLElement;
  let isHovering = false;
  let isActive = false;
  let isMobile = false;

  onMount(() => {
    // Check if mobile/touch device
    isMobile = 'ontouchstart' in window ||
               navigator.maxTouchPoints > 0 ||
               (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    // Don't initialize custom cursor on mobile devices
    if (isMobile) return;

    // Initialize cursor position at center
    if (customCursor && typeof window !== 'undefined') {
      customCursor.style.opacity = '0';

      // Smooth cursor positioning with slight lag for elegant effect
      const handleMouseMove = (e: MouseEvent) => {
        if (customCursor) {
          customCursor.style.opacity = '1';

          try {
            gsap.to(customCursor, {
              duration: 0.3,
              x: e.clientX,
              y: e.clientY,
              ease: "power2.out"
            });
          } catch (error) {
            // Fallback to direct positioning if GSAP fails
            customCursor.style.left = `${e.clientX}px`;
            customCursor.style.top = `${e.clientY}px`;
          }
        }
      };

      const handleMouseDown = () => {
        isActive = true;
      };

      const handleMouseUp = () => {
        isActive = false;
      };

      // Check for hoverable elements
      const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'A' ||
          target.tagName === 'BUTTON' ||
          target.classList.contains('hoverable') ||
          target.closest('a') ||
          target.closest('button') ||
          target.closest('.hoverable')
        ) {
          isHovering = true;
        }
      };

      const handleMouseOut = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'A' ||
          target.tagName === 'BUTTON' ||
          target.classList.contains('hoverable') ||
          target.closest('a') ||
          target.closest('button') ||
          target.closest('.hoverable')
        ) {
          isHovering = false;
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseover', handleMouseOver);
      document.addEventListener('mouseout', handleMouseOut);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('mouseout', handleMouseOut);
      };
    }
  });
</script>

{#if !isMobile}
<div
  class="custom-cursor"
  class:hover={isHovering}
  class:active={isActive}
  bind:this={customCursor}
></div>
{/if}

<style>
  .custom-cursor {
    position: fixed;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 9999px;
    background-color: #D4AF37;
    mix-blend-mode: difference;
    pointer-events: none;
    z-index: 50;
    transform: translate(-50%, -50%);
    transition: width 0.3s, height 0.3s;
    will-change: transform;
  }

  .custom-cursor.hover {
    width: 3rem;
    height: 3rem;
  }

  .custom-cursor.active {
    width: 1rem;
    height: 1rem;
  }
</style>
