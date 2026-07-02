/**
 * attendanceService.ts
 * Tabel terpisah: student_attendance dan teacher_attendance
 */
import { supabase } from '../supabaseClient';

// ─── Tipe ─────────────────────────────────────────────────

export interface StudentAttendance {
  id: string;
  createdAt?: string;
  nisn: string;
  nama: string;
  kelas?: string;
  jurusan?: string;
  type: 'MASUK' | 'PULANG';
  timestamp: string;
  photo: string;
  latitude: number;
  longitude: number;
  distanceInMeters: number;
  status: 'TEPAT WAKTU' | 'TERLAMBAT' | 'PULANG';
}

export interface TeacherAttendance {
  id: string;
  createdAt?: string;
  kodeGuru: string;
  nama: string;
  jabatan?: string;
  type: 'MASUK' | 'PULANG';
  timestamp: string;
  photo: string;
  latitude: number;
  longitude: number;
  distanceInMeters: number;
  status: 'TEPAT WAKTU' | 'TERLAMBAT' | 'PULANG';
}

// ─── Konversi ──────────────────────────────────────────────

function fromStudentDb(r: any): StudentAttendance {
  return {
    id: r.id, createdAt: r.created_at,
    nisn: r.nisn, nama: r.nama,
    kelas: r.kelas ?? undefined, jurusan: r.jurusan ?? undefined,
    type: r.type, timestamp: r.timestamp, photo: r.photo,
    latitude: r.latitude, longitude: r.longitude,
    distanceInMeters: r.distance_in_meters, status: r.status,
  };
}

function fromTeacherDb(r: any): TeacherAttendance {
  return {
    id: r.id, createdAt: r.created_at,
    kodeGuru: r.kode_guru, nama: r.nama,
    jabatan: r.jabatan ?? undefined,
    type: r.type, timestamp: r.timestamp, photo: r.photo,
    latitude: r.latitude, longitude: r.longitude,
    distanceInMeters: r.distance_in_meters, status: r.status,
  };
}

// ─── ABSENSI SISWA ─────────────────────────────────────────

export async function insertStudentAttendance(
  rec: StudentAttendance
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('student_attendance')
    .insert({
      id: rec.id,
      nisn: rec.nisn,
      nama: rec.nama,
      kelas: rec.kelas ?? null,
      jurusan: rec.jurusan ?? null,
      type: rec.type,
      timestamp: rec.timestamp,
      photo: rec.photo,
      latitude: rec.latitude,
      longitude: rec.longitude,
      distance_in_meters: rec.distanceInMeters,
      status: rec.status,
    });
  if (error) { console.error('[StudentAtt] insert:', error.message); return { success: false, error: error.message }; }
  return { success: true };
}

export async function fetchStudentAttendance(limit = 500): Promise<StudentAttendance[]> {
  const { data, error } = await (supabase as any)
    .from('student_attendance')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('[StudentAtt] fetch:', error.message); return []; }
  return (data ?? []).map(fromStudentDb);
}

export async function fetchStudentAttendanceByDate(date: string): Promise<StudentAttendance[]> {
  const start = `${date}T00:00:00+07:00`;
  const end   = `${date}T23:59:59+07:00`;
  const { data, error } = await (supabase as any)
    .from('student_attendance')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false });
  if (error) { console.error('[StudentAtt] fetchByDate:', error.message); return []; }
  return (data ?? []).map(fromStudentDb);
}

export async function deleteStudentAttendance(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('student_attendance').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function clearAllStudentAttendance(): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('student_attendance').delete().neq('id', '');
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Update kolom photo setelah upload ke Storage berhasil (background update) */
export async function updateStudentAttendancePhoto(id: string, photoUrl: string): Promise<void> {
  await (supabase as any)
    .from('student_attendance')
    .update({ photo: photoUrl })
    .eq('id', id);
}

/** Ambil absensi siswa berdasarkan kelas */
export async function fetchStudentAttendanceByKelas(
  kelas: 'X' | 'XI' | 'XII',
  limit = 500
): Promise<StudentAttendance[]> {
  const { data, error } = await (supabase as any)
    .from('student_attendance')
    .select('*')
    .eq('kelas', kelas)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('[StudentAtt] fetchByKelas:', error.message); return []; }
  return (data ?? []).map((r: any): StudentAttendance => ({
    id: r.id, createdAt: r.created_at,
    nisn: r.nisn, nama: r.nama,
    kelas: r.kelas ?? undefined, jurusan: r.jurusan ?? undefined,
    type: r.type, timestamp: r.timestamp, photo: r.photo,
    latitude: r.latitude, longitude: r.longitude,
    distanceInMeters: r.distance_in_meters, status: r.status,
  }));
}

