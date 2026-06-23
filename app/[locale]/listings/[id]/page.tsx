'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import DeleteListingButton from '@/components/delete-listing-button'
import PhotoGallery from '@/components/listings/PhotoGallery'

// ---------- Constants & Helpers ----------

const CONDITION_LABELS: Record<string, string> = {
  new: 'New with tags',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
  worn: 'Worn',
}

type ListingData = {
  id: string
  title: string
  description?: string
  currency: 'USD' | 'VND'
  price_usd?: number
  price_vnd?: number
  brand?: string
  color?: string
  size?: string
  condition?: string
  status?: string
  seller_id?: string
  seller?: {
    id: string
    username?: string
    full_name?: string
    brand_name?: string
    avatar_url?: string
    rating_average?: number
    rating_count?: number
    location?: string
  }
  category?: { name: string; slug: string }
  images?: { image_url: string; position: number }[]
}

type RelatedListing = {
  id: string
  title: string
  price_usd?: number
  price_vnd?: number
  currency: 'USD' | 'VND'
  images?: { image_url: string; position: number }[]
}

function formatPrice(listing: ListingData | RelatedListing): string {
  if (listing.currency === 'USD') return `$${listing.price_usd ?? ''}`
  if (listing.currency === 'VND') return `${listing.price_vnd?.toLocaleString()} ₫`
  return ''
}

function getCoverImage(images?: { image_url: string; position: number }[]) {
  if (!images || images.length === 0) return null
  return [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0].image_url
}

