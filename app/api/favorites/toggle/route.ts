import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase.from('favorites').delete().eq('id', existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ favorited: false })
    }

    const { error } = await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ favorited: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to toggle favorite' }, { status: 500 })
  }
}
