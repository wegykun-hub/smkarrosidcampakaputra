-- ============================================================
-- BUAT STORAGE BUCKETS + RLS POLICIES
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- URL: https://supabase.com/dashboard/project/aermtvrmnntyjdapzdnk/sql/new
-- ============================================================

-- ── Bucket 1: website-images (public — untuk materi, gambar, tugas) ───────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-images',
  'website-images',
  true,
  52428800,  -- 50MB
  NULL       -- NULL = semua tipe file diizinkan (PDF, DOC, PPT, gambar, dll)
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = NULL;

-- ── Bucket 2: attendance-photos (private — foto absensi) ──────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-photos',
  'attendance-photos',
  false,
  5242880,   -- 5MB
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880;

-- ── RLS Policies untuk website-images ─────────────────────────────────────
DROP POLICY IF EXISTS "website insert"  ON storage.objects;
DROP POLICY IF EXISTS "website select"  ON storage.objects;
DROP POLICY IF EXISTS "website update"  ON storage.objects;
DROP POLICY IF EXISTS "website delete"  ON storage.objects;

CREATE POLICY "website insert" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'website-images');
CREATE POLICY "website select" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'website-images');
CREATE POLICY "website update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'website-images') WITH CHECK (bucket_id = 'website-images');
CREATE POLICY "website delete" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'website-images');

-- ── RLS Policies untuk attendance-photos ──────────────────────────────────
DROP POLICY IF EXISTS "attendance upload" ON storage.objects;
DROP POLICY IF EXISTS "attendance read"   ON storage.objects;

CREATE POLICY "attendance upload" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'attendance-photos');
CREATE POLICY "attendance read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'attendance-photos');

-- ── Verifikasi ─────────────────────────────────────────────────────────────
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('website-images', 'attendance-photos');
