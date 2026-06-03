import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversationId, content } = await req.json()

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'conversationId and content required' }, { status: 400 })
    }

    // Rate limit: check chat_messages (correct table)
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const { count: recentCount } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', oneMinuteAgo)

    if ((recentCount || 0) >= 20) {
      return NextResponse.json({ error: 'Too many messages. Please slow down.' }, { status: 429 })
    }

    // Verify user is participant
    const { data: convo, error: convoError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .eq('id', conversationId)
      .single()

    if (convoError || !convo) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const isParticipant = convo.buyer_id === user.id || convo.seller_id === user.id
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Insert into chat_messages (correct table)
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select('*')
      .single()

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 400 })
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return NextResponse.json({ message })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to send message' }, { status: 500 })
  }
}
