export interface RegistrationData {
  id: string; // Unique Registration No e.g., REG-AR-2026-0001
  timestamp: string;
  
  // DATA PRIBADI SISWA BARU
  namaLengkap: string;
  jenisKelamin: 'L' | 'P';
  nisn: string;
  nik: string;
  noKk: string;
  tempatLahir: string;
  tanggalLahir: string;
  noAktaLahir: string;
  agama: 'Islam' | 'Protestan' | 'Katholik' | 'Hindu' | 'Buddha' | 'Konghucu';
  kewarganegaraan: 'WNI' | 'WNA';
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kodePos: string;
  anakKe: number;
  memilikiKip: 'YA' | 'TIDAK';
  noKip?: string;

  // DATA DEWASA / AYAH
  namaAyah: string;
  nikAyah: string;
  tempatLahirAyah: string;
  tanggalLahirAyah: string;
  pendidikanAyah: string;
  pekerjaanAyah: string;
  penghasilanAyah: string;

  // DATA DEWASA / IBU
  namaIbu: string;
  nikIbu: string;
  tempatLahirIbu: string;
  tanggalLahirIbu: string;
  pendidikanIbu: string;
  pekerjaanIbu: string;
  penghasilanIbu: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  image: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
}

export interface AttendanceRecord {
  id: string;
  role: 'SISWA' | 'GURU';
  idNumber: string; // NISN atau NIP
  name: string;
  type: 'MASUK' | 'PULANG';
  timestamp: string;
  photo: string; // base64 payload captured from WebCam
  latitude: number;
  longitude: number;
  distanceInMeters: number;
  status: 'TEPAT WAKTU' | 'TERLAMBAT' | 'PULANG';
  kelas?: 'X' | 'XI' | 'XII' | string;
}

export interface EnrolledStudent {
  nisn: string;
  nama: string;
  kelas: 'X' | 'XI' | 'XII';
  jurusan: 'TKJ' | 'PEMASARAN' | 'UMUM';
  jenisKelamin: 'L' | 'P';
  alamat?: string;
  telepon?: string;
  status: 'AKTIF' | 'ALUMNI' | 'MUTASI';
}

export interface DashboardSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  actionText: string;
  actionSub: string;
}

export interface GeneralSettings {
  contactAlamat: string;
  contactTelepon: string;
  contactEmail: string;
  contactJamKerja: string;
  contactInstagram: string;
  contactYoutube: string;
  contactMapUrl: string;

  visiText: string;
  misiList: string[];
  visiSekolah?: string;
  misiSekolah?: string;

  sambutanNama: string;
  sambutanFoto: string;
  sambutanIsi: string;
  sambutanKepalaNama?: string;
  sambutanKepalaFoto?: string;
  sambutanKepalaIsi?: string;

  spmbTahunAjaran: string;
  spmbBatasKip: string;
  spmbKuotaTarget: number | string;
  spmbStatusPendaftaran: string;

  absensiWaktuMasuk: string;
  absensiWaktuToleransi: string;
  absensiMasukHour?: number;
  absensiMasukMinute?: number;
  absensiPulangHour?: number;
  schoolLogo?: string;
  clockOffset?: number;
  clockTimezone?: string;
  marqueeText?: string;   // Teks running/berjalan di navigation bar
  marqueeLabel?: string;  // Label kotak merah (contoh: "INFO SPMB:")
}

export interface ELearningStudentAccount {
  id: string; // ID unik (bisa NISN)
  nisn: string;
  name: string;
  kelas: 'X' | 'XI' | 'XII';
  jurusan: 'TKJ' | 'PEMASARAN' | 'UMUM' | string;
  status: 'AKTIF' | 'NON_AKTIF';
}

export interface ELearningTeacherAccount {
  id: string; // ID unik (bisa NIP)
  nip: string;
  name: string;
  mataPelajaran: string;
  pin: string; // PIN Keamanan login
  status: 'AKTIF' | 'NON_AKTIF';
}export interface AdminAccount {
  username: string; // nama unik
  name: string; // nama tampilan
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN_STAF';
  createdAt: string;
}

// ── Fasilitas Sekolah ─────────────────────────────────────
export interface FasilitasItem {
  id: string;
  name: string;
  desc: string;
  image: string;
  sortOrder: number;
}
export interface TeacherProfile {
  id: string;
  nama: string;
  jabatan: string;
  kategori: 'PIMPINAN' | 'TKJ' | 'PEMASARAN' | 'UMUM';
  foto: string;
  pendidikan: string;
  mataPelajaran: string;
  email: string;
  kodeGuru: string;
  nip?: string;
}
