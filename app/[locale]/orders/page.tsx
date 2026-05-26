'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Order = {
  id: string
  buyer_id: string
  seller_id: string
  status: string
  tracking_number?: string | null
  currency: 'EUR' | 'USD' | 'VND'
  amount: number
  created_at: string
  updated_at?: string
  listing?: { id: string; title: string } | null
}

export default function OrdersPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [buying, setBuying] = useState<Order[]>([])
  const [selling, setSelling] = useState<Order[]>([])
  const [tab, setTab] = useState<'buying' | 'selling'>('buying')
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({})
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({})
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({})
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set())

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [{ data: buyingData }, { data: sellingData }] = await Promise.all([
      supabase
        .from('orders')
        .select('id,buyer_id,seller_id,status,tracking_number,currency,amount,created_at,listing:listings(id,title)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id,buyer_id,seller_id,status,tracking_number,currency,amount,created_at,listing:listings(id,title)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
    ])

    const normalizedBuying = (buyingData || []) as any
    setBuying(normalizedBuying)
    setSelling((sellingData || []) as any)

    if (normalizedBuying.length > 0) {
      const orderIds = normalizedBuying.map((o: any) => o.id)
      const { data: myReviews } = await supabase
        .from('reviews')
        .select('order_id')
        .eq('reviewer_id', user.id)
        .in('order_id', orderIds)

      setReviewedOrderIds(new Set((myReviews || []).map((r: any) => r.order_id)))
    } else {
      setReviewedOrderIds(new Set())
    }
  }

  useEffect(() => { load() }, [])

  const priceLabel = (o: Order) => {
    if (o.currency === 'EUR') return `€${o.amount}`
    if (o.currency === 'USD') return `$${o.amount}`
    return `${o.amount?.toLocaleString()} ₫`
  }

  const badgeClass = (status: string) => {
    if (status === 'pending') return 'bg-orange-100 text-orange-700'
    if (status === 'shipped') return 'bg-orange-100 text-[#E64A19]'
    if (status === 'delivered') return 'bg-green-100 text-green-700'
    return 'bg-gray-100 text-gray-700'
  }

  const updateStatus = async (orderId: string, nextStatus: 'shipped' | 'delivered', trackingNumber?: string) => {
    await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, nextStatus, trackingNumber }),
    })
    await load()
  }

  const confirmLocalPayment = async (orderId: string) => {
    await fetch('/api/orders/confirm-local-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    await load()
  }

  const submitReview = async (orderId: string) => {
    const rating = reviewRatings[orderId] || 5
    const comment = reviewComments[orderId] || ''

    const res = await fetch('/api/reviews/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, rating, comment }),
    })

    if (res.ok) {
      await load()
      setReviewComments((prev) => ({ ...prev, [orderId]: '' }))
    }
  }

  const renderEmpty = () => (
    <div className="bg-white rounded-lg shadow p-6 text-gray-500">
      {tab === 'buying' ? "You haven't bought anything yet." : 'No active sales.'}
    </div>
  )

  const data = tab === 'buying' ? buying : selling

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('buying')} className={`px-4 py-2 rounded ${tab === 'buying' ? 'bg-[#FF5722] text-white' : 'bg-white border'}`}>Buying</button>
          <button onClick={() => setTab('selling')} className={`px-4 py-2 rounded ${tab === 'selling' ? 'bg-[#FF5722] text-white' : 'bg-white border'}`}>Selling</button>
        </div>

        {data.length === 0 && renderEmpty()}

        <div className="space-y-3">
          {data.map((o) => (
            <div key={o.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/listings/${o.listing?.id}`} className="font-medium text-[#FF5722] hover:underline">
                    {o.listing?.title || 'Listing'}
                  </Link>
                  <p className="text-sm text-gray-500">{new Date(o.created_at).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">Tracking: {o.tracking_number || 'Not available yet'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{priceLabel(o)}</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${badgeClass(o.status)}`}>
                    {o.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 border-t pt-3 text-xs text-gray-600 space-y-1">
                <p>Timeline:</p>
                <p>• Order created: {new Date(o.created_at).toLocaleString()}</p>
                {['paid','shipped','delivered'].includes(o.status) && <p>• Payment confirmed: {new Date(o.updated_at || o.created_at).toLocaleString()}</p>}
                {['shipped','delivered'].includes(o.status) && <p>• Shipped: {new Date(o.updated_at || o.created_at).toLocaleString()}</p>}
                {o.status === 'delivered' && <p>• Delivered: {new Date(o.updated_at || o.created_at).toLocaleString()}</p>}
              </div>

              {tab === 'selling' && o.status === 'pending' && userId === o.seller_id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => confirmLocalPayment(o.id)} className="bg-emerald-600 text-white px-3 py-2 rounded text-sm">
                    Confirm Bank Transfer (Paid)
                  </button>
                </div>
              )}

              {tab === 'selling' && o.status === 'paid' && userId === o.seller_id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    placeholder="Tracking number (required)"
                    value={trackingInputs[o.id] || ''}
                    onChange={(e) => setTrackingInputs(prev => ({ ...prev, [o.id]: e.target.value }))}
                    className="border rounded px-3 py-2 text-sm"
                  />
                  <button
                    disabled={!trackingInputs[o.id]?.trim()}
                    onClick={() => updateStatus(o.id, 'shipped', trackingInputs[o.id])}
                    className="bg-[#FF5722] disabled:opacity-50 text-white px-3 py-2 rounded text-sm"
                  >
                    Mark as Shipped
                  </button>
                </div>
              )}

              {tab === 'buying' && o.status === 'shipped' && userId === o.buyer_id && (
                <div className="mt-3">
                  <button onClick={() => updateStatus(o.id, 'delivered')} className="bg-green-600 text-white px-3 py-2 rounded text-sm">
                    Confirm Receipt
                  </button>
                </div>
              )}

              {tab === 'buying' && o.status === 'delivered' && userId === o.buyer_id && (
                <div className="mt-3 border-t pt-3">
                  {reviewedOrderIds.has(o.id) ? (
                    <p className="text-sm text-green-700">Thanks! You already reviewed this purchase.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Rate this purchase</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={reviewRatings[o.id] || 5}
                          onChange={(e) => setReviewRatings(prev => ({ ...prev, [o.id]: Number(e.target.value) }))}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
                        </select>
                        <button onClick={() => submitReview(o.id)} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm">
                          Submit Review
                        </button>
                      </div>
                      <textarea
                        placeholder="Share your feedback (optional)"
                        value={reviewComments[o.id] || ''}
                        onChange={(e) => setReviewComments(prev => ({ ...prev, [o.id]: e.target.value }))}
                        className="w-full border rounded px-3 py-2 text-sm"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
