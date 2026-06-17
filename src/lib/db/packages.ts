import { isPrisma, prisma, supabaseAdmin } from './index'

export async function findAll() {
  if (isPrisma()) {
    return prisma.package.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('Package')
    .select('*')
    .eq('isActive', true)
    .order('createdAt', { ascending: false })
  return data || []
}

export async function findAllAdmin() {
  if (isPrisma()) {
    return prisma.package.findMany({ orderBy: { createdAt: 'desc' } })
  }
  const { data } = await supabaseAdmin
    .from('Package')
    .select('*')
    .order('createdAt', { ascending: false })
  return data || []
}

export async function findById(id: string) {
  if (isPrisma()) {
    return prisma.package.findUnique({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('Package')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function create(data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.package.create({ data: data as any })
  }
  const { data: pkg } = await supabaseAdmin
    .from('Package')
    .insert(data)
    .select()
    .single()
  return pkg
}

export async function update(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.package.update({ where: { id }, data: data as any })
  }
  const { data: pkg } = await supabaseAdmin
    .from('Package')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return pkg
}

export async function findCategories() {
  if (isPrisma()) {
    return prisma.packageCategory.findMany({ orderBy: { sortorder: 'asc' } })
  }
  const { data } = await supabaseAdmin
    .from('PackageCategory')
    .select('*')
    .order('sortorder')
  return data || []
}

export async function countActive() {
  if (isPrisma()) {
    return prisma.package.count({ where: { isActive: true } })
  }
  const { count } = await supabaseAdmin
    .from('Package')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)
  return count || 0
}
