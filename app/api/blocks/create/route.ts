import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { blockedUserId } = await req.json()
    if (!blockedUserId) return NextResponse.json({ error: 'blockedUserId required' }, { status: 400 })
    if (blockedUserId === user.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })

    const { error } = await supabase
      .from('blocked_users')
      .upsert({ blocker_user_id: user.id, blocked_user_id: blockedUserId }, { onConflict: 'blocker_user_id,blocked_user_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to block user' }, { status: 500 })
  }
}
