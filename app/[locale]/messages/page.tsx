'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

type Currency = 'USD' | 'EUR' | 'VND'
type ConvoStatus = 'open' | 'accepted' | 'waiting_for_verification' | 'completed' | 'cancelled'

const currencySymbols: Record<Currency, string> = { USD: '$', EUR: '€', VND: '₫' }

function fmtMoney(value: number, currency: Currency) {
  if (currency === 'VND') return `₫${Math.round(value).toLocaleString('vi-VN')}`
  return `${currencySymbols[currency]}${value.toFixed(2)}`
}

interface NegotiationOfferProps {
  totalPrice: number
  currency: Currency
  onOfferConfirm: (amount: number) => void
  onClose: () => void
}

function NegotiationOffer({ totalPrice, currency, onOfferConfirm, onClose }: NegotiationOfferProps) {
  const t = useTranslations('Messages')
  const [selected, setSelected] = useState<'5' | '10' | 'other' | null>(null)
  const [customAmt, setCustomAmt] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const price5  = totalPrice * 0.95
  const price10 = totalPrice * 0.90
  const save5   = totalPrice * 0.05
  const save10  = totalPrice * 0.10

  const customVal = parseFloat(customAmt) || 0
  const customPct = totalPrice > 0 ? ((1 - customVal / totalPrice) * 100).toFixed(1) : null

  const confirmEnabled =
    selected === '5' || selected === '10' || (selected === 'other' && customVal > 0)

  const handleConfirm = () => {
    if (!confirmEnabled) return
    const amount = selected === '5' ? price5 : selected === '10' ? price10 : customVal
    onOfferConfirm(amount)
    setConfirmed(true)
  }

  const optClass = (opt: string) =>
    `w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
      selected === opt
        ? 'border-[#FF5722] bg-orange-50 ring-2 ring-[#FF5722]/20'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleBackdrop}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💸</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{t('make_offer')}</p>
              <p className="text-xs text-gray-400">{t('offer_subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none">×</button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-2">
          <button className={optClass('5')} onClick={() => { setSelected('5'); setConfirmed(false) }}>
            <span className="font-medium text-gray-900 flex items-center gap-2 text-sm">5% off <span className="text-xs bg-orange-100 text-[#FF5722] px-2 py-0.5 rounded-full">{t('popular')}</span></span>
            <span className="text-sm text-gray-500">{fmtMoney(price5, currency)} <span className="text-green-600 text-xs">({t('save')} {fmtMoney(save5, currency)})</span></span>
          </button>

          <button className={optClass('10')} onClick={() => { setSelected('10'); setConfirmed(false) }}>
            <span className="font-medium text-gray-900 text-sm">10% off</span>
            <span className="text-sm text-gray-500">{fmtMoney(price10, currency)} <span className="text-green-600 text-xs">({t('save')} {fmtMoney(save10, currency)})</span></span>
          </button>

          <button className={optClass('other')} onClick={() => { setSelected('other'); setConfirmed(false) }}>
            <span className="font-medium text-gray-900 text-sm">{t('other_amount')}</span>
            <span className="text-xs text-gray-400">{t('custom')}</span>
          </button>

          {selected === 'other' && (
            <div className="mt-1">
              <input type="number" value={customAmt} onChange={(e) => { setCustomAmt(e.target.value); setConfirmed(false) }} placeholder={`${t('enter_offer')} ${currency}`} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]" autoFocus />
              {customVal > 0 && customPct && (
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  {parseFloat(customPct) > 0 ? `${customPct}% ${t('discount')}` : parseFloat(customPct) < 0 ? `${Math.abs(parseFloat(customPct))}% ${t('above_asking')}` : t('same_price')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-5">
          <button onClick={handleConfirm} disabled={!confirmEnabled} className="w-full py-3 rounded-xl bg-[#FF5722] text-white font-semibold text-sm hover:bg-[#e64a19] disabled:opacity-40 disabled:cursor-not-allowed transition-all">{t('confirm_offer')}</button>
          {confirmed && <p className="text-center text-sm text-green-600 mt-3">✓ {t('offer_sent')}: {fmtMoney(selected === '5' ? price5 : selected === '10' ? price10 : customVal, currency)}</p>}
        </div>
      </div>
    </div>
  )
}

// Bank details card shown to buyer after seller accepts
function BankDetailsCard({ seller, agreedPrice, currency }: { seller: any; agreedPrice: number; currency: Currency }) {
  return (
    <div className="mx-6 my-3 rounded-2xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏦</span>
        <p className="font-semibold text-green-800 text-sm">Seller accepted — transfer payment</p>
      </div>
      <div className="bg-white rounded-xl border border-green-100 p-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Amount agreed</span>
          <span className="font-bold text-[#FF5722]">{fmtMoney(agreedPrice, currency)}</span>
        </div>
        {seller?.bank_name && (
          <div className="flex justify-between">
            <span className="text-gray-500">Bank</span>
            <span className="font-medium text-gray-900">{seller.bank_name}</span>
          </div>
        )}
        {seller?.bank_account_name && (
          <div className="flex justify-between">
            <span className="text-gray-500">Account name</span>
            <span className="font-medium text-gray-900">{seller.bank_account_name}</span>
          </div>
        )}
        {seller?.bank_account_number && (
          <div className="flex justify-between">
            <span className="text-gray-500">Account number</span>
            <span className="font-bold text-gray-900 tracking-wide">{seller.bank_account_number}</span>
          </div>
        )}
      </div>
      {(!seller?.bank_name && !seller?.bank_account_number) && (
        <p className="text-xs text-yellow-700 mt-2">Seller has not added bank details yet. Contact them directly.</p>
      )}
    </div>
  )
}

// Status banner shown in chat header area
function StatusBanner({ status, agreedPrice, currency }: { status: ConvoStatus; agreedPrice?: number; currency: Currency }) {
  if (status === 'open') return null
  const configs: Record<string, { bg: string; icon: string; label: string }> = {
    accepted:                 { bg: 'bg-green-50 border-green-200 text-green-800',  icon: '✅', label: 'Offer accepted' + (agreedPrice ? ` — ${fmtMoney(agreedPrice, currency)}` : '') },
    waiting_for_verification: { bg: 'bg-blue-50 border-blue-200 text-blue-800',     icon: '⏳', label: 'Waiting for seller to confirm payment' },
    completed:                { bg: 'bg-purple-50 border-purple-200 text-purple-800', icon: '🎉', label: 'Transaction complete' },
    cancelled:                { bg: 'bg-red-50 border-red-200 text-red-800',        icon: '❌', label: 'Transaction cancelled' },
  }
  const cfg = configs[status]
  if (!cfg) return null
  return (
    <div className={`mx-0 px-4 py-2 border-b text-xs font-medium flex items-center gap-2 ${cfg.bg}`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </div>
  )
}

export default function MessagesPage() {
  const t = useTranslations('Messages')
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = (params.locale as string) ?? 'en'
  const conversationId = searchParams.get('conversation')

  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [showOffer, setShowOffer] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  // Latest offer amount parsed from messages (used for seller to accept)
  const [pendingOfferAmount, setPendingOfferAmount] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Parse most recent offer from messages
  useEffect(() => {
    if (!messages.length) { setPendingOfferAmount(null); return }
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      // offer messages look like "💸 Offer: ₫1,000,000" or "$95.00"
      const match = m.content?.match(/💸 Offer: [₫$€]?([\d,\.]+)/)
      if (match) {
        const raw = match[1].replace(/,/g, '')
        const val = parseFloat(raw)
        if (!isNaN(val)) { setPendingOfferAmount(val); return }
      }
    }
    setPendingOfferAmount(null)
  }, [messages])

  const loadConversations = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('conversations')
      .select(`*, listing:listings(id, title, price_usd, price_vnd, currency, images), buyer:profiles!conversations_buyer_id_fkey(id, username, full_name, avatar_url, bank_name, bank_account_name, bank_account_number), seller:profiles!conversations_seller_id_fkey(id, username, full_name, avatar_url, bank_name, bank_account_name, bank_account_number)`)
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order('last_message_at', { ascending: false })
    return data || []
  }, [supabase])

  const loadMessages = useCallback(async (convoId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:profiles(id, username, full_name, avatar_url)')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })
    if (!error) setMessages(data || [])
  }, [supabase])

  const markAsRead = useCallback(async (convoId: string) => {
    if (!user) return
    await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('conversation_id', convoId)
      .eq('receiver_id', user.id)
      .eq('read', false)
  }, [supabase, user])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !activeConversation || !user) return

    const receiverId = activeConversation.buyer_id === user.id
      ? activeConversation.seller_id
      : activeConversation.buyer_id

    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: activeConversation.id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    })

    if (!error) {
      setNewMessage('')
      loadMessages(activeConversation.id)
    } else {
      console.error('Supabase Error:', error)
    }
  }, [activeConversation, user, supabase, loadMessages])

  // Core status update function
  const updateStatus = useCallback(async (newStatus: ConvoStatus, agreedPrice?: number) => {
    if (!activeConversation) return
    setStatusUpdating(true)
    const updates: any = { status: newStatus }
    if (agreedPrice !== undefined) updates.agreed_price = agreedPrice

    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', activeConversation.id)

    if (error) {
      console.error('Status update error:', error)
      setStatusUpdating(false)
      return
    }

    // Reflect locally immediately
    setActiveConversation((prev: any) => ({ ...prev, status: newStatus, agreed_price: agreedPrice ?? prev.agreed_price }))
    setConversations((prev: any[]) =>
      prev.map((c) => c.id === activeConversation.id ? { ...c, status: newStatus, agreed_price: agreedPrice ?? c.agreed_price } : c)
    )
    setStatusUpdating(false)
  }, [activeConversation, supabase])

  const handleOfferConfirm = useCallback((amount: number) => {
    const listing = activeConversation?.listing
    if (!listing) return
    const currency: Currency = listing.currency ?? 'USD'
    sendMessage(`💸 Offer: ${fmtMoney(amount, currency)}`)
    setShowOffer(false)
  }, [activeConversation, sendMessage])

  const handleAcceptOffer = useCallback(async () => {
    if (pendingOfferAmount === null) return
    await updateStatus('accepted', pendingOfferAmount)
    // Notify in chat
    const currency: Currency = activeConversation?.listing?.currency ?? 'USD'
    sendMessage(`✅ Offer accepted at ${fmtMoney(pendingOfferAmount, currency)}. Please transfer payment to the bank details shown below.`)
  }, [pendingOfferAmount, updateStatus, activeConversation, sendMessage])

  const handleTransferred = useCallback(async () => {
    await updateStatus('waiting_for_verification')
    sendMessage('💳 I have transferred the money. Please check and confirm.')
  }, [updateStatus, sendMessage])

  const handleMarkCompleted = useCallback(async () => {
    await updateStatus('completed')
    sendMessage('✅ Payment confirmed. Transaction complete!')
  }, [updateStatus, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(newMessage)
    }
  }

  const deleteConversation = async (convoId: string) => {
    if (!convoId) return
    const { error } = await supabase.from('conversations').delete().eq('id', convoId)
    if (error) { alert('Failed to delete conversation'); return }

    const convos = await loadConversations(user.id)
    setConversations(convos)

    if (activeConversation?.id === convoId) {
      if (convos.length > 0) {
        setActiveConversation(convos[0])
        loadMessages(convos[0].id)
      } else {
        setActiveConversation(null)
        setMessages([])
      }
    }
    setShowDeleteConfirm(null)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push(`/${locale}/auth/login`); return }
      setUser(session.user)

      const convos = await loadConversations(session.user.id)

      if (convos.length > 0) {
        setConversations(convos)
        const targetConvo = conversationId ? convos.find((c: any) => c.id === conversationId) ?? convos[0] : convos[0]
        setActiveConversation(targetConvo)
        loadMessages(targetConvo.id)
      }
      setLoading(false)
    }
    init()
  }, [conversationId, loadConversations, loadMessages, locale, router, supabase])

  if (loading) return <div className="p-10 text-center">Loading...</div>

  const listing = activeConversation?.listing
  const offerPrice: number =
    listing?.currency === 'EUR' ? (listing?.price_eur ?? 0)
    : listing?.currency === 'VND' ? (listing?.price_vnd ?? 0)
    : (listing?.price_usd ?? 0)
  const offerCurrency: Currency = listing?.currency ?? 'USD'

  const isSeller = activeConversation?.seller_id === user?.id
  const isBuyer  = activeConversation?.buyer_id === user?.id
  const convoStatus: ConvoStatus = activeConversation?.status ?? 'open'
  const agreedPrice: number = activeConversation?.agreed_price ?? 0
  const sellerProfile = activeConversation?.seller

  // Seller sees "Accept Offer" when open and a pending offer exists
  const showAcceptBtn = isSeller && convoStatus === 'open' && pendingOfferAmount !== null
  // Buyer sees "I have transferred" when status = accepted
  const showTransferredBtn = isBuyer && convoStatus === 'accepted'
  // Seller sees "Mark as Completed" when status = waiting_for_verification
  const showMarkCompletedBtn = isSeller && convoStatus === 'waiting_for_verification'
  // Show bank details to buyer when accepted or waiting
  const showBankDetails = isBuyer && (convoStatus === 'accepted' || convoStatus === 'waiting_for_verification')

  return (
    <>
      {showOffer && activeConversation && (
        <NegotiationOffer totalPrice={offerPrice} currency={offerCurrency} onOfferConfirm={handleOfferConfirm} onClose={() => setShowOffer(false)} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 text-center">
            <p className="text-xl font-semibold mb-2">{t('delete_title')}</p>
            <p className="text-gray-600 mb-6">
              {t('delete_confirm')} <strong>{showDeleteConfirm.title}</strong>?
              <br />{t('delete_warning')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-gray-300 hover:bg-gray-50">{t('cancel')}</button>
              <button onClick={() => deleteConversation(showDeleteConfirm.id)} className="flex-1 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700">{t('yes_delete')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="max-w-6xl w-full mx-auto px-4 py-4 flex flex-col flex-1 min-h-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-3 shrink-0">{t('title')}</h1>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-1 min-h-0 overflow-hidden">
            {/* Sidebar */}
            <div className="w-72 border-r border-gray-100 flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('conversations')}</p>
              </div>
              <div className="overflow-y-auto flex-1">
                {conversations.length === 0 && (
                  <p className="text-sm text-gray-400 px-4 py-6 text-center">{t('no_conversations')}</p>
                )}
                {conversations.map((c: any) => {
                  const otherUser = c.buyer_id === user?.id ? c.seller : c.buyer
                  const thumbnailUrl = Array.isArray(c.listing?.images) ? c.listing.images[0] : c.listing?.images
                  return (
                    <div
                      key={c.id}
                      className={`group w-full px-4 py-3 border-b border-gray-50 text-left flex items-center gap-3 cursor-pointer transition-colors ${
                        activeConversation?.id === c.id ? 'bg-orange-50 border-l-4 border-l-[#FF5722]' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => { setActiveConversation(c); loadMessages(c.id); markAsRead(c.id); setShowOffer(false) }}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} alt={c.listing?.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">{t('no_img')}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {otherUser?.avatar_url && (
                            <img src={otherUser.avatar_url} alt={otherUser.username} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          )}
                          <p className="font-semibold text-sm truncate">{otherUser?.username}</p>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{c.listing?.title}</p>
                        {c.status && c.status !== 'open' && (
                          <span className="text-[10px] text-[#FF5722] font-medium">{c.status.replace(/_/g, ' ')}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm({ id: c.id, title: otherUser?.username || 'this conversation' }) }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1 hover:bg-gray-100 rounded transition-all shrink-0"
                        title={t('delete')}
                      >
                        🗑️
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Chat panel */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {activeConversation ? (
                <>
                  {/* Chat header */}
                  <div className="px-6 py-3 border-b border-gray-100 bg-white font-semibold text-sm flex items-center gap-3">
                    {listing?.images?.[0] && (
                      <img src={listing.images[0]} alt={listing.title} className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{listing?.title ?? 'Conversation'}</span>
                  </div>

                  {/* Status banner */}
                  <StatusBanner status={convoStatus} agreedPrice={agreedPrice} currency={offerCurrency} />

                  {/* Seller: Accept Offer bar */}
                  {showAcceptBtn && (
                    <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Buyer offered {fmtMoney(pendingOfferAmount!, offerCurrency)}</p>
                        <p className="text-xs text-amber-600">Accept to share your bank details and proceed with transfer</p>
                      </div>
                      <button
                        onClick={handleAcceptOffer}
                        disabled={statusUpdating}
                        className="shrink-0 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {statusUpdating ? '...' : '✅ Accept Offer'}
                      </button>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
                    {messages.map((m: any, i: number) => (
                      <div key={i} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[70%] break-words ${m.sender_id === user?.id ? 'bg-[#FF5722] text-white' : 'bg-white border border-gray-200'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Bank details card (buyer view, after accepted) */}
                  {showBankDetails && (
                    <BankDetailsCard seller={sellerProfile} agreedPrice={agreedPrice} currency={offerCurrency} />
                  )}

                  {/* Buyer: I have transferred button */}
                  {showTransferredBtn && (
                    <div className="px-6 py-3 bg-blue-50 border-t border-blue-200 flex items-center justify-between gap-3">
                      <p className="text-sm text-blue-800">Transfer complete? Let the seller know.</p>
                      <button
                        onClick={handleTransferred}
                        disabled={statusUpdating}
                        className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {statusUpdating ? '...' : '💳 I have transferred the money'}
                      </button>
                    </div>
                  )}

                  {/* Seller: Mark as Completed button */}
                  {showMarkCompletedBtn && (
                    <div className="px-6 py-3 bg-purple-50 border-t border-purple-200 flex items-center justify-between gap-3">
                      <p className="text-sm text-purple-800">{t('mark_completed_prompt')}</p>
                      <button
                        onClick={handleMarkCompleted}
                        disabled={statusUpdating}
                        className="shrink-0 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {statusUpdating ? '...' : t('mark_completed_button')}
                      </button>
                    </div>
                  )}

                  {/* Input bar */}
                  <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-2">
                    <button onClick={() => setShowOffer(true)} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-amber-50 hover:bg-amber-100 text-lg border border-amber-200 transition-colors" title={t('make_offer')}>💸</button>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={t('type_message')} className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]" />
                    <button onClick={() => sendMessage(newMessage)} disabled={!newMessage.trim()} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[#FF5722] hover:bg-[#e64a19] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">{t('select_conversation')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
