-- ============================================================
-- SCHEMA PATCH — Tambahan kolom & index
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Tambah kolom nip di teacher_profiles (opsional)
ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS nip TEXT;

-- Tambah kolom nip di teachers jika belum ada
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS nip TEXT;

-- ── Pastikan tabel teacher_profiles punya semua kolom yang dibutuhkan ──
-- (sudah ada di schema_v2.sql, ini hanya safety patch)
ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS kategori TEXT NOT NULL DEFAULT 'UMUM';

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS foto TEXT NOT NULL DEFAULT '';

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS pendidikan TEXT NOT NULL DEFAULT '';

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

-- Verifikasi kolom tabel
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
