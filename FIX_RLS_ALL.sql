-- ============================================================
-- FIX: RLS Policy untuk semua tabel data sekolah
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- ── enrolled_students ──────────────────────────────────────
DROP POLICY IF EXISTS "Siswa bisa dibaca publik"   ON public.enrolled_students;
DROP POLICY IF EXISTS "students insert"             ON public.enrolled_students;
DROP POLICY IF EXISTS "students update"             ON public.enrolled_students;
DROP POLICY IF EXISTS "students delete"             ON public.enrolled_students;

CREATE POLICY "students select" ON public.enrolled_students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "students insert" ON public.enrolled_students FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "students update" ON public.enrolled_students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "students delete" ON public.enrolled_students FOR DELETE TO anon, authenticated USING (true);

-- ── teachers ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Guru bisa dibaca publik"    ON public.teachers;
DROP POLICY IF EXISTS "teachers select"             ON public.teachers;
DROP POLICY IF EXISTS "teachers insert"             ON public.teachers;
DROP POLICY IF EXISTS "teachers update"             ON public.teachers;
DROP POLICY IF EXISTS "teachers delete"             ON public.teachers;

CREATE POLICY "teachers select" ON public.teachers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "teachers insert" ON public.teachers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "teachers update" ON public.teachers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "teachers delete" ON public.teachers FOR DELETE TO anon, authenticated USING (true);

-- ── teacher_profiles ───────────────────────────────────────
DROP POLICY IF EXISTS "teacher_profiles public read"  ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles public write" ON public.teacher_profiles;

CREATE POLICY "teacher_profiles select" ON public.teacher_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "teacher_profiles insert" ON public.teacher_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "teacher_profiles update" ON public.teacher_profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "teacher_profiles delete" ON public.teacher_profiles FOR DELETE TO anon, authenticated USING (true);

-- ── elearning_student_accounts ─────────────────────────────
DROP POLICY IF EXISTS "ele_student public read"  ON public.elearning_student_accounts;
DROP POLICY IF EXISTS "ele_student public write" ON public.elearning_student_accounts;

CREATE POLICY "ele_student select" ON public.elearning_student_accounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ele_student insert" ON public.elearning_student_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "ele_student update" ON public.elearning_student_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ele_student delete" ON public.elearning_student_accounts FOR DELETE TO anon, authenticated USING (true);

-- ── elearning_teacher_accounts ─────────────────────────────
DROP POLICY IF EXISTS "ele_teacher public read"  ON public.elearning_teacher_accounts;
DROP POLICY IF EXISTS "ele_teacher public write" ON public.elearning_teacher_accounts;

CREATE POLICY "ele_teacher select" ON public.elearning_teacher_accounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ele_teacher insert" ON public.elearning_teacher_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "ele_teacher update" ON public.elearning_teacher_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ele_teacher delete" ON public.elearning_teacher_accounts FOR DELETE TO anon, authenticated USING (true);

-- ── Sync teachers dari teacher_profiles ────────────────────
INSERT INTO public.teachers (kode_guru, nip, nama, jabatan, mata_pelajaran, status)
SELECT tp.kode_guru, tp.nip, tp.nama,
  COALESCE(tp.jabatan,'Tenaga Pengajar'), tp.mata_pelajaran, 'AKTIF'
FROM public.teacher_profiles tp
WHERE NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.kode_guru = tp.kode_guru);

-- ── Verifikasi ──────────────────────────────────────────────
SELECT 'enrolled_students' AS tabel,
  kelas,
  COUNT(*) AS jumlah
FROM public.enrolled_students
GROUP BY kelas ORDER BY kelas;

SELECT COUNT(*) AS total_teachers FROM public.teachers;
