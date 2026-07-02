-- ============================================================
-- FIX: Update password_hash superadmin agar cocok dengan SHA-256
-- yang digunakan oleh adminAuthService.ts di frontend
--
-- Format hash: SHA-256 dari string "username:password"
-- Contoh: SHA-256("superadmin:admin123")
--
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Update hash superadmin ke format SHA-256("superadmin:admin123")
UPDATE public.admin_accounts
SET password_hash = '3630669b602f85b277c597ae70efacb1e4b720bdbd9a34d36f10d0fe87d55616'
WHERE username = 'superadmin';

-- Verifikasi hasilnya
SELECT id, username, name, role, is_active, 
       LEFT(password_hash, 20) || '...' AS hash_preview
FROM public.admin_accounts;

-- ============================================================
-- Setelah ini, login dengan:
--   Username : superadmin
--   Password : admin123
--
-- SEGERA GANTI PASSWORD setelah login pertama!
-- ============================================================
