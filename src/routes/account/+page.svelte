<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import gsap from 'gsap';
  import { supabase } from '$lib/auth/client';
  import AddressForm from '$lib/components/AddressForm.svelte';

  // User data (in a real app, this would come from API)
  let user = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addresses: [],
    orders: [
      {
        id: 'ORD-12345',
        date: '2023-12-15',
        status: 'Delivered',
        total: 899.97,
        items: 3
      },
      {
        id: 'ORD-12346',
        date: '2024-01-20',
        status: 'Processing',
        total: 449.99,
        items: 1
      }
    ]
  };

  let isLoading = true;
  let activeTab = 'dashboard';
  let showAddressForm = false;
  let currentEditAddress = null;
  let isEditMode = false;

  // Check if user is logged in and fetch data securely from API
  const checkAuth = async () => {
    try {
      // Check if there's an active session with Supabase - only source of truth for authentication
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.error('No valid session found:', error || 'Session not found');
        goto('/account/login');
        return false;
      }

      // Session exists, fetch user data from secure API along with addresses
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*, addresses(*)')
        .eq('user_id', session.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile with addresses:', userError);
        // If we can't get profile data but have valid session, we can still use session data
        user.email = session.user.email || '';

        // Get first/last name from session metadata as fallback
        if (session.user.user_metadata) {
          user.firstName = session.user.user_metadata.first_name || '';
          user.lastName = session.user.user_metadata.last_name || '';

          // If we have full_name but not individual names
          if (!user.firstName && session.user.user_metadata.full_name) {
            const nameParts = session.user.user_metadata.full_name.split(' ');
            user.firstName = nameParts[0] || '';
            user.lastName = nameParts.slice(1).join(' ') || '';
          }
        }
      } else if (userData) {
        // Set user data from secure API response
        user.firstName = userData.first_name || '';
        user.lastName = userData.last_name || '';
        user.email = userData.email || session.user.email || '';
        user.phone = userData.phone || '';

        // Set addresses from the joined query
        if (userData.addresses && Array.isArray(userData.addresses)) {
          user.addresses = userData.addresses;
          // Store in localStorage that user has addresses for quick UI feedback
          if (userData.addresses.length > 0) {
            localStorage.setItem('hasAddress', 'true');
          } else {
            localStorage.removeItem('hasAddress');
          }
        }
      }

      // Now fetch orders, which is a separate API call for security
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!ordersError && ordersData) {
        user.orders = ordersData;
      } else {
        console.error('Error fetching orders:', ordersError);
      }

      return true;
    } catch (err) {
      console.error('Unexpected error during auth check:', err);
      goto('/account/login');
      return false;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call Supabase signOut to invalidate the session - this is the important part
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
      }

      // Clean up UI data from localStorage - no authentication data stored here anymore
      localStorage.removeItem('userDisplayName');
      localStorage.removeItem('userInitials');

      // Remove any other non-sensitive UI preferences
      localStorage.removeItem('uiTheme');
      localStorage.removeItem('hasAddress');

      goto('/account/login');
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      // Even on error, we should still try to navigate away
      goto('/account/login');
    }
  };

  // Handle tab change
  const setActiveTab = (tab) => {
    activeTab = tab;
    // Reset address form when changing tabs
    showAddressForm = false;
    currentEditAddress = null;
    isEditMode = false;
  };

  // Address management functions
  const openAddAddressForm = () => {
    showAddressForm = true;
    currentEditAddress = null;
    isEditMode = false;
  };

  const openEditAddressForm = (address) => {
    currentEditAddress = { ...address };
    isEditMode = true;
    showAddressForm = true;
  };

  const handleAddressCancel = () => {
    showAddressForm = false;
    currentEditAddress = null;
    isEditMode = false;
  };

  const handleAddressSaved = async (event) => {
    const savedAddress = event.detail;

    // Refresh user data to show the updated addresses
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*, addresses(*)')
        .eq('user_id', session.user.id)
        .single();

      if (userData && userData.addresses) {
        user.addresses = userData.addresses;
      }
    }

    // Close the form
    showAddressForm = false;
    currentEditAddress = null;
    isEditMode = false;
  };

  const deleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) {
        throw new Error(error.message);
      }

      // Remove the address from the local state
      user.addresses = user.addresses.filter(addr => addr.id !== addressId);

    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  const setDefaultAddress = async (addressId) => {
    try {
      // First set all addresses to non-default
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('profile_id', user.addresses[0].profile_id);

      // Then set the selected address as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) {
        throw new Error(error.message);
      }

      // Update the local state
      user.addresses = user.addresses.map(addr => ({
        ...addr,
        is_default: addr.id === addressId
      }));

    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to update default address');
    }
  };

  // Format price utility
  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  // Format date utility
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };

  // For quick UI display before API loads
  let quickDisplayName = '';

  // Page animation
  onMount(async () => {
    isLoading = true;

    // Get display name from localStorage for immediate UI feedback
    quickDisplayName = localStorage.getItem('userDisplayName') || '';

    try {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) return;

      // If authenticated, apply animations
      setTimeout(() => {
        isLoading = false;

        // Apply animations once data is loaded
        const timeline = gsap.timeline();

        timeline.from('.account-header', {
          y: -20,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out'
        });

        timeline.from('.account-tabs', {
          y: 10,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out'
        }, '-=0.2');

        timeline.from('.account-content', {
          y: 20,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out'
        }, '-=0.2');

        timeline.from('.account-card', {
          y: 10,
          opacity: 0,
          stagger: 0.1,
          duration: 0.4,
          ease: 'power2.out'
        }, '-=0.2');
      }, 500);
    } catch (err) {
      console.error('Error during account page initialization:', err);
      isLoading = false;
      goto('/account/login');
    }
  });
