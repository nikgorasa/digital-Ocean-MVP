import { isPrisma, prisma, supabaseAdmin } from './index'

export async function findAll() {
  if (isPrisma()) {
    return prisma.company.findMany({ orderBy: { createdAt: 'desc' } })
  }
  const { data } = await supabaseAdmin
    .from('Company')
    .select('*')
    .order('createdAt', { ascending: false })
  return data || []
}

export async function findById(id: string) {
  if (isPrisma()) {
    return prisma.company.findUnique({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('Company')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function create(data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.company.create({ data: data as any })
  }
  const { data: company } = await supabaseAdmin
    .from('Company')
    .insert(data)
    .select()
    .single()
  return company
}

export async function update(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.company.update({ where: { id }, data: data as any })
  }
  const { data: company } = await supabaseAdmin
    .from('Company')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return company
}

export async function remove(id: string) {
  if (isPrisma()) {
    return prisma.company.delete({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('Company')
    .delete()
    .eq('id', id)
    .select()
    .single()
  return data
}

export async function countAll() {
  if (isPrisma()) {
    return prisma.company.count()
  }
  const { count } = await supabaseAdmin
    .from('Company')
    .select('*', { count: 'exact', head: true })
  return count || 0
}

export async function findCorporateRates(companyId: string) {
  if (isPrisma()) {
    return prisma.corporateRate.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('CorporateRate')
    .select('*')
    .eq('companyId', companyId)
    .order('createdAt', { ascending: false })
  return data || []
}

export async function createCorporateRate(data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.corporateRate.create({ data: data as any })
  }
  const { data: rate } = await supabaseAdmin
    .from('CorporateRate')
    .insert(data)
    .select()
    .single()
  return rate
}

export async function updateCorporateRate(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.corporateRate.update({ where: { id }, data: data as any })
  }
  const { data: rate } = await supabaseAdmin
    .from('CorporateRate')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return rate
}

export async function removeCorporateRate(id: string) {
  if (isPrisma()) {
    return prisma.corporateRate.delete({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('CorporateRate')
    .delete()
    .eq('id', id)
    .select()
    .single()
  return data
}
