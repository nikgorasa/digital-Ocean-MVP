import { encrypt } from '../src/lib/crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  await prisma.configProvider.upsert({
    where: { provider: 'tbo_hotel' },
    update: {
      label: 'TBO Hotel (Search/Book)',
      baseUrl: 'https://affiliate.tektravels.com/HotelAPI',
      bookingUrl: 'https://HotelBE.tektravels.com/hotelservice.svc/rest',
      staticUrl: null,
      clientId: 'ApiIntegrationNew',
      encryptedUsername: encrypt('RasaT'),
      encryptedPassword: encrypt('RasaT@123'),
      encryptedStaticUsername: null,
      encryptedStaticPassword: null,
      forceMock: false,
      isActive: true,
      updatedBy: 'seed-script',
    },
    create: {
      provider: 'tbo_hotel',
      label: 'TBO Hotel (Search/Book)',
      baseUrl: 'https://affiliate.tektravels.com/HotelAPI',
      bookingUrl: 'https://HotelBE.tektravels.com/hotelservice.svc/rest',
      staticUrl: null,
      clientId: 'ApiIntegrationNew',
      encryptedUsername: encrypt('RasaT'),
      encryptedPassword: encrypt('RasaT@123'),
      encryptedStaticUsername: null,
      encryptedStaticPassword: null,
      forceMock: false,
      isActive: true,
      updatedBy: 'seed-script',
    },
  });
  console.log('tbo_hotel seeded');

  await prisma.configProvider.upsert({
    where: { provider: 'tbo_hotel_static' },
    update: {
      label: 'TBO Hotel (Static Data)',
      baseUrl: null,
      bookingUrl: null,
      staticUrl: 'http://api.tbotechnology.in/TBOHolidays_HotelAPI',
      clientId: null,
      encryptedUsername: null,
      encryptedPassword: null,
      encryptedStaticUsername: encrypt('TBOStaticAPITest'),
      encryptedStaticPassword: encrypt('Tbo@11530818'),
      forceMock: false,
      isActive: true,
      updatedBy: 'seed-script',
    },
    create: {
      provider: 'tbo_hotel_static',
      label: 'TBO Hotel (Static Data)',
      baseUrl: null,
      bookingUrl: null,
      staticUrl: 'http://api.tbotechnology.in/TBOHolidays_HotelAPI',
      clientId: null,
      encryptedUsername: null,
      encryptedPassword: null,
      encryptedStaticUsername: encrypt('TBOStaticAPITest'),
      encryptedStaticPassword: encrypt('Tbo@11530818'),
      forceMock: false,
      isActive: true,
      updatedBy: 'seed-script',
    },
  });
  console.log('tbo_hotel_static seeded');

  await prisma.configProvider.upsert({
    where: { provider: 'tbo_flight' },
    update: {
      label: 'TBO Flight',
      baseUrl: 'https://affiliate.tektravels.com/FlightAPI',
      bookingUrl: null,
      staticUrl: null,
      clientId: 'ApiIntegrationNew',
      encryptedUsername: encrypt('RasaT'),
      encryptedPassword: encrypt('RasaT@123'),
      encryptedStaticUsername: null,
      encryptedStaticPassword: null,
      forceMock: false,
      isActive: true,
      updatedBy: 'seed-script',
    },
    create: {
      provider: 'tbo_flight',
      label: 'TBO Flight',
      baseUrl: 'https://affiliate.tektravels.com/FlightAPI',
      bookingUrl: null,
      staticUrl: null,
      clientId: 'ApiIntegrationNew',
      encryptedUsername: encrypt('RasaT'),
      encryptedPassword: encrypt('RasaT@123'),
      encryptedStaticUsername: null,
      encryptedStaticPassword: null,
      forceMock: false,
      isActive: true,
      updatedBy: 'seed-script',
    },
  });
  console.log('tbo_flight seeded');

  const all = await prisma.configProvider.findMany({ orderBy: { provider: 'asc' } });
  for (const r of all) {
    console.log(`${r.provider}: user=${r.encryptedUsername ? 'SET' : 'NULL'} pass=${r.encryptedPassword ? 'SET' : 'NULL'} staticUser=${r.encryptedStaticUsername ? 'SET' : 'NULL'} staticPass=${r.encryptedStaticPassword ? 'SET' : 'NULL'}`);
  }
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
