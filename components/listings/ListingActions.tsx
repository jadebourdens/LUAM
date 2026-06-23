'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import DeleteListingButton from '@/components/delete-listing-button'
import ShareToThreadsButton from '@/components/listings/ShareToThreadsButton'
import ToggleSoldButton from '@/components/listings/ToggleSoldButton'

export default function ListingActions({ listing, locale }: { listing: any; locale: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null)

  const isSold = listing.status === 'sold'
  const isSeller = !!user && listing.seller_id === user.id

  // Load the logged-in user — without this, seller buttons never appear
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) setUser({ id: data.user.id })
    }
    getUser()
  }, [])

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

  return (
    <div className="pt-2 space-y-2">
      {isSeller ? (
        <>
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
          {/* Seller-only: flip between sold and available */}
          <ToggleSoldButton listingId={listing.id} currentStatus={listing.status} />
        </>
      ) : user ? (
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

      {/* Visible to everyone */}
      <ShareToThreadsButton listing={listing} locale={locale} />

      {safetyNotice && <p className="text-xs text-gray-500 text-center">{safetyNotice}</p>}
    </div>
  )
}