import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId, status } = await req.json()
    if (!orderId || !['paid', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { data: order } = await supabase.from('orders').select('id,buyer_id,status,listing_id').eq('id', orderId).single()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.buyer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Mark listing as sold if payment confirmed
    if (status === 'paid') {
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', order.listing_id)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
