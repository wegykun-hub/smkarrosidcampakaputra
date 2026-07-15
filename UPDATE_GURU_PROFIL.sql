-- ============================================================
-- Update / Insert data guru SMK Ar Rosyid Campaka Putra
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Hapus data guru lama
DELETE FROM teacher_profiles;

-- Insert data guru baru sesuai urutan resmi
INSERT INTO teacher_profiles (id, kode_guru, nama, jabatan, kategori, foto, pendidikan, mata_pelajaran, email) VALUES
('TEACH-01', 'AR-01',  'Zodi Zulkarnaen, S.Pd.',       'Kepala Sekolah',                       'PIMPINAN',  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan',              'Manajemen Pendidikan',         'info@smkarrosyidcampaka.sch.id'),
('TEACH-02', 'AR-02',  'Wandi, S.Pd.',                  'Wakil Kepala Sekolah',                 'PIMPINAN',  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan',              'Pendidikan Umum',              'info@smkarrosyidcampaka.sch.id'),
('TEACH-03', 'TKJ-01', 'M. Riki Abdillah, S.Kom.',      'Kepala Program Studi TKJ',             'TKJ',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', 'S1 Komputer',                'Teknik Komputer & Jaringan',   'info@smkarrosyidcampaka.sch.id'),
('TEACH-04', 'UM-01',  'Lutfiah Fathul Hasanah, S.Pd.', 'Guru Produktif',                       'UMUM',      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan',              'Pendidikan Umum',              'info@smkarrosyidcampaka.sch.id'),
('TEACH-05', 'UM-02',  'Ilham Rahmanto, S.Pd.',         'Guru Produktif',                       'UMUM',      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan',              'Pendidikan Umum',              'info@smkarrosyidcampaka.sch.id'),
('TEACH-06', 'UM-03',  'Dra. Rahmi Eva Ch.',             'Guru Senior',                          'UMUM',      'https://images.unsplash.com/photo-1534751516642-a131fed10495?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan',              'Pendidikan Umum',              'info@smkarrosyidcampaka.sch.id'),
('TEACH-07', 'UM-04',  'Ai Nurhapizah, S.Pd.',          'Guru Produktif',                       'UMUM',      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan',              'Pendidikan Umum',              'info@smkarrosyidcampaka.sch.id'),
('TEACH-08', 'UM-05',  'Yusup Purwandi, S.Pd.I.',       'Guru Pendidikan Agama Islam',          'UMUM',      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan Agama Islam',  'Pendidikan Agama Islam',       'info@smkarrosyidcampaka.sch.id'),
('TEACH-09', 'TKJ-02', 'Diki Adi Putra, S.Pd.',         'Guru Produktif TKJ',                   'TKJ',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan',              'Teknik Komputer & Jaringan',   'info@smkarrosyidcampaka.sch.id'),
('TEACH-10', 'BDP-01', 'Risna, S.Pd.I., S.E.',          'Guru Produktif Pemasaran',             'PEMASARAN', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', 'S1 Ekonomi / PAI',           'Bisnis Daring & Pemasaran',    'info@smkarrosyidcampaka.sch.id'),
('TEACH-11', 'UM-06',  'Rina Saepul Alam, S.Pd.I.',     'Guru Pendidikan Agama Islam',          'UMUM',      'https://images.unsplash.com/photo-1534751516642-a131fed10495?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan Agama Islam',  'Pendidikan Agama Islam',       'info@smkarrosyidcampaka.sch.id'),
('TEACH-12', 'UM-07',  'Leni Nursita, P.Pd.',            'Guru Produktif',                       'UMUM',      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan',              'Pendidikan Umum',              'info@smkarrosyidcampaka.sch.id'),
('TEACH-13', 'TKJ-03', 'Fadilah Wegi Saputra',          'Guru Produktif TKJ',                   'TKJ',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', 'Pendidikan',                 'Teknik Komputer & Jaringan',   'info@smkarrosyidcampaka.sch.id'),
('TEACH-14', 'TKJ-04', 'Ahmad Rifal Hudori',             'Guru Produktif TKJ',                   'TKJ',       'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'Pendidikan',                 'Teknik Komputer & Jaringan',   'info@smkarrosyidcampaka.sch.id'),
('TEACH-15', 'BDP-02', 'Sinta Aprilia, S.Pd.',           'Guru Produktif Pemasaran',             'PEMASARAN', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', 'S1 Pendidikan',              'Bisnis Daring & Pemasaran',    'info@smkarrosyidcampaka.sch.id');
