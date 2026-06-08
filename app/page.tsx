import Link from 'next/link'
import { redirect } from 'next/navigation'
import Logo from '@/components/Logo'
import LogoutButton from '@/components/LogoutButton'
import InstallButton from '@/components/InstallButton'
import { getSession } from '@/lib/current-user'
import { getVisibleProducts, type VisibleProduct } from '@/lib/members'

export const dynamic = 'force-dynamic'

function ProductCard({ product }: { product: VisibleProduct }) {
  const locked = !product.unlocked
  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition ${
        locked
          ? 'border-[var(--border)] bg-[var(--background)]'
          : 'border-[var(--border)] bg-card hover:shadow-md'
      }`}
    >
      <div>
        <h3 className="pr-7 text-base font-semibold leading-snug text-[var(--foreground)]">
          {product.title}
        </h3>
        {locked && (
          <span className="absolute right-3 top-3 text-lg" aria-label="Bloqueado" title="Bloqueado">
            🔒
          </span>
        )}
      </div>
      <div className="mt-4">
        {locked ? (
          <span className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--border)]/60 px-4 py-2.5 text-sm font-medium text-[var(--muted)]">
            Bloqueado
          </span>
        ) : (
          <Link
            href={`/produto/${product.slug}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          >
            Acessar
          </Link>
        )}
      </div>
    </div>
  )
}

function Section({ title, products }: { title: string; products: VisibleProduct[] }) {
  if (!products.length) return null
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--brand-strong)]">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const products = await getVisibleProducts(session.mid)
  const main = products.filter((p) => p.kind === 'main')
  const bonus = products.filter((p) => p.kind === 'bonus')
  const bumps = products.filter((p) => p.kind === 'bump')

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-6">
      <header className="flex items-center justify-between gap-3">
        <Logo size={56} />
        <div className="flex items-center gap-2">
          <InstallButton />
          <LogoutButton />
        </div>
      </header>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-card p-4">
        <p className="text-sm text-[var(--muted)]">Bem-vinda de volta 💕</p>
        <p className="truncate text-base font-semibold text-[var(--brand-strong)]">{session.email}</p>
      </div>

      <Section title="Seu produto" products={main} />
      <Section title="Bônus inclusos" products={bonus} />
      <Section title="Módulos extras" products={bumps} />
    </main>
  )
}
