import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, toSmallestUnit, calculatePlatformFee } from '@/lib/stripe'
import { buildVnpayPaymentUrl } from '@/lib/vnpay'

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

    const amountMain = listing.currency === 'EUR'
      ? Number(listing.price_eur)
      : listing.currency === 'USD'
      ? Number(listing.price_usd)
      : Number(listing.price_vnd)

    const unitAmount = toSmallestUnit(amountMain, listing.currency)

    const platformFee = calculatePlatformFee(unitAmount)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount: amountMain,
        currency: listing.currency,
        platform_fee: platformFee,
        status: chosenMethod === 'bank_transfer_vnd' ? 'pending' : 'pending',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Failed to create order' }, { status: 400 })
    }

    if (chosenMethod === 'bank_transfer_vnd') {
      const transferRef = `LUAM-${order.id.slice(0, 8).toUpperCase()}`
      return NextResponse.json({
        localPayment: true,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/local-transfer?order_id=${order.id}&ref=${transferRef}`,
      })
    }

    if (chosenMethod === 'vnpay_mock' || chosenMethod === 'momo_mock') {
      return NextResponse.json({
        localPayment: true,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/mock-pay?provider=${chosenMethod}&order_id=${order.id}`,
      })
    }

    if (chosenMethod === 'vnpay') {
      if (listing.currency !== 'VND') {
        return NextResponse.json({ error: 'VNPay supports VND listings only' }, { status: 400 })
      }
      try {
        const ipAddr =
          req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          req.headers.get('x-real-ip') ||
          '127.0.0.1'
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
            product_data: {
              name: listing.title,
            },
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
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
        },
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Checkout route error:', e)
    return NextResponse.json({ error: e.message || 'Checkout failed' }, { status: 500 })
  }
}
