export function OrderConfirmedEmail({
  buyerName,
  sellerName,
  listingTitle,
  amount,
  currency,
  orderId,
  ref,
  bankName,
  bankAccountNumber,
  bankAccountName,
}: {
  buyerName: string
  sellerName: string
  listingTitle: string
  amount: number
  currency: string
  orderId: string
  ref: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
}) {
  const formatMoney = (value: number) => {
    if (currency === 'EUR') return `€${value.toFixed(2)}`
    if (currency === 'USD') return `$${value.toFixed(2)}`
    return `${Math.round(value).toLocaleString()} ₫`
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ color: '#FF5722' }}>🛍️ Order Confirmed — {listingTitle}</h2>
      <p>Hi <strong>{buyerName}</strong>,</p>
      <p>Your order has been placed! Please complete your bank transfer to the seller:</p>
      <div style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <p><strong>Bank:</strong> {bankName}</p>
        <p><strong>Account holder:</strong> {bankAccountName}</p>
        <p><strong>Account number:</strong> {bankAccountNumber}</p>
        <p><strong>Amount:</strong> {formatMoney(amount)}</p>
        <p><strong>Reference:</strong> <span style={{ color: '#FF5722', fontWeight: 'bold' }}>{ref}</span></p>
      </div>
      <p style={{ color: '#e53e3e' }}>⚠️ Include the reference <strong>{ref}</strong> exactly so the seller can verify your payment.</p>
      <p>Order ID: {orderId}</p>
      <hr />
      <p style={{ color: '#999', fontSize: '12px' }}>Luam Marketplace — connecting buyers and sellers in Vietnam</p>
    </div>
  )
}
