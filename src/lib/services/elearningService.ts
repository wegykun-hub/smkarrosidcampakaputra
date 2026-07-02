/**
 * elearningService.ts
 * Handles: ELearning courses, submissions, student/teacher accounts
 */
import { supabase } from '../supabaseClient';
import { ELearningStudentAccount, ELearningTeacherAccount } from '../../types';

// ─── Tipe Course (sama dengan ELearning.tsx) ───────────────────────────────

export interface ELCourse {
  id: string;
  code: string;
  title: string;
  major: string;
  grade: string;
  teacher: string;
  modules: any[];
  assignments: any[];
}

export interface ELSubmission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentName: string;
  studentNisn: string;
  fileName: string;
  fileBase64: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  gradedBy?: string;       // Nama guru yang menilai
  mataPelajaran?: string;  // Mata pelajaran yang dinilai
  gradedAt?: string;       // Waktu penilaian
}

// ─── Hash PIN (SHA-256 dari "nip:pin") — kompatibel HTTP dan HTTPS ────────
async function hashPin(nip: string, pin: string): Promise<string> {
  const msg = `${nip}:${pin}`;

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const buf = new TextEncoder().encode(msg);
      const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    } catch { /* fallthrough */ }
  }
  return sha256(msg);
}

// SHA-256 pure JavaScript — RFC 6234 compliant
function sha256(str: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80)       bytes.push(c);
    else if (c < 0x800) bytes.push((c >> 6) | 0xC0, (c & 0x3F) | 0x80);
    else                bytes.push((c >> 12) | 0xE0, ((c >> 6) & 0x3F) | 0x80, (c & 0x3F) | 0x80);
  }
  const msgLen = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const bitLen = msgLen * 8;
  bytes.push(0,0,0,0,(bitLen/0x1000000)&0xFF,(bitLen/0x10000)&0xFF,(bitLen/0x100)&0xFF,bitLen&0xFF);

  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < bytes.length; i += 64) {
    const w = new Array(64).fill(0);
    for (let j = 0; j < 16; j++)
      w[j] = ((bytes[i+j*4]<<24)|(bytes[i+j*4+1]<<16)|(bytes[i+j*4+2]<<8)|bytes[i+j*4+3])>>>0;
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(w[j-15],7)^rotr(w[j-15],18)^(w[j-15]>>>3);
      const s1 = rotr(w[j-2],17)^rotr(w[j-2],19)^(w[j-2]>>>10);
      w[j] = (w[j-16]+s0+w[j-7]+s1)>>>0;
    }
    let [a,b,c,d,e,f,g,h] = H;
    for (let j = 0; j < 64; j++) {
      const S1 = rotr(e,6)^rotr(e,11)^rotr(e,25);
      const t1 = (h+S1+((e&f)^(~e&g))+K[j]+w[j])>>>0;
      const S0 = rotr(a,2)^rotr(a,13)^rotr(a,22);
      const t2 = (S0+((a&b)^(a&c)^(b&c)))>>>0;
      h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
    }
    H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
  }
  return H.map(n=>n.toString(16).padStart(8,'0')).join('');
}

// ─── AKUN SISWA E-LEARNING ─────────────────────────────────────────────────

export async function fetchELStudents(): Promise<ELearningStudentAccount[]> {
  const { data, error } = await (supabase as any)
    .from('elearning_student_accounts').select('*')
    .order('name', { ascending: true });
  if (error) { console.error('[EL Students]', error.message); return []; }
  return (data ?? []).map((r: any): ELearningStudentAccount => ({
    id: r.id, nisn: r.nisn, name: r.name,
    kelas: r.kelas, jurusan: r.jurusan, status: r.status,
  }));
}

