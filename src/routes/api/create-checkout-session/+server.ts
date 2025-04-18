import { json } from '@sveltejs/kit'
import { stripe } from '$lib/stripe/server'
import { sanityClient } from '$lib/sanity/client'

export const POST = async ({ request }) => {
  // Extract items from frontend & origin for redirect URLs
  const { items, origin } = await request.json()

  // Loop through every item in the cart
  for (const item of items) {
    // Fetch product data from Sanity using its _id
    const product = await sanityClient.fetch(
      `*[_type == "product" && _id == $id][0]{
        name,
        variants[]{
          sku,
          price,
          stock
        }
      }`,
      { id: item.id }
    )

    // If product doesn't exist, return error
    if (!product) {
      return json({ error: 'Invalid Product' }, { status: 400 })
    }

    // Find the matching variant inside product by SKU
    const variant = product.variants.find((v:any) => v.sku === item.sku)

    // If variant doesn't exist, return error
    if (!variant) {
      return json({ error: 'Invalid Product Variant' }, { status: 400 })
    }

    // Check if price sent from frontend matches Sanity price
    if (variant.price * 100 !== item.price * 100) {
      return json({ error: 'Server and Client Price Mismatch' }, { status: 400 })
    }

    // Check if requested quantity is in stock
    if (variant.stock < item.quantity) {
      return json({ error: 'Not Enough Stock' }, { status: 400 })
    }
  }

  // After successful validation of all items → create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // Accept card payments
    mode: 'payment', // One time payment (not subscription)

    // Pass verified line_items to Stripe
    line_items: items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name // Safe to display user given name
        },
        unit_amount: item.price * 100 // Amount in cents
      },
      quantity: item.quantity
    })),

    // Redirect user on success
    success_url: `${origin}/success`,
    // Redirect user on cancel
    cancel_url: `${origin}/cancel`
  })

  // Return sessionId to frontend
  return json({ sessionId: session.id })
}
