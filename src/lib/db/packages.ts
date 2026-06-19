import { prisma } from './index'

export async function findAll() {
  return prisma.package.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findAllAdmin() {
  return prisma.package.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function findById(id: string) {
  return prisma.package.findUnique({ where: { id } })
}

export async function create(data: Record<string, unknown>) {
  return prisma.package.create({ data: data as never })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.package.update({ where: { id }, data: data as never })
}

export async function findCategories() {
  return prisma.packageCategory.findMany({ orderBy: { sortorder: 'asc' } })
}

export async function countActive() {
  return prisma.package.count({ where: { isActive: true } })
}
