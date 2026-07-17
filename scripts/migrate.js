const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not configured in .env');
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  try {
    console.log('Running database alteration to add cost column to rundown_activities...');
    
    await sql`
      ALTER TABLE rundown_activities 
      ADD COLUMN IF NOT EXISTS cost numeric(12, 2) DEFAULT 0.00;
    `;

    console.log('✓ Migration executed successfully! Column "cost" added to "rundown_activities".');
    process.exit(0);
  } catch (error) {
    console.error('Failed to run migration:', error);
    process.exit(1);
  }
}

runMigration();
