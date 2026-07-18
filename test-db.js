const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Holiday12345JalanJalan_@db.xydlmavqlhfbtvsrlrtv.supabase.co:5432/postgres';
console.log('Testing connection to:', connectionString.substring(0, 50) + '...');

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  connect_timeout: 5
});

async function main() {
  try {
    const result = await sql`SELECT 1 as result`;
    console.log('Database connected successfully! Result:', result);
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

main();
