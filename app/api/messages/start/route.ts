import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.seller_id === user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', listing.seller_id)
      .maybeSingle()

    if (existing?.id) {
      return NextResponse.json({ conversationId: existing.id })
    }

    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      })
      .select('id')
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    return NextResponse.json({ conversationId: created.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to start conversation' }, { status: 500 })
  }
}