/** Rekap absensi: jumlah per kelas hari ini */
export async function fetchAttendanceSummaryByKelas(dateStr?: string): Promise<
  Record<string, { tepat: number; terlambat: number; total: number }>
> {
  const today = dateStr ?? new Date().toISOString().split('T')[0];
  const start = `${today}T00:00:00+07:00`;
  const end   = `${today}T23:59:59+07:00`;

  const { data, error } = await (supabase as any)
    .from('student_attendance')
    .select('kelas, status')
    .gte('created_at', start)
    .lte('created_at', end);

  const summary: Record<string, { tepat: number; terlambat: number; total: number }> = {
    X:   { tepat: 0, terlambat: 0, total: 0 },
    XI:  { tepat: 0, terlambat: 0, total: 0 },
    XII: { tepat: 0, terlambat: 0, total: 0 },
    semua: { tepat: 0, terlambat: 0, total: 0 },
  };

  if (error || !data) return summary;

  for (const row of data) {
    const k = row.kelas as 'X' | 'XI' | 'XII';
    if (k && summary[k]) {
      summary[k].total++;
      if (row.status === 'TEPAT WAKTU') summary[k].tepat++;
      if (row.status === 'TERLAMBAT')   summary[k].terlambat++;
    }
    summary.semua.total++;
    if (row.status === 'TEPAT WAKTU') summary.semua.tepat++;
    if (row.status === 'TERLAMBAT')   summary.semua.terlambat++;
  }
  return summary;
}

// ─── ABSENSI GURU ──────────────────────────────────────────

export async function insertTeacherAttendance(
  rec: TeacherAttendance
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('teacher_attendance')
    .insert({
      id: rec.id,
      kode_guru: rec.kodeGuru,
      nama: rec.nama,
      jabatan: rec.jabatan ?? null,
      type: rec.type,
      timestamp: rec.timestamp,
      photo: rec.photo,
      latitude: rec.latitude,
      longitude: rec.longitude,
      distance_in_meters: rec.distanceInMeters,
      status: rec.status,
    });
  if (error) { console.error('[TeacherAtt] insert:', error.message); return { success: false, error: error.message }; }
  return { success: true };
}

export async function fetchTeacherAttendance(limit = 500): Promise<TeacherAttendance[]> {
  const { data, error } = await (supabase as any)
    .from('teacher_attendance')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('[TeacherAtt] fetch:', error.message); return []; }
  return (data ?? []).map(fromTeacherDb);
}

export async function fetchTeacherAttendanceByDate(date: string): Promise<TeacherAttendance[]> {
  const start = `${date}T00:00:00+07:00`;
  const end   = `${date}T23:59:59+07:00`;
  const { data, error } = await (supabase as any)
    .from('teacher_attendance')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false });
  if (error) { console.error('[TeacherAtt] fetchByDate:', error.message); return []; }
  return (data ?? []).map(fromTeacherDb);
}

export async function deleteTeacherAttendance(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('teacher_attendance').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function clearAllTeacherAttendance(): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('teacher_attendance').delete().neq('id', '');
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Update kolom photo setelah upload ke Storage berhasil (background update) */
export async function updateTeacherAttendancePhoto(id: string, photoUrl: string): Promise<void> {
  await (supabase as any)
    .from('teacher_attendance')
    .update({ photo: photoUrl })
    .eq('id', id);
}

// ─── Statistik Hari Ini ────────────────────────────────────

export async function fetchTodayAttendanceStats(): Promise<{
  siswaMasukTepat: number;
  siswaTerlambat: number;
  guruHadir: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const [students, teachers] = await Promise.all([
    fetchStudentAttendanceByDate(today),
    fetchTeacherAttendanceByDate(today),
  ]);
  return {
    siswaMasukTepat: students.filter(s => s.status === 'TEPAT WAKTU').length,
    siswaTerlambat:  students.filter(s => s.status === 'TERLAMBAT').length,
    guruHadir:       teachers.length,
  };
}
