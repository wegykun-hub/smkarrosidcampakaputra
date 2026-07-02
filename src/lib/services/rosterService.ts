import { supabase } from '../supabaseClient';
import { EnrolledStudent } from '../../types';

// ── Tipe lokal untuk Guru ─────────────────────────────────────────────────

export interface Teacher {
  id?: string;
  kodeGuru: string;
  nip?: string;
  nama: string;
  jabatan: string;
  mataPelajaran?: string;
  status: 'AKTIF' | 'NON_AKTIF';
}

// ── Konversi ──────────────────────────────────────────────────────────────

function studentToDb(s: EnrolledStudent) {
  return {
    nisn: s.nisn,
    nama: s.nama,
    kelas: s.kelas,
    jurusan: s.jurusan,
    jenis_kelamin: s.jenisKelamin,
    alamat: s.alamat ?? null,
    telepon: s.telepon ?? null,
    status: s.status,
  };
}

function studentFromDb(row: any): EnrolledStudent {
  return {
    nisn: row.nisn,
    nama: row.nama,
    kelas: row.kelas,
    jurusan: row.jurusan,
    jenisKelamin: row.jenis_kelamin,
    alamat: row.alamat ?? undefined,
    telepon: row.telepon ?? undefined,
    status: row.status,
  };
}

function teacherToDb(t: Teacher) {
  return {
    kode_guru: t.kodeGuru,
    nip: t.nip ?? null,
    nama: t.nama,
    jabatan: t.jabatan,
    mata_pelajaran: t.mataPelajaran ?? null,
    status: t.status,
  };
}

function teacherFromDb(row: any): Teacher {
  return {
    id: row.id,
    kodeGuru: row.kode_guru,
    nip: row.nip ?? undefined,
    nama: row.nama,
    jabatan: row.jabatan,
    mataPelajaran: row.mata_pelajaran ?? undefined,
    status: row.status,
  };
}

// ── SISWA: Service Functions ──────────────────────────────────────────────

/** Ambil semua siswa aktif */
export async function fetchStudents(
  statusFilter?: 'AKTIF' | 'ALUMNI' | 'MUTASI'
): Promise<EnrolledStudent[]> {
  let query = (supabase as any)
    .from('enrolled_students')
    .select('*')
    .order('nama', { ascending: true });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Roster] Fetch students error:', error);
    return [];
  }
  return (data ?? []).map(studentFromDb);
}

/** Tambah siswa baru */
export async function insertStudent(
  student: EnrolledStudent
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('enrolled_students')
    .insert(studentToDb(student));

  if (error) {
    console.error('[Roster] Insert student error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Update data siswa berdasarkan NISN */
export async function updateStudent(
  nisn: string,
  updates: Partial<EnrolledStudent>
): Promise<{ success: boolean; error?: string }> {
  const dbUpdates: any = {};
  if (updates.nama)         dbUpdates.nama = updates.nama;
  if (updates.kelas)        dbUpdates.kelas = updates.kelas;
  if (updates.jurusan)      dbUpdates.jurusan = updates.jurusan;
  if (updates.jenisKelamin) dbUpdates.jenis_kelamin = updates.jenisKelamin;
  if (updates.alamat !== undefined) dbUpdates.alamat = updates.alamat;
  if (updates.telepon !== undefined) dbUpdates.telepon = updates.telepon;
  if (updates.status)       dbUpdates.status = updates.status;

  const { error } = await (supabase as any)
    .from('enrolled_students')
    .update(dbUpdates)
    .eq('nisn', nisn);

  if (error) {
    console.error('[Roster] Update student error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Hapus siswa */
export async function deleteStudent(
  nisn: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('enrolled_students')
    .delete()
    .eq('nisn', nisn);

  if (error) {
    console.error('[Roster] Delete student error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ── GURU: Service Functions ───────────────────────────────────────────────

/** Ambil semua guru */
export async function fetchTeachers(): Promise<Teacher[]> {
  const { data, error } = await (supabase as any)
    .from('teachers')
    .select('*')
    .order('nama', { ascending: true });

  if (error) {
    console.error('[Roster] Fetch teachers error:', error);
    return [];
  }
  return (data ?? []).map(teacherFromDb);
}

/** Tambah guru baru */
export async function insertTeacher(
  teacher: Teacher
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('teachers')
    .insert(teacherToDb(teacher));

  if (error) {
    console.error('[Roster] Insert teacher error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Update data guru berdasarkan kode_guru */
export async function updateTeacher(
  kodeGuru: string,
  updates: Partial<Teacher>
): Promise<{ success: boolean; error?: string }> {
  const dbUpdates: any = {};
  if (updates.nip !== undefined) dbUpdates.nip = updates.nip;
  if (updates.nama)              dbUpdates.nama = updates.nama;
  if (updates.jabatan)           dbUpdates.jabatan = updates.jabatan;
  if (updates.mataPelajaran !== undefined) dbUpdates.mata_pelajaran = updates.mataPelajaran;
  if (updates.status)            dbUpdates.status = updates.status;

  const { error } = await (supabase as any)
    .from('teachers')
    .update(dbUpdates)
    .eq('kode_guru', kodeGuru);

  if (error) {
    console.error('[Roster] Update teacher error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Hapus guru */
export async function deleteTeacher(
  kodeGuru: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('teachers')
    .delete()
    .eq('kode_guru', kodeGuru);

  if (error) {
    console.error('[Roster] Delete teacher error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
