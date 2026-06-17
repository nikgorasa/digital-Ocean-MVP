const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_USERS = [
  { email: 'hmittal@gorasa.in', name: 'Harsh Mittal', role: 'SUPER_ADMIN' },
  { email: 'admin@gorasa.in', name: 'GoRASA Admin', role: 'ADMIN' },
  { email: 'sales@gorasa.in', name: 'Sales Team', role: 'SALES' },
  { email: 'corporate@gorasa.in', name: 'Corporate User', role: 'CORPORATE_USER' },
  { email: 'user@gorasa.in', name: 'Demo Customer', role: 'CUSTOMER' },
  { email: 'test@gorasa.in', name: 'Test User', role: 'CUSTOMER' },
];

async function seed() {
  console.log('Seeding users...');
  
  for (const user of DEMO_USERS) {
    const { data, error } = await supabase
      .from('User')
      .upsert({
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: true,
        walletBalance: 0,
        loyaltyPoints: user.role === 'CUSTOMER' ? 500 : 0,
        loyaltyTier: 'Silver',
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      console.error(`Failed to upsert ${user.email}:`, error.message);
    } else {
      console.log(`✓ ${user.email} (${user.role})`);
    }
  }

  // Verify
  const { data: users, count } = await supabase
    .from('User')
    .select('email, name, role', { count: 'exact' });
  
  console.log(`\nTotal users in database: ${count}`);
  users?.forEach(u => console.log(`  - ${u.email} (${u.role})`));
}

seed().catch(console.error);
