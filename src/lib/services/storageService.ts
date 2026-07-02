/**
 * storageService.ts
 * Upload gambar ke Supabase Storage dengan fallback base64
 */
import { supabase } from '../supabaseClient';

const BUCKET_ATTENDANCE = 'attendance-photos';
const BUCKET_WEBSITE    = 'website-images';

// ─── dataURL → Blob ────────────────────────────────────────
function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const [header, data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const ext  = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1] ?? 'jpg';
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return { blob: new Blob([ab], { type: mime }), ext };
}

// ─── Resize gambar sebelum upload (client-side) ────────────
function resizeImage(file: File, maxW: number, maxH: number, quality = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob!), file.type || 'image/jpeg', quality);
      };
    };
  });
}

// ─── Upload foto absensi ke Supabase Storage ────────────────
/**
 * Upload foto wajah absensi.
 * - Kalau bucket ada → upload ke Storage, simpan URL
 * - Kalau bucket belum ada → kompres foto kecil, simpan base64 terkompresi
 */
export async function uploadAttendancePhoto(
  dataUrl: string,
  attendanceId: string
): Promise<string> {
  if (!dataUrl.startsWith('data:')) return dataUrl;

  // Kompres foto dulu ke 200x150 px 60% quality (± 5-8KB) untuk fallback DB
  const compressedDataUrl = await compressPhotoSmall(dataUrl);

  try {
    const { blob, ext } = dataUrlToBlob(compressedDataUrl);
    const fileName = `${attendanceId}.${ext}`;

    const { error } = await (supabase as any).storage
      .from(BUCKET_ATTENDANCE)
      .upload(fileName, blob, { contentType: blob.type, upsert: true });

    if (error) {
      console.warn('[Storage] attendance upload gagal:', error.message);
      // Fallback: simpan base64 terkompresi (kecil, aman untuk DB)
      return compressedDataUrl;
    }

    // Buat signed URL 1 tahun
    const { data: signed } = await (supabase as any).storage
      .from(BUCKET_ATTENDANCE)
      .createSignedUrl(fileName, 365 * 24 * 3600);

    return signed?.signedUrl ?? compressedDataUrl;
  } catch (err: any) {
    console.warn('[Storage] attendance upload exception:', err?.message);
    return compressedDataUrl;
  }
}

/** Kompres foto ke ukuran kecil (200x150, 60% quality) untuk disimpan di DB */
async function compressPhotoSmall(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      // Crop/fit ke 200x150
      const ratio = Math.max(200 / img.width, 150 / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (200 - w) / 2, (150 - h) / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ─── Upload gambar website ke Supabase Storage ─────────────
/**
 * Upload File (dari input[type=file]) ke bucket website-images.
 * Fallback: kembalikan null kalau gagal (caller pakai base64).
 */
export async function uploadWebsiteImage(
  file: File,
  folder: 'news' | 'gallery' | 'slides' | 'teachers' | 'logo' | 'general' = 'general'
): Promise<string | null> {
  try {
    // Resize sebelum upload berdasarkan folder
    const maxSizes: Record<string, [number, number]> = {
      news:     [900, 600],
      gallery:  [900, 650],
      slides:   [1200, 750],
      teachers: [400, 400],
      logo:     [256, 256],
      general:  [800, 600],
    };
    const [maxW, maxH] = maxSizes[folder] ?? [800, 600];
    const resized = await resizeImage(file, maxW, maxH, 0.82);

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await (supabase as any).storage
      .from(BUCKET_WEBSITE)
      .upload(fileName, resized, { contentType: resized.type || file.type, upsert: false });

    if (error) {
      console.warn('[Storage] website upload gagal:', error.message);
      return null; // caller akan fallback ke base64
    }

    const { data } = (supabase as any).storage
      .from(BUCKET_WEBSITE)
      .getPublicUrl(fileName);

    return data?.publicUrl ?? null;
  } catch (err: any) {
    console.warn('[Storage] website upload exception:', err?.message);
    return null;
  }
}

/**
 * Upload dari dataURL (base64) — untuk logo dan foto yang sudah di-canvas
 */
export async function uploadWebsiteImageFromDataUrl(
  dataUrl: string,
  folder: 'news' | 'gallery' | 'slides' | 'teachers' | 'logo' | 'general',
  fileNameOverride?: string
): Promise<string | null> {
  if (!dataUrl.startsWith('data:')) return null;

  try {
    const { blob, ext } = dataUrlToBlob(dataUrl);
    const name = fileNameOverride ?? `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${folder}/${name}`;

    const { error } = await (supabase as any).storage
      .from(BUCKET_WEBSITE)
      .upload(path, blob, { contentType: blob.type, upsert: true });

    if (error) {
      console.warn('[Storage] dataUrl upload gagal:', error.message);
      return null;
    }

    const { data } = (supabase as any).storage
      .from(BUCKET_WEBSITE)
      .getPublicUrl(path);

    return data?.publicUrl ?? null;
  } catch (err: any) {
    console.warn('[Storage] dataUrl upload exception:', err?.message);
    return null;
  }
}

/**
 * Hapus gambar dari website-images
 */
export async function deleteWebsiteImage(publicUrl: string): Promise<void> {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split(`/${BUCKET_WEBSITE}/`);
    if (pathParts.length < 2) return;
    await (supabase as any).storage.from(BUCKET_WEBSITE).remove([pathParts[1]]);
  } catch (err: any) {
    console.warn('[Storage] delete error:', err?.message);
  }
}

/**
 * Upload file dokumen (PDF, DOC, PPT, dll) ke website-images bucket
 * Folder: 'elearning-materials' atau 'elearning-submissions'
 */
export async function uploadDocumentFile(
  file: File,
  folder: 'elearning-materials' | 'elearning-submissions' = 'elearning-materials'
): Promise<string | null> {
  try {
    const ext = (file.name.split('.').pop() ?? 'pdf').toLowerCase();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${folder}/${Date.now()}-${safeName}`;

    const { error } = await (supabase as any).storage
      .from(BUCKET_WEBSITE)
      .upload(fileName, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.warn('[Storage] doc upload gagal:', error.message);
      return null;
    }

    const { data } = (supabase as any).storage
      .from(BUCKET_WEBSITE)
      .getPublicUrl(fileName);

    return data?.publicUrl ?? null;
  } catch (err: any) {
    console.warn('[Storage] doc upload exception:', err?.message);
    return null;
  }
}

/**
 * Upload file submission tugas siswa (base64) ke attendance bucket
 */
export async function uploadSubmissionFile(
  fileBase64: string,
  fileName: string,
  submissionId: string
): Promise<string | null> {
  try {
    // Konversi base64 ke blob
    const [header, data] = fileBase64.split(',');
    if (!data) return null;
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: mime });

    const ext = fileName.split('.').pop() ?? 'pdf';
    const storageName = `elearning-submissions/${submissionId}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const { error } = await (supabase as any).storage
      .from(BUCKET_WEBSITE)
      .upload(storageName, blob, { contentType: mime, upsert: true });

    if (error) {
      console.warn('[Storage] submission upload gagal:', error.message);
      return null;
    }

    const { data: urlData } = (supabase as any).storage
      .from(BUCKET_WEBSITE)
      .getPublicUrl(storageName);

    return urlData?.publicUrl ?? null;
  } catch (err: any) {
    console.warn('[Storage] submission upload exception:', err?.message);
    return null;
  }
}
