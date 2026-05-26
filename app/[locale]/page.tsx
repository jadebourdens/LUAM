import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import FavoriteHeart from '@/components/favorite-heart'

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
  const supabase = await createClient()
  const sp = await searchParams
  const q = (sp.q || '').trim()
  const selectedCategory = (sp.category || '').trim().toLowerCase()
  const minPrice = Number(sp.minPrice || '')
  const maxPrice = Number(sp.maxPrice || '')
  const size = (sp.size || '').trim()
  const condition = (sp.condition || '').trim()
  const page = Math.max(1, Number(sp.page || '1') || 1)
  const pageSize = 24

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all categories and build a map of slug -> [ids]
  const { data: allCategories, error: catError } = await supabase.from('categories').select('id, slug')
  console.log('allCategories', allCategories, 'catError', catError)
  const categoryIdMap: Record<string, string[]> = {}
  for (const cat of allCategories || []) {
    // exact slug
    if (!categoryIdMap[cat.slug]) categoryIdMap[cat.slug] = []
    categoryIdMap[cat.slug].push(cat.id)
    // parent slug e.g. 'home-furniture' -> parent 'home'
    const parent = cat.slug.split('-')[0]
    if (parent !== cat.slug) {
      if (!categoryIdMap[parent]) categoryIdMap[parent] = []
      categoryIdMap[parent].push(cat.id)
    }
  }

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
  if (!Number.isNaN(minPrice) && minPrice > 0) {
    query = query.or(`and(currency.eq.EUR,price_eur.gte.${minPrice}),and(currency.eq.USD,price_usd.gte.${minPrice}),and(currency.eq.VND,price_vnd.gte.${minPrice})`)
  }
  if (!Number.isNaN(maxPrice) && maxPrice > 0) {
    query = query.or(`and(currency.eq.EUR,price_eur.lte.${maxPrice}),and(currency.eq.USD,price_usd.lte.${maxPrice}),and(currency.eq.VND,price_vnd.lte.${maxPrice})`)
  }

  const { data: listings } = await query.order('created_at', { ascending: false }).limit(60)

  const filteredListings = (listings || []).filter((listing: any) => {
  if (!selectedCategory) return true;
  
  // --- DEBUGGING LOGS ---
  console.log(`Checking Listing: "${listing.title}"`);
  console.log(`Listing category_id: ${listing.category_id} (Type: ${typeof listing.category_id})`);
  
  const matchIds = categoryIdMap[selectedCategory] || [];
  console.log(`Matching IDs for ${selectedCategory}:`, matchIds);
  // ----------------------

  if (!listing.category_id) return false;
  
  // Test the fix: Compare as strings
  return matchIds.some(id => String(id) === String(listing.category_id));
});
  console.log('categoryIdMap', categoryIdMap)
  console.log('selectedCategory', selectedCategory)
  console.log('filteredListings count', filteredListings.length)
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedListings = filteredListings.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const buildHref = (p: number) =>
    `/${locale}?q=${encodeURIComponent(q)}&category=${encodeURIComponent(selectedCategory)}&minPrice=${encodeURIComponent(sp.minPrice || '')}&maxPrice=${encodeURIComponent(sp.maxPrice || '')}&size=${encodeURIComponent(size)}&condition=${encodeURIComponent(condition)}&page=${p}`

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <form action={`/${locale}`} method="get" className="flex flex-wrap items-center gap-2">
          <input name="q" defaultValue={q} type="text" placeholder="Keyword" className="flex-1 min-w-[140px] px-3 py-1.5 text-sm rounded-md border border-stone-200 bg-white text-stone-900" />
          <input name="minPrice" defaultValue={sp.minPrice || ''} type="number" min="0" placeholder="Min" className="w-20 px-2 py-1.5 text-sm rounded-md border border-stone-200 bg-white text-stone-900" />
          <input name="maxPrice" defaultValue={sp.maxPrice || ''} type="number" min="0" placeholder="Max" className="w-20 px-2 py-1.5 text-sm rounded-md border border-stone-200 bg-white text-stone-900" />
          <input name="size" defaultValue={size} type="text" placeholder="Size" className="w-20 px-2 py-1.5 text-sm rounded-md border border-stone-200 bg-white text-stone-900" />
          <select name="condition" defaultValue={condition} className="px-2 py-1.5 text-sm rounded-md border border-stone-200 bg-white text-stone-900">
            <option value="">Any condition</option>
            <option value="new">New</option>
            <option value="like_new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="worn">Worn</option>
          </select>
          <input type="hidden" name="category" value={selectedCategory} />
          <button type="submit" className="bg-[#FF5722] text-white px-3 py-1.5 text-sm rounded-md font-medium hover:bg-[#E64A19]">Apply</button>
          <Link href={`/${locale}`} className="text-stone-500 hover:text-stone-700 px-2 py-1.5 text-sm">Clear</Link>
        </form>
      </div>

      <div className="max-w-7xl mx-auto py-8">
        <h2 className="text-2xl font-bold text-stone-900 mb-4 px-4">Recent Items</h2>

        {(filteredListings && filteredListings.length > 0) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-stone-50">
            {pagedListings.map((listing: any) => {
              const firstImage = listing.images
                ?.sort((a: any, b: any) => a.position - b.position)?.[0]?.image_url
              const price = listing.currency === 'EUR'
                ? `€${listing.price_eur}`
                : listing.currency === 'USD'
                ? `$${listing.price_usd}`
                : `${listing.price_vnd?.toLocaleString()} ₫`
              const secondary = [listing.size, listing.condition].filter(Boolean).join(' · ')

              return (
                <div key={listing.id} className="bg-white border border-stone-200 rounded-md overflow-hidden">
                  <Link href={`/${locale}/listings/${listing.id}`} className="block relative">
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }} className="bg-stone-100 overflow-hidden">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={listing.title}
                          fill
                          priority={pagedListings.indexOf(listing) === 0}
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-stone-200 flex items-center justify-center">
                          <span className="text-stone-400 text-xs">No image</span>
                        </div>
                      )}
                      <FavoriteHeart listingId={listing.id} isAuthenticated={!!user} />
                    </div>
                    <div className="p-2.5">
                      <p className="text-base font-bold text-[#FF5722] truncate">{price}</p>
                      <p className="text-xs text-stone-500 truncate mt-0.5">{listing.title}</p>
                      {secondary && (
                        <p className="text-xs text-stone-400 truncate mt-0.5">{secondary}</p>
                      )}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items yet. Be the first to list something!</p>
            {user && (
              <Link href={`/${locale}/listings/new`} className="inline-block mt-4 bg-[#FF5722] text-white px-6 py-3 rounded-md hover:bg-[#E64A19]">
                List Your First Item
              </Link>
            )}
          </div>
        )}

        {filteredListings.length > pageSize && (
          <div className="mt-8 flex items-center justify-center gap-3 text-sm">
            <Link href={buildHref(Math.max(1, currentPage - 1))} className={`px-3 py-2 rounded border ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}>
              Previous
            </Link>
            <span>Page {currentPage} / {totalPages}</span>
            <Link href={buildHref(Math.min(totalPages, currentPage + 1))} className={`px-3 py-2 rounded border ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}>
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}