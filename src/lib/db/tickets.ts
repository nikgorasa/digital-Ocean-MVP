import { prisma } from './index'

export async function findAll(filters?: { status?: string; assigned_to?: string }) {
  const where: Record<string, unknown> = {}
  if (filters?.status) where.status = filters.status
  if (filters?.assigned_to) where.assigned_to = filters.assigned_to
  return prisma.tickets.findMany({
    where,
    include: { ticket_notes: true, ticket_activities: true },
    orderBy: { created_at: 'desc' },
  })
}

export async function findById(id: string) {
  return prisma.tickets.findUnique({
    where: { id },
    include: { ticket_notes: true, ticket_activities: true },
  })
}

export async function create(data: Record<string, unknown>) {
  return prisma.tickets.create({ data: data as never })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.tickets.update({ where: { id }, data: data as never })
}

export async function addNote(ticketId: string, data: Record<string, unknown>) {
  return prisma.ticket_notes.create({
    data: { ticket_id: ticketId, ...data } as never,
  })
}

export async function addActivity(ticketId: string, data: Record<string, unknown>) {
  return prisma.ticket_activities.create({
    data: { ticket_id: ticketId, ...data } as never,
  })
}

export async function stats() {
  const [total, open, inProgress, resolved] = await Promise.all([
    prisma.tickets.count(),
    prisma.tickets.count({ where: { status: 'open' } }),
    prisma.tickets.count({ where: { status: 'in_progress' } }),
    prisma.tickets.count({ where: { status: 'resolved' } }),
  ])
  return { total, open, in_progress: inProgress, resolved }
}
