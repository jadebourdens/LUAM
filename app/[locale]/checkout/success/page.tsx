import Link from 'next/link'
import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import PostReview from '@/components/post-review'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id

  if (!sessionId) {
    redirect('/orders')
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (!session || session.payment_status !== 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Payment not confirmed</h1>
          <p className="text-gray-600 mb-4">We could not verify a successful payment yet.</p>
          <Link href="/orders" className="text-[#FF5722]">Go to Orders</Link>
        </div>
      </div>
    )
  }

  const orderId = session.metadata?.order_id
  const sellerId = session.metadata?.seller_id
  const supabase = await createClient()

  if (orderId) {
    const { data: updated } = await supabase
      .from('orders')
      .update({ status: 'paid', stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : undefined })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select('id')

    if (updated && updated.length > 0) {
      await supabase.from('analytics_events').insert({
        user_id: typeof session.metadata?.buyer_id === 'string' ? session.metadata.buyer_id : null,
        event_name: 'checkout_success',
        listing_id: typeof session.metadata?.listing_id === 'string' ? session.metadata.listing_id : null,
        metadata: { order_id: orderId, session_id: session.id }
      })
    }
  }

  const paidAmount = (session.amount_total || 0) / 100
  const currency = (session.currency || 'eur').toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2 text-green-700">Payment confirmed</h1>
        <p className="text-gray-700 mb-3">Your Stripe payment was successful.</p>
        <div className="text-sm text-gray-700 space-y-1 mb-4">
          <p><strong>Session:</strong> {session.id}</p>
          <p><strong>Amount paid:</strong> {paidAmount} {currency}</p>
          {orderId && <p><strong>Order ID:</strong> {orderId}</p>}
        </div>
        
        {orderId && sellerId && (
          <PostReview sellerId={sellerId} orderId={orderId} />
        )}

        <div className="flex gap-3 mt-4">
          <Link href="/orders" className="bg-[#FF5722] text-white px-4 py-2 rounded">View Orders</Link>
          <Link href="/" className="border px-4 py-2 rounded">Continue Shopping</Link>
        </div>
      </div>
    </div>
  )
}
