'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Currency, ListingCondition } from '@/types/database'
import { useTranslations } from 'next-intl'

const CATEGORIES: { label: string; slug: string; indent?: boolean }[] = [
  { label: 'Women', slug: 'women' },
  { label: 'Clothing', slug: 'women-clothing', indent: true },
  { label: 'Shoes', slug: 'women-shoes', indent: true },
  { label: 'Bags', slug: 'women-bags', indent: true },
  { label: 'Accessories', slug: 'women-accessories', indent: true },
  { label: 'Men', slug: 'men' },
  { label: 'Clothing', slug: 'men-clothing', indent: true },
  { label: 'Shoes', slug: 'men-shoes', indent: true },
  { label: 'Accessories', slug: 'men-accessories', indent: true },
  { label: 'Watches', slug: 'men-watches', indent: true },
  { label: 'Art & Design', slug: 'designer' },
  { label: 'Kids', slug: 'kids' },
  { label: 'Home', slug: 'home' },
  { label: 'Furniture', slug: 'home-furniture', indent: true },
  { label: 'Lighting', slug: 'home-lighting', indent: true },
  { label: 'Decor', slug: 'home-decor', indent: true },
  { label: 'Kitchen & Dining', slug: 'home-kitchen', indent: true },
  { label: 'Textiles & Bedding', slug: 'home-textiles', indent: true },
  { label: 'Storage & Organisation', slug: 'home-storage', indent: true },
  { label: 'Garden & Outdoor', slug: 'home-garden', indent: true },
  { label: 'Art & Prints', slug: 'home-art', indent: true },
  { label: 'Electronics', slug: 'electronics' },
  { label: 'Beauty', slug: 'beauty' },
  { label: 'Entertainment', slug: 'entertainment' },
]

const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'New with tags' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'worn', label: 'Worn' },
]

export default function EditListingPage() {
  const t = useTranslations('EditListing')
  const params = useParams()
  const listingId = params.id as string
  const locale = params.locale as string
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [isHandcrafted, setIsHandcrafted] = useState(false)
  const [isArtisanal, setIsArtisanal] = useState(false)
  const [condition, setCondition] = useState<ListingCondition>('good')
  const [size, setSize] = useState('')
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [categorySlug, setCategorySlug] = useState<string>('')

  const [existingImages, setExistingImages] = useState<any[]>([])
  const [newImages, setNewImages] = useState<File[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*, category:categories(slug), images:listing_images(id, image_url, position)')
        .eq('id', listingId)
        .single()

      if (error) {
        setError(t('error_load'))
        setLoading(false)
        return
      }

      setTitle(data.title)
      setDescription(data.description || '')
      setPrice(data.currency === 'USD' ? data.price_usd.toString() : data.price_vnd.toString())
      setCurrency(data.currency)
      setIsHandcrafted(data.is_handcrafted || false)
      setIsArtisanal(data.is_artisanal || false)
      setCondition(data.condition)
      setSize(data.size || '')
      setBrand(data.brand || '')
      setColor(data.color || '')
      setCategorySlug(data.category?.slug || '')
      setExistingImages(data.images || [])
      setLoading(false)
    }
    fetchListing()
  }, [listingId])

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages([...newImages, ...Array.from(e.target.files)])
    }
  }

  const removeExistingImage = async (imageId: string) => {
    const { error } = await supabase.from('listing_images').delete().eq('id', imageId)
    if (!error) setExistingImages(existingImages.filter(img => img.id !== imageId))
  }

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const priceNum = parseFloat(price)
      let priceEur = 0, priceUsd = 0, priceVnd = 0
      if (currency === 'USD') {
        priceUsd = priceNum
        priceEur = priceNum / 1.08
        priceVnd = priceNum * 25000
      } else {
        priceVnd = priceNum
        priceEur = priceNum / 27000
        priceUsd = priceNum / 25000
      }

      let categoryId = null
      if (categorySlug) {
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single()
        categoryId = catData?.id || null
      }

      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title, description, price_eur: priceEur, price_usd: priceUsd, price_vnd: priceVnd,
          currency, is_handcrafted: isHandcrafted, is_artisanal: isArtisanal, condition,
          size: size || null, brand: brand || null, color: color || null,
          ...(categoryId ? { category_id: categoryId } : {}),
        })
        .eq('id', listingId)

      if (updateError) throw updateError

      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i]
        const fileName = `${listingId}/${Date.now()}-${i}.${file.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage.from('listings').upload(fileName, file)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(fileName)
        const { error: imgError } = await supabase.from('listing_images').insert({
          listing_id: listingId, image_url: publicUrl, position: existingImages.length + i
        })
        if (imgError) throw imgError
      }

      router.push(`/${locale}/listings/${listingId}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <div className="p-12 text-center">{t('loading')}</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
          {error && <div className="mb-4 text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('form.photos')}</label>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {existingImages.map(img => (
                  <div key={img.id} className="relative">
                    <img src={img.image_url} className="w-full h-24 object-cover rounded" />
                    <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                  </div>
                ))}
                {newImages.map((file, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded" />
                    <button type="button" onClick={() => removeNewImage(i)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                  </div>
                ))}
              </div>
              <input type="file" multiple accept="image/*" onChange={handleNewImageChange} className="block w-full text-sm" />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium">{t('form.title')}</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium">{t('form.description')}</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded" />
              <div className="flex gap-6 py-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={isHandcrafted} onChange={(e) => setIsHandcrafted(e.target.checked)} className="rounded border-gray-300 text-[#FF5722] focus:ring-[#FF5722]" />
                  <span className="text-sm">{t('form.handcrafted')}</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={isArtisanal} onChange={(e) => setIsArtisanal(e.target.checked)} className="rounded border-gray-300 text-[#FF5722] focus:ring-[#FF5722]" />
                  <span className="text-sm">{t('form.artisanal')}</span>
                </label>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.indent ? `    ${c.label}` : c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition *</label>
              <select
                required
                value={condition}
                onChange={(e) => setCondition(e.target.value as ListingCondition)}
                className="w-full px-3 py-2 border rounded"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium mb-1">Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. M, 38, One size"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            {/* Brand & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>

            {/* Price & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">{t('form.price')}</label>
                <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">{t('form.currency')}</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="w-full px-3 py-2 border rounded">
                  <option value="USD">USD ($)</option>
                  <option value="VND">VND (₫)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded">{t('cancel')}</button>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-[#FF5722] text-white rounded">{saving ? t('saving') : t('save')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}