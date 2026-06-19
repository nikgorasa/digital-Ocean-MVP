import { prisma } from './index'

export async function findAll() {
  return prisma.city.findMany({
    where: { isactive: true },
    orderBy: { name: 'asc' },
  })
}

export async function search(query: string) {
  return prisma.city.findMany({
    where: {
      isactive: true,
      name: { contains: query, mode: 'insensitive' },
    },
    orderBy: { searchcount: 'desc' },
    take: 10,
  })
}

export async function findTBOCodes() {
  return prisma.city.findMany({
    where: { isactive: true, iata_code: { not: null } },
    select: { name: true, iata_code: true },
    orderBy: { name: 'asc' },
  })
}
