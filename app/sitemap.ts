import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

type ListingRow = {
  id: string
  updated_at: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = 'https://luam.shop'

  // Fetch all active listings
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Sitemap: Error fetching listings', error)
    return []
  }

  // Generate listing URLs for all locales
  const locales = ['en', 'vi']
  const listingUrls: MetadataRoute.Sitemap = (listings || []).flatMap((listing: ListingRow) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/listings/${listing.id}`,
      lastModified: new Date(listing.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  )

  // Static pages
  const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/${locale}/category/handcrafted`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/${locale}/category/artisanal`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/${locale}/sellers`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/${locale}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ])

  return [...staticPages, ...listingUrls]
}
