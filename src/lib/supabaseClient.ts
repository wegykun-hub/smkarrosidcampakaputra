import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;

// Debug — tampil di browser console saat dev
console.log('[Supabase] URL:', supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : 'TIDAK ADA');
console.log('[Supabase] Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'TIDAK ADA');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] KONFIGURASI TIDAK LENGKAP — cek file .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
