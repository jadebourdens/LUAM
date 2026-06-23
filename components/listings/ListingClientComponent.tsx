'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import DeleteListingButton from '@/components/delete-listing-button'
import ShareToThreadsButton from '@/components/listings/ShareToThreadsButton'

// ---------- Types ----------

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

type ListingClientComponentProps = {
  listing: ListingData
  locale: string
  currentUserId?: string
  initialIsFavorited?: boolean
}

// ---------- Constants & Helpers ----------

const CONDITION_LABELS: Record<string, string> = {
  new: 'New with tags',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
  worn: 'Worn',
}

function formatPrice(listing: ListingData | RelatedListing): string {
  if (listing.currency === 'USD') return `$${listing.price_usd ?? ''}`
  if (listing.currency === 'VND') return `${listing.price_vnd?.toLocaleString()} ₫`
  return ''
}

// ---------- ListingClientComponent ----------

export default function ListingClientComponent({
  listing,
  locale,
  currentUserId,
  initialIsFavorited = false,
}: ListingClientComponentProps) {
  const router = useRouter()
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null)

  const isSold = listing.status === 'sold'
  const isSeller = !!currentUserId && listing.seller_id === currentUserId

  const specRows = [
    { label: 'Category', value: listing.category?.name },
    { label: 'Brand', value: listing.brand },
    { label: 'Color', value: listing.color },
    { label: 'Size', value: listing.size },
    { label: 'Condition', value: listing.condition ? CONDITION_LABELS[listing.condition] : undefined },
  ].filter((row) => row.value)

  // ---------- Action Handlers ----------

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
    if (!listing?.id || !currentUserId) return
    setFavoriteLoading(true)
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsFavorited(!!data.favorited)
      }
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleReportListing = async () => {
    if (!currentUserId || !listing?.id) return
    setReportLoading(true)
    try {
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
      setSafetyNotice(res.ok ? 'Report submitted.' : data.error || 'Failed to submit report')
    } finally {
      setReportLoading(false)
    }
  }

  const handleBlockSeller = async () => {
    if (!currentUserId || !listing?.seller_id) return
    setBlockLoading(true)
    try {
      const res = await fetch('/api/blocks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: listing.seller_id }),
      })
      const data = await res.json()
      setSafetyNotice(res.ok ? 'Seller blocked.' : data.error || 'Failed to block seller')
    } finally {
      setBlockLoading(false)
    }
  }

  // ---------- JSX: Action Buttons ----------

  const ActionButtons = () => (
    <div className="pt-2 space-y-2">
      {isSeller ? (
        <div className="flex gap-2">
          <Link
            href={`/${locale}/listings/${listing.id}/edit`}
            className="flex-1 py-2 text-center rounded border text-sm"
          >
            Modify
          </Link>
          <DeleteListingButton
            listingId={listing.id}
            title={listing.title}
            redirectTo={`/${locale}/dashboard`}
            className="flex-1 py-2 text-center border border-red-200 text-red-600 text-sm"
          />
        </div>
      ) : currentUserId ? (
        <>
          {!isSold && (
            <div className="flex gap-2">
              <Link
                href={`/${locale}/checkout/${listing.id}`}
                className="flex-1 bg-[#FF5722] text-white py-3 rounded-lg font-bold text-sm text-center"
              >
                Buy Now
              </Link>
              <button
                onClick={handleMessageSeller}
                className="flex-1 border border-[#FF5722] text-[#FF5722] py-3 rounded-lg font-bold text-sm"
              >
                Message
              </button>
            </div>
          )}
          <button
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className="w-full py-2.5 rounded-lg border text-sm"
          >
            {isFavorited ? '★ Saved' : '☆ Save'}
          </button>
        </>
      ) : (
        <Link
          href={`/${locale}/auth/login`}
          className="block w-full text-center bg-[#FF5722] text-white py-3 rounded-lg font-bold text-sm"
        >
          Sign in to Buy
        </Link>
      )}
      {/* Share to Threads — visible to everyone */}
      <ShareToThreadsButton listing={listing} locale={locale} />

      {/* Safety notice */}
      {safetyNotice && <p className="text-xs text-gray-500 text-center">{safetyNotice}</p>}
    </div>
  )

  // ---------- JSX: Render ----------

  return (
    <>
      {/* Mobile: Show action buttons in left column */}
      <div className="lg:hidden space-y-3">
        <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
        <p className="text-3xl font-bold text-[#FF5722]">{formatPrice(listing)}</p>
        {isSold && (
          <div className="bg-red-50 text-red-700 px-3 py-1 rounded text-xs font-bold w-fit">
            Item sold
          </div>
        )}
        <div className="py-2 border-y border-gray-100 text-sm space-y-1.5">
          {specRows.map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600">{listing.description}</p>
        <ActionButtons />
      </div>

      {/* Desktop: Right sidebar */}
      <div className="hidden lg:block sticky top-6 space-y-3">
        <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
        <p className="text-3xl font-bold text-[#FF5722]">{formatPrice(listing)}</p>
        {isSold && (
          <div className="bg-red-50 text-red-700 px-3 py-1 rounded text-xs font-bold w-fit">
            Item sold
          </div>
        )}

        <div className="py-2 border-y border-gray-100 text-sm space-y-1.5">
          {specRows.map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-600">{listing.description}</p>

        <ActionButtons />
      </div>
    </>
  )
}
