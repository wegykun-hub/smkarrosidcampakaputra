-- ============================================================
-- SETUP LENGKAP DATABASE - SMK AR ROSYID CAMPAKA PUTRA
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- Urutan sudah benar, jalankan semua sekaligus
-- ============================================================

-- ── STEP 1: Patch kolom yang mungkin belum ada ─────────────
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE public.teachers         ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS kategori TEXT NOT NULL DEFAULT 'UMUM';
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS foto TEXT NOT NULL DEFAULT '';
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS pendidikan TEXT NOT NULL DEFAULT '';
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

-- Kolom marquee untuk running text & label kotak merah
ALTER TABLE public.general_settings ADD COLUMN IF NOT EXISTS marquee_text TEXT NOT NULL DEFAULT '';
ALTER TABLE public.general_settings ADD COLUMN IF NOT EXISTS marquee_label TEXT NOT NULL DEFAULT 'INFO SPMB:';

-- Kolom penilaian guru di elearning_submissions
ALTER TABLE public.elearning_submissions ADD COLUMN IF NOT EXISTS graded_by TEXT;
ALTER TABLE public.elearning_submissions ADD COLUMN IF NOT EXISTS mata_pelajaran TEXT;
ALTER TABLE public.elearning_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

-- ── STEP 1B: Pisahkan data per kelas (absensi & nilai) ──────

-- Tambah kolom kelas & jurusan ke student_attendance
ALTER TABLE public.student_attendance ADD COLUMN IF NOT EXISTS jurusan TEXT;

-- Tambah kolom kelas ke elearning_submissions
ALTER TABLE public.elearning_submissions ADD COLUMN IF NOT EXISTS kelas TEXT;

-- Index untuk query cepat per kelas
CREATE INDEX IF NOT EXISTS idx_student_att_kelas ON public.student_attendance(kelas);
CREATE INDEX IF NOT EXISTS idx_submissions_kelas ON public.elearning_submissions(kelas);
CREATE INDEX IF NOT EXISTS idx_student_att_kelas_status ON public.student_attendance(kelas, status);

-- ── STEP 1C: Isi kolom kelas dari data siswa terdaftar ──────

-- Update student_attendance yang kelas/jurusan-nya kosong
UPDATE public.student_attendance sa
SET kelas = es.kelas, jurusan = es.jurusan
FROM public.enrolled_students es
WHERE sa.nisn = es.nisn
  AND (sa.kelas IS NULL OR sa.kelas = '');

-- Update elearning_submissions yang kelas-nya kosong
UPDATE public.elearning_submissions es_sub
SET kelas = enr.kelas
FROM public.enrolled_students enr
WHERE es_sub.student_nisn = enr.nisn
  AND (es_sub.kelas IS NULL OR es_sub.kelas = '');

-- ── STEP 1D: Views per kelas ─────────────────────────────────

-- VIEW: Absensi per kelas
CREATE OR REPLACE VIEW public.v_absensi_kelas_x AS
  SELECT *, 'X' AS filter_kelas FROM public.student_attendance WHERE kelas = 'X' ORDER BY created_at DESC;
CREATE OR REPLACE VIEW public.v_absensi_kelas_xi AS
  SELECT *, 'XI' AS filter_kelas FROM public.student_attendance WHERE kelas = 'XI' ORDER BY created_at DESC;
CREATE OR REPLACE VIEW public.v_absensi_kelas_xii AS
  SELECT *, 'XII' AS filter_kelas FROM public.student_attendance WHERE kelas = 'XII' ORDER BY created_at DESC;

-- VIEW: Nilai per kelas (join dengan enrolled_students untuk dapat kelas)
CREATE OR REPLACE VIEW public.v_nilai_kelas_x AS
  SELECT es.*, COALESCE(es.kelas, enr.kelas) AS kelas_real, enr.jurusan
  FROM public.elearning_submissions es
  LEFT JOIN public.enrolled_students enr ON es.student_nisn = enr.nisn
  WHERE COALESCE(es.kelas, enr.kelas) = 'X' ORDER BY es.created_at DESC;

