import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import FavoriteHeart from '@/components/favorite-heart'
import { getTranslations } from 'next-intl/server'
import { formatPrice } from '@/lib/format-price'

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
    color?: string
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
  const color = (sp.color || '').trim()
  const page = Math.max(1, Number(sp.page || '1') || 1)
  const pageSize = 24

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Resolve category IDs
  let categoryIds: string[] = []
  if (selectedCategory) {
    const { data: allCategories } = await supabase.from('categories').select('id, slug')
    if (allCategories) {
      categoryIds = allCategories
        .filter(c => c.slug === selectedCategory || c.slug.split('-')[0] === selectedCategory)
        .map(c => c.id)
    }
  }

  // 2. Base Query Logic
  const applyFilters = (query: any) => {
    let qb = query.in('status', ['active', 'sold'])
    if (q) qb = qb.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    if (size) qb = qb.ilike('size', `%${size}%`)
    if (condition) qb = qb.eq('condition', condition)
    if (color) qb = qb.ilike('color', `%${color}%`)
    if (categoryIds.length > 0) qb = qb.in('category_id', categoryIds)
    if (minPrice !== null && !Number.isNaN(minPrice)) {
      qb = qb.or(`price_eur.gte.${minPrice},price_usd.gte.${minPrice},price_vnd.gte.${minPrice}`)
    }
    if (maxPrice !== null && !Number.isNaN(maxPrice)) {
      qb = qb.or(`price_eur.lte.${maxPrice},price_usd.lte.${maxPrice},price_vnd.lte.${maxPrice}`)
    }
    return qb
  }

  // 3. Fetch Count
  const { count: totalCount } = await applyFilters(
    supabase.from('listings').select('id', { count: 'exact', head: true })
  )

  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / pageSize))
  const currentPage = Math.min(page, totalPages)
  const from = (currentPage - 1) * pageSize
  const to = from + pageSize - 1

  // 4. Fetch Data
  const { data: listings } = await applyFilters(
    supabase.from('listings').select(`
      *,
      seller:profiles(id, username, full_name, avatar_url, rating_average),
      images:listing_images(image_url, position)
    `)
  )
    .order('created_at', { ascending: false })
    .range(from, to)

  const pagedListings = listings ?? []

  const buildHref = (p: number) => {
    const params = new URLSearchParams({
      q, category: selectedCategory, minPrice: sp.minPrice || '',
      maxPrice: sp.maxPrice || '', size, condition, color, page: p.toString()
    })
    return `/${locale}?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-stone-900 mb-6">
          {t('recent_items')}
          <div className="h-1 w-12 bg-[#FF5722] rounded-full mt-1.5" />
        </h2>

        {pagedListings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {pagedListings.map((listing: any, index: number) => {
              const firstImage = (listing.images as any[])?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0]?.image_url
              const price = formatPrice(listing as any)

              return (
                <div key={listing.id} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <Link href={`/${locale}/listings/${listing.id}`} className="block relative">
                    <div className="relative aspect-square bg-stone-100 overflow-hidden rounded-t-2xl">
                      {firstImage ? (
                        <Image src={firstImage} alt={listing.title} fill sizes="25vw" className="object-cover" priority={index < 4} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-stone-400 text-xs">{t('no_image')}</div>
                      )}
                      {listing.status === 'sold' && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold">SOLD</div>}
                      <div className="absolute bottom-2 left-2 bg-white/90 text-[#FF5722] text-xs font-bold px-2 py-1 rounded-lg">{price}</div>
                      <FavoriteHeart listingId={listing.id} isAuthenticated={!!user} />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-stone-900 truncate">{listing.brand || listing.title}</p>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">{t('no_items')}</div>
        )}

        {(totalCount ?? 0) > pageSize && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link href={buildHref(currentPage - 1)} className={`px-4 py-2 border rounded-xl ${currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}`}>{t('previous')}</Link>
            <span className="text-stone-500">{currentPage} / {totalPages}</span>
            <Link href={buildHref(currentPage + 1)} className={`px-4 py-2 border rounded-xl ${currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}`}>{t('next')}</Link>
          </div>
        )}
      </div>
    </div>
  )
}