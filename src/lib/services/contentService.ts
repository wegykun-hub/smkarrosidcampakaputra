/**
 * contentService.ts
 * Handles: News, Gallery, Slides, GeneralSettings, TeacherProfiles
 */
import { supabase } from '../supabaseClient';
import { NewsItem, GalleryItem, DashboardSlide, GeneralSettings, TeacherProfile, FasilitasItem } from '../../types';
import { NEWS_DATA, GALLERY_DATA, FASILITAS, CONTACT_INFO, VISI_MISI, SAMBUTAN_KEPALA_SEKOLAH } from '../../data';

// ─── NEWS ──────────────────────────────────────────────────────────────────

export async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await (supabase as any)
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('[News] fetch:', error.message); return NEWS_DATA; }
  return (data ?? []).map((r: any): NewsItem => ({
    id: r.id, title: r.title, excerpt: r.excerpt,
    content: r.content, date: r.date, category: r.category, image: r.image,
  }));
}

export async function upsertNews(item: NewsItem): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('news').upsert({
    id: item.id, title: item.title, excerpt: item.excerpt,
    content: item.content, date: item.date, category: item.category, image: item.image,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteNews(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('news').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function replaceAllNews(list: NewsItem[]): Promise<void> {
  await (supabase as any).from('news').delete().neq('id', '');
  if (list.length > 0) {
    await (supabase as any).from('news').insert(list.map(item => ({
      id: item.id, title: item.title, excerpt: item.excerpt,
      content: item.content, date: item.date, category: item.category, image: item.image,
    })));
  }
}

// ─── GALLERY ───────────────────────────────────────────────────────────────

export async function fetchGallery(): Promise<GalleryItem[]> {
  const { data, error } = await (supabase as any)
    .from('gallery').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[Gallery] fetch:', error.message); return GALLERY_DATA; }
  return (data ?? []).map((r: any): GalleryItem => ({
    id: r.id, title: r.title, description: r.description,
    image: r.image, category: r.category,
  }));
}

export async function upsertGallery(item: GalleryItem): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('gallery').upsert({
    id: item.id, title: item.title, description: item.description,
    image: item.image, category: item.category,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteGallery(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('gallery').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function replaceAllGallery(list: GalleryItem[]): Promise<void> {
  await (supabase as any).from('gallery').delete().neq('id', '');
  if (list.length > 0) {
    await (supabase as any).from('gallery').insert(list.map(item => ({
      id: item.id, title: item.title, description: item.description,
      image: item.image, category: item.category,
    })));
  }
}

// ─── SLIDES ────────────────────────────────────────────────────────────────

export async function fetchSlides(): Promise<DashboardSlide[]> {
  const { data, error } = await (supabase as any)
    .from('slides').select('*').order('sort_order', { ascending: true });
  if (error) { console.error('[Slides] fetch:', error.message); return []; }
  return (data ?? []).map((r: any): DashboardSlide => ({
    id: r.id, image: r.image, title: r.title,
    subtitle: r.subtitle, actionText: r.action_text, actionSub: r.action_sub,
  }));
}

export async function replaceAllSlides(list: DashboardSlide[]): Promise<void> {
  await (supabase as any).from('slides').delete().neq('id', '');
  if (list.length > 0) {
    await (supabase as any).from('slides').insert(list.map((item, idx) => ({
      id: item.id, image: item.image, title: item.title,
      subtitle: item.subtitle, action_text: item.actionText,
      action_sub: item.actionSub, sort_order: idx,
    })));
  }
}

// ─── GENERAL SETTINGS ──────────────────────────────────────────────────────

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

function settingsFromDb(r: any): GeneralSettings {
  const misiArray: string[] = Array.isArray(r.misi_list)
    ? r.misi_list
    : (r.misi_list ? String(r.misi_list).split('\n').filter((l: string) => l.trim()) : DEFAULT_SETTINGS.misiList);

  return {
    ...DEFAULT_SETTINGS,
    contactAlamat: r.contact_alamat ?? DEFAULT_SETTINGS.contactAlamat,
    contactTelepon: r.contact_telepon ?? DEFAULT_SETTINGS.contactTelepon,
    contactEmail: r.contact_email ?? DEFAULT_SETTINGS.contactEmail,
    contactJamKerja: r.contact_jam_kerja ?? DEFAULT_SETTINGS.contactJamKerja,
    contactInstagram: r.contact_instagram ?? DEFAULT_SETTINGS.contactInstagram,
    contactYoutube: r.contact_youtube ?? DEFAULT_SETTINGS.contactYoutube,
    contactMapUrl: r.contact_map_url ?? DEFAULT_SETTINGS.contactMapUrl,
    // visi — isi semua alias dari kolom yang sama
    visiText: r.visi_text ?? DEFAULT_SETTINGS.visiText,
    visiSekolah: r.visi_text ?? DEFAULT_SETTINGS.visiSekolah,
    // misi — isi array dan string dari kolom yang sama
    misiList: misiArray,
    misiSekolah: misiArray.join('\n'),
    // sambutan — isi semua alias dari kolom yang sama
    sambutanNama: r.sambutan_nama ?? DEFAULT_SETTINGS.sambutanNama,
    sambutanFoto: r.sambutan_foto ?? DEFAULT_SETTINGS.sambutanFoto,
    sambutanIsi: r.sambutan_isi ?? DEFAULT_SETTINGS.sambutanIsi,
    sambutanKepalaNama: r.sambutan_nama ?? DEFAULT_SETTINGS.sambutanKepalaNama,
    sambutanKepalaFoto: r.sambutan_foto ?? DEFAULT_SETTINGS.sambutanKepalaFoto,
    sambutanKepalaIsi: r.sambutan_isi ?? DEFAULT_SETTINGS.sambutanKepalaIsi,
    spmbTahunAjaran: r.spmb_tahun_ajaran ?? DEFAULT_SETTINGS.spmbTahunAjaran,
    spmbBatasKip: r.spmb_batas_kip ?? DEFAULT_SETTINGS.spmbBatasKip,
    spmbKuotaTarget: r.spmb_kuota_target ?? DEFAULT_SETTINGS.spmbKuotaTarget,
    spmbStatusPendaftaran: r.spmb_status_pendaftaran ?? DEFAULT_SETTINGS.spmbStatusPendaftaran,
    absensiWaktuMasuk: `${String(r.absensi_masuk_hour ?? 7).padStart(2,'0')}:${String(r.absensi_masuk_minute ?? 30).padStart(2,'0')}`,
    absensiWaktuToleransi: `${String(r.absensi_masuk_hour ?? 7).padStart(2,'0')}:${String(r.absensi_masuk_minute ?? 30).padStart(2,'0')}`,
    absensiMasukHour: r.absensi_masuk_hour ?? 7,
    absensiMasukMinute: r.absensi_masuk_minute ?? 30,
    absensiPulangHour: r.absensi_pulang_hour ?? 15,
    schoolLogo: r.school_logo ?? '',
    clockOffset: r.clock_offset ?? 7,
    clockTimezone: r.clock_timezone ?? 'WIB',
    marqueeText: r.marquee_text ?? DEFAULT_SETTINGS.marqueeText,
    marqueeLabel: r.marquee_label ?? DEFAULT_SETTINGS.marqueeLabel,
  };
}

function settingsToDb(s: GeneralSettings) {
  // Sync alias fields — form AdminPanel pakai sambutanKepala* dan visiSekolah/misiSekolah
  // tapi DB hanya punya sambutan_nama/foto/isi, visi_text, misi_list
  const sambutanNama = s.sambutanKepalaNama || s.sambutanNama || '';
  const sambutanFoto = s.sambutanKepalaFoto || s.sambutanFoto || '';
  const sambutanIsi  = s.sambutanKepalaIsi  || s.sambutanIsi  || '';
  const visiText     = s.visiSekolah || s.visiText || '';
  // misiList: parse dari misiSekolah (textarea, per baris) atau pakai array langsung
  const misiList: string[] = s.misiSekolah
    ? s.misiSekolah.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    : Array.isArray(s.misiList) ? s.misiList : [];

  return {
    id: 'main',
    contact_alamat: s.contactAlamat,
    contact_telepon: s.contactTelepon,
    contact_email: s.contactEmail,
    contact_jam_kerja: s.contactJamKerja,
    contact_instagram: s.contactInstagram,
    contact_youtube: s.contactYoutube,
    contact_map_url: s.contactMapUrl,
    visi_text: visiText,
    misi_list: misiList,
    sambutan_nama: sambutanNama,
    sambutan_foto: sambutanFoto,
    sambutan_isi: sambutanIsi,
    spmb_tahun_ajaran: s.spmbTahunAjaran,
    spmb_batas_kip: s.spmbBatasKip,
    spmb_kuota_target: Number(s.spmbKuotaTarget),
    spmb_status_pendaftaran: s.spmbStatusPendaftaran,
    absensi_masuk_hour: s.absensiMasukHour ?? 7,
    absensi_masuk_minute: s.absensiMasukMinute ?? 30,
    absensi_pulang_hour: s.absensiPulangHour ?? 15,
    school_logo: s.schoolLogo ?? '',
    clock_offset: s.clockOffset ?? 7,
    clock_timezone: s.clockTimezone ?? 'WIB',
    marquee_text: s.marqueeText ?? DEFAULT_SETTINGS.marqueeText,
    marquee_label: s.marqueeLabel ?? DEFAULT_SETTINGS.marqueeLabel,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchGeneralSettings(): Promise<GeneralSettings> {
  const { data, error } = await (supabase as any)
    .from('general_settings').select('*').eq('id', 'main').maybeSingle();
  if (error || !data) {
    console.error('[Settings] fetch:', error?.message);
    return DEFAULT_SETTINGS;
  }
  return settingsFromDb(data);
}

export async function saveGeneralSettingsToDb(s: GeneralSettings): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('general_settings').upsert(settingsToDb(s));
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── TEACHER PROFILES ──────────────────────────────────────────────────────

export async function fetchTeacherProfiles(): Promise<TeacherProfile[]> {
  const { data, error } = await (supabase as any)
    .from('teacher_profiles').select('*').order('id', { ascending: true });
  if (error) { console.error('[TeacherProfiles] fetch:', error.message); return []; }
  return (data ?? []).map((r: any): TeacherProfile => ({
    id: r.id, nama: r.nama, jabatan: r.jabatan,
    kategori: r.kategori, foto: r.foto, pendidikan: r.pendidikan,
    mataPelajaran: r.mata_pelajaran, email: r.email, kodeGuru: r.kode_guru,
  }));
}

export async function upsertTeacherProfile(t: TeacherProfile): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('teacher_profiles').upsert({
    id: t.id, nama: t.nama, jabatan: t.jabatan, kategori: t.kategori,
    foto: t.foto, pendidikan: t.pendidikan, mata_pelajaran: t.mataPelajaran,
    email: t.email, kode_guru: t.kodeGuru,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteTeacherProfile(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('teacher_profiles').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── FASILITAS ─────────────────────────────────────────────

const DEFAULT_FASILITAS: FasilitasItem[] = FASILITAS.map((f, i) => ({
  id: `fas-${i+1}`,
  name: f.name,
  desc: f.desc,
  image: f.image,
  sortOrder: i,
}));

export async function fetchFasilitas(): Promise<FasilitasItem[]> {
  const { data, error } = await (supabase as any)
    .from('fasilitas')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error('[Fasilitas] fetch:', error.message); return DEFAULT_FASILITAS; }
  if (!data || data.length === 0) return DEFAULT_FASILITAS;
  return data.map((r: any): FasilitasItem => ({
    id: r.id, name: r.name,
    desc: r.deskripsi ?? r.desc ?? '',   // support kedua nama kolom
    image: r.image, sortOrder: r.sort_order,
  }));
}

export async function upsertFasilitas(item: FasilitasItem): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('fasilitas').upsert({
    id: item.id, name: item.name,
    deskripsi: item.desc,              // kolom di DB namanya deskripsi
    image: item.image, sort_order: item.sortOrder,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteFasilitas(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any).from('fasilitas').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function replaceAllFasilitas(list: FasilitasItem[]): Promise<void> {
  await (supabase as any).from('fasilitas').delete().neq('id', '');
  if (list.length > 0) {
    await (supabase as any).from('fasilitas').insert(
      list.map((f, i) => ({
        id: f.id, name: f.name, deskripsi: f.desc,
        image: f.image, sort_order: i,
      }))
    );
  }
}
