'use client'

export default function LogoutButton() {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/login'
  }
  return (
    <button
      onClick={logout}
      className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--brand-strong)] transition hover:bg-[var(--background)]"
    >
      Sair
    </button>
  )
}
