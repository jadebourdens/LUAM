import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function OrderActionPage({ 
  params 
}: { 
  params: Promise<{ locale: string; orderId: string }> 
}) {
  const { locale, orderId } = await params
  const supabase = await createClient()

  // Fetch the order and join the listing to get the seller ID and listing ID
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, listing:listings(id, title, seller_id)')
    .eq('id', orderId)
    .single()

  if (error || !order) notFound()

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-sm border border-stone-100">
      <h1 className="text-xl font-bold text-stone-900 mb-6">
        Order #{orderId.slice(0, 8)}
      </h1>
      
      <div className="flex flex-col gap-3">
        <Link 
  href={`/${locale}/checkout/local-transfer?order_id=${orderId}&ref=LUAM-${orderId.slice(0, 8).toUpperCase()}`}
  className="w-full bg-[#FF5722] text-white py-3 rounded-xl text-center font-medium hover:bg-[#E64A19] transition-colors"
>
  Go to Payment
</Link>
        
        <Link 
          href={`/${locale}/messages/${order.listing.seller_id}`} 
          className="w-full border border-stone-200 py-3 rounded-xl text-center text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Talk to the Seller
        </Link>
        
        <Link 
          href={`/${locale}/listings/${order.listing.id}`} 
          className="w-full border border-stone-200 py-3 rounded-xl text-center text-stone-700 hover:bg-stone-50 transition-colors"
        >
          View Listing
        </Link>
      </div>
    </div>
  )
}