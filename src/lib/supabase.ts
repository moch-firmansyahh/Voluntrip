import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const connectionString = process.env.DATABASE_URL || '';

// Server-side Direct Postgres SQL client
let sql: any;
try {
  sql = postgres(connectionString, {
    ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
} catch (error) {
  console.error('Failed to initialize Postgres client:', error);
  // Fail-safe mock/error wrapper to prevent complete crashing (NFR-8)
  sql = () => {
    throw new Error('Database connection is not configured.');
  };
}

// Supabase Client for storage and client-side helpers
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { sql };
