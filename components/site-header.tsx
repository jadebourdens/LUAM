'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, Suspense } from 'react'
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
  women:            '👗',
  men:              '👔',
  kids:             '🧸',
  home:             '🏠',
  'art-collectibles': '🎨',
}

const STATIC_CATEGORIES = [
  {
    slug: 'women',
    label: { en: 'Women', vi: 'Nữ' },
    children: [
      { slug: 'women-clothes',      label: { en: 'Clothes',                       vi: 'Quần áo' } },
      { slug: 'women-shoes',        label: { en: 'Shoes',                         vi: 'Giày dép' } },
      { slug: 'women-bags',         label: { en: 'Bags',                          vi: 'Túi xách' } },
      { slug: 'women-accessories',  label: { en: 'Accessories / Watches / Jewelry', vi: 'Phụ kiện / Đồng hồ / Trang sức' } },
    ],
  },
  {
    slug: 'men',
    label: { en: 'Men', vi: 'Nam' },
    children: [
      { slug: 'men-clothes',      label: { en: 'Clothes',                       vi: 'Quần áo' } },
      { slug: 'men-shoes',        label: { en: 'Shoes',                         vi: 'Giày dép' } },
      { slug: 'men-bags',         label: { en: 'Bags',                          vi: 'Túi xách' } },
      { slug: 'men-accessories',  label: { en: 'Accessories / Watches / Jewelry', vi: 'Phụ kiện / Đồng hồ / Trang sức' } },
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
      { slug: 'home-textiles',   label: { en: 'Textiles & Bedding', vi: 'Vải & Chăn ga' } },
      { slug: 'home-furniture',  label: { en: 'Furniture',          vi: 'Nội thất' } },
      { slug: 'home-lighting',   label: { en: 'Lighting',           vi: 'Đèn' } },
      { slug: 'home-kitchen',    label: { en: 'Kitchen & Dining',   vi: 'Bếp & Ăn uống' } },
      { slug: 'home-decor',      label: { en: 'Decor',              vi: 'Trang trí' } },
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
  const [open, setOpen]   = useState(false)
  const pathname          = usePathname()
  const ref               = useRef<HTMLDivElement>(null)
  const currentLocale     = pathname.startsWith('/vi') ? 'VI' : 'EN'

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const getLocalePath = (code: string) => {
    const locale   = code.toLowerCase()
    const stripped = pathname.replace(/^\/(en|vi)/, '') || '/'
    return `/${locale}${stripped}`
  }

  return (
    <div className="relative" ref={ref} style={{ zIndex: 9999 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 h-9 px-2 rounded-full text-stone-700 hover:text-[#FF5722] hover:bg-stone-100 transition-colors text-xs font-medium"
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
// CategoryNav (Mega Menu)
// ─────────────────────────────────────────────

function CategoryNav() {
  const pathname    = usePathname()
  const locale      = pathname.startsWith('/vi') ? 'vi' : 'en'
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

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
            const hasSub  = cat.children.length > 0
            const isActive = activeSlug === cat.slug
            const label   = locale === 'vi' ? cat.label.vi : cat.label.en

            return (
              <li
                key={cat.slug}
                className="relative flex-shrink-0"
                onMouseEnter={() => handleMouseEnter(cat.slug)}
                onMouseLeave={handleMouseLeave}
              >
                {/* ── Main category tab ── */}
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

                {/* ── Mega-menu dropdown ── */}
                {hasSub && isActive && (
                  <div
                    className="absolute top-full left-0 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden"
                    style={{ minWidth: 240, zIndex: 200 }}
                    onMouseEnter={() => handleMouseEnter(cat.slug)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Header */}
                    <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[cat.slug]}</span>
                      <span className="text-sm font-semibold text-stone-800">{label}</span>
                    </div>

                    {/* Sub-category list */}
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

                    {/* Footer CTA */}
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
// SiteHeader (inner)
// ─────────────────────────────────────────────

function SiteHeaderInner() {
  const pathname        = usePathname()
  const t               = useTranslations('Nav')
  const [user, setUser] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const locale          = pathname.startsWith('/vi') ? 'vi' : 'en'
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    const loadUserAndMessages = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        setUnreadCount(0)
        return
      }

      // Count unread messages where current user is receiver
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUser.id)
        .eq('read', false)

      setUnreadCount(count || 0)

      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current)

      subscriptionRef.current = supabase
        .channel(`unread-messages-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event:  'INSERT',
            schema: 'public',
            table:  'chat_messages',
          },
          (payload) => {
            if (payload.new && payload.new.receiver_id === currentUser.id && !payload.new.read) {
              setUnreadCount((prev) => prev + 1)
            }
          },
        )
        .subscribe()
    }

    loadUserAndMessages()

    return () => {
      subscription.unsubscribe()
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [pathname])

  return (
    <header
      className="bg-white shadow-md border-b border-stone-100 sticky top-0"
      style={{ zIndex: 9000 }}
    >
      {/* ── Top bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:gap-3">

          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="text-2xl font-black tracking-tight select-none whitespace-nowrap"
          >
            <span className="text-stone-900">lu</span>
            <span className="text-[#FF5722]">a</span>
            <span className="text-stone-900">m</span>
          </Link>

          {/* Search */}
          <form
            action={`/${locale}`}
            method="get"
            className="w-full sm:w-auto sm:flex-1 max-w-sm lg:max-w-md flex flex-nowrap items-center gap-2"
          >
            <input
              type="text"
              name="q"
              placeholder={t('search')}
              className="w-full border border-stone-200 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
            />
            <button
              type="submit"
              className="bg-[#FF5722] text-white px-4 py-1.5 text-sm rounded-full hover:bg-[#E64A19] transition-colors whitespace-nowrap"
            >
              {t('search')}
            </button>
          </form>

          {/* Action icons */}
          <div className="w-full lg:w-auto lg:ml-auto flex flex-wrap items-center gap-1 justify-start lg:justify-end">
            {user ? (
              <>
                <Link
                  href={`/${locale}/listings/new`}
                  className="inline-flex items-center gap-1 bg-[#FF5722] text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-[#E64A19] transition-colors shadow-sm mr-1"
                >
                  <PlusIcon /> {t('sell')}
                </Link>

                <IconLink href={`/${locale}/messages`} label={t('messages')} badge={unreadCount}>
                  <MessageIcon />
                </IconLink>
                <IconLink href={`/${locale}/favorites`} label={t('wishlist')}>
                  <HeartIcon />
                </IconLink>
                <IconLink href={`/${locale}/orders`} label={t('orders')}>
                  <BagIcon />
                </IconLink>
                <IconLink href={`/${locale}/profile`} label={t('account')}>
                  <UserIcon />
                </IconLink>

                <LanguagePicker />

                <form action={`/${locale}/auth/signout`} method="post">
                  <button
                    type="submit"
                    className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1.5 ml-1"
                  >
                    {t('signout')}
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
                  {t('signin')}
                </Link>
                <Link
                  href={`/${locale}/auth/signup`}
                  className="bg-[#FF5722] text-white text-sm px-4 py-1.5 rounded-full hover:bg-[#E64A19] transition-colors shadow-sm"
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Category nav ── */}
      <CategoryNav />
    </header>
  )
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export default function SiteHeader() {
  return (
    <Suspense fallback={null}>
      <SiteHeaderInner />
    </Suspense>
  )
}