CREATE OR REPLACE VIEW public.v_nilai_kelas_xi AS
  SELECT es.*, COALESCE(es.kelas, enr.kelas) AS kelas_real, enr.jurusan
  FROM public.elearning_submissions es
  LEFT JOIN public.enrolled_students enr ON es.student_nisn = enr.nisn
  WHERE COALESCE(es.kelas, enr.kelas) = 'XI' ORDER BY es.created_at DESC;

CREATE OR REPLACE VIEW public.v_nilai_kelas_xii AS
  SELECT es.*, COALESCE(es.kelas, enr.kelas) AS kelas_real, enr.jurusan
  FROM public.elearning_submissions es
  LEFT JOIN public.enrolled_students enr ON es.student_nisn = enr.nisn
  WHERE COALESCE(es.kelas, enr.kelas) = 'XII' ORDER BY es.created_at DESC;

-- ── STEP 2: Tabel absensi terpisah (BARU) ──────────────────

-- ── TABEL FASILITAS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fasilitas (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  name        TEXT NOT NULL,
  deskripsi   TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_fasilitas_sort ON public.fasilitas(sort_order);

ALTER TABLE public.fasilitas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fasilitas select" ON public.fasilitas;
DROP POLICY IF EXISTS "fasilitas write"  ON public.fasilitas;
CREATE POLICY "fasilitas select" ON public.fasilitas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "fasilitas write"  ON public.fasilitas FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed data fasilitas default
INSERT INTO public.fasilitas (id, name, deskripsi, image, sort_order) VALUES
  ('fas-1', 'Laboratorium Komputer TKJ',
   'Lab ber-AC dengan koneksi internet serat optik berkecepatan tinggi, dilengkapi server mandiri dan perangkat Cisco/Mikrotik untuk praktik jaringan.',
   'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800', 0),
  ('fas-2', 'Business Center & Laboratorium Retail',
   'Tempat praktik mini-market dan digital marketing, di mana siswa Pemasaran langsung mengelola transaksi riil dan strategi promosi.',
   'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=800', 1),
  ('fas-3', 'Perpustakaan & Ruang Baca',
   'Koleksi buku kurikulum, literatur teknis, keislaman, serta fiksi yang lengkap dengan area membaca yang kondusif serta e-library.',
   'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800', 2),
  ('fas-4', 'Masjid & Sarana Beribadah',
   'Pusat kegiatan keagamaan siswa untuk membiasakan shalat berjamaah, pengajian harian, serta pembangunan karakter Islami.',
   'https://images.unsplash.com/photo-1597935258735-e254c1839512?auto=format&fit=crop&q=80&w=800', 3),
  ('fas-5', 'Lapangan Olahraga Serbaguna',
   'Fasilitas olahraga terbuka untuk Futsal, Basket, Voli, dan kegiatan upacara bendera serta ekstrakurikuler rutin.',
   'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=800', 4)
ON CONFLICT (id) DO NOTHING;


-- Tabel absensi SISWA
CREATE TABLE IF NOT EXISTS public.student_attendance (
  id                 TEXT PRIMARY KEY,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  nisn               TEXT NOT NULL,
  nama               TEXT NOT NULL,
  kelas              TEXT,
  jurusan            TEXT,
  type               TEXT NOT NULL CHECK (type IN ('MASUK','PULANG')),
  timestamp          TEXT NOT NULL,
  photo              TEXT NOT NULL DEFAULT '',
  latitude           DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude          DOUBLE PRECISION NOT NULL DEFAULT 0,
  distance_in_meters INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL CHECK (status IN ('TEPAT WAKTU','TERLAMBAT','PULANG'))
);
CREATE INDEX IF NOT EXISTS idx_student_att_nisn    ON public.student_attendance(nisn);
CREATE INDEX IF NOT EXISTS idx_student_att_created ON public.student_attendance(created_at DESC);

-- Tabel absensi GURU
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id                 TEXT PRIMARY KEY,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  kode_guru          TEXT NOT NULL,
  nama               TEXT NOT NULL,
  jabatan            TEXT,
  type               TEXT NOT NULL CHECK (type IN ('MASUK','PULANG')),
  timestamp          TEXT NOT NULL,
  photo              TEXT NOT NULL DEFAULT '',
  latitude           DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude          DOUBLE PRECISION NOT NULL DEFAULT 0,
  distance_in_meters INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL CHECK (status IN ('TEPAT WAKTU','TERLAMBAT','PULANG'))
);
CREATE INDEX IF NOT EXISTS idx_teacher_att_kode    ON public.teacher_attendance(kode_guru);
CREATE INDEX IF NOT EXISTS idx_teacher_att_created ON public.teacher_attendance(created_at DESC);

