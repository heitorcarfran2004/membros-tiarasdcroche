'use client'

import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Não foi possível entrar. Tente novamente.')
        setLoading(false)
        return
      }
      const next = new URLSearchParams(window.location.search).get('next') || '/'
      window.location.href = next.startsWith('/') ? next : '/'
    } catch {
      setError('Falha de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium text-[var(--brand-strong)]">
        Email da compra
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-1 w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)] disabled:opacity-60"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="text-center text-xs text-[var(--muted)]">
        Use o mesmo email que você usou na compra.
      </p>
    </form>
  )
}