export async function upsertELStudent(s: ELearningStudentAccount): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('elearning_student_accounts').upsert({
    id: s.id, nisn: s.nisn, name: s.name,
    kelas: s.kelas, jurusan: s.jurusan, status: s.status,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteELStudent(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('elearning_student_accounts').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function replaceAllELStudents(list: ELearningStudentAccount[]): Promise<void> {
  await (supabase as any).from('elearning_student_accounts').delete().neq('id', '');
  if (list.length > 0) {
    await (supabase as any).from('elearning_student_accounts').insert(
      list.map(s => ({ id: s.id, nisn: s.nisn, name: s.name, kelas: s.kelas, jurusan: s.jurusan, status: s.status }))
    );
  }
}

// ─── AKUN GURU E-LEARNING ──────────────────────────────────────────────────

export async function fetchELTeachers(): Promise<ELearningTeacherAccount[]> {
  const { data, error } = await (supabase as any)
    .from('elearning_teacher_accounts').select('*')
    .order('name', { ascending: true });
  if (error) { console.error('[EL Teachers]', error.message); return []; }
  return (data ?? []).map((r: any): ELearningTeacherAccount => ({
    id: r.id, nip: r.nip, name: r.name,
    mataPelajaran: r.mata_pelajaran, pin: '', // PIN tidak dikembalikan ke frontend
    status: r.status,
  }));
}

/** Buat/update akun guru — PIN di-hash sebelum disimpan */
export async function upsertELTeacher(
  teacher: ELearningTeacherAccount,
  rawPin: string
): Promise<{ success: boolean; error?: string }> {
  const pinHash = await hashPin(teacher.nip, rawPin);
  const { error } = await (supabase as any).from('elearning_teacher_accounts').upsert({
    id: teacher.id, nip: teacher.nip, name: teacher.name,
    mata_pelajaran: teacher.mataPelajaran,
    pin_hash: pinHash,
    status: teacher.status,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteELTeacher(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('elearning_teacher_accounts').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Verifikasi PIN guru untuk login E-Learning */
export async function verifyELTeacherPin(pin: string): Promise<ELearningTeacherAccount | null> {
  const { data, error } = await (supabase as any)
    .from('elearning_teacher_accounts')
    .select('*')
    .eq('status', 'AKTIF');
  if (error || !data) return null;

  for (const row of data) {
    const hash = await hashPin(row.nip, pin);
    if (hash === row.pin_hash) {
      return {
        id: row.id, nip: row.nip, name: row.name,
        mataPelajaran: row.mata_pelajaran, pin: '',
        status: row.status,
      };
    }
  }
  return null;
}

/** Verifikasi login siswa E-Learning via NISN */
export async function verifyELStudentNisn(nisn: string): Promise<ELearningStudentAccount | null> {
  const { data, error } = await (supabase as any)
    .from('elearning_student_accounts')
    .select('*')
    .eq('nisn', nisn.trim())
    .eq('status', 'AKTIF')
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id, nisn: data.nisn, name: data.name,
    kelas: data.kelas, jurusan: data.jurusan, status: data.status,
  };
}

// ─── COURSES ───────────────────────────────────────────────────────────────

export async function fetchCourses(): Promise<ELCourse[]> {
  const { data, error } = await (supabase as any)
    .from('elearning_courses').select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('[Courses]', error.message); return []; }
  return (data ?? []).map((r: any): ELCourse => ({
    id: r.id, code: r.code, title: r.title, major: r.major,
    grade: r.grade, teacher: r.teacher,
    modules: r.modules ?? [], assignments: r.assignments ?? [],
  }));
}

export async function upsertCourse(c: ELCourse): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('elearning_courses').upsert({
    id: c.id, code: c.code, title: c.title, major: c.major,
    grade: c.grade, teacher: c.teacher,
    modules: c.modules, assignments: c.assignments,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function replaceAllCourses(list: ELCourse[]): Promise<void> {
  await (supabase as any).from('elearning_courses').delete().neq('id', '');
  if (list.length > 0) {
    await (supabase as any).from('elearning_courses').insert(
      list.map(c => ({
        id: c.id, code: c.code, title: c.title, major: c.major,
        grade: c.grade, teacher: c.teacher,
        modules: c.modules, assignments: c.assignments,
      }))
    );
  }
}

// ─── SUBMISSIONS ───────────────────────────────────────────────────────────

export async function fetchSubmissions(courseId?: string): Promise<ELSubmission[]> {
  let query = (supabase as any)
    .from('elearning_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (courseId) query = query.eq('course_id', courseId);

  const { data, error } = await query;
  if (error) { console.error('[Submissions]', error.message); return []; }
  return (data ?? []).map((r: any): ELSubmission => ({
    id: r.id, assignmentId: r.assignment_id, courseId: r.course_id,
    studentName: r.student_name, studentNisn: r.student_nisn,
    fileName: r.file_name, fileBase64: r.file_base64,
    submittedAt: r.submitted_at,
    grade: r.grade ?? undefined, feedback: r.feedback ?? undefined,
    status: r.status,
    gradedBy: r.graded_by ?? undefined,
    mataPelajaran: r.mata_pelajaran ?? undefined,
    gradedAt: r.graded_at ?? undefined,
  }));
}

export async function insertSubmission(s: ELSubmission): Promise<{ success: boolean; error?: string }> {
  // Tentukan apakah fileBase64 adalah Storage URL atau base64 sesungguhnya
  const isStorageUrl = s.fileBase64?.startsWith('http');

  const { error } = await (supabase as any).from('elearning_submissions').insert({
    id: s.id, assignment_id: s.assignmentId, course_id: s.courseId,
    student_name: s.studentName, student_nisn: s.studentNisn,
    file_name: s.fileName,
    // Jika URL Storage — simpan di file_base64 (kolom ini dipakai untuk download)
    // Base64 asli tidak disimpan kalau sudah ada Storage URL (hemat storage DB)
    file_base64: isStorageUrl ? s.fileBase64 : (s.fileBase64 ?? ''),
    submitted_at: s.submittedAt, status: 'submitted',
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function gradeSubmission(
  id: string,
  grade: number,
  feedback: string,
  gradedBy?: string,
  mataPelajaran?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('elearning_submissions')
    .update({
      grade,
      feedback,
      status: 'graded',
      graded_by: gradedBy ?? null,
      mata_pelajaran: mataPelajaran ?? null,
      graded_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── SUBMISSIONS PER KELAS ─────────────────────────────────

/** Ambil submission + kelas dari enrolled_students */
export async function fetchSubmissionsByKelas(
  kelas: 'X' | 'XI' | 'XII'
): Promise<ELSubmission[]> {
  // Ambil NISN siswa di kelas tersebut
  const { data: students, error: e1 } = await (supabase as any)
    .from('enrolled_students')
    .select('nisn')
    .eq('kelas', kelas);

  if (e1 || !students || students.length === 0) return [];

  const nsnList = students.map((s: any) => s.nisn);

  const { data, error } = await (supabase as any)
    .from('elearning_submissions')
    .select('*')
    .in('student_nisn', nsnList)
    .order('created_at', { ascending: false });

  if (error) { console.error('[Submissions] byKelas:', error.message); return []; }

  return (data ?? []).map((r: any): ELSubmission => ({
    id: r.id, assignmentId: r.assignment_id, courseId: r.course_id,
    studentName: r.student_name, studentNisn: r.student_nisn,
    fileName: r.file_name, fileBase64: r.file_base64,
    submittedAt: r.submitted_at,
    grade: r.grade ?? undefined, feedback: r.feedback ?? undefined,
    status: r.status,
    gradedBy: r.graded_by ?? undefined,
    mataPelajaran: r.mata_pelajaran ?? undefined,
    gradedAt: r.graded_at ?? undefined,
  }));
}

/** Rekap nilai: jumlah submission dan rata-rata nilai per kelas */
export async function fetchValueSummaryByKelas(): Promise<
  Record<string, { total: number; dinilai: number; rataRata: number }>
> {
  const summary: Record<string, { total: number; dinilai: number; rataRata: number }> = {
    X:   { total: 0, dinilai: 0, rataRata: 0 },
    XI:  { total: 0, dinilai: 0, rataRata: 0 },
    XII: { total: 0, dinilai: 0, rataRata: 0 },
  };

  for (const kelas of ['X', 'XI', 'XII'] as const) {
    const subs = await fetchSubmissionsByKelas(kelas);
    summary[kelas].total = subs.length;
    const graded = subs.filter(s => s.grade !== undefined);
    summary[kelas].dinilai = graded.length;
    summary[kelas].rataRata = graded.length > 0
      ? Math.round(graded.reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded.length)
      : 0;
  }

  return summary;
}

/** Update kelas pada submission (diisi dari enrolled_students) */
export async function syncSubmissionKelas(): Promise<void> {
  const { data: students } = await (supabase as any)
    .from('enrolled_students')
    .select('nisn, kelas, jurusan');

  if (!students) return;

  for (const s of students) {
    await (supabase as any)
      .from('elearning_submissions')
      .update({ kelas: s.kelas })
      .eq('student_nisn', s.nisn)
      .is('kelas', null);
  }
}