-- ── STEP 3: RLS untuk tabel absensi baru ───────────────────
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_att insert" ON public.student_attendance;
DROP POLICY IF EXISTS "student_att select" ON public.student_attendance;
DROP POLICY IF EXISTS "student_att delete" ON public.student_attendance;
DROP POLICY IF EXISTS "teacher_att insert" ON public.teacher_attendance;
DROP POLICY IF EXISTS "teacher_att select" ON public.teacher_attendance;
DROP POLICY IF EXISTS "teacher_att delete" ON public.teacher_attendance;

CREATE POLICY "student_att insert" ON public.student_attendance
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "student_att select" ON public.student_attendance
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "student_att delete" ON public.student_attendance
  FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "teacher_att insert" ON public.teacher_attendance
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "teacher_att select" ON public.teacher_attendance
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "teacher_att delete" ON public.teacher_attendance
  FOR DELETE TO anon, authenticated USING (true);

-- ── STEP 4: Migrasi data lama (opsional) ───────────────────
INSERT INTO public.student_attendance
  (id, created_at, nisn, nama, kelas, type, timestamp, photo,
   latitude, longitude, distance_in_meters, status)
SELECT id, created_at, id_number, name, kelas, type, timestamp, photo,
  latitude, longitude, distance_in_meters, status
FROM public.attendance_records WHERE role = 'SISWA'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.teacher_attendance
  (id, created_at, kode_guru, nama, type, timestamp, photo,
   latitude, longitude, distance_in_meters, status)
SELECT id, created_at, id_number, name, type, timestamp, photo,
  latitude, longitude, distance_in_meters, status
FROM public.attendance_records WHERE role = 'GURU'
ON CONFLICT (id) DO NOTHING;

-- ── STEP 5: RLS admin_accounts ─────────────────────────────
DROP POLICY IF EXISTS "Admin accounts hanya untuk authenticated" ON public.admin_accounts;
DROP POLICY IF EXISTS "Admin login select"    ON public.admin_accounts;
DROP POLICY IF EXISTS "Admin insert via anon" ON public.admin_accounts;
DROP POLICY IF EXISTS "Admin update via anon" ON public.admin_accounts;

CREATE POLICY "Admin login select" ON public.admin_accounts
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert via anon" ON public.admin_accounts
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin update via anon" ON public.admin_accounts
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ── STEP 6: Fix password hash superadmin ───────────────────
-- SHA-256("superadmin:admin123")
UPDATE public.admin_accounts
SET password_hash = '3630669b602f85b277c597ae70efacb1e4b720bdbd9a34d36f10d0fe87d55616'
WHERE username = 'superadmin';

-- ── STEP 7: Sync teachers → teacher_profiles ───────────────
INSERT INTO public.teacher_profiles
  (id, kode_guru, nama, jabatan, kategori, foto, pendidikan, mata_pelajaran, email, nip)