// ---------- Share to Threads Button ----------
function ShareToThreadsButton({ listing, locale }: { listing: ListingData; locale: string }) {
  const handleShare = () => {
    const listingUrl = `https://luam.shop/${locale}/listings/${listing.id}`
    const price = formatPrice(listing)
    const text = `${listing.title} — ${price}\n\nTìm thấy trên Luam 🛍️ hàng Việt Nam chính hãng\n${listingUrl}`
    const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`
    window.open(threadsUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleShare}
      className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
    >
      {/* Threads icon */}
      <svg width="16" height="16" viewBox="0 0 192 192" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.372-39.134 15.265-38.105 34.569.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.205 17.11 97.014 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.637 32.788 28.054 19.882 44.42 13.224 67.408 13.001 96v.065c.223 28.592 6.88 51.58 19.787 67.946 14.504 18.417 36.094 27.86 64.199 28.054h.113c24.761-.173 42.219-6.708 56.576-21.083 18.837-18.81 18.291-42.
443 12.095-56.939-4.308-10.039-12.636-18.219-24.234-23.055Zm-42.161 30.66c-10.429.586-21.256-4.098-21.794-14.135-.396-7.442 5.277-15.745 22.303-16.724 1.951-.112 3.868-.168 5.755-.168 6.089 0 11.79.589 16.998 1.731-1.933 24.116-12.436 28.713-23.262 29.296Z"/>
      </svg>
      Share on Threads
    </button>
  )
}

// ---------- Related Listings Grid ----------
function RelatedGrid({ listings, locale }: { listings: RelatedListing[]; locale: string }) {
  if (listings.length === 0) return null
  return (
    <div className="grid grid-cols-3 gap-2">
      {listings.map((item) => {
        const cover = getCoverImage(item.images)
        return (
          <Link key={item.id} href={`/${locale}/listings/${item.id}`} className="group block">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {cover ? (
                <Image
                  src={cover}
                  alt={item.title}
                  fill
                  sizes="20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No photo</div>
              )}
            </div>
            <p className="mt-1 text-xs font-semibold truncate">{formatPrice(item)}</p>
          </Link>
        )
      })}
    </div>
  )
}

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
  const [moreBoutique, setMoreBoutique] = useState<RelatedListing[]>([])
  const [similarListings, setSimilarListings] = useState<RelatedListing[]>([])

  useEffect(() => {
    if (!id) return
    const fetchListing = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        const { data: fav } = await supabase.from('favorites').select('id').eq('user_id', currentUser.id).eq('listing_id', id).maybeSingle()
        setIsFavorited(!!fav)
      }

      const { data, error } = await supabase
        .from('listings')
        .select(`*, seller:profiles(id, username, full_name, avatar_url, rating_average, rating_count, location), category:categories(name, slug), images:listing_images(image_url, position)`)
        .eq('id', id)
        .single()

      if (error) { setError(error.message); setLoading(false); return }
      setListing(data)
      setLoading(false)

      if (data?.seller_id) {
        const { data: boutique } = await supabase
          .from('listings')
          .select('id, title, price_usd, price_vnd, currency, images:listing_images(image_url, position)')
          .eq('seller_id', data.seller_id)
          .eq('status', 'active')
          .neq('id', id)
          .limit(6)
        setMoreBoutique(boutique ?? [])
      }

      if (data?.category?.slug) {
        const { data: similar } = await supabase
          .from('listings')
          .select('id, title, price_usd, price_vnd, currency, images:listing_images(image_url, position)')
          .eq('status', 'active')
          .neq('id', id)
          .neq('seller_id', data.seller_id)
          .limit(6)
        setSimilarListings(similar ?? [])
      }
    }
    fetchListing()
  }, [id])

  // ---------- Action Handlers ----------
  const handleMessageSeller = async () => {
    if (!listing?.id) return
    const res = await fetch('/api/messages/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: listing.id }) })
    const data = await res.json()
    if (res.ok && data.conversationId) router.push(`/${locale}/messages?conversation=${data.conversationId}`)
    else alert(data.error || 'Failed to start conversation')
  }

  const handleToggleFavorite = async () => {
    if (!listing?.id || !user) return
    setFavoriteLoading(true)
    const res = await fetch('/api/favorites/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: listing.id }) })
    if (res.ok) {
      const data = await res.json()
      setIsFavorited(!!data.favorited)
    }
    setFavoriteLoading(false)
  }

  const handleReportListing = async () => {
    if (!user || !listing?.id) return
    setReportLoading(true)
    const res = await fetch('/api/reports/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: listing.id, reportedUserId: listing.seller_id, reason: 'suspicious_listing', details: 'User reported from listing detail page' }) })
    const data = await res.json()
    setSafetyNotice(res.ok ? 'Report submitted.' : (data.error || 'Failed to submit report'))
    setReportLoading(false)
  }

  const handleBlockSeller = async () => {
    if (!user || !listing?.seller_id) return
    setBlockLoading(true)
    const res = await fetch('/api/blocks/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blockedUserId: listing.seller_id }) })
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
    { label: 'Brand', value: listing.brand },
    { label: 'Color', value: listing.color },
    { label: 'Size', value: listing.size },
    { label: 'Condition', value: listing.condition ? CONDITION_LABELS[listing.condition] : undefined },
  ].filter((row) => row.value)

  // Shared action buttons — rendered in both mobile and desktop columns
  const ActionButtons = () => (
    <div className="pt-2 space-y-2">
      {isSeller ? (
        <div className="flex gap-2">
          <Link href={`/${locale}/listings/${listing.id}/edit`} className="flex-1 py-2 text-center rounded border text-sm">Modify</Link>
          <DeleteListingButton listingId={listing.id} title={listing.title} redirectTo={`/${locale}/dashboard`} className="flex-1 py-2 text-center border border-red-200 text-red-600 text-sm" />
        </div>
      ) : user ? (
        <>
          {!isSold && <button onClick={handleMessageSeller} className="w-full bg-[#FF5722] text-white py-3 rounded-lg font-bold text-sm">Buy Now / Message</button>}
          <button onClick={handleToggleFavorite} disabled={favoriteLoading} className="w-full py-2.5 rounded-lg border text-sm">{isFavorited ? '★ Saved' : '☆ Save'}</button>
        </>
      ) : (
        <Link href={`/${locale}/auth/login`} className="block w-full text-center bg-[#FF5722] text-white py-3 rounded-lg font-bold text-sm">Sign in to Buy</Link>
      )}
      {/* Share to Threads — visible to everyone */}
      <ShareToThreadsButton listing={listing} locale={locale} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href={`/${locale}`} className="text-sm text-gray-500 mb-4 block hover:underline">← Back</Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">

          {/* Left Column: Photos + Seller + Related */}
          <div className="space-y-6">
            <PhotoGallery images={listing.images ?? []} title={listing.title} isSold={isSold} />

            {/* Buy block visible only on mobile */}
            <div className="lg:hidden space-y-3">
              <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
              <p className="text-3xl font-bold text-[#FF5722]">{formatPrice(listing)}</p>
              {isSold && <div className="bg-red-50 text-red-700 px-3 py-1 rounded text-xs font-bold w-fit">Item sold</div>}
              <div className="py-2 border-y border-gray-100 text-sm space-y-1.5">
                {specRows.map(row => (
                  <div key={row.label} className="flex justify-between"><span className="text-gray-500">{row.label}</span><span className="font-medium">{row.value}</span></div>
                ))}
              </div>
              <p className="text-sm text-gray-600">{listing.description}</p>
              <ActionButtons />
            </div>

            {/* Seller Block */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-bold mb-3">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                  {listing.seller?.avatar_url ? <Image src={listing.seller.avatar_url} width={40} height={40} alt="" className="object-cover" /> : <span className="text-xs">U</span>}
                </div>
                <Link href={`/${locale}/sellers/${listing.seller?.username}`} className="font-semibold text-sm hover:underline">{listing.seller?.full_name ?? 'Anonymous'}</Link>
              </div>
            </div>

            {/* More from this boutique */}
            {moreBoutique.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">More from this boutique</h3>
                  <Link href={`/${locale}/sellers/${listing.seller?.username}`} className="font-semibold text-sm hover:underline">
                    {listing.seller?.brand_name || (listing.seller?.full_name ?? 'Anonymous')}
                  </Link>
                </div>
                <RelatedGrid listings={moreBoutique} locale={locale} />
              </div>
            )}

            {/* Similar listings */}
            {similarListings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Similar listings</h3>
                  {listing.category?.slug && (
                    <Link href={`/${locale}/category/${listing.category.slug}`} className="text-xs text-[#FF5722] hover:underline">See all</Link>
                  )}
                </div>
                <RelatedGrid listings={similarListings} locale={locale} />
              </div>
            )}

            {/* Safety notice */}
            {safetyNotice && <p className="text-xs text-gray-500 text-center">{safetyNotice}</p>}
          </div>

          {/* Right Column: Info & Buttons (desktop) */}
          <div className="hidden lg:block sticky top-6 space-y-3">
            <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
            <p className="text-3xl font-bold text-[#FF5722]">{formatPrice(listing)}</p>
            {isSold && <div className="bg-red-50 text-red-700 px-3 py-1 rounded text-xs font-bold w-fit">Item sold</div>}

            <div className="py-2 border-y border-gray-100 text-sm space-y-1.5">
              {specRows.map(row => (
                <div key={row.label} className="flex justify-between"><span className="text-gray-500">{row.label}</span><span className="font-medium">{row.value}</span></div>
              ))}
            </div>

            <p className="text-sm text-gray-600">{listing.description}</p>

            <ActionButtons />
          </div>
        </div>
      </div>
    </div>
  )
}