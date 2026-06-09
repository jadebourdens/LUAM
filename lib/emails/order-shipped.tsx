export function OrderShippedEmail({
  buyerName,
  listingTitle,
  trackingNumber,
  orderId,
}: {
  buyerName: string
  listingTitle: string
  trackingNumber: string
  orderId: string
}) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ color: '#FF5722' }}>🚚 Your Order Has Been Shipped!</h2>
      <p>Hi <strong>{buyerName}</strong>,</p>
      <p>Great news! Your item has been shipped.</p>
      <div style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <p><strong>Item:</strong> {listingTitle}</p>
        <p><strong>Tracking number:</strong> <span style={{ color: '#FF5722', fontWeight: 'bold' }}>{trackingNumber}</span></p>
        <p><strong>Order ID:</strong> {orderId}</p>
      </div>
      <p>Once you receive your item, please confirm delivery in your Orders page.</p>
      <hr />
      <p style={{ color: '#999', fontSize: '12px' }}>Luam Marketplace — connecting buyers and sellers in Vietnam</p>
    </div>
  )
}
