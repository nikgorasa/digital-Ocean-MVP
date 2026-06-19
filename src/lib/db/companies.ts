import { prisma } from './index'

export async function findAll() {
  return prisma.company.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function findById(id: string) {
  return prisma.company.findUnique({ where: { id } })
}

export async function create(data: Record<string, unknown>) {
  return prisma.company.create({ data: data as never })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.company.update({ where: { id }, data: data as never })
}

export async function remove(id: string) {
  return prisma.company.delete({ where: { id } })
}

export async function countAll() {
  return prisma.company.count()
}

export async function findCorporateRates(companyId: string) {
  return prisma.corporateRate.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createCorporateRate(data: Record<string, unknown>) {
  return prisma.corporateRate.create({ data: data as never })
}

export async function updateCorporateRate(id: string, data: Record<string, unknown>) {
  return prisma.corporateRate.update({ where: { id }, data: data as never })
}

export async function removeCorporateRate(id: string) {
  return prisma.corporateRate.delete({ where: { id } })
}
