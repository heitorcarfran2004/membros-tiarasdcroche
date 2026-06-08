import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from './lib/session'

// Next 16: middleware foi renomeado para "proxy" e roda no runtime Node.js
// (por isso podemos usar o crypto nativo dentro de verifySession aqui).
// Protege as rotas privadas; valida só a ASSINATURA HMAC do cookie
// (a checagem de membro no banco já aconteceu no login).
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = verifySession(token)

  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Só rotas privadas. /login, /api/* e estáticos ficam de fora.
  matcher: ['/', '/produto/:path*'],
}
