const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  const c = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Check pricing tables
  const tables = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%ricing%'`);
  console.log('Pricing-related tables:', tables.rows);

  // Check column
  const cols = await c.query(`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'PricingRule'`);
  console.log('PricingRule columns:', cols.rows);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
