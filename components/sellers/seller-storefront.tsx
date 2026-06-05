'use client'

// components/sellers/seller-storefront.tsx

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Profile, Listing, Category, Review } from '@/types/database'
import { Star, MapPin, Package, ChevronRight, Home, Grid3X3, List } from 'lucide-react'
import SellerListingCard from './seller-listing-card'
import SellerReviewCard from './seller-review-card'

interface Props {
  seller: Profile
  listings: Listing[]
  reviews: Review[]
  categories: Category[]
  locale: string
}

export default function SellerStorefront({ seller, listings, reviews, categories, locale }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredListings = activeCategory
    ? listings.filter((l) => l.category_id === activeCategory)
    : listings

  const displayName = seller.brand_name || seller.full_name || seller.username || 'Seller'
  const joinYear = new Date(seller.created_at).getFullYear()

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* ── Breadcrumb ── */}
      <nav className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-2 text-sm text-stone-500">
            <li>
              <Link href={`/${locale}`} className="hover:text-stone-900 flex items-center gap-1 transition-colors">
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
            </li>
            <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
            <li>
              <Link href={`/${locale}/sellers`} className="hover:text-stone-900 transition-colors">
                Sellers
              </Link>
            </li>
            <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
            <li className="font-semibold text-stone-900 uppercase tracking-wide text-xs">
              {displayName}
            </li>
          </ol>
        </div>
      </nav>

      {/* ── Seller Hero Banner ── */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 ring-2 ring-stone-200">
                {seller.avatar_url ? (
                  <Image
                    src={seller.avatar_url}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-stone-400">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-stone-400 mb-1">
                Independent Seller
              </p>
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">
                {displayName.toUpperCase()}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 mb-3">
                {seller.rating_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-stone-800">{seller.rating_average.toFixed(1)}</span>
                    <span>({seller.rating_count} reviews)</span>
                  </span>
                )}
                {seller.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {seller.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {listings.length} listing{listings.length !== 1 ? 's' : ''}
                </span>
                <span className="text-stone-400">Member since {joinYear}</span>
              </div>

              {seller.bio && (
                <p className="text-stone-600 text-sm max-w-xl leading-relaxed">
                  {seller.bio}
                </p>
              )}
            </div>

            {/* Contact CTA */}
            <div className="shrink-0">
              <Link
                href={`/${locale}/messages`}
                className="inline-flex items-center gap-2 bg-stone-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-stone-700 transition-colors"
              >
                Contact seller
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Filter Chips (like La Redoute's scroll row) ── */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-stone-100 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  activeCategory === null
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                All items
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === null ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  {listings.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = listings.filter((l) => l.category_id === cat.id).length
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {cat.name}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Listings Grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-stone-500 text-sm">
            <span className="font-semibold text-stone-900">{filteredListings.length}</span> items
          </p>
          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No items yet</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'flex flex-col gap-3'
          }>
            {filteredListings.map((listing) => (
              <SellerListingCard
                key={listing.id}
                listing={listing}
                locale={locale}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* ── Reviews Section ── */}
        {reviews.length > 0 && (
          <section className="mt-16 pt-8 border-t border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-900">
                Reviews
                <span className="ml-2 text-sm font-normal text-stone-400">
                  ({seller.rating_count})
                </span>
              </h2>
              {seller.rating_count > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(seller.rating_average) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-stone-900">{seller.rating_average.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((review) => (
                <SellerReviewCard key={review.id} review={review} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}