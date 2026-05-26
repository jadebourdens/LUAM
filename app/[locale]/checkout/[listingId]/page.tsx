'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.listingId as string
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listing, setListing] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'stripe_card' | 'bank_transfer_vnd' | 'vnpay' | 'vnpay_mock' | 'momo_mock'>('stripe_card')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('listings')
        .select('id,title,currency,price_eur,price_usd,price_vnd')
        .eq('id', listingId)
        .single()
      setListing(data)
    }
    if (listingId) load()
  }, [listingId])

  const amount = listing?.currency === 'EUR' ? Number(listing?.price_eur || 0) : listing?.currency === 'USD' ? Number(listing?.price_usd || 0) : Number(listing?.price_vnd || 0)
  const platformFee = amount * 0.05
  const total = amount + platformFee

  const formatMoney = (value: number) => {
    if (!listing?.currency) return `${value}`
    if (listing.currency === 'EUR') return `€${value.toFixed(2)}`
    if (listing.currency === 'USD') return `$${value.toFixed(2)}`
    return `${Math.round(value).toLocaleString()} ₫`
  }

  const handleBuyNow = async () => {
    setLoading(true)
    setError(null)

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'checkout_start', listingId, metadata: { paymentMethod } }),
    })

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, paymentMethod }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to start checkout')
      setLoading(false)
      return
    }

    if (data.url) {
      window.location.href = data.url
      return
    }

    setError('Missing checkout URL from Stripe')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Final Checkout</h1>
        <p className="text-gray-600 mb-6">Review your payment details before paying with Stripe.</p>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {listing && (
          <div className="border rounded-lg p-4 mb-6 space-y-2 text-sm">
            <p><strong>Item:</strong> {listing.title}</p>
            <div className="flex justify-between"><span>Item price</span><span>{formatMoney(amount)}</span></div>
            <div className="flex justify-between"><span>Platform fee (5%)</span><span>{formatMoney(platformFee)}</span></div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-base"><span>Total</span><span>{formatMoney(total)}</span></div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Payment method</p>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="paymentMethod" checked={paymentMethod === 'stripe_card'} onChange={() => setPaymentMethod('stripe_card')} />
              Card payment (Stripe)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="paymentMethod" checked={paymentMethod === 'bank_transfer_vnd'} onChange={() => setPaymentMethod('bank_transfer_vnd')} />
              Bank transfer (VND)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="paymentMethod" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} />
              VNPay (sandbox)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="paymentMethod" checked={paymentMethod === 'vnpay_mock'} onChange={() => setPaymentMethod('vnpay_mock')} />
              VNPay QR (Mock)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="paymentMethod" checked={paymentMethod === 'momo_mock'} onChange={() => setPaymentMethod('momo_mock')} />
              MoMo QR (Mock)
            </label>
          </div>
        </div>

        <button onClick={handleBuyNow} disabled={loading} className="w-full bg-[#FF5722] text-white py-3 rounded-lg hover:bg-[#E64A19] disabled:opacity-60">
          {loading
            ? 'Processing…'
            : paymentMethod === 'stripe_card'
            ? 'Pay with Stripe'
            : paymentMethod === 'bank_transfer_vnd'
            ? 'Continue to Transfer Instructions'
            : paymentMethod === 'vnpay'
            ? 'Continue to VNPay'
            : 'Continue to Mock QR Payment'}
        </button>

        <button onClick={() => router.back()} className="w-full mt-3 border border-gray-300 py-3 rounded-lg text-gray-700">Back</button>
      </div>
    </div>
  )
}
