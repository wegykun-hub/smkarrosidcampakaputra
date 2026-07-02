-- ============================================================
-- SETUP: Pisahkan data per Kelas X, XI, XII
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Pastikan kolom kelas ada di semua tabel relevan ──────

-- Tambah kolom kelas ke elearning_submissions (untuk nilai tugas per kelas)
ALTER TABLE public.elearning_submissions
  ADD COLUMN IF NOT EXISTS kelas TEXT;

-- Tambah kolom jurusan ke student_attendance (untuk rekap lebih detail)
ALTER TABLE public.student_attendance
  ADD COLUMN IF NOT EXISTS jurusan TEXT;

-- ── 2. Isi kelas dari enrolled_students jika belum terisi ────

-- Update student_attendance yang kelas-nya kosong
UPDATE public.student_attendance sa
SET kelas = es.kelas, jurusan = es.jurusan
FROM public.enrolled_students es
WHERE sa.nisn = es.nisn
  AND (sa.kelas IS NULL OR sa.kelas = '');

-- ── 3. INDEX untuk query cepat per kelas ────────────────────

CREATE INDEX IF NOT EXISTS idx_student_att_kelas
  ON public.student_attendance(kelas);

CREATE INDEX IF NOT EXISTS idx_student_att_kelas_date
  ON public.student_attendance(kelas, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_kelas
  ON public.elearning_submissions(kelas);

-- ── 4. VIEW: Absensi per kelas ──────────────────────────────

CREATE OR REPLACE VIEW public.v_absensi_kelas_x AS
  SELECT * FROM public.student_attendance
  WHERE kelas = 'X'
  ORDER BY created_at DESC;

CREATE OR REPLACE VIEW public.v_absensi_kelas_xi AS
  SELECT * FROM public.student_attendance
  WHERE kelas = 'XI'
  ORDER BY created_at DESC;

CREATE OR REPLACE VIEW public.v_absensi_kelas_xii AS
  SELECT * FROM public.student_attendance
  WHERE kelas = 'XII'
  ORDER BY created_at DESC;

-- VIEW: Rekap absensi lengkap dengan info siswa
CREATE OR REPLACE VIEW public.v_rekap_absensi AS
  SELECT
    sa.id,
    sa.created_at,
    sa.nisn,
    sa.nama,
    COALESCE(sa.kelas, es.kelas, '-') AS kelas,
    COALESCE(sa.jurusan, es.jurusan, '-') AS jurusan,
    sa.type,
    sa.timestamp,
    sa.status,
    sa.distance_in_meters,
    sa.latitude,
    sa.longitude
  FROM public.student_attendance sa
  LEFT JOIN public.enrolled_students es ON sa.nisn = es.nisn
  ORDER BY sa.created_at DESC;

-- ── 5. VIEW: Penilaian tugas per kelas ──────────────────────

CREATE OR REPLACE VIEW public.v_nilai_kelas_x AS
  SELECT
    es.id,
    es.created_at,
    es.student_name,
    es.student_nisn,
    es.course_id,
    es.assignment_id,
    es.file_name,
    es.submitted_at,
    es.grade,
    es.feedback,
    es.status,
    es.graded_by,
    es.mata_pelajaran,
    es.graded_at,
    COALESCE(es.kelas, enr.kelas) AS kelas,
    enr.jurusan
  FROM public.elearning_submissions es
  LEFT JOIN public.enrolled_students enr ON es.student_nisn = enr.nisn
  WHERE COALESCE(es.kelas, enr.kelas) = 'X'
  ORDER BY es.created_at DESC;

CREATE OR REPLACE VIEW public.v_nilai_kelas_xi AS
  SELECT
    es.id, es.created_at, es.student_name, es.student_nisn,
    es.course_id, es.assignment_id, es.file_name, es.submitted_at,
    es.grade, es.feedback, es.status, es.graded_by, es.mata_pelajaran, es.graded_at,
    COALESCE(es.kelas, enr.kelas) AS kelas, enr.jurusan
  FROM public.elearning_submissions es
  LEFT JOIN public.enrolled_students enr ON es.student_nisn = enr.nisn
  WHERE COALESCE(es.kelas, enr.kelas) = 'XI'
  ORDER BY es.created_at DESC;

CREATE OR REPLACE VIEW public.v_nilai_kelas_xii AS
  SELECT
    es.id, es.created_at, es.student_name, es.student_nisn,
    es.course_id, es.assignment_id, es.file_name, es.submitted_at,
    es.grade, es.feedback, es.status, es.graded_by, es.mata_pelajaran, es.graded_at,
    COALESCE(es.kelas, enr.kelas) AS kelas, enr.jurusan
  FROM public.elearning_submissions es
  LEFT JOIN public.enrolled_students enr ON es.student_nisn = enr.nisn
  WHERE COALESCE(es.kelas, enr.kelas) = 'XII'
  ORDER BY es.created_at DESC;

-- ── 6. VIEW: Rekap lengkap nilai semua kelas ────────────────
CREATE OR REPLACE VIEW public.v_rekap_nilai AS
  SELECT
    es.id, es.created_at, es.student_name, es.student_nisn,
    COALESCE(es.kelas, enr.kelas, '-') AS kelas,
    COALESCE(enr.jurusan, '-') AS jurusan,
    ec.title AS mata_pelajaran_course,
    es.mata_pelajaran AS mata_pelajaran_guru,
    es.file_name, es.submitted_at,
    es.grade, es.feedback, es.status,
    es.graded_by, es.graded_at
  FROM public.elearning_submissions es
  LEFT JOIN public.enrolled_students enr ON es.student_nisn = enr.nisn
  LEFT JOIN public.elearning_courses ec ON es.course_id = ec.id
  ORDER BY es.created_at DESC;

-- ── 7. RLS untuk views ──────────────────────────────────────
-- Views mewarisi RLS dari tabel asli, tidak perlu policy tambahan

-- ── 8. Verifikasi ───────────────────────────────────────────
SELECT
  'student_attendance' AS tabel,
  kelas,
  COUNT(*) AS jumlah
FROM public.student_attendance
GROUP BY kelas
ORDER BY kelas;
