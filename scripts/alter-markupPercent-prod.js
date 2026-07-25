const { execSync } = require('child_process');

const dotenv = execSync('cat .env.production')
  .toString()
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .map(line => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  });

const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const c = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await c.connect();

  console.log('Applying ALTER TABLE PricingRule ALTER COLUMN markupPercent DROP NOT NULL...');
  await c.query('ALTER TABLE "PricingRule" ALTER COLUMN markupPercent DROP NOT NULL');
  console.log('Done');

  const cols = await c.query(`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'PricingRule' AND column_name = 'markupPercent'`);
  console.log('Verification:', cols.rows);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
