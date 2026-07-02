-- ============================================================
-- JALANKAN FILE INI DI SUPABASE SQL EDITOR
-- URL: https://supabase.com/dashboard/project/aermtvrmnntyjdapzdnk/sql/new
-- ============================================================

-- 1. Buat tabel fasilitas (desc → deskripsi)
CREATE TABLE IF NOT EXISTS public.fasilitas (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  name        TEXT NOT NULL,
  deskripsi   TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.fasilitas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fasilitas select" ON public.fasilitas;
DROP POLICY IF EXISTS "fasilitas write"  ON public.fasilitas;
CREATE POLICY "fasilitas select" ON public.fasilitas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "fasilitas write"  ON public.fasilitas FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Seed data fasilitas default
INSERT INTO public.fasilitas (id, name, deskripsi, image, sort_order) VALUES
('fas-1','Laboratorium Komputer TKJ','Lab ber-AC dengan koneksi internet serat optik berkecepatan tinggi, dilengkapi server mandiri dan perangkat Cisco/Mikrotik untuk praktik jaringan.','https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800',0),
('fas-2','Business Center & Laboratorium Retail','Tempat praktik mini-market dan digital marketing, di mana siswa Pemasaran langsung mengelola transaksi riil dan strategi promosi.','https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=800',1),
('fas-3','Perpustakaan & Ruang Baca','Koleksi buku kurikulum, literatur teknis, keislaman, serta fiksi yang lengkap dengan area membaca yang kondusif serta e-library.','https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',2),
('fas-4','Masjid & Sarana Beribadah','Pusat kegiatan keagamaan siswa untuk membiasakan shalat berjamaah, pengajian harian, serta pembangunan karakter Islami.','https://images.unsplash.com/photo-1597935258735-e254c1839512?auto=format&fit=crop&q=80&w=800',3),
('fas-5','Lapangan Olahraga Serbaguna','Fasilitas olahraga terbuka untuk Futsal, Basket, Voli, dan kegiatan upacara bendera serta ekstrakurikuler rutin.','https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=800',4)
ON CONFLICT (id) DO NOTHING;

-- 3. Patch kolom yang mungkin belum ada
ALTER TABLE public.general_settings ADD COLUMN IF NOT EXISTS marquee_text  TEXT NOT NULL DEFAULT '';
ALTER TABLE public.general_settings ADD COLUMN IF NOT EXISTS marquee_label TEXT NOT NULL DEFAULT 'INFO SPMB:';
ALTER TABLE public.elearning_submissions ADD COLUMN IF NOT EXISTS graded_by     TEXT;
ALTER TABLE public.elearning_submissions ADD COLUMN IF NOT EXISTS mata_pelajaran TEXT;
ALTER TABLE public.elearning_submissions ADD COLUMN IF NOT EXISTS graded_at     TIMESTAMPTZ;
ALTER TABLE public.elearning_submissions ADD COLUMN IF NOT EXISTS kelas         TEXT;
ALTER TABLE public.student_attendance    ADD COLUMN IF NOT EXISTS jurusan       TEXT;
ALTER TABLE public.teacher_profiles      ADD COLUMN IF NOT EXISTS nip           TEXT;
ALTER TABLE public.teachers              ADD COLUMN IF NOT EXISTS nip           TEXT;

-- 4. Index per kelas
CREATE INDEX IF NOT EXISTS idx_student_att_kelas   ON public.student_attendance(kelas);
CREATE INDEX IF NOT EXISTS idx_submissions_kelas   ON public.elearning_submissions(kelas);

-- 5. Update kelas dari enrolled_students
UPDATE public.student_attendance sa
SET kelas = es.kelas, jurusan = es.jurusan
FROM public.enrolled_students es
WHERE sa.nisn = es.nisn AND (sa.kelas IS NULL OR sa.kelas = '');

UPDATE public.elearning_submissions esub
SET kelas = enr.kelas
FROM public.enrolled_students enr
WHERE esub.student_nisn = enr.nisn AND (esub.kelas IS NULL OR esub.kelas = '');

-- 6. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('website-images',    'website-images',    true,  52428800, NULL),
  ('attendance-photos', 'attendance-photos', false,  5242880, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "website insert"    ON storage.objects;
DROP POLICY IF EXISTS "website select"    ON storage.objects;
DROP POLICY IF EXISTS "website update"    ON storage.objects;
DROP POLICY IF EXISTS "website delete"    ON storage.objects;
DROP POLICY IF EXISTS "attendance upload" ON storage.objects;
DROP POLICY IF EXISTS "attendance read"   ON storage.objects;

CREATE POLICY "website insert"    ON storage.objects FOR INSERT    TO anon, authenticated WITH CHECK (bucket_id = 'website-images');
CREATE POLICY "website select"    ON storage.objects FOR SELECT    TO anon, authenticated USING  (bucket_id = 'website-images');
CREATE POLICY "website update"    ON storage.objects FOR UPDATE    TO anon, authenticated USING  (bucket_id = 'website-images') WITH CHECK (bucket_id = 'website-images');
CREATE POLICY "website delete"    ON storage.objects FOR DELETE    TO anon, authenticated USING  (bucket_id = 'website-images');
CREATE POLICY "attendance upload" ON storage.objects FOR INSERT    TO anon, authenticated WITH CHECK (bucket_id = 'attendance-photos');
CREATE POLICY "attendance read"   ON storage.objects FOR SELECT    TO anon, authenticated USING  (bucket_id = 'attendance-photos');

-- 7. Verifikasi hasil
SELECT tabel, jumlah FROM (
  SELECT 'fasilitas'             AS tabel, COUNT(*)::int AS jumlah FROM public.fasilitas
  UNION ALL SELECT 'student_attendance',   COUNT(*) FROM public.student_attendance
  UNION ALL SELECT 'elearning_submissions',COUNT(*) FROM public.elearning_submissions
  UNION ALL SELECT 'general_settings',     COUNT(*) FROM public.general_settings
) x ORDER BY tabel;

SELECT id, name, public FROM storage.buckets WHERE id IN ('website-images','attendance-photos');
