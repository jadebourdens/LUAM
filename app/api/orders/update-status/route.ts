import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AllowedStatus = 'pending' | 'shipped' | 'delivered'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId, nextStatus, trackingNumber } = await req.json() as {
      orderId: string
      nextStatus: AllowedStatus
      trackingNumber?: string
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, status, tracking_number, listing:listings(title)')
      .eq('id', orderId)
      .single()

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (nextStatus === 'shipped') {
      if (order.seller_id !== user.id) return NextResponse.json({ error: 'Only seller can ship' }, { status: 403 })
      if (order.status !== 'paid') return NextResponse.json({ error: 'Only paid orders can be shipped' }, { status: 400 })
      const cleanTracking = (trackingNumber || '').trim()
      if (!cleanTracking) return NextResponse.json({ error: 'Tracking number is required before shipping' }, { status: 400 })

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'shipped', tracking_number: cleanTracking })
        .eq('id', orderId)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

      // Send shipping email to buyer
      try {
        const { data: buyerAuth } = await supabase.auth.admin.getUserById(order.buyer_id)
        const { data: buyer } = await supabase.from('profiles').select('full_name').eq('id', order.buyer_id).single()
        const buyerEmail = buyerAuth?.user?.email || ''

        const { resend } = await import('@/lib/resend')
        const { OrderShippedEmail } = await import('@/lib/emails/order-shipped')

        await resend.emails.send({
          from: 'Luam Marketplace <onboarding@resend.dev>',
          to: buyerEmail,
          subject: `Your order has been shipped — ${(order.listing as any)?.title}`,
          react: OrderShippedEmail({
            buyerName: buyer?.full_name || 'there',
            listingTitle: (order.listing as any)?.title || 'Your item',
            trackingNumber: cleanTracking,
            orderId: order.id,
          }),
        })
      } catch (e) {
        console.error('Shipping email failed:', e)
      }

      return NextResponse.json({ ok: true })
    }

    if (nextStatus === 'delivered') {
      if (order.buyer_id !== user.id) return NextResponse.json({ error: 'Only buyer can confirm receipt' }, { status: 403 })
      if (order.status !== 'shipped') return NextResponse.json({ error: 'Only shipped orders can be marked delivered' }, { status: 400 })

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unsupported status transition' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update order' }, { status: 500 })
  }
}