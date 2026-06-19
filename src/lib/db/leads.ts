import { prisma } from './index'

export async function findAll() {
  return prisma.lead.findMany({
    include: { assignedUser: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: { assignedUser: { select: { id: true, name: true, email: true } }, activities: true },
  })
}

export async function create(data: {
  destination: string
  travelerName: string
  travelerEmail: string
  travelerPhone?: string
  numberOfDays?: number
  inclusions?: string
  specificDemands?: string
  notes?: string
  source?: string
}) {
  return prisma.lead.create({
    data: { ...data, stage: 'NEW', inclusions: data.inclusions || '[]', source: data.source || 'manual' },
  })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.lead.update({ where: { id }, data })
}

export async function findStages() {
  return prisma.leadStage.findMany({ orderBy: { sortorder: 'asc' } })
}
