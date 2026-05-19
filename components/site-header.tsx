'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const categories = [
  { label: 'Women', slug: 'women' },
  { label: 'Men', slug: 'men' },
  { label: 'Art & Design', slug: 'designer' },
  { label: 'Kids', slug: 'kids' },
  { label: 'Home', slug: 'home' },
  { label: 'Electronics', slug: 'electronics' },
  { label: 'Beauty', slug: 'beauty' },
  { label: 'Entertainment', slug: 'entertainment' },
]

const subCategories: Record<string, { label: string; slug: string }[]> = {
  women: [
    { label: 'Clothing', slug: 'women-clothing' },
    { label: 'Shoes', slug: 'women-shoes' },
    { label: 'Bags', slug: 'women-bags' },
    { label: 'Accessories', slug: 'women-accessories' },
  ],
  men: [
    { label: 'Clothing', slug: 'men-clothing' },
    { label: 'Shoes', slug: 'men-shoes' },
    { label: 'Accessories', slug: 'men-accessories' },
    { label: 'Watches', slug: 'men-watches' },
  ],
}

const LANGUAGES = [
  { code: 'EN', label: 'English' },
  { code: 'VI', label: 'Tiếng Việt' },
]

function getParentSlug(slug: string): string | null {
  if (subCategories[slug]) return slug
  for (const [parent, kids] of Object.entries(subCategories)) {
    if (kids.some((k) => k.slug === slug)) return parent
  }
  return null
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-stone-700 hover:text-[#FF5722] hover:bg-stone-100 transition-colors"
    >
      {children}
    </Link>
  )
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function MessageIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg {...iconProps} width={16} height={16}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function LanguagePicker() {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState('EN')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('luam-lang') : null
    if (stored && LANGUAGES.some((l) => l.code === stored)) setLang(stored)
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const choose = (code: string) => {
    setLang(code)
    if (typeof window !== 'undefined') localStorage.setItem('luam-lang', code)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
        title="Language"
        className="inline-flex items-center gap-1 h-9 px-2 rounded-full text-stone-700 hover:text-[#FF5722] hover:bg-stone-100 transition-colors text-xs font-medium"
      >
        <GlobeIcon />
        <span>{lang}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-stone-200 rounded-md shadow-lg py-1 z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => choose(l.code)}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-stone-50 ${
                l.code === lang ? 'text-[#FF5722] font-medium' : 'text-stone-700'
              }`}
            >
              <span className="font-mono text-xs mr-2">{l.code}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SiteHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category') || ''
  const parentSlug = getParentSlug(selectedCategory)
  const subRow = parentSlug ? subCategories[parentSlug] : null
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    loadUser()
  }, [pathname])

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:gap-3">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight select-none whitespace-nowrap"
          >
            <span className="text-stone-900">lu</span>
            <span className="text-[#FF5722]">a</span>
            <span className="text-stone-900">m</span>
          </Link>

          <form action="/" method="get" className="w-full sm:w-auto sm:flex-1 max-w-sm lg:max-w-md flex gap-2">
            <input
              type="text"
              name="q"
              placeholder="Search"
              className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm"
            />
            <button type="submit" className="bg-[#FF5722] text-white px-3 py-1.5 text-sm rounded-lg hover:bg-[#E64A19]">Search</button>
          </form>

          <div className="w-full lg:w-auto lg:ml-auto flex flex-wrap items-center gap-1 justify-start lg:justify-end">
            {user ? (
              <>
                <Link
                  href="/listings/new"
                  className="inline-flex items-center gap-1 bg-[#FF5722] text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-[#E64A19] mr-1"
                >
                  <PlusIcon />
                  Sell
                </Link>
                <IconLink href="/messages" label="Messages"><MessageIcon /></IconLink>
                <IconLink href="/favorites" label="Wishlist"><HeartIcon /></IconLink>
                <IconLink href="/orders" label="My orders"><BagIcon /></IconLink>
                <IconLink href="/profile" label="My account"><UserIcon /></IconLink>
                <LanguagePicker />
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1.5 ml-1"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <LanguagePicker />
                <Link href="/auth/login" className="text-sm text-stone-700 hover:text-stone-900 px-2">Sign In</Link>
                <Link href="/auth/signup" className="bg-[#FF5722] text-white text-sm px-3 py-1.5 rounded-md hover:bg-[#E64A19]">Sign Up</Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => {
            const isActive = c.slug === parentSlug
            return (
              <Link
                key={c.slug}
                href={`/?category=${c.slug}`}
                className={`text-sm px-3 py-1.5 rounded-full ${
                  isActive
                    ? 'bg-[#FF5722] text-white hover:bg-[#E64A19]'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {c.label}
              </Link>
            )
          })}
        </div>

        {subRow && (
          <div className="mt-2 flex flex-wrap gap-2 pl-2 border-l-2 border-orange-200">
            {subRow.map((s) => {
              const isActive = s.slug === selectedCategory
              return (
                <Link
                  key={s.slug}
                  href={`/?category=${s.slug}`}
                  className={`text-xs px-3 py-1 rounded-full ${
                    isActive
                      ? 'bg-orange-100 text-[#E64A19] border border-orange-300'
                      : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  {s.label}
                </Link>
              )
            })}
          </div>
        )}

      </div>
    </header>
  )
}
