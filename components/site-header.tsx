'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, Suspense, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const LANGUAGES = [
  { code: 'EN', label: 'English' },
  { code: 'VI', label: 'Tiếng Việt' },
]

const CATEGORY_ICONS: Record<string, string> = {
  women:              '👗',
  men:                '👔',
  kids:               '🧸',
  home:               '🏠',
  'art-collectibles': '🎨',
}

const STATIC_CATEGORIES = [
  {
    slug: 'women',
    label: { en: 'Women', vi: 'Nữ' },
    children: [
      { slug: 'women-clothes',     label: { en: 'Clothes',                         vi: 'Quần áo' } },
      { slug: 'women-shoes',       label: { en: 'Shoes',                           vi: 'Giày dép' } },
      { slug: 'women-bags',        label: { en: 'Bags',                            vi: 'Túi xách' } },
      { slug: 'women-accessories', label: { en: 'Accessories / Watches / Jewelry', vi: 'Phụ kiện / Đồng hồ / Trang sức' } },
    ],
  },
  {
    slug: 'men',
    label: { en: 'Men', vi: 'Nam' },
    children: [
      { slug: 'men-clothes',     label: { en: 'Clothes',                         vi: 'Quần áo' } },
      { slug: 'men-shoes',       label: { en: 'Shoes',                           vi: 'Giày dép' } },
      { slug: 'men-bags',        label: { en: 'Bags',                            vi: 'Túi xách' } },
      { slug: 'men-accessories', label: { en: 'Accessories / Watches / Jewelry', vi: 'Phụ kiện / Đồng hồ / Trang sức' } },
    ],
  },
  {
    slug: 'kids',
    label: { en: 'Kids', vi: 'Trẻ em' },
    children: [
      { slug: 'kids-clothes', label: { en: 'Clothes', vi: 'Quần áo' } },
      { slug: 'kids-shoes',   label: { en: 'Shoes',   vi: 'Giày dép' } },
      { slug: 'kids-bags',    label: { en: 'Bags',    vi: 'Túi xách' } },
      { slug: 'kids-games',   label: { en: 'Games',   vi: 'Đồ chơi' } },
    ],
  },
  {
    slug: 'home',
    label: { en: 'Home', vi: 'Nhà cửa' },
    children: [
      { slug: 'home-textiles',  label: { en: 'Textiles & Bedding', vi: 'Vải & Chăn ga' } },
      { slug: 'home-furniture', label: { en: 'Furniture',          vi: 'Nội thất' } },
      { slug: 'home-lighting',  label: { en: 'Lighting',           vi: 'Đèn' } },
      { slug: 'home-kitchen',   label: { en: 'Kitchen & Dining',   vi: 'Bếp & Ăn uống' } },
      { slug: 'home-decor',     label: { en: 'Decor',              vi: 'Trang trí' } },
    ],
  },
  {
    slug: 'art-collectibles',
    label: { en: 'Art & Collectibles', vi: 'Nghệ thuật & Sưu tầm' },
    children: [],
  },
]

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type LocaleString = { en: string; vi: string }

type SubCategory = {
  slug: string
  label: LocaleString
}

type Category = {
  slug: string
  label: LocaleString
  children: SubCategory[]
}

type NotifRow = {
  id: string
  title: string
  message: string
  link?: string
  created_at: string
}

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

const BASE_ICON = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round'  as const,
  strokeLinejoin: 'round' as const,
}