SELECT
  gen_random_uuid()::text,
  t.kode_guru, t.nama, t.jabatan,
  CASE
    WHEN t.jabatan ILIKE '%kepala sekolah%' OR t.jabatan ILIKE '%wakil%' THEN 'PIMPINAN'
    WHEN t.mata_pelajaran ILIKE '%jaringan%' OR t.kode_guru ILIKE 'TKJ%' THEN 'TKJ'
    WHEN t.mata_pelajaran ILIKE '%marketing%' OR t.mata_pelajaran ILIKE '%pemasaran%'
      OR t.kode_guru ILIKE 'BDP%' THEN 'PEMASARAN'
    ELSE 'UMUM'
  END,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  '', COALESCE(t.mata_pelajaran,''), '', t.nip
FROM public.teachers t
WHERE NOT EXISTS (
  SELECT 1 FROM public.teacher_profiles tp WHERE tp.kode_guru = t.kode_guru
);

-- ── STEP 8: Storage buckets ────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('attendance-photos', 'attendance-photos', false, 5242880,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('website-images', 'website-images', true, 10485760,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit;

-- Storage RLS
DROP POLICY IF EXISTS "attendance upload" ON storage.objects;
DROP POLICY IF EXISTS "attendance read"   ON storage.objects;
DROP POLICY IF EXISTS "website insert"    ON storage.objects;
DROP POLICY IF EXISTS "website select"    ON storage.objects;
DROP POLICY IF EXISTS "website update"    ON storage.objects;
DROP POLICY IF EXISTS "website delete"    ON storage.objects;

CREATE POLICY "attendance upload" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'attendance-photos');
CREATE POLICY "attendance read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'attendance-photos');
CREATE POLICY "website insert" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'website-images');
CREATE POLICY "website select" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'website-images');
CREATE POLICY "website update" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'website-images')
  WITH CHECK (bucket_id = 'website-images');
CREATE POLICY "website delete" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'website-images');

-- ── VERIFIKASI AKHIR ────────────────────────────────────────
SELECT tabel, jumlah FROM (
  SELECT 'admin_accounts'      AS tabel, COUNT(*)::int AS jumlah FROM public.admin_accounts
  UNION ALL SELECT 'enrolled_students',    COUNT(*) FROM public.enrolled_students
  UNION ALL SELECT 'teachers',             COUNT(*) FROM public.teachers
  UNION ALL SELECT 'teacher_profiles',     COUNT(*) FROM public.teacher_profiles
  UNION ALL SELECT 'student_attendance',   COUNT(*) FROM public.student_attendance
  UNION ALL SELECT 'teacher_attendance',   COUNT(*) FROM public.teacher_attendance
  UNION ALL SELECT 'spmb_registrations',   COUNT(*) FROM public.spmb_registrations
  UNION ALL SELECT 'elearning_submissions',COUNT(*) FROM public.elearning_submissions
  UNION ALL SELECT 'news',                 COUNT(*) FROM public.news
  UNION ALL SELECT 'fasilitas',            COUNT(*) FROM public.fasilitas
  UNION ALL SELECT 'general_settings',     COUNT(*) FROM public.general_settings
) x ORDER BY tabel;

-- Rekap absensi per kelas
SELECT kelas, COUNT(*) AS total_absensi,
  SUM(CASE WHEN status='TEPAT WAKTU' THEN 1 ELSE 0 END) AS tepat_waktu,
  SUM(CASE WHEN status='TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat
FROM public.student_attendance
GROUP BY kelas ORDER BY kelas;

-- Rekap nilai per kelas
SELECT COALESCE(kelas,'-') AS kelas, COUNT(*) AS total_tugas,
  SUM(CASE WHEN status='graded' THEN 1 ELSE 0 END) AS sudah_dinilai,
  ROUND(AVG(CASE WHEN grade IS NOT NULL THEN grade END), 1) AS rata_nilai
FROM public.elearning_submissions
GROUP BY kelas ORDER BY kelas;

SELECT id, name, public FROM storage.buckets
WHERE id IN ('attendance-photos','website-images');
