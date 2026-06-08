import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getMemberByEmail, normalizeEmail } from '@/lib/members'
import { SESSION_COOKIE, signSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let email = ''
  try {
    const body = await req.json()
    email = normalizeEmail(String(body?.email ?? ''))
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Digite um email válido.' }, { status: 400 })
  }

  const member = await getMemberByEmail(email)
  if (!member) {
    return NextResponse.json(
      { error: 'Não encontramos uma compra com esse email. Verifique o email usado na compra.' },
      { status: 404 },
    )
  }

  const token = signSession({
    email: member.email,
    mid: member.id,
    iat: Math.floor(Date.now() / 1000),
  })

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 dias
  })

  return NextResponse.json({ ok: true })
}
