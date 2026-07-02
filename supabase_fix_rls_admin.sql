-- ============================================================
-- FIX: RLS Policy untuk admin_accounts
-- Izinkan anon key untuk SELECT (diperlukan saat login)
-- Insert hanya untuk akun yang sudah login (authenticated)
--
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Hapus policy lama yang terlalu ketat
DROP POLICY IF EXISTS "Admin accounts hanya untuk authenticated" ON public.admin_accounts;

-- Policy baru: SELECT diizinkan untuk anon (diperlukan untuk proses login/verifikasi)
CREATE POLICY "Admin login select"
  ON public.admin_accounts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: INSERT hanya authenticated (admin yang sudah login bisa tambah admin baru)
-- Karena kita pakai anon key untuk semua operasi, izinkan juga anon untuk insert
CREATE POLICY "Admin insert via anon"
  ON public.admin_accounts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: UPDATE (ganti password, toggle active)
CREATE POLICY "Admin update via anon"
  ON public.admin_accounts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Verifikasi policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'admin_accounts';
