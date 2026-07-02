-- ============================================================
-- SCHEMA V2 - SMK AR ROSYID CAMPAKA PUTRA
-- Tambahan tabel: news, gallery, slides, settings,
--                 teacher_profiles, elearning_courses,
--                 elearning_submissions, elearning_accounts
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. BERITA ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news (
  id           TEXT PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  title        TEXT NOT NULL,
  excerpt      TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  date         TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'Umum',
  image        TEXT NOT NULL DEFAULT ''
);

-- ── 2. GALERI ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery (
  id           TEXT PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  image        TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'Umum'
);

-- ── 3. SLIDES DASHBOARD ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.slides (
  id           TEXT PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  image        TEXT NOT NULL DEFAULT '',
  title        TEXT NOT NULL DEFAULT '',
  subtitle     TEXT NOT NULL DEFAULT '',
  action_text  TEXT NOT NULL DEFAULT '',
  action_sub   TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- ── 4. PENGATURAN UMUM ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.general_settings (
  id                       TEXT PRIMARY KEY DEFAULT 'main',
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  contact_alamat           TEXT NOT NULL DEFAULT '',
  contact_telepon          TEXT NOT NULL DEFAULT '',
  contact_email            TEXT NOT NULL DEFAULT '',
  contact_jam_kerja        TEXT NOT NULL DEFAULT '',
  contact_instagram        TEXT NOT NULL DEFAULT '',
  contact_youtube          TEXT NOT NULL DEFAULT '',
  contact_map_url          TEXT NOT NULL DEFAULT '',
  visi_text                TEXT NOT NULL DEFAULT '',
  misi_list                JSONB NOT NULL DEFAULT '[]',
  sambutan_nama            TEXT NOT NULL DEFAULT '',
  sambutan_foto            TEXT NOT NULL DEFAULT '',
  sambutan_isi             TEXT NOT NULL DEFAULT '',
  spmb_tahun_ajaran        TEXT NOT NULL DEFAULT '2026/2027',
  spmb_batas_kip           TEXT NOT NULL DEFAULT '',
  spmb_kuota_target        INTEGER NOT NULL DEFAULT 120,
  spmb_status_pendaftaran  TEXT NOT NULL DEFAULT 'DIBUKA',
  absensi_masuk_hour       INTEGER NOT NULL DEFAULT 7,
  absensi_masuk_minute     INTEGER NOT NULL DEFAULT 30,
  absensi_pulang_hour      INTEGER NOT NULL DEFAULT 15,
  school_logo              TEXT NOT NULL DEFAULT '',
  clock_offset             INTEGER NOT NULL DEFAULT 7,
  clock_timezone           TEXT NOT NULL DEFAULT 'WIB'
);

-- ── 5. PROFIL GURU (TentangSekolah) ────────────────────────
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id               TEXT PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  nama             TEXT NOT NULL,
  jabatan          TEXT NOT NULL,
  kategori         TEXT NOT NULL DEFAULT 'UMUM',
  foto             TEXT NOT NULL DEFAULT '',
  pendidikan       TEXT NOT NULL DEFAULT '',
  mata_pelajaran   TEXT NOT NULL DEFAULT '',
  email            TEXT NOT NULL DEFAULT '',
  kode_guru        TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_kode ON public.teacher_profiles(kode_guru);

-- ── 6. E-LEARNING: AKUN SISWA ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.elearning_student_accounts (
  id         TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nisn       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  kelas      TEXT NOT NULL,
  jurusan    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'AKTIF'
             CHECK (status IN ('AKTIF', 'NON_AKTIF'))
);

-- ── 7. E-LEARNING: AKUN GURU ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.elearning_teacher_accounts (
  id             TEXT PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  nip            TEXT NOT NULL,
  name           TEXT NOT NULL,
  mata_pelajaran TEXT NOT NULL DEFAULT '',
  pin_hash       TEXT NOT NULL,  -- SHA-256("nip:pin")
  status         TEXT NOT NULL DEFAULT 'AKTIF'
                 CHECK (status IN ('AKTIF', 'NON_AKTIF'))
);

-- ── 8. E-LEARNING: MATA PELAJARAN & MODUL ──────────────────
CREATE TABLE IF NOT EXISTS public.elearning_courses (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  code        TEXT NOT NULL,
  title       TEXT NOT NULL,
  major       TEXT NOT NULL,
  grade       TEXT NOT NULL,
  teacher     TEXT NOT NULL DEFAULT '',
  modules     JSONB NOT NULL DEFAULT '[]',
  assignments JSONB NOT NULL DEFAULT '[]'
);

-- ── 9. E-LEARNING: PENGUMPULAN TUGAS ───────────────────────
CREATE TABLE IF NOT EXISTS public.elearning_submissions (
  id              TEXT PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  assignment_id   TEXT NOT NULL,
  course_id       TEXT NOT NULL,
  student_name    TEXT NOT NULL,
  student_nisn    TEXT NOT NULL,
  file_name       TEXT NOT NULL DEFAULT '',
  file_base64     TEXT NOT NULL DEFAULT '',
  submitted_at    TEXT NOT NULL,
  grade           INTEGER,
  feedback        TEXT,
  status          TEXT NOT NULL DEFAULT 'submitted'
                  CHECK (status IN ('submitted', 'graded'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_course    ON public.elearning_submissions(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student   ON public.elearning_submissions(student_nisn);

-- ── RLS POLICIES ───────────────────────────────────────────
ALTER TABLE public.news                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elearning_student_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elearning_teacher_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elearning_courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elearning_submissions      ENABLE ROW LEVEL SECURITY;

-- Semua tabel publik bisa dibaca oleh siapa saja
CREATE POLICY "news public read"             ON public.news             FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "news public write"            ON public.news             FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "gallery public read"          ON public.gallery          FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gallery public write"         ON public.gallery          FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "slides public read"           ON public.slides           FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "slides public write"          ON public.slides           FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "settings public read"         ON public.general_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings public write"        ON public.general_settings FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "teacher_profiles public read" ON public.teacher_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "teacher_profiles public write" ON public.teacher_profiles FOR ALL   TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ele_student public read"      ON public.elearning_student_accounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ele_student public write"     ON public.elearning_student_accounts FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ele_teacher public read"      ON public.elearning_teacher_accounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ele_teacher public write"     ON public.elearning_teacher_accounts FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "courses public read"          ON public.elearning_courses          FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses public write"         ON public.elearning_courses          FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "submissions public read"      ON public.elearning_submissions      FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "submissions public write"     ON public.elearning_submissions      FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Selesai! Sekarang update .env dan jalankan npm run dev
-- ============================================================
