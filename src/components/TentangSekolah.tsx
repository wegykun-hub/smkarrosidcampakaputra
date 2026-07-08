import React, { useState, useEffect, useCallback } from "react";
import { VISI_MISI, SAMBUTAN_KEPALA_SEKOLAH, FASILITAS } from "../data";
import { 
  Award, BookOpen, Clock, Heart, Users, Search, Plus, Trash2, 
  Edit, Mail, GraduationCap, Filter, ShieldCheck, Check, X, Camera,
  Lock, Eye, EyeOff, LogIn, LogOut, AlertCircle, Loader2
} from "lucide-react";
import { TeacherProfile } from "../types";
import {
  fetchTeacherProfiles, upsertTeacherProfile, deleteTeacherProfile,
  fetchFasilitas,
} from "../lib/services/contentService";
import { loginAdmin } from "../lib/services/adminAuthService";

// Re-export untuk kompatibilitas komponen lain yang masih import dari sini
export type { TeacherProfile };

const DEFAULT_TEACHERS: TeacherProfile[] = [
  {
    id: "TEACH-01",
    nama: "H. Asep Rosyadi, M.Pd.",
    jabatan: "Kepala Sekolah",
    kategori: "PIMPINAN",
    foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
    pendidikan: "S2 Keolahragaan & Manajemen Pendidikan - UPI",
    mataPelajaran: "Pengantar Komitmen Karakter Kejuruan",
    email: "aseprosyadi@smkarrosyidcampaka.sch.id",
    kodeGuru: "AR-01"
  },
  {
    id: "TEACH-02",
    nama: "H. Ahmad Riyadi, S.Pd.I.",
    jabatan: "Wakil Kepala Sekolah & Urusan Humas",
    kategori: "UMUM",
    foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    pendidikan: "S1 Pendidikan Agama Islam - UIN Bandung",
    mataPelajaran: "Pendidikan Agama Islam, Akhlak, & Aswaja",
    email: "ahmadriyadi@smkarrosyidcampaka.sch.id",
    kodeGuru: "AR-02"
  },
  {
    id: "TEACH-03",
    nama: "Rina Sulistiawati, S.Kom.",
    jabatan: "Kepala Program Studi Teknik Komputer & Jaringan",
    kategori: "TKJ",
    foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
    pendidikan: "S1 Informatika / Komputer - Universitas Pasundan",
    mataPelajaran: "Administrasi Sistem Jaringan & Server Linux",
    email: "rinasulistia@smkarrosyidcampaka.sch.id",
    kodeGuru: "TKJ-01"
  },
  {
    id: "TEACH-04",
    nama: "Dian Nugraha, S.E.",
    jabatan: "Kepala Program Studi Bisnis Daring & Pemasaran",
    kategori: "PEMASARAN",
    foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
    pendidikan: "S1 Pemasaran Ekonomi - Universitas Pakuan",
    mataPelajaran: "Digital Marketing, Social Ads, & E-Commerce",
    email: "diannugraha@smkarrosyidcampaka.sch.id",
    kodeGuru: "BDP-01"
  },
  {
    id: "TEACH-05",
    nama: "Fajar Ramadhan, S.Kom.",
    jabatan: "Guru Produktif Teknik Komputer & Jaringan",
    kategori: "TKJ",
    foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    pendidikan: "S1 Sistem Informasi - UPI YPTK",
    mataPelajaran: "Jaringan Nirkabel, Fiber Optic, & Mikrotik Routing",
    email: "fajarramadhan@smkarrosyidcampaka.sch.id",
    kodeGuru: "TKJ-02"
  },
  {
    id: "TEACH-06",
    nama: "Eka Wahyuni, M.Pd.",
    jabatan: "Guru Bahasa Inggris & Koordinator BK",
    kategori: "UMUM",
    foto: "https://images.unsplash.com/photo-1534751516642-a131fed10495?auto=format&fit=crop&q=80&w=400",
    pendidikan: "S2 Tadris Bahasa Inggris - Sekolah Tinggi Cianjur",
    mataPelajaran: "Bahasa Inggris Komunikasi & Korespondensi Bisnis",
    email: "ekawahyuni@smkarrosyidcampaka.sch.id",
    kodeGuru: "UM-01"
  }
];

