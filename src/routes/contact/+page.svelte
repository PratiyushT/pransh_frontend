<script>
  let name = '';
  let email = '';
  let subject = '';
  let message = '';
  let isSubmitting = false;
  let isSubmitted = false;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation
    if (!name || !email || !message) {
      alert('Please fill out all required fields');
      return;
    }

    isSubmitting = true;

    // Simulate form submission
    setTimeout(() => {
      isSubmitting = false;
      isSubmitted = true;
      name = '';
      email = '';
      subject = '';
      message = '';
    }, 1500);
  };
</script>

<svelte:head>
  <title>Contact | Pransh</title>
  <meta name="description" content="Contact Pransh - We'd love to hear from you.">
</svelte:head>

<div class="container mx-auto py-12 px-4">
  <h1 class="text-3xl font-serif mb-8 text-center">Contact Us</h1>

  <div class="max-w-4xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 class="text-2xl font-serif mb-4">Get In Touch</h2>
        <p class="mb-6">We'd love to hear from you. Please fill out the form, and we'll get back to you as soon as possible.</p>

        {#if isSubmitted}
          <div class="p-6 border border-green-200 bg-green-50 text-green-700 rounded">
            <h3 class="font-medium text-xl mb-2">Thank You!</h3>
            <p>Your message has been sent successfully. We'll get back to you soon.</p>
            <button class="btn btn-primary mt-4" on:click={() => isSubmitted = false}>
              Send Another Message
            </button>
          </div>
        {:else}
          <form class="space-y-6" on:submit={handleSubmit}>
            <div>
              <label for="name" class="block mb-2">Name</label>
              <input
                type="text"
                id="name"
                bind:value={name}
                class="w-full px-4 py-2 border border-gray-300"
                required
              >
            </div>

            <div>
              <label for="email" class="block mb-2">Email</label>
              <input
                type="email"
                id="email"
                bind:value={email}
                class="w-full px-4 py-2 border border-gray-300"
                required
              >
            </div>

            <div>
              <label for="subject" class="block mb-2">Subject</label>
              <input
                type="text"
                id="subject"
                bind:value={subject}
                class="w-full px-4 py-2 border border-gray-300"
                required
              >
            </div>

            <div>
              <label for="message" class="block mb-2">Message</label>
              <textarea
                id="message"
                bind:value={message}
                rows="5"
                class="w-full px-4 py-2 border border-gray-300"
                required
              ></textarea>
            </div>

            <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
              {#if isSubmitting}
                Sending...
              {:else}
                Send Message
              {/if}
            </button>
          </form>
        {/if}
      </div>

      <div>
        <h2 class="text-2xl font-serif mb-4">Contact Information</h2>

        <div class="space-y-6">
          <div>
            <h3 class="font-medium mb-2">Address</h3>
            <p>123 Fashion Avenue<br>New York, NY 10001<br>United States</p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Email</h3>
            <p>info@pransh.com</p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Phone</h3>
            <p>+1 (555) 123-4567</p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Hours</h3>
            <p>Monday-Friday: 9am - 6pm<br>Saturday: 10am - 5pm<br>Sunday: Closed</p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Follow Us</h3>
            <div class="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
