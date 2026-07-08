import { prisma } from './index'
import type { Prisma } from '@prisma/client'

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

interface PaginatedParams {
  skip: number
  take: number
  search?: string
  type?: string
  status?: string
  paymentStatus?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function findAllPaginated(params: PaginatedParams) {
  const { skip, take, search, type, status, paymentStatus, sortBy, sortOrder } = params

  const where: Prisma.BookingWhereInput = {}

  if (search) {
    where.OR = [
      { itemName: { contains: search, mode: 'insensitive' } },
      { pnr: { contains: search, mode: 'insensitive' } },
      { providerOrAirline: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (type && type !== 'ALL') where.type = type
  if (status && status !== 'ALL') where.status = status
  if (paymentStatus && paymentStatus !== 'ALL') where.paymentStatus = paymentStatus

  const orderBy: Prisma.BookingOrderByWithRelationInput = {}
  const validSortBy = sortBy === 'bookedAt' || sortBy === 'price' ? sortBy : 'bookedAt'
  orderBy[validSortBy as keyof Prisma.BookingOrderByWithRelationInput] = sortOrder || 'desc'

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment: { select: { id: true, amount: true, status: true, method: true } },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.booking.count({ where }),
  ])

  return { bookings, total }
}

export async function aggregateRevenue(where: Prisma.BookingWhereInput) {
  const result = await prisma.booking.aggregate({
    _sum: { price: true },
    _count: true,
    where,
  })
  return {
    totalRevenue: result._sum.price || 0,
    count: result._count,
  }
}
