# Components: Function-Level Documentation

This document covers every Svelte component in **src/lib/components/**. For each component, the sections are:

1. **Purpose** – What the component does.
2. **File Path** – Location within the project.
3. **Imports** – External modules, stores, and utilities used.
4. **Exports (Props/Stores)** – Props and subscribed stores.
5. **Functions** – Signature, description, return value, parameters, and example usage.
6. **Events/Actions** – Dispatched events or store actions invoked.
7. **Flow** – ASCII diagram showing lifecycle and interactions.

---

## AddressSearch.svelte

**Purpose:**
Provides address autocomplete via Mapbox with a manual-entry fallback, emitting structured address data upward.

**File Path:**
`/src/lib/components/AddressSearch.svelte`

### Imports
```js
import { onMount, createEventDispatcher } from 'svelte';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { PUBLIC_MAPBOX_API_KEY } from '$env/static/public';
```

### Exports (Props/Stores)
```js
export let showManualEntryForm: boolean = false;
```

### Events/Actions
- **dispatch = createEventDispatcher()**
- Emits:
  - `addressSelected` ({ addressLine1, city, state, postalCode, country })
  - `addressCleared`
  - `showManualEntry`

### Functions
1. **initGeocoder()** – Initializes and returns a `MapboxGeocoder` instance.
2. **handleResult(event)** – Parses `event.result` into address fields and dispatches `addressSelected`.
3. **clearSelection()** – Dispatches `addressCleared` to reset parent UI.
4. **openManualEntry()** – Dispatches `showManualEntry` to reveal manual-entry form.

### Flow
```
onMount
  |
  +--> initGeocoder()
         |
    User types into input
         |
    Geocoder suggests places
         |
    User selects suggestion
         |
    handleResult(event)
         |
    dispatch 'addressSelected'
         |
    +-- Click Clear
    |      |
    |   clearSelection()
    |      |
    |   dispatch 'addressCleared'
    |
    +-- Click "Enter Manually"
           |
       openManualEntry()
           |
       dispatch 'showManualEntry'
```

---

## CustomCursor.svelte

**Purpose:**
Replaces the native cursor with an animated dot that responds to hover and click, enhancing visual feedback.

**File Path:**
`/src/lib/components/CustomCursor.svelte`

### Imports
```js
import { onMount } from 'svelte';
import { gsap } from 'gsap';
```

### Exports (Props/Stores)
_None_

### Events/Actions
_None_

### Functions
1. **initCursor()** – Creates cursor element and binds global mouse event listeners.
2. **handleMouseMove(event)** – Moves cursor dot to `event.clientX/Y` via GSAP.
3. **handleMouseEnter(), handleMouseLeave(), handleMouseDown(), handleMouseUp()** – Animates cursor scale/opacity for hover and click states.

### Flow
```
onMount
  |
  +--> initCursor()
         |
    ┌─────────────┬───────────────────┬───────────────────┐
    │             │                   │                   │
mousemove -> handleMouseMove()        mouseenter -> handleMouseEnter()
   │                                  │
mouseleave -> handleMouseLeave()       mousedown -> handleMouseDown()
   │                                  │
mouseup -> handleMouseUp()             │
```

---

## Footer.svelte

**Purpose:**
Displays footer with dynamic category links, newsletter signup, social icons, and legal links, animating into view on scroll.

**File Path:**
`/src/lib/components/Footer.svelte`

### Imports
```js
import { onMount } from 'svelte';
import { gsap } from 'gsap';
import { getCategories } from '$lib/api';
```

### Exports (Props/Stores)
_None_

### Events/Actions
_None_

### Functions
1. **loadCategories()** – Fetches shop categories (returns `Promise<string[]>`).
2. **handleSubscribe(event)** – Prevents default, posts email to newsletter endpoint, clears input.
3. **animateIn()** – Plays GSAP entrance animation for footer elements.

### Flow
```
onMount
  |
  +--> animateIn()
         |
    loadCategories()
         |
    render category links

User submits form --┐
                   |
             handleSubscribe()
                   |
      post email & clear input
```

---

## Header.svelte

**Purpose:**
Sticky header with navigation, search, account/wishlist/cart icons; adapts on scroll and toggles mobile menu/search overlay.

**File Path:**
`/src/lib/components/Header.svelte`

### Imports
```js
import { onMount } from 'svelte';
import { gsap } from 'gsap';
import { isMenuOpen, cartCount, wishlistCount, openSearch } from '$lib/stores';
import Menu from './Menu.svelte';
import SearchModal from './SearchModal.svelte';
```

### Exports (Props/Stores)
_None_

### Events/Actions
- Subscribes to `$isMenuOpen`, `$cartCount`, `$wishlistCount`
- Calls `openSearch()` and `isMenuOpen.set()`

### Functions
1. **handleScroll()** – Toggles `.scrolled` class based on `window.scrollY`.
2. **toggleMenu()** – Flips `isMenuOpen` boolean.
3. **openSearchModal()** – Calls `openSearch()` to show `SearchModal`.

### Flow
```
onMount
  |
  +--> bind window.scroll to handleScroll()

hamburger click --> toggleMenu() --> if true then render Menu else hide

search icon click --> openSearchModal() --> render SearchModal

store changes --> cart/wishlist badges update
```

---

## Menu.svelte

**Purpose:**
Fullscreen mobile menu with category links and quick-access icons, animated in/out.

**File Path:**
`/src/lib/components/Menu.svelte`

### Imports
```js
import { getCategories } from '$lib/api';
import { isMenuOpen } from '$lib/stores';
import { tweened } from 'svelte/motion';
```

### Exports (Props/Stores)
_None_

### Events/Actions
- Reads `$isMenuOpen`
- Calls `isMenuOpen.set(false)` in `closeMenu()`

### Functions
1. **closeMenu()** – Sets `isMenuOpen = false`.
2. **loadCategories()** – Fetches categories list (returns `Promise<string[]>`).

### Flow
```
$isMenuOpen = true
   |
   +--> loadCategories()
   |
   +--> animate in via tweened

User clicks backdrop or link
   |
   +--> closeMenu() --> animate out --> isMenuOpen = false
```

---

## PageLoader.svelte

**Purpose:**
Shows a branded loading screen with entrance/exit animations while the app initializes.

**File Path:**
`/src/lib/components/PageLoader.svelte`

### Imports
```js
import { onMount } from 'svelte';
import { isLoading } from '$lib/stores';
import { gsap } from 'gsap';
```

### Exports (Props/Stores)
_None_

### Events/Actions
- Subscribes to `$isLoading`

### Functions
1. **animateIn()** – Plays entrance animation.
2. **animateOut()** – Plays exit animation and triggers unmount.

### Flow
```
$isLoading = true
   |
   +--> render loader
   |
   +--> onMount -> animateIn()

$isLoading = false
   |
   +--> animateOut() -> remove loader
```

---

## ProductCard.svelte

**Purpose:**
Renders a product tile with image, price, rating, wishlist toggle, and quick-view event.

**File Path:**
`/src/lib/components/ProductCard.svelte`

### Imports
```js
import { createEventDispatcher, onMount } from 'svelte';
import { isInWishlist, toggleWishlist } from '$lib/stores';
import { formatPrice } from '$lib/utils';
```

### Exports (Props/Stores)
```js
export let product: Product;
```

### Events/Actions
- Uses `$isInWishlist(product.id)`
- Calls `toggleWishlist(product)`
- Dispatches `quickview` event via dispatcher

### Functions
1. **handleWishlist()** – Toggles wishlist status.
2. **handleQuickView()** – Dispatches `quickview` event.

### Flow
```
onMount
  |
  +--> set up lazy-load observer for image

hover
  |
  +--> GSAP glow effect

click wishlist icon
  |
  +--> handleWishlist()

click quick-view button
  |
  +--> handleQuickView()
```

---

## QuickViewModal.svelte

**Purpose:**
Modal for product preview with variant/quantity selection and add-to-cart.

**File Path:**
`/src/lib/components/QuickViewModal.svelte`

### Imports
```js
import { createEventDispatcher, onMount } from 'svelte';
import { addToCart } from '$lib/stores';
import { formatPrice } from '$lib/utils';
```

### Exports (Props/Stores)
```js
export let product: Product | null = null;
export let open: boolean = false;
```

### Events/Actions
- Calls `addToCart(product, options)`
- Dispatches `close` event

### Functions
1. **selectVariant(variantId)** – Sets `selectedVariant`.
2. **changeQuantity(delta)** – Adjusts `quantity`, min 1.
3. **handleAddToCart()** – Calls `addToCart` then dispatches `close`.

### Flow
```
open = true
  |
  +--> render modal -> onMount -> entrance animation

user selects variant
  |
  +--> selectVariant()

user changes quantity
  |
  +--> changeQuantity()

user clicks Add to Cart
  |
  +--> handleAddToCart() -> addToCart() -> dispatch close

user clicks backdrop/close
  |
  +--> dispatch close
```

---

## SearchModal.svelte

**Purpose:**
Overlay for faceted search combining text input and filters, triggering store-based API searches.

**File Path:**
`/src/lib/components/SearchModal.svelte`

### Imports
```js
import { onMount } from 'svelte';
import { isSearchOpen, searchQuery, performSearch, closeSearch } from '$lib/stores';
import { getCategories, getColors, getSizes } from '$lib/api';
```

### Exports (Props/Stores)
_None_

### Events/Actions
- Subscribes to `$isSearchOpen`, `$searchQuery`
- Calls `performSearch(params)`, `closeSearch()`

### Functions
1. **onSearchInput(event)** – Updates `searchQuery` store.
2. **onFilterChange(type, value)** – Updates local filters.
3. **applyFilters()** – Calls `performSearch({ query: $searchQuery, ...filters })`.
4. **resetFilters()** – Clears filters and `searchQuery`.

### Flow
```
isSearchOpen = true
  |
  +--> render modal -> onMount -> fetch facet options

typing in input
  |
  +--> onSearchInput()

changing filter controls
  |
  +--> onFilterChange()

click Search
  |
  +--> applyFilters() -> performSearch()

click Reset
  |
  +--> resetFilters()

click close/backdrop
  |
  +--> closeSearch()
```

---

