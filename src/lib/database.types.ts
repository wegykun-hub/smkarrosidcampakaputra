// Auto-generated Supabase database types untuk SMK Ar Rosyid Campaka Putra
// Update file ini jika ada perubahan schema di Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {

      // ─── SPMB: Pendaftaran Siswa Baru ───────────────────────────────────────
      spmb_registrations: {
        Row: {
          id: string;                       // REG-SMKAR-2026-0001
          created_at: string;               // ISO timestamp
          nama_lengkap: string;
          jenis_kelamin: 'L' | 'P';
          nisn: string;
          nik: string;
          no_kk: string;
          tempat_lahir: string;
          tanggal_lahir: string;
          no_akta_lahir: string;
          agama: string;
          kewarganegaraan: 'WNI' | 'WNA';
          alamat: string;
          rt: string;
          rw: string;
          desa: string;
          kecamatan: string;
          kode_pos: string;
          anak_ke: number;
          memiliki_kip: 'YA' | 'TIDAK';
          no_kip: string | null;
          nama_ayah: string;
          nik_ayah: string;
          tempat_lahir_ayah: string;
          tanggal_lahir_ayah: string;
          pendidikan_ayah: string;
          pekerjaan_ayah: string;
          penghasilan_ayah: string;
          nama_ibu: string;
          nik_ibu: string;
          tempat_lahir_ibu: string;
          tanggal_lahir_ibu: string;
          pendidikan_ibu: string;
          pekerjaan_ibu: string;
          penghasilan_ibu: string;
          status_verifikasi: 'PENDING' | 'DIVERIFIKASI' | 'DITOLAK';
        };
        Insert: Omit<Database['public']['Tables']['spmb_registrations']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['spmb_registrations']['Insert']>;
      };

      // ─── Absensi ────────────────────────────────────────────────────────────
      attendance_records: {
        Row: {
          id: string;                       // ATT-SIS-123456
          created_at: string;
          role: 'SISWA' | 'GURU';
          id_number: string;               // NISN atau NIP/kode guru
          name: string;
          type: 'MASUK' | 'PULANG';
          timestamp: string;               // tanggal + jam absensi
          photo: string;                   // base64 JPEG
          latitude: number;
          longitude: number;
          distance_in_meters: number;
          status: 'TEPAT WAKTU' | 'TERLAMBAT' | 'PULANG';
          kelas: string | null;
        };
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
      };

      // ─── Data Siswa Terdaftar ────────────────────────────────────────────────
      enrolled_students: {
        Row: {
          id: string;                       // UUID
          created_at: string;
          nisn: string;
          nama: string;
          kelas: 'X' | 'XI' | 'XII';
          jurusan: 'TKJ' | 'PEMASARAN' | 'UMUM';
          jenis_kelamin: 'L' | 'P';
          alamat: string | null;
          telepon: string | null;
          status: 'AKTIF' | 'ALUMNI' | 'MUTASI';
        };
        Insert: Omit<Database['public']['Tables']['enrolled_students']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['enrolled_students']['Insert']>;
      };

      // ─── Data Guru ───────────────────────────────────────────────────────────
      teachers: {
        Row: {
          id: string;                       // UUID
          created_at: string;
          kode_guru: string;               // kode unik (juga dipakai untuk absensi)
          nip: string | null;
          nama: string;
          jabatan: string;
          mata_pelajaran: string | null;
          status: 'AKTIF' | 'NON_AKTIF';
        };
        Insert: Omit<Database['public']['Tables']['teachers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['teachers']['Insert']>;
      };

      // ─── Admin Accounts ──────────────────────────────────────────────────────
      admin_accounts: {
        Row: {
          id: string;                       // UUID
          created_at: string;
          username: string;
          name: string;
          password_hash: string;           // bcrypt hash – JANGAN simpan plaintext
          role: 'SUPER_ADMIN' | 'ADMIN_STAF';
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['admin_accounts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['admin_accounts']['Insert']>;
      };

    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
