import { isPrisma, prisma, supabaseAdmin } from './index'

export async function findAll() {
  if (isPrisma()) {
    return prisma.lead.findMany({
      include: { assignedUser: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('Lead')
    .select('*, assignedUser:User!assignedTo(id, name, email)')
    .order('createdAt', { ascending: false })
  return data || []
}

export async function findById(id: string) {
  if (isPrisma()) {
    return prisma.lead.findUnique({
      where: { id },
      include: { assignedUser: { select: { id: true, name: true, email: true } }, activities: true },
    })
  }
  const { data } = await supabaseAdmin
    .from('Lead')
    .select('*, assignedUser:User!assignedTo(id, name, email), activities:*')
    .eq('id', id)
    .single()
  return data
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
  if (isPrisma()) {
    return prisma.lead.create({
      data: { ...data, stage: 'NEW', inclusions: data.inclusions || '[]', source: data.source || 'manual' },
    })
  }
  const { data: lead } = await supabaseAdmin
    .from('Lead')
    .insert({
      id: crypto.randomUUID(),
      ...data,
      stage: 'NEW',
      inclusions: data.inclusions || '[]',
      source: data.source || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()
  return lead
}

export async function update(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.lead.update({ where: { id }, data })
  }
  const { data: lead } = await supabaseAdmin
    .from('Lead')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return lead
}

export async function findStages() {
  if (isPrisma()) {
    return prisma.leadStage.findMany({ orderBy: { sortorder: 'asc' } })
  }
  const { data, error } = await supabaseAdmin
    .from('LeadStage')
    .select('*')
    .order('sortorder')
  return data || []
}
