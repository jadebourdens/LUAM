import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id, title')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.seller_id === user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', listing.seller_id)
      .maybeSingle()

    if (existing?.id) {
      return NextResponse.json({ conversationId: existing.id })
    }

    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      })
      .select('id')
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Fetch seller and buyer emails + names
    const [{ data: seller }, { data: buyer }] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('id', listing.seller_id).single(),
      supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
    ])

    const listingUrl = `https://luam.shop/vi/listings/${listingId}`
    const messagesUrl = `https://luam.shop/vi/messages?conversation=${created.id}`

    // Email to seller
    if (seller?.email) {
      await resend.emails.send({
        from: 'Luam <noreply@luam.shop>',
        to: seller.email,
        subject: `💬 Bạn có tin nhắn mới về "${listing.title}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1C1510;">
            <div style="background: #FF5722; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Luam</h1>
            </div>
            <div style="background: white; padding: 24px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 12px;">Xin chào <strong>${seller.full_name ?? 'bạn'}</strong>,</p>
              <p style="margin: 0 0 20px; color: #555;">
                <strong>${buyer?.full_name ?? 'Một người mua'}</strong> vừa nhắn tin hỏi về sản phẩm 
                <a href="${listingUrl}" style="color: #FF5722;">${listing.title}</a> của bạn trên Luam.
              </p>
              <a href="${messagesUrl}" style="display: inline-block; background: #FF5722; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Xem tin nhắn →
              </a>
              <p style="margin: 24px 0 0; font-size: 12px; color: #999;">
                Bạn nhận email này vì có người liên hệ về sản phẩm của bạn trên 
                <a href="https://luam.shop" style="color: #FF5722;">luam.shop</a>
              </p>
            </div>
          </div>
        `,
      })
    }

    // Email to buyer
    if (buyer?.email) {
      await resend.emails.send({
        from: 'Luam <noreply@luam.shop>',
        to: buyer.email,
        subject: `✅ Tin nhắn của bạn đã được gửi — "${listing.title}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1C1510;">
            <div style="background: #FF5722; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Luam</h1>
            </div>
            <div style="background: white; padding: 24px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 12px;">Xin chào <strong>${buyer.full_name ?? 'bạn'}</strong>,</p>
              <p style="margin: 0 0 20px; color: #555;">
                Tin nhắn của bạn về sản phẩm 
                <a href="${listingUrl}" style="color: #FF5722;">${listing.title}</a> đã được gửi thành công. 
                Người bán sẽ phản hồi sớm nhất có thể.
              </p>
              <a href="${messagesUrl}" style="display: inline-block; background: #FF5722; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Xem cuộc trò chuyện →
              </a>
              <p style="margin: 24px 0 0; font-size: 12px; color: #999;">
                Bạn nhận email này vì đã liên hệ người bán trên 
                <a href="https://luam.shop" style="color: #FF5722;">luam.shop</a>
              </p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ conversationId: created.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to start conversation' }, { status: 500 })
  }
}