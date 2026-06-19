import { prisma } from './index'

export interface UserFindOptions {
  search?: string
  role?: string
  page?: number
  limit?: number
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function findById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function findAll(options: UserFindOptions = {}) {
  const { search, role, page = 1, limit = 50 } = options
  const offset = (Math.max(1, page) - 1) * limit

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

export async function create(data: {
  id?: string
  email: string
  name: string
  role?: string
  companyId?: string | null
}) {
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

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.user.update({ where: { id }, data })
}

export async function countActive() {
  return prisma.user.count({ where: { isActive: true } })
}

export async function countByRole(role: string) {
  return prisma.user.count({ where: { role } })
}

export async function countByRoles(roles: string[]) {
  return prisma.user.count({ where: { role: { in: roles } } })
}

export async function findDemoUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { email: true, name: true, role: true },
    orderBy: { role: 'asc' },
  })
}

export async function findAllRoles() {
  return prisma.role.findMany({ orderBy: { label: 'asc' } })
}
