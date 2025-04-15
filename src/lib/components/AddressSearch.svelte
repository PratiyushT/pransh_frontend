<script lang="ts">
    import {onMount, createEventDispatcher} from 'svelte';
    import {browser} from '$app/environment';
    import {PUBLIC_MAPBOX_API_KEY} from '$env/static/public';


    const dispatch = createEventDispatcher();

    export let showManualEntryForm = false;
    let geocoderContainer: HTMLElement;
    let geocoder: any;
    let mapboxgl: any;
    let MapboxGeocoder: any;

    onMount(async () => {
        if (browser) {
            // Dynamically import Mapbox libraries only on client-side
            mapboxgl = (await import('mapbox-gl')).default;
            MapboxGeocoder = (await import('@mapbox/mapbox-gl-geocoder')).default;

            // Also import CSS
            await import('mapbox-gl/dist/mapbox-gl.css');
            await import('@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css');

            mapboxgl.accessToken = PUBLIC_MAPBOX_API_KEY;

            // Initialize the geocoder
            geocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                types: 'address',
                placeholder: 'Search for your address...',
                marker: false,
                mapboxgl: mapboxgl,
                countries: 'us,ca,uk,au,nz,de,fr,it,es,jp', // Limit to countries in your dropdown
            });

            // Add geocoder to the container
            geocoder.addTo(geocoderContainer);

            // Listen for results
            geocoder.on('result', (e: any) => {
                const result = e.result;
                const address = parseMapboxAddress(result);
                dispatch('addressSelected', address);
            });

            // Listen for clear
            geocoder.on('clear', () => {
                dispatch('addressCleared');
            });

            return () => {
                if (geocoder) {
                    // Clean up geocoder on component unmount
                    geocoder.onRemove();
                }
            };
        }
    });

    // Parse Mapbox result into address components
    function parseMapboxAddress(result: any) {
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

        // Extract address components
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
        if (address.addressLine1 && (!address.city || !address.state)) {
            const parts = result.place_name?.split(',');
            if (parts && parts.length >= 3) {
                // First part is street address
                // Second part often city
                if (!address.city && parts[1]) {
                    address.city = parts[1].trim();
                }
                // Third part often state+zip
                if (!address.state && parts[2]) {
                    const stateZipPart = parts[2].trim();
                    const stateZipMatch = stateZipPart.match(/([A-Z]{2})\s+(\d{5})/);
                    if (stateZipMatch) {
                        address.state = stateZipMatch[1];
                        if (!address.postalCode) {
                            address.postalCode = stateZipMatch[2];
                        }
                    }
                }
            }
        }

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

    <div class="mapbox-geocoder-container mb-4" bind:this={geocoderContainer}></div>

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
</style>
