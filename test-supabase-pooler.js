const postgres = require('postgres');

const regions = ['ap-southeast-1', 'us-east-1'];

async function testRegion(region) {
  const connectionString = `postgresql://postgres.xydlmavqlhfbtvsrlrtv:Holiday12345JalanJalan_@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
  console.log(`Testing ${region} pooler...`);
  const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    connect_timeout: 4
  });

  try {
    const result = await sql`SELECT 1 as result`;
    console.log(`Success connecting via ${region}!`, result);
    await sql.end();
    return true;
  } catch (err) {
    console.error(`Failed for ${region}:`, err.message);
    await sql.end();
    return false;
  }
}

async function main() {
  for (const r of regions) {
    const ok = await testRegion(r);
    if (ok) {
      console.log(`FOUND WORKING REGION POOLER: ${r}`);
      process.exit(0);
    }
  }
  console.log('No pooler region worked!');
  process.exit(1);
}

main();
