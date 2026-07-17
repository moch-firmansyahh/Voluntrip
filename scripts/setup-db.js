const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('xxxxxx')) {
  console.error('Error: DATABASE_URL is not configured properly in .env');
  process.exit(1);
}

console.log('Connecting to Supabase Database...');

const sql = postgres(connectionString, {
  ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : false,
});

async function runSetup() {
  try {
    const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
    console.log(`Reading schema file from: ${schemaPath}`);
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running database setup queries. Please wait...');
    
    // Execute the SQL file content directly
    await sql.unsafe(sqlContent);

    console.log('--------------------------------------------------');
    console.log('✓ Database setup completed successfully!');
    console.log('✓ All tables created and admin user seeded.');
    console.log('--------------------------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to set up database:', error);
    process.exit(1);
  }
}

runSetup();
