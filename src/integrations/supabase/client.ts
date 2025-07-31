import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nxeiaizohtqyktlpgqzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZWlhaXpvaHRxeWt0bHBncXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDM2ODcsImV4cCI6MjA2NTgxOTY4N30.mXXU6f4AKKRfdnZgl88p3LxE6_bpiKiErr9BmZeD8YY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});