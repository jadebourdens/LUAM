// components/sellers/seller-link.tsx
// Usage: <SellerLink seller={listing.seller} locale={locale} />
// Renders: clickable seller name that navigates to /[locale]/sellers/[username]

import Link from 'next/link'
import { Profile } from '@/types/database'

interface Props {
  seller: Pick<Profile, 'id' | 'username' | 'full_name' | 'brand_name'>
  locale: string
  className?: string
}

export default function SellerLink({ seller, locale, className = '' }: Props) {
  const displayName = seller.brand_name || seller.full_name || seller.username
  if (!displayName || !seller.username) return null

  return (
    <Link
      href={`/${locale}/sellers/${seller.username}`}
      className={`text-sm font-semibold tracking-wide uppercase hover:underline underline-offset-2 transition-colors text-stone-500 hover:text-stone-900 ${className}`}
    >
      {displayName}
    </Link>
  )
}