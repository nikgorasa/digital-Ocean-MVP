import { isPrisma, prisma, supabaseAdmin } from './index'

export async function search(origin?: string, destination?: string) {
  if (isPrisma()) {
    const where: Record<string, unknown> = {}
    if (origin) where.origin = { contains: origin, mode: 'insensitive' }
    if (destination) where.destination = { contains: destination, mode: 'insensitive' }
    return prisma.flight.findMany({
      where,
      orderBy: { price: 'asc' },
    })
  }
  let query = supabaseAdmin
    .from('Flight')
    .select('*')
    .order('price')
  if (origin) query = query.ilike('origin', `%${origin}%`)
  if (destination) query = query.ilike('destination', `%${destination}%`)
  const { data } = await query
  return data || []
}
