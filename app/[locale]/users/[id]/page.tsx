import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: listings }, { data: reviewsReceived }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, location, bio, rating_average, rating_count')
      .eq('id', id)
      .single(),
    supabase
      .from('listings')
      .select('id, title, status, currency, price_eur, price_usd, price_vnd')
      .eq('seller_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer:profiles(full_name, username)')
      .eq('reviewee_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
  ])

  if (!profile) {
    return <div className="min-h-screen bg-gray-50 p-8">User not found.</div>
  }

  const formatPrice = (item: any) => {
    if (item.currency === 'EUR') return `€${item.price_eur ?? 0}`
    if (item.currency === 'USD') return `$${item.price_usd ?? 0}`
    if (item.currency === 'VND') return `${(item.price_vnd ?? 0).toLocaleString()} ₫`
    return '—'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Link href="/" className="text-[#FF5722]">← Back</Link>
          <h1 className="text-2xl font-bold mt-2">{profile.full_name || profile.username || 'User'}</h1>
          <p className="text-gray-600">{profile.location || 'Location not set'}</p>
          <p className="mt-2"><strong>Rating:</strong> {profile.rating_average ?? 0} ({profile.rating_count ?? 0} reviews)</p>
          <p className="mt-2 text-gray-700"><strong>Bio:</strong> {profile.bio || 'No bio yet.'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Seller Listings</h2>
          <div className="space-y-3">
            {(listings || []).length === 0 && <p className="text-gray-500">No active listings.</p>}
            {(listings || []).map((item: any) => (
              <div key={item.id} className="border rounded p-3 flex justify-between">
                <Link href={`/listings/${item.id}`} className="text-[#FF5722] hover:underline">{item.title}</Link>
                <p className="font-semibold">{formatPrice(item)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Seller Ratings & Reviews</h2>
          <div className="space-y-3">
            {(reviewsReceived || []).length === 0 && <p className="text-gray-500">No reviews yet.</p>}
            {(reviewsReceived || []).map((r: any) => (
              <div key={r.id} className="border rounded p-3">
                <p className="font-medium">{r.rating}/5</p>
                <p>{r.comment || 'No comment'}</p>
                <p className="text-xs text-gray-500 mt-1">By: {r.reviewer?.full_name || r.reviewer?.username || 'User'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
