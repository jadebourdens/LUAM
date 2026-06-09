import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, toSmallestUnit, calculatePlatformFee } from '@/lib/stripe'
import { buildVnpayPaymentUrl } from '@/lib/vnpay'
import { render } from '@react-email/render'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId, paymentMethod } = await req.json()
    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }
    const chosenMethod = ['bank_transfer_vnd', 'vnpay_mock', 'momo_mock', 'vnpay'].includes(paymentMethod)
      ? paymentMethod
      : 'stripe_card'

    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, title, seller_id, currency, price_eur, price_usd, price_vnd, status')
      .eq('id', listingId)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 })
    }

    const amountMain = listing.price_vnd != null
  ? Number(listing.price_vnd)
  : listing.price_eur != null
  ? Number(listing.price_eur)
  : Number(listing.price_usd)

const orderCurrency = listing.price_vnd != null ? 'VND' : listing.currency

    const unitAmount = toSmallestUnit(amountMain, listing.currency)
    const platformFee = calculatePlatformFee(unitAmount)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount: amountMain,
        currency: orderCurrency,
        platform_fee: platformFee,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Failed to create order' }, { status: 400 })
    }

    if (chosenMethod === 'bank_transfer_vnd') {
      const transferRef = `LUAM-${order.id.slice(0, 8).toUpperCase()}`

      const [{ data: buyer }, { data: seller }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('profiles').select('full_name, bank_name, bank_account_number, bank_account_name').eq('id', listing.seller_id).single(),
      ])

      const { data: { user: authUser } } = await supabase.auth.getUser()
      const buyerEmail = authUser?.email || ''
      const { data: sellerAuth } = await supabase.auth.admin.getUserById(listing.seller_id)
      const sellerEmail = sellerAuth?.user?.email || ''

      try {
        const { resend } = await import('@/lib/resend')
        const { OrderConfirmedEmail } = await import('@/lib/emails/order-confirmed')
        const { SellerNewOrderEmail } = await import('@/lib/emails/seller-new-order')

        const buyerHtml = await render(OrderConfirmedEmail({
          buyerName: buyer?.full_name || 'there',
          sellerName: seller?.full_name || 'Seller',
          listingTitle: listing.title,
          amount: amountMain,
          currency: listing.currency,
          orderId: order.id,
          ref: transferRef,
          bankName: seller?.bank_name || '',
          bankAccountNumber: seller?.bank_account_number || '',
          bankAccountName: seller?.bank_account_name || '',
        }))

        const sellerHtml = await render(SellerNewOrderEmail({
          sellerName: seller?.full_name || 'there',
          buyerName: buyer?.full_name || 'Buyer',
          listingTitle: listing.title,
          amount: amountMain,
          currency: listing.currency,
          orderId: order.id,
          ref: transferRef,
        }))

        await Promise.all([
          resend.emails.send({
            from: 'Luam Marketplace <onboarding@resend.dev>',
            to: buyerEmail,
            subject: `Order confirmed — ${listing.title}`,
            html: buyerHtml,
          }),
          resend.emails.send({
            from: 'Luam Marketplace <onboarding@resend.dev>',
            to: sellerEmail,
            subject: `New order received — ${listing.title}`,
            html: sellerHtml,
          }),
        ])
      } catch (e) {
        console.error('Email sending failed:', e)
      }

      return NextResponse.json({
        localPayment: true,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/en/checkout/local-transfer?order_id=${order.id}&ref=${transferRef}`,
      })
    }

    if (chosenMethod === 'vnpay_mock' || chosenMethod === 'momo_mock') {
      return NextResponse.json({
        localPayment: true,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/mock-pay?provider=${chosenMethod}&order_id=${order.id}`,
      })
    }

    if (chosenMethod === 'vnpay') {
      if (listing.price_vnd == null) {
  return NextResponse.json({ error: 'VNPay requires a VND price' }, { status: 400 })
}
      try {
        const ipAddr = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'
        const url = buildVnpayPaymentUrl({
          orderId: order.id,
          amountVnd: amountMain,
          ipAddr,
          orderInfo: `Luam order ${order.id}`,
        })
        return NextResponse.json({ url })
      } catch (e: any) {
        return NextResponse.json({ error: e.message || 'VNPay not configured' }, { status: 500 })
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: listing.currency.toLowerCase(),
            unit_amount: unitAmount,
            product_data: { name: listing.title },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel?listing_id=${listing.id}`,
      metadata: {
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        order_id: order.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Checkout route error:', e)
    return NextResponse.json({ error: e.message || 'Checkout failed' }, { status: 500 })
  }
}