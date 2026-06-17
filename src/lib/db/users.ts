import { isPrisma, prisma, supabaseAdmin } from './index'

// ═══════════════════════════════════════════════════════
// Users Service — works with both Supabase and Prisma
// ═══════════════════════════════════════════════════════

export interface UserFindOptions {
  search?: string
  role?: string
  page?: number
  limit?: number
}

export async function findByEmail(email: string) {
  if (isPrisma()) {
    return prisma.user.findUnique({ where: { email } })
  }
  const { data } = await supabaseAdmin
    .from('User')
    .select('*')
    .eq('email', email)
    .single()
  return data
}

export async function findById(id: string) {
  if (isPrisma()) {
    return prisma.user.findUnique({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('User')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function findAll(options: UserFindOptions = {}) {
  const { search, role, page = 1, limit = 50 } = options
  const offset = (Math.max(1, page) - 1) * limit

  if (isPrisma()) {
    const where: Record<string, unknown> = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])
    return { users, total }
  }

  let query = supabaseAdmin
    .from('User')
    .select('*', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(offset, offset + limit - 1)

  if (role) query = query.eq('role', role)
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data: users, count } = await query
  return { users: users || [], total: count || 0 }
}

export async function create(data: {
  id?: string
  email: string
  name: string
  role?: string
  companyId?: string | null
  supabaseId?: string | null
}) {
  if (isPrisma()) {
    return prisma.user.create({
      data: {
        ...data,
        walletBalance: 0,
        loyaltyPoints: 0,
        loyaltyTier: 'Silver',
        isActive: true,
      },
    })
  }
  const { data: user } = await supabaseAdmin
    .from('User')
    .insert({
      ...data,
      walletBalance: 0,
      loyaltyPoints: 0,
      loyaltyTier: 'Silver',
      isActive: true,
    })
    .select()
    .single()
  return user
}

export async function update(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.user.update({ where: { id }, data })
  }
  const { data: user } = await supabaseAdmin
    .from('User')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return user
}

export async function countActive() {
  if (isPrisma()) {
    return prisma.user.count({ where: { isActive: true } })
  }
  const { count } = await supabaseAdmin
    .from('User')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)
  return count || 0
}

export async function countByRole(role: string) {
  if (isPrisma()) {
    return prisma.user.count({ where: { role } })
  }
  const { count } = await supabaseAdmin
    .from('User')
    .select('*', { count: 'exact', head: true })
    .eq('role', role)
  return count || 0
}

export async function countByRoles(roles: string[]) {
  if (isPrisma()) {
    return prisma.user.count({ where: { role: { in: roles } } })
  }
  const { count } = await supabaseAdmin
    .from('User')
    .select('*', { count: 'exact', head: true })
    .in('role', roles)
  return count || 0
}

export async function findDemoUsers() {
  if (isPrisma()) {
    return prisma.user.findMany({
      where: { isActive: true },
      select: { email: true, name: true, role: true },
      orderBy: { role: 'asc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('User')
    .select('email, name, role')
    .eq('isActive', true)
    .order('role')
  return data || []
}

export async function findAllRoles() {
  if (isPrisma()) {
    return prisma.role.findMany({ orderBy: { label: 'asc' } })
  }
  const { data } = await supabaseAdmin
    .from('Role')
    .select('*')
    .order('label')
  return data || []
}
