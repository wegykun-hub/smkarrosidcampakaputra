import { supabase } from '../supabaseClient';
import { RegistrationData } from '../../types';

// ── Konversi tipe TypeScript ↔ Supabase row ────────────────────────────────

function toDbRow(reg: RegistrationData) {
  return {
    id: reg.id,
    nama_lengkap: reg.namaLengkap,
    jenis_kelamin: reg.jenisKelamin,
    nisn: reg.nisn,
    nik: reg.nik,
    no_kk: reg.noKk,
    tempat_lahir: reg.tempatLahir,
    tanggal_lahir: reg.tanggalLahir,
    no_akta_lahir: reg.noAktaLahir,
    agama: reg.agama,
    kewarganegaraan: reg.kewarganegaraan,
    alamat: reg.alamat,
    rt: reg.rt,
    rw: reg.rw,
    desa: reg.desa,
    kecamatan: reg.kecamatan,
    kode_pos: reg.kodePos,
    anak_ke: reg.anakKe,
    memiliki_kip: reg.memilikiKip,
    no_kip: reg.noKip ?? null,
    nama_ayah: reg.namaAyah,
    nik_ayah: reg.nikAyah,
    tempat_lahir_ayah: reg.tempatLahirAyah,
    tanggal_lahir_ayah: reg.tanggalLahirAyah,
    pendidikan_ayah: reg.pendidikanAyah,
    pekerjaan_ayah: reg.pekerjaanAyah,
    penghasilan_ayah: reg.penghasilanAyah,
    nama_ibu: reg.namaIbu,
    nik_ibu: reg.nikIbu,
    tempat_lahir_ibu: reg.tempatLahirIbu,
    tanggal_lahir_ibu: reg.tanggalLahirIbu,
    pendidikan_ibu: reg.pendidikanIbu,
    pekerjaan_ibu: reg.pekerjaanIbu,
    penghasilan_ibu: reg.penghasilanIbu,
    status_verifikasi: 'PENDING' as const,
  };
}

function fromDbRow(row: any): RegistrationData {
  return {
    id: row.id,
    timestamp: row.created_at
      ? new Date(row.created_at).toLocaleString('id-ID')
      : '',
    namaLengkap: row.nama_lengkap,
    jenisKelamin: row.jenis_kelamin,
    nisn: row.nisn,
    nik: row.nik,
    noKk: row.no_kk,
    tempatLahir: row.tempat_lahir,
    tanggalLahir: row.tanggal_lahir,
    noAktaLahir: row.no_akta_lahir,
    agama: row.agama,
    kewarganegaraan: row.kewarganegaraan,
    alamat: row.alamat,
    rt: row.rt ?? '',
    rw: row.rw ?? '',
    desa: row.desa,
    kecamatan: row.kecamatan,
    kodePos: row.kode_pos,
    anakKe: row.anak_ke ?? 1,
    memilikiKip: row.memiliki_kip,
    noKip: row.no_kip ?? undefined,
    namaAyah: row.nama_ayah,
    nikAyah: row.nik_ayah,
    tempatLahirAyah: row.tempat_lahir_ayah,
    tanggalLahirAyah: row.tanggal_lahir_ayah,
    pendidikanAyah: row.pendidikan_ayah ?? '',
    pekerjaanAyah: row.pekerjaan_ayah ?? '',
    penghasilanAyah: row.penghasilan_ayah ?? '',
    namaIbu: row.nama_ibu,
    nikIbu: row.nik_ibu,
    tempatLahirIbu: row.tempat_lahir_ibu,
    tanggalLahirIbu: row.tanggal_lahir_ibu,
    pendidikanIbu: row.pendidikan_ibu ?? '',
    pekerjaanIbu: row.pekerjaan_ibu ?? '',
    penghasilanIbu: row.penghasilan_ibu ?? '',
  };
}

// ── Service Functions ──────────────────────────────────────────────────────

/** Simpan pendaftaran baru ke Supabase */
export async function insertRegistration(
  reg: RegistrationData
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('spmb_registrations')
    .insert(toDbRow(reg));

  if (error) {
    console.error('[SPMB] Insert error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Ambil semua pendaftaran (untuk admin panel) */
export async function fetchAllRegistrations(): Promise<RegistrationData[]> {
  const { data, error } = await (supabase as any)
    .from('spmb_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SPMB] Fetch error:', error);
    return [];
  }
  return (data ?? []).map(fromDbRow);
}

/** Cari pendaftaran berdasarkan ID, NISN, NIK, atau nama */
export async function searchRegistrations(
  query: string
): Promise<RegistrationData[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const { data, error } = await (supabase as any)
    .from('spmb_registrations')
    .select('*')
    .or(
      `id.ilike.%${q}%,` +
      `nama_lengkap.ilike.%${q}%,` +
      `nisn.ilike.%${q}%,` +
      `nik.ilike.%${q}%`
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SPMB] Search error:', error);
    return [];
  }
  return (data ?? []).map(fromDbRow);
}

/** Generate ID pendaftaran berikutnya */
export async function generateRegistrationId(): Promise<string> {
  const year = new Date().getFullYear();

  const { count, error } = await (supabase as any)
    .from('spmb_registrations')
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error('[SPMB] Count error:', error);
    return `REG-SMKAR-${year}-${Date.now().toString().slice(-4)}`;
  }

  const total = (count ?? 0) + 1;
  return `REG-SMKAR-${year}-${String(total).padStart(4, '0')}`;
}

/** Update status verifikasi (untuk admin) */
export async function updateRegistrationStatus(
  id: string,
  status: 'PENDING' | 'DIVERIFIKASI' | 'DITOLAK'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('spmb_registrations')
    .update({ status_verifikasi: status })
    .eq('id', id);

  if (error) {
    console.error('[SPMB] Update status error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Hapus pendaftaran (untuk admin) */
export async function deleteRegistration(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('spmb_registrations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[SPMB] Delete error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
