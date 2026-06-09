import type { Listing } from '@/types/database'
export function formatPrice(listing: Pick<Listing, 'currency' | 'price_vnd' | 'price_usd' | 'price_eur'>): string {
  if (listing.price_vnd != null) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(listing.price_vnd)
  }
  if (listing.price_eur != null) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(listing.price_eur)
  }
  if (listing.price_usd != null) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(listing.price_usd)
  }
  return '—'
}

