-- ============================================================
-- FIX: RLS Policy untuk tabel teachers
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Tambah policy INSERT/UPDATE/DELETE untuk tabel teachers
DROP POLICY IF EXISTS "teachers insert" ON public.teachers;
DROP POLICY IF EXISTS "teachers update" ON public.teachers;
DROP POLICY IF EXISTS "teachers delete" ON public.teachers;
DROP POLICY IF EXISTS "Guru bisa dibaca publik" ON public.teachers;

-- SELECT: publik bisa baca (untuk autocomplete absensi)
CREATE POLICY "teachers select" ON public.teachers
  FOR SELECT TO anon, authenticated USING (true);

-- INSERT: anon dan authenticated bisa insert (admin panel)
CREATE POLICY "teachers insert" ON public.teachers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- UPDATE: anon dan authenticated bisa update
CREATE POLICY "teachers update" ON public.teachers
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- DELETE: anon dan authenticated bisa delete
CREATE POLICY "teachers delete" ON public.teachers
  FOR DELETE TO anon, authenticated USING (true);

-- Sync: masukkan semua guru dari teacher_profiles ke teachers
INSERT INTO public.teachers (kode_guru, nip, nama, jabatan, mata_pelajaran, status)
SELECT 
  tp.kode_guru,
  tp.nip,
  tp.nama,
  COALESCE(tp.jabatan, 'Tenaga Pengajar'),
  tp.mata_pelajaran,
  'AKTIF'
FROM public.teacher_profiles tp
WHERE NOT EXISTS (
  SELECT 1 FROM public.teachers t WHERE t.kode_guru = tp.kode_guru
);

-- Verifikasi
SELECT kode_guru, nama, jabatan FROM public.teachers ORDER BY kode_guru;
