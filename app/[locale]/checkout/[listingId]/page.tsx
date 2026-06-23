'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.listingId as string
  const locale = (params?.locale as string) ?? 'en'
  const isVi = locale === 'vi'
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listing, setListing] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer_vnd'>('bank_transfer_vnd')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('listings')
        .select('id,title,currency,price_eur,price_usd,price_vnd,status')
        .eq('id', listingId)
        .single()
      setListing(data)
      if (data?.status === 'sold') {
        setError(isVi ? 'Sản phẩm này đã được bán.' : 'This item has already been sold.')
      }
    }
    if (listingId) load()
  }, [listingId])

  const getAmount = () => {
    if (!listing) return 0

    if (listing.currency === 'USD') return Number(listing.price_usd ?? 0)
    if (listing.currency === 'VND') return Number(listing.price_vnd ?? 0)
    if (listing.currency === 'EUR') return Number(listing.price_eur ?? 0)

    return 0
  }

  const amount = getAmount()
  const total = amount

  const formatMoney = (value: number) => {
    const n = Number(value) || 0
    if (!listing?.currency) return `${n}`
    if (listing.currency === 'EUR') return `€${n.toFixed(2)}`
    if (listing.currency === 'USD') return `$${n.toFixed(2)}`
    return `${Math.round(n).toLocaleString('en-US')} ₫`
  }

  const handleBuyNow = async () => {
    if (loading) return
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
      setError(data.error || (isVi ? 'Không thể bắt đầu thanh toán.' : 'Failed to start checkout'))
      setLoading(false)
      return
    }

    if (data.url) {
      if (data.localPayment) {
        router.push(`/${locale}${data.url}`)
      } else {
        window.open(data.url, '_blank')
      }
      setLoading(false)
      return
    }

    setError(isVi ? 'Không tìm thấy đường dẫn thanh toán.' : 'Missing checkout URL from Stripe')
    setLoading(false)
  }

  const isSold = listing?.status === 'sold'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">
          {isVi ? 'Xác nhận đơn hàng' : 'Final Checkout'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isVi ? 'Kiểm tra thông tin thanh toán trước khi tiếp tục.' : 'Review your payment details before paying with Stripe.'}
        </p>

        {error && <p className="text-red-600 mb-4 bg-red-50 border border-red-200 p-3 rounded">{error}</p>}

        {listing && (
          <div className="border rounded-lg p-4 mb-6 space-y-2 text-sm">
            <p><strong>{isVi ? 'Sản phẩm' : 'Item'}:</strong> {listing.title}</p>
            <div className="flex justify-between">
              <span>{isVi ? 'Giá sản phẩm' : 'Item price'}</span>
              <span>{formatMoney(amount)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-base">
              <span>{isVi ? 'Tổng cộng' : 'Total'}</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        )}

        {!isSold && (
          <div className="mb-4 bg-stone-50 border border-stone-200 rounded-xl p-4">
            <p className="text-sm font-medium mb-1">
              💳 {isVi ? 'Phương thức thanh toán' : 'Payment method'}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {isVi ? 'Chuyển khoản ngân hàng là phương thức thanh toán phổ biến và an toàn nhất tại Việt Nam.' : 'Bank transfer is the most trusted payment method in Vietnam'}
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="paymentMethod" checked={true} readOnly />
              <div>
                <p className="text-sm font-medium">🏦 {isVi ? 'Chuyển khoản ngân hàng (VND)' : 'Bank Transfer (VND)'}</p>
                <p className="text-xs text-gray-400">
                  {isVi ? 'Chuyển tiền trực tiếp vào tài khoản ngân hàng của người bán.' : "Transfer directly to seller's bank account"}
                </p>
              </div>
            </label>
          </div>
        )}

        <button
          onClick={handleBuyNow}
          disabled={loading || isSold}
          className={`w-full py-3 rounded-lg font-medium transition ${
            isSold
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSold
            ? (isVi ? 'Đã bán' : 'Item Sold')
            : loading
            ? (isVi ? 'Đang xử lý…' : 'Processing…')
            : (isVi ? '🏦 Tiếp tục đến hướng dẫn chuyển khoản' : '🏦 Continue to Transfer Instructions')}
        </button>

        <button onClick={() => router.back()} className="w-full mt-3 border border-gray-300 py-3 rounded-lg text-gray-700">
          {isVi ? 'Quay lại' : 'Back'}
        </button>
      </div>
    </div>
  )
}