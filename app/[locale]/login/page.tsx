'use client'

import { useActionState } from 'react'

export default function LoginForm({ login }: { login: (formData: FormData) => Promise<any> }) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    return await login(formData)
  }, null)

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form action={formAction} className="space-y-4">
        <input name="email" type="email" placeholder="Email" required className="w-full p-2 border border-stone-300 rounded" />
        <input name="password" type="password" placeholder="Password" required className="w-full p-2 border border-stone-300 rounded" />
        {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
        <button type="submit" className="w-full bg-stone-900 text-white p-2 rounded">Login</button>
      </form>
    </div>
  )
}