function StoreIcon() {
  return (
    <svg {...BASE_ICON}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg {...BASE_ICON}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg {...BASE_ICON}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg {...BASE_ICON}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg {...BASE_ICON}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg {...BASE_ICON}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg {...BASE_ICON} width={16} height={16}>
      <line x1="12" y1="5"  x2="12" y2="19" />
      <line x1="5"  y1="12" x2="19" y2="12" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg {...BASE_ICON} width={18} height={18}>
      <line x1="4" y1="6"  x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function ChevronDown({ active }: { active: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`transition-transform duration-200 ${active ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─────────────────────────────────────────────
// IconLink
// ─────────────────────────────────────────────

function IconLink({
  href,
  label,
  children,
  badge,
}: {
  href: string
  label: string
  children: React.ReactNode
  badge?: number
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-stone-700 hover:text-[#FF5722] hover:bg-stone-100 transition-colors"
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-[#FF5722] rounded-full border border-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  )
}

// ─────────────────────────────────────────────
// LanguagePicker
// ─────────────────────────────────────────────

function LanguagePicker() {
  const [open, setOpen] = useState(false)
  const pathname        = usePathname()
  const ref             = useRef<HTMLDivElement>(null)
  const currentLocale   = pathname.startsWith('/vi') ? 'VI' : 'EN'

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const getLocalePath = (code: string) => {
    const locale = code.toLowerCase()
    let path = pathname
    if (pathname.startsWith('/en/')) path = pathname.slice(3)
    else if (pathname.startsWith('/vi/')) path = pathname.slice(3)
    else if (pathname === '/en' || pathname === '/vi') path = '/'
    return `/${locale}${path}`
  }

  return (
    <div className="relative" ref={ref} style={{ zIndex: 9999 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 h-10 px-3 rounded-full text-stone-700 hover:text-[#FF5722] hover:bg-stone-100 transition-colors text-xs font-medium"
      >
        <GlobeIcon />
        <span>{currentLocale}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-36 bg-white border border-stone-200 rounded-xl shadow-xl py-1"
          style={{ zIndex: 9999 }}
        >
          {LANGUAGES.map((lang) => (
            <Link
              key={lang.code}
              href={getLocalePath(lang.code)}
              onClick={() => setOpen(false)}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-stone-50 flex items-center ${
                lang.code === currentLocale ? 'text-[#FF5722] font-medium' : 'text-stone-700'
              }`}
            >
              <span className="font-mono text-xs mr-2">{lang.code}</span>
              {lang.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SearchBar
// ─────────────────────────────────────────────

function SearchBar({ onToggleFilters }: { onToggleFilters: () => void }) {
  const pathname = usePathname()
  const locale   = pathname.startsWith('/vi') ? 'vi' : 'en'

  return (
    <div className="flex items-center gap-3">
      <form action={`/${locale}`} method="GET" className="relative flex-1">
        <input
          type="text"
          name="q"
          placeholder={locale === 'vi' ? 'Tìm kiếm...' : 'Search...'}
          className="w-full h-10 pl-10 pr-4 text-sm bg-stone-100 border border-stone-200 rounded-full text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#FF5722] focus:bg-white transition-colors"
        />
        <button
          type="submit"
          className="absolute left-0 top-0 h-10 w-10 flex items-center justify-center text-stone-500 hover:text-[#FF5722] transition-colors flex-shrink-0"
          aria-label={locale === 'vi' ? 'Tìm kiếm' : 'Search'}
        >
          <SearchIcon />
        </button>
      </form>
      <button
        type="button"
        onClick={onToggleFilters}
        className="inline-flex items-center justify-center h-10 w-10 flex-shrink-0 bg-stone-100 border border-stone-200 rounded-full text-stone-700 hover:text-[#FF5722] hover:bg-stone-50 transition-colors"
        title="Toggle filters"
      >
        <FilterIcon />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// CategoryNav
// ─────────────────────────────────────────────

function CategoryNav() {
  const pathname   = usePathname()
  const locale     = pathname.startsWith('/vi') ? 'vi' : 'en'
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveSlug(slug)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveSlug(null), 150)
  }

  return (
    <nav className="border-t border-stone-100 bg-white relative" style={{ zIndex: 100 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center">
          {STATIC_CATEGORIES.map((cat: Category) => {
            const hasSub   = cat.children.length > 0
            const isActive = activeSlug === cat.slug
            const label    = locale === 'vi' ? cat.label.vi : cat.label.en

            return (
              <li
                key={cat.slug}
                className="relative flex-shrink-0"
                onMouseEnter={() => handleMouseEnter(cat.slug)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={`/${locale}/category/${cat.slug}`}
                  className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 ${
                    isActive
                      ? 'text-[#FF5722] border-[#FF5722]'
                      : 'text-stone-600 border-transparent hover:text-[#FF5722]'
                  }`}
                >
                  <span className="mr-1 text-base leading-none">{CATEGORY_ICONS[cat.slug]}</span>
                  {label}
                  {hasSub && <ChevronDown active={isActive} />}
                </Link>

                {hasSub && isActive && (
                  <div
                    className="absolute top-full left-0 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden"
                    style={{ minWidth: 240, zIndex: 200 }}
                    onMouseEnter={() => handleMouseEnter(cat.slug)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[cat.slug]}</span>
                      <span className="text-sm font-semibold text-stone-800">{label}</span>
                    </div>
                    <ul className="py-2">
                      {cat.children.map((sub: SubCategory) => {
                        const subLabel = locale === 'vi' ? sub.label.vi : sub.label.en
                        return (
                          <li key={sub.slug}>
                            <Link
                              href={`/${locale}/category/${sub.slug}`}
                              className="flex items-center gap-3 px-5 py-2.5 text-sm text-stone-600 hover:text-[#FF5722] hover:bg-orange-50 transition-colors group"
                            >
                              <span className="w-1 h-1 rounded-full bg-stone-300 group-hover:bg-[#FF5722] transition-colors flex-shrink-0" />
                              {subLabel}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="px-5 py-2.5 border-t border-stone-100 bg-stone-50">
                      <Link
                        href={`/${locale}/category/${cat.slug}`}
                        className="text-xs font-medium text-[#FF5722] hover:underline"
                      >
                        {locale === 'vi' ? `Xem tất cả ${label} →` : `View all ${label} →`}
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────
// SiteHeader
// ─────────────────────────────────────────────

function SiteHeaderInner() {
  const pathname = usePathname()
  const tNav     = useTranslations('Nav')
  const tHome    = useTranslations('Home')
  const locale   = pathname.startsWith('/vi') ? 'vi' : 'en'

  // FIX #2: Merged user + currentUser into a single state to avoid race conditions
  const [user, setUser]           = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifCount, setNotifCount]   = useState(0)
  const [notifs, setNotifs]           = useState<NotifRow[]>([])
  const [showNotifs, setShowNotifs]   = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const subscriptionRef = useRef<any>(null)
  const supabaseRef     = useRef(createClient())
  const supabase        = supabaseRef.current

  // FIX #4: Ref + outside-click handler for notifications dropdown
  const notifRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!showNotifs) return
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showNotifs])

  // FIX #5: Reset filter bar on route change
  useEffect(() => {
    setShowFilters(false)
  }, [pathname])

  const setupRealtimeChannel = useCallback((userId: string) => {
    // FIX #3: Always clean up existing channel before creating a new one
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
    }

    subscriptionRef.current = supabase
      .channel(`unread-messages-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: any) => {
          if (payload.new?.receiver_id === userId && !payload.new.is_read) {
            setUnreadCount((prev) => prev + 1)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          if (payload.new) {
            setNotifCount((prev) => prev + 1)
            setNotifs((prev) => [payload.new as NotifRow, ...prev])
          }
        },
      )
      .subscribe()
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    const loadUserData = async (userId: string) => {
      // FIX #6: Wrap in try/catch with proper error handling
      try {
        const [msgResult, notifResult] = await Promise.all([
          supabase
            .from('chat_messages')
            .select('*, conversation:conversations!chat_messages_conversation_id_fkey(status)', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false)
            .neq('conversation.status', 'completed'),
          supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(10),
        ])

        if (!isMounted) return

        if (msgResult.error) console.error('Failed to load messages:', msgResult.error)
        else setUnreadCount(msgResult.count ?? 0)

        if (notifResult.error) console.error('Failed to load notifications:', notifResult.error)
        else {
          setNotifCount(notifResult.count ?? 0)
          setNotifs((notifResult.data as NotifRow[]) ?? [])
        }
      } catch (err) {
        console.error('Unexpected error loading user data:', err)
      }
    }

    // FIX #1: Auth subscription created once on mount only (not on every pathname change)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        loadUserData(currentUser.id)
        setupRealtimeChannel(currentUser.id)
      } else {
        // Logged out — clear all state and tear down channel
        setUnreadCount(0)
        setNotifCount(0)
        setNotifs([])
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current)
          subscriptionRef.current = null
        }
      }
    })

    // Seed initial user without waiting for an auth event
    supabase.auth.getUser().then(({ data: { user: cu } }) => {
      if (!isMounted || !cu) return
      setUser(cu)
      loadUserData(cu.id)
      setupRealtimeChannel(cu.id)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      // FIX #3: Guaranteed channel cleanup on unmount
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount only

  return (
    <header className="bg-white shadow-md border-b border-stone-100 sticky top-0" style={{ zIndex: 9000 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/${locale}`}
            className="text-2xl font-black tracking-tight select-none whitespace-nowrap flex-shrink-0"
          >
            <span className="text-stone-900">lu</span>
            <span className="text-[#FF5722]">a</span>
            <span className="text-stone-900">m</span>
          </Link>

          <div className="flex-1 px-4">
            <SearchBar onToggleFilters={() => setShowFilters((v) => !v)} />
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {user ? (
              <>
                <Link
                  href={`/${locale}/listings/new`}
                  className="inline-flex items-center gap-1 bg-[#FF5722] text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[#E64A19] transition-colors shadow-sm"
                >
                  <PlusIcon /> {tNav('sell')}
                </Link>

                <IconLink href={`/${locale}/dashboard`} label={locale === 'vi' ? 'Cửa hàng của tôi' : 'My Boutique'}>
                  <StoreIcon />
                </IconLink>

                <IconLink href={`/${locale}/messages`} label={tNav('messages')} badge={unreadCount}>
                  <MessageIcon />
                </IconLink>

                {/* FIX #4: Notification dropdown with outside-click ref */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifs((v) => !v)}
                    className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-stone-700 hover:text-[#FF5722] hover:bg-stone-100 transition-colors"
                  >
                    <BellIcon />
                    {notifCount > 0 && (
                      <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-[#FF5722] rounded-full border border-white">
                        {notifCount > 9 ? '9+' : notifCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div
                      className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden"
                      style={{ zIndex: 9999 }}
                    >
                      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                        <p className="font-semibold text-sm">Notifications</p>
                        {notifCount > 0 && (
                          <button
                            onClick={async () => {
                              if (!user) return
                              await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
                              setNotifCount(0)
                              setNotifs([])
                              setShowNotifs(false)
                            }}
                            className="text-xs text-[#FF5722] hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifs.length === 0 ? (
                        <p className="text-sm text-gray-400 px-4 py-6 text-center">No new notifications</p>
                      ) : (
                        <div className="max-h-80 overflow-y-auto">
                          {notifs.map((n) => (
                            <a
                              key={n.id}
                              href={n.link || '#'}
                              onClick={async () => {
                                await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
                                setShowNotifs(false)
                              }}
                              className="flex flex-col px-4 py-3 hover:bg-stone-50 border-b border-stone-50 last:border-0"
                            >
                              <p className="text-sm font-medium text-stone-900">{n.title}</p>
                              <p className="text-xs text-stone-500 mt-0.5">{n.message}</p>
                              <p className="text-xs text-stone-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <IconLink href={`/${locale}/favorites`} label={tNav('wishlist')}>
                  <HeartIcon />
                </IconLink>
                <IconLink href={`/${locale}/orders`} label={tNav('orders')}>
                  <BagIcon />
                </IconLink>
                <IconLink href={`/${locale}/profile`} label={tNav('account')}>
                  <UserIcon />
                </IconLink>

                <LanguagePicker />

                <form action={`/${locale}/auth/signout`} method="post">
                  <button
                    type="submit"
                    className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1.5 ml-1"
                  >
                    {tNav('signout')}
                  </button>
                </form>
              </>
            ) : (
              <>
                <LanguagePicker />
                <Link
                  href={`/${locale}/auth/login`}
                  className="text-sm text-stone-700 hover:text-stone-900 px-2"
                >
                  {tNav('signin')}
                </Link>
                <Link
                  href={`/${locale}/auth/signup`}
                  className="bg-[#FF5722] text-white text-sm px-4 py-2.5 rounded-full hover:bg-[#E64A19] transition-colors shadow-sm"
                >
                  {tNav('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-stone-50 border-b border-stone-100 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto">
            <form action={`/${locale}`} method="get" className="flex flex-wrap items-center gap-2">
              <input name="minPrice" type="number" min="0" placeholder={tHome('min') || 'Min'} className="w-24 px-3 py-1.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]" />
              <input name="maxPrice" type="number" min="0" placeholder={tHome('max') || 'Max'} className="w-24 px-3 py-1.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]" />
              <input name="size" type="text" placeholder={tHome('size') || 'Size'} className="w-20 px-3 py-1.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]" />
              <input name="color" type="text" placeholder={tHome('color') || 'Color'} className="w-24 px-3 py-1.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]" />
              <select name="condition" className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]">
                <option value="">{tHome('any_condition') || 'Any Condition'}</option>
                <option value="new">{tHome('new') || 'New'}</option>
                <option value="like_new">{tHome('like_new') || 'Like New'}</option>
                <option value="good">{tHome('good') || 'Good'}</option>
                <option value="fair">{tHome('fair') || 'Fair'}</option>
                <option value="worn">{tHome('worn') || 'Worn'}</option>
              </select>
              <button type="submit" className="bg-[#FF5722] text-white px-4 py-1.5 text-sm rounded-lg font-medium hover:bg-[#E64A19] transition-colors shadow-sm">{tHome('apply') || 'Apply'}</button>
            </form>
          </div>
        </div>
      )}
      <CategoryNav />
    </header>
  )
}

export default function SiteHeader() {
  return (
    <Suspense fallback={null}>
      <SiteHeaderInner />
    </Suspense>
  )
}