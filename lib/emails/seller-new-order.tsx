export function SellerNewOrderEmail({
  sellerName,
  buyerName,
  listingTitle,
  amount,
  currency,
  orderId,
  ref,
}: {
  sellerName: string
  buyerName: string
  listingTitle: string
  amount: number
  currency: string
  orderId: string
  ref: string
}) {
  const formatMoney = (value: number) => {
    if (currency === 'EUR') return `€${value.toFixed(2)}`
    if (currency === 'USD') return `$${value.toFixed(2)}`
    return `${Math.round(value).toLocaleString()} ₫`
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ color: '#FF5722' }}>🎉 New Order — {listingTitle}</h2>
      <p>Hi <strong>{sellerName}</strong>,</p>
      <p><strong>{buyerName}</strong> has placed an order for your item!</p>
      <div style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <p><strong>Item:</strong> {listingTitle}</p>
        <p><strong>Amount:</strong> {formatMoney(amount)}</p>
        <p><strong>Transfer reference:</strong> <span style={{ color: '#FF5722', fontWeight: 'bold' }}>{ref}</span></p>
        <p><strong>Order ID:</strong> {orderId}</p>
      </div>
      <p>Check your banking app for a transfer with reference <strong>{ref}</strong>. Once received, confirm payment in your Orders page.</p>
      <hr />
      <p style={{ color: '#999', fontSize: '12px' }}>Luam Marketplace — connecting buyers and sellers in Vietnam</p>
    </div>
  )
}
