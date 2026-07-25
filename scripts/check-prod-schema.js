const { execSync } = require('child_process');

const lines = require('fs').readFileSync('/home/nikhil/Downloads/Gorasa/gorasa-crdb-standalone/.env.production', 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'));

for (const line of lines) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) { console.error('DATABASE_URL missing'); process.exit(1); }

  const c = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const pathRes = await c.query('SHOW search_path');
  console.log('search_path:', pathRes.rows);

  const schemas = await c.query("SELECT schema_name FROM information_schema.schemata");
  console.log('schemas:', schemas.rows);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
