import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    '⚠️  [DATABASE WARNING]: DATABASE_URL is not defined in server/.env.\n' +
    '   Please configure your Supabase PostgreSQL connection string in server/.env.\n' +
    '   Example: DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres'
  );
}

// Enable SSL when connecting to hosted providers like Supabase or in production
const useSSL = 
  process.env.NODE_ENV === 'production' || 
  (connectionString && (connectionString.includes('supabase.com') || connectionString.includes('supabase.co') || connectionString.includes('sslmode=require')));

export const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client pool:', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
};

export default pool;
