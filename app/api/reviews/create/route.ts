import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId, rating, comment } = await req.json() as { orderId: string; rating: number; comment?: string }
    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.buyer_id !== user.id) return NextResponse.json({ error: 'Only buyer can review this order' }, { status: 403 })
    if (order.status !== 'delivered') return NextResponse.json({ error: 'Order must be delivered before review' }, { status: 400 })

    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        order_id: order.id,
        reviewer_id: user.id,
        reviewee_id: order.seller_id,
        rating,
        comment: comment?.trim() || null,
      })

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

    const { data: sellerReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', order.seller_id)

    const count = sellerReviews?.length || 0
    const avg = count > 0 ? sellerReviews!.reduce((sum, r: any) => sum + Number(r.rating || 0), 0) / count : 0

    await supabase
      .from('profiles')
      .update({ rating_average: Number(avg.toFixed(2)), rating_count: count })
      .eq('id', order.seller_id)

    return NextResponse.json({ ok: true, rating_average: Number(avg.toFixed(2)), rating_count: count })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create review' }, { status: 500 })
  }
}
