import crypto from 'crypto'

export interface VnpayConfig {
  tmnCode: string
  hashSecret: string
  url: string
  returnUrl: string
}

export function getVnpayConfig(): VnpayConfig | null {
  const tmnCode = process.env.VNPAY_TMN_CODE
  const hashSecret = process.env.VNPAY_HASH_SECRET
  const url =
    process.env.VNPAY_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
  const returnUrl =
    process.env.VNPAY_RETURN_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/vnpay/return`
  if (!tmnCode || !hashSecret) return null
  return { tmnCode, hashSecret, url, returnUrl }
}

function formatGmt7Date(d: Date): string {
  const offsetMs = 7 * 60 * 60 * 1000
  const t = new Date(d.getTime() + offsetMs)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    t.getUTCFullYear().toString() +
    pad(t.getUTCMonth() + 1) +
    pad(t.getUTCDate()) +
    pad(t.getUTCHours()) +
    pad(t.getUTCMinutes()) +
    pad(t.getUTCSeconds())
  )
}

function buildSignData(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort()
  return sortedKeys
    .map((k) => `${k}=${encodeURIComponent(params[k])}`)
    .join('&')
}

export function buildVnpayPaymentUrl(args: {
  orderId: string
  amountVnd: number
  ipAddr: string
  orderInfo?: string
}): string {
  const cfg = getVnpayConfig()
  if (!cfg) {
    throw new Error(
      'VNPay not configured (missing VNPAY_TMN_CODE or VNPAY_HASH_SECRET)'
    )
  }

  const now = new Date()
  const expire = new Date(now.getTime() + 15 * 60 * 1000)

  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: cfg.tmnCode,
    vnp_Amount: String(Math.round(args.amountVnd * 100)),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: args.orderId,
    vnp_OrderInfo: args.orderInfo || `Thanh toan don hang ${args.orderId}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: cfg.returnUrl,
    vnp_IpAddr: args.ipAddr,
    vnp_CreateDate: formatGmt7Date(now),
    vnp_ExpireDate: formatGmt7Date(expire),
  }

  const signData = buildSignData(params)
  const signature = crypto
    .createHmac('sha512', cfg.hashSecret)
    .update(signData)
    .digest('hex')

  return `${cfg.url}?${signData}&vnp_SecureHash=${signature}`
}

export function verifyVnpaySignature(
  params: Record<string, string>
): boolean {
  const cfg = getVnpayConfig()
  if (!cfg) return false
  const received = params['vnp_SecureHash']
  if (!received) return false

  const filtered: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (k === 'vnp_SecureHash' || k === 'vnp_SecureHashType') continue
    filtered[k] = v
  }

  const signData = buildSignData(filtered)
  const expected = crypto
    .createHmac('sha512', cfg.hashSecret)
    .update(signData)
    .digest('hex')

  return expected.toLowerCase() === received.toLowerCase()
}