interface TentangProps {
  initialSubTab?: string;
  settings?: any;
}

export default function TentangSekolah({ initialSubTab = "sambutan", settings }: TentangProps) {
  const [activeSub, setActiveSub] = useState(initialSubTab);

  // Dynamic values resolved from settings or fallbacks
  // Prioritas: sambutanKepalaNama (diset admin) → sambutanNama → default data
  const infoVisi = settings?.visiText || VISI_MISI.visi;
  const infoMisi = settings?.misiList || VISI_MISI.misi;
  const infoSambutanNama = settings?.sambutanKepalaNama || settings?.sambutanNama || SAMBUTAN_KEPALA_SEKOLAH.nama;
  const infoSambutanFoto = settings?.sambutanKepalaFoto || settings?.sambutanFoto || SAMBUTAN_KEPALA_SEKOLAH.foto;
  const infoSambutanIsi  = settings?.sambutanKepalaIsi  || settings?.sambutanIsi  || SAMBUTAN_KEPALA_SEKOLAH.isi;

  // Sync route subtab on page navigation changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSub(initialSubTab);
    }
  }, [initialSubTab]);

  // Teacher Profile state — disimpan ke Supabase (teacher_profiles)
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<'SEMUA' | 'PIMPINAN' | 'TKJ' | 'PEMASARAN' | 'UMUM'>('SEMUA');
  
  // Admin Mode Controls
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);

  // Form Inputs
  const [inputNama, setInputNama] = useState("");
  const [inputJabatan, setInputJabatan] = useState("");
  const [inputKategori, setInputKategori] = useState<'PIMPINAN' | 'TKJ' | 'PEMASARAN' | 'UMUM'>("UMUM");
  const [inputFoto, setInputFoto] = useState("");
  const [inputPendidikan, setInputPendidikan] = useState("");
  const [inputMataPelajaran, setInputMataPelajaran] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputKodeGuru, setInputKodeGuru] = useState("");

  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Admin Login Guard States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);

  // Fasilitas state — load dari Supabase
  const [fasilitasList, setFasilitasList] = useState<import('../types').FasilitasItem[]>([]);

  // Load teachers + fasilitas dari Supabase
  const loadTeachers = useCallback(async () => {
    const [data, fasData] = await Promise.all([
      fetchTeacherProfiles(),
      fetchFasilitas(),
    ]);
    setTeachers(data.length > 0 ? data : DEFAULT_TEACHERS);
    setFasilitasList(fasData);
  }, []);

  useEffect(() => {
    loadTeachers();

    // Sync status login dari sessionStorage (diset oleh AdminPanel)
    const session = sessionStorage.getItem("ar_rosyid_admin_session");
    setIsAdminAuthenticated(!!session);

    const handleStorageChange = () => {
      const session = sessionStorage.getItem("ar_rosyid_admin_session");
      setIsAdminAuthenticated(!!session);
      if (!session) setIsAdminMode(false);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadTeachers]);

  const [loginLoading, setLoginLoading] = useState(false);

  const handleTeacherAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");
    setLoginLoading(true);

    const result = await loginAdmin(adminUsername.trim(), adminPassword);
    setLoginLoading(false);

    if (result.success && result.admin) {
      sessionStorage.setItem("ar_rosyid_admin_session", JSON.stringify(result.admin));
      setIsAdminAuthenticated(true);
      setIsAdminMode(true);
      setShowLoginModal(false);
      setAdminUsername("");
      setAdminPassword("");
      triggerToast("success", `Selamat datang, ${result.admin.name}!`);
      window.dispatchEvent(new Event("storage"));
    } else {
      setAdminLoginError(result.error ?? "Login gagal.");
    }
  };

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleOpenAddForm = () => {
    setEditingTeacher(null);
    setInputNama("");
    setInputJabatan("");
    setInputKategori("UMUM");
    setInputFoto("");
    setInputPendidikan("");
    setInputMataPelajaran("");
    setInputEmail("");
    setInputKodeGuru("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (t: TeacherProfile) => {
    setEditingTeacher(t);
    setInputNama(t.nama);
    setInputJabatan(t.jabatan);
    setInputKategori(t.kategori);
    setInputFoto(t.foto);
    setInputPendidikan(t.pendidikan);
    setInputMataPelajaran(t.mataPelajaran);
    setInputEmail(t.email);
    setInputKodeGuru(t.kodeGuru);
    setIsFormOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNama.trim() || !inputJabatan.trim()) {
      triggerToast("error", "Simpan gagal: Nama dan Jabatan wajib diisi!");
      return;
    }

    const dataPayload: TeacherProfile = {
      id: editingTeacher?.id || `GURU-${Date.now().toString().slice(-6)}`,
      nama: inputNama.trim(),
      jabatan: inputJabatan.trim(),
      kategori: inputKategori,
      foto: inputFoto.trim() || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
      pendidikan: inputPendidikan.trim() || "S1 Kependidikan",
      mataPelajaran: inputMataPelajaran.trim() || "Umum",
      email: inputEmail.trim() || "guru@smkarrosyidcampaka.sch.id",
      kodeGuru: inputKodeGuru.trim().toUpperCase() || `AR-${Math.floor(10 + Math.random() * 89)}`
    };

    const result = await upsertTeacherProfile(dataPayload);
    if (!result.success) {
      triggerToast("error", `Gagal menyimpan: ${result.error}`);
      return;
    }

    if (editingTeacher) {
      setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? dataPayload : t));
      triggerToast("success", `Profil ${dataPayload.nama} berhasil diperbarui!`);
    } else {
      setTeachers(prev => [dataPayload, ...prev]);
      triggerToast("success", `Profil ${dataPayload.nama} berhasil ditambahkan!`);
    }
    setIsFormOpen(false);
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (window.confirm(`Hapus profil guru "${name}"?`)) {
      const result = await deleteTeacherProfile(id);
      if (!result.success) {
        triggerToast("error", `Gagal menghapus: ${result.error}`);
        return;
      }
      setTeachers(prev => prev.filter(t => t.id !== id));
      triggerToast("success", `Profil ${name} berhasil dihapus.`);
    }
  };

  const handleResetToDefaults = async () => {
    if (window.confirm("Reset data guru ke default bawaan sekolah?")) {
      // Upsert semua default ke Supabase
      await Promise.all(DEFAULT_TEACHERS.map(t => upsertTeacherProfile(t)));
      setTeachers(DEFAULT_TEACHERS);
      triggerToast("success", "Data guru berhasil direset ke standar.");
    }
  };

  // Filtering Logic
  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      t.nama.toLowerCase().includes(q) ||
      t.jabatan.toLowerCase().includes(q) ||
      t.mataPelajaran.toLowerCase().includes(q) ||
      t.kodeGuru.toLowerCase().includes(q);

    const matchesCategory = 
      categoryFilter === 'SEMUA' || 
      t.kategori === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full bg-[#fafaf9] pb-16 animate-fade-in font-sans">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-yellow-101 via-yellow-100 to-stone-100 text-slate-800 py-12 px-4 shadow-sm text-center border-b border-yellow-250/60">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-slate-900">TENTANG SEKOLAH</h1>
          <p className="text-xs md:text-sm text-slate-600 italic mt-2">
            Mengenal Lebih Dekat SMK Ar Rosyid Campaka Putra, Visi, Misi, pimpinan, dan Prasarana Penunjang.
          </p>
        </div>
      </div>

      {/* Sub Menu Links */}
      <div className="max-w-7xl mx-auto px-4 -translate-y-4">
        <div className="bg-white rounded-2xl shadow-md p-1.5 border border-yellow-200/60 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap justify-start md:justify-center">
          <button
            onClick={() => setActiveSub("sambutan")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition shrink-0 cursor-pointer ${
              activeSub === "sambutan" ? "bg-amber-400 text-slate-950 shadow-md border border-amber-300" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Sambutan Kepala
          </button>
          <button
            onClick={() => setActiveSub("visi-misi")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition shrink-0 cursor-pointer ${
              activeSub === "visi-misi" ? "bg-amber-400 text-slate-950 shadow-md border border-amber-300" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Profil, Visi & Misi
          </button>
          <button
            onClick={() => setActiveSub("guru")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition shrink-0 cursor-pointer ${
              activeSub === "guru" ? "bg-amber-400 text-slate-950 shadow-md border border-amber-300" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Profil Guru & Staff
          </button>
          <button
            onClick={() => setActiveSub("fasilitas")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition shrink-0 cursor-pointer ${
              activeSub === "fasilitas" ? "bg-amber-400 text-slate-950 shadow-md border border-amber-300" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Fasilitas Umum
          </button>
        </div>
      </div>

      {/* Body Section */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Toast Notif */}
        {toast && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border shadow animate-fade-in ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <Check size={18} className="shrink-0" />
            <span className="text-xs font-bold">{toast.text}</span>
          </div>
        )}

        {/* Sub-Tab 1: Sambutan */}
        {activeSub === "sambutan" && (
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-orange-100/60 transition duration-300">
            <h2 className="text-xl md:text-2xl font-black text-slate-950 border-b border-orange-100 pb-4 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-orange-500 rounded-full inline-block"></span>
              Sambutan Kepala Sekolah
            </h2>

             <div className="flex flex-col md:flex-row gap-8 mt-8 items-start">
              <div className="w-full md:w-1/3 shrink-0">
                <div className="relative rounded-2xl overflow-hidden border-4 border-orange-100 shadow-md aspect-[3/4]">
                  <img
                    src={infoSambutanFoto}
                    alt={infoSambutanNama}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-white py-3 text-center text-xs font-extrabold leading-none">
                    {infoSambutanNama}
                    <span className="block text-[9px] font-medium text-slate-300 mt-1">Kepala Sekolah</span>
                  </div>
                </div>
              </div>

              <div className="text-slate-700 text-sm leading-relaxed space-y-4 whitespace-pre-line font-medium flex-grow">
                {infoSambutanIsi}
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab 2: Profil & Visi Misi */}
        {activeSub === "visi-misi" && (
          <div className="space-y-8">
            {/* Profil Sejarah */}
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-orange-100/60">
              <h2 className="text-xl md:text-2xl font-black text-slate-950 border-b border-orange-100 pb-4 flex items-center gap-2">
                <span className="w-2.5 h-6 bg-orange-500 rounded-full inline-block"></span>
                Profil Almamater
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed space-y-4 mt-6">
                <p>
                  <strong>SMK Ar Rosyid Campaka Putra</strong> didirikan sebagai bentuk kepedulian sosial keagamaan yang luhur demi memperluas akses pendidikan kejuruan berkualitas berlandaskan nilai-nilai akhlakul karimah di wilayah Campaka, Kabupaten Cianjur, Jawa Barat. 
                </p>
                <p>
                  Dengan memadukan Kurikulum Merdeka yang diselaraskan langsung dengan industri (Link and Match DUDIKA) serta lingkungan kepesantrenan moderen, kami mendidik siswa-siswi agar tangguh secara kompetensi vokasional, sekaligus berintegritas tinggi secara iman dan taqwa (IMTAK). Kurikulum kami ditekankan pada keterampilan langsung (hands-on experience) yang didukung laboratorium spesialis, program magang intensif, dan bimbingan kewirausahaan yang dinamis.
                </p>
              </div>
            </div>

            {/* Visi & Misi */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Visi */}
              <div className="md:col-span-12 lg:col-span-5 bg-gradient-to-br from-yellow-100 to-stone-100 text-slate-800 rounded-3xl p-8 shadow-md border border-yellow-250 flex flex-col justify-center">
                <h3 className="text-lg font-black tracking-wider uppercase mb-4 text-amber-900">
                  VISI UTAMA
                </h3>
                <p className="font-serif italic text-lg md:text-xl leading-relaxed text-slate-800">
                  "{infoVisi}"
                </p>
              </div>

              {/* Misi */}
              <div className="md:col-span-12 lg:col-span-7 bg-white rounded-3xl p-8 shadow-lg border border-orange-100/60">
                <h3 className="text-lg font-black tracking-tight text-slate-900 border-b border-orange-100 pb-3 mb-4">
                  MISI OPERASIONAL
                </h3>
                <ul className="space-y-3.5">
                  {infoMisi.map((misi: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 bg-orange-100 text-orange-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm">
                        {i + 1}
                      </span>
                      <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed">
                        {misi}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab 3: Profil Guru & Staff - NEW INTERACTIVE MODULE */}
        {activeSub === "guru" && (
          <div className="space-y-6">
            
            {/* Control Bar: Search & Admin toggle */}
            <div className="bg-white rounded-3xl p-5 border border-orange-100/65 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Left search */}
              <div className="relative w-full md:max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari guru berdasarkan nama, mapel, kode..."
                  className="w-full text-xs font-semibold p-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 placeholder-slate-400"
                />
                <Search size={14} className="absolute left-3.5 top-4 text-slate-400" />
              </div>

              {/* Middle filter counters */}
              <div className="flex flex-wrap items-center justify-center gap-1">
                {(['SEMUA', 'PIMPINAN', 'TKJ', 'PEMASARAN', 'UMUM'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                      categoryFilter === cat 
                        ? 'bg-slate-950 text-[#fca5a5] border-slate-950 shadow-sm'
                        : 'bg-[#fafaf9] text-slate-600 border-gray-150 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Right Admin Area Trigger */}
              <div className="flex justify-end gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => {
                    if (isAdminMode) {
                      setIsAdminMode(false);
                    } else {
                      if (!isAdminAuthenticated) {
                        setShowLoginModal(true);
                      } else {
                        setIsAdminMode(true);
                      }
                    }
                  }}
                  className={`px-3 py-2 text-xs font-extrabold rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                    isAdminMode 
                      ? 'bg-orange-50 text-orange-700 border-orange-300' 
                      : 'bg-slate-900 text-[#fdba74] border-slate-800'
                  }`}
                  title="Aktifkan mode edit/tambah data guru"
                >
                  <ShieldCheck size={14} />
                  {isAdminMode ? "KELUAR MODE ADMIN" : "MODE KELOLA GURU"}
                </button>

                {isAdminMode && (
                  <button
                    onClick={handleOpenAddForm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Plus size={14} />
                    TAMBAH GURU
                  </button>
                )}
              </div>

            </div>

            {/* Admin Info Banner */}
            {isAdminMode && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    i
                  </div>
                  <p className="text-[11px] text-orange-800 font-bold leading-relaxed">
                    <strong>Mode Pengelolaan Aktif:</strong> Anda dapat mendaftarkan guru baru, memperbarui kualifikasi, atau mengatur mapel. Data tersimpan langsung ke database Supabase.
                  </p>
                </div>
                <button 
                  onClick={handleResetToDefaults}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-black text-[10px] uppercase border tracking-wider px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Reset ke Bawaan Sekolah
                </button>
              </div>
            )}

            {/* Interactive Add or Edit Teacher Form Inline Section */}
            {isFormOpen && (
              <div className="bg-white rounded-3xl p-6 border-2 border-orange-500 shadow-xl animate-slide-up space-y-6">
                <div className="flex justify-between items-center border-b border-gray-150 pb-4">
                  <h3 className="font-black text-slate-950 text-sm md:text-base flex items-center gap-2">
                    <GraduationCap className="text-orange-500" />
                    {editingTeacher ? `EDIT PROFIL GURU: ${editingTeacher.nama.toUpperCase()}` : "TAMBAH PROFIL GURU BARU"}
                  </h3>
                  <button 
                    onClick={() => { setIsFormOpen(false); setEditingTeacher(null); }}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveTeacher} className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                  
                  {/* Nama */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider block">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      required
                      value={inputNama}
                      onChange={(e) => setInputNama(e.target.value)}
                      placeholder="Contoh: Rina Sulistiawati, S.Kom."
                      className="w-full font-semibold p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Jabatan */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider block">Jabatan / Peran Struktur</label>
                    <input
                      type="text"
                      required
                      value={inputJabatan}
                      onChange={(e) => setInputJabatan(e.target.value)}
                      placeholder="Contoh: Kepala Lab TKJ / Wali Kelas"
                      className="w-full font-semibold p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Kategori */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider block">Kategori Kelompok</label>
                    <select
                      value={inputKategori}
                      onChange={(e) => setInputKategori(e.target.value as any)}
                      className="w-full font-semibold p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    >
                      <option value="UMUM">UMUM / KEAGAMAAN</option>
                      <option value="TKJ">PRODUKTIF TKJ</option>
                      <option value="PEMASARAN">PRODUKTIF PEMASARAN</option>
                      <option value="PIMPINAN">PISIK / PIMPINAN</option>
                    </select>
                  </div>

                  {/* Mapel */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider block">Mata Pelajaran Diampu</label>
                    <input
                      type="text"
                      value={inputMataPelajaran}
                      onChange={(e) => setInputMataPelajaran(e.target.value)}
                      placeholder="Contoh: Pemrograman Jaringan / PAI"
                      className="w-full font-semibold p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Pendidikan */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider block">Akademik Terakhir & Universitas</label>
                    <input
                      type="text"
                      value={inputPendidikan}
                      onChange={(e) => setInputPendidikan(e.target.value)}
                      placeholder="Contoh: S1 Pendidikan Komputer - UPI"
                      className="w-full font-semibold p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider block">Alamat Email Kerja</label>
                    <input
                      type="email"
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder="Contoh: rina@smkarrosyidcampaka.sch.id"
                      className="w-full font-semibold p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700 font-mono"
                    />
                  </div>

                  {/* Kode Guru */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider block">Kode Guru</label>
                    <input
                      type="text"
                      value={inputKodeGuru}
                      onChange={(e) => setInputKodeGuru(e.target.value)}
                      placeholder="Contoh: TKJ-03"
                      className="w-full font-semibold p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 uppercase font-mono"
                    />
                  </div>

                  {/* Foto URL */}
                  <div className="md:col-span-9 space-y-1.5">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider block">Foto Potret</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputFoto}
                        onChange={(e) => setInputFoto(e.target.value)}
                        placeholder="URL foto atau upload file di bawah..."
                        className="flex-1 font-semibold p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono text-[11px]"
                      />
                      <label className="cursor-pointer px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black flex items-center gap-1 hover:bg-slate-700 transition shrink-0">
                        <Camera size={12} /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const { uploadWebsiteImage } = await import('../lib/services/storageService');
                            const url = await uploadWebsiteImage(file, 'teachers');
                            if (url) setInputFoto(url);
                            else {
                              const reader = new FileReader();
                              reader.onloadend = () => setInputFoto(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {inputFoto && (
                      <img src={inputFoto} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-gray-200 mt-1" />
                    )}
                  </div>

                  <div className="md:col-span-12 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => { setIsFormOpen(false); setEditingTeacher(null); }}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 font-extrabold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-orange-500 text-slate-950 font-black uppercase tracking-wider shadow hover:bg-orange-400 transition cursor-pointer"
                    >
                      Simpan Data Profil
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* List grid of teachers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.length === 0 ? (
                <div className="md:col-span-2 lg:col-span-3 text-center p-14 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-bold text-xs">
                  ⚠️ Tidak ditemukan data guru yang cocok dengan filter pencarian "{searchQuery}".
                </div>
              ) : (
                filteredTeachers.map((t) => {
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTeacher(t)}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-150/80 shadow-md hover:shadow-xl hover:border-orange-400/90 transition-all duration-300 flex flex-col justify-between group relative cursor-pointer"
                    >
                      {/* Top Accent line based on Kategori */}
                      <div className={`h-2.5 w-full ${
                        t.kategori === 'PIMPINAN' 
                          ? 'bg-gradient-to-r from-red-500 to-rose-600'
                          : t.kategori === 'TKJ'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          : t.kategori === 'PEMASARAN'
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                          : 'bg-gradient-to-r from-amber-500 to-orange-600'
                      }`} />

                      {/* Photo Header & Badges */}
                      <div className="p-6 pb-2 flex items-start gap-4">
                        
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-100 shrink-0 shadow-md">
                          <img
                            src={t.foto}
                            alt={t.nama}
                            className="w-full h-full object-cover object-top"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="flex-grow space-y-1">
                          <span className={`inline-block text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase font-mono ${
                            t.kategori === 'PIMPINAN'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : t.kategori === 'TKJ'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : t.kategori === 'PEMASARAN'
                              ? 'bg-emerald-50 text-emerald-750 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {t.kategori === 'UMUM' ? 'PENDIDIKAN UMUM' : `PRODUKTIF ${t.kategori}`}
                          </span>
                          <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-orange-600 transition leading-tight uppercase">
                            {t.nama}
                          </h3>
                        </div>

                        {/* Kode Guru dari admin — rapi, tidak terpotong */}
                        <div className="shrink-0">
                          <span className="text-slate-400 text-[8px] font-mono font-bold whitespace-nowrap">
                            {t.kodeGuru}
                          </span>
                        </div>
                      </div>

                      {/* Details Segment */}
                      <div className="p-6 pt-2 pb-6 flex-grow space-y-3.5 text-xs text-slate-600 font-medium border-b border-gray-50">
                        
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold block">Jabatan Utama:</span>
                          <strong className="text-slate-800 font-semibold text-xs leading-tight block">{t.jabatan}</strong>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold block">Spesialisasi Mapel:</span>
                          <span className="text-slate-700 flex items-center gap-1">
                            <BookOpen size={12} className="text-orange-500 text-left shrink-0" />
                            {t.mataPelajaran}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold block">Latar Kualifikasi:</span>
                          <span className="text-slate-700 flex items-center gap-1 italic text-[11px]">
                            <GraduationCap size={13} className="text-slate-400 shrink-0" />
                            {t.pendidikan}
                          </span>
                        </div>

                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold block">Kontak Surat:</span>
                          <span className="text-slate-500 font-mono text-[10px] flex items-center gap-1 select-all hover:text-orange-500 transition">
                            <Mail size={11} />
                            {t.email}
                          </span>
                        </div>
                      </div>

                      {/* Admin CRUD Action Controls Panel Footer */}
                      {isAdminMode && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="bg-slate-50 p-3.5 border-t border-gray-100 flex justify-end gap-2 animate-fade-in"
                        >
                          <button
                            onClick={() => handleOpenEditForm(t)}
                            className="bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-lg border border-gray-200 transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit size={11} className="text-slate-500" />
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id, t.nama)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-lg border border-rose-150 transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 size={11} />
                            HAPUS
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* Sub-Tab 4: Fasilitas */}
        {activeSub === "fasilitas" && (
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-orange-100/60">
            <h2 className="text-xl md:text-2xl font-black text-slate-950 border-b border-orange-100 pb-4 mb-8 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-orange-500 rounded-full inline-block"></span>
              Fasilitas & Sarana Belajar
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(fasilitasList.length > 0 ? fasilitasList : FASILITAS.map((f, i) => ({id:`fas-${i}`,name:f.name,desc:f.desc,image:f.image,sortOrder:i}))).map((fas) => (
                <div
                  key={fas.id}
                  className="bg-orange-50/20 border border-orange-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                    <img
                      src={fas.image}
                      alt={fas.name}
                      className="w-full h-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-extrabold text-[#7c2d12] text-sm md:text-base mb-2">
                      {fas.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      {fas.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Admin Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-orange-500 animate-fade-in p-8 space-y-6 text-slate-800">
              
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-orange-100">
                  <Lock size={24} className="animate-pulse" />
                </div>
                <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">Kunci Keamanan Guru</h3>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Hanya Administrator Berwenang yang diizinkan untuk mengelola atau memperbarui profil tenaga pengajar.
                </p>
              </div>

              {adminLoginError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{adminLoginError}</span>
                </div>
              )}

              <form onSubmit={handleTeacherAdminLogin} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Username Administrator</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Masukkan username..."
                    className="w-full p-3 font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Password Keamanan</label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Masukkan password..."
                      className="w-full p-3 pr-10 font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700 font-mono text-[13px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      setAdminUsername("");
                      setAdminPassword("");
                      setAdminLoginError("");
                    }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold pb-0.5 rounded-xl cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-slate-900 text-[#fdba74] hover:bg-slate-800 font-black uppercase text-xs tracking-widest py-3 rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn size={13} />
                    MASUK GURU
                  </button>
                </div>
              </form>

              <div className="bg-orange-50/40 border border-orange-100/50 rounded-2xl p-4 text-[11px] text-slate-600 font-medium space-y-1">
                <p className="font-bold text-orange-950 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-orange-600 shrink-0" />
                  Gunakan Akun Kredensial Admin Utama:
                </p>
                <div className="font-mono text-[10px] space-y-0.5 text-slate-600 bg-white/60 p-2 rounded-lg border border-orange-100/50">
                  <div>Username: <strong className="text-slate-800">admin</strong></div>
                  <div>Password: <strong className="text-slate-800">adminarrosyid</strong></div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DETAIL PROFILE GURU MODAL / LIGHTBOX */}
        {selectedTeacher && (
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans animate-fade-in" 
            onClick={() => setSelectedTeacher(null)}
          >
            <div 
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-300 animate-slide-up flex flex-col md:flex-row text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Left Side: Large Photo with Gorgeous Accent Background */}
              <div className="md:w-5/12 bg-gradient-to-br from-yellow-101 via-yellow-100 to-stone-100 relative flex flex-col items-center justify-center p-6 min-h-[260px] md:min-h-[380px] shrink-0 border-r border-yellow-150">
                <div className="absolute top-4 left-4 bg-yellow-250/80 border border-yellow-300 text-amber-905 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase font-mono">
                  KODE: {selectedTeacher.kodeGuru}
                </div>
                
                {/* Close button for Mobile inside image area */}
                <button 
                  onClick={() => setSelectedTeacher(null)}
                  className="md:hidden absolute top-4 right-4 bg-slate-950/40 text-white rounded-full p-2 hover:bg-slate-950/60 transition cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="w-40 h-40 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-white shrink-0 shadow-xl bg-yellow-50">
                  <img
                    src={selectedTeacher.foto}
                    alt={selectedTeacher.nama}
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="mt-4 text-center">
                  <span className={`inline-block text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase bg-white/95 text-slate-900 shadow-sm border ${
                    selectedTeacher.kategori === 'PIMPINAN'
                      ? 'border-red-200 text-red-700'
                      : selectedTeacher.kategori === 'TKJ'
                      ? 'border-blue-200 text-blue-700'
                      : selectedTeacher.kategori === 'PEMASARAN'
                      ? 'border-emerald-200 text-emerald-700'
                      : 'border-amber-200 text-amber-700'
                  }`}>
                    {selectedTeacher.kategori === 'UMUM' ? 'PENDIDIKAN UMUM' : `PRODUKTIF ${selectedTeacher.kategori}`}
                  </span>
                </div>
              </div>

              {/* Right Side: Detailed Profile Data */}
              <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between relative space-y-6">
                
                {/* Close button for Desktop */}
                <button 
                  onClick={() => setSelectedTeacher(null)}
                  className="hidden md:flex absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={18} />
                </button>

                {/* Header Info */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-lg md:text-xl text-slate-950 leading-tight uppercase tracking-tight">
                    {selectedTeacher.nama}
                  </h3>
                  <div className="bg-orange-50 text-orange-850 font-extrabold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-xl w-fit border border-orange-150">
                    {selectedTeacher.jabatan}
                  </div>
                </div>

                {/* Information Rows */}
                <div className="space-y-3.5 text-xs">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-slate-100 gap-1 sm:gap-4">
                    <span className="w-24 shrink-0 font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Kode Guru</span>
                    <span className="font-mono text-slate-800 font-bold bg-slate-100/80 border border-slate-200 px-2.5 py-0.5 rounded text-[11px] w-fit">
                      {selectedTeacher.kodeGuru}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-slate-100 gap-1 sm:gap-4">
                    <span className="w-24 shrink-0 font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Mata Pelajaran</span>
                    <span className="text-slate-800 font-extrabold flex items-center gap-1.5">
                      <BookOpen size={13} className="text-orange-500" />
                      {selectedTeacher.mataPelajaran}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-slate-100 gap-1 sm:gap-4">
                    <span className="w-24 shrink-0 font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Pendidikan</span>
                    <span className="text-slate-700 italic font-medium flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-slate-500" />
                      {selectedTeacher.pendidikan}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-slate-100 gap-1 sm:gap-4">
                    <span className="w-24 shrink-0 font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Email Kerja</span>
                    <span className="font-mono text-teal-800 font-bold select-all flex items-center gap-1.5">
                      <Mail size={13} className="text-teal-600" />
                      {selectedTeacher.email}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-slate-100 gap-1 sm:gap-4">
                    <span className="w-24 shrink-0 font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Status</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Tenaga Pengajar Aktif &amp; Terverifikasi
                    </span>
                  </div>

                </div>

                {/* Footer close */}
                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={() => setSelectedTeacher(null)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md"
                  >
                    Tutup Profil Detail
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
