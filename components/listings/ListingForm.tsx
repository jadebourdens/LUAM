'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Currency, ListingCondition } from '@/types/database'

export default function ListingForm({ locale, initialData }: { locale: string, initialData?: any }) {
  const t = useTranslations('EditListing')
  const router = useRouter()
  const supabase = createClient()

  // Initialize state with initialData (if provided) or defaults using optional chaining
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [price, setPrice] = useState(
    initialData 
      ? (initialData?.currency === 'USD' 
          ? initialData?.price_usd?.toString() 
          : initialData?.price_vnd?.toString()) 
      : ''
  )
  const [currency, setCurrency] = useState<Currency>(initialData?.currency || 'USD')
  const [isHandcrafted, setIsHandcrafted] = useState(initialData?.is_handcrafted || false)
  const [isArtisanal, setIsArtisanal] = useState(initialData?.is_artisanal || false)
  const [condition, setCondition] = useState<ListingCondition>(initialData?.condition || 'good')
  const [categorySlug, setCategorySlug] = useState(initialData?.category?.slug || '')
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const priceNum = parseFloat(price)
      // Object mapping using column_name: variable_name syntax
      const payload = {
        title: title, 
        description: description, 
        currency: currency, 
        condition: condition,
        is_handcrafted: isHandcrafted, 
        is_artisanal: isArtisanal,
        price_usd: currency === 'USD' ? priceNum : priceNum / 25000,
        price_vnd: currency === 'VND' ? priceNum : priceNum * 25000
      }

      if (initialData) {
        const { error } = await supabase
          .from('listings')
          .update(payload)
          .eq('id', initialData.id)
        
        if (error) throw error
        router.push(`/${locale}/listings/${initialData.id}`)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not found')

        const { data, error } = await supabase
          .from('listings')
          .insert([{
            ...payload,
            user_id: user.id
          }])
          .select()
          .single()

        if (error) throw error
        router.push(`/${locale}/listings/${data.id}`)
      }
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-[#FF5722] text-white rounded">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}