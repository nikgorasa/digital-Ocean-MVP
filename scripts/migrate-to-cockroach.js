const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COCKROACH_URL = process.env.COCKROACH_URL;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const crdb = new Client({ connectionString: COCKROACH_URL });
  await crdb.connect();

  const tables = [
    'Activity','Booking','CancellationRequest','City','Company','CorporateRate',
    'Faq','FaqCategory','Flight','FooterLink','Invoice','Lead','LeadStage',
    'LoyaltyReward','NavigationItem','Package','PackageCategory','Payment',
    'PreferenceOption','PricingRule','PromoCode','QuickTopUpAmount','Redemption',
    'Role','SiteConfig','Testimonial','User','ValueProposition',
    'ticket_activities','ticket_notes','tickets'
  ];

  for (const table of tables) {
    console.log(`Migrating ${table}...`);

    const { data, error } = await supabase.from(table).select('*');
    if (error) { console.error(`  Error reading ${table}: ${error.message}`); continue; }
    if (!data || data.length === 0) { console.log(`  0 rows`); continue; }

    for (const row of data) {
      const columns = Object.keys(row);
      const values = columns.map(c => row[c]);

      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const cols = columns.map(c => `"${c}"`).join(', ');

      try {
        await crdb.query(
          `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
      } catch (e) {
        console.error(`  Error inserting row in ${table}: ${e.message}`);
      }
    }
    console.log(`  ${data.length} rows`);
  }

  console.log('Migration complete');
  await crdb.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
