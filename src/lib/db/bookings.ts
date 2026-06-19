import { prisma } from './index'

export async function findAll() {
  return prisma.booking.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { bookedAt: 'desc' },
  })
}

export async function findById(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: { user: true, payment: true, invoice: true, cancellation: true },
  })
}

export async function findByUser(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: { payment: true },
    orderBy: { bookedAt: 'desc' },
  })
}

export async function create(data: Record<string, unknown>) {
  return prisma.booking.create({ data: data as never })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.booking.update({ where: { id }, data: data as never })
}

export async function countAll() {
  return prisma.booking.count()
}

export async function sumRevenue() {
  const result = await prisma.booking.aggregate({
    _sum: { price: true },
    where: { status: { not: 'CANCELLED' } },
  })
  return result._sum.price || 0
}
