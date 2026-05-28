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
    .select('id, listing:listings(id,title,currency,price_eur,price_usd,price_vnd,status)')
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>

        {(!favorites || favorites.length === 0) ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">{t('no_items')}</div>
        ) : (
          <div className="space-y-3">
            {favorites.map((f: any) => {
              const listing = f.listing
              const price = listing?.currency === 'EUR'
                ? `€${listing.price_eur}`
                : listing?.currency === 'USD'
                ? `$${listing.price_usd}`
                : `${listing?.price_vnd?.toLocaleString()} ₫`
              return (
                <div key={f.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center group">
                  <div>
                    <Link href={`/listings/${listing?.id}`} className="font-medium text-[#FF5722] hover:underline">
                      {listing?.title || t('unavailable')}
                    </Link>
                    <p className="text-xs text-gray-500">{t('status')}: {listing?.status || t('unknown')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{price}</p>
                    <DeleteFavoriteButton favoriteId={f.id} />
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