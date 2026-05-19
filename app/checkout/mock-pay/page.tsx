'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function MockPayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 text-gray-600">Loading payment…</div>}>
      <MockPayContent />
    </Suspense>
  )
}

function MockPayContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const orderId = searchParams.get('order_id') || ''
  const provider = searchParams.get('provider') || 'mock'

  const providerLabel = provider === 'vnpay_mock' ? 'VNPay QR (Mock)' : provider === 'momo_mock' ? 'MoMo QR (Mock)' : 'Mock Gateway'

  const confirm = async (status: 'paid' | 'cancelled') => {
    setLoading(true)
    await fetch('/api/payments/mock/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    })
    setLoading(false)
    router.push('/orders')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{providerLabel}</h1>
        <p className="text-gray-600 mb-4">Mock mode: simulate QR payment result for testing.</p>

        <div className="border rounded-lg p-6 flex items-center justify-center bg-gray-50 mb-4">
          <div className="w-40 h-40 border-4 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-gray-500 text-sm text-center">
            QR Mock
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-5"><strong>Order ID:</strong> {orderId}</p>

        <div className="flex gap-3">
          <button disabled={loading} onClick={() => confirm('paid')} className="bg-green-600 text-white px-4 py-2 rounded">Simulate Paid</button>
          <button disabled={loading} onClick={() => confirm('cancelled')} className="bg-red-600 text-white px-4 py-2 rounded">Simulate Failed</button>
        </div>
      </div>
    </div>
  )
}
