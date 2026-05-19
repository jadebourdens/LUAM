'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, username, location, bio, phone')
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
      }
      setLoading(false)
    }

    load()
  }, [router, supabase])

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

    const { error: updateError } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  if (loading) return <div className="p-8">Loading profile...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <form onSubmit={onSave} className="space-y-4">
          <input className="w-full border rounded px-3 py-2" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <textarea className="w-full border rounded px-3 py-2" placeholder="Bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-[#FF5722] text-white px-4 py-2 rounded hover:bg-[#E64A19] disabled:opacity-60">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" onClick={() => router.push('/profile')} className="border px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
