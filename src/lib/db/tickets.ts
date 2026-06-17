import { isPrisma, prisma, supabaseAdmin } from './index'

// ═══════════════════════════════════════════════════════
// Tickets Service — uses raw SQL for UUID columns
// ═══════════════════════════════════════════════════════

export async function findAll(filters?: { status?: string; assigned_to?: string }) {
  if (isPrisma()) {
    const where: Record<string, unknown> = {}
    if (filters?.status) where.status = filters.status
    if (filters?.assigned_to) where.assigned_to = filters.assigned_to
    return prisma.tickets.findMany({
      where,
      include: { ticket_notes: true, ticket_activities: true },
      orderBy: { created_at: 'desc' },
    })
  }
  let query = supabaseAdmin
    .from('tickets')
    .select('*, ticket_notes(*), ticket_activities(*)')
    .order('created_at', { ascending: false })
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
  const { data } = await query
  return data || []
}

export async function findById(id: string) {
  if (isPrisma()) {
    return prisma.tickets.findUnique({
      where: { id },
      include: { ticket_notes: true, ticket_activities: true },
    })
  }
  const { data } = await supabaseAdmin
    .from('tickets')
    .select('*, ticket_notes(*), ticket_activities(*)')
    .eq('id', id)
    .single()
  return data
}

export async function create(data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.tickets.create({ data: data as any })
  }
  const { data: ticket } = await supabaseAdmin
    .from('tickets')
    .insert(data)
    .select()
    .single()
  return ticket
}

export async function update(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.tickets.update({ where: { id }, data: data as any })
  }
  const { data: ticket } = await supabaseAdmin
    .from('tickets')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return ticket
}

export async function addNote(ticketId: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.ticket_notes.create({
      data: { ticket_id: ticketId, ...data } as any,
    })
  }
  const { data: note } = await supabaseAdmin
    .from('ticket_notes')
    .insert({ ticket_id: ticketId, ...data })
    .select()
    .single()
  return note
}

export async function addActivity(ticketId: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.ticket_activities.create({
      data: { ticket_id: ticketId, ...data } as any,
    })
  }
  const { data: activity } = await supabaseAdmin
    .from('ticket_activities')
    .insert({ ticket_id: ticketId, ...data })
    .select()
    .single()
  return activity
}

export async function stats() {
  if (isPrisma()) {
    const [total, open, inProgress, resolved] = await Promise.all([
      prisma.tickets.count(),
      prisma.tickets.count({ where: { status: 'open' } }),
      prisma.tickets.count({ where: { status: 'in_progress' } }),
      prisma.tickets.count({ where: { status: 'resolved' } }),
    ])
    return { total, open, in_progress: inProgress, resolved }
  }
  const { data } = await supabaseAdmin.from('tickets').select('status')
  const counts = (data || []).reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }),
    {} as Record<string, number>
  )
  return {
    total: data?.length || 0,
    open: counts.open || 0,
    in_progress: counts.in_progress || 0,
    resolved: counts.resolved || 0,
  }
}
