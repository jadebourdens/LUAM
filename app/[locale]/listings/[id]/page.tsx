import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PhotoGallery from '@/components/listings/PhotoGallery'
import DeleteListingButton from '@/components/delete-listing-button'
import ShareToThreadsButton from '@/components/listings/ShareToThreadsButton'
import RelatedGrid from '@/components/listings/RelatedGrid'
import ListingActions from '@/components/listings/ListingActions'

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

// ---------- Metadata Generation ----------

// ---------- Metadata Generation ----------

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; locale: string }> }
): Promise<Metadata> {
  const { id, locale } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, description, price_usd, price_vnd, currency, images:listing_images(image_url, position)')
    .eq('id', id)
    .single()

  if (!listing) {
    return {
      title: 'Listing not found',
      description: 'The listing you are looking for does not exist.',
    }
  }

  const coverImage = getCoverImage(listing.images)
  const price = formatPrice(listing)

  return {
    title: listing.title,
    description: listing.description || `${listing.title} — ${price} on Luam marketplace`,
    openGraph: {
      title: listing.title,
      description: listing.description || `${listing.title} — ${price} on Luam marketplace`,
      url: `https://luam.shop/${locale}/listings/${id}`,
      // FIX: Change 'product' to 'website' or remove this line entirely
      type: 'website', 
      images: coverImage ? [{ url: coverImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: listing.title,
      description: listing.description || `${listing.title} — ${price} on Luam marketplace`,
      images: coverImage ? [coverImage] : [],
    },
  }
}

// ---------- JSON-LD Schema ----------

function generateProductSchema(listing: ListingData) {
  const coverImage = getCoverImage(listing.images)
  const price = listing.currency === 'USD' ? listing.price_usd : listing.price_vnd
  const priceCurrency = listing.currency === 'USD' ? 'USD' : 'VND'
  const isSold = listing.status === 'sold'

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description || undefined,
    image: coverImage || undefined,
    brand: {
      '@type': 'Brand',
      name: listing.seller?.brand_name || listing.seller?.full_name || 'Luam Seller',
    },
    offers: {
      '@type': 'Offer',
      price: price || undefined,
      priceCurrency: priceCurrency,
      availability: isSold ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: `https://luam.shop/listings/${listing.id}`,
    },
    seller: {
      '@type': 'Organization',
      name: listing.seller?.brand_name || listing.seller?.full_name || 'Luam Seller',
    },
    ...(listing.seller?.rating_average && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: listing.seller.rating_average,
        ratingCount: listing.seller.rating_count || undefined,
      },
    }),
  }
}

// ---------- Server Component ----------

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const supabase = await createClient()

  // Fetch listing data
  const { data: listing, error } = await supabase
    .from('listings')
    .select(
      `*, seller:profiles(id, username, full_name, brand_name, avatar_url, rating_average, rating_count, location), category:categories(name, slug), images:listing_images(image_url, position)`
    )
    .eq('id', id)
    .single()

  if (error || !listing) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Listing not found</h1>
        <p className="text-gray-600 mb-4">This listing may have been deleted or is no longer available.</p>
        <Link href={`/${locale}`} className="text-[#FF5722] hover:underline">
          ← Back to Listings
        </Link>
      </div>
    )
  }

  // Fetch related listings from same seller
  const { data: moreBoutique } = await supabase
    .from('listings')
    .select('id, title, price_usd, price_vnd, currency, images:listing_images(image_url, position)')
    .eq('seller_id', listing.seller_id)
    .eq('status', 'active')
    .neq('id', id)
    .limit(6)

  // Fetch similar listings
  const { data: similarListings } = await supabase
    .from('listings')
    .select('id, title, price_usd, price_vnd, currency, images:listing_images(image_url, position)')
    .eq('status', 'active')
    .neq('id', id)
    .neq('seller_id', listing.seller_id)
    .limit(6)

  const isSold = listing.status === 'sold'
  const specRows = [
    { label: 'Category', value: listing.category?.name },
    { label: 'Brand', value: listing.brand },
    { label: 'Color', value: listing.color },
    { label: 'Size', value: listing.size },
    { label: 'Condition', value: listing.condition ? CONDITION_LABELS[listing.condition] : undefined },
  ].filter((row) => row.value)

  const productSchema = generateProductSchema(listing)

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href={`/${locale}`} className="text-sm text-gray-500 mb-4 block hover:underline">
            ← Back
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
            {/* Left Column: Photos + Seller + Related */}
            <div className="space-y-6">
              <PhotoGallery images={listing.images ?? []} title={listing.title} isSold={isSold} />

              {/* Buy block visible only on mobile */}
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
                <ListingActions listing={listing} locale={locale} />
              </div>

              {/* Seller Block */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-bold mb-3">Seller</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                    {listing.seller?.avatar_url ? (
                      <Image
                        src={listing.seller.avatar_url}
                        width={40}
                        height={40}
                        alt=""
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs">U</span>
                    )}
                  </div>
                  <Link
                    href={`/${locale}/sellers/${listing.seller?.username}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {listing.seller?.full_name ?? 'Anonymous'}
                  </Link>
                </div>
              </div>

              {/* More from this boutique */}
              {moreBoutique && moreBoutique.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">More from this boutique</h3>
                    <Link
                      href={`/${locale}/sellers/${listing.seller?.username}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {((listing.seller?.brand_name || listing.seller?.full_name) ?? 'Anonymous')}
                    </Link>
                  </div>
                  <RelatedGrid listings={moreBoutique} locale={locale} />
                </div>
              )}

              {/* Similar listings */}
              {similarListings && similarListings.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Similar listings</h3>
                    {listing.category?.slug && (
                      <Link
                        href={`/${locale}/category/${listing.category.slug}`}
                        className="text-xs text-[#FF5722] hover:underline"
                      >
                        See all
                      </Link>
                    )}
                  </div>
                  <RelatedGrid listings={similarListings} locale={locale} />
                </div>
              )}
            </div>

            {/* Right Column: Info & Buttons (desktop) */}
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

              <ListingActions listing={listing} locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

