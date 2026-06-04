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
  listing?: { 
    id: string; 
    title: string; 
    listing_images?: { image_url: string }[] 
  } | null
  buyer?: { id: string; username: string; avatar_url?: string } | null
  seller?: { id: string; username: string; avatar_url?: string } | null
}

const statusLabels: Record<string, string> = {
  pending: '⏳ Pending',
  paid: '💳 Paid',
  shipped: '🚚 Shipped',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled',
}

export default function OrdersPage() {
  const t = useTranslations('Orders')
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [buying, setBuying] = useState<Order[]>([])
  const [selling, setSelling] = useState<Order[]>([])
  const [tab, setTab] = useState<'buying' | 'selling'>('buying')
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({})
  const [confirmPaymentOrder, setConfirmPaymentOrder] = useState<Order | null>(null)
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({})
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({})
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set())

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Updated select query to join listing_images
    const select = 'id,buyer_id,seller_id,status,tracking_number,currency,amount,created_at,updated_at,listing:listings(id,title,listing_images(image_url)),buyer:profiles!orders_buyer_id_fkey(id,username,avatar_url),seller:profiles!orders_seller_id_fkey(id,username,avatar_url)'

    const [{ data: buyingData }, { data: sellingData }] = await Promise.all([
      supabase.from('orders').select(select).eq('buyer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('orders').select(select).eq('seller_id', user.id).order('created_at', { ascending: false })
    ])

    setBuying((buyingData || []) as any)
    setSelling((sellingData || []) as any)

    if (buyingData && buyingData.length > 0) {
      const orderIds = buyingData.map((o: any) => o.id)
      const { data: myReviews } = await supabase.from('reviews').select('order_id').eq('reviewer_id', user.id).in('order_id', orderIds)
      setReviewedOrderIds(new Set((myReviews || []).map((r: any) => r.order_id)))
    }
  }

  useEffect(() => { load() }, [])

  const priceLabel = (o: Order) => {
    if (o.currency === 'EUR') return `€${o.amount}`
    if (o.currency === 'USD') return `$${o.amount}`
    return `${o.amount?.toLocaleString()} ₫`
  }

  const badgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700'
      case 'paid': return 'bg-blue-100 text-blue-700'
      case 'shipped': return 'bg-orange-100 text-[#E64A19]'
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-gray-100 text-gray-500'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const updateStatus = async (orderId: string, nextStatus: 'shipped' | 'delivered', trackingNumber?: string) => {
    await fetch('/api/orders/update-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, nextStatus, trackingNumber }) })
    await load()
  }

  const confirmLocalPayment = async (orderId: string) => {
    await fetch('/api/orders/confirm-local-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) })
    await load()
  }

  const data = tab === 'buying' ? buying : [...selling].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return 0
  })

  return (
    <>
      {confirmPaymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 text-center shadow-xl">
            <p className="text-xl font-semibold mb-2">💳 Confirm Payment</p>
            <p className="font-bold text-[#FF5722] mb-6">{confirmPaymentOrder.listing?.title}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPaymentOrder(null)} className="flex-1 py-3 rounded-xl border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button
                onClick={async () => {
                  await confirmLocalPayment(confirmPaymentOrder.id)
                  setConfirmPaymentOrder(null)
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
              >
                ✅ Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab('buying')} className={`font-bold ${tab === 'buying' ? 'text-[#FF5722]' : 'text-gray-400'}`}>Buying</button>
          <button onClick={() => setTab('selling')} className={`font-bold ${tab === 'selling' ? 'text-[#FF5722]' : 'text-gray-400'}`}>Selling</button>
        </div>

        {data.length === 0 && <div className="bg-white rounded-lg shadow p-6 text-gray-500">{tab === 'buying' ? t('no_buying') : t('no_selling')}</div>}

        <div className="space-y-3">
          {data.map((o) => {
            // Updated to fetch the image from the joined table
            const thumbnailUrl = o.listing?.listing_images?.[0]?.image_url
            const otherUser = tab === 'buying' ? o.seller : o.buyer
            const otherLabel = tab === 'buying' ? t('with_seller') : t('with_buyer')

            return (
              <div key={o.id} className="bg-white rounded-xl shadow-sm border p-4 border-gray-100">
                <div className="flex items-start gap-4">
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
                    <p className="text-xs text-gray-500">{otherLabel}: {otherUser?.username}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">{priceLabel(o)}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${badgeClass(o.status)}`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}