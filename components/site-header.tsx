'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Định nghĩa interface cho dữ liệu từ Supabase
interface NewChatMessagePayload {
  receiver_id: string
  is_read: boolean
}

export default function SiteHeader() {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [userId, setUserId] = useState<string | null>(null)

  // 1. Lấy User ID khi component mount
  useEffect(() => {
    const supabase = createClient()
    
    async function getUserId() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    
    getUserId()
  }, [])

  // 2. Fetch dữ liệu và thiết lập Real-time subscription
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Hàm lấy số lượng tin nhắn chưa đọc
    async function fetchUnreadCount() {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId!)
        .eq('is_read', false)

      if (!error) {
        setUnreadCount(count || 0)
      }
    }

    fetchUnreadCount()

    // Thiết lập lắng nghe thay đổi
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newPayload = payload.new as any
          if (newPayload.receiver_id === userId && !newPayload.is_read) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    // Cleanup khi component unmount hoặc userId thay đổi
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <header>
      {/* Code giao diện của bạn tại đây */}
      <div>Số tin nhắn chưa đọc: {unreadCount}</div>
    </header>
  )
}