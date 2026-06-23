import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    // 1. Fetch order AND listing_id
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, seller_id, status, listing_id')
      .eq('id', orderId)
      .single()

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.seller_id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (order.status !== 'pending') return NextResponse.json({ error: 'Order already processed' }, { status: 400 })

    // 2. Update the order status
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)

    if (updateOrderError) throw updateOrderError

    // 3. Decrement stock — flips listing to 'sold' ONLY when the last unit is gone
    const { error: stockError } = await supabase
      .rpc('decrement_listing_stock', { p_listing_id: order.listing_id })

    if (stockError) throw stockError

    // 4. Sync the checkouts table
    await supabase
      .from('checkouts')
      .update({ status: 'paid_verified' })
      .eq('listing_id', order.listing_id)
      .eq('status', 'viewed_instructions')

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Confirm payment error:', e)
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}