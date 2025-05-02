import { json } from '@sveltejs/kit'
import { stripe } from '$lib/stripe/server'


import client from "$lib/sanity/client";

export const POST = async ({ request }) => {
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      console.error('Stripe is not initialized')
      return json({ error: 'Payment processor unavailable. Please try again later.' }, { status: 503 })
    }

    // Extract items from frontend & origin for redirect URLs
    const { items, origin, shippingDetails } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return json({ error: 'No items provided' }, { status: 400 })
    }

    // Validate each item and build verified items array
    const validatedItems = []

    // Loop through every item in the cart
    for (const item of items) {
      // Basic validation
      if (!item.id || !item.sku || !item.quantity || item.quantity <= 0) {
        return json({ error: 'Invalid item data' }, { status: 400 })
      }


      // Use a more comprehensive query to get product and variant details
      const productData = await client.fetch(`
        *[_type == "product" && _id == $id][0]{
          _id,
          name,
          "variants": *[_type == "variant" && references(^._id) && _id == $sku][0]{
            _id,
            sku,
            price,
            stock,
            "color": color->{ name },
            "size": size->{ name }
          }
        }
      `, {
        id: item.id,
        sku: item.sku
      })

      // If product doesn't exist, return error with more details
      if (!productData || !productData._id) {
        console.error(`Product not found: ${item.id}, Name: ${item.name}`)
        return json({ error: `Product not found: ${item.name || 'Unknown product'}` }, { status: 400 })
      }

      // If variant doesn't exist in this product, try a fallback query with just the variant ID
      if (!productData.variants || !productData.variants._id) {

        // Fallback query that just looks for the variant by ID
        const variantData = await client.fetch(`
          *[_type == "variant" && _id == $sku][0]{
            _id,
            sku,
            price,
            stock,
            "product": *[_type == "product" && references(^._id)][0]._id,
            "color": color->{ name },
            "size": size->{ name }
          }
        `, {
          sku: item.sku
        })

        if (!variantData || !variantData._id) {
          console.error(`Variant not found with fallback query: ${item.sku} for item ${item.name}`)
          return json({
            error: `Product variant not found: ${item.name || 'Unknown variant'}`
          }, { status: 400 })
        }

        // Check if the variant belongs to the expected product
        if (variantData.product !== item.id) {
          console.warn(`Variant ${item.sku} belongs to product ${variantData.product}, not ${item.id}`)
          // We'll allow this to proceed since we found the variant
        }

        productData.variants = variantData
      }

      const variant = productData.variants

      // Check if price sent from frontend matches Sanity price with better precision
      // Allow a small tolerance for floating point differences (0.01)
      const sanityPriceCents = Math.round(variant.price * 100)
      const clientPriceCents = Math.round(item.price * 100)
      const priceDifference = Math.abs(sanityPriceCents - clientPriceCents)

      if (priceDifference > 1) {
        console.error(`Price mismatch for ${item.name}: Sanity=${variant.price}, Client=${item.price}`)
        return json({
          error: `Price mismatch detected. Please refresh and try again.`
        }, { status: 400 })
      }

      // Check if requested quantity is in stock
      if (!variant.stock || variant.stock < item.quantity) {
        console.error(`Insufficient stock for ${item.name}: Available=${variant.stock}, Requested=${item.quantity}`)
        return json({
          error: `Not enough stock for ${item.name || 'item'}. Available: ${variant.stock || 0}`
        }, { status: 400 })
      }

      // Format the product name correctly for the item
      const formattedName = `${productData.name}${variant.color?.name ? ` - ${variant.color.name}` : ''}${variant.size?.name ? ` (${variant.size.name})` : ''}`

      // Add to validated items
      validatedItems.push({
        id: item.id,
        sku: item.sku,
        name: formattedName,
        price: variant.price,
        quantity: item.quantity
      })
    }


    // After successful validation of all items → create Stripe Checkout Session
    try {
      // Convert country name to country code for Stripe
      const getCountryCode = (countryName) => {
        switch (countryName) {
          case 'United States': return 'US';
          case 'Canada': return 'CA';
          case 'United Kingdom': return 'GB';
          case 'Australia': return 'AU';
          case 'New Zealand': return 'NZ';
          default: return 'US'; // Default fallback
        }
      };

      // Format shipping name from first and last name
      const shippingName = `${shippingDetails.firstName} ${shippingDetails.lastName}`.trim();

      // Create session with payment_intent_data.shipping to pass address directly
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',

        // Pass verified line_items to Stripe - using the server-validated data
        line_items: validatedItems.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name
            },
            unit_amount: Math.round(item.price * 100) // Amount in cents, rounded to ensure integer
          },
          quantity: item.quantity
        })),

        // Include shipping details via payment_intent_data
        ...(shippingDetails && {
          customer_email: shippingDetails.email,
          // No shipping_address_collection here
          shipping_options: [
            {
              shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: {
                  amount: 1500, // $15.00 in cents
                  currency: 'usd',
                },
                display_name: 'Standard Shipping',
                delivery_estimate: {
                  minimum: {
                    unit: 'business_day',
                    value: 5,
                  },
                  maximum: {
                    unit: 'business_day',
                    value: 10,
                  },
                }
              }
            }
          ],
          // Pass shipping details to payment intent
          payment_intent_data: {
            shipping: {
              name: shippingName,
              phone: shippingDetails.phone,
              address: {
                line1: shippingDetails.addressLine1,
                line2: shippingDetails.addressLine2 || '',
                city: shippingDetails.city,
                state: shippingDetails.state,
                postal_code: shippingDetails.postalCode,
                country: getCountryCode(shippingDetails.country)
              }
            }
          },
          // Store original order data in metadata
          metadata: {
            orderId: `order-${Date.now()}`,
            itemCount: validatedItems.length,
            orderSummary: JSON.stringify(validatedItems.map(item => ({
              name: item.name,
              quantity: item.quantity
            })))
          }
        }),

        // Redirect user on success
        success_url: `${origin}/success`,
        // Redirect user on cancel
        cancel_url: `${origin}/cancel`
      })

      // Return sessionId to frontend
      return json({ sessionId: session.id })
    } catch (stripeError) {
      console.error('Stripe session creation error:', stripeError)
      return json({
        error: 'Failed to create payment session. Please try again later.'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Checkout error:', error)
    return json({
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 })
  }
}
