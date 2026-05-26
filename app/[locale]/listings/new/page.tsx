'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Currency, ListingCondition } from '@/types/database'

export default function NewListingPage() {
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
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const CATEGORY_OPTIONS: { label: string; slug: string; indent?: boolean }[] = [
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      if (files.length + images.length > 8) {
        setError('Maximum 8 images allowed')
        return
      }
      setImages([...images, ...files])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to create a listing')
        setLoading(false)
        return
      }

      // Calculate prices in all currencies
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

      // Resolve category slug → DB UUID (null if categories table not seeded yet)
      let resolvedCategoryId: string | null = null
      if (categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle()
        resolvedCategoryId = cat?.id ?? null
      }

      // Create listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title,
          description,
          price_eur: priceEur,
          price_usd: priceUsd,
          price_vnd: priceVnd,
          currency,
          is_handcrafted: isHandcrafted,
          is_artisanal: isArtisanal,
          condition,
          size: size || null,
          brand: brand || null,
          color: color || null,
          category_id: resolvedCategoryId,
          status: 'active',
        })
        .select()
        .single()

      if (listingError) throw new Error(`Creating listing failed: ${listingError.message}`)

      // Upload images
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${listing.id}/${Date.now()}-${i}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('listings')
            .upload(fileName, file)

          if (uploadError) throw new Error(`Uploading image to storage failed: ${uploadError.message}`)

          const { data: { publicUrl } } = supabase.storage
            .from('listings')
            .getPublicUrl(fileName)

          const { error: imgRowError } = await supabase
            .from('listing_images')
            .insert({
              listing_id: listing.id,
              image_url: publicUrl,
              position: i,
            })

          if (imgRowError) throw new Error(`Saving image row failed: ${imgRowError.message}`)
        }
      }

      const locale = window.location.pathname.split('/')[1]
      router.push(`/${locale}/listings/${listing.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">List an Item</h1>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (max 8)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#E64A19] hover:file:bg-orange-100"
              />
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF5722] focus:border-[#FF5722]"
                placeholder="e.g., Blue Nike Running Shoes"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF5722] focus:border-[#FF5722]"
                placeholder="Describe your item..."
              />
            </div>

            {/* Price and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  id="price"
                  required
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF5722] focus:border-[#FF5722]"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF5722] focus:border-[#FF5722]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="VND">VND (₫)</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF5722] focus:border-[#FF5722]"
              >
                <option value="">Select a category…</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.indent ? `    ${c.label}` : c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <div className="space-y-3 mb-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHandcrafted}
                    onChange={(e) => setIsHandcrafted(e.target.checked)}
                    className="mt-1 h-4 w-4 text-[#FF5722] focus:ring-[#FF5722] border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Handcrafted</span>
                    <p className="text-xs text-gray-500">Made manually with skill, often individually produced.</p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isArtisanal}
                    onChange={(e) => setIsArtisanal(e.target.checked)}
                    className="mt-1 h-4 w-4 text-[#FF5722] focus:ring-[#FF5722] border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Artisanal</span>
                    <p className="text-xs text-gray-500">Produced using traditional, non-mass methods.</p>
                  </div>
                </label>
              </div>

              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                Condition *
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as ListingCondition)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF5722] focus:border-[#FF5722]"
              >
                <option value="new">New with tags</option>
                <option value="like_new">Like new</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="worn">Worn</option>
              </select>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <input
                  type="text"
                  id="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF5722] focus:border-[#FF5722]"
                  placeholder="e.g., M, 42"
                />
              </div>
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF5722] focus:border-[#FF5722]"
                  placeholder="e.g., Nike"
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF5722] focus:border-[#FF5722]"
                  placeholder="e.g., Blue"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#FF5722] text-white rounded-md hover:bg-[#E64A19] disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'List Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
