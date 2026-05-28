'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SiteHeader() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // This query now works because 'receiver_id' and 'is_read' exist
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error("Error fetching unread count:", error)
      } else {
        setUnreadCount(count || 0)
      }
    }

    fetchUnreadCount()

    // Real-time subscription to keep the badge updated
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages' 
      }, (payload) => {
        // Only increment if the message is for this user and unread
        if (payload.new.receiver_id === 'YOUR_CURRENT_USER_ID' && !payload.new.is_read) {
          setUnreadCount((prev) => prev + 1)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <header>
      {/* Your navigation logic here */}
      <span>Unread Messages: {unreadCount}</span>
    </header>
  )
}