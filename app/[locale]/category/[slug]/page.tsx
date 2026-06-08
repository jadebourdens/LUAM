import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

interface Listing {
  id: string
  title: string
  description: string | null
  price_usd: number | null
  price_vnd: number | null
  currency: string | null
  condition: string | null
  brand: string | null
  size: string | null
  listing_images: { image_url: string; position: number }[]
}

function formatPrice(listing: Listing, locale: string) {
  if (locale === 'vi' && listing.price_vnd) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(listing.price_vnd)
  }

  if (listing.price_usd) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(listing.price_usd)
  }
  return '—'
}

function getFirstImage(images: string | null): string | null {
  if (!images) return null
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed[0] : parsed
  } catch {
    return images
  }
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params
  const supabase = await createClient()

 // TO THIS:
  const { data: category } = await supabase
    .from('categories')
    .select('id, slug')
    .ilike('slug', slug) // .ilike is case-insensitive
    .single()

  if (!category) notFound()

   const { data: subcategories } = await supabase
  .from('categories')
  .select('id')
  .eq('parent_id', category.id)

const categoryIds = [category.id, ...(subcategories?.map(c => c.id) ?? [])]

const { data: listings } = await supabase
  .from('listings')
  .select(`
    id, title, description, price_eur, price_usd, price_vnd, currency, condition, brand, size,
    listing_images (image_url, position)
  `)
  .in('category_id', categoryIds)
  .eq('status', 'active')
  .order('created_at', { ascending: false })

  const displaySlug = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <nav className="text-sm text-stone-400 mb-2">
          <Link href={`/${locale}`} className="hover:text-[#FF5722]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-stone-700">{displaySlug}</span>
        </nav>
        <h1 className="text-2xl font-bold text-stone-900">{displaySlug}</h1>
        <p className="text-sm text-stone-500 mt-1">{listings?.length ?? 0} items</p>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="text-center py-24 text-stone-400">
          <p className="text-lg">No listings in this category yet.</p>
          <Link href={`/${locale}/listings/new`} className="mt-4 inline-block bg-[#FF5722] text-white px-6 py-2 rounded-full text-sm hover:bg-[#E64A19] transition-colors">
            Be the first to sell here
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {listings.map((listing, index) => {
            const image = listing.listing_images?.[0]?.image_url || null
            return (
              <Link
                key={listing.id}
                href={`/${locale}/listings/${listing.id}`}
                className="group block rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all bg-white"
              >
                <div className="relative aspect-square bg-stone-100 overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt={listing.title}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-white/90 backdrop-blur-sm text-[#FF5722] text-xs font-bold px-2 py-1 rounded-lg shadow-sm">{formatPrice(listing, locale)}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-stone-700 truncate">
                    {listing.brand ? `${listing.brand} ${listing.title}` : listing.title}
                  </p>
                  {listing.description && (
                    <p className="text-xs text-stone-500 truncate mt-1">{listing.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}