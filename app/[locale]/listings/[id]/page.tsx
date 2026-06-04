'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import DeleteListingButton from '@/components/delete-listing-button'
import PhotoGallery from '@/components/listings/PhotoGallery'

// ---------- constants (outside component so they don't recreate on render) ----------

const CONDITION_LABELS: Record<string, string> = {
  new: 'New with tags',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
  worn: 'Worn',
}

function formatPrice(listing: ListingData): string {
  if (listing.currency === 'EUR') return `€${listing.price_eur ?? ''}`
  if (listing.currency === 'USD') return `$${listing.price_usd ?? ''}`
  if (listing.currency === 'VND') return `${listing.price_vnd?.toLocaleString()} ₫`
  return ''
}

// ---------- types ----------

type ListingData = {
  id: string
  title: string
  description?: string
  currency: 'USD' | 'VND' | 'EUR'
  price_usd?: number
  price_vnd?: number
  price_eur?: number
  brand?: string
  color?: string
  size?: string
  condition?: string
  status?: string
  seller_id?: string
  category_id?: string
  seller?: {
    id: string
    username?: string
    full_name?: string
    avatar_url?: string
    rating_average?: number
    rating_count?: number
    location?: string
  }
  category?: { name: string; slug: string }
  images?: { image_url: string; position: number }[]
}

