import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import FavoriteHeart from '@/components/favorite-heart'
import { getTranslations } from 'next-intl/server'

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    size?: string
    condition?: string
    page?: string
  }>
}) {
  const { locale } = await params
  const sp = await searchParams

  const t = await getTranslations('Home')
  const supabase = await createClient()

  const q = (sp.q || '').trim()
  const selectedCategory = (sp.category || '').trim().toLowerCase()
  const minPrice = sp.minPrice ? Math.max(0, Number(sp.minPrice)) : null
  const maxPrice = sp.maxPrice ? Math.max(0, Number(sp.maxPrice)) : null
  const size = (sp.size || '').trim()
  const condition = (sp.condition || '').trim()
  const page = Math.max(1, Number(sp.page || '1') || 1)
  const pageSize = 24

  const { data: { user } } = await supabase.auth.getUser()

  // Resolve category IDs up front
  let categoryIds: string[] = []
  if (selectedCategory) {
    const { data: allCategories } = await supabase.from('categories').select('id, slug')
    for (const cat of allCategories || []) {
      if (
        cat.slug === selectedCategory ||
        cat.slug.split('-')[0] === selectedCategory
      ) {
        categoryIds.push(cat.id)
      }
    }
  }

  // Count query (for accurate pagination)
  let countQuery = supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  if (q) countQuery = countQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  if (size) countQuery = countQuery.ilike('size', `%${size}%`)
  if (condition) countQuery = countQuery.eq('condition', condition)
  if (categoryIds.length > 0) countQuery = countQuery.in('category_id', categoryIds)
  if (minPrice !== null && !Number.isNaN(minPrice)) {
    countQuery = countQuery.or(
      `and(currency.eq.EUR,price_eur.gte.${minPrice}),and(currency.eq.USD,price_usd.gte.${minPrice}),and(currency.eq.VND,price_vnd.gte.${minPrice})`
    )
  }
  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    countQuery = countQuery.or(
      `and(currency.eq.EUR,price_eur.lte.${maxPrice}),and(currency.eq.USD,price_usd.lte.${maxPrice}),and(currency.eq.VND,price_vnd.lte.${maxPrice})`
    )
  }

  const { count: totalCount } = await countQuery

  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / pageSize))
  const currentPage = Math.min(page, totalPages)
  const from = (currentPage - 1) * pageSize
  const to = from + pageSize - 1

  // Data query — paginated at DB level
  let query = supabase
    .from('listings')
    .select(`
      *,
      seller:profiles(id, username, full_name, avatar_url, rating_average),
      images:listing_images(image_url, position)
    `)
    .eq('status', 'active')

  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  if (size) query = query.ilike('size', `%${size}%`)
  if (condition) query = query.eq('condition', condition)
  if (categoryIds.length > 0) query = query.in('category_id', categoryIds)
  if (minPrice !== null && !Number.isNaN(minPrice)) {
    query = query.or(
      `and(currency.eq.EUR,price_eur.gte.${minPrice}),and(currency.eq.USD,price_usd.gte.${minPrice}),and(currency.eq.VND,price_vnd.gte.${minPrice})`
    )
  }
  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    query = query.or(
      `and(currency.eq.EUR,price_eur.lte.${maxPrice}),and(currency.eq.USD,price_usd.lte.${maxPrice}),and(currency.eq.VND,price_vnd.lte.${maxPrice})`
    )
  }

  const { data: listings } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const pagedListings = listings ?? []

  const buildHref = (p: number) =>
    `/${locale}?q=${encodeURIComponent(q)}&category=${encodeURIComponent(selectedCategory)}&minPrice=${encodeURIComponent(sp.minPrice || '')}&maxPrice=${encodeURIComponent(sp.maxPrice || '')}&size=${encodeURIComponent(size)}&condition=${encodeURIComponent(condition)}&page=${p}`

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900 inline-block">
            {t('recent_items')}
            <div className="h-1 w-12 bg-[#FF5722] rounded-full mt-1.5" />
          </h2>
        </div>

        {pagedListings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {pagedListings.map((listing, i) => {
              const firstImage = [...(listing.images ?? [])]
                .sort((a, b) => a.position - b.position)[0]?.image_url
              const price = listing.currency === 'EUR'
                ? `€${listing.price_eur}`
                : listing.currency === 'USD'
                ? `$${listing.price_usd}`
                : `${listing.price_vnd?.toLocaleString()} ₫`
              const secondary = [listing.size, listing.condition].filter(Boolean).join(' · ')

              return (
                <div key={listing.id} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <Link href={`/${locale}/listings/${listing.id}`} className="block relative">
                    <div className="relative w-full aspect-square bg-stone-100 overflow-hidden rounded-t-2xl">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={listing.title}
                          fill
                          priority={i === 0 ? true : false}
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-stone-200 flex items-center justify-center">
                          <span className="text-stone-400 text-xs">{t('no_image')}</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2">
                        <span className="bg-white/90 backdrop-blur-sm text-[#FF5722] text-xs font-bold px-2 py-1 rounded-lg shadow-sm">{price}</span>
                      </div>
                      <FavoriteHeart listingId={listing.id} isAuthenticated={!!user} />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-stone-700 truncate">{listing.title}</p>
                      {secondary && <p className="text-xs text-stone-400 truncate mt-0.5">{secondary}</p>}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-stone-400 text-lg">{t('no_items')}</p>
            {user && (
              <Link href={`/${locale}/listings/new`} className="inline-block mt-4 bg-[#FF5722] text-white px-6 py-3 rounded-xl hover:bg-[#E64A19] transition-colors shadow-sm">
                {t('list_first')}
              </Link>
            )}
          </div>
        )}

        {(totalCount ?? 0) > pageSize && (
          <div className="mt-10 flex items-center justify-center gap-3 text-sm">
            <Link href={buildHref(Math.max(1, currentPage - 1))} className={`px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}`}>
              {t('previous')}
            </Link>
            <span className="text-stone-500">{t('page')} {currentPage} / {totalPages}</span>
            <Link href={buildHref(Math.min(totalPages, currentPage + 1))} className={`px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}`}>
              {t('next')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}