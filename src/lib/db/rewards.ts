import { isPrisma, prisma, supabaseAdmin } from './index'

export async function findAll() {
  if (isPrisma()) {
    return prisma.loyaltyReward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: 'asc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('LoyaltyReward')
    .select('*')
    .eq('isActive', true)
    .order('pointsCost')
  return data || []
}

export async function findAllAll() {
  if (isPrisma()) {
    return prisma.loyaltyReward.findMany({
      orderBy: { pointsCost: 'asc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('LoyaltyReward')
    .select('*')
    .order('pointsCost')
  return data || []
}

export async function findById(id: string) {
  if (isPrisma()) {
    return prisma.loyaltyReward.findUnique({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('LoyaltyReward')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function create(data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.loyaltyReward.create({ data: data as any })
  }
  const { data: reward } = await supabaseAdmin
    .from('LoyaltyReward')
    .insert(data)
    .select()
    .single()
  return reward
}

export async function update(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.loyaltyReward.update({ where: { id }, data: data as any })
  }
  const { data: reward } = await supabaseAdmin
    .from('LoyaltyReward')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return reward
}

export async function remove(id: string) {
  if (isPrisma()) {
    return prisma.loyaltyReward.delete({ where: { id } })
  }
  const { data } = await supabaseAdmin
    .from('LoyaltyReward')
    .delete()
    .eq('id', id)
    .select()
    .single()
  return data
}

export async function redeem(userId: string, rewardId: string, pointsCost: number) {
  if (isPrisma()) {
    const [redemption, updatedUser] = await prisma.$transaction([
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
  const { data: redemption } = await supabaseAdmin
    .from('Redemption')
    .insert({ userId, rewardId, pointsCost })
    .select()
    .single()
  await supabaseAdmin
    .from('User')
    .update({ loyaltyPoints: pointsCost })
    .eq('id', userId)
  return redemption
}

export async function findHistory(userId: string) {
  if (isPrisma()) {
    return prisma.redemption.findMany({
      where: { userId },
      include: { LoyaltyReward: true },
      orderBy: { createdAt: 'desc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('Redemption')
    .select('*, LoyaltyReward(*)')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
  return data || []
}
