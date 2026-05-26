import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8">Please <Link href="/auth/login" className="text-[#FF5722]">sign in</Link> to view favorites.</div>
  }

  const { data: favorites } = await supabase
    .from('favorites')
    .select('id, listing:listings(id,title,currency,price_eur,price_usd,price_vnd,status)')
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Wishlist</h1>

        {(!favorites || favorites.length === 0) ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">No saved items yet.</div>
        ) : (
          <div className="space-y-3">
            {favorites.map((f: any) => {
              const listing = f.listing
              const price = listing?.currency === 'EUR' ? `€${listing.price_eur}` : listing?.currency === 'USD' ? `$${listing.price_usd}` : `${listing?.price_vnd?.toLocaleString()} ₫`
              return (
                <div key={f.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                  <div>
                    <Link href={`/listings/${listing?.id}`} className="font-medium text-[#FF5722] hover:underline">{listing?.title || 'Listing unavailable'}</Link>
                    <p className="text-xs text-gray-500">Status: {listing?.status || 'unknown'}</p>
                  </div>
                  <p className="font-semibold">{price}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
