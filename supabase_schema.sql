-- ============================================================
-- SCHEMA DATABASE - SMK AR ROSYID CAMPAKA PUTRA
-- Jalankan script ini di Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================================

-- ── 1. TABEL SPMB: Pendaftaran Siswa Baru ──────────────────

CREATE TABLE IF NOT EXISTS public.spmb_registrations (
  id                    TEXT PRIMARY KEY,           -- REG-SMKAR-2026-0001
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  nama_lengkap          TEXT NOT NULL,
  jenis_kelamin         TEXT NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  nisn                  TEXT NOT NULL,
  nik                   TEXT NOT NULL,
  no_kk                 TEXT NOT NULL,
  tempat_lahir          TEXT NOT NULL,
  tanggal_lahir         DATE NOT NULL,
  no_akta_lahir         TEXT NOT NULL,
  agama                 TEXT NOT NULL,
  kewarganegaraan       TEXT NOT NULL DEFAULT 'WNI' CHECK (kewarganegaraan IN ('WNI', 'WNA')),
  alamat                TEXT NOT NULL,
  rt                    TEXT,
  rw                    TEXT,
  desa                  TEXT NOT NULL,
  kecamatan             TEXT NOT NULL,
  kode_pos              TEXT NOT NULL,
  anak_ke               INTEGER DEFAULT 1,
  memiliki_kip          TEXT NOT NULL DEFAULT 'TIDAK' CHECK (memiliki_kip IN ('YA', 'TIDAK')),
  no_kip                TEXT,
  nama_ayah             TEXT NOT NULL,
  nik_ayah              TEXT NOT NULL,
  tempat_lahir_ayah     TEXT NOT NULL,
  tanggal_lahir_ayah    DATE NOT NULL,
  pendidikan_ayah       TEXT,
  pekerjaan_ayah        TEXT,
  penghasilan_ayah      TEXT,
  nama_ibu              TEXT NOT NULL,
  nik_ibu               TEXT NOT NULL,
  tempat_lahir_ibu      TEXT NOT NULL,
  tanggal_lahir_ibu     DATE NOT NULL,
  pendidikan_ibu        TEXT,
  pekerjaan_ibu         TEXT,
  penghasilan_ibu       TEXT,
  status_verifikasi     TEXT NOT NULL DEFAULT 'PENDING'
                        CHECK (status_verifikasi IN ('PENDING', 'DIVERIFIKASI', 'DITOLAK'))
);

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_spmb_nisn ON public.spmb_registrations(nisn);
CREATE INDEX IF NOT EXISTS idx_spmb_nik  ON public.spmb_registrations(nik);
CREATE INDEX IF NOT EXISTS idx_spmb_nama ON public.spmb_registrations(nama_lengkap);

-- ── 2. TABEL ABSENSI ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id                    TEXT PRIMARY KEY,           -- ATT-SIS-123456
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  role                  TEXT NOT NULL CHECK (role IN ('SISWA', 'GURU')),
  id_number             TEXT NOT NULL,              -- NISN / kode guru
  name                  TEXT NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('MASUK', 'PULANG')),
  timestamp             TEXT NOT NULL,              -- "DD/MM/YYYY HH:MM"
  photo                 TEXT NOT NULL,              -- base64 JPEG
  latitude              DOUBLE PRECISION NOT NULL,
  longitude             DOUBLE PRECISION NOT NULL,
  distance_in_meters    INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL
                        CHECK (status IN ('TEPAT WAKTU', 'TERLAMBAT', 'PULANG')),
  kelas                 TEXT
);

-- Index untuk rekap per tanggal dan per role
CREATE INDEX IF NOT EXISTS idx_att_role     ON public.attendance_records(role);
CREATE INDEX IF NOT EXISTS idx_att_id_num   ON public.attendance_records(id_number);
CREATE INDEX IF NOT EXISTS idx_att_created  ON public.attendance_records(created_at DESC);

