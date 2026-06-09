import { supabaseAdmin } from './supabase'

export type ProductKind = 'main' | 'bonus' | 'bump'

export type Product = {
  id: string
  slug: string
  title: string
  kind: ProductKind
  sort_order: number
  image_path: string | null
  checkout_url: string | null
}

export type VisibleProduct = Product & { unlocked: boolean }

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function getMemberByEmail(email: string) {
  const db = supabaseAdmin()
  const { data } = await db
    .from('members')
    .select('id, email')
    .eq('email', normalizeEmail(email))
    .maybeSingle()
  return data
}

// Regra central de exibição:
// principal e bônus são SEMPRE liberados a qualquer membro;
// bumps só se houver entitlement.
export async function getVisibleProducts(memberId: string): Promise<VisibleProduct[]> {
  const db = supabaseAdmin()
  const [{ data: products }, { data: ents }] = await Promise.all([
    db
      .from('products')
      .select('id, slug, title, kind, sort_order, image_path, checkout_url')
      .eq('active', true)
      .order('sort_order'),
    db.from('entitlements').select('product_id').eq('member_id', memberId),
  ])

  const owned = new Set((ents ?? []).map((e) => e.product_id as string))

  return (products ?? []).map((p) => ({
    ...(p as Product),
    unlocked: p.kind === 'main' || p.kind === 'bonus' || owned.has(p.id as string),
  }))
}

export async function getVisibleProductBySlug(memberId: string, slug: string): Promise<VisibleProduct | null> {
  const all = await getVisibleProducts(memberId)
  return all.find((p) => p.slug === slug) ?? null
}
