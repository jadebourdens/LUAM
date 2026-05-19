'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Conversation = {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  last_message_at: string
  buyer?: { id: string; full_name?: string; username?: string } | null
  seller?: { id: string; full_name?: string; username?: string } | null
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 text-gray-600">Loading messages…</div>}>
      <MessagesContent />
    </Suspense>
  )
}

function MessagesContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)

  const unreadCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const msg of messages) {
      if (!msg.read && msg.receiver_id === userId && selectedConversationId) {
        map[selectedConversationId] = (map[selectedConversationId] || 0) + 1
      }
    }
    return map
  }, [messages, selectedConversationId, userId])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: convoData } = await supabase
        .from('conversations')
        .select(`
          *,
          buyer:profiles!conversations_buyer_id_fkey(id, full_name, username),
          seller:profiles!conversations_seller_id_fkey(id, full_name, username)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      const list = (convoData || []) as Conversation[]
      setConversations(list)
      const requestedConversation = searchParams.get('conversation')
      if (requestedConversation && list.some(c => c.id === requestedConversation)) {
        setSelectedConversationId(requestedConversation)
      } else if (list[0]) {
        setSelectedConversationId(list[0].id)
      }
      setLoading(false)
    }

    init()
  }, [])

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversationId || !userId) return

      const convo = conversations.find(c => c.id === selectedConversationId)
      if (!convo) return

      const otherUserId = convo.buyer_id === userId ? convo.seller_id : convo.buyer_id

      const { data: thread } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })

      const msgs = (thread || []) as Message[]
      setMessages(msgs)

      const unreadIds = msgs.filter(m => m.receiver_id === userId && !m.read).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ read: true }).in('id', unreadIds)
        setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, read: true } : m))
      }
    }

    fetchMessages()
  }, [selectedConversationId, userId, conversations])

  const sendMessage = async () => {
    if (!selectedConversationId || !draft.trim()) return

    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: selectedConversationId, content: draft }),
    })

    const data = await res.json()
    if (!res.ok) return

    setMessages(prev => [...prev, data.message])
    setDraft('')

    setConversations(prev => prev.map(c =>
      c.id === selectedConversationId
        ? { ...c, last_message_at: new Date().toISOString() }
        : c
    ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()))
  }

  if (loading) return <div className="p-8">Loading messages...</div>
  if (!userId) {
    return <div className="p-8">Please <Link className="text-[#FF5722]" href="/auth/login">sign in</Link> to use messages.</div>
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)
  const otherUser = selectedConversation
    ? (selectedConversation.buyer_id === userId ? selectedConversation.seller : selectedConversation.buyer)
    : null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow grid grid-cols-1 md:grid-cols-3 min-h-[600px]">
        <div className="border-r">
          <h2 className="font-bold text-lg p-4 border-b">Conversations</h2>
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedConversationId(c.id)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${selectedConversationId === c.id ? 'bg-orange-50' : ''}`}
            >
              <p className="font-medium">
                {(c.buyer_id === userId ? (c.seller?.full_name || c.seller?.username) : (c.buyer?.full_name || c.buyer?.username)) || `Conversation ${c.id.slice(0, 8)}`}
              </p>
              <p className="text-xs text-gray-500">{new Date(c.last_message_at).toLocaleString()}</p>
              {c.listing_id && (
                <Link
                  href={`/listings/${c.listing_id}`}
                  className="text-xs text-[#FF5722] hover:text-[#E64A19]"
                  onClick={(e) => e.stopPropagation()}
                >
                  View listing
                </Link>
              )}
              {!!unreadCounts[c.id] && <span className="text-xs text-red-600">{unreadCounts[c.id]} unread</span>}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 flex flex-col">
          <div className="p-4 border-b font-semibold flex items-center justify-between">
            <span>Message thread</span>
            {otherUser?.id && (
              <Link
                href={`/users/${otherUser.id}`}
                className="text-sm text-[#FF5722] hover:text-[#E64A19]"
              >
                View profile
              </Link>
            )}
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {messages.map(m => (
              <div key={m.id} className={`max-w-[75%] px-3 py-2 rounded-lg ${m.sender_id === userId ? 'bg-[#FF5722] text-white ml-auto' : 'bg-gray-200 text-gray-900'}`}>
                <p>{m.content}</p>
                <p className={`text-[10px] mt-1 ${m.sender_id === userId ? 'text-orange-100' : 'text-gray-500'}`}>
                  {new Date(m.created_at).toLocaleTimeString()} {m.sender_id === userId ? (m.read ? '• Seen' : '• Sent') : ''}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 border-t flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button onClick={sendMessage} className="bg-[#FF5722] text-white px-4 py-2 rounded-lg">Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
