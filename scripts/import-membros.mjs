import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

// ---- env (.env.local) ----
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)
const SUPABASE_URL = env.SUPABASE_URL
const KEY = env.SUPABASE_SECRET_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' }

async function rest(path, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: { ...H, ...(opts.headers || {}) } })
  const text = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${text}`)
  return text ? JSON.parse(text) : null
}

const file = process.argv[2]
const commit = process.argv.includes('--commit')

// ---- matchers (específicos, pra não casar errado) ----
const BUMP_MATCHERS = [
  { slug: 'bolsas', re: /bolsa/i },
  { slug: 'carteiras', re: /carteira/i },
  { slug: 'amigurumis', re: /amigurumi/i },
  { slug: 'cozinha', re: /cozinha/i },
  { slug: 'sapatinhos', re: /sapatinho/i },
  { slug: 'lacos', re: /la[çc]o/i },
]
const WHATSAPP_RE = /whats|acesso imediato/i
const FRONT_RE = /guia.*tiara|tiara.*croch|completo/i
const BONUS_RE = /chap[eé]u|acabamento|materiais|vender|mini ?guia/i
const PAID_RE = /^(pago|aprovado|approved|paid|completo)$/i

function classify(raw) {
  const t = String(raw).trim()
  if (!t) return null
  if (WHATSAPP_RE.test(t)) return { kind: 'whatsapp' }
  for (const m of BUMP_MATCHERS) if (m.re.test(t)) return { kind: 'bump', slug: m.slug }
  if (FRONT_RE.test(t)) return { kind: 'front' }
  if (BONUS_RE.test(t)) return { kind: 'bonus' }
  return { kind: 'unmatched', title: t }
}

// ---- parse ----
const wb = XLSX.read(readFileSync(file), { type: 'buffer', codepage: 65001 })
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false })

const statusCounts = {}
const skippedStatuses = {}
const perEmail = new Map() // email -> Set(slug)
const unmatched = new Map()
let paidRows = 0, skipped = 0, noEmail = 0

for (const r of rows) {
  statusCounts[r['Status']] = (statusCounts[r['Status']] || 0) + 1
  const email = String(r['Email'] || '').trim().toLowerCase()
  if (!email) { noEmail++; continue }
  if (!PAID_RE.test(String(r['Status'] || '').trim())) {
    skipped++; skippedStatuses[r['Status']] = (skippedStatuses[r['Status']] || 0) + 1; continue
  }
  paidRows++
  if (!perEmail.has(email)) perEmail.set(email, new Set())
  const set = perEmail.get(email)
  const items = []
  if (r['Produto (Oferta)']) items.push(r['Produto (Oferta)']) // NÃO split: o "|" faz parte do nome do front
  if (r['Order Bumps']) items.push(...String(r['Order Bumps']).split('|')) // bumps separados por |
  for (const it of items) {
    const c = classify(it)
    if (!c) continue
    if (c.kind === 'bump') set.add(c.slug)
    else if (c.kind === 'unmatched') unmatched.set(c.title, (unmatched.get(c.title) || 0) + 1)
    // front/bonus/whatsapp => nada (principal+bônus automáticos; whatsapp ignorado)
  }
}

let totalEnt = 0
for (const s of perEmail.values()) totalEnt += s.size

console.log('=== RESUMO DA PLANILHA ===')
console.log('Linhas totais:', rows.length, '| sem email:', noEmail)
console.log('Status:', statusCounts)
console.log('Pagas processadas:', paidRows, '| ignoradas (não pagas):', skipped, skippedStatuses)
console.log('Membros únicos a importar:', perEmail.size)
console.log('Entitlements de bumps a conceder (soma):', totalEnt)
const distri = {}
for (const s of perEmail.values()) for (const slug of s) distri[slug] = (distri[slug] || 0) + 1
console.log('Distribuição por módulo:', distri)
console.log('Produtos SEM correspondência no catálogo:', unmatched.size ? Object.fromEntries(unmatched) : 'NENHUM ✅')

if (!commit) {
  console.log('\n>>> DRY-RUN (nada foi gravado). Rode com --commit para aplicar. <<<')
  process.exit(0)
}

// ---- COMMIT ----
console.log('\n=== GRAVANDO ===')
const products = await rest('products?select=id,slug')
const slugId = Object.fromEntries(products.map((p) => [p.slug, p.id]))

const existing = await rest('members?select=id,email')
const emailId = new Map(existing.map((m) => [String(m.email).toLowerCase(), m.id]))

const toCreate = [...perEmail.keys()].filter((e) => !emailId.has(e))
for (let i = 0; i < toCreate.length; i += 200) {
  const batch = toCreate.slice(i, i + 200).map((email) => ({ email }))
  const created = await rest('members?select=id,email', {
    method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(batch),
  })
  for (const m of created) emailId.set(String(m.email).toLowerCase(), m.id)
}

const entRows = []
for (const [email, slugs] of perEmail) {
  const mid = emailId.get(email)
  for (const slug of slugs) { const pid = slugId[slug]; if (pid && mid) entRows.push({ member_id: mid, product_id: pid, source: 'import' }) }
}
let sent = 0
for (let i = 0; i < entRows.length; i += 500) {
  const batch = entRows.slice(i, i + 500)
  await rest('entitlements?on_conflict=member_id,product_id', {
    method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(batch),
  })
  sent += batch.length
}
console.log('OK ✅ membros novos criados:', toCreate.length, '| entitlements enviados (idempotente):', sent)
