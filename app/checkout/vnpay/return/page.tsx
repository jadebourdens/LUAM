import Link from 'next/link'
import { verifyVnpaySignature } from '@/lib/vnpay'

export default async function VnpayReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const valid = verifyVnpaySignature(params)
  const responseCode = params['vnp_ResponseCode']
  const orderId = params['vnp_TxnRef']
  const success = valid && responseCode === '00'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        {success ? (
          <>
            <h1 className="text-2xl font-bold mb-2 text-green-700">
              Thanh toán thành công
            </h1>
            <p className="text-gray-700 mb-3">
              VNPay đã xác nhận thanh toán của bạn. Đơn hàng sẽ được cập nhật trong giây lát.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2 text-red-700">
              Thanh toán chưa hoàn tất
            </h1>
            <p className="text-gray-700 mb-3">
              {valid
                ? `VNPay trả về mã: ${responseCode}.`
                : 'Không xác minh được chữ ký từ VNPay.'}
            </p>
          </>
        )}

        {orderId && (
          <p className="text-sm text-gray-700 mb-4">
            <strong>Mã đơn:</strong> {orderId}
          </p>
        )}

        <div className="flex gap-3 mt-4">
          <Link
            href="/orders"
            className="bg-[#FF5722] text-white px-4 py-2 rounded"
          >
            Xem đơn hàng
          </Link>
          <Link href="/" className="border px-4 py-2 rounded">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  )
}
