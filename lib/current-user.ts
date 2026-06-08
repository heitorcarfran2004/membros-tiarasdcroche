import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySession, type SessionData } from './session'

// cookies() é assíncrono no Next 16.
export async function getSession(): Promise<SessionData | null> {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
}