</script>

<svelte:head>
  <title>My Account | Pransh</title>
  <meta name="description" content="Manage your Pransh account, view orders, and update your profile.">
</svelte:head>

<div class="bg-gray-50 min-h-[80vh]">
  {#if isLoading}
    <div class="container mx-auto px-4 py-16 flex justify-center items-center h-[60vh]">
      <div class="loading-spinner inline-block w-12 h-12 relative">
        <div class="absolute w-full h-full border-4 border-gold border-opacity-10 rounded-full"></div>
        <div class="absolute w-full h-full border-4 border-transparent border-t-gold rounded-full animate-spin"></div>
      </div>
    </div>
  {:else}
    <div class="container mx-auto px-4 py-8 md:py-12">
      <!-- Account header -->
      <div class="account-header mb-8 md:mb-12">
        <h1 class="text-2xl md:text-3xl font-serif text-gray-800 mb-2">My Account</h1>
        <p class="text-gray-600">Welcome back, {user.firstName || quickDisplayName || 'valued customer'}!</p>
      </div>

      <!-- Account navigation -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-1">
          <div class="bg-white shadow-sm rounded-sm p-4 md:p-6 account-tabs">
            <nav class="space-y-1">
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm font-medium {activeTab === 'dashboard' ? 'bg-gold-light bg-opacity-20 text-gold-dark font-semibold' : 'text-gray-600 hover:bg-gray-50'}"
                on:click={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm font-medium {activeTab === 'orders' ? 'bg-gold-light bg-opacity-20 text-gold-dark font-semibold' : 'text-gray-600 hover:bg-gray-50'}"
                on:click={() => setActiveTab('orders')}
              >
                Orders
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm font-medium {activeTab === 'addresses' ? 'bg-gold-light bg-opacity-20 text-gold-dark font-semibold' : 'text-gray-600 hover:bg-gray-50'}"
                on:click={() => setActiveTab('addresses')}
              >
                Addresses
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm font-medium {activeTab === 'settings' ? 'bg-gold-light bg-opacity-20 text-gold-dark font-semibold' : 'text-gray-600 hover:bg-gray-50'}"
                on:click={() => setActiveTab('settings')}
              >
                Account Settings
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm font-medium text-red-600 hover:bg-red-50 mt-4"
                on:click={handleLogout}
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>

        <!-- Account content -->
        <div class="lg:col-span-3 account-content">
          {#if activeTab === 'dashboard'}
            <div class="bg-white shadow-sm rounded-sm p-4 md:p-6 mb-6">
              <h2 class="text-xl font-medium text-gray-800 mb-4">Account Overview</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="account-card">
                  <h3 class="text-sm font-medium text-gray-600 mb-2">Account Information</h3>
                  <div class="p-4 border border-gray-200 rounded-sm">
                    <p class="font-medium">{user.firstName} {user.lastName}</p>
                    <p class="text-gray-600 text-sm mt-1">{user.email}</p>
                    <button
                      class="text-gold hover:text-gold-dark text-sm mt-3"
                      on:click={() => setActiveTab('settings')}
                    >
                      Edit Account
                    </button>
                  </div>
                </div>

                <div class="account-card">
                  <h3 class="text-sm font-medium text-gray-600 mb-2">Default Shipping Address</h3>
                  {#if user.addresses && user.addresses.length > 0}
                    <div class="p-4 border border-gray-200 rounded-sm">
                      <p class="font-medium">{user.addresses[0].label || `${user.firstName} ${user.lastName}`}</p>
                      <p class="text-gray-600 text-sm mt-1">
                        {user.addresses[0].street}<br>
                        {user.addresses[0].city}, {user.addresses[0].state || ''} {user.addresses[0].postal_code}<br>
                        {user.addresses[0].country || 'United States'}<br>
                        {user.addresses[0].phone_number}
                      </p>
                      <button
                        class="text-gold hover:text-gold-dark text-sm mt-3"
                        on:click={() => setActiveTab('addresses')}
                      >
                        Edit Address
                      </button>
                    </div>
                  {:else}
                    <div class="p-4 border border-gray-200 rounded-sm flex flex-col items-center justify-center text-center">
                      <p class="text-gray-600 text-sm">You haven't added any addresses yet.</p>
                      <button
                        class="text-gold hover:text-gold-dark text-sm mt-3"
                        on:click={() => setActiveTab('addresses')}
                      >
                        Add Address
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Recent orders -->
            <div class="bg-white shadow-sm rounded-sm p-4 md:p-6 account-card">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-medium text-gray-800">Recent Orders</h2>
                <button
                  class="text-gold hover:text-gold-dark text-sm"
                  on:click={() => setActiveTab('orders')}
                >
                  View All
                </button>
              </div>

              {#if user.orders && user.orders.length > 0}
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      {#each user.orders.slice(0, 3) as order}
                        <tr>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gold">{order.id}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{formatDate(order.date)}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              {order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-yellow-100 text-yellow-800'}">
                              {order.status}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPrice(order.total)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.items} {order.items === 1 ? 'item' : 'items'}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {:else}
                <div class="text-center py-8">
                  <p class="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                  <a href="/shop" class="bg-gold hover:bg-gold-dark text-white px-4 py-2 rounded-sm inline-block transition-colors">
                    Start Shopping
                  </a>
                </div>
              {/if}
            </div>
          {:else if activeTab === 'orders'}
            <div class="bg-white shadow-sm rounded-sm p-4 md:p-6 account-card">
              <h2 class="text-xl font-medium text-gray-800 mb-6">Order History</h2>

              {#if user.orders && user.orders.length > 0}
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      {#each user.orders as order}
                        <tr>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gold">{order.id}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{formatDate(order.date)}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              {order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-yellow-100 text-yellow-800'}">
                              {order.status}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPrice(order.total)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" class="text-gold hover:text-gold-dark">View</a>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {:else}
                <div class="text-center py-8">
                  <p class="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                  <a href="/shop" class="bg-gold hover:bg-gold-dark text-white px-4 py-2 rounded-sm inline-block transition-colors">
                    Start Shopping
                  </a>
                </div>
              {/if}
            </div>
          {:else if activeTab === 'addresses'}
            <div class="bg-white shadow-sm rounded-sm p-4 md:p-6 account-card">
              {#if !showAddressForm}
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-xl font-medium text-gray-800">Saved Addresses</h2>
                  <button
                    class="text-white bg-gold hover:bg-gold-dark px-4 py-2 text-sm rounded-sm"
                    on:click={openAddAddressForm}
                  >
                    Add New Address
                  </button>
                </div>

                {#if user.addresses && user.addresses.length > 0}
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each user.addresses as address}
                      <div
                        class="border border-gray-200 rounded-sm p-4 transition-all"
                        class:border-gold={address.is_default}
                        class:shadow-sm={address.is_default}
                      >
                        {#if address.is_default}
                          <div class="bg-gold text-white text-xs px-2 py-0.5 inline-block rounded-sm mb-2">Default</div>
                        {/if}
                        <p class="font-medium">{address.label || `${user.firstName} ${user.lastName}`}</p>
                        <p class="text-gray-600 text-sm mt-1">
                          {address.street}<br>
                          {address.city}, {address.state || ''} {address.postal_code}<br>
                          {address.country || 'United States'}<br>
                          {address.phone_number}
                        </p>
                        <div class="mt-3 flex space-x-3">
                          <button
                            class="text-gold hover:text-gold-dark text-sm"
                            on:click={() => openEditAddressForm(address)}
                          >
                            Edit
                          </button>
                          <button
                            class="text-red-500 hover:text-red-700 text-sm"
                            on:click={() => deleteAddress(address.id)}
                          >
                            Delete
                          </button>
                          {#if !address.is_default}
                            <button
                              class="text-blue-500 hover:text-blue-700 text-sm"
                              on:click={() => setDefaultAddress(address.id)}
                            >
                              Set as Default
                            </button>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="flex flex-col items-center justify-center py-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p class="text-gray-500 mb-4">You haven't added any addresses yet.</p>
                    <button
                      class="bg-gold hover:bg-gold-dark text-white px-4 py-2 rounded-sm inline-block transition-colors text-sm"
                      on:click={openAddAddressForm}
                    >
                      Add Your First Address
                    </button>
                  </div>
                {/if}
              {:else}
                <!-- Address Form -->
                <AddressForm
                  editMode={isEditMode}
                  address={currentEditAddress || {}}
                  on:saved={handleAddressSaved}
                  on:cancel={handleAddressCancel}
                />
              {/if}
            </div>
          {:else if activeTab === 'settings'}
            <div class="bg-white shadow-sm rounded-sm p-4 md:p-6 account-card">
              <h2 class="text-xl font-medium text-gray-800 mb-6">Account Settings</h2>

              <form class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="settings-firstname" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      id="settings-firstname"
                      value={user.firstName}
                      class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                    >
                  </div>

                  <div>
                    <label for="settings-lastname" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      id="settings-lastname"
                      value={user.lastName}
                      class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                    >
                  </div>
                </div>

                <div>
                  <label for="settings-email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="settings-email"
                    value={user.email}
                    class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                  >
                </div>

                <div>
                  <label for="settings-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    id="settings-phone"
                    value={user.phone}
                    placeholder="(123) 456-7890"
                    class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                  >
                </div>

                <div class="border-t border-gray-200 pt-6">
                  <h3 class="text-lg font-medium text-gray-800 mb-4">Change Password</h3>

                  <div class="space-y-4">
                    <div>
                      <label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        id="current-password"
                        class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                        placeholder="••••••••"
                      >
                    </div>

                    <div>
                      <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        id="new-password"
                        class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                        placeholder="••••••••"
                      >
                    </div>

                    <div>
                      <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirm-password"
                        class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                        placeholder="••••••••"
                      >
                    </div>
                  </div>
                </div>

                <div class="flex justify-end pt-4">
                  <button
                    type="submit"
                    class="bg-gold hover:bg-gold-dark text-white px-6 py-2 rounded-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Gold color classes */
  .text-gold {
    color: #D4AF37;
  }

  .text-gold-dark {
    color: #B8941F;
  }

  .bg-gold {
    background-color: #D4AF37;
  }

  .bg-gold-light {
    background-color: #E6C869;
  }

  .border-gold {
    border-color: #D4AF37;
  }

  .hover\:bg-gold-dark:hover {
    background-color: #B8941F;
  }

  .hover\:text-gold-dark:hover {
    color: #B8941F;
  }

  .focus\:ring-gold:focus {
    --tw-ring-color: rgba(212, 175, 55, 0.2);
  }

  .focus\:border-gold:focus {
    border-color: #D4AF37;
  }

  .bg-gold-opacity-10 {
    background-color: rgba(212, 175, 55, 0.1);
  }

  .bg-gold-light.bg-opacity-20 {
    background-color: rgba(230, 200, 105, 0.2);
  }

  /* Loading spinner animation */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
