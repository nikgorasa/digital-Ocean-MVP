import { isPrisma, prisma, supabaseAdmin } from './index'

export async function findAll() {
  if (isPrisma()) {
    return prisma.city.findMany({
      where: { isactive: true },
      orderBy: { name: 'asc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('City')
    .select('*')
    .eq('isactive', true)
    .order('name')
  return data || []
}

export async function search(query: string) {
  if (isPrisma()) {
    return prisma.city.findMany({
      where: {
        isactive: true,
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: { searchcount: 'desc' },
      take: 10,
    })
  }
  const { data } = await supabaseAdmin
    .from('City')
    .select('*')
    .eq('isactive', true)
    .ilike('name', `%${query}%`)
    .order('searchcount', { ascending: false })
    .limit(10)
  return data || []
}

export async function findTBOCodes() {
  if (isPrisma()) {
    return prisma.city.findMany({
      where: { isactive: true, iata_code: { not: null } },
      select: { name: true, iata_code: true },
      orderBy: { name: 'asc' },
    })
  }
  const { data } = await supabaseAdmin
    .from('City')
    .select('name, iata_code')
    .eq('isactive', true)
    .not('iata_code', 'is', null)
    .order('name')
  return data || []
}
