import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SellerStorefront from '@/components/sellers/seller-storefront'
import type { Listing, Category } from '@/types/database'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch seller's ALL listings (including drafts, not just active)
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      images:listing_images(*),
      category:categories(id, name, slug)
    `)
    .eq('seller_id', profile.id)
    .order('created_at', { ascending: false })

  // Fetch seller's reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq('reviewee_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Get unique categories from listings
  const categories = listings
    ? [...new Map(
        listings
          .filter((l: any) => l.category)
          .map((l: any) => [l.category!.id, l.category!])
      ).values()]
    : []

  return (
    <SellerStorefront
      seller={profile}
      listings={listings || []}
      reviews={reviews || []}
      categories={categories as Category[]}
      locale={locale}
    />
  )
}
