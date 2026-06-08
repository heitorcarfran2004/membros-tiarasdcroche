import Link from 'next/link'
import { redirect } from 'next/navigation'
import Logo from '@/components/Logo'
import { getSession } from '@/lib/current-user'
import { getVisibleProductBySlug } from '@/lib/members'

export const dynamic = 'force-dynamic'

// Next 16: params é uma Promise.
export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const session = await getSession()
  if (!session) redirect('/login')

  const product = await getVisibleProductBySlug(session.mid, slug)

  // Produto inexistente OU bloqueado → manda de volta pro painel.
  if (!product) redirect('/')

  if (!product.unlocked) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10 text-center">
        <Logo size={64} className="mx-auto mb-6" />
        <div className="rounded-3xl border border-[var(--border)] bg-card p-8">
          <div className="mb-3 text-4xl">🔒</div>
          <h1 className="text-lg font-bold text-[var(--brand-strong)]">Módulo bloqueado</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Você ainda não tem acesso a <strong>{product.title}</strong>.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-[var(--brand-strong)]">
          ← Voltar
        </Link>
        <Logo size={44} />
      </div>

      <h1 className="mt-5 text-2xl font-bold text-[var(--brand-strong)]">{product.title}</h1>

      {/* PLACEHOLDER — Fase 2: aqui entram os módulos/aulas/player/feedback. */}
      <div className="mt-6 rounded-3xl border border-dashed border-[var(--border)] bg-card p-10 text-center">
        <div className="mb-3 text-4xl">🧶</div>
        <p className="text-base font-semibold text-[var(--foreground)]">Aulas em breve</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
          O conteúdo deste módulo está sendo preparado e aparecerá aqui em breve. Você já tem o
          acesso liberado. 💕
        </p>
      </div>
    </main>
  )
}
