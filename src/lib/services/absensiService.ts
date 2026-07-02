import { supabase } from '../supabaseClient';
import { AttendanceRecord } from '../../types';

// ── Konversi tipe ─────────────────────────────────────────────────────────

function toDbRow(rec: AttendanceRecord) {
  return {
    id: rec.id,
    role: rec.role,
    id_number: rec.idNumber,
    name: rec.name,
    type: rec.type,
    timestamp: rec.timestamp,
    photo: rec.photo,
    latitude: rec.latitude,
    longitude: rec.longitude,
    distance_in_meters: rec.distanceInMeters,
    status: rec.status,
    kelas: rec.kelas ?? null,
  };
}

function fromDbRow(row: any): AttendanceRecord {
  return {
    id: row.id,
    role: row.role,
    idNumber: row.id_number,
    name: row.name,
    type: row.type,
    timestamp: row.timestamp,
    photo: row.photo,
    latitude: row.latitude,
    longitude: row.longitude,
    distanceInMeters: row.distance_in_meters,
    status: row.status,
    kelas: row.kelas ?? undefined,
  };
}

// ── Service Functions ─────────────────────────────────────────────────────

/** Simpan satu record absensi */
export async function insertAttendance(
  rec: AttendanceRecord
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('attendance_records')
    .insert(toDbRow(rec));

  if (error) {
    console.error('[Absensi] Insert error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Ambil semua absensi terbaru (limit 500 untuk performa) */
export async function fetchAttendanceLogs(
  limit = 500
): Promise<AttendanceRecord[]> {
  const { data, error } = await (supabase as any)
    .from('attendance_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Absensi] Fetch error:', error);
    return [];
  }
  return (data ?? []).map(fromDbRow);
}

/** Ambil absensi berdasarkan tanggal (format: YYYY-MM-DD) */
export async function fetchAttendanceByDate(
  date: string
): Promise<AttendanceRecord[]> {
  const startOfDay = `${date}T00:00:00+07:00`;
  const endOfDay   = `${date}T23:59:59+07:00`;

  const { data, error } = await (supabase as any)
    .from('attendance_records')
    .select('*')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Absensi] Fetch by date error:', error);
    return [];
  }
  return (data ?? []).map(fromDbRow);
}

/** Ambil absensi berdasarkan role (SISWA / GURU) */
export async function fetchAttendanceByRole(
  role: 'SISWA' | 'GURU',
  limit = 200
): Promise<AttendanceRecord[]> {
  const { data, error } = await (supabase as any)
    .from('attendance_records')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Absensi] Fetch by role error:', error);
    return [];
  }
  return (data ?? []).map(fromDbRow);
}

/** Hapus satu record absensi */
export async function deleteAttendance(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('attendance_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Absensi] Delete error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Hapus semua record absensi (admin only) */
export async function clearAllAttendance(): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('attendance_records')
    .delete()
    .neq('id', '');

  if (error) {
    console.error('[Absensi] Clear all error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Statistik ringkas untuk hari ini */
export async function fetchTodayStats(): Promise<{
  siswaMasukTepat: number;
  siswaTerlambat: number;
  guruHadir: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const logs = await fetchAttendanceByDate(today);

  return {
    siswaMasukTepat: logs.filter(l => l.role === 'SISWA' && l.status === 'TEPAT WAKTU').length,
    siswaTerlambat:  logs.filter(l => l.role === 'SISWA' && l.status === 'TERLAMBAT').length,
    guruHadir:       logs.filter(l => l.role === 'GURU').length,
  };
}
