'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LocalTransferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id') || '—'
  const ref = searchParams.get('ref') || '—'

  const [seller, setSeller] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetails = async () => {
      const supabase = createClient()
      const { data: order } = await supabase.from('orders').select('seller_id').eq('id', orderId).single()
      if (order) {
        const { data } = await supabase.from('profiles').select('full_name, bank_name, bank_account_number, bank_account_name').eq('id', order.seller_id).single()
        setSeller(data)
      }
      setLoading(false)
    }
    fetchDetails()
  }, [orderId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (!error) {
      alert("Order cancelled successfully.")
      router.push('/orders') 
    } else {
      alert("Failed to cancel order.")
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold mb-2">🏦 Bank Transfer Details</h1>
        
        {seller ? (
  <div className="border border-gray-200 rounded-xl p-4 space-y-3 text-sm bg-stone-50">
    <div className="flex justify-between items-center">
      <span className="text-gray-500">Bank</span>
      <span className="font-semibold">{seller.bank_name}</span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-gray-500">Account number</span>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg tracking-widest">{seller.bank_account_number}</span>
        <button onClick={() => copyToClipboard(seller.bank_account_number)} className="text-blue-600 text-xs underline">Copy</button>
      </div>
    </div>
    <div className="border-t pt-3 flex justify-between items-center">
      <span className="text-gray-500">Transfer reference</span>
      <div className="flex items-center gap-2">
        <span className="font-bold text-[#FF5722]">{ref}</span>
        <button onClick={() => copyToClipboard(ref)} className="text-blue-600 text-xs underline">Copy</button>
      </div>
    </div>
  </div>
) : (
  <div className="border border-orange-200 rounded-xl p-4 bg-orange-50 text-sm text-orange-700">
    ⚠️ The seller hasn't added their bank details yet. Please message them directly to arrange payment.
  </div>
)}

<div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 space-y-1">
  <p>⚠️ Include <strong>{ref}</strong> exactly as the transfer reference so the seller can match your payment.</p>
  <p>⚠️ Verify this account number matches the seller's identity before transferring. Luam is not responsible for transfers to incorrect accounts.</p>
</div>

<button 
  onClick={handleCancelOrder}
  className="text-gray-400 hover:text-red-600 text-xs mt-6 underline w-full text-center"
>
  I decided not to buy (Cancel Order)
</button>
      </div>
    </div>
  )
}