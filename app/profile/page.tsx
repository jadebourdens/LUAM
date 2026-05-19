import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeleteListingButton from '@/components/delete-listing-button'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Profile</h1>
          <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
          <Link href="/auth/login" className="text-[#FF5722] hover:text-[#E64A19]">Go to login</Link>
        </div>
      </div>
    )
  }

  const [{ data: profile }, { data: myListings }, { data: purchases }, { data: reviewsWritten }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, email, location, bio, phone, rating_average, rating_count')
      .eq('id', user.id)
      .single(),
    supabase
      .from('listings')
      .select('id, title, status, currency, price_eur, price_usd, price_vnd, created_at')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, listing_id, amount, currency, status, created_at, listing:listings(id,title)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, order:orders(id,listing_id), reviewee:profiles(id, full_name, username)')
      .eq('reviewer_id', user.id)
      .order('created_at', { ascending: false })
  ])

  const formatPrice = (row: any) => {
    if (row.currency === 'EUR') return `€${row.price_eur ?? row.amount ?? 0}`
    if (row.currency === 'USD') return `$${row.price_usd ?? row.amount ?? 0}`
    if (row.currency === 'VND') return `${(row.price_vnd ?? row.amount ?? 0).toLocaleString()} ₫`
    return '—'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <Link href="/profile/edit" className="bg-[#FF5722] text-white px-4 py-2 rounded hover:bg-[#E64A19]">Edit Profile</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
            <p><strong>Name:</strong> {profile?.full_name || '—'}</p>
            <p><strong>Username:</strong> {profile?.username || '—'}</p>
            <p><strong>Email:</strong> {profile?.email || user.email || '—'}</p>
            <p><strong>Location:</strong> {profile?.location || '—'}</p>
            <p><strong>Phone:</strong> {profile?.phone || '—'}</p>
            <p><strong>Rating:</strong> {profile?.rating_average ?? 0} ({profile?.rating_count ?? 0} reviews)</p>
          </div>
          <p className="mt-4 text-gray-700"><strong>Bio:</strong> {profile?.bio || 'No bio yet.'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Seller Context: My Listings</h2>
          <div className="space-y-3">
            {(myListings || []).length === 0 && <p className="text-gray-500">No listings yet.</p>}
            {(myListings || []).map((item: any) => (
              <div key={item.id} className="border rounded p-3 flex justify-between items-start gap-4">
                <div>
                  <Link href={`/listings/${item.id}`} className="font-medium text-[#FF5722] hover:underline">{item.title}</Link>
                  <p className="text-xs text-gray-500">Status: {item.status}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="font-semibold">{formatPrice(item)}</p>
                  {item.status !== 'deleted' && (
                    <DeleteListingButton listingId={item.id} title={item.title} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Buyer Context: Purchased Items</h2>
          <div className="space-y-3">
            {(purchases || []).length === 0 && <p className="text-gray-500">No purchases yet.</p>}
            {(purchases || []).map((order: any) => (
              <div key={order.id} className="border rounded p-3 flex justify-between">
                <div>
                  <p className="font-medium">{order.listing?.title || 'Listing unavailable'}</p>
                  <p className="text-xs text-gray-500">Order status: {order.status}</p>
                </div>
                <p className="font-semibold">{formatPrice(order)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Buyer Context: Review History</h2>
          <div className="space-y-3">
            {(reviewsWritten || []).length === 0 && <p className="text-gray-500">No reviews written yet.</p>}
            {(reviewsWritten || []).map((r: any) => (
              <div key={r.id} className="border rounded p-3">
                <p className="font-medium">Rating: {r.rating}/5</p>
                <p className="text-gray-700">{r.comment || 'No comment'}</p>
                <p className="text-xs text-gray-500 mt-1">For: {r.reviewee?.full_name || r.reviewee?.username || 'User'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
