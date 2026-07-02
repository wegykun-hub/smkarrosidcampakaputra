-- ============================================================
-- BUAT STORAGE BUCKETS
-- Jalankan di: Supabase Dashboard → Storage → New Bucket
-- ATAU jalankan SQL ini di SQL Editor
-- ============================================================

-- Bucket 1: foto absensi (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-photos',
  'attendance-photos',
  false,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Bucket 2: gambar website (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-images',
  'website-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- ── RLS Policies ─────────────────────────────────────────

-- attendance-photos: anon bisa upload dan baca
DROP POLICY IF EXISTS "attendance upload" ON storage.objects;
CREATE POLICY "attendance upload"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'attendance-photos');

DROP POLICY IF EXISTS "attendance read" ON storage.objects;
CREATE POLICY "attendance read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'attendance-photos');

-- website-images: anon bisa semua operasi
DROP POLICY IF EXISTS "website insert" ON storage.objects;
CREATE POLICY "website insert"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'website-images');

DROP POLICY IF EXISTS "website select" ON storage.objects;
CREATE POLICY "website select"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'website-images');

DROP POLICY IF EXISTS "website update" ON storage.objects;
CREATE POLICY "website update"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'website-images')
  WITH CHECK (bucket_id = 'website-images');

DROP POLICY IF EXISTS "website delete" ON storage.objects;
CREATE POLICY "website delete"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'website-images');

-- Verifikasi
SELECT id, name, public FROM storage.buckets
WHERE id IN ('attendance-photos','website-images');
