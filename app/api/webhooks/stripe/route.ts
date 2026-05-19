import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    const supabase = serviceClient()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session.metadata?.order_id
      if (orderId && session.payment_status === 'paid') {
        const { data: updated } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          })
          .eq('id', orderId)
          .eq('status', 'pending')
          .select('id')
        if (!updated || updated.length === 0) {
          console.log(`[stripe.webhook] paid no-op: order ${orderId} not in pending state (event ${event.id})`)
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object
      const orderId = paymentIntent.metadata?.order_id
      if (orderId) {
        const { data: updated } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId)
          .eq('status', 'pending')
          .select('id')
        if (!updated || updated.length === 0) {
          console.log(`[stripe.webhook] cancel no-op: order ${orderId} not in pending state (event ${event.id})`)
        }
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
      const isFullRefund = charge.amount_refunded >= charge.amount

      if (!isFullRefund) {
        console.log(`[stripe.webhook] partial refund ignored: charge ${charge.id} refunded ${charge.amount_refunded}/${charge.amount} (event ${event.id})`)
      } else if (paymentIntentId) {
        let { data: updated } = await supabase
          .from('orders')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntentId)
          .neq('status', 'refunded')
          .select('id')

        if (!updated || updated.length === 0) {
          // Fallback: PI may not be linked yet (refund arrived before session.completed)
          const { data: existing } = await supabase
            .from('orders')
            .select('id, status')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .maybeSingle()

          if (existing) {
            console.log(`[stripe.webhook] refund no-op: order ${existing.id} already in ${existing.status} (event ${event.id})`)
          } else {
            try {
              const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
              const orderIdFromPi = pi.metadata?.order_id
              if (orderIdFromPi) {
                const result = await supabase
                  .from('orders')
                  .update({ status: 'refunded', stripe_payment_intent_id: paymentIntentId })
                  .eq('id', orderIdFromPi)
                  .neq('status', 'refunded')
                  .select('id')
                updated = result.data
                if (!updated || updated.length === 0) {
                  console.log(`[stripe.webhook] refund fallback no-op: order ${orderIdFromPi} not updatable (event ${event.id})`)
                }
              } else {
                console.warn(`[stripe.webhook] refund unmatched: PI ${paymentIntentId} has no order_id metadata (event ${event.id})`)
              }
            } catch (e: any) {
              console.error(`[stripe.webhook] refund PI lookup failed: ${paymentIntentId}`, e?.message)
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Stripe Webhook Error]', error.message)
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }
}
