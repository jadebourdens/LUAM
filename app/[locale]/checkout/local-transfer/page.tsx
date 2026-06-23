'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LocalTransferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'
  const isVi = locale === 'vi'

  const orderId = searchParams.get('order_id')
  const ref = searchParams.get('ref') || '—'

  const [seller, setSeller] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [transferred, setTransferred] = useState(false)
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    const fetchDetails = async () => {
      if (!orderId) { setLoading(false); return }
      const supabase = createClient()
      const { data: order, error } = await supabase.from('orders').select('seller_id, listing_id, status').eq('id', orderId).single()
      console.log('order:', order, 'error:', error)
      if (order) {
        const { data } = await supabase.from('profiles').select('full_name, bank_name, bank_account_number, bank_account_name').eq('id', order.seller_id).single()
        setSeller(data)
        if (order.status === 'waiting_for_verification' || order.status === 'paid') {
          setTransferred(true)
        }
      }
      setLoading(false)
    }
    fetchDetails()
  }, [orderId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert(isVi ? 'Đã sao chép!' : 'Copied to clipboard!')
  }

  const handleTransferred = async () => {
    if (!confirm(isVi ? 'Bạn xác nhận đã chuyển khoản?' : 'Confirm that you have transferred the money?')) return
    setTransferring(true)

    const supabase = createClient()

    const { data: order } = await supabase
      .from('orders')
      .select('seller_id, listing_id, buyer:profiles!orders_buyer_id_fkey(username), listing:listings(title)')
      .eq('id', orderId)
      .single()

    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'waiting_for_verification' })
      .eq('id', orderId)

    if (orderError) {
      alert(isVi ? 'Có lỗi xảy ra. Vui lòng thử lại.' : 'Something went wrong. Please try again.')
      setTransferring(false)
      return
    }

    if (order?.seller_id) {
      await supabase.from('notifications').insert({
        user_id: order.seller_id,
        title: '💳 Người mua đã chuyển khoản',
        message: `${(order.buyer as any)?.username || 'Người mua'} đã chuyển tiền cho "${(order.listing as any)?.title}". Vui lòng kiểm tra và xác nhận.`,
        link: '/orders',
      })
    }

    setTransferred(true)
    setTransferring(false)
  }

  const handleCancelOrder = async () => {
    if (!confirm(isVi ? 'Bạn có chắc muốn huỷ đơn hàng này?' : 'Are you sure you want to cancel this order?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (!error) {
      alert(isVi ? 'Đã huỷ đơn hàng.' : 'Order cancelled successfully.')
      router.push(`/${locale}/orders`)
    } else {
      alert(isVi ? 'Huỷ đơn hàng thất bại.' : 'Failed to cancel order.')
    }
  }

  if (loading) return <div>{isVi ? 'Đang tải...' : 'Loading...'}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold mb-2">
          🏦 {isVi ? 'Thông tin chuyển khoản' : 'Bank Transfer Details'}
        </h1>

        {seller ? (
          <div className="border border-gray-200 rounded-xl p-4 space-y-3 text-sm bg-stone-50">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{isVi ? 'Ngân hàng' : 'Bank'}</span>
              <span className="font-semibold">{seller.bank_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{isVi ? 'Số tài khoản' : 'Account number'}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-widest">{seller.bank_account_number}</span>
                <button onClick={() => copyToClipboard(seller.bank_account_number)} className="text-blue-600 text-xs underline">
                  {isVi ? 'Sao chép' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-gray-500">{isVi ? 'Nội dung chuyển khoản' : 'Transfer reference'}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#FF5722]">{ref}</span>
                <button onClick={() => copyToClipboard(ref)} className="text-blue-600 text-xs underline">
                  {isVi ? 'Sao chép' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-orange-200 rounded-xl p-4 bg-orange-50 text-sm text-orange-700">
            {isVi
              ? '⚠️ Người bán chưa cập nhật thông tin ngân hàng. Vui lòng nhắn tin trực tiếp để thỏa thuận thanh toán.'
              : "⚠️ The seller hasn't added their bank details yet. Please message them directly to arrange payment."}
          </div>
        )}

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 space-y-1">
          <p>
            ⚠️ {isVi
              ? <>Ghi đúng nội dung chuyển khoản <strong>{ref}</strong> để người bán có thể xác nhận thanh toán của bạn.</>
              : <>Include <strong>{ref}</strong> exactly as the transfer reference so the seller can match your payment.</>}
          </p>
          <p>
            ⚠️ {isVi
              ? 'Kiểm tra số tài khoản khớp với thông tin người bán trước khi chuyển. Luam không chịu trách nhiệm nếu chuyển nhầm tài khoản.'
              : "Verify this account number matches the seller's identity before transferring. Luam is not responsible for transfers to incorrect accounts."}
          </p>
        </div>

        {!transferred ? (
          <button
            onClick={handleTransferred}
            disabled={transferring}
            className="mt-6 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {transferring
              ? (isVi ? 'Đang xác nhận...' : 'Confirming...')
              : (isVi ? '💳 Tôi đã chuyển khoản' : '💳 I have transferred the money')}
          </button>
        ) : (
          <div className="mt-6 w-full py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-semibold text-sm text-center">
            {isVi
              ? '✅ Đã xác nhận — đang chờ người bán kiểm tra thanh toán'
              : '✅ Transfer confirmed — waiting for seller to verify payment'}
          </div>
        )}

        {!transferred && (
          <button
            onClick={handleCancelOrder}
            className="text-gray-400 hover:text-red-600 text-xs mt-4 underline w-full text-center block"
          >
            {isVi ? 'Tôi không muốn mua nữa (Huỷ đơn hàng)' : 'I decided not to buy (Cancel Order)'}
          </button>
        )}
      </div>
    </div>
  )
}