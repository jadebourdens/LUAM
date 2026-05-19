import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Payment canceled</h1>
        <p className="text-gray-600 mb-4">No charge was made. You can try checkout again anytime.</p>
        <div className="flex gap-3">
          <Link href="/orders" className="bg-[#FF5722] text-white px-4 py-2 rounded">Go to Orders</Link>
          <Link href="/" className="border px-4 py-2 rounded">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
