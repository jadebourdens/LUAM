import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_EVENTS = new Set([
  'listing_view',
  'favorite_click',
  'message_seller',
  'checkout_start',
  'checkout_success',
])

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { eventName, listingId, metadata } = await req.json()

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: 'Invalid event name' }, { status: 400 })
    }

    const { error } = await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      event_name: eventName,
      listing_id: listingId || null,
      metadata: metadata || null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Track failed' }, { status: 500 })
  }
}
