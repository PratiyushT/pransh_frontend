<script lang="ts">
  import { onMount } from 'svelte';
  import { isSearchOpen, closeSearch, performSearch, searchQuery } from '$lib/stores/index';
  import gsap from 'gsap';

  let searchInput: HTMLInputElement;
  let searchModalContent: HTMLElement;
  let searchValue = '';

  onMount(() => {
    // Focus input when search modal opens
    const unsubscribe = isSearchOpen.subscribe(value => {
      if (value && searchInput) {
        setTimeout(() => {
          searchInput.focus();
        }, 100);
      }
    });

    // Initialize searchValue from store
    const queryUnsubscribe = searchQuery.subscribe(value => {
      searchValue = value;
    });

    // Close search modal when escape key is pressed
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && $isSearchOpen) {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);

    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if ($isSearchOpen && searchModalContent && !searchModalContent.contains(e.target as Node)) {
        closeSearch();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);

    // Clean up event listeners
    return () => {
      unsubscribe();
      queryUnsubscribe();
      window.removeEventListener('keydown', handleEscapeKey);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  });

  // Animation effects when modal opens/closes
  $: if ($isSearchOpen && searchModalContent) {
    gsap.fromTo(searchModalContent,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );
  }

  // Handle search submit
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (searchValue.trim()) {
      performSearch(searchValue.trim());
    }
  };
</script>

<div class="search-modal-overlay" class:open={$isSearchOpen}>
  <div class="search-modal-container">
    <div class="search-modal-content" bind:this={searchModalContent}>
      <div class="search-modal-header">
        <h2 class="search-modal-title">Search</h2>
        <button
          class="search-close-button"
          on:click={closeSearch}
          aria-label="Close search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form on:submit={handleSubmit} class="search-form">
        <div class="search-input-container">
          <svg
            class="search-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            bind:value={searchValue}
            bind:this={searchInput}
            placeholder="Search for products..."
            class="search-input"
          />
        </div>
        <button type="submit" class="search-button">Search</button>
      </form>

      <div class="search-tips">
        <p>
          Try searching for product types (e.g., "dress"), materials (e.g., "silk"),
          or colors (e.g., "black").
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  .search-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 100;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .search-modal-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .search-modal-container {
    width: 100%;
    max-width: 600px;
    margin: 0 1rem;
  }

  .search-modal-content {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    padding: 1.5rem;
    position: relative;
  }

  .search-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .search-modal-title {
    font-family: var(--heading-font);
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--color-charcoal);
    margin: 0;
  }

  .search-close-button {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.03);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--color-charcoal);
  }

  .search-close-button:hover {
    background-color: rgba(212, 175, 55, 0.1);
    color: var(--color-gold);
    transform: rotate(90deg);
  }

  .search-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .search-input-container {
    position: relative;
    width: 100%;
  }

  .search-icon {
    position: absolute;
    top: 50%;
    left: 1rem;
    transform: translateY(-50%);
    color: #777;
  }

  .search-input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 1px solid var(--color-light-gray);
    border-radius: 4px;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-gold);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  .search-button {
    background-color: var(--color-gold);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .search-button:hover {
    background-color: #c29d2e;
  }

  .search-tips {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-light-gray);
  }

  .search-tips p {
    font-size: 0.875rem;
    color: #777;
    margin: 0;
  }

  @media (min-width: 768px) {
    .search-form {
      flex-direction: row;
    }

    .search-button {
      width: auto;
      padding: 0 2rem;
    }
  }
</style>
