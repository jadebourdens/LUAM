import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    // Fetch the listing and verify the current user owns it
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, seller_id, status')
      .eq('id', listingId)
      .single()

    if (error || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.seller_id !== user.id) return NextResponse.json({ error: 'Not your listing' }, { status: 403 })

    // Only flip between active and sold — never touch deleted listings
    if (listing.status !== 'active' && listing.status !== 'sold') {
      return NextResponse.json({ error: 'Cannot change this listing' }, { status: 400 })
    }

    const newStatus = listing.status === 'sold' ? 'active' : 'sold'

    const { error: updateError } = await supabase
      .from('listings')
      .update({ status: newStatus })
      .eq('id', listingId)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (e: any) {
    console.error('Toggle status error:', e)
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}