import { isPrisma, prisma, supabaseAdmin } from './index'

export async function findAll() {
  if (isPrisma()) {
    return prisma.pricingRule.findMany({ orderBy: { priority: 'desc' } })
  }
  const { data } = await supabaseAdmin
    .from('PricingRule')
    .select('*')
    .order('priority', { ascending: false })
  return data || []
}

export async function findById(id: string) {
  if (isPrisma()) {
    return prisma.pricingRule.findUnique({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('PricingRule')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function create(data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.pricingRule.create({ data: data as any })
  }
  const { data: rule } = await supabaseAdmin
    .from('PricingRule')
    .insert(data)
    .select()
    .single()
  return rule
}

export async function update(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.pricingRule.update({ where: { id }, data: data as any })
  }
  const { data: rule } = await supabaseAdmin
    .from('PricingRule')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return rule
}

export async function remove(id: string) {
  if (isPrisma()) {
    return prisma.pricingRule.delete({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('PricingRule')
    .delete()
    .eq('id', id)
    .select()
    .single()
  return data
}
