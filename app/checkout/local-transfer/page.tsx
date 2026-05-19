import Link from 'next/link'

export default async function LocalTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string; ref?: string }>
}) {
  const params = await searchParams
  const orderId = params.order_id || '—'
  const ref = params.ref || '—'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">VND Bank Transfer</h1>
        <p className="text-gray-600 mb-4">Complete your transfer using the details below. Your order will be confirmed after payment verification.</p>

        <div className="border rounded-lg p-4 space-y-2 text-sm">
          <p><strong>Bank:</strong> Vietcombank</p>
          <p><strong>Account name:</strong> LUAM MARKETPLACE</p>
          <p><strong>Account number:</strong> 0123456789</p>
          <p><strong>Transfer reference:</strong> {ref}</p>
          <p><strong>Order ID:</strong> {orderId}</p>
        </div>

        <p className="text-xs text-gray-500 mt-3">Important: include the transfer reference exactly so we can match your payment.</p>

        <div className="flex gap-3 mt-5">
          <Link href="/orders" className="bg-[#FF5722] text-white px-4 py-2 rounded">I have transferred</Link>
          <Link href="/" className="border px-4 py-2 rounded">Back Home</Link>
        </div>
      </div>
    </div>
  )
}
