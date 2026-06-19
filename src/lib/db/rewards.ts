import { prisma } from './index'

export async function findAll() {
  return prisma.loyaltyReward.findMany({
    where: { isActive: true },
    orderBy: { pointsCost: 'asc' },
  })
}

export async function findAllAll() {
  return prisma.loyaltyReward.findMany({
    orderBy: { pointsCost: 'asc' },
  })
}

export async function findById(id: string) {
  return prisma.loyaltyReward.findUnique({ where: { id } })
}

export async function create(data: Record<string, unknown>) {
  return prisma.loyaltyReward.create({ data: data as never })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.loyaltyReward.update({ where: { id }, data: data as never })
}

export async function remove(id: string) {
  return prisma.loyaltyReward.delete({ where: { id } })
}

export async function redeem(userId: string, rewardId: string, pointsCost: number) {
  const [redemption] = await prisma.$transaction([
    prisma.redemption.create({
      data: { userId, rewardId, pointsCost },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { decrement: pointsCost } },
    }),
  ])
  return redemption
}

export async function findHistory(userId: string) {
  return prisma.redemption.findMany({
    where: { userId },
    include: { LoyaltyReward: true },
    orderBy: { createdAt: 'desc' },
  })
}
