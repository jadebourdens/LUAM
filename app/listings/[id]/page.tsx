'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import DeleteListingButton from '@/components/delete-listing-button'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [safetyLoading, setSafetyLoading] = useState(false)
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      const supabase = createClient()
      console.log('[ListingDetail] fetch start', { id })

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('[ListingDetail] current user', { userId: currentUser?.id ?? null })
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

      // Fetch listing
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

      console.log('[ListingDetail] supabase response', {
        hasData: !!data,
        errorCode: error?.code ?? null,
        errorMessage: error?.message ?? null,
        listingId: data?.id ?? null,
      })

      if (error) {
        console.error('Fetch error:', error)
        setError(error.message)
        if (error.code === 'PGRST116') {
          // Data not found
          router.replace('/?error=listing-not-found')
        }
        setLoading(false)
        return
      }

      setListing(data)
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: 'listing_view', listingId: data.id }),
      })
      setLoading(false)
    }

    if (id) {
      fetchListing()
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5722] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Oops!</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/" className="text-[#FF5722] hover:text-[#E64A19]">
              ← Back to listings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Listing not found</p>
          <Link href="/" className="text-[#FF5722] hover:text-[#E64A19]">
            ← Back to listings
          </Link>
        </div>
      </div>
    )
  }

  // Format price
  const formatPrice = () => {
    if (listing.currency === 'EUR') return `€${listing.price_eur}`
    if (listing.currency === 'USD') return `$${listing.price_usd}`
    if (listing.currency === 'VND') return `${listing.price_vnd?.toLocaleString()} ₫`
    return ''
  }

  const conditionLabels: Record<string, string> = {
    new: 'New with tags',
    like_new: 'Like new',
    good: 'Good',
    fair: 'Fair',
    worn: 'Worn'
  }

  const isSeller = user && listing.seller_id === user.id

  const sortedImages = [...(listing.images || [])].sort(
    (a: { position?: number }, b: { position?: number }) => (a.position ?? 0) - (b.position ?? 0)
  )

  const handleMessageSeller = async () => {
    if (!listing?.id) return
    const res = await fetch('/api/messages/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id }),
    })

    const data = await res.json().catch(() => ({ error: 'Failed to parse response' }))
    if (!res.ok) {
      console.error('[ListingDetail] start conversation failed', { status: res.status, data })
      alert(data.error || 'Failed to start conversation. Please try again.')
      return
    }

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'message_seller', listingId: listing.id, metadata: { conversationId: data.conversationId } }),
    })

    router.push(`/messages?conversation=${data.conversationId}`)
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
    setSafetyNotice(res.ok ? 'Report submitted. Thank you.' : (data.error || 'Failed to submit report'))
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Images */}
          <div className="space-y-4 min-w-0">
            <div className="relative aspect-square w-full bg-gray-200 rounded-lg overflow-hidden">
              {sortedImages.length > 0 ? (
                <Image
                  src={sortedImages[0].image_url}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {sortedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {sortedImages.map((image: { image_url: string; position?: number }, index: number) => (
                  <div
                    key={`${image.image_url}-${index}`}
                    className="relative aspect-square bg-gray-200 rounded overflow-hidden cursor-pointer hover:opacity-80"
                  >
                    <Image
                      src={image.image_url}
                      alt={`${listing.title} - Image ${index + 1}`}
                      fill
                      sizes="(max-width: 1024px) 25vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Details */}
          <div className="space-y-6 min-w-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <p className="text-lg font-semibold text-[#FF5722] mb-2">{formatPrice()}</p>

              {/* Seller Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative w-12 h-12 shrink-0 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
                  {listing.seller?.avatar_url ? (
                    <Image
                      src={listing.seller.avatar_url}
                      alt={listing.seller.full_name || listing.seller.username}
                      width={48}
                      height={48}
                      className="object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-gray-600 text-xl">
                      {listing.seller?.full_name?.[0] || listing.seller?.username?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <Link href={`/users/${listing.seller?.id}`} className="font-medium text-gray-900 hover:text-[#FF5722]">
                    {listing.seller?.full_name || listing.seller?.username || 'Anonymous'}
                  </Link>
                  <p className="text-sm text-gray-500">{listing.seller?.location}</p>
                  {listing.seller?.rating_average > 0 && (
                    <p className="text-sm text-yellow-600">
                      ⭐ {listing.seller.rating_average}/5 ({listing.seller.rating_count} reviews)
                    </p>
                  )}
                </div>
              </div>

              {/* Category and Condition */}
              <div className="flex flex-wrap gap-4 mb-6">
                {listing.category?.name && (
                  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {listing.category.name}
                  </span>
                )}
                <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {conditionLabels[listing.condition] || listing.condition}
                </span>
                {listing.brand && (
                  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">{listing.brand}</span>
                )}
                {listing.size && (
                  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">Size: {listing.size}</span>
                )}
                {listing.color && (
                  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">{listing.color}</span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {listing.description || 'No description provided.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isSeller && user ? (
                  <>
                    <Link
                      href={`/checkout/${listing.id}`}
                      className="block w-full bg-[#FF5722] text-white py-3 px-4 rounded-lg hover:bg-[#E64A19] font-medium text-center"
                    >
                      Buy Now
                    </Link>
                    <button
                      onClick={handleMessageSeller}
                      className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-400"
                    >
                      Message Seller
                    </button>
                    <button
                      onClick={handleToggleFavorite}
                      disabled={favoriteLoading}
                      className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-400 disabled:opacity-60"
                    >
                      {favoriteLoading ? 'Saving...' : isFavorited ? '★ Saved to Favorites' : '☆ Add to Favorites'}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleReportListing}
                        disabled={safetyLoading}
                        className="py-2 px-3 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm disabled:opacity-60"
                      >
                        Report Listing
                      </button>
                      <button
                        onClick={handleBlockSeller}
                        disabled={safetyLoading}
                        className="py-2 px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
                      >
                        Block Seller
                      </button>
                    </div>
                    {safetyNotice && <p className="text-xs text-gray-600">{safetyNotice}</p>}
                  </>
                ) : user ? (
                  <div className="space-y-3">
                    <p className="text-gray-500 text-center text-sm">
                      This is your listing.
                      {listing.status === 'deleted'
                        ? ' It is hidden from buyers.'
                        : ' Remove it to hide it from the marketplace.'}
                    </p>
                    {listing.status !== 'deleted' && (
                      <DeleteListingButton
                        listingId={listing.id}
                        title={listing.title}
                        redirectTo="/profile"
                        className="w-full text-sm py-2 px-4 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      />
                    )}
                  </div>
                ) : (
                  <Link href="/auth/login" className="block w-full bg-[#FF5722] text-white py-3 px-4 rounded-lg hover:bg-[#E64A19] font-medium text-center">
                    Sign in to Buy
                  </Link>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}