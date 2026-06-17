import { isPrisma, prisma, supabaseAdmin } from './index'

export async function findAll() {
  if (isPrisma()) {
    return prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } })
  }
  const { data } = await supabaseAdmin
    .from('PromoCode')
    .select('*')
    .order('createdAt', { ascending: false })
  return data || []
}

export async function findById(id: string) {
  if (isPrisma()) {
    return prisma.promoCode.findUnique({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('PromoCode')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function findByCode(code: string) {
  if (isPrisma()) {
    return prisma.promoCode.findFirst({ where: { code } })
  }
  const { data } = await supabaseAdmin
    .from('PromoCode')
    .select('*')
    .eq('code', code)
    .single()
  return data
}

export async function create(data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.promoCode.create({ data: data as any })
  }
  const { data: promo } = await supabaseAdmin
    .from('PromoCode')
    .insert(data)
    .select()
    .single()
  return promo
}

export async function update(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.promoCode.update({ where: { id }, data: data as any })
  }
  const { data: promo } = await supabaseAdmin
    .from('PromoCode')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return promo
}

export async function remove(id: string) {
  if (isPrisma()) {
    return prisma.promoCode.delete({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('PromoCode')
    .delete()
    .eq('id', id)
    .select()
    .single()
  return data
}

export async function incrementUsage(id: string) {
  if (isPrisma()) {
    return prisma.promoCode.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    })
  }
  const { data } = await supabaseAdmin
    .rpc('increment_usage', { promo_id: id })
    .select()
    .single()
  return data
}
