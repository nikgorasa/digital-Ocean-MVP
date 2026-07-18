import { prisma } from './index'

export async function findAll() {
  return prisma.city.findMany({
    where: { isactive: true },
    orderBy: { name: 'asc' },
  })
}

export async function search(query: string) {
  return prisma.city.findMany({
    where: {
      isactive: true,
      name: { contains: query, mode: 'insensitive' },
    },
    orderBy: { searchcount: 'desc' },
    take: 10,
  })
}

export async function findTBOCodes() {
  return prisma.city.findMany({
    where: { isactive: true, iata_code: { not: null } },
    select: { name: true, iata_code: true },
    orderBy: { name: 'asc' },
  })
}

export interface AirportRow {
  id: string
  name: string
  iata_code: string | null
  airport_name: string | null
  country_code: string | null
  flag: string | null
  latitude: number | null
  longitude: number | null
  airport_type: string | null
}

const POPULAR_IATA = ['BOM', 'DEL', 'DXB', 'BKK', 'SIN', 'LHR']

export async function searchAirports(query: string, limit = 40): Promise<AirportRow[]> {
  const where: any = {
    isactive: true,
    iata_code: { not: null },
    airport_name: { not: null },
  }

  if (query) {
    const q = query.toLowerCase()
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { iata_code: { contains: q, mode: 'insensitive' } },
      { airport_name: { contains: q, mode: 'insensitive' } },
      { country_code: { contains: q, mode: 'insensitive' } },
    ]
  }

  const rows = await prisma.city.findMany({
    where,
    select: {
      id: true,
      name: true,
      iata_code: true,
      airport_name: true,
      country_code: true,
      flag: true,
      latitude: true,
      longitude: true,
      airport_type: true,
    },
    orderBy: [
      { searchcount: 'desc' },
      { name: 'asc' },
    ],
    take: limit,
  })

  // Promote popular airports to top
  const popular = rows.filter(r => r.iata_code && POPULAR_IATA.includes(r.iata_code))
  const rest = rows.filter(r => !r.iata_code || !POPULAR_IATA.includes(r.iata_code))
  return [...popular, ...rest]
}
