import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HOTEL_RULES = [
  { hotelCode: "1031455", hotelName: "Midtown Hotel" },
  { hotelCode: "1031524", hotelName: "Hotel Delhi 37" },
  { hotelCode: "1031428", hotelName: "Jukaso Inn Down Town" },
  { hotelCode: "1014919", hotelName: "Hotel Africa Avenue G K 1" },
  { hotelCode: "1016775", hotelName: "Park Ascent" },
  { hotelCode: "1016351", hotelName: "Eros Hotel New Delhi by IHG" },
  { hotelCode: "1031465", hotelName: "Majestic Palace" },
];

async function seed() {
  console.log(`Seeding ${HOTEL_RULES.length} hotel-specific pricing rules...`);

  for (const hotel of HOTEL_RULES) {
    const rule = await prisma.pricingRule.upsert({
      where: { id: `tariff-${hotel.hotelCode}` },
      update: {
        name: `Special Tariff - ${hotel.hotelName}`,
        type: "HOTEL",
        destination: "Delhi NCR",
        hotelCode: hotel.hotelCode,
        hotelName: hotel.hotelName,
        markupPercent: 7,
        markupType: "PERCENT",
        markupValue: 7,
        category: "ALL",
        isActive: true,
        priority: 100,
      },
      create: {
        id: `tariff-${hotel.hotelCode}`,
        name: `Special Tariff - ${hotel.hotelName}`,
        type: "HOTEL",
        destination: "Delhi NCR",
        hotelCode: hotel.hotelCode,
        hotelName: hotel.hotelName,
        markupPercent: 7,
        markupType: "PERCENT",
        markupValue: 7,
        category: "ALL",
        isActive: true,
        priority: 100,
      },
    });
    console.log(`  ✓ ${hotel.hotelCode} — ${hotel.hotelName} (7% markup)`);
  }

  // DISC-01: Flight default pricing rule (5% markup)
  console.log('\nSeeding flight default pricing rule...');
  const flightRule = await prisma.pricingRule.upsert({
    where: { id: 'flight-default' },
    update: {
      name: 'Flight Default',
      type: 'GLOBAL',
      category: 'FLIGHT',
      markupType: 'PERCENT',
      markupValue: 5,
      markupPercent: 5,
      isActive: true,
      priority: 0,
    },
    create: {
      id: 'flight-default',
      name: 'Flight Default',
      type: 'GLOBAL',
      category: 'FLIGHT',
      markupType: 'PERCENT',
      markupValue: 5,
      markupPercent: 5,
      isActive: true,
      priority: 0,
    },
  });
  console.log(`  ✓ Flight Default — 5% markup (id: ${flightRule.id})`);

  console.log('\nDone. Run ./Governance/scripts/Cckr-api-config-check.sh after any config change.');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
