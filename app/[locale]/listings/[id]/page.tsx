'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import DeleteListingButton from '@/components/delete-listing-button'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const locale = (params?.locale as string) ?? 'en'

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [safetyLoading, setSafetyLoading] = useState(false)
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch if ID exists
    if (!id) return

    const fetchListing = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('listing_id', id)
          .maybeSingle()
        setIsFavorited(!!fav)
      }

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          seller:profiles(id, username, full_name, avatar_url, rating_average, rating_count, location),
          category:categories(name, slug),
          images:listing_images(image_url, position)
        `)
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setListing(data)
      setLoading(false)
    }

    fetchListing()
  }, [id])

  const handleMessageSeller = async () => {
    if (!listing?.id) return
    const res = await fetch('/api/messages/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id }),
    })
    const data = await res.json()
    if (res.ok && data.conversationId) {
      router.push(`/${locale}/messages?conversation=${data.conversationId}`)
    } else {
      alert(data.error || 'Failed to start conversation')
    }
  }

  const handleToggleFavorite = async () => {
    if (!listing?.id || !user) return
    setFavoriteLoading(true)
    const res = await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id }),
    })
    if (res.ok) {
      const data = await res.json()
      setIsFavorited(!!data.favorited)
    }
    setFavoriteLoading(false)
  }

  const handleReportListing = async () => {
    if (!user || !listing?.id) return
    setSafetyLoading(true)
    const res = await fetch('/api/reports/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id, reportedUserId: listing.seller_id, reason: 'suspicious_listing', details: 'User reported from listing detail page' }),
    })
    const data = await res.json()
    setSafetyNotice(res.ok ? 'Report submitted.' : (data.error || 'Failed to submit report'))
    setSafetyLoading(false)
  }

  const handleBlockSeller = async () => {
    if (!user || !listing?.seller_id) return
    setSafetyLoading(true)
    const res = await fetch('/api/blocks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedUserId: listing.seller_id }),
    })
    const data = await res.json()
    setSafetyNotice(res.ok ? 'Seller blocked.' : (data.error || 'Failed to block seller'))
    setSafetyLoading(false)
  }

  if (loading) return <div className="p-12 text-center">Loading...</div>
  if (error || !listing) return <div className="p-12 text-center">Listing not found.</div>

  const sortedImages = [...(listing.images || [])].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
  const formatPrice = () => {
    if (listing.currency === 'EUR') return `€${listing.price_eur}`
    if (listing.currency === 'USD') return `$${listing.price_usd}`
    if (listing.currency === 'VND') return `${listing.price_vnd?.toLocaleString()} ₫`
    return ''
  }

  const conditionLabels: Record<string, string> = { new: 'New with tags', like_new: 'Like new', good: 'Good', fair: 'Fair', worn: 'Worn' }
  const isSeller = user && listing.seller_id === user.id
  const isSold = listing.status === 'sold'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/${locale}`} className="text-sm text-gray-500 hover:text-gray-700">← Back to listings</Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {/* Images */}
            <div className="space-y-4">
              {sortedImages.length > 0 ? (
                sortedImages.map((img: any, index: number) => (
                  <div key={index} className="relative aspect-square w-full bg-gray-200 rounded-lg overflow-hidden">
                    {isSold && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                        <span className="text-white text-3xl font-bold">SOLD</span>
                      </div>
                    )}
                    <Image 
                      src={img.image_url} 
                      alt={`${listing.title} - Image ${index + 1}`} 
                      fill 
                      sizes="(max-width: 1024px) 100vw, 50vw" 
                      className="object-cover" 
                      priority={index === 0}
                    />
                  </div>
                ))
              ) : (
                <div className="relative aspect-square w-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <p className="text-2xl font-bold text-[#FF5722] mb-4">{formatPrice()}</p>
              {isSold && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                  This item has been sold.
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 shrink-0 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
                  {listing.seller?.avatar_url ? <Image src={listing.seller.avatar_url} alt="" width={48} height={48} className="object-cover rounded-full" /> : <span className="text-gray-600">{listing.seller?.full_name?.[0] || 'U'}</span>}
                </div>
                <div>
                  <Link href={`/${locale}/users/${listing.seller?.id}`} className="font-medium text-gray-900 hover:text-[#FF5722]">{listing.seller?.full_name || 'Anonymous'}</Link>
                  <p className="text-sm text-gray-500">{listing.seller?.location}</p>
                </div>
              </div>
              <div className="space-y-3">
                {!isSeller && user ? (
                  <>
                    {!isSold ? (
                      <>
                        <Link href={`/${locale}/checkout/${listing.id}`} className="block w-full bg-[#FF5722] text-white py-3 px-4 rounded-lg hover:bg-[#E64A19] font-medium text-center">Buy Now</Link>
                        <button onClick={handleMessageSeller} className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-400">Message Seller</button>
                      </>
                    ) : (
                      <button disabled className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed">Item Sold</button>
                    )}
                    <button onClick={handleToggleFavorite} disabled={favoriteLoading} className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-400 disabled:opacity-60">
                      {favoriteLoading ? 'Saving...' : isFavorited ? '★ Saved to Favorites' : '☆ Add to Favorites'}
                    </button>
                  </>
                ) : user ? (
                  <div className="space-y-3">
                    <Link href={`/${locale}/listings/${listing.id}/edit`} className="block w-full text-sm py-2 px-4 rounded-lg border border-gray-300 text-gray-700 text-center">Modify Listing</Link>
                    <DeleteListingButton listingId={listing.id} title={listing.title} redirectTo={`/${locale}`} className="w-full text-sm py-2 px-4 rounded-lg border border-red-300 text-red-700" />
                  </div>
                ) : (
                  <Link href={`/${locale}/auth/login`} className="block w-full bg-[#FF5722] text-white py-3 px-4 rounded-lg hover:bg-[#E64A19] font-medium text-center">Sign in to Buy</Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Product Details</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Category', value: listing.category?.name },
              { label: 'Brand', value: listing.brand },
              { label: 'Color', value: listing.color },
              { label: 'Size', value: listing.size },
              { label: 'Condition', value: listing.condition ? conditionLabels[listing.condition] : null },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                  <p className="font-semibold text-gray-900 text-sm truncate">{item.value}</p>
                </div>
              ))}
          </div>

          {listing.description && (
            <div className="mt-6 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                {listing.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
