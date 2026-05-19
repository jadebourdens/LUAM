import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

// Currency conversion rates (you'll want to update these regularly or use an API)
export const CURRENCY_RATES = {
  EUR: 1,
  USD: 1.08,
  VND: 27000,
}

// Calculate platform fee (5%)
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * 0.05)
}

// Convert amount between currencies
export function convertCurrency(
  amount: number,
  fromCurrency: 'EUR' | 'USD' | 'VND',
  toCurrency: 'EUR' | 'USD' | 'VND'
): number {
  const amountInEUR = amount / CURRENCY_RATES[fromCurrency]
  return Math.round(amountInEUR * CURRENCY_RATES[toCurrency])
}

// Get smallest currency unit (cents for EUR/USD, dong for VND)
export function toSmallestUnit(amount: number, currency: 'EUR' | 'USD' | 'VND'): number {
  if (currency === 'VND') {
    return Math.round(amount) // VND doesn't have subunits
  }
  return Math.round(amount * 100) // Convert to cents
}

// Convert from smallest unit back to main unit
export function fromSmallestUnit(amount: number, currency: 'EUR' | 'USD' | 'VND'): number {
  if (currency === 'VND') {
    return amount
  }
  return amount / 100
}
