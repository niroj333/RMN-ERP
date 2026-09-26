import argon2 from 'argon2';
import postgres from 'postgres';

const sql = postgres('postgresql://rmn:rmn_dev_password@localhost:5432/rmn_erp');

async function seed() {
  const passwordHash = await argon2.hash('Admin123!');
  
  // Insert test user
  await sql`
    INSERT INTO users (id, email, password_hash, status, is_mfa_enabled, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'admin@rmn.edu.np',
      ${passwordHash},
      'ACTIVE',
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING
  `;

  console.log('✅ Test user created: admin@rmn.edu.np / Admin123!');
  
  await sql.end();
}

seed().catch(console.error);
