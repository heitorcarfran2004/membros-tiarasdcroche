import Link from 'next/link'
import { redirect } from 'next/navigation'
import Logo from '@/components/Logo'
import LogoutButton from '@/components/LogoutButton'
import InstallButton from '@/components/InstallButton'
import { getSession } from '@/lib/current-user'
import { getVisibleProducts, type VisibleProduct } from '@/lib/members'

export const dynamic = 'force-dynamic'

/* eslint-disable @next/next/no-img-element */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
      <span className="inline-block h-3.5 w-1 rounded-full bg-[var(--brand)]" />
      {children}
    </h2>
  )
}

function LiberadoTag() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--success)]">
      <span className="inline-block h-2 w-2 rounded-full bg-[var(--success)]" />
      Liberado
    </span>
  )
}

function LockedTag() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand-strong)]">
      🔒 Compre para liberar
    </span>
  )
}

function ProductImage({ product, className = '' }: { product: VisibleProduct; className?: string }) {
  const locked = !product.unlocked
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-[#ffd9e6] to-[#ffeef4] ${className}`}>
      {product.image_path ? (
        <img
          src={product.image_path}
          alt={product.title}
          loading="lazy"
          className={`h-full w-full object-cover transition duration-500 ${
            locked ? 'grayscale-[0.95] brightness-95' : ''
          }`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-4xl">🧶</div>
      )}
      {locked && <div className="absolute inset-0 bg-white/30" />}
    </div>
  )
}

function AccessButton({ slug }: { slug: string }) {
  return (
    <Link
      href={`/produto/${slug}`}
      className="font-display inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm shadow-[var(--brand)]/30 transition hover:bg-[var(--brand-strong)] active:scale-[0.99]"
    >
      Acessar
    </Link>
  )
}

function UnlockButton({ url }: { url: string | null }) {
  return (
    <a
      href={url ?? '#'}
      {...(url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="font-display inline-flex w-full items-center justify-center rounded-xl bg-[var(--locked)] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-110 active:scale-[0.99]"
    >
      🔓 Desbloquear
    </a>
  )
}

function HeroCard({ product }: { product: VisibleProduct }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-card shadow-md shadow-[var(--brand)]/10">
      <div className="relative">
        <ProductImage product={product} className="aspect-[16/10] w-full" />
        <span className="font-display absolute right-3 top-3 rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
          Principal
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-[var(--foreground)]">{product.title}</h3>
        <div className="mt-1.5">
          <LiberadoTag />
        </div>
        <div className="mt-4">
          <AccessButton slug={product.slug} />
        </div>
      </div>
    </div>
  )
}

function BonusCard({ product }: { product: VisibleProduct }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-card p-3 shadow-sm transition hover:shadow-md">
      <ProductImage product={product} className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <h3 className="font-display line-clamp-2 text-base font-bold leading-tight text-[var(--foreground)]">
          {product.title}
        </h3>
        <div className="mt-1">
          <LiberadoTag />
        </div>
      </div>
      <Link
        href={`/produto/${product.slug}`}
        className="font-display shrink-0 rounded-xl bg-[var(--brand)] px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[var(--brand-strong)]"
      >
        Acessar
      </Link>
    </div>
  )
}

function GridCard({ product }: { product: VisibleProduct }) {
  const locked = !product.unlocked
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md ${
        locked ? 'border-[var(--border)]' : 'border-[var(--border)]'
      }`}
    >
      <ProductImage product={product} className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="font-display text-sm font-bold leading-snug text-[var(--foreground)]">{product.title}</h3>
        <div className="mt-1.5">{locked ? <LockedTag /> : <LiberadoTag />}</div>
        <div className="mt-3">
          {locked ? <UnlockButton url={product.checkout_url} /> : <AccessButton slug={product.slug} />}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const products = await getVisibleProducts(session.mid)
  const main = products.find((p) => p.kind === 'main')
  const bonus = products.filter((p) => p.kind === 'bonus')
  const bumps = products.filter((p) => p.kind === 'bump')

  const total = products.length
  const liberados = products.filter((p) => p.unlocked).length

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5">
      <header className="flex items-center justify-between gap-3">
        <Logo size={52} />
        <div className="flex items-center gap-2">
          <InstallButton />
          <LogoutButton />
        </div>
      </header>

      <div className="mt-6">
        <h1 className="font-display text-3xl font-bold leading-tight text-[var(--foreground)]">Seus produtos</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          <strong className="text-[var(--brand-strong)]">
            {liberados} de {total} liberados.
          </strong>{' '}
          Comprou mais? Atualize a página que o novo produto aparece aqui.
        </p>
      </div>

      {main && (
        <section className="mt-7">
          <SectionLabel>Produto principal</SectionLabel>
          <HeroCard product={main} />
        </section>
      )}

      {bonus.length > 0 && (
        <section className="mt-8">
          <SectionLabel>Bônus inclusos</SectionLabel>
          <div className="flex flex-col gap-3">
            {bonus.map((p) => (
              <BonusCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {bumps.length > 0 && (
        <section className="mt-8">
          <SectionLabel>Mais produtos pra você</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {bumps.map((p) => (
              <GridCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
