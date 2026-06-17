import { isPrisma, prisma, supabaseAdmin } from './index'

export async function findAll() {
  if (isPrisma()) {
    return prisma.booking.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { bookedAt: 'desc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('Booking')
    .select('*, user:User(id, name, email)')
    .order('bookedAt', { ascending: false })
  return data || []
}

export async function findById(id: string) {
  if (isPrisma()) {
    return prisma.booking.findUnique({
      where: { id },
      include: { user: true, payment: true, invoice: true, cancellation: true },
    })
  }
  const { data } = await supabaseAdmin
    .from('Booking')
    .select('*, user:User(*), payment:Payment(*), invoice:Invoice(*), cancellation:CancellationRequest(*)')
    .eq('id', id)
    .single()
  return data
}

export async function findByUser(userId: string) {
  if (isPrisma()) {
    return prisma.booking.findMany({
      where: { userId },
      include: { payment: true },
      orderBy: { bookedAt: 'desc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('Booking')
    .select('*, payment:Payment(*)')
    .eq('userId', userId)
    .order('bookedAt', { ascending: false })
  return data || []
}

export async function create(data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.booking.create({ data: data as any })
  }
  const { data: booking } = await supabaseAdmin
    .from('Booking')
    .insert(data)
    .select()
    .single()
  return booking
}

export async function update(id: string, data: Record<string, unknown>) {
  if (isPrisma()) {
    return prisma.booking.update({ where: { id }, data: data as any })
  }
  const { data: booking } = await supabaseAdmin
    .from('Booking')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  return booking
}

export async function countAll() {
  if (isPrisma()) {
    return prisma.booking.count()
  }
  const { count } = await supabaseAdmin
    .from('Booking')
    .select('*', { count: 'exact', head: true })
  return count || 0
}

export async function sumRevenue() {
  if (isPrisma()) {
    const result = await prisma.booking.aggregate({
      _sum: { price: true },
      where: { status: { not: 'CANCELLED' } },
    })
    return result._sum.price || 0
  }
  const { data } = await supabaseAdmin
    .from('Booking')
    .select('price')
    .neq('status', 'CANCELLED')
  return data?.reduce((sum, b) => sum + (b.price || 0), 0) || 0
}
