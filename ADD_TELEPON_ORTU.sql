-- ============================================================
-- Tambah kolom telepon_ortu ke tabel enrolled_students
-- Jalankan di Supabase SQL Editor
-- ============================================================

ALTER TABLE enrolled_students
  ADD COLUMN IF NOT EXISTS telepon_ortu TEXT DEFAULT NULL;

COMMENT ON COLUMN enrolled_students.telepon_ortu 
  IS 'Nomor WA orang tua/wali untuk notifikasi absensi otomatis via Fonnte';

-- Setelah migrasi, isi nomor WA ortu per siswa via AdminPanel
-- atau langsung update via SQL:
-- UPDATE enrolled_students SET telepon_ortu = '08xxxxxxxxxx' WHERE nisn = '0012345678';
