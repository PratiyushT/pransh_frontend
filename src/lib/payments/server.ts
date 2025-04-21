import Stripe from 'stripe'
import { STRIPE_SECRET_KEY } from '$env/static/private';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' // Updated to a valid Stripe API version
})
