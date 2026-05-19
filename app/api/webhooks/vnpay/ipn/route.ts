import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyVnpaySignature } from '@/lib/vnpay'

export const runtime = 'nodejs'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params: Record<string, string> = {}
  url.searchParams.forEach((v, k) => {
    params[k] = v
  })

  if (!verifyVnpaySignature(params)) {
    return NextResponse.json({ RspCode: '97', Message: 'Checksum failed' })
  }

  const orderId = params['vnp_TxnRef']
  if (!orderId) {
    return NextResponse.json({ RspCode: '01', Message: 'Order not found' })
  }

  const responseCode = params['vnp_ResponseCode']
  const transactionStatus = params['vnp_TransactionStatus']
  const amountFromVnpay = Number(params['vnp_Amount'] || 0) / 100

  const supabase = serviceClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, amount, status, currency')
    .eq('id', orderId)
    .single()

  if (!order) {
    return NextResponse.json({ RspCode: '01', Message: 'Order not found' })
  }

  if (Math.round(Number(order.amount)) !== Math.round(amountFromVnpay)) {
    return NextResponse.json({ RspCode: '04', Message: 'Amount invalid' })
  }

  if (order.status === 'paid' || order.status === 'refunded') {
    return NextResponse.json({
      RspCode: '02',
      Message: 'Order already confirmed',
    })
  }

  if (responseCode === '00' && transactionStatus === '00') {
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)
      .eq('status', 'pending')
  } else {
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('status', 'pending')
  }

  return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' })
}
