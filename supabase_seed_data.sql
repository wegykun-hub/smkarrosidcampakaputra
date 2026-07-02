-- ============================================================
-- SEED DATA: Siswa & Guru Awal
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- 
-- Sesuaikan data ini dengan data nyata sekolah Anda.
-- Tambah/hapus baris sesuai kebutuhan.
-- ============================================================

-- ── SISWA AKTIF ────────────────────────────────────────────
-- Format: (nisn, nama, kelas, jurusan, jenis_kelamin, status)

INSERT INTO public.enrolled_students (nisn, nama, kelas, jurusan, jenis_kelamin, status)
VALUES
  ('0098765432', 'ADITYA PUTRA PRATAMA',  'X',   'TKJ',       'L', 'AKTIF'),
  ('0091122334', 'SITI NUR HALIZAH',      'XI',  'PEMASARAN', 'P', 'AKTIF'),
  ('0092233445', 'MUHAMMAD FIKRI',        'XII', 'TKJ',       'L', 'AKTIF'),
  ('0093344556', 'RIZAL MAULANA',         'X',   'PEMASARAN', 'L', 'AKTIF'),
  ('0094455667', 'NENG LINA SARI',        'XII', 'UMUM',      'P', 'AKTIF')
ON CONFLICT (nisn) DO NOTHING;

-- ── GURU & STAFF ───────────────────────────────────────────
-- Format: (kode_guru, nip, nama, jabatan, mata_pelajaran, status)
-- kode_guru = yang dipakai untuk absensi di kiosk

INSERT INTO public.teachers (kode_guru, nip, nama, jabatan, mata_pelajaran, status)
VALUES
  ('AR-01',  '196801012000031001', 'H. Asep Rosyadi, M.Pd.',       'Kepala Sekolah',                          'Manajemen Pendidikan',           'AKTIF'),
  ('AR-02',  '197504152003121002', 'H. Ahmad Riyadi, S.Pd.I.',     'Wakil Kepala Sekolah',                    'Pendidikan Agama Islam',         'AKTIF'),
  ('TKJ-01', '198503202010011003', 'Rina Sulistiawati, S.Kom.',    'Kepala Program TKJ',                      'Administrasi Sistem Jaringan',   'AKTIF'),
  ('BDP-01', '198701152012042004', 'Dian Nugraha, S.E.',           'Kepala Program Pemasaran',                'Digital Marketing',              'AKTIF'),
  ('TKJ-02', '199002282015031005', 'Fajar Ramadhan, S.Kom.',       'Guru Produktif TKJ',                      'Jaringan Nirkabel & Mikrotik',   'AKTIF'),
  ('UM-01',  '198906122017042006', 'Eka Wahyuni, M.Pd.',           'Guru Bahasa Inggris & BK',                'Bahasa Inggris Komunikasi',      'AKTIF')
ON CONFLICT (kode_guru) DO NOTHING;

-- Verifikasi
SELECT 'enrolled_students' as tabel, COUNT(*) as jumlah FROM public.enrolled_students
UNION ALL
SELECT 'teachers', COUNT(*) FROM public.teachers;
