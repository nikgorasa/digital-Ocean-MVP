import { prisma } from './index'

export async function findAll() {
  return prisma.pricingRule.findMany({ orderBy: { priority: 'desc' } })
}

export async function findById(id: string) {
  return prisma.pricingRule.findUnique({ where: { id } })
}

export async function create(data: Record<string, unknown>) {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
  )
  return prisma.pricingRule.create({ data: clean as never })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.pricingRule.update({ where: { id }, data: data as never })
}

export async function remove(id: string) {
  return prisma.pricingRule.delete({ where: { id } })
}
