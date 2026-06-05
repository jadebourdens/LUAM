'use client'

// components/sellers/seller-listing-card.tsx

import Link from 'next/link'
import Image from 'next/image'
import { Listing } from '@/types/database'
import { Heart } from 'lucide-react'

interface Props {
  listing: Listing
  locale: string
  viewMode: 'grid' | 'list'
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
  worn: 'Worn',
}

const CONDITION_COLORS: Record<string, string> = {
  new: 'bg-emerald-50 text-emerald-700',
  like_new: 'bg-blue-50 text-blue-700',
  good: 'bg-amber-50 text-amber-700',
  fair: 'bg-orange-50 text-orange-700',
  worn: 'bg-red-50 text-red-700',
}

function formatPrice(listing: Listing): string {
  const { currency, price_eur, price_usd, price_vnd } = listing
  if (currency === 'EUR' && price_eur != null)
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price_eur)
  if (currency === 'USD' && price_usd != null)
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price_usd)
  if (currency === 'VND' && price_vnd != null)
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price_vnd)
  return '—'
}

export default function SellerListingCard({ listing, locale, viewMode }: Props) {
  const coverImage = listing.images?.[0]?.image_url
  const price = formatPrice(listing)
  const safeLocale = locale || 'en' // fallback to prevent // path

  if (viewMode === 'list') {
    return (
      <Link
        href={`/${safeLocale}/listings/${listing.id}`}
        className="flex items-center gap-4 bg-white rounded-2xl p-3 border border-stone-100 hover:border-stone-300 hover:shadow-sm transition-all group"
      >
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-stone-100">
          {coverImage ? (
            <Image src={coverImage} alt={listing.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300 text-2xl">📦</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900 truncate">{listing.title}</p>
          {listing.condition && (
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${CONDITION_COLORS[listing.condition]}`}>
              {CONDITION_LABELS[listing.condition]}
            </span>
          )}
          {listing.size && <p className=\"text-xs text-stone-400 mt-1\">Size: {listing.size}</p>}
        </div>
        <div className="shrink-0 font-bold text-stone-900">{price}</div>
      </Link>
    )
  }

  // Grid mode
  return (
    <Link
      href={`/${safeLocale}/listings/${listing.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-300 hover:shadow-md transition-all duration-200"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-4xl">📦</div>
        )}
        
        {/* Condition Tag */}
        {listing.condition && (
          <div className="absolute top-2 left-2 z-10">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
              {CONDITION_LABELS[listing.condition]}
            </span>
          </div>
        )}

        {/* Heart Icon - Change button to div with stopPropagation to fix Link nesting */}
        <div 
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Toggle favorite logic
          }}
          className="absolute top-2 right-2 z-20 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer"
        >
          <Heart className="w-3.5 h-3.5 text-stone-600" />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-stone-800 truncate leading-snug">{listing.title}</p>
        {listing.size && (
          <p className="text-xs text-stone-400 mt-0.5">Size {listing.size}</p>
        )}
        <p className="text-sm font-bold text-stone-900 mt-2">{price}</p>
      </div>
    </Link>
  )
}
