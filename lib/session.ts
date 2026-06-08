import crypto from 'crypto'

// Cookie de sessão assinado com HMAC (login por email puro, sem senha).
// Sem dependências do Next aqui de propósito: usável tanto no proxy (Node)
// quanto nos route handlers.

export const SESSION_COOKIE = 'mt_session'

export type SessionData = {
  email: string
  mid: string // member id
  iat: number // issued-at (segundos)
}

function getSecret(): string {
  const s = process.env.COOKIE_HMAC_SECRET
  if (!s) throw new Error('COOKIE_HMAC_SECRET ausente')
  return s
}

export function signSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifySession(token: string | undefined | null): SessionData | null {
  if (!token) return null
  const idx = token.lastIndexOf('.')
  if (idx <= 0) return null
  const payload = token.slice(0, idx)
  const sig = token.slice(idx + 1)

  let expected: string
  try {
    expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
  } catch {
    return null
  }

  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionData
    if (!data || typeof data.email !== 'string' || typeof data.mid !== 'string') return null
    return data
  } catch {
    return null
  }
}
