import Stripe from 'stripe'

export const CURRENCY_RATES = {
  EUR: 1,
  USD: 1.08,
  VND: 27000,
}

export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * 0.05)
}

export function convertCurrency(
  amount: number,
  fromCurrency: 'EUR' | 'USD' | 'VND',
  toCurrency: 'EUR' | 'USD' | 'VND'
): number {
  const amountInEUR = amount / CURRENCY_RATES[fromCurrency]
  return Math.round(amountInEUR * CURRENCY_RATES[toCurrency])
}

export function toSmallestUnit(amount: number, currency: 'EUR' | 'USD' | 'VND'): number {
  if (currency === 'VND') return Math.round(amount)
  return Math.round(amount * 100)
}

export function fromSmallestUnit(amount: number, currency: 'EUR' | 'USD' | 'VND'): number {
  if (currency === 'VND') return amount
  return amount / 100
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia' as any,
    typescript: true,
  })
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})