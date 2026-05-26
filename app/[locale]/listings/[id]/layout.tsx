import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, description, images:listing_images(image_url)')
    .eq('id', id)
    .single()

  if (!listing) {
    return {
      title: 'Listing not found | Luam',
      description: 'The requested listing could not be found.',
    }
  }

  const image = listing.images?.[0]?.image_url || undefined
  const title = `${listing.title} | Luam`
  const description = (listing.description || 'Pre-loved item on Luam marketplace').slice(0, 160)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return children
}
