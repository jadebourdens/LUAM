'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NewChatMessagePayload {
  receiver_id: string;
  is_read: boolean;
  // Add other properties if needed for type safety
}

export default function SiteHeader() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }

    getUserId()

    // No need to fetch initial count here, let the userId dependency handle it
  }, []) // Run once to get user ID

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0) // Reset if no user
      return // Don't proceed without a user ID
    }

    const supabase = createClient()

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
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
        const newPayload = payload.new as NewChatMessagePayload; // Type assertion for payload.new
        // Only increment if the message is for this user and unread
        if (newPayload.receiver_id === userId && !newPayload.is_read) {
          setUnreadCount((prev) => prev + 1)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId]) // Re-run effect when userId changes

  return (
    <header>
      {/* Your navigation logic here */}
      <span>Unread Messages: {unreadCount}</span>
    </header>
  )
}
