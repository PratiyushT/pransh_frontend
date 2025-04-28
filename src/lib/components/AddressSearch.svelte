<script lang="ts">
    import {onMount, createEventDispatcher} from 'svelte';
    import {browser} from '$app/environment';
    import * as publicEnv from '$env/static/public';

    const dispatch = createEventDispatcher();

    export let showManualEntryForm = false;
    let geocoderContainer: HTMLElement;
    let geocoder: any;
    let mapboxgl: any;
    let MapboxGeocoder: any;
    let selectedResult = '';
    let loadError = false;
    let errorMessage = '';

    onMount(async () => {
        if (browser) {
            try {
                // Dynamically import Mapbox libraries only on client-side
                mapboxgl = (await import('mapbox-gl')).default;
                MapboxGeocoder = (await import('@mapbox/mapbox-gl-geocoder')).default;

                // Also import CSS
                await import('mapbox-gl/dist/mapbox-gl.css');
                await import('@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css');

                // Get API key from environment, with fallback
                const mapboxApiKey = import.meta.env.VITE_MAPBOX_API_KEY 
                mapboxgl.accessToken = mapboxApiKey;

                // Initialize the geocoder with error handling
                try {
                    geocoder = new MapboxGeocoder({
                        accessToken: mapboxgl.accessToken,
                        types: 'address',
                        placeholder: 'Search for your address...',
                        marker: false,
                        mapboxgl: mapboxgl,
                        countries: 'us,ca,gb,au,nz,de,fr,it,es,jp', // Fixed country codes (removed invalid 'jau')
                    });

                    // Helper to show geocoding error
                    function showGeocodingError() {
                        // Handle geocoding error without crashing
                        const container = document.querySelector('.address-search-container');
                        if (container) {
                            // Show geocoding error message
                            const errorEl = document.createElement('div');
                            errorEl.className = 'mapbox-error mb-4';
                            errorEl.textContent = 'Error searching for that address. Please try again or enter manually.';

                            // Find the geocoder container and add error after it
                            const geocoderEl = container.querySelector('.mapbox-geocoder-container');
                            if (geocoderEl && !container.querySelector('.mapbox-error')) {
                                geocoderEl.insertAdjacentElement('afterend', errorEl);

                                // Auto-remove after 5 seconds
                                setTimeout(() => {
                                    if (errorEl.parentNode) {
                                        errorEl.parentNode.removeChild(errorEl);
                                    }
                                }, 5000);
                            }
                        }
                    }

                    // Override the _geocode method to add error handling
                    const originalGeocode = geocoder._geocode;
                    geocoder._geocode = function(searchInput) {
                        try {
                            return originalGeocode.call(this, searchInput).catch(err => {
                                console.error('Geocoding error:', err);

                                // Check if it's a country code error
                                if (err && err.message && err.message.includes('is not a known stack')) {

                                    // If the error is related to country codes, try again with just US
                                    // This is a temporary fix that allows the search to continue
                                    const originalCountries = this.options.countries;
                                    this.options.countries = 'us';

                                    // After 100ms, restore the original countries list
                                    setTimeout(() => {
                                        this.options.countries = originalCountries;
                                    }, 100);

                                    // Retry the search with just US
                                    return originalGeocode.call(this, searchInput).catch(retryErr => {
                                        console.error('Retry geocoding also failed:', retryErr);
                                        showGeocodingError();
                                        dispatch('error', { message: 'Geocoding retry failed', error: retryErr });
                                        return Promise.resolve({ features: [] });
                                    });
                                }

                                // For other errors, show error message
                                showGeocodingError();

                                // Dispatch error event
                                dispatch('error', { message: 'Geocoding failed', error: err });

                                return Promise.resolve({ features: [] }); // Return empty results to avoid crash
                            });
                        } catch (e) {
                            console.error('Error in geocode method:', e);
                            return Promise.resolve({ features: [] });
                        }
                    };

                    // Add geocoder to the container
                    geocoder.addTo(geocoderContainer);

                    // Listen for results
                    geocoder.on('result', (e: any) => {
                        const result = e.result;
                        const address = parseMapboxAddress(result);
                        dispatch('addressSelected', address);
                        // Set the selected result text for display
                        selectedResult = result.place_name || '';
                        // Add visual indicator when an address is selected
                        const container = document.querySelector('.address-search-container');
                        if (container) {
                            container.classList.add('address-selected');
                        }
                    });

                    // Listen for clear
                    geocoder.on('clear', () => {
                        dispatch('addressCleared');
                        // Remove visual indicator when cleared
                        selectedResult = '';
                        const container = document.querySelector('.address-search-container');
                        if (container) {
                            container.classList.remove('address-selected');
                        }
                    });

                    return () => {
                        if (geocoder) {
                            // Clean up geocoder on component unmount
                            geocoder.onRemove();
                        }
                    };
                } catch (initErr) {
                    console.error('Error initializing Mapbox Geocoder:', initErr);
                    loadError = true;
                    errorMessage = 'Unable to load address search. Please enter your address manually.';
                    dispatch('showManualEntry');
                    dispatch('error', { message: 'Failed to initialize Mapbox geocoder' });
                }
            } catch (err) {
                console.error('Error initializing Mapbox:', err);
                loadError = true;
                errorMessage = 'Unable to load address search. Please enter your address manually.';
                dispatch('showManualEntry');
                dispatch('error', { message: 'Failed to initialize Mapbox' });
            }
        }
    });

    // Parse Mapbox result into address components
    function parseMapboxAddress(result: any) {

        // Set the selected result text for display
        selectedResult = result.place_name || '';

        const address = {
            addressLine1: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'United States',
        };

        // Extract full street address
        if (result.place_name) {
            const parts = result.place_name.split(',');
            if (parts.length > 0) {
                address.addressLine1 = parts[0].trim();
            }
        }

        // Extract address components from result properties
        if (result.properties) {
            if (result.properties.address) {
                address.addressLine1 = result.properties.address;
            }
        }

        // Extract address components from context
        if (result.context) {
            result.context.forEach((context: any) => {
                if (context.id.startsWith('postcode')) {
                    address.postalCode = context.text;
                } else if (context.id.startsWith('place')) {
                    address.city = context.text;
                } else if (context.id.startsWith('region')) {
                    address.state = context.text;
                } else if (context.id.startsWith('country')) {
                    // Map country code to full country name
                    const countryCode = context.short_code?.toUpperCase();
                    if (countryCode === 'US') address.country = 'United States';
                    else if (countryCode === 'CA') address.country = 'Canada';
                    else if (countryCode === 'GB') address.country = 'United Kingdom';
                    else if (countryCode === 'AU') address.country = 'Australia';
                    else if (countryCode === 'NZ') address.country = 'New Zealand';
                    else if (countryCode === 'DE') address.country = 'Germany';
                    else if (countryCode === 'FR') address.country = 'France';
                    else if (countryCode === 'IT') address.country = 'Italy';
                    else if (countryCode === 'ES') address.country = 'Spain';
                    else if (countryCode === 'JP') address.country = 'Japan';
                    else address.country = context.text;
                }
            });
        }

        // If we have address_line1 but not specific components, try splitting address
        if (address.addressLine1 && (!address.city || !address.state || !address.postalCode)) {
            const parts = result.place_name?.split(',');
            if (parts && parts.length >= 3) {
                // First part is street address (already set)

                // Second part often city
                if (!address.city && parts[1]) {
                    address.city = parts[1].trim();
                }

                // Third part often contains state and zip
                if (parts[2]) {
                    const stateZipPart = parts[2].trim();
                    // Try to extract state and zip code
                    const stateZipMatch = stateZipPart.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);
                    if (stateZipMatch) {
                        if (!address.state) {
                            address.state = stateZipMatch[1];
                        }
                        if (!address.postalCode) {
                            address.postalCode = stateZipMatch[2];
                        }
                    } else {
                        // If no match, use the whole part as state
                        if (!address.state) {
                            address.state = stateZipPart;
                        }
                    }
                }

                // If there's a fourth part, it might contain the zip code
                if (!address.postalCode && parts.length > 3 && parts[3]) {
                    const zipPart = parts[3].trim();
                    const zipMatch = zipPart.match(/\d{5}(-\d{4})?/);
                    if (zipMatch) {
                        address.postalCode = zipMatch[0];
                    }
                }
            }
        }

        // Ensure we have something in each field
        if (!address.city) address.city = 'N/A';
        if (!address.state) address.state = 'N/A';
        if (!address.postalCode) address.postalCode = 'N/A';

        return address;
    }

    function handleShowManualEntry() {
        showManualEntryForm = true;
        dispatch('showManualEntry');
    }
