-- ============================================================
-- PISAHKAN TABEL ABSENSI SISWA DAN GURU
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. TABEL ABSENSI SISWA ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_attendance (
  id                    TEXT PRIMARY KEY,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  nisn                  TEXT NOT NULL,               -- NISN siswa
  nama                  TEXT NOT NULL,
  kelas                 TEXT,                         -- X / XI / XII
  jurusan               TEXT,                         -- TKJ / PEMASARAN / UMUM
  type                  TEXT NOT NULL CHECK (type IN ('MASUK', 'PULANG')),
  timestamp             TEXT NOT NULL,               -- "DD/MM/YYYY HH:MM"
  photo                 TEXT NOT NULL DEFAULT '',    -- URL Storage atau base64
  latitude              DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude             DOUBLE PRECISION NOT NULL DEFAULT 0,
  distance_in_meters    INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL
                        CHECK (status IN ('TEPAT WAKTU', 'TERLAMBAT', 'PULANG'))
);

CREATE INDEX IF NOT EXISTS idx_student_att_nisn    ON public.student_attendance(nisn);
CREATE INDEX IF NOT EXISTS idx_student_att_created ON public.student_attendance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_att_status  ON public.student_attendance(status);

-- ── 2. TABEL ABSENSI GURU ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id                    TEXT PRIMARY KEY,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  kode_guru             TEXT NOT NULL,               -- Kode guru (AR-01, TKJ-01, dll)
  nama                  TEXT NOT NULL,
  jabatan               TEXT,
  type                  TEXT NOT NULL CHECK (type IN ('MASUK', 'PULANG')),
  timestamp             TEXT NOT NULL,
  photo                 TEXT NOT NULL DEFAULT '',
  latitude              DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude             DOUBLE PRECISION NOT NULL DEFAULT 0,
  distance_in_meters    INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL
                        CHECK (status IN ('TEPAT WAKTU', 'TERLAMBAT', 'PULANG'))
);

CREATE INDEX IF NOT EXISTS idx_teacher_att_kode    ON public.teacher_attendance(kode_guru);
CREATE INDEX IF NOT EXISTS idx_teacher_att_created ON public.teacher_attendance(created_at DESC);

-- ── 3. RLS POLICIES ────────────────────────────────────────
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Siapa saja bisa INSERT (kiosk absensi publik)
CREATE POLICY "Siswa absensi insert"
  ON public.student_attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Siswa absensi select"
  ON public.student_attendance FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Siswa absensi delete"
  ON public.student_attendance FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Guru absensi insert"
  ON public.teacher_attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Guru absensi select"
  ON public.teacher_attendance FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Guru absensi delete"
  ON public.teacher_attendance FOR DELETE TO anon, authenticated USING (true);

-- ── 4. MIGRASI DATA LAMA (opsional) ────────────────────────
-- Pindahkan data dari attendance_records ke tabel baru
INSERT INTO public.student_attendance
  (id, created_at, nisn, nama, kelas, type, timestamp, photo,
   latitude, longitude, distance_in_meters, status)
SELECT
  id, created_at, id_number, name, kelas, type, timestamp, photo,
  latitude, longitude, distance_in_meters, status
FROM public.attendance_records
WHERE role = 'SISWA'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.teacher_attendance
  (id, created_at, kode_guru, nama, type, timestamp, photo,
   latitude, longitude, distance_in_meters, status)
SELECT
  id, created_at, id_number, name, type, timestamp, photo,
  latitude, longitude, distance_in_meters, status
FROM public.attendance_records
WHERE role = 'GURU'
ON CONFLICT (id) DO NOTHING;

-- ── 5. VERIFIKASI ──────────────────────────────────────────
SELECT 'student_attendance' AS tabel, COUNT(*) AS jumlah FROM public.student_attendance
UNION ALL
SELECT 'teacher_attendance', COUNT(*) FROM public.teacher_attendance
UNION ALL
SELECT 'attendance_records (lama)', COUNT(*) FROM public.attendance_records;
