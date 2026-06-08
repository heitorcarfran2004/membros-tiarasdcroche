import { redirect } from 'next/navigation'
import LoginForm from '@/components/LoginForm'
import Logo from '@/components/Logo'
import { getSession } from '@/lib/current-user'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 py-10">
      <div className="w-full rounded-3xl border border-[var(--border)] bg-card p-6 shadow-sm">
        <Logo size={120} className="mx-auto mb-4 drop-shadow" />
        <h1 className="mb-1 text-center text-xl font-bold text-[var(--brand-strong)]">
          Acesse seus Produtos
        </h1>
        <p className="mb-5 text-center text-sm text-[var(--muted)]">
          Entre com o email da sua compra para acessar seus produtos.
        </p>
        <LoginForm />
      </div>
    </main>
  )
}
