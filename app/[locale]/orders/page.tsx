'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

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
  listing?: { id: string; title: string; images?: string[] } | null
  buyer?: { id: string; username: string; avatar_url?: string } | null
  seller?: { id: string; username: string; avatar_url?: string } | null
}

const statusLabels: Record<string, string> = {
  pending: '⏳ Pending',
  paid: '💳 Paid',
  shipped: '🚚 Shipped',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled', // Added
}

export default function OrdersPage() {
  const t = useTranslations('Orders')
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

    const select = 'id,buyer_id,seller_id,status,tracking_number,currency,amount,created_at,updated_at,listing:listings(id,title,images),buyer:profiles!orders_buyer_id_fkey(id,username,avatar_url),seller:profiles!orders_seller_id_fkey(id,username,avatar_url)'

    const [{ data: buyingData }, { data: sellingData }] = await Promise.all([
      supabase.from('orders').select(select).eq('buyer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('orders').select(select).eq('seller_id', user.id).order('created_at', { ascending: false })
    ])

    const normalizedBuying = (buyingData || []) as any
    setBuying(normalizedBuying)
    setSelling((sellingData || []) as any)

    if (normalizedBuying.length > 0) {
      const orderIds = normalizedBuying.map((o: any) => o.id)
      const { data: myReviews } = await supabase.from('reviews').select('order_id').eq('reviewer_id', user.id).in('order_id', orderIds)
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
    if (status === 'paid') return 'bg-blue-100 text-blue-700'
    if (status === 'shipped') return 'bg-orange-100 text-[#E64A19]'
    if (status === 'delivered') return 'bg-green-100 text-green-700'
    if (status === 'cancelled') return 'bg-gray-100 text-gray-500' // Added
    return 'bg-gray-100 text-gray-700'
  }

  const updateStatus = async (orderId: string, nextStatus: 'shipped' | 'delivered', trackingNumber?: string) => {
    await fetch('/api/orders/update-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, nextStatus, trackingNumber }) })
    await load()
  }

  const confirmLocalPayment = async (orderId: string) => {
    await fetch('/api/orders/confirm-local-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) })
    await load()
  }

  const submitReview = async (orderId: string) => {
    const rating = reviewRatings[orderId] || 5
    const comment = reviewComments[orderId] || ''
    const res = await fetch('/api/reviews/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, rating, comment }) })
    if (res.ok) { await load(); setReviewComments((prev) => ({ ...prev, [orderId]: '' })) }
  }

  const data = tab === 'buying' ? buying : [...selling].sort((a, b) => {
  if (a.status === 'pending' && b.status !== 'pending') return -1
  if (a.status !== 'pending' && b.status === 'pending') return 1
  return 0
})

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('buying')} className={`px-4 py-2 rounded-lg ${tab === 'buying' ? 'bg-[#FF5722] text-white' : 'bg-white border'}`}>{t('buying')}</button>
          <button onClick={() => setTab('selling')} className={`px-4 py-2 rounded-lg ${tab === 'selling' ? 'bg-[#FF5722] text-white' : 'bg-white border'}`}>{t('selling')}</button>
        </div>
        {tab === 'selling' && selling.filter(o => o.status === 'pending').length > 0 && (
  <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
    <span className="text-2xl">⚠️</span>
    <div>
      <p className="font-semibold text-orange-800 text-sm">{t('action_required')}</p>
      <p className="text-orange-700 text-sm mt-0.5">
        {t('pending_alert', { count: selling.filter(o => o.status === 'pending').length })}
      </p>
      <div className="mt-2 space-y-1">
        {selling.filter(o => o.status === 'pending').map(o => (
          <p key={o.id} className="text-xs text-orange-600">
            • {o.listing?.title} — {t('pending_alert_single')}: <strong>LUAM-{o.id.slice(0, 8).toUpperCase()}</strong>
          </p>
        ))}
      </div>
    </div>
  </div>
)}
        {data.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">
            {tab === 'buying' ? t('no_buying') : t('no_selling')}
          </div>
        )}

        <div className="space-y-3">
          {data.map((o) => {
            const thumbnailUrl = Array.isArray(o.listing?.images) ? o.listing.images[0] : null
            const otherUser = tab === 'buying' ? o.seller : o.buyer
            const otherLabel = tab === 'buying' ? t('with_seller') : t('with_buyer')

            return (
                  <div key={o.id} className={`bg-white rounded-xl shadow-sm border p-4 ${o.status === 'pending' && tab === 'selling' ? 'border-l-4 border-l-[#FF5722] border-orange-100' : 'border-gray-100'}`}>                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={o.listing?.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link href={`/listings/${o.listing?.id}`} className="font-semibold text-[#FF5722] hover:underline truncate block">
                      {o.listing?.title || 'Listing'}
                    </Link>

                    {otherUser && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {otherUser.avatar_url && (
                          <img src={otherUser.avatar_url} alt={otherUser.username} className="w-4 h-4 rounded-full object-cover" />
                        )}
                        <span className="text-xs text-gray-500">{otherLabel}: <span className="font-medium text-gray-700">{otherUser.username}</span></span>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('tracking')}: {o.tracking_number || t('tracking_na')}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">{priceLabel(o)}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${badgeClass(o.status)}`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 border-t pt-3 text-xs text-gray-500 space-y-1">
                  <p className="font-medium text-gray-600">{t('timeline')}</p>
                  <p>• {t('order_created')}: {new Date(o.created_at).toLocaleString()}</p>
                  {['paid', 'shipped', 'delivered'].includes(o.status) && <p>• {t('payment_confirmed')}: {new Date(o.updated_at || o.created_at).toLocaleString()}</p>}
                  {['shipped', 'delivered'].includes(o.status) && <p>• {t('shipped')}: {new Date(o.updated_at || o.created_at).toLocaleString()}</p>}
                  {o.status === 'delivered' && <p>• {t('delivered')}: {new Date(o.updated_at || o.created_at).toLocaleString()}</p>}
                </div>

                {tab === 'selling' && o.status === 'pending' && userId === o.seller_id && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => confirmLocalPayment(o.id)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm">{t('confirm_bank')}</button>
                  </div>
                )}

                {tab === 'selling' && o.status === 'paid' && userId === o.seller_id && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      placeholder={t('tracking_placeholder')}
                      value={trackingInputs[o.id] || ''}
                      onChange={(e) => setTrackingInputs(prev => ({ ...prev, [o.id]: e.target.value }))}
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      disabled={!trackingInputs[o.id]?.trim()}
                      onClick={() => updateStatus(o.id, 'shipped', trackingInputs[o.id])}
                      className="bg-[#FF5722] disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm"
                    >{t('mark_shipped')}</button>
                  </div>
                )}

                {tab === 'buying' && o.status === 'shipped' && userId === o.buyer_id && (
                  <div className="mt-3">
                    <button onClick={() => updateStatus(o.id, 'delivered')} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm">{t('confirm_receipt')}</button>
                  </div>
                )}

                {tab === 'buying' && o.status === 'delivered' && userId === o.buyer_id && (
                  <div className="mt-3 border-t pt-3">
                    {reviewedOrderIds.has(o.id) ? (
                      <p className="text-sm text-green-700">{t('reviewed')}</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{t('rate_purchase')}</p>
                        <div className="flex items-center gap-2">
                          <select
                            value={reviewRatings[o.id] || 5}
                            onChange={(e) => setReviewRatings(prev => ({ ...prev, [o.id]: Number(e.target.value) }))}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} {n > 1 ? t('stars') : t('star')}</option>)}
                          </select>
                          <button onClick={() => submitReview(o.id)} className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm">{t('submit_review')}</button>
                        </div>
                        <textarea
                          placeholder={t('feedback_placeholder')}
                          value={reviewComments[o.id] || ''}
                          onChange={(e) => setReviewComments(prev => ({ ...prev, [o.id]: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}