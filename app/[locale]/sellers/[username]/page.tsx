// app/[locale]/sellers/[username]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import SellerStorefront from '@/components/sellers/seller-storefront'

interface Props {
  params: Promise<{ locale: string; username: string }>
}

export async function generateMetadata({ params }: Props) {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)
  const supabase = await createClient()
  const { data: seller } = await supabase
  
    .from('profiles')
    .select('username, full_name, brand_name, bio, avatar_url')
    .eq('username', username)
    .single()

  if (!seller) return { title: 'Seller not found' }

  return {
    title: seller.brand_name || seller.full_name || seller.username,
  description: seller.bio || `Shop all items from ${seller.brand_name || seller.full_name || seller.username}`,
    openGraph: {
      images: seller.avatar_url ? [seller.avatar_url] : [],
    },
  }
}

export default async function SellerPage({ params }: Props) {
  const { username: rawUsername, locale } = await params
  const username = decodeURIComponent(rawUsername)
  const supabase = await createClient()
  const t = await getTranslations('sellers')
  const { data: seller } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!seller) notFound()

  // Fetch seller's active listings with images
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      images:listing_images(*),
      category:categories(id, name, slug)
    `)
    .eq('seller_id', seller.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Fetch seller's reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq('reviewee_id', seller.id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Get unique categories from listings for filter chips
  const categories = listings
    ? [...new Map(
        listings
          .filter((l: any) => l.category)
          .map((l: any) => [l.category!.id, l.category!])
      ).values()]
    : []

    
  return (
    <SellerStorefront
      seller={seller}
      listings={listings || []}
      reviews={reviews || []}
      categories={categories as any[]}
      locale={locale}
    />
  )
}