import { prisma } from './index'

export async function search(origin?: string, destination?: string) {
  const where: Record<string, unknown> = {}
  if (origin) where.origin = { contains: origin, mode: 'insensitive' }
  if (destination) where.destination = { contains: destination, mode: 'insensitive' }
  return prisma.flight.findMany({
    where,
    orderBy: { price: 'asc' },
  })
}
