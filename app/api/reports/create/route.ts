import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listingId, reportedUserId, reason, details } = await req.json()
    if (!listingId || !reason) return NextResponse.json({ error: 'listingId and reason required' }, { status: 400 })

    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const { count } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_user_id', user.id)
      .gte('created_at', oneMinuteAgo)

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Too many reports. Please wait a minute.' }, { status: 429 })
    }

    const { error } = await supabase.from('reports').insert({
      reporter_user_id: user.id,
      listing_id: listingId,
      reported_user_id: reportedUserId || null,
      reason,
      details: details || null,
      status: 'open',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create report' }, { status: 500 })
  }
}
