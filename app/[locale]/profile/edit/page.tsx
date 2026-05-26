'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) ?? 'en'
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    location: '',
    bio: '',
    phone: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/${locale}/auth/login`)
        return
      }
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('full_name, username, location, bio, phone, avatar_url')
        .eq('id', user.id)
        .single()

      if (data) {
        setForm({
          full_name: data.full_name || '',
          username: data.username || '',
          location: data.location || '',
          bio: data.bio || '',
          phone: data.phone || '',
        })
        setAvatarUrl(data.avatar_url || null)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setSaving(false)
      return
    }

    let newAvatarUrl = avatarUrl

    // Upload avatar if a new one was selected
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const fileName = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true })

      if (uploadError) {
        setError('Failed to upload avatar: ' + uploadError.message)
        setSaving(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      newAvatarUrl = publicUrl
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ...form, avatar_url: newAvatarUrl })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push(`/${locale}/profile`)
    router.refresh()
  }

  if (loading) return <div className="p-8 text-center">Loading profile...</div>

  const displayAvatar = avatarPreview || avatarUrl

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Edit Profile</h1>

        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

        <form onSubmit={onSave} className="space-y-5">

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity border-2 border-dashed border-orange-300 shrink-0"
            >
              {displayAvatar ? (
                <img src={displayAvatar} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <span className="text-3xl text-[#FF5722]">{form.full_name?.[0] || '?'}</span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-[#FF5722] hover:underline font-medium"
              >
                Change profile photo
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF. Max 5MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
              placeholder="e.g. Paris, France"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
              placeholder="Tell buyers a bit about yourself..."
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#FF5722] text-white px-6 py-2 rounded-lg hover:bg-[#E64A19] disabled:opacity-60 text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/profile`)}
              className="border border-gray-200 px-6 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}