import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import DeleteFavoriteButton from '@/components/delete-favorite-button'

export default async function FavoritesPage() {
  const t = await getTranslations('Favorites')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-8">
        Please <Link href="/auth/login" className="text-[#FF5722]">{t('sign_in')}</Link> to view favorites.
      </div>
    )
  }

  const { data: favorites } = await supabase
    .from('favorites')
    .select('id, listing:listings(id,title,currency,price_eur,price_usd,price_vnd,status,listing_images(image_url))')
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>

        {(!favorites || favorites.length === 0) ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">{t('no_items')}</div>
        ) : (
          <div className="grid grid-cols-6 gap-3">
            {favorites.map((f: any) => {
              const listing = f.listing
              const price = listing?.currency === 'EUR'
                ? `€${listing.price_eur}`
                : listing?.currency === 'USD'
                ? `$${listing.price_usd}`
                : `${listing?.price_vnd?.toLocaleString()} ₫`
              const imageUrl = listing?.listing_images?.[0]?.image_url
              return (
                <div key={f.id} className="bg-white rounded-lg shadow overflow-hidden group relative">
                  <div className="absolute top-2 right-2 z-10">
                    <DeleteFavoriteButton favoriteId={f.id} />
                  </div>
                  <Link href={`/listings/${listing?.id}`}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={listing?.title || ''} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-gray-200" />
                    )}
                  </Link>
                  <div className="p-2">
                    <Link href={`/listings/${listing?.id}`} className="block font-medium text-sm text-[#FF5722] hover:underline truncate">
                      {listing?.title || t('unavailable')}
                    </Link>
                    <p className="font-semibold text-sm mt-1">{price}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}