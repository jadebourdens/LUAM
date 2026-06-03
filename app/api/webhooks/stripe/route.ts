import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any
    const supabase = await createClient()

    // Get order + listing_id
    const { data: order } = await supabase
      .from('orders')
      .select('id, listing_id')
      .eq('id', paymentIntent.metadata.order_id)
      .single()

    if (!order) {
      return new Response('Order not found', { status: 404 })
    }

    // Update order status
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', paymentIntent.metadata.order_id)

    if (error) {
      console.error('Database update error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }

    // Mark listing as sold
    await supabase
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', order.listing_id)
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
