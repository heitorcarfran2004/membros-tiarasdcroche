import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Status que contam como "pago"
const PAID_STATUSES = new Set(['paid', 'approved', 'completed', 'confirmed', 'succeeded'])
// Pistas de estorno/chargeback (não liberar)
const REFUND_HINTS = ['refund', 'chargeback', 'charged_back', 'estorn', 'reembols', 'dispute', 'canceled', 'cancelled']

type AnyObj = Record<string, unknown>

function asObj(v: unknown): AnyObj | null {
  return v && typeof v === 'object' ? (v as AnyObj) : null
}

// Aceita o segredo vindo de query (?token=/?secret=), header OU corpo. Tolerante.
function pickSecret(searchParams: URLSearchParams, headers: Record<string, string>, body: AnyObj | null): string | null {
  const q = searchParams.get('token') || searchParams.get('secret')
  if (q) return q
  for (const h of ['x-secret', 'secret', 'x-gg-secret', 'x-webhook-secret', 'x-token', 'token', 'authorization']) {
    const v = headers[h]
    if (v) return v.replace(/^Bearer\s+/i, '').trim()
  }
  if (body) {
    for (const k of ['secret', 'Secret', 'token', 'Token', 'webhook_secret']) {
      if (body[k]) return String(body[k])
    }
  }
  return null
}

function firstString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number') return String(v)
  }
  return null
}

async function getOrCreateMember(db: ReturnType<typeof supabaseAdmin>, emailNorm: string): Promise<string | null> {
  const { data: existing } = await db.from('members').select('id').eq('email', emailNorm).maybeSingle()
  if (existing) return existing.id as string
  const { data: created, error } = await db.from('members').insert({ email: emailNorm }).select('id').single()
  if (error) {
    // corrida / violação de unicidade → re-busca
    const { data: again } = await db.from('members').select('id').eq('email', emailNorm).maybeSingle()
    return (again?.id as string) ?? null
  }
  return created.id as string
}

export async function POST(req: Request) {
  const url = new URL(req.url)

  const rawText = await req.text()
  let body: AnyObj | null = null
  try {
    body = rawText ? (JSON.parse(rawText) as AnyObj) : null
  } catch {
    body = null
  }

  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v
  })
  const query: Record<string, string> = {}
  url.searchParams.forEach((v, k) => {
    query[k] = v
  })
  const sourceIp = headers['x-forwarded-for']?.split(',')[0]?.trim() || headers['x-real-ip'] || null

  const db = supabaseAdmin()

  // ---- extrai campos do payload do GG ----
  const customer = asObj(body?.customer)
  const payment = asObj(body?.payment)
  const event = firstString(body?.event)
  const email = firstString(customer?.email, customer?.Email, body?.email)
  const status = firstString(payment?.status, body?.status)
  const orderId = firstString(body?.order_id, asObj(body?.order)?.id, body?.id, body?.transaction_id)

  const provided = pickSecret(url.searchParams, headers, body)
  const expected = process.env.GG_WEBHOOK_SECRET || ''
  const authorized = !!expected && provided === expected

  const probe = `${event ?? ''} ${status ?? ''}`.toLowerCase()
  const isRefund = REFUND_HINTS.some((h) => probe.includes(h))
  const isPaid =
    (!!status && PAID_STATUSES.has(status.toLowerCase())) || /\.paid$/i.test(event ?? '')

  const matched = new Set<string>()
  let memberId: string | null = null
  const notes: string[] = []

  // ---- só processa se autorizado, com email, pago e não estorno ----
  if (authorized && email && isPaid && !isRefund) {
    const emailNorm = email.trim().toLowerCase()
    memberId = await getOrCreateMember(db, emailNorm)

    const products = Array.isArray(body?.products) ? (body!.products as unknown[]) : []

    // mapeamentos id/título -> produto interno (SÓ bumps). NUNCA usar "type".
    const { data: mappings } = await db
      .from('product_mappings')
      .select('product_id, external_id, external_title')

    const byId = new Map<string, string>()
    const byTitle = new Map<string, string>()
    for (const m of mappings ?? []) {
      if (m.external_id) byId.set(String(m.external_id).trim(), m.product_id as string)
      if (m.external_title) byTitle.set(String(m.external_title).trim().toLowerCase(), m.product_id as string)
    }

    for (const raw of products) {
      const p = asObj(raw)
      if (!p) continue
      const pid = firstString(p.id)
      const ptitle = firstString(p.title)
      // casa por ID real E por título (os dois), agnóstico. Ignora "type".
      if (pid && byId.has(pid)) matched.add(byId.get(pid)!)
      if (ptitle && byTitle.has(ptitle.toLowerCase())) matched.add(byTitle.get(ptitle.toLowerCase())!)
    }

    if (memberId && matched.size) {
      const rows = [...matched].map((product_id) => ({
        member_id: memberId,
        product_id,
        source: 'webhook',
        external_order_id: orderId,
      }))
      const { error } = await db
        .from('entitlements')
        .upsert(rows, { onConflict: 'member_id,product_id', ignoreDuplicates: true })
      if (error) notes.push('entitlement_error:' + error.message)
    }
    if (!products.length) notes.push('sem products[] no payload')
  } else if (authorized && isRefund && email) {
    // Estorno/chargeback: NÃO liberar; revoga bumps mapeados, se houver.
    const emailNorm = email.trim().toLowerCase()
    const { data: mem } = await db.from('members').select('id').eq('email', emailNorm).maybeSingle()
    memberId = (mem?.id as string) ?? null
    notes.push('refund/chargeback detectado — nada liberado')
  }

  if (!authorized) notes.push('NAO AUTORIZADO (secret invalido) — apenas logado')

  // ---- LOGA SEMPRE (autorizado ou não) ----
  await db.from('webhook_logs').insert({
    source_ip: sourceIp,
    headers,
    query,
    raw_text: rawText,
    raw_body: body,
    event,
    email,
    payment_status: status,
    authorized,
    is_refund: isRefund,
    matched_product_ids: matched.size ? [...matched] : null,
    note: notes.join(' | ') || null,
  })

  // Sempre 200 (já registramos) — evita o GG desativar/retryar o webhook em calibração.
  return NextResponse.json({
    ok: authorized,
    logged: true,
    matched: matched.size,
    paid: isPaid,
    refund: isRefund,
  })
}

// Health check simples (abrir no navegador deve responder ok).
export async function GET() {
  return NextResponse.json({ ok: true, service: 'gg-webhook', ts: new Date().toISOString() })
}