</script>

<div class="address-search-container mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-3">
        Search for your address
    </label>

    {#if loadError}
        <div class="mapbox-error mb-4">
            {errorMessage}
        </div>
        <button
            type="button"
            class="text-gray-500 hover:text-gold text-sm flex items-center transition-colors duration-300"
            on:click={handleShowManualEntry}
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Enter address manually
        </button>
    {:else}
        <div class="mapbox-geocoder-container mb-4" bind:this={geocoderContainer}></div>

        {#if selectedResult}
            <div class="selected-result p-2 bg-green-50 border border-green-200 rounded-md mb-4 text-sm">
                <div class="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                        <p class="font-medium text-green-800">Address selected:</p>
                        <p class="text-gray-700">{selectedResult}</p>
                    </div>
                </div>
            </div>
        {/if}

        <button
                type="button"
                class="text-gray-500 hover:text-gold text-sm flex items-center transition-colors duration-300"
                on:click={handleShowManualEntry}
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Can't find your address? Enter manually
        </button>
    {/if}
</div>

<style>
    /* Customize the appearance of the Mapbox geocoder */
    :global(.mapboxgl-ctrl-geocoder) {
        width: 100% !important;
        max-width: 100% !important;
        box-shadow: none !important;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
    }

    :global(.mapboxgl-ctrl-geocoder--input) {
        height: 48px !important;
        padding: 12px 45px !important;
    }

    :global(.mapboxgl-ctrl-geocoder--icon) {
        top: 12px !important;
    }

    :global(.mapboxgl-ctrl-geocoder--button) {
        top: 8px !important;
    }

    :global(.mapboxgl-ctrl-geocoder--suggestion-title) {
        font-weight: 500;
        color: #1f2937;
    }

    :global(.mapboxgl-ctrl-geocoder--suggestion-address) {
        color: #6b7280;
    }

    .address-selected {
        border: 2px solid #f59e0b; /* Gold border to indicate selection */
    }

    .mapbox-error {
        padding: 0.75rem;
        background-color: #fee2e2;
        color: #b91c1c;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }
</style>
