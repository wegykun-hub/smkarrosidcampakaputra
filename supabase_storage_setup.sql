-- ============================================================
-- SETUP SUPABASE STORAGE BUCKETS
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Bucket untuk foto absensi (private, hanya admin bisa lihat)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-photos',
  'attendance-photos',
  false,
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket untuk gambar website (public: berita, galeri, slides, logo, foto guru)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-images',
  'website-images',
  true,
  10485760,  -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS POLICIES untuk Storage ─────────────────────────────

-- attendance-photos: siapa saja bisa upload (untuk kiosk absensi)
CREATE POLICY "Kiosk bisa upload foto absensi"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'attendance-photos');

-- attendance-photos: hanya authenticated (admin) yang bisa lihat
CREATE POLICY "Admin bisa lihat foto absensi"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'attendance-photos');

-- website-images: siapa saja bisa upload (admin panel)
CREATE POLICY "Admin bisa upload gambar website"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'website-images');

-- website-images: publik bisa baca (gambar tampil di web)
CREATE POLICY "Publik bisa lihat gambar website"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'website-images');

-- website-images: bisa update dan delete
CREATE POLICY "Admin bisa hapus gambar website"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'website-images');

-- ============================================================
-- Verifikasi
SELECT id, name, public FROM storage.buckets WHERE id IN ('attendance-photos', 'website-images');
-- ============================================================
