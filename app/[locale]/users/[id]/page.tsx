import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'



export default async function UserProfilePage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id, locale } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: listings }, { data: reviewsReceived }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    // Added image_url fetching here for the shop grid
    supabase.from('listings').select('*, images:listing_images(image_url)').eq('seller_id', id).eq('status', 'active').order('created_at', { ascending: false }),
    supabase.from('reviews').select('id, rating, comment, created_at, reviewer:profiles(full_name, username)').eq('reviewee_id', id).order('created_at', { ascending: false }).limit(20)
  ])

  if (!profile) return <div className="min-h-screen bg-gray-50 p-8 text-center">User not found.</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Link href={`/${locale}`} className="text-sm text-gray-500 hover:underline mb-6 block">← Back to marketplace</Link>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-6 mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center font-bold text-2xl text-gray-500 overflow-hidden relative flex-shrink-0">
            {profile.avatar_url ? (
              <Image 
                src={profile.avatar_url} 
                fill 
                sizes="80px" 
                priority 
                className="object-cover" 
                alt={profile.full_name || 'User'} 
              />
            ) : (
              profile.full_name?.[0] || 'U'
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.full_name || 'Anonymous'}</h1>
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              <span>⭐ {profile.rating_average ?? 0} ({profile.rating_count ?? 0} reviews)</span>
              <span>📍 {profile.location || 'No location'}</span>
            </div>
            <p className="mt-3 text-sm text-gray-600 italic">"{profile.bio || 'No bio yet.'}"</p>
          </div>
        </div>

        {/* Shop Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(listings || []).map((item: any, index: number) => (
            <Link href={`/${locale}/listings/${item.id}`} key={item.id} className="bg-white rounded-xl shadow-sm border p-2 hover:shadow-md transition">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative mb-2">
                {item.images?.[0] && (
                  <Image 
                   src={item.images[0].image_url} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw" 
                    priority={index < 4}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="object-cover" 
                    alt={item.title} 
/>
                )}
              </div>
              <h3 className="font-medium text-sm truncate">{item.title}</h3>
              <p className="font-bold text-[#FF5722]">
                {item.currency === 'VND' ? `${item.price_vnd?.toLocaleString()} ₫` : item.price_usd ? `$${item.price_usd}` : '—'}
              </p>
            </Link>
          ))}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4">Reviews</h2>
          {(reviewsReceived || []).map((r: any) => (
            <div key={r.id} className="border-b last:border-0 py-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{r.reviewer?.full_name || 'User'}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{r.rating}/5 stars</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}