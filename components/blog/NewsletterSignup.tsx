'use client'

import { useState } from 'react'

export function NewsletterSignup() {
  const [status, setStatus] = useState<'idle' | 'success'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('success')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
      <h3 className="text-sm font-semibold text-neutral-900 mb-2">Stay Updated</h3>
      <p className="text-xs text-neutral-500 mb-4">Get fresh articles delivered to your inbox.</p>

      {status === 'success' ? (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          Thanks for your interest! Coming soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:border-[#F5831F]"
            required
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#F5831F] text-white text-sm font-semibold rounded-lg hover:bg-[#E87A1E] transition"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  )
}
