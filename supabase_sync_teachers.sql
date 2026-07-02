-- ============================================================
-- SYNC: Salin data teachers → teacher_profiles
-- Jalankan SETELAH supabase_schema_patch.sql
-- ============================================================

-- Masukkan data dari teachers ke teacher_profiles jika belum ada
INSERT INTO public.teacher_profiles (
  id, kode_guru, nama, jabatan, kategori,
  foto, pendidikan, mata_pelajaran, email, nip
)
SELECT
  gen_random_uuid()::text,
  t.kode_guru,
  t.nama,
  t.jabatan,
  CASE
    WHEN t.jabatan ILIKE '%kepala sekolah%' THEN 'PIMPINAN'
    WHEN t.jabatan ILIKE '%wakil%' THEN 'PIMPINAN'
    WHEN t.mata_pelajaran ILIKE '%jaringan%'
      OR t.mata_pelajaran ILIKE '%komputer%'
      OR t.mata_pelajaran ILIKE '%linux%'
      OR t.mata_pelajaran ILIKE '%mikrotik%'
      OR t.kode_guru ILIKE 'TKJ%' THEN 'TKJ'
    WHEN t.mata_pelajaran ILIKE '%marketing%'
      OR t.mata_pelajaran ILIKE '%pemasaran%'
      OR t.mata_pelajaran ILIKE '%digital%'
      OR t.kode_guru ILIKE 'BDP%' THEN 'PEMASARAN'
    ELSE 'UMUM'
  END,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  '',
  COALESCE(t.mata_pelajaran, ''),
  '',
  t.nip
FROM public.teachers t
WHERE NOT EXISTS (
  SELECT 1 FROM public.teacher_profiles tp
  WHERE tp.kode_guru = t.kode_guru
);

-- Verifikasi
SELECT
  tp.kode_guru,
  tp.nama,
  tp.jabatan,
  tp.kategori
FROM public.teacher_profiles tp
ORDER BY tp.jabatan;
