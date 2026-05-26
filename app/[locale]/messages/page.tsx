'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MessagesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = (params.locale as string) ?? 'en'
  const conversationId = searchParams.get('conversation')

  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [offerCustom, setOfferCustom] = useState('')
  const [showOffer, setShowOffer] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userRef = useRef<any>(null)
  const supabase = useMemo(() => createClient(), [])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
    }, 100)
  }

  const loadMessages = useCallback(async (convoId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:profiles(id, username, full_name, avatar_url)')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })
    if (error) console.error('loadMessages error:', error)
    setMessages(data || [])
    scrollToBottom()
  }, [supabase])

  useEffect(() => {
    if (!activeConversation) return
    const channel = supabase
      .channel(`chat-${activeConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${activeConversation.id}`
      }, async (payload) => {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', payload.new.sender_id)
          .single()

        const enriched = { ...payload.new, sender: senderProfile }
        setMessages((prev) => {
          const filtered = prev.filter(m => !(m.id.startsWith('temp-') && m.content === payload.new.content))
          return [...filtered, enriched]
        })
        scrollToBottom()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeConversation, supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push(`/${locale}/auth/login`); return }
      setUser(session.user)
      userRef.current = session.user

      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(id, title, price_usd, price_vnd, price_eur, currency),
          buyer:profiles!conversations_buyer_id_fkey(id, username, full_name, avatar_url),
          seller:profiles!conversations_seller_id_fkey(id, username, full_name, avatar_url)
        `)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .order('updated_at', { ascending: false })

      if (error) console.error('conversations error:', error)
      setConversations(convos || [])

      if (conversationId && convos) {
        const active = convos.find((c: any) => c.id === conversationId)
        if (active) { setActiveConversation(active); loadMessages(conversationId) }
      }
      setLoading(false)
    }
    init()
  }, [conversationId, loadMessages, locale, router, supabase])

  const sendMessage = async (content?: string) => {
    const msg = content || newMessage.trim()
    if (!msg || !activeConversation || !userRef.current || sending) return
    setSending(true)
    if (!content) setNewMessage('')

    const optimistic = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_id: userRef.current.id,
      content: msg,
      created_at: new Date().toISOString(),
      sender: { id: userRef.current.id, username: 'You', full_name: 'You', avatar_url: null },
    }
    setMessages((prev) => [...prev, optimistic])
    scrollToBottom()

    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: activeConversation.id,
      sender_id: userRef.current.id,
      content: msg,
    })

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      if (!content) setNewMessage(msg)
      alert('Failed to send: ' + error.message)
    } else {
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', activeConversation.id)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const sendOffer = (percent: number) => {
    const listing = activeConversation?.listing
    if (!listing) return
    const price = listing.currency === 'EUR' ? listing.price_eur : listing.currency === 'VND' ? listing.price_vnd : listing.price_usd
    const symbol = listing.currency === 'EUR' ? '€' : listing.currency === 'VND' ? '₫' : '$'
    const discounted = (price * (1 - percent / 100)).toFixed(listing.currency === 'VND' ? 0 : 2)
    sendMessage(`💸 Offer: ${percent}% off → ${symbol}${Number(discounted).toLocaleString()}`)
    setShowOffer(false)
  }

  const sendCustomOffer = () => {
    const listing = activeConversation?.listing
    if (!listing || !offerCustom) return
    const symbol = listing.currency === 'EUR' ? '€' : listing.currency === 'VND' ? '₫' : '$'
    sendMessage(`💸 Custom offer: ${symbol}${offerCustom}`)
    setOfferCustom('')
    setShowOffer(false)
  }

  const getOther = (c: any) => c?.buyer_id === userRef.current?.id ? c?.seller : c?.buyer
  const getAvatar = (profile: any) => profile?.avatar_url
  const getInitial = (profile: any) => (profile?.full_name || profile?.username || '?')[0].toUpperCase()
  const getListingPrice = (listing: any) => {
    if (!listing) return ''
    if (listing.currency === 'EUR') return `€${listing.price_eur}`
    if (listing.currency === 'VND') return `${Number(listing.price_vnd).toLocaleString()} ₫`
    return `$${listing.price_usd}`
  }
  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isBuyer = activeConversation?.buyer_id === userRef.current?.id

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF5722]" />
    </div>
  )

  return (
    <div className="bg-gray-50 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="max-w-6xl w-full mx-auto px-4 py-4 flex flex-col flex-1 min-h-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-3 shrink-0">Messages</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 border-r border-gray-100 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversations</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {conversations.length === 0 && (
                <div className="p-6 text-center text-gray-400 text-sm">No conversations yet</div>
              )}
              {conversations.map((c) => {
                const other = getOther(c)
                const isActive = activeConversation?.id === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => { setActiveConversation(c); router.push(`/${locale}/messages?conversation=${c.id}`); loadMessages(c.id); setShowOffer(false) }}
                    className={`w-full px-4 py-3 border-b border-gray-50 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-orange-50 border-l-4 border-l-[#FF5722]' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {getAvatar(other) ? <img src={getAvatar(other)} className="w-full h-full object-cover" alt="" /> : <span className="text-[#FF5722] font-bold text-sm">{getInitial(other)}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{other?.full_name || other?.username || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{c.listing?.title}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden shrink-0">
                    {getAvatar(getOther(activeConversation)) ? <img src={getAvatar(getOther(activeConversation))} className="w-full h-full object-cover" alt="" /> : <span className="text-[#FF5722] font-bold text-xs">{getInitial(getOther(activeConversation))}</span>}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{activeConversation.listing?.title}</p>
                    <p className="text-xs text-[#FF5722] font-medium">{getListingPrice(activeConversation.listing)}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">No messages yet. Say hello!</div>
                  ) : (
                    messages.map((m, i) => {
                      const isMe = String(m.sender_id) === String(userRef.current?.id)
                      const isOffer = m.content?.startsWith('💸')
                      return (
                        <div key={m.id || i} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {getAvatar(m.sender) ? <img src={getAvatar(m.sender)} className="w-full h-full object-cover" alt="" /> : <span className="text-[#FF5722] text-xs font-bold">{getInitial(m.sender)}</span>}
                            </div>
                          )}
                          <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOffer ? 'bg-amber-50 border border-amber-200 text-amber-800 font-medium' : isMe ? 'bg-[#FF5722] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'}`}>
                              {m.content}
                            </div>
                            <span className="text-[10px] text-gray-400 px-1">{formatTime(m.created_at)}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Offer Panel */}
                {showOffer && isBuyer && (
                  <div className="px-4 py-3 border-t border-amber-100 bg-amber-50 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-amber-700 mr-1">Make an offer:</span>
                    {[5, 10, 15, 20].map((pct) => (
                      <button key={pct} onClick={() => sendOffer(pct)} className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200 transition-colors">
                        {pct}% off
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-1">
                      <span className="text-xs text-amber-700">or</span>
                      <input type="number" value={offerCustom} onChange={(e) => setOfferCustom(e.target.value)} placeholder="Custom amount" className="w-32 px-2 py-1 text-xs border border-amber-200 rounded-full focus:outline-none bg-white" />
                      <button onClick={sendCustomOffer} disabled={!offerCustom} className="px-3 py-1 bg-amber-500 text-white text-xs rounded-full hover:bg-amber-600 disabled:opacity-40">
                        Send
                      </button>
                    </div>
                    <button onClick={() => setShowOffer(false)} className="ml-auto text-xs text-amber-500 hover:text-amber-700">Cancel</button>
                  </div>
                )}

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
                  {isBuyer && (
                    <button onClick={() => setShowOffer((v) => !v)} title="Make an offer" className="w-9 h-9 rounded-full flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors shrink-0 text-base">
                      💸
                    </button>
                  )}
                  <input ref={inputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Type a message..." className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722] focus:bg-white transition-colors" />
                  <button onClick={() => sendMessage()} disabled={sending || !newMessage.trim()} className="w-9 h-9 rounded-full bg-[#FF5722] text-white flex items-center justify-center hover:bg-[#E64A19] transition-colors disabled:opacity-40">
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}