// ---------- component ----------

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const locale = (params?.locale as string) ?? 'en'

  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null)
  const [relatedListings, setRelatedListings] = useState<ListingData[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)

  useEffect(() => {
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
      } else {
        setListing(data)
        // Fetch related listings (same seller or same category)
        fetchRelatedListings(data)
      }
      setLoading(false)
    }

    fetchListing()
  }, [id])

  const fetchRelatedListings = async (current: ListingData) => {
    setRelatedLoading(true)
    const supabase = createClient()
    
    // Fetch products from same seller (excluding current)
    const { data: sellerListings } = await supabase
      .from('listings')
      .select(`
        *,
        seller:profiles(id, username, full_name, avatar_url, rating_average, rating_count, location),
        category:categories(name, slug),
        images:listing_images(image_url, position)
      `)
      .eq('seller_id', current.seller_id)
      .neq('id', current.id)
      .in('status', ['active', 'sold'])
      .limit(6)
    
    setRelatedListings(sellerListings ?? [])
    setRelatedLoading(false)
  }

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
    setReportLoading(true)
    const res = await fetch('/api/reports/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId: listing.id,
        reportedUserId: listing.seller_id,
        reason: 'suspicious_listing',
        details: 'User reported from listing detail page',
      }),
    })
    const data = await res.json()
    setSafetyNotice(res.ok ? 'Report submitted.' : (data.error || 'Failed to submit report'))
    setReportLoading(false)
  }

  const handleBlockSeller = async () => {
    if (!user || !listing?.seller_id) return
    setBlockLoading(true)
    const res = await fetch('/api/blocks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedUserId: listing.seller_id }),
    })
    const data = await res.json()
    setSafetyNotice(res.ok ? 'Seller blocked.' : (data.error || 'Failed to block seller'))
    setBlockLoading(false)
  }

  if (loading) return <div className="p-12 text-center">Loading...</div>
  if (error || !listing) return <div className="p-12 text-center">Listing not found.</div>

  const isSeller = !!user && listing.seller_id === user.id
  const isSold = listing.status === 'sold'

  const specRows = [
    { label: 'Category', value: listing.category?.name },
    { label: 'Brand',    value: listing.brand },
    { label: 'Color',    value: listing.color },
    { label: 'Size',     value: listing.size },
    { label: 'Condition', value: listing.condition ? CONDITION_LABELS[listing.condition] : undefined },
  ].filter((row) => row.value)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-6">
          <Link href={`/${locale}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Photo Gallery ── */}
          <div className="lg:col-span-2">
            <PhotoGallery images={listing.images ?? []} title={listing.title} isSold={isSold} />
          </div>

          {/* ── Details sidebar (compact spacing) ── */}
          <div className="flex flex-col gap-2 h-full">

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>

            {/* Price */}
            <div className="pb-2 border-b border-gray-200">
              <p className="text-2xl font-bold text-[#FF5722]">{formatPrice(listing)}</p>
              {isSold && (
                <div className="mt-1 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium">
                  This item has been sold.
                </div>
              )}
            </div>

            {/* Specs */}
            {specRows.length > 0 && (
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {specRows.map((row, i) => (
                      <tr key={row.label} className={i < specRows.length - 1 ? 'border-b border-gray-200' : ''}>
                        <td className="py-1 text-gray-600 font-medium">{row.label}</td>
                        <td className="py-1 text-gray-900 text-right">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="space-y-0.5 py-2 border-y border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line line-clamp-3">{listing.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              {isSeller ? (
                <>
                  <Link
                    href={`/${locale}/listings/${listing.id}/edit`}
                    className="block w-full text-sm py-2 px-4 rounded-lg border border-gray-300 text-gray-700 text-center hover:bg-gray-50"
                  >
                    Modify Listing
                  </Link>
                  <DeleteListingButton
                    listingId={listing.id}
                    title={listing.title}
                    redirectTo={`/${locale}`}
                    className="w-full text-sm py-2 px-4 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                  />
                </>
              ) : user ? (
                isSold ? (
                  <button disabled className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg font-semibold text-sm cursor-not-allowed">
                    Item Sold
                  </button>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/checkout/${listing.id}`}
                      className="block w-full bg-[#FF5722] text-white py-2 px-4 rounded-lg hover:bg-[#E64A19] font-semibold text-center text-sm"
                    >
                      Buy Now
                    </Link>
                    <button onClick={handleMessageSeller} className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
                      Message Seller
                    </button>
                    <button
                      onClick={handleToggleFavorite}
                      disabled={favoriteLoading}
                      className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
                    >
                      {favoriteLoading ? 'Saving...' : isFavorited ? '★ Saved' : '☆ Save'}
                    </button>
                  </>
                )
              ) : (
                <Link
                  href={`/${locale}/auth/login`}
                  className="block w-full bg-[#FF5722] text-white py-2 px-4 rounded-lg hover:bg-[#E64A19] font-semibold text-center text-sm"
                >
                  Sign in to Buy
                </Link>
              )}
            </div>

            {/* Safety */}
            {!isSeller && user && (
              <div className="space-y-1.5 text-xs">
                {safetyNotice && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg">
                    {safetyNotice}
                  </div>
                )}
                <button
                  onClick={handleReportListing}
                  disabled={reportLoading}
                  className="w-full py-2 px-4 text-gray-600 hover:text-gray-900 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                >
                  {reportLoading ? 'Loading...' : '⚠️ Report Listing'}
                </button>
                <button
                  onClick={handleBlockSeller}
                  disabled={blockLoading}
                  className="w-full py-2 px-4 text-gray-600 hover:text-gray-900 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                >
                  {blockLoading ? 'Loading...' : '🚫 Block Seller'}
                </button>
              </div>
            )}

            {/* Seller Info (at bottom) */}
            {listing.seller && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-1.5 mt-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller</h3>
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 shrink-0 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
                    {listing.seller?.avatar_url ? (
                      <Image src={listing.seller.avatar_url} alt="" width={40} height={40} className="object-cover rounded-full" />
                    ) : (
                      <span className="text-sm text-gray-600">{listing.seller?.full_name?.[0] ?? 'U'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/${locale}/users/${listing.seller?.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-[#FF5722] block truncate"
                    >
                      {listing.seller?.full_name ?? 'Anonymous'}
                    </Link>
                    {listing.seller?.location && (
                      <p className="text-xs text-gray-500 truncate">{listing.seller.location}</p>
                    )}
                    {(listing.seller?.rating_count ?? 0) > 0 && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        ⭐ {listing.seller!.rating_average!.toFixed(1)} ({listing.seller!.rating_count} reviews)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedListings.length > 0 && (
          <div className="mt-12 border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              More from {listing.seller?.full_name ?? 'this seller'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedListings.map((item) => {
                const firstImage = [...(item.images ?? [])]
                  .sort((a, b) => a.position - b.position)[0]?.image_url
                const price = item.currency === 'EUR'
                  ? `€${item.price_eur}`
                  : item.currency === 'USD'
                  ? `$${item.price_usd}`
                  : `${item.price_vnd?.toLocaleString()} ₫`
                return (
                  <Link key={item.id} href={`/${locale}/listings/${item.id}`} className="group">
                    <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                      {firstImage ? (
                        <>
                          <Image
                            src={firstImage}
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {item.status === 'sold' && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">SOLD</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1">
                        <span className="bg-white/90 text-[#FF5722] text-xs font-bold px-2 py-1 rounded shadow-sm">{price}</span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                    {item.brand && <p className="text-xs text-gray-500 truncate">{item.brand}</p>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
