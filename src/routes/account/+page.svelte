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
    phone_number: '',
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

  // Account settings variables
  let isUpdatingProfile = false;
  let profileUpdateMessage = '';
  let profileUpdateError = false;
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let currentUserEmail = ''; // Store current user email for comparison

  // Password strength & visibility
  let passwordStrength = 0;
  let showNewPassword = false;
  let showConfirmPassword = false;
  let newPasswordTouched = false;
  let confirmPasswordTouched = false;

  // Phone validation
  let phoneNumberTouched = false;
  let phoneNumberError = '';

  // Email validation
  let emailTouched = false;
  let emailError = '';

  // Toggle password visibility
  const toggleNewPasswordVisibility = () => showNewPassword = !showNewPassword;
  const toggleConfirmPasswordVisibility = () => showConfirmPassword = !showConfirmPassword;

  // Email validation function
  function validateEmail(email) {
    if (!email) {
      emailError = 'Email is required';
      return false;
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      emailError = 'Please enter a valid email address';
      return false;
    }

    emailError = '';
    return true;
  }

  // Handle email input
  function handleEmailInput(event) {
    const value = event.target.value;
    emailTouched = true;
    user.email = value;
    validateEmail(user.email);
  }

  // Password strength checker
  function checkPasswordStrength(p) {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s += 1;
    if (/[A-Z]/.test(p)) s += 0.5;
    if (/[a-z]/.test(p)) s += 0.5;
    if (/[0-9]/.test(p)) s += 0.5;
    if (/[^A-Za-z0-9]/.test(p)) s += 0.5;
    return Math.min(Math.floor(s), 3);
  }

  // Phone number validation
  function validatePhoneNumber(phone) {
    if (!phone) return true; // Phone is optional in account settings

    // Remove all non-numeric characters for validation
    const digits = phone.replace(/\D/g, '');

    // Basic validation: 10-15 digits (international numbers can be longer)
    if (digits.length < 10 || digits.length > 15) {
      phoneNumberError = 'Phone number must have 10-15 digits';
      return false;
    }

    // US format validation (optional)
    const usPhoneRegex = /^(\+?1)?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})$/;
    if (!usPhoneRegex.test(phone) && digits.length === 10) {
      phoneNumberError = 'Format should be (555) 555-5555 or similar';
      return false;
    }

    phoneNumberError = '';
    return true;
  }

  // Format phone number as user types (optional)
  function formatPhoneNumber(value) {
    if (!value) return '';

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX if it looks like a US number
    if (digits.length <= 10) {
      if (digits.length < 4) {
        return digits;
      } else if (digits.length < 7) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      }
    }

    // For longer numbers (international), just keep as is with country code
    return value;
  }

  // Handle phone number input
  function handlePhoneInput(event) {
    const value = event.target.value;
    phoneNumberTouched = true;

    // Format the phone number
    const formattedNumber = formatPhoneNumber(value);
    user.phone_number = formattedNumber;

    // Validate on input
    validatePhoneNumber(user.phone_number);
  }

  // Update password strength indicator when password changes
  $: passwordStrength = checkPasswordStrength(newPassword);

  // Handle profile update with re-authentication flow
  const handleProfileUpdate = async () => {
    try {
      profileUpdateMessage = '';
      profileUpdateError = false;
      isUpdatingProfile = true;

      // Validate email
      emailTouched = true;
      if (!validateEmail(user.email)) {
        profileUpdateMessage = emailError;
        profileUpdateError = true;
        isUpdatingProfile = false;
        return;
      }

      // Validate phone number if provided
      phoneNumberTouched = true;
      if (user.phone_number && !validatePhoneNumber(user.phone_number)) {
        profileUpdateMessage = phoneNumberError || 'Please enter a valid phone number';
        profileUpdateError = true;
        isUpdatingProfile = false;
        return;
      }

      // Step 1: Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error('Unable to verify your identity. Please log in again.');
      }

      // Determine which fields have changed
      const isEmailChanged = user.email !== currentUserEmail;
      const isPhoneChanged = user.phone_number !== user.phone; // Assuming original phone is stored in user.phone
      const isPasswordChanged = newPassword.length > 0;

      // Check if any changes were made
      const hasAnyChanges = isEmailChanged || isPasswordChanged || isPhoneChanged;

      // Require password verification for any changes
      if (hasAnyChanges) {
        // Validate current password by attempting to re-authenticate
        if (!currentPassword) {
          profileUpdateMessage = 'Current password is required to update your account';
          profileUpdateError = true;
          isUpdatingProfile = false;
          return;
        }

        // Attempt re-authentication to verify current password
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: currentUserEmail,
          password: currentPassword
        });

        if (authError) {
          profileUpdateMessage = 'Incorrect current password';
          profileUpdateError = true;
          isUpdatingProfile = false;
          return;
        }
      }

      // Validate password if changing
      if (isPasswordChanged) {
        if (newPassword.length < 8) {
          profileUpdateMessage = 'New password must be at least 8 characters';
          profileUpdateError = true;
          isUpdatingProfile = false;
          return;
        }

        if (newPassword !== confirmPassword) {
          profileUpdateMessage = 'New passwords do not match';
          profileUpdateError = true;
          isUpdatingProfile = false;
          return;
        }

        // Additional password strength validation
        if (passwordStrength < 2) {
          profileUpdateMessage = 'Please use a stronger password';
          profileUpdateError = true;
          isUpdatingProfile = false;
          return;
        }
      }

      // Step 4: Process updates - handle each change separately
      let hasUpdates = false;

      // Update email if changed
      if (isEmailChanged) {
        // Use the correct Supabase API method for updating email
        const { data, error: emailError } = await supabase.auth.updateUser({
          email: user.email
        });

        if (emailError) {
          throw new Error(`Failed to update email: ${emailError.message}`);
        }

        profileUpdateMessage = 'Email update verification sent. Please check your inbox.';
        hasUpdates = true;
      }

      // Update phone if changed
      if (isPhoneChanged) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone_number: user.phone_number,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', currentUser.id);

        if (profileError) {
          throw new Error(`Failed to update phone: ${profileError.message}`);
        }

        hasUpdates = true;
      }

      // Update password if changed
      if (isPasswordChanged) {
        const { error: pwError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (pwError) {
          throw new Error(`Failed to update password: ${pwError.message}`);
        }

        // Clear password fields
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
        newPasswordTouched = false;
        confirmPasswordTouched = false;

        hasUpdates = true;
      }

      // Set success message if updates were made but no specific message was set
      if (hasUpdates && !profileUpdateMessage) {
        profileUpdateMessage = 'Profile updated successfully';
      } else if (!hasUpdates) {
        profileUpdateMessage = 'No changes were detected';
      }

      // Refresh user data after updates
      await checkAuth();

    } catch (error) {
      console.error('Error updating profile:', error);
      profileUpdateMessage = error.message || 'An error occurred while updating your profile';
      profileUpdateError = true;
    } finally {
      isUpdatingProfile = false;
    }
  };

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

      // Store current email for comparison during updates
      currentUserEmail = session.user.email;

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
        user.phone_number = userData.phone_number || '';

        // Set addresses from the joined query
        if (userData.addresses && Array.isArray(userData.addresses)) {
          // Sort addresses to ensure default address is first
          user.addresses = userData.addresses.sort((a, b) => {
            // Default address should be first (prioritize is_default flag)
            if (a.is_default && !b.is_default) return -1;
            if (!a.is_default && b.is_default) return 1;
            // Otherwise maintain original order
            return 0;
          });

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

  // Helper function to refresh addresses from the server
  const refreshAddresses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.user) {
        console.error('No valid session found during address refresh');
        return false;
      }

      // Fetch updated addresses from the database
      const { data: addressesData, error: addressesError } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('is_default', { ascending: false });

      if (addressesError) {
        console.error('Error fetching addresses during refresh:', addressesError);
        return false;
      }

      // Update the local state with fresh data
      if (addressesData) {
        user.addresses = addressesData;

        // Update localStorage based on address presence
        if (addressesData.length > 0) {
          localStorage.setItem('hasAddress', 'true');
        } else {
          localStorage.removeItem('hasAddress');
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing addresses:', error);
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
    await refreshAddresses();

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
      console.log(`Attempting to delete address with id: ${addressId}`);

      if (!addressId) {
        throw new Error('Address ID is undefined or null');
      }

      // Get the current user session for logging
      const { data: { session } } = await supabase.auth.getSession();
      console.log(`Current user ID: ${session?.user?.id}`);

      // Verify address exists and belongs to the user before deletion
      const { data: addressData, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .single();

      if (fetchError) {
        console.error('Error fetching address before deletion:', fetchError);
        throw new Error(`Address verification failed: ${fetchError.message}`);
      }

      if (!addressData) {
        console.error('Address not found in database:', addressId);
        // Address doesn't exist or already deleted
        // Remove from local state anyway
        user.addresses = user.addresses.filter(addr => addr.id !== addressId);
        return;
      }

      console.log('Address to delete:', addressData);

      // Now delete the address
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) {
        console.error('Supabase deletion error details:', error);
        throw new Error(`Failed to delete address: ${error.message}`);
      }

      console.log('Address successfully deleted from database');

      // Remove the address from the local state
      user.addresses = user.addresses.filter(addr => addr.id !== addressId);

      // Refresh addresses from the server to ensure UI is in sync
      await refreshAddresses();

      // Show success message
      alert('Address deleted successfully');

    } catch (error) {
      console.error('Error deleting address:', error);
      alert(`Failed to delete address: ${error.message}`);
    }
  };

  // Improved setDefaultAddress with better error handling
  const setDefaultAddress = async (addressId) => {
    try {
      console.log(`Setting address ${addressId} as default`);

      if (!addressId) {
        throw new Error('Address ID is undefined or null');
      }

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        throw new Error('User session not found');
      }

      // Get the profile ID from the addresses
      const profileAddress = user.addresses.find(addr => addr.id === addressId);
      if (!profileAddress || !profileAddress.profile_id) {
        throw new Error('Cannot find the profile ID associated with this address');
      }

      const profileId = profileAddress.profile_id;
      console.log(`Setting default address for profile ID: ${profileId}`);

      // First set all addresses to non-default - with improved error handling
      const { error: resetError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('profile_id', profileId);

      if (resetError) {
        console.error('Error resetting default addresses:', resetError);
        throw new Error(`Failed to reset addresses: ${resetError.message}`);
      }

      // Then set the selected address as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) {
        console.error('Error setting default address:', error);
        throw new Error(`Failed to set default address: ${error.message}`);
      }

      console.log('Default address updated successfully');

      // Update the local state
      user.addresses = user.addresses.map(addr => ({
        ...addr,
        is_default: addr.id === addressId
      }));

      // Refresh addresses from the server to ensure UI is in sync
      await refreshAddresses();

      // Show success message
      alert('Default address updated successfully');

    } catch (error) {
      console.error('Error setting default address:', error);
      alert(`Failed to update default address: ${error.message}`);
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
                class="w-full text-left px-3 py-2 rounded-sm text-sm font-medium {activeTab === 'dashboard' ? 'bg-gold text-white' : 'text-gray-600 hover:bg-gray-50'}"
                on:click={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm font-medium {activeTab === 'orders' ? 'bg-gold text-white' : 'text-gray-600 hover:bg-gray-50'}"
                on:click={() => setActiveTab('orders')}
              >
                Orders
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm font-medium {activeTab === 'addresses' ? 'bg-gold text-white' : 'text-gray-600 hover:bg-gray-50'}"
                on:click={() => setActiveTab('addresses')}
              >
                Addresses
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm font-medium {activeTab === 'settings' ? 'bg-gold text-white' : 'text-gray-600 hover:bg-gray-50'}"
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
            <!-- ... dashboard content unchanged ... -->
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
                    {@const defaultAddress = user.addresses.find(addr => addr.is_default) || user.addresses[0]}
                    <div class="p-4 border border-gray-200 rounded-sm">
                      <p class="font-medium">{defaultAddress.label || `${user.firstName} ${user.lastName}`}</p>
                      <p class="text-gray-600 text-sm mt-1">
                        {defaultAddress.street}<br>
                        {defaultAddress.city}, {defaultAddress.state || ''} {defaultAddress.postal_code}<br>
                        {defaultAddress.country || 'United States'}<br>
                        {defaultAddress.phone_number}
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
            <!-- ... orders content unchanged ... -->
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
                            <button class="text-gold hover:text-gold-dark">View</button>
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
            <!-- ... addresses content unchanged ... -->
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

              {#if profileUpdateMessage}
                <div class="mb-4 p-3 {profileUpdateError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} rounded-sm">
                  {profileUpdateMessage}
                </div>
              {/if}

              <form class="space-y-6" on:submit|preventDefault={handleProfileUpdate}>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="settings-firstname" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      id="settings-firstname"
                      value={user.firstName}
                      readonly
                      class="w-full px-3 py-2 border border-gray-300 rounded-sm bg-gray-50 cursor-not-allowed"
                    >
                    <p class="mt-1 text-xs text-gray-500">First name cannot be changed</p>
                  </div>

                  <div>
                    <label for="settings-lastname" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      id="settings-lastname"
                      value={user.lastName}
                      readonly
                      class="w-full px-3 py-2 border border-gray-300 rounded-sm bg-gray-50 cursor-not-allowed"
                    >
                    <p class="mt-1 text-xs text-gray-500">Last name cannot be changed</p>
                  </div>
                </div>

                <div>
                  <label for="settings-email" class="block text-sm font-medium text-gray-700 mb-1">Email Address <span class="text-red-500">*</span></label>
                  <input
                    type="email"
                    id="settings-email"
                    value={user.email}
                    on:input={handleEmailInput}
                    class="w-full px-3 py-2 border {emailTouched && emailError ? 'border-red-300' : 'border-gray-300'} rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                  >
                  {#if emailTouched && emailError}
                    <p class="mt-1 text-xs text-red-600">{emailError}</p>
                  {/if}
                  <p class="mt-1 text-xs text-gray-500">Changing your email will require verification.</p>
                </div>

                <div>
                  <label for="settings-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    id="settings-phone"
                    value={user.phone_number}
                    on:input={handlePhoneInput}
                    placeholder="(555) 555-5555"
                    class="w-full px-3 py-2 border {phoneNumberTouched && phoneNumberError ? 'border-red-300' : 'border-gray-300'} rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                  >
                  {#if phoneNumberTouched && phoneNumberError}
                    <p class="mt-1 text-xs text-red-600">{phoneNumberError}</p>
                  {/if}
                </div>

                <div class="border-t border-gray-200 pt-6">
                  <h3 class="text-lg font-medium text-gray-800 mb-4">Change Password</h3>

                  <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <div class="flex items-start">
                      <div class="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                      </div>
                      <div class="ml-3">
                        <p class="text-sm text-blue-700">
                          Your current password is required to verify any account changes. This helps keep your account secure.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">
                        Current Password <span class="text-red-500">*</span> <span class="text-xs text-gray-500">(Required for account changes)</span>
                      </label>
                      <input
                        type="password"
                        id="current-password"
                        bind:value={currentPassword}
                        class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-gold focus:border-gold"
                        placeholder="••••••••"
                        autocomplete="current-password"
                      >
                    </div>

                    <div>
                      <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div class="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="new-password"
                          bind:value={newPassword}
                          class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-gold focus:border-gold pr-10"
                          placeholder="••••••••"
                          autocomplete="new-password"
                          on:input={() => { newPasswordTouched = true; }}
                        >
                        <button
                          type="button"
                          tabindex="-1"
                          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          on:click={toggleNewPasswordVisibility}
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {#if showNewPassword}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                            </svg>
                          {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          {/if}
                        </button>
                      </div>
                      {#if newPasswordTouched && newPassword}
                        <div class="mt-1 text-xs">
                          <div class="flex items-center gap-2">
                            <div class="flex gap-1">
                              <span class="block w-8 h-1 rounded-full {passwordStrength >= 1 ? 'bg-red-400' : 'bg-gray-200'}"></span>
                              <span class="block w-8 h-1 rounded-full {passwordStrength >= 2 ? 'bg-yellow-400' : 'bg-gray-200'}"></span>
                              <span class="block w-8 h-1 rounded-full {passwordStrength >= 3 ? 'bg-green-500' : 'bg-gray-200'}"></span>
                            </div>
                            <span class="ml-2 font-medium {passwordStrength === 1 ? 'text-red-500' : passwordStrength === 2 ? 'text-yellow-600' : passwordStrength === 3 ? 'text-green-600' : 'text-gray-500'}">
                              {passwordStrength === 1 ? 'Weak' : passwordStrength === 2 ? 'Medium' : passwordStrength === 3 ? 'Strong' : ''}
                            </span>
                          </div>
                          <ul class="mt-1 pl-4 list-disc text-gray-500">
                            <li class={newPassword.length >= 8 ? "text-green-600" : ""}>At least 8 characters</li>
                            <li class={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>Uppercase letter</li>
                            <li class={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>Lowercase letter</li>
                            <li class={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>Number</li>
                            <li class={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : ""}>Special character</li>
                          </ul>
                        </div>
                      {/if}
                    </div>

                    <div>
                      <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <div class="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirm-password"
                          bind:value={confirmPassword}
                          class="w-full px-3 py-2 border {confirmPasswordTouched && confirmPassword && newPassword !== confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-sm focus:outline-none focus:ring-gold focus:border-gold pr-10"
                          placeholder="••••••••"
                          autocomplete="new-password"
                          on:input={() => { confirmPasswordTouched = true; }}
                        >
                        <button
                          type="button"
                          tabindex="-1"
                          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          on:click={toggleConfirmPasswordVisibility}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {#if showConfirmPassword}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                            </svg>
                          {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          {/if}
                        </button>
                      </div>
                      {#if confirmPasswordTouched && confirmPassword && newPassword !== confirmPassword}
                        <p class="mt-1 text-xs text-red-600">Passwords do not match</p>
                      {/if}
                    </div>
                  </div>
                </div>

                <div class="flex justify-end pt-4">
                  <button
                    type="submit"
                    class="bg-gold hover:bg-gold-dark text-white px-6 py-2 rounded-sm transition-colors"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
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
    color: #b8860b;
  }

  .bg-gold {
    background-color: #b8860b;
  }

  .border-gold {
    border-color: #b8860b;
  }

  .hover\:bg-gold-dark:hover {
    background-color: #a67a09;
  }

  .hover\:text-gold-dark:hover {
    color: #a67a09;
  }

  .focus\:ring-gold:focus {
    --tw-ring-color: rgba(184, 134, 11, 0.2);
  }

  .focus\:border-gold:focus {
    border-color: #b8860b;
  }

  .bg-gold-opacity-10 {
    background-color: rgba(184, 134, 11, 0.1);
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
