import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ONE-TIME INITIALIZER — do NOT re-run after rules are edited/deleted via admin.
// Run only when PricingRule table is completely empty.
async function init() {
  const count = await prisma.pricingRule.count();
  if (count > 0) {
    console.log(`PricingRule table already has ${count} row(s). Aborting to avoid duplicates.`);
    console.log('If you want to re-run, delete all rules first via /admin/pricing');
    process.exit(0);
  }

  const HOTEL_RULES = [
    { hotelCode: "1031455", hotelName: "Midtown Hotel" },
    { hotelCode: "1031524", hotelName: "Hotel Delhi 37" },
    { hotelCode: "1031428", hotelName: "Jukaso Inn Down Town" },
    { hotelCode: "1014919", hotelName: "Hotel Africa Avenue G K 1" },
    { hotelCode: "1016775", hotelName: "Park Ascent" },
    { hotelCode: "1016351", hotelName: "Eros Hotel New Delhi by IHG" },
    { hotelCode: "1031465", hotelName: "Majestic Palace" },
  ];

  console.log('Table is empty — seeding initial rules...');

  for (const hotel of HOTEL_RULES) {
    await prisma.pricingRule.create({
      data: {
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

  await prisma.pricingRule.create({
    data: {
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
  console.log(`  ✓ Flight Default — 5% markup`);

  console.log('\nDone. Admin panel at /admin/pricing is the source of truth for all future changes.');
}

init()
  .catch((e) => {
    console.error('Init failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
