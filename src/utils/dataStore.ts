/**
 * dataStore.ts — wrapper kompatibilitas untuk komponen lama
 * Data utama sekarang disimpan di Supabase.
 * localStorage hanya sebagai cache fallback agar UI tidak kosong saat loading.
 */
import { NewsItem, GalleryItem, DashboardSlide, GeneralSettings } from '../types';
import { NEWS_DATA, GALLERY_DATA, CONTACT_INFO, VISI_MISI, SAMBUTAN_KEPALA_SEKOLAH } from '../data';

// ── Cache keys (hanya sebagai in-memory fallback, bukan source of truth) ──
const SETTINGS_KEY = 'ar_rosyid_general_settings_v1';

const DEFAULT_SLIDES: DashboardSlide[] = [
  {
    id: 'slide-1',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600',
    title: 'Selamat Datang di SMK Ar Rosyid Campaka Putra',
    subtitle: 'Mewujudkan Pendidikan Kejuruan Berkarakter Islami, Unggul, Kompeten, & Berorientasi Industri Modern.',
    actionText: 'Daftar SPMB Online 2026/2027',
    actionSub: 'formulir',
  },
  {
    id: 'slide-2',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1600',
    title: 'Unggul Terdepan dalam Teknologi Komputer TKJ',
    subtitle: 'Didukung sertifikasi industri internasional Mikrotik Academy.',
    actionText: 'Pelajari Jurusan TKJ',
    actionSub: 'jurusan',
  },
  {
    id: 'slide-3',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600',
    title: 'Inovatif & Kreatif Bersama Bisnis Daring & Pemasaran',
    subtitle: 'Membentuk sosiopreneur handal yang piawai mengelola e-commerce.',
    actionText: 'Pelajari Jurusan Pemasaran',
    actionSub: 'jurusan',
  },
];

const DEFAULT_SETTINGS: GeneralSettings = {
  contactAlamat: CONTACT_INFO.alamat,
  contactTelepon: CONTACT_INFO.telepon,
  contactEmail: CONTACT_INFO.email,
  contactJamKerja: CONTACT_INFO.jamKerja,
  contactInstagram: CONTACT_INFO.instagram,
  contactYoutube: CONTACT_INFO.youtube,
  contactMapUrl: CONTACT_INFO.mapUrl,
  visiText: VISI_MISI.visi,
  misiList: VISI_MISI.misi,
  visiSekolah: VISI_MISI.visi,
  misiSekolah: VISI_MISI.misi.join('\n'),
  sambutanNama: SAMBUTAN_KEPALA_SEKOLAH.nama,
  sambutanFoto: SAMBUTAN_KEPALA_SEKOLAH.foto,
  sambutanIsi: SAMBUTAN_KEPALA_SEKOLAH.isi,
  sambutanKepalaNama: SAMBUTAN_KEPALA_SEKOLAH.nama,
  sambutanKepalaFoto: SAMBUTAN_KEPALA_SEKOLAH.foto,
  sambutanKepalaIsi: SAMBUTAN_KEPALA_SEKOLAH.isi,
  spmbTahunAjaran: '2026/2027',
  spmbBatasKip: '',
  spmbKuotaTarget: 120,
  spmbStatusPendaftaran: 'DIBUKA',
  absensiWaktuMasuk: '07:00',
  absensiWaktuToleransi: '07:30',
  absensiMasukHour: 7,
  absensiMasukMinute: 30,
  absensiPulangHour: 15,
  schoolLogo: '',
  clockOffset: 7,
  clockTimezone: 'WIB',
  marqueeText: '⭐ Penerimaan Siswa Didik Baru (SPMB) Gelombang 1 Tahun Ajaran 2026/2027 telah dibuka! Dapatkan Beasiswa Khusus bagi Pemilik Kartu Indonesia Pintar (KIP) & Prestasi. 🌐 Daftarkan Diri Anda Secara Berkas Online dengan Cepat & Cetak Kartu Registrasi Sekarang Juga! ⭐',
  marqueeLabel: 'INFO SPMB:',
};

// ── Fungsi-fungsi ini tetap dipertahankan untuk kompatibilitas komponen lama ──
// App.tsx akan override dengan data dari Supabase setelah mount.

export function getLoadedNews(): NewsItem[] { return NEWS_DATA; }
export function saveLoadedNews(_list: NewsItem[]): void { /* no-op: simpan via contentService */ }

export function getLoadedGallery(): GalleryItem[] { return GALLERY_DATA; }
export function saveLoadedGallery(_list: GalleryItem[]): void { /* no-op */ }

export function getLoadedSlides(): DashboardSlide[] { return DEFAULT_SLIDES; }
export function saveLoadedSlides(_list: DashboardSlide[]): void { /* no-op */ }

export function getGeneralSettings(): GeneralSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

export function saveGeneralSettings(settings: GeneralSettings): void {
  // Simpan ke localStorage sebagai cache lokal
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
  // Simpan ke Supabase secara async (fire-and-forget)
  import('../lib/services/contentService').then(({ saveGeneralSettingsToDb }) => {
    saveGeneralSettingsToDb(settings).catch(e =>
      console.error('[dataStore] saveGeneralSettings to Supabase failed:', e)
    );
  });
}
