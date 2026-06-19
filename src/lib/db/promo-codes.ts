import { prisma } from './index'

export async function findAll() {
  return prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function findById(id: string) {
  return prisma.promoCode.findUnique({ where: { id } })
}

export async function findByCode(code: string) {
  return prisma.promoCode.findFirst({ where: { code } })
}

export async function create(data: Record<string, unknown>) {
  return prisma.promoCode.create({ data: data as never })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.promoCode.update({ where: { id }, data: data as never })
}

export async function remove(id: string) {
  return prisma.promoCode.delete({ where: { id } })
}

export async function incrementUsage(id: string) {
  return prisma.promoCode.update({
    where: { id },
    data: { usedCount: { increment: 1 } },
  })
}