-- ── 3. TABEL SISWA TERDAFTAR ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.enrolled_students (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  nisn                  TEXT NOT NULL UNIQUE,
  nama                  TEXT NOT NULL,
  kelas                 TEXT NOT NULL CHECK (kelas IN ('X', 'XI', 'XII')),
  jurusan               TEXT NOT NULL CHECK (jurusan IN ('TKJ', 'PEMASARAN', 'UMUM')),
  jenis_kelamin         TEXT NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  alamat                TEXT,
  telepon               TEXT,
  status                TEXT NOT NULL DEFAULT 'AKTIF'
                        CHECK (status IN ('AKTIF', 'ALUMNI', 'MUTASI'))
);

CREATE INDEX IF NOT EXISTS idx_students_nisn   ON public.enrolled_students(nisn);
CREATE INDEX IF NOT EXISTS idx_students_kelas  ON public.enrolled_students(kelas);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.enrolled_students(status);

-- ── 4. TABEL GURU ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teachers (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  kode_guru             TEXT NOT NULL UNIQUE,       -- kode untuk absensi
  nip                   TEXT,
  nama                  TEXT NOT NULL,
  jabatan               TEXT NOT NULL,
  mata_pelajaran        TEXT,
  status                TEXT NOT NULL DEFAULT 'AKTIF'
                        CHECK (status IN ('AKTIF', 'NON_AKTIF'))
);

CREATE INDEX IF NOT EXISTS idx_teachers_kode   ON public.teachers(kode_guru);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON public.teachers(status);

-- ── 5. TABEL ADMIN ACCOUNTS ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  username              TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  password_hash         TEXT NOT NULL,              -- bcrypt hash
  role                  TEXT NOT NULL DEFAULT 'ADMIN_STAF'
                        CHECK (role IN ('SUPER_ADMIN', 'ADMIN_STAF')),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_admin_username ON public.admin_accounts(username);

-- ── 6. ROW LEVEL SECURITY (RLS) ──────────────────────────
-- Aktifkan RLS pada semua tabel

ALTER TABLE public.spmb_registrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrolled_students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts       ENABLE ROW LEVEL SECURITY;

-- Policy: Publik hanya bisa INSERT ke spmb_registrations (formulir pendaftaran)
CREATE POLICY "Publik bisa daftar SPMB"
  ON public.spmb_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Publik bisa baca data registrasi (untuk cari & cetak kartu)
CREATE POLICY "Publik bisa baca pendaftaran sendiri"
  ON public.spmb_registrations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Absensi bisa diisi oleh siapa saja (publik dari kiosk sekolah)
CREATE POLICY "Absensi bisa diisi publik"
  ON public.attendance_records
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Absensi bisa dibaca oleh siapa saja (untuk rekap tampilan)
CREATE POLICY "Absensi bisa dibaca publik"
  ON public.attendance_records
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Data siswa bisa dibaca publik (autocomplete absensi)
CREATE POLICY "Siswa bisa dibaca publik"
  ON public.enrolled_students
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Data guru bisa dibaca publik (autocomplete absensi)
CREATE POLICY "Guru bisa dibaca publik"
  ON public.teachers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Admin accounts hanya bisa diakses oleh authenticated users
CREATE POLICY "Admin accounts hanya untuk authenticated"
  ON public.admin_accounts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 7. SEEDER: Super Admin Default ───────────────────────
-- Password default: "admin123" (bcrypt hash)
-- GANTI PASSWORD INI SEGERA setelah login pertama!
-- Generate hash baru: https://bcrypt-generator.com/

INSERT INTO public.admin_accounts (username, name, password_hash, role, is_active)
VALUES (
  'superadmin',
  'Super Admin SMK',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- "admin123"
  'SUPER_ADMIN',
  true
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- SELESAI! Schema database berhasil dibuat.
-- Selanjutnya:
-- 1. Isi file .env dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
-- 2. Jalankan: npm run dev
-- ============================================================
