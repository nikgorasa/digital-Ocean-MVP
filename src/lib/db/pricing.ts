import { prisma } from './index'

export async function findAll() {
  return prisma.pricingRule.findMany({ orderBy: { priority: 'desc' } })
}

export async function findById(id: string) {
  return prisma.pricingRule.findUnique({ where: { id } })
}

export async function create(data: Record<string, unknown>) {
  return prisma.pricingRule.create({ data: data as never })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.pricingRule.update({ where: { id }, data: data as never })
}

export async function remove(id: string) {
  return prisma.pricingRule.delete({ where: { id } })
}
