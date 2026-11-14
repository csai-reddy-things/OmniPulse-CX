import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ampzuftkoqvzesesunkb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.warn('⚠️ [SUPABASE]: Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY found in environment.');
}

export const supabase = createClient(supabaseUrl, supabaseKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export default supabase;
