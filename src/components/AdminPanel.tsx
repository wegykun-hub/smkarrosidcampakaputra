import React, { useState, useEffect, useCallback } from "react";
import { RegistrationData, AttendanceRecord, EnrolledStudent, NewsItem, GalleryItem, DashboardSlide, GeneralSettings, ELearningStudentAccount, ELearningTeacherAccount, AdminAccount } from "../types";
import { TeacherProfile } from "./TentangSekolah";
import ModalNotif, { useNotif } from "./ModalNotif";
import * as XLSX from "xlsx";
import { 
  Users, Trash2, Search, FileText, Download, CheckSquare, 
  ArrowLeft, CheckCircle, Clock, AlertCircle, RefreshCw, X,
  Lock, LogIn, LogOut, Eye, EyeOff, ShieldCheck, Settings,
  GraduationCap, Plus, Edit, Printer, Calendar, Filter, Check, ClipboardList, Info, Image as ImageIcon, Sparkles, Upload, Award, Menu, Loader2, Building, BookOpen
} from "lucide-react";
import {
  loginAdmin,
  createAdminAccount,
  fetchAdminAccounts,
  changeAdminPassword,
  setAdminActiveStatus,
} from "../lib/services/adminAuthService";
import type { AdminAccount as SupabaseAdminAccount } from "../lib/services/adminAuthService";
import {
  fetchAllRegistrations,
  deleteRegistration,
  updateRegistrationStatus,
} from "../lib/services/spmbService";
import {
  fetchStudentAttendance, deleteStudentAttendance, clearAllStudentAttendance,
  fetchTeacherAttendance, deleteTeacherAttendance, clearAllTeacherAttendance,
  type StudentAttendance, type TeacherAttendance,
} from "../lib/services/attendanceService";
import {
  fetchStudents, insertStudent, updateStudent, deleteStudent,
  fetchTeachers, insertTeacher, updateTeacher, deleteTeacher,
} from "../lib/services/rosterService";
import {
  fetchNews, upsertNews, deleteNews, replaceAllNews,
  fetchGallery, upsertGallery, deleteGallery, replaceAllGallery,
  fetchSlides, replaceAllSlides,
  fetchGeneralSettings, saveGeneralSettingsToDb,
  upsertTeacherProfile, deleteTeacherProfile, fetchTeacherProfiles,
  fetchFasilitas, upsertFasilitas, deleteFasilitas,
} from "../lib/services/contentService";
import type { FasilitasItem } from "../types";
import {
  fetchELStudents, upsertELStudent, deleteELStudent, replaceAllELStudents,
  fetchELTeachers, upsertELTeacher, deleteELTeacher,
  fetchSubmissions, fetchCourses, upsertCourse,
  type ELCourse,
} from "../lib/services/elearningService";
import { uploadWebsiteImage, uploadWebsiteImageFromDataUrl } from "../lib/services/storageService";



interface AdminPanelProps {
  onClose: () => void;
  newsList: NewsItem[];
  setNewsList: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  galleryList: GalleryItem[];
  setGalleryList: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  slidesList: DashboardSlide[];
  setSlidesList: React.Dispatch<React.SetStateAction<DashboardSlide[]>>;
  settings: GeneralSettings;
  setSettings: React.Dispatch<React.SetStateAction<GeneralSettings>>;
}

export default function AdminPanel({ onClose, newsList = [], setNewsList, galleryList = [], setGalleryList, slidesList = [], setSlidesList, settings, setSettings }: AdminPanelProps) {
  // Modal notifikasi profesional
  const { notif, closeNotif, notifSuccess, notifError, notifWarning, notifConfirm } = useNotif();

  const resizeAndCompressImage = (file: File, maxWidth = 1200, maxHeight = 800, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          const fileType = file.type || "";
          const isTransparent = fileType.includes("png") || fileType.includes("webp") || fileType.includes("gif") || fileType.includes("svg") || file.name.toLowerCase().endsWith(".png");
          
          const compressedBase64 = isTransparent
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<RegistrationData | null>(null);
  
  // Custom status maps stored in LocalStorage
  const [statusMap, setStatusMap] = useState<Record<string, 'DITERIMA' | 'PENDING' | 'CADANGAN'>>({});

  // Tab State
  // spmb: Pendaftaran Baru candidates
  // siswa_aktif: Siswa Kelas X, XI, XII
  // guru_staff: Guru & Staff
  // absensi_logs: Hasil Presensi / Absensi logs
  // kelola_berita: Management section for news articles
  // kelola_galeri: Management section for activity photos
  // kelola_slides: Management section for background slide imagery
  // pengaturan_umum: General dynamic configurations
  const [activeTab, setActiveTab] = useState<'spmb' | 'siswa_aktif' | 'guru_staff' | 'absensi_logs' | 'rekap_nilai' | 'kelola_berita' | 'kelola_galeri' | 'kelola_slides' | 'kelola_fasilitas' | 'kelola_mapel' | 'pengaturan_umum' | 'akun_elearning' | 'kelola_admin'>('spmb');
  const [adminAccounts, setAdminAccounts] = useState<SupabaseAdminAccount[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<SupabaseAdminAccount | null>(null);
  
  // States for Admin Account CRUD
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [selectedAdminItem, setSelectedAdminItem] = useState<SupabaseAdminAccount | null>(null);
  const [adminForm, setAdminForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "ADMIN_STAF" as 'SUPER_ADMIN' | 'ADMIN_STAF'
  });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCompact, setSidebarCompact] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCompact(true);
      } else {
        setSidebarCompact(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Enrolled Students States (Kelas X, XI, XII)
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterKelas, setStudentFilterKelas] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [studentFilterJurusan, setStudentFilterJurusan] = useState<'ALL' | 'TKJ' | 'PEMASARAN' | 'UMUM'>('ALL');
  const [selectedStudentItem, setSelectedStudentItem] = useState<EnrolledStudent | null>(null);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState<Partial<EnrolledStudent>>({
    nisn: "", nama: "", kelas: "X", jurusan: "TKJ", jenisKelamin: "L", alamat: "", telepon: "", status: "AKTIF"
  });

  // News States
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [isEditingNews, setIsEditingNews] = useState(false);
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [newsForm, setNewsForm] = useState<Partial<NewsItem>>({
    title: "", excerpt: "", content: "", date: "", category: "Akademik", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800"
  });
  const [newsSearch, setNewsSearch] = useState("");

  // Gallery States
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [isEditingGallery, setIsEditingGallery] = useState(false);
  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const [galleryForm, setGalleryForm] = useState<Partial<GalleryItem>>({
    title: "", description: "", image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800", category: "Praktik"
  });
  const [gallerySearch, setGallerySearch] = useState("");

  // Slides States
  const [selectedSlideItem, setSelectedSlideItem] = useState<DashboardSlide | null>(null);
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [slideForm, setSlideForm] = useState<Partial<DashboardSlide>>({
    title: "", subtitle: "", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600", actionText: "", actionSub: ""
  });
  const [slideSearch, setSlideSearch] = useState("");

  // E-Learning Accounts States
  const [eleSiswa, setEleSiswa] = useState<ELearningStudentAccount[]>([]);
  const [eleGuru, setEleGuru] = useState<ELearningTeacherAccount[]>([]);
  const [eleSiswaSearch, setEleSiswaSearch] = useState("");
  const [eleGuruSearch, setEleGuruSearch] = useState("");
  const [eleView, setEleView] = useState<'siswa' | 'guru'>('siswa');

  const [isAddingEleSiswa, setIsAddingEleSiswa] = useState(false);
  const [isEditingEleSiswa, setIsEditingEleSiswa] = useState(false);
  const [selectedEleSiswa, setSelectedEleSiswa] = useState<ELearningStudentAccount | null>(null);
  const [eleSiswaForm, setEleSiswaForm] = useState<Partial<ELearningStudentAccount>>({
    nisn: "", name: "", kelas: "X", jurusan: "TKJ", status: "AKTIF"
  });

  const [isAddingEleGuru, setIsAddingEleGuru] = useState(false);
  const [isEditingEleGuru, setIsEditingEleGuru] = useState(false);
  const [selectedEleGuru, setSelectedEleGuru] = useState<ELearningTeacherAccount | null>(null);
  const [eleGuruForm, setEleGuruForm] = useState<Partial<ELearningTeacherAccount>>({
    nip: "", name: "", mataPelajaran: "", pin: "", status: "AKTIF"
  });

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title || !slideForm.image) {
      notifError("Form Tidak Lengkap", "Judul slide dan URL Gambar wajib diisi!");
      return;
    }
    let updated: DashboardSlide[];
    if (isEditingSlide && selectedSlideItem) {
      updated = slidesList.map(item => item.id === selectedSlideItem.id ? {
        ...item,
        title: slideForm.title || "",
        subtitle: slideForm.subtitle || "",
        image: slideForm.image || "",
        actionText: slideForm.actionText || "",
        actionSub: slideForm.actionSub || "",
      } : item);
      setSlidesList(updated);
      await replaceAllSlides(updated);
      notifSuccess("Slide Diperbarui", "Slide beranda berhasil diperbarui!");
      setIsEditingSlide(false);
      setSelectedSlideItem(null);
    } else {
      const newSlide: DashboardSlide = {
        id: `slide-${Date.now()}`,
        title: slideForm.title || "",
        subtitle: slideForm.subtitle || "",
        image: slideForm.image || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600",
        actionText: slideForm.actionText || "Pelajari Lebih Lanjut",
        actionSub: slideForm.actionSub || "jurusan"
      };
      updated = [...slidesList, newSlide];
      setSlidesList(updated);
      await replaceAllSlides(updated);
      notifSuccess("Slide Ditambahkan", "Slide baru berhasil ditambahkan!");
      setIsAddingSlide(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (slidesList.length <= 1) {
      notifError("Tidak Bisa Dihapus", "Minimal 1 slide harus dipertahankan!");
      return;
    }
    notifConfirm("Hapus Slide?", "Slide ini akan dihapus secara permanen.", async () => {
      const updated = slidesList.filter(item => item.id !== id);
      setSlidesList(updated);
      await replaceAllSlides(updated);
      if (selectedSlideItem?.id === id) { setSelectedSlideItem(null); setIsEditingSlide(false); }
      notifSuccess("Slide Dihapus", "Slide berhasil dihapus.");
    });
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) {
      notifError("Form Tidak Lengkap", "Judul dan Konten berita wajib diisi!");
      return;
    }
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (isEditingNews && selectedNewsItem) {
      const updatedItem: NewsItem = {
        ...selectedNewsItem,
        title: newsForm.title || "",
        excerpt: newsForm.excerpt || (newsForm.content?.slice(0, 120) + "..."),
        content: newsForm.content || "",
        category: newsForm.category || "Akademik",
        image: newsForm.image || selectedNewsItem.image,
      };
      await upsertNews(updatedItem);
      setNewsList(prev => prev.map(n => n.id === updatedItem.id ? updatedItem : n));
      notifSuccess("Berita Diperbarui", "Berita berhasil diperbarui!");
      setIsEditingNews(false); setSelectedNewsItem(null);
    } else {
      const newNews: NewsItem = {
        id: `news-${Date.now()}`,
        title: newsForm.title || "",
        excerpt: newsForm.excerpt || (newsForm.content?.slice(0, 120) + "..."),
        content: newsForm.content || "",
        date: dateStr,
        category: newsForm.category || "Akademik",
        image: newsForm.image || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800"
      };
      await upsertNews(newNews);
      setNewsList(prev => [newNews, ...prev]);
      notifSuccess("Berita Ditambahkan", "Berita baru berhasil ditambahkan!");
      setIsAddingNews(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    notifConfirm("Hapus Berita?", "Berita ini akan dihapus secara permanen.", async () => {
      await deleteNews(id);
      setNewsList(prev => prev.filter(n => n.id !== id));
      if (selectedNewsItem?.id === id) { setSelectedNewsItem(null); setIsEditingNews(false); }
      notifSuccess("Berita Dihapus", "Berita berhasil dihapus.");
    });
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.title || !galleryForm.category) {
      notifError("Form Tidak Lengkap", "Judul galeri dan Kategori wajib diisi!");
      return;
    }
    if (isEditingGallery && selectedGalleryItem) {
      const updatedItem: GalleryItem = {
        ...selectedGalleryItem,
        title: galleryForm.title || "",
        description: galleryForm.description || "",
        category: galleryForm.category || "Praktik",
        image: galleryForm.image || selectedGalleryItem.image,
      };
      await upsertGallery(updatedItem);
      setGalleryList(prev => prev.map(g => g.id === updatedItem.id ? updatedItem : g));
      notifSuccess("Galeri Diperbarui", "Foto galeri berhasil diperbarui!");
      setIsEditingGallery(false); setSelectedGalleryItem(null);
    } else {
      const newGallery: GalleryItem = {
        id: `gal-${Date.now()}`,
        title: galleryForm.title || "",
        description: galleryForm.description || "",
        image: galleryForm.image || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800",
        category: galleryForm.category || "Praktik"
      };
      await upsertGallery(newGallery);
      setGalleryList(prev => [newGallery, ...prev]);
      notifSuccess("Foto Ditambahkan", "Foto kegiatan baru berhasil ditambahkan!");
      setIsAddingGallery(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    notifConfirm("Hapus Foto Galeri?", "Foto ini akan dihapus secara permanen.", async () => {
      await deleteGallery(id);
      setGalleryList(prev => prev.filter(g => g.id !== id));
      if (selectedGalleryItem?.id === id) { setSelectedGalleryItem(null); setIsEditingGallery(false); }
      notifSuccess("Foto Dihapus", "Foto galeri berhasil dihapus.");
    });
  };

  // Teachers States
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherItem, setSelectedTeacherItem] = useState<TeacherProfile | null>(null);
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState<Partial<TeacherProfile>>({
    id: "", nama: "", jabatan: "", kategori: "UMUM", foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400", pendidikan: "", mataPelajaran: "", email: "", kodeGuru: ""
  });

  // Attendance Logs States — terpisah per tabel
  const [studentAttLogs, setStudentAttLogs] = useState<StudentAttendance[]>([]);
  const [teacherAttLogs, setTeacherAttLogs] = useState<TeacherAttendance[]>([]);
  // Combined untuk tabel tampilan (di-merge)

  // Rekap Nilai States
  const [nilaiFilterKelas, setNilaiFilterKelas] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [nilaiFilterStatus, setNilaiFilterStatus] = useState<'ALL' | 'submitted' | 'graded'>('ALL');
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);

  // Fasilitas States
  const [fasilitasList, setFasilitasList] = useState<FasilitasItem[]>([]);
  const [isAddingFasilitas, setIsAddingFasilitas] = useState(false);
  const [isEditingFasilitas, setIsEditingFasilitas] = useState(false);
  const [selectedFasilitas, setSelectedFasilitas] = useState<FasilitasItem | null>(null);
  const [fasilitasForm, setFasilitasForm] = useState<Partial<FasilitasItem>>({
    id: '', name: '', desc: '', image: '', sortOrder: 0
  });

  // Mata Pelajaran (Courses) States
  const [coursesList, setCoursesList] = useState<ELCourse[]>([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<ELCourse | null>(null);
  const [courseForm, setCourseForm] = useState<Partial<ELCourse>>({
    id: '', code: '', title: '', major: 'TKJ', grade: 'XI', teacher: '', modules: [], assignments: []
  });
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceFilterRole, setAttendanceFilterRole] = useState<'ALL' | 'SISWA' | 'GURU'>('ALL');
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState<'ALL' | 'TEPAT WAKTU' | 'TERLAMBAT' | 'PULANG'>('ALL');
  const [attendanceFilterKelas, setAttendanceFilterKelas] = useState<'ALL' | 'X' | 'XI' | 'XII' | 'GURU'>('ALL');
  const [attendanceFilterMonth, setAttendanceFilterMonth] = useState<string>("ALL");

  const getLogClass = (log: AttendanceRecord) => {
    if (log.role !== 'SISWA') return "";
    if (log.kelas) return log.kelas;
    const foundSiswa = students.find((s) => s.nisn === log.idNumber);
    return foundSiswa ? foundSiswa.kelas : "";
  };

  // Login Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ── Load semua data dari Supabase saat mount ────────────────────────────
  const loadAllData = useCallback(async () => {
    // Cek sesi login yang masih aktif (simpan di sessionStorage agar hilang saat tab ditutup)
    const savedSession = sessionStorage.getItem("ar_rosyid_admin_session");
    if (savedSession) {
      try {
        const parsed: SupabaseAdminAccount = JSON.parse(savedSession);
        setCurrentAdmin(parsed);
        setIsAuthenticated(true);
      } catch { /* ignore */ }
    }

    // Load admin accounts dari Supabase
    const admins = await fetchAdminAccounts();
    setAdminAccounts(admins);

    // Load SPMB registrations dari Supabase
    const regs = await fetchAllRegistrations();
    setRegistrations(regs);

    // Load status map dari localStorage (UI state saja)
    const savedStatus = localStorage.getItem("ar_rosyid_status_map");
    if (savedStatus) {
      try { setStatusMap(JSON.parse(savedStatus)); } catch { /* ignore */ }
    }

    // Load news, gallery, slides, settings dari Supabase
    const [newsData, galleryData, slidesData, settingsData, fasData, coursesData] = await Promise.all([
      fetchNews(),
      fetchGallery(),
      fetchSlides(),
      fetchGeneralSettings(),
      fetchFasilitas(),
      fetchCourses(),
    ]);
    setNewsList(newsData);
    setGalleryList(galleryData);
    if (slidesData.length > 0) setSlidesList(slidesData);
    setSettings(settingsData);
    setFasilitasList(fasData);
    setCoursesList(coursesData as ELCourse[]);

    // Load siswa aktif dari Supabase
    const studs = await fetchStudents();
    setStudents(studs);

    // Load guru dari Supabase — pakai teacher_profiles (punya foto, kategori, email)
    const tchs = await fetchTeacherProfiles();
    setTeachers(tchs.length > 0 ? tchs : []);

    // Load attendance logs dari tabel terpisah
    const [sLogs, tLogs, subs] = await Promise.all([
      fetchStudentAttendance(500),
      fetchTeacherAttendance(500),
      fetchSubmissions(),
    ]);
    setAllSubmissions(subs);    setStudentAttLogs(sLogs);
    setTeacherAttLogs(tLogs);
    // Gabungkan ke format AttendanceRecord untuk tampilan tabel
    const combined: AttendanceRecord[] = [
      ...sLogs.map(s => ({
        id: s.id, role: 'SISWA' as const, idNumber: s.nisn, name: s.nama,
        type: s.type, timestamp: s.timestamp, photo: s.photo,
        latitude: s.latitude, longitude: s.longitude,
        distanceInMeters: s.distanceInMeters, status: s.status, kelas: s.kelas,
      })),
      ...tLogs.map(t => ({
        id: t.id, role: 'GURU' as const, idNumber: t.kodeGuru, name: t.nama,
        type: t.type, timestamp: t.timestamp, photo: t.photo,
        latitude: t.latitude, longitude: t.longitude,
        distanceInMeters: t.distanceInMeters, status: t.status, kelas: undefined,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setAttendanceLogs(combined);

    // E-Learning accounts dari Supabase
    const elStudents = await fetchELStudents();
    setEleSiswa(elStudents.length > 0 ? elStudents : [
      { id: 'e-std-1', nisn: '0098765432', name: 'ADITYA PUTRA PRATAMA', kelas: 'XI', jurusan: 'TKJ', status: 'AKTIF' },
      { id: 'e-std-2', nisn: '0091122334', name: 'SITI NUR HALIZAH', kelas: 'XI', jurusan: 'PEMASARAN', status: 'AKTIF' },
    ]);

    const elTeachers = await fetchELTeachers();
    setEleGuru(elTeachers.length > 0 ? elTeachers : [
      { id: 'e-tch-1', nip: '19850101', name: 'Drs. Hermawan Agung', mataPelajaran: 'SAJ', pin: '', status: 'AKTIF' },
      { id: 'e-tch-2', nip: '19880202', name: 'Hj. Mutia Rahma, S.E.', mataPelajaran: 'EDA', pin: '', status: 'AKTIF' },
    ]);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Auto-refresh data saat tab berganti ke tab yang butuh data fresh
  useEffect(() => {
    if (['siswa_aktif', 'guru_staff', 'absensi_logs', 'rekap_nilai'].includes(activeTab)) {
      // Reload data spesifik per tab tanpa block UI
      if (activeTab === 'siswa_aktif') {
        fetchStudents().then(setStudents);
      } else if (activeTab === 'guru_staff') {
        fetchTeacherProfiles().then(setTeachers);
      } else if (activeTab === 'absensi_logs') {
        Promise.all([fetchStudentAttendance(500), fetchTeacherAttendance(500)]).then(([sLogs, tLogs]) => {
          setStudentAttLogs(sLogs);
          setTeacherAttLogs(tLogs);
          const combined: AttendanceRecord[] = [
            ...sLogs.map(s => ({ id: s.id, role: 'SISWA' as const, idNumber: s.nisn, name: s.nama, type: s.type, timestamp: s.timestamp, photo: s.photo, latitude: s.latitude, longitude: s.longitude, distanceInMeters: s.distanceInMeters, status: s.status, kelas: s.kelas })),
            ...tLogs.map(t => ({ id: t.id, role: 'GURU' as const, idNumber: t.kodeGuru, name: t.nama, type: t.type, timestamp: t.timestamp, photo: t.photo, latitude: t.latitude, longitude: t.longitude, distanceInMeters: t.distanceInMeters, status: t.status, kelas: undefined })),
          ];
          setAttendanceLogs(combined);
        });
      } else if (activeTab === 'rekap_nilai') {
        fetchSubmissions().then(setAllSubmissions);
      }
    }
  }, [activeTab]);

  // ── Login via Supabase ──────────────────────────────────────────────────
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const result = await loginAdmin(username.trim(), password);
      if (result.success && result.admin) {
        sessionStorage.setItem("ar_rosyid_admin_session", JSON.stringify(result.admin));
        setCurrentAdmin(result.admin);
        setIsAuthenticated(true);
        window.dispatchEvent(new Event("storage"));
      } else {
        setLoginError(result.error ?? "Login gagal. Coba lagi.");
      }
    } catch (err: any) {
      setLoginError(`Error tidak terduga: ${err?.message ?? err}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    notifConfirm(
      "Keluar dari Admin Panel?",
      "Sesi administrator akan diakhiri. Anda perlu login ulang untuk mengakses panel.",
      () => {
        sessionStorage.removeItem("ar_rosyid_admin_session");
        setIsAuthenticated(false);
        setCurrentAdmin(null);
        setUsername("");
        setPassword("");
        window.dispatchEvent(new Event("storage"));
      },
      "Ya, Keluar",
      "Batal"
    );
  };

  // State for Switch Account Modal
  const [showSessionSwitchModal, setShowSessionSwitchModal] = useState(false);
  const [switchUsername, setSwitchUsername] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState("");
  const [switchLoading, setSwitchLoading] = useState(false);

  const handleSwitchSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwitchError("");
    setSwitchLoading(true);

    const result = await loginAdmin(switchUsername.trim(), switchPassword);
    setSwitchLoading(false);

    if (result.success && result.admin) {
      sessionStorage.setItem("ar_rosyid_admin_session", JSON.stringify(result.admin));
      setCurrentAdmin(result.admin);
      setIsAuthenticated(true);
      setShowSessionSwitchModal(false);
      setSwitchUsername("");
      setSwitchPassword("");
      notifSuccess("Sesi Beralih", `Berhasil masuk sebagai ${result.admin.name} (${result.admin.role === "SUPER_ADMIN" ? "Super Admin" : "Staf Admin"})`);
      window.dispatchEvent(new Event("storage"));
    } else {
      setSwitchError(result.error ?? "Username atau password salah!");
    }
  };

  // ==========================================
  // CRUD ADMIN ACCOUNTS (via Supabase)
  // ==========================================
  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    if (!adminForm.username || !adminForm.name) {
      setAdminError("Username dan Nama wajib diisi!");
      return;
    }

    setAdminSaving(true);

    if (isEditingAdmin && selectedAdminItem) {
      // Update: ganti password hanya jika field password diisi
      if (adminForm.password && adminForm.password.trim()) {
        const result = await changeAdminPassword(selectedAdminItem.username, adminForm.password.trim());
        if (!result.success) {
          setAdminError(`Gagal update password: ${result.error}`);
          setAdminSaving(false);
          return;
        }
      }
      // Reload akun
      const updated = await fetchAdminAccounts();
      setAdminAccounts(updated);
      notifSuccess("Akun Diperbarui", `Akun "${selectedAdminItem.username}" berhasil diperbarui!${adminForm.password ? ' Password baru telah disimpan.' : ''}`);
    } else {
      // Buat akun baru — password wajib
      if (!adminForm.password || !adminForm.password.trim()) {
        setAdminError("Password wajib diisi saat membuat akun baru!");
        setAdminSaving(false);
        return;
      }
      const result = await createAdminAccount(
        adminForm.username.trim(),
        adminForm.name.trim(),
        adminForm.password.trim(),
        adminForm.role
      );
      if (!result.success) {
        setAdminError(`Gagal membuat akun: ${result.error}`);
        setAdminSaving(false);
        return;
      }
      const updated = await fetchAdminAccounts();
      setAdminAccounts(updated);
      notifSuccess("Akun Admin Dibuat", `Akun "${adminForm.username.trim().toLowerCase()}" berhasil dibuat!\nUsername: ${adminForm.username.trim().toLowerCase()}\nPassword: ${adminForm.password.trim()}`);
    }

    setAdminSaving(false);
    setIsAddingAdmin(false);
    setIsEditingAdmin(false);
    setSelectedAdminItem(null);
    setAdminForm({ username: "", name: "", password: "", role: "ADMIN_STAF" });
  };

  const handleDeleteAdmin = async (usernameToDelete: string) => {
    if (currentAdmin && currentAdmin.username.toLowerCase() === usernameToDelete.toLowerCase()) {
      notifError("Tidak Dapat Dihapus", "Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan.");
      return;
    }
    const target = adminAccounts.find(a => a.username.toLowerCase() === usernameToDelete.toLowerCase());
    if (!target?.id) return;

    notifConfirm(
      `Nonaktifkan Akun Admin?`,
      `Akun admin '${usernameToDelete}' akan dinonaktifkan dan tidak bisa login.`,
      async () => {
        await setAdminActiveStatus(target.id!, false);
        const updated = await fetchAdminAccounts();
        setAdminAccounts(updated);
        notifSuccess("Akun Dinonaktifkan", "Akun Admin berhasil dinonaktifkan!");
      },
      "Ya, Nonaktifkan",
      "Batal"
    );
  };

  const handleResetAdmins = () => {
    notifWarning("Tidak Tersedia", "Reset admin tidak tersedia di mode Supabase. Gunakan Supabase Dashboard untuk manajemen akun secara langsung.");
  };

  // ==========================================
  // CRUD ENROLLED STUDENTS (X, XI, XII)
  // ==========================================
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.nisn || !studentForm.nama) {
      notifError("Form Tidak Lengkap", "NISN dan Nama Lengkap wajib diisi!");
      return;
    }

    const cleanNisn = studentForm.nisn.trim().toUpperCase();
    const cleanNama = studentForm.nama.trim().toUpperCase();

    if (isEditingStudent && selectedStudentItem) {
      const result = await updateStudent(selectedStudentItem.nisn, {
        ...studentForm,
        nisn: cleanNisn,
        nama: cleanNama,
      });
      if (!result.success) { notifError("Gagal Update", `Gagal update: ${result.error}`); return; }
      notifSuccess("Data Diperbarui", "Profil Siswa berhasil diperbarui!");
    } else {
      if (students.some(s => s.nisn === cleanNisn)) {
        notifError("NISN Sudah Ada", "Gagal: Siswa dengan NISN ini sudah terdaftar!");
        return;
      }
      const newStudent: EnrolledStudent = {
        nisn: cleanNisn,
        nama: cleanNama,
        kelas: studentForm.kelas || 'X',
        jurusan: studentForm.jurusan || 'TKJ',
        jenisKelamin: studentForm.jenisKelamin || 'L',
        alamat: studentForm.alamat || "",
        telepon: studentForm.telepon || "",
        status: studentForm.status || 'AKTIF',
      };
      const result = await insertStudent(newStudent);
      if (!result.success) { notifError("Gagal Tambah", `Gagal tambah siswa: ${result.error}`); return; }
      notifSuccess("Siswa Ditambahkan", "Siswa baru berhasil ditambahkan ke database SMK!");
    }

    const refreshed = await fetchStudents();
    setStudents(refreshed);
    window.dispatchEvent(new Event("storage"));
    setIsAddingStudent(false);
    setIsEditingStudent(false);
    setSelectedStudentItem(null);
  };

  const handleDeleteStudent = async (nisn: string) => {
    notifConfirm(
      "Hapus Data Siswa?",
      `Siswa dengan NISN ${nisn} akan dihapus permanen dari database.`,
      async () => {
        const result = await deleteStudent(nisn);
        if (!result.success) { notifError("Gagal Hapus", `Gagal hapus: ${result.error}`); return; }
        const refreshed = await fetchStudents();
        setStudents(refreshed);
        window.dispatchEvent(new Event("storage"));
        if (selectedStudentItem?.nisn === nisn) setSelectedStudentItem(null);
        notifSuccess("Siswa Dihapus", "Data siswa berhasil dihapus dari database.");
      },
      "Ya, Hapus",
      "Batal"
    );
  };

  // ==========================================
  // CRUD TEACHERS — teacher_profiles sebagai sumber utama
  // ==========================================
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.nama || !teacherForm.kodeGuru) {
      notifError("Form Tidak Lengkap", "Nama Guru dan Kode Guru wajib diisi!");
      return;
    }

    const cleanKode = teacherForm.kodeGuru.trim().toUpperCase();
    const cleanNama = teacherForm.nama.trim().toUpperCase();

    // Cek duplikat kode (hanya saat tambah baru)
    if (!isEditingTeacher && teachers.some(t => t.kodeGuru.toUpperCase() === cleanKode)) {
      notifError("Kode Sudah Ada", `Gagal: Kode Guru "${cleanKode}" sudah terdaftar!`);
      return;
    }

    const payload: import('../types').TeacherProfile = {
      id: (isEditingTeacher && selectedTeacherItem?.id)
        ? selectedTeacherItem.id
        : `TEACH-${Date.now().toString().slice(-6)}`,
      kodeGuru: cleanKode,
      nama: cleanNama,
      jabatan: teacherForm.jabatan || "Tenaga Pengajar",
      kategori: teacherForm.kategori || 'UMUM',
      foto: teacherForm.foto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      pendidikan: teacherForm.pendidikan || "",
      mataPelajaran: teacherForm.mataPelajaran || "",
      email: teacherForm.email || "",
      nip: (teacherForm as any).nip || undefined,
    };

    // Simpan ke teacher_profiles
    const r1 = await upsertTeacherProfile(payload);
    if (!r1.success) { notifError('Gagal Menyimpan', r1.error || 'Terjadi kesalahan.'); return; }

    // Sync ke tabel teachers (absensi)
    const teacherData = {
      kodeGuru: cleanKode,
      nip: payload.nip,
      nama: cleanNama,
      jabatan: payload.jabatan,
      mataPelajaran: payload.mataPelajaran || undefined,
      status: 'AKTIF' as const,
    };
    const r2 = await insertTeacher(teacherData);
    if (!r2.success) {
      await updateTeacher(cleanKode, teacherData);
    }

    const refreshed = await fetchTeacherProfiles();
    setTeachers(refreshed);
    window.dispatchEvent(new Event("storage"));
    setIsAddingTeacher(false);
    setIsEditingTeacher(false);
    setSelectedTeacherItem(null);
    setTeacherForm({
      id: "", nama: "", jabatan: "", kategori: "UMUM",
      foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      pendidikan: "", mataPelajaran: "", email: "", kodeGuru: ""
    });

    if (isEditingTeacher) {
      notifSuccess('Profil Guru Diperbarui', `Data ${cleanNama} berhasil disimpan ke database.`);
    } else {
      notifSuccess('Guru Baru Didaftarkan', `${cleanNama} berhasil ditambahkan ke database SMK.`);
    }
  };

  const handleDeleteTeacher = async (kodeOrId: string) => {
    const target = teachers.find(t => t.kodeGuru === kodeOrId || t.id === kodeOrId);
    if (!target) { notifError('Data Tidak Ditemukan', 'Guru tidak ditemukan di database.'); return; }

    notifConfirm(
      'Hapus Guru?',
      `Apakah Anda yakin ingin menghapus "${target.nama}" dari database sekolah?\nTindakan ini tidak dapat dibatalkan.`,
      async () => {
        if (target.id) await deleteTeacherProfile(target.id);
        await deleteTeacher(target.kodeGuru);
        const refreshed = await fetchTeacherProfiles();
        setTeachers(refreshed);
        window.dispatchEvent(new Event("storage"));
        if (selectedTeacherItem?.kodeGuru === target.kodeGuru) setSelectedTeacherItem(null);
        notifSuccess('Guru Dihapus', `Data ${target.nama} berhasil dihapus dari database.`);
      },
      'Ya, Hapus',
      'Batal'
    );
  };

  // ==========================================
  // ABSENSI EXPORTS & ACTIONS (via Supabase)
  // ==========================================
  const handleDeleteLog = async (id: string) => {
    notifConfirm(
      "Hapus Catatan Kehadiran?",
      "Catatan absensi ini akan dihapus permanen dari database.",
      async () => {
        setAttendanceLogs(prev => prev.filter(l => l.id !== id));
        setStudentAttLogs(prev => prev.filter(l => l.id !== id));
        setTeacherAttLogs(prev => prev.filter(l => l.id !== id));
        await Promise.all([
          deleteStudentAttendance(id),
          deleteTeacherAttendance(id),
        ]);
        window.dispatchEvent(new Event("storage"));
        notifSuccess("Catatan Dihapus", "Catatan kehadiran berhasil dihapus.");
      },
      "Ya, Hapus",
      "Batal"
    );
  };

  const handleDownloadAttendanceCsv = () => {
    if (filteredLogs.length === 0) {
      notifWarning("Tidak Ada Data", "Tidak ada data presensi untuk diekspor!");
      return;
    }

    const headers = [
      "No", "Waktu & Tanggal", "Peran", "ID (NISN/NIP)", 
      "Nama Lengkap", "Kelas/Tingkat", "Tipe Presensi", 
      "Status Kehadiran", "Jarak Kampus (meter)"
    ];

    const dataRows = filteredLogs.map((log, index) => {
      const logClass = getLogClass(log) || (log.role === 'GURU' ? 'GURU / STAFF' : '-');
      return [
        index + 1,
        log.timestamp || "",
        log.role || "",
        log.idNumber || "",
        (log.name || "").toUpperCase(),
        logClass,
        log.type || "",
        log.status || "",
        `${log.distanceInMeters}m`
      ];
    });

    // Create Sheet
    const wsData = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-fit Column Widths based on maximum string length
    const colWidths = headers.map((headerText, colIdx) => {
      let maxLen = headerText.length;
      dataRows.forEach((row) => {
        const cellValue = row[colIdx];
        if (cellValue !== undefined && cellValue !== null) {
          const strVal = cellValue.toString();
          if (strVal.length > maxLen) {
            maxLen = strVal.length;
          }
        }
      });
      return { wch: Math.max(maxLen + 3, 10) }; // Padding +3, min width 10
    });
    ws["!cols"] = colWidths;

    // Create workbook and write
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi");
    
    // Generate buffer & download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
    const s2ab = (s: string) => {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    };
    
    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rekap_Absensi_SMK_ArRosyid_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    if (filteredLogs.length === 0) {
      notifWarning("Tidak Ada Data", "Tidak ada data presensi untuk dicetak!");
      return;
    }

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const rowsHtml = filteredLogs.map((log, index) => {
      const logClass = getLogClass(log) || (log.role === 'GURU' ? 'GURU / STAFF' : '-');
      return `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-family: monospace;">${index + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 11px;">${log.timestamp}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; font-size: 10px;">${log.role}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace; text-align: center;">${log.idNumber}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; text-transform: uppercase;">${log.name}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; font-size: 11px; text-transform: uppercase;">${logClass}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 11px;">${log.type}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase;
            ${log.status === 'TEPAT WAKTU' ? 'background-color: #d1fae5; color: #065f46;' : log.status === 'TERLAMBAT' ? 'background-color: #fee2e2; color: #991b1b;' : 'background-color: #fef3c7; color: #92400e;'};">
            ${log.status}
          </span>
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-family: monospace; font-size: 11px;">${log.distanceInMeters}m</td>
      </tr>
    `}).join("");

    const printHtml = `
      <html>
      <head>
        <title>Rekap Absensi SMK Ar Rosyid</title>
        <style>
          @media print {
            body { margin: 15mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; background-color: white; line-height: 1.4; }
          .header { display: flex; align-items: center; border-bottom: 3px double #1e293b; padding-bottom: 12px; margin-bottom: 20px; }
          .header-logo { width: 64px; height: 64px; margin-right: 16px; background-color: #f97316; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 24px; }
          .header-text { flex: 1; }
          .header-title { font-size: 16px; font-weight: 900; letter-spacing: -0.5px; margin: 0; text-transform: uppercase; color: #0f172a; }
          .header-sub { font-size: 10px; font-weight: bold; margin: 3px 0 0 0; color: #ea580c; text-transform: uppercase; letter-spacing: 1px; }
          .header-addr { font-size: 10px; color: #64748b; margin: 2px 0 0 0; }
          .report-title { text-align: center; font-size: 14px; font-weight: 900; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px; }
          th { background-color: #0f172a; color: white; border: 1px solid #475569; padding: 8px; font-weight: bold; text-transform: uppercase; font-size: 10px; }
          .footer { margin-top: 50px; display: flex; justify-content: flex-end; }
          .signature-box { text-align: center; width: 250px; }
          .signature-title { font-size: 11px; font-weight: bold; margin-bottom: 60px; }
          .signature-name { font-size: 11px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
          .signature-nip { font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-logo">AR</div>
          <div class="header-text">
            <h1 class="header-title">YAYASAN AL-HAMIDYAH AR-ROSYIDYAH</h1>
            <p class="header-sub">SMK AR ROSYID CAMPAKA PUTRA</p>
            <p class="header-addr">Kp. Golegong RT. 03 RW. 04 Desa Campaka Putra, Kec. Campaka, Kab. Cianjur - Jawa Barat, 43263</p>
          </div>
        </div>
        <div class="report-title">
          LAPORAN REKAPITULASI KEHADIRAN DIGITAL (ABSENSI)
          <div style="font-size: 9px; color: #64748b; font-weight: bold; margin-top: 3px; font-family: monospace;">
            DICETAK PADA: ${new Date().toLocaleString('id-ID')} WIB | JUMLAH DATA: ${filteredLogs.length}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">No</th>
              <th style="width: 16%;">Waktu & Tanggal</th>
              <th style="width: 10%;">Peran</th>
              <th style="width: 13%;">ID (NISN/NIP)</th>
              <th style="width: 22%;">Nama Lengkap</th>
              <th style="width: 13%;">Kelas/Tingkat</th>
              <th style="width: 8%;">Presensi</th>
              <th style="width: 9%;">Status</th>
              <th style="width: 5%;">Jarak</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          <div class="signature-box">
            <div class="signature-title">Cianjur, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Kepala Sekolah SMK Ar Rosyid,</div>
            <div class="signature-name">H. Asep Rosyadi, M.Pd.</div>
            <div class="signature-nip">NIP. 197808012005011002</div>
          </div>
        </div>
      </body>
      </html>
    `;

    doc.write(printHtml);
    doc.close();

    printFrame.onload = () => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 5000);
    };
  };

  const filteredLogs = attendanceLogs.filter((log) => {
    const q = attendanceSearch.toLowerCase();
    const matchesSearch = log.name.toLowerCase().includes(q) || log.idNumber.toLowerCase().includes(q);
    const matchesRole = attendanceFilterRole === 'ALL' || log.role === attendanceFilterRole;
    const matchesStatus = attendanceFilterStatus === 'ALL' || log.status === attendanceFilterStatus;
    
    let matchesMonth = true;
    if (attendanceFilterMonth !== 'ALL') {
      const datePart = log.timestamp.split(" ")[0];
      const parts = datePart.split(/[/|-]/);
      if (parts.length >= 2) {
        const m = parts[1].padStart(2, '0');
        matchesMonth = m === attendanceFilterMonth;
      } else {
        matchesMonth = false;
      }
    }

    let matchesKelas = true;
    if (attendanceFilterKelas !== 'ALL') {
      if (attendanceFilterKelas === 'GURU') {
        matchesKelas = log.role === 'GURU';
      } else {
        // Cek dari kolom kelas langsung, fallback ke getLogClass
        matchesKelas = log.role === 'SISWA' && (
          log.kelas === attendanceFilterKelas ||
          getLogClass(log) === attendanceFilterKelas
        );
      }
    }
    
    return matchesSearch && matchesRole && matchesStatus && matchesMonth && matchesKelas;
  });

  const saveStatus = (regId: string, status: 'DITERIMA' | 'PENDING' | 'CADANGAN') => {
    const updated = { ...statusMap, [regId]: status };
    setStatusMap(updated);
    localStorage.setItem("ar_rosyid_status_map", JSON.stringify(updated));
  };

  const handleDeleteRegistration = async (id: string) => {
    notifConfirm(
      "Hapus Data Pendaftaran?",
      `Data pendaftaran ${id} akan dihapus permanen dan tidak dapat dikembalikan.`,
      async () => {
        const result = await deleteRegistration(id);
        if (!result.success) { notifError("Gagal Hapus", `Gagal hapus: ${result.error}`); return; }
        setRegistrations(prev => prev.filter(r => r.id !== id));
        const updatedMap = { ...statusMap };
        delete updatedMap[id];
        setStatusMap(updatedMap);
        localStorage.setItem("ar_rosyid_status_map", JSON.stringify(updatedMap));
        if (selectedStudent?.id === id) setSelectedStudent(null);
        notifSuccess("Data Dihapus", "Data pendaftaran berhasil dihapus.");
      },
      "Ya, Hapus",
      "Batal"
    );
  };

  const handleDownloadCsv = () => {
    if (registrations.length === 0) {
      notifWarning("Tidak Ada Data", "Belum ada data pendaftar untuk diekspor!");
      return;
    }

    const headers = [
      "No Reg", "Nama Lengkap", "Jenis Kelamin", "NISN", "NIK", "No KK", 
      "Tempat Lahir", "Tanggal Lahir", "Agama", "Kewarganegaraan", "Alamat", 
      "RT", "RW", "Desa", "Kecamatan", "Kode Pos", "Memiliki KIP", "No KIP", 
      "Nama Ayah", "Pekerjaan Ayah", "Penghasilan Ayah", "Nama Ibu", 
      "Pekerjaan Ibu", "Penghasilan Ibu", "Status"
    ];

    const dataRows = registrations.map((r) => {
      const status = statusMap[r.id] || "PENDING";
      return [
        r.id,
        r.namaLengkap || "",
        r.jenisKelamin || "",
        r.nisn || "",
        r.nik || "",
        r.noKk || "",
        r.tempatLahir || "",
        r.tanggalLahir || "",
        r.agama || "",
        r.kewarganegaraan || "",
        r.alamat || "",
        r.rt || "",
        r.rw || "",
        r.desa || "",
        r.kecamatan || "",
        r.kodePos || "",
        r.memilikiKip || "TIDAK",
        r.noKip || "",
        r.namaAyah || "",
        r.pekerjaanAyah || "",
        r.penghasilanAyah || "",
        r.namaIbu || "",
        r.pekerjaanIbu || "",
        r.penghasilanIbu || "",
        status
      ];
    });

    // Create Sheet
    const wsData = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-fit Column Widths based on maximum string length
    const colWidths = headers.map((headerText, colIdx) => {
      let maxLen = headerText.length;
      dataRows.forEach((row) => {
        const cellValue = row[colIdx];
        if (cellValue !== undefined && cellValue !== null) {
          const strVal = cellValue.toString();
          if (strVal.length > maxLen) {
            maxLen = strVal.length;
          }
        }
      });
      return { wch: Math.max(maxLen + 3, 10) }; // Padding +3, min width 10
    });
    ws["!cols"] = colWidths;

    // Create workbook and write
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendaftar SPMB");

    // Generate buffer & download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
    const s2ab = (s: string) => {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    };

    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Data_SPMB_SMK_Ar_Rosyid_${new Date().getFullYear()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtered = registrations.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.namaLengkap.toLowerCase().includes(q) ||
      r.nisn.includes(q) ||
      r.nik.includes(q)
    );
  });

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    const matchesSearch = s.nama.toLowerCase().includes(q) || s.nisn.includes(q);
    const matchesKelas = studentFilterKelas === 'ALL' || s.kelas === studentFilterKelas;
    const matchesJurusan = studentFilterJurusan === 'ALL' || s.jurusan === studentFilterJurusan;
    return matchesSearch && matchesKelas && matchesJurusan;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-3 font-sans">
      <div className="bg-white w-full h-full md:h-[96vh] rounded-none md:rounded-3xl overflow-hidden flex flex-col shadow-2xl border-none md:border-2 border-orange-500 animate-fade-in text-slate-800 max-w-none md:max-w-[97vw]">
        
        {!isAuthenticated ? (
          <>
            {/* Header (only shown during login) */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex justify-between items-center border-b border-orange-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-slate-900">
                  <Users size={22} />
                </div>
                <div>
                  <h1 className="font-extrabold text-lg text-white">SPMB Administrator Dashboard</h1>
                  <p className="text-[10px] text-orange-400 font-bold tracking-wider uppercase font-mono">Panel Pengelolaan Calon siswa Baru</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
              <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6 animate-slide-up">
                
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-orange-100">
                    <Lock size={24} className="animate-pulse" />
                  </div>
                  <h2 className="font-black text-slate-900 text-base uppercase tracking-tight">Login Portal Admin</h2>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    Autentikasi diperlukan sebelum mengakses daftar calon siswa & mengelola data.
                  </p>
                </div>

                {loginError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  {/* Username */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Username / ID Admin</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username admin..."
                      className="w-full p-3 font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Password Keamanan</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password..."
                        className="w-full p-3 pr-10 font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700 font-mono text-[13px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-[#fdba74] font-black uppercase text-xs tracking-widest py-3.5 rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loginLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                    {loginLoading ? "MEMVERIFIKASI..." : "VERIFIKASI & MASUK"}
                  </button>
                </form>

                {/* Secure Credentials hint banner */}
                <div className="bg-orange-50/40 border border-orange-100/50 rounded-2xl p-4 text-[11px] text-slate-600 font-medium space-y-1">
                  <p className="font-bold text-orange-950 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-orange-600 shrink-0" />
                    Kredensial Default (Supabase):
                  </p>
                  <div className="font-mono text-[10px] space-y-0.5 text-slate-600 bg-white/60 p-2 rounded-lg border border-orange-100/50">
                    <div>Username: <strong className="text-slate-800">superadmin</strong></div>
                    <div>Password: <strong className="text-slate-800">admin123</strong></div>
                  </div>
                  <p className="text-[10px] text-amber-700">Segera ganti password setelah login pertama!</p>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-row h-full w-full overflow-hidden relative bg-slate-950 p-2 md:p-3.5 gap-2 md:gap-3.5 font-sans">
            {/* Backdrop for mobile when sidebar is open */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* SISI KIRI SIDEBAR (FLOATING & COLLAPSIBLE CARD) */}
            <aside className={`
              ${sidebarOpen ? (sidebarCompact ? 'w-20' : 'w-64') : 'w-0 overflow-hidden !p-0 !m-0 !border-0'}
              bg-slate-900 border border-slate-800 text-slate-100 flex flex-col justify-between p-4 shrink-0 select-none
              transition-all duration-300 ease-in-out
              fixed inset-y-0 left-0 z-50 lg:sticky lg:h-full
              rounded-2xl shadow-2xl
              ${!sidebarOpen ? 'pointer-events-none' : ''}
            `}>
              <div className="space-y-6">
                {/* Brand Header */}
                {sidebarCompact ? (
                  <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-800">
                    <button 
                      onClick={() => setSidebarCompact(false)}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shrink-0 shadow shadow-orange-500/20 cursor-pointer hover:scale-105 transition"
                      title="Klik untuk memperlebar menu"
                    >
                      <ShieldCheck size={22} className="text-slate-950" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shrink-0 shadow shadow-orange-500/20">
                        <ShieldCheck size={20} className="text-slate-950" />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-[11px] leading-tight text-white uppercase tracking-wider">Smk Ar Rosyid </h2>
                        <span className="text-[8px] text-orange-400 font-bold tracking-widest uppercase font-mono block mt-0.5">PORTAL ADMIN</span>
                      </div>
                    </div>
                    {/* Close button for mobile inside sidebar */}
                    <button 
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-350 lg:hidden transition cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Vertical Navigation Nodes (Modern Map Loops with compact tooltips) */}
                <nav className={`space-y-2 overflow-y-auto max-h-[calc(100vh-270px)] pr-1 ${sidebarCompact ? 'flex flex-col items-center' : ''}`}>
                  {[
                    {
                      id: "spmb" as const,
                      label: "Penerimaan siswa",
                      icon: Users,
                      action: () => {
                        setActiveTab('spmb');
                        setSelectedStudent(null);
                      }
                    },
                    {
                      id: "siswa_aktif" as const,
                      label: "Siswa Kelas X, XI, XII",
                      icon: GraduationCap,
                      action: () => {
                        setActiveTab('siswa_aktif');
                        setIsAddingStudent(false);
                        setIsEditingStudent(false);
                        setSelectedStudentItem(null);
                        setStudentForm({ nisn: "", nama: "", kelas: "X", jurusan: "TKJ", jenisKelamin: "L", alamat: "", telepon: "", status: "AKTIF" });
                      }
                    },
                    {
                      id: "guru_staff" as const,
                      label: "Guru & Staff Sekolah",
                      icon: Users,
                      action: () => {
                        setActiveTab('guru_staff');
                        setIsAddingTeacher(false);
                        setIsEditingTeacher(false);
                        setSelectedTeacherItem(null);
                        setTeacherForm({ id: "", nama: "", jabatan: "", kategori: "UMUM", foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400", pendidikan: "", mataPelajaran: "", email: "", kodeGuru: "" });
                      }
                    },
                    {
                      id: "absensi_logs" as const,
                      label: "Presensi Bulanan",
                      icon: ClipboardList,
                      action: () => {
                        setActiveTab('absensi_logs');
                      }
                    },
                    {
                      id: "rekap_nilai" as const,
                      label: "Rekap Nilai",
                      icon: Award,
                      action: () => {
                        setActiveTab('rekap_nilai');
                      }
                    },
                    {
                      id: "akun_elearning" as const,
                      label: "Akun E-Learning",
                      icon: Lock,
                      action: () => {
                        setActiveTab('akun_elearning');
                        setIsAddingEleSiswa(false);
                        setIsEditingEleSiswa(false);
                        setSelectedEleSiswa(null);
                        setIsAddingEleGuru(false);
                        setIsEditingEleGuru(false);
                        setSelectedEleGuru(null);
                      }
                    },
                    {
                      id: "kelola_berita" as const,
                      label: "Kelola Berita",
                      icon: FileText,
                      action: () => {
                        setActiveTab('kelola_berita');
                        setIsAddingNews(false);
                        setIsEditingNews(false);
                        setSelectedNewsItem(null);
                        setNewsForm({
                          title: "", excerpt: "", content: "", date: "", category: "Akademik", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800"
                        });
                      }
                    },
                    {
                      id: "kelola_galeri" as const,
                      label: "Kelola Galeri/Kegiatan",
                      icon: ImageIcon,
                      action: () => {
                        setActiveTab('kelola_galeri');
                        setIsAddingGallery(false);
                        setIsEditingGallery(false);
                        setSelectedGalleryItem(null);
                        setGalleryForm({
                          title: "", description: "", image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800", category: "Praktik"
                        });
                      }
                    },
                    {
                      id: "kelola_slides" as const,
                      label: "Latar Belakang Slide",
                      icon: Sparkles,
                      action: () => {
                        setActiveTab('kelola_slides');
                        setIsAddingSlide(false);
                        setIsEditingSlide(false);
                        setSelectedSlideItem(null);
                        setSlideForm({
                          title: "", subtitle: "", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600", actionText: "Daftar SPMB Online", actionSub: "formulir"
                        });
                      }
                    },
                    {
                      id: "kelola_fasilitas" as const,
                      label: "Fasilitas Sekolah",
                      icon: Building,
                      action: () => {
                        setActiveTab('kelola_fasilitas');
                        setIsAddingFasilitas(false);
                        setIsEditingFasilitas(false);
                        setSelectedFasilitas(null);
                        setFasilitasForm({ id:'', name:'', desc:'', image:'', sortOrder: 0 });
                      }
                    },
                    {
                      id: "kelola_mapel" as const,
                      label: "Mata Pelajaran",
                      icon: BookOpen,
                      action: () => {
                        setActiveTab('kelola_mapel');
                        setIsAddingCourse(false);
                        setIsEditingCourse(false);
                        setSelectedCourse(null);
                        fetchCourses().then(d => setCoursesList(d as ELCourse[]));
                      }
                    },
                    {
                      id: "pengaturan_umum" as const,
                      label: "Pengaturan Halaman",
                      icon: Settings,
                      action: () => {
                        setActiveTab('pengaturan_umum');
                      }
                    },
                    {
                      id: "kelola_admin" as const,
                      label: "Kelola Akun Admin",
                      icon: ShieldCheck,
                      action: () => {
                        setActiveTab('kelola_admin');
                        setIsAddingAdmin(false);
                        setIsEditingAdmin(false);
                        setSelectedAdminItem(null);
                        setAdminForm({ username: "", name: "", password: "", role: "ADMIN_STAF" });
                      }
                    }
                  ].map((item) => {
                    const isActive = activeTab === item.id;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className={`
                          relative group flex items-center cursor-pointer transition-all duration-200 border border-transparent 
                          ${sidebarCompact 
                            ? 'w-11 h-11 justify-center rounded-xl' 
                            : 'w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold gap-3'
                          } 
                          ${isActive 
                            ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/15 border border-amber-300' 
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                          }
                        `}
                      >
                        <IconComponent size={sidebarCompact ? 18 : 14} className={isActive ? "text-slate-950" : "text-slate-300 group-hover:text-white transition-colors"} />
                        
                        {!sidebarCompact && (
                          <span className="truncate">{item.label}</span>
                        )}

                        {/* HOVER & TOUCH TOOLTIP POPUP (Shows option names when clicked/hovered) */}
                        <div className="absolute left-16 ml-2.5 opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100 group-active:opacity-100 group-active:scale-100 transition-all duration-200 bg-slate-950 text-white text-[10px] font-black tracking-widest uppercase px-3 py-2 rounded-xl shadow-xl border border-slate-800/80 z-50 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                            <span>{item.label}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Footer Accents */}
              <div className={`space-y-1.5 pt-4 border-t border-slate-800 shrink-0 select-none ${sidebarCompact ? 'flex flex-col items-center' : ''}`}>
                
                {/* Expand/Collapse Toggle inside sidebar footer */}
                <button
                  type="button"
                  onClick={() => setSidebarCompact(!sidebarCompact)}
                  className={`relative group flex items-center cursor-pointer transition-all duration-250 text-slate-400 hover:text-white hover:bg-slate-800/35 border border-transparent ${
                    sidebarCompact ? 'w-10 h-10 justify-center rounded-xl' : 'w-full px-3 py-2.5 rounded-xl gap-2 font-black text-[10px] uppercase tracking-wider'
                  }`}
                >
                  <Menu size={14} className="text-slate-400 shrink-0" />
                  {!sidebarCompact && <span>MAMPATKAN MENU</span>}
                  
                  <div className="absolute left-16 ml-2.5 opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-slate-950 text-white text-[10px] font-black tracking-widest uppercase px-3 py-2 rounded-xl shadow-xl border border-slate-800/80 z-50 whitespace-nowrap">
                    <span>{sidebarCompact ? "Buka Menu Penuh" : "Mampatkan Menu"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`relative group flex items-center cursor-pointer transition-all duration-250 text-rose-450 hover:bg-rose-950/40 hover:text-rose-250 border border-transparent ${
                    sidebarCompact ? 'w-10 h-10 justify-center rounded-xl' : 'w-full px-3 py-2.5 rounded-xl gap-2 font-black text-[10px] uppercase tracking-wider'
                  }`}
                >
                  <LogOut size={14} className="shrink-0 text-rose-400" />
                  {!sidebarCompact && <span>Logout</span>}
                  
                  <div className="absolute left-16 ml-2.5 opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-slate-950 text-white text-[10px] font-black tracking-widest uppercase px-3 py-2 rounded-xl shadow-xl border border-slate-800/80 z-50 whitespace-nowrap">
                    <span>Keluar Sesi Admin</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className={`relative group flex items-center cursor-pointer transition-all duration-250 text-slate-400 hover:bg-slate-800/30 hover:text-white border border-transparent ${
                    sidebarCompact ? 'w-10 h-10 justify-center rounded-xl' : 'w-full px-3 py-2.5 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-wider'
                  }`}
                >
                  <X size={14} className="shrink-0" />
                  {!sidebarCompact && <span>Tutup Portal</span>}
                  
                  <div className="absolute left-16 ml-2.5 opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-slate-950 text-white text-[10px] font-black tracking-widest uppercase px-3 py-2 rounded-xl shadow-xl border border-slate-800/80 z-50 whitespace-nowrap">
                    <span>Keluar ke Halaman Utama</span>
                  </div>
                </button>
              </div>
            </aside>

            {/* AREA UTAMA / RIGHT SCROLL BODY (FLOATING WRAP CARD DESIGN) */}
            <div className="flex-grow overflow-y-auto bg-white relative flex flex-col min-w-0 h-full rounded-2xl border border-gray-200/90 shadow-2xl" id="admin-main-container">
              
              {/* STICKY TOP HEADER */}
              <header className="sticky top-0 z-30 bg-white border-b border-gray-200/80 px-4 py-3 flex items-center justify-between shadow-xs shrink-0 select-none">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Hide/Unhide Toggle Button */}
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`p-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer border shadow-xs 
                      ${sidebarOpen 
                        ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' 
                        : 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-yellow-350'
                      }`}
                    title={sidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu"}
                  >
                    <Menu size={16} className="hover:scale-110 transition" />
                    <span className="text-[10px] sm:text-xs font-black tracking-wide">
                      {sidebarOpen ? "SEMBUNYIKAN MENU" : "TAMPILKAN MENU"}
                    </span>
                  </button>

                  {/* Compact/Full Toggle Button (only if open) */}
                  {sidebarOpen && (
                    <button
                      onClick={() => setSidebarCompact(!sidebarCompact)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-750 border border-slate-200/70 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs hidden sm:inline-flex"
                      title={sidebarCompact ? "Tampilkan Menu Penuh" : "Mampatkan Jadi Ikon Saja"}
                    >
                      <Sparkles size={13} className={sidebarCompact ? "text-slate-400" : "text-amber-500 animate-pulse"} />
                      <span className="text-[10px] sm:text-xs font-black tracking-wide uppercase">
                        {sidebarCompact ? "LEBARKAN MENU" : "MAMPATKAN MENU"}
                      </span>
                    </button>
                  )}

                  <div className="h-4 w-px bg-slate-200"></div>

                  {/* Tombol Refresh Data dari Supabase */}
                  <button
                    onClick={async () => {
                      await loadAllData();
                      // Toast singkat
                      const el = document.createElement('div');
                      el.className = 'fixed top-4 right-4 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg z-[9999] animate-fade-in';
                      el.textContent = '✓ Data berhasil diperbarui dari Supabase!';
                      document.body.appendChild(el);
                      setTimeout(() => document.body.removeChild(el), 2500);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer shrink-0"
                    title="Muat ulang semua data dari Supabase"
                  >
                    <RefreshCw size={12} className="text-emerald-600" />
                    <span className="hidden sm:inline">Refresh Data</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200"></div>

                  {/* Active Tab Indicator Badge */}
                  <span className="bg-amber-100 text-[#7c2d12] font-black text-[9px] sm:text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-xl border border-amber-300">
                    {activeTab === 'spmb' && "Pendaftar (SPMB)"}
                    {activeTab === 'siswa_aktif' && "Siswa Aktif"}
                    {activeTab === 'guru_staff' && "Guru & Staff"}
                    {activeTab === 'absensi_logs' && "Presensi Bulanan"}
                    {activeTab === 'rekap_nilai' && "Rekap Nilai Tugas"}
                    {activeTab === 'akun_elearning' && "E-Learning Akun"}
                    {activeTab === 'kelola_berita' && "Kelola Berita"}
                    {activeTab === 'kelola_fasilitas' && "Fasilitas Sekolah"}
                    {activeTab === 'kelola_mapel' && "Mata Pelajaran"}
                    {activeTab === 'kelola_galeri' && "Kelola Galeri"}
                    {activeTab === 'kelola_slides' && "Kelola Slides"}
                    {activeTab === 'pengaturan_umum' && "Pengaturan Halaman"}
                    {activeTab === 'kelola_admin' && "Kelola Akun Admin"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden lg:inline-flex items-center gap-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-wider animate-fade-in">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sesi Admin Aktif
                  </span>

                  <button
                    onClick={onClose}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-extrabold uppercase flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-100"
                  >
                    <X size={15} />
                    <span className="hidden md:inline">Keluar</span>
                  </button>
                </div>
              </header>

            {/* TAB 1: SPMB ONLINE */}
            {activeTab === 'spmb' && (
              <>
                {/* Dashboard Tools for SPMB */}
                <div className="bg-slate-50 border-b border-gray-100 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full sm:max-w-sm">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari pendaftar berdasarkan No Reg, Nama, atau NISN..."
                      className="w-full p-2.5 pl-9 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                    <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                    <button
                      onClick={async () => {
                        notifConfirm(
                          "Reset Semua Data SPMB?",
                          "⚠️ Semua data pendaftaran SPMB akan dihapus permanen. Tindakan ini tidak dapat dibatalkan!",
                          async () => {
                            await Promise.all(registrations.map(r => deleteRegistration(r.id)));
                            setRegistrations([]);
                            localStorage.setItem("ar_rosyid_status_map", JSON.stringify({}));
                            setStatusMap({});
                            notifSuccess("Data Di-reset", "Semua data pendaftar SPMB berhasil di-reset!");
                          },
                          "Ya, Hapus Semua",
                          "Batal"
                        );
                      }}
                      className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-rose-500"
                    >
                      <Trash2 size={14} />
                      RESET DATA
                    </button>

                    <button
                      onClick={handleDownloadCsv}
                      className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download size={14} />
                      EKSPOR KE EXCEL (.xlsx)
                    </button>
                    <button
                      onClick={() => {
                        if (registrations.length === 0) {
                          const demoData: RegistrationData[] = [
                            {
                              id: "REG-SMKAR-2026-0001",
                              timestamp: "11/06/2026 09:12:45",
                              namaLengkap: "ADITYA PUTRA PRATAMA",
                              jenisKelamin: "L",
                              nisn: "0098765432",
                              nik: "3203011234567890",
                              noKk: "3203019876543210",
                              tempatLahir: "Cianjur",
                              tanggalLahir: "2010-04-12",
                              noAktaLahir: "3203-LU-2010-0091",
                              agama: "Islam",
                              kewarganegaraan: "WNI",
                              alamat: "Kampung Golegong RT 03/RW 04",
                              rt: "003",
                              rw: "004",
                              desa: "Campaka Putra",
                              kecamatan: "Campaka",
                              kodePos: "43263",
                              anakKe: 2,
                              memilikiKip: "YA",
                              namaAyah: "Supriatna",
                              nikAyah: "3203011122334455",
                              tempatLahirAyah: "Cianjur",
                              tanggalLahirAyah: "1978-08-01",
                              pendidikanAyah: "SMA / SMK / MA",
                              pekerjaanAyah: "Karyawan Swasta",
                              penghasilanAyah: "Rp 2.500.000 - Rp 4.999.999",
                              namaIbu: "Siti Masitoh",
                              nikIbu: "3203015566778899",
                              tempatLahirIbu: "Cianjur",
                              tanggalLahirIbu: "1982-11-20",
                              pendidikanIbu: "SMA / SMK / MA",
                              pekerjaanIbu: "Ibu Rumah Tangga",
                              penghasilanIbu: "Kurang dari Rp 1.000.000"
                            },
                            {
                              id: "REG-SMKAR-2026-0002",
                              timestamp: "11/06/2026 10:45:12",
                              namaLengkap: "SITI NUR HALIZAH",
                              jenisKelamin: "P",
                              nisn: "0091122334",
                              nik: "3203014112233445",
                              noKk: "3203019876543210",
                              tempatLahir: "Cianjur",
                              tanggalLahir: "2010-09-25",
                              noAktaLahir: "3203-LU-2010-1092",
                              agama: "Islam",
                              kewarganegaraan: "WNI",
                              alamat: "Jl. Campaka Indah No. 12",
                              rt: "001",
                              rw: "002",
                              desa: "Karyamukti",
                              kecamatan: "Campaka",
                              kodePos: "43263",
                              anakKe: 1,
                              memilikiKip: "TIDAK",
                              namaAyah: "Agus Junaedi",
                              nikAyah: "3203012233445566",
                              tempatLahirAyah: "Tasikmalaya",
                              tanggalLahirAyah: "1975-01-15",
                              pendidikanAyah: "D1 / D2 / D3",
                              pekerjaanAyah: "Wiraswasta / Pedagang",
                              penghasilanAyah: "Rp 5.000.000 - Rp 9.999.999",
                              namaIbu: "Euis Komariah",
                              nikIbu: "3203016677889900",
                              tempatLahirIbu: "Cianjur",
                              tanggalLahirIbu: "1980-05-18",
                              pendidikanIbu: "SMP / MTs",
                              pekerjaanIbu: "Wiraswasta / Pedagang",
                              penghasilanIbu: "Rp 1.000.000 - Rp 2.499.999"
                            }
                          ];
                          setRegistrations(demoData);
                          notifSuccess("Demo Dimuat", "Berhasil mengisi demo pendaftar baru.");
                        }
                      }}
                      className="bg-slate-900 text-amber-400 text-[11px] font-black tracking-wider px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      Demo SPMB
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Left Column: Candidates list */}
                  <div className="w-full md:w-1/2 border-r border-gray-100 overflow-y-auto p-4 space-y-3">
                    <h3 className="font-extrabold text-xs text-slate-400 tracking-wider uppercase mb-1 flex justify-between">
                      <span>Daftar Pendaftar Berkas ({filtered.length})</span>
                      <span>Klik untuk detail</span>
                    </h3>

                    {filtered.length === 0 ? (
                      <div className="text-center p-12 text-slate-400 font-bold text-xs bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        ⚠️ Belum ada data pendaftar yang cocok.
                      </div>
                    ) : (
                      filtered.map((item) => {
                        const status = statusMap[item.id] || "PENDING";
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedStudent(item)}
                            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                              selectedStudent?.id === item.id 
                                ? "bg-orange-50/40 border-orange-400" 
                                : "bg-[#fffefe] border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-slate-900/5 text-[#7c2d12] font-mono text-[9px] px-2 py-0.5 rounded border border-orange-100">
                                  {item.id}
                                </span>
                                {item.memilikiKip === "YA" && (
                                  <span className="bg-rose-100 text-rose-700 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded">
                                    KIP {item.noKip ? `: ${item.noKip}` : ''}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-extrabold text-sm text-slate-900 mt-1 uppercase leading-tight">{item.namaLengkap}</h4>
                              <p className="text-[10px] text-slate-400 font-medium">
                                NISN: {item.nisn} | NIK: {item.nik}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded shadow-sm ${
                                status === "DITERIMA" 
                                  ? "bg-green-100 text-green-700 border border-green-200" 
                                  : status === "CADANGAN"
                                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                                  : "bg-blue-100 text-blue-700 border border-blue-200"
                              }`}>
                                {status}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRegistration(item.id);
                                }}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right Column: Detailed student */}
                  <div className="hidden md:block md:w-1/2 p-6 overflow-y-auto bg-slate-50">
                    {selectedStudent ? (
                      <div className="space-y-6">
                        {/* Status modifier */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                          <div>
                            <h4 className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Ubah Status Kelulusan</h4>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">Atur status berkas online</p>
                          </div>
                          <div className="flex gap-1">
                            {(['PENDING', 'DITERIMA', 'CADANGAN'] as const).map((st) => (
                              <button
                                key={st}
                                onClick={() => saveStatus(selectedStudent.id, st)}
                                className={`text-[9px] font-extrabold px-3 py-1.5 rounded-lg border transition ${
                                  (statusMap[selectedStudent.id] || "PENDING") === st
                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                    : "bg-white text-slate-600 border-gray-200 hover:bg-slate-50"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Complete info info */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                          <div className="border-b border-orange-100 pb-4">
                            <span className="text-orange-600 text-[10px] uppercase tracking-widest font-extrabold block">Data Pendaftar Resmi</span>
                            <h3 className="font-extrabold text-lg text-slate-900 uppercase mt-0.5">{selectedStudent.namaLengkap}</h3>
                            <div className="flex gap-2 mt-2">
                              <span className="bg-slate-100 text-slate-700 font-mono text-[9px] px-2 py-0.5 rounded font-extrabold border">No Reg: {selectedStudent.id}</span>
                              <span className="bg-orange-50 text-orange-700 text-[9px] px-2 py-0.5 rounded font-extrabold border">NISN: {selectedStudent.nisn}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">I. DATA PRIBADI SISWA</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">NIK</span>
                                <strong className="font-mono text-slate-800">{selectedStudent.nik}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">No KK</span>
                                <strong className="font-mono text-slate-800">{selectedStudent.noKk}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Tempat, Tanggal Lahir</span>
                                <strong className="text-slate-800">{selectedStudent.tempatLahir}, {selectedStudent.tanggalLahir}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Jenis Kelamin / Agama</span>
                                <strong className="text-slate-800">{selectedStudent.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'} / {selectedStudent.agama}</strong>
                              </div>
                              <div className="col-span-2">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Alamat Rumah Lengkap</span>
                                <strong className="text-slate-800 uppercase leading-snug">
                                  {selectedStudent.alamat}, RT {selectedStudent.rt}/RW {selectedStudent.rw}, DESA {selectedStudent.desa}, KECAMATAN {selectedStudent.kecamatan}, KODE POS {selectedStudent.kodePos}
                                </strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Anak Ke / Kewarganegaraan</span>
                                <strong className="text-slate-800">{selectedStudent.anakKe} / {selectedStudent.kewarganegaraan}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Memiliki Kartu KIP?</span>
                                <strong className="text-red-500 font-extrabold">{selectedStudent.memilikiKip} {selectedStudent.memilikiKip === "YA" && selectedStudent.noKip ? `[No: ${selectedStudent.noKip}]` : ''}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-4 border-t border-gray-150">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">II. DATA KANDUNG AYAH</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Nama Ayah</span>
                                <strong className="text-slate-800">{selectedStudent.namaAyah}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Pendidikan / Pekerjaan</span>
                                <strong className="text-slate-800">{selectedStudent.pendidikanAyah} / {selectedStudent.pekerjaanAyah}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Penghasilan Bulanan</span>
                                <strong className="text-slate-800 font-bold">{selectedStudent.penghasilanAyah}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-4 border-t border-gray-150">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">III. DATA KANDUNG IBU</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Nama Ibu</span>
                                <strong className="text-slate-800">{selectedStudent.namaIbu}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Pendidikan / Pekerjaan</span>
                                <strong className="text-slate-800">{selectedStudent.pendidikanIbu} / {selectedStudent.pekerjaanIbu}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Penghasilan Bulanan</span>
                                <strong className="text-slate-800 font-bold">{selectedStudent.penghasilanIbu}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-center p-12 text-slate-400 font-bold text-xs">
                        <FileText size={48} className="text-slate-300 mb-2" />
                        Silakan pilih salah satu peserta dari daftar pendaftar di samping kiri untuk menampilkan detail informasi formulir lengkapnya.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: SISWA KELAS X, XI, XII */}
            {activeTab === 'siswa_aktif' && (
              <>
                {/* Sub-tab per Kelas */}
                <div className="bg-white border-b border-gray-150 px-4 pt-3 pb-0 shrink-0">
                  <div className="flex gap-1 overflow-x-auto">
                    {([
                      { key: 'ALL', label: '📋 Semua', color: 'border-orange-500 text-orange-600 bg-orange-50' },
                      { key: 'X',   label: '🎓 Kelas X',   color: 'border-blue-500 text-blue-700 bg-blue-50' },
                      { key: 'XI',  label: '🎓 Kelas XI',  color: 'border-amber-500 text-amber-700 bg-amber-50' },
                      { key: 'XII', label: '🎓 Kelas XII', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
                    ] as const).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setStudentFilterKelas(tab.key as any)}
                        className={`px-5 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-all shrink-0 ${
                          studentFilterKelas === tab.key
                            ? tab.color
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                        {tab.key !== 'ALL' && (
                          <span className="ml-1 text-[9px] opacity-70">
                            ({students.filter(s => s.kelas === tab.key).length})
                          </span>
                        )}
                        {tab.key === 'ALL' && (
                          <span className="ml-1 text-[9px] opacity-70">({students.length})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roster Siswa Tools */}
                <div className="bg-slate-50 border-b border-gray-100 p-4 flex flex-col xl:flex-row gap-3 justify-between items-center">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:flex-1 items-center">
                    <div className="relative w-full sm:max-w-xs">
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Cari siswa berdasarkan nama / NISN..."
                        className="w-full p-2.5 pl-9 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                      <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                    </div>

                    {/* Filter Opsi Pilihan Jurusan */}
                    <div className="relative w-full sm:w-44">
                      <select
                        value={studentFilterJurusan}
                        onChange={(e) => setStudentFilterJurusan(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="ALL">💡 SEMUA JURUSAN</option>
                        <option value="TKJ">💻 TKJ (KOMPUTER)</option>
                        <option value="PEMASARAN">📈 PEMASARAN (BISNIS)</option>
                        <option value="UMUM">⚙️ UMUM / LAINNYA</option>
                      </select>
                    </div>                  </div>

                  <div className="flex gap-2 w-full xl:w-auto flex-wrap">
                    <button
                      onClick={async () => {
                        notifConfirm(
                          "Reset Semua Data Siswa?",
                          "⚠️ Semua data siswa aktif akan dihapus permanen. Tindakan ini tidak dapat dibatalkan!",
                          async () => {
                            await Promise.all(students.map(s => deleteStudent(s.nisn)));
                            setStudents([]);
                            window.dispatchEvent(new Event("storage"));
                            notifSuccess("Data Di-reset", "Semua data Siswa Aktif berhasil di-reset!");
                          },
                          "Ya, Hapus Semua",
                          "Batal"
                        );
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-rose-500 shadow-sm"
                    >
                      <Trash2 size={15} />
                      RESET DATA
                    </button>

                    <button
                      onClick={() => {
                        setIsAddingStudent(true);
                        setIsEditingStudent(false);
                        setSelectedStudentItem(null);
                        setStudentForm({
                          nisn: "", nama: "", kelas: "X", jurusan: "TKJ", jenisKelamin: "L", alamat: "", telepon: "", status: "AKTIF"
                        });
                      }}
                      className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-yellow-300 shadow-sm"
                    >
                      <Plus size={15} />
                      TAMBAH SISWA BARU
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Left List of Students */}
                  <div className="w-full md:w-1/2 border-r border-gray-100 overflow-y-auto p-4 space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-xs text-slate-400 tracking-wider uppercase">
                          Basis Data Siswa ({filteredStudents.length})
                        </h3>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                          Total: {students.length}
                        </span>
                      </div>

                      {/* Segmen Pemisah Kelas */}
                      <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-sm">
                        <button
                          onClick={() => setStudentFilterKelas('ALL')}
                          className={`flex-1 py-1.5 rounded-lg text-center text-[10px] font-black transition cursor-pointer select-none ${
                            studentFilterKelas === 'ALL'
                              ? 'bg-slate-900 text-[#fdba74]'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                          }`}
                        >
                          Semua
                        </button>
                        <button
                          onClick={() => setStudentFilterKelas('X')}
                          className={`flex-1 py-1.5 rounded-lg text-center text-[10px] font-black transition cursor-pointer select-none ${
                            studentFilterKelas === 'X'
                              ? 'bg-orange-500 text-slate-950 font-black shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                          }`}
                        >
                          Kelas X ({students.filter(s => s.kelas === 'X').length})
                        </button>
                        <button
                          onClick={() => setStudentFilterKelas('XI')}
                          className={`flex-1 py-1.5 rounded-lg text-center text-[10px] font-black transition cursor-pointer select-none ${
                            studentFilterKelas === 'XI'
                              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                          }`}
                        >
                          Kelas XI ({students.filter(s => s.kelas === 'XI').length})
                        </button>
                        <button
                          onClick={() => setStudentFilterKelas('XII')}
                          className={`flex-1 py-1.5 rounded-lg text-center text-[10px] font-black transition cursor-pointer select-none ${
                            studentFilterKelas === 'XII'
                              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                          }`}
                        >
                          Kelas XII ({students.filter(s => s.kelas === 'XII').length})
                        </button>
                      </div>
                    </div>

                    {filteredStudents.length === 0 ? (
                      <div className="text-center p-12 text-slate-400 font-bold text-xs bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        ⚠️ Tidak ada siswa yang cocok dengan kriteria filter kelas/pencarian Anda.
                      </div>
                    ) : (
                      filteredStudents.map((std) => (
                        <div
                          key={std.nisn}
                          onClick={() => {
                            setSelectedStudentItem(std);
                            setIsAddingStudent(false);
                            setIsEditingStudent(false);
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                            selectedStudentItem?.nisn === std.nisn && !isAddingStudent && !isEditingStudent
                              ? "bg-orange-50/40 border-orange-400" 
                              : "bg-[#fffefe] border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex gap-1.5 items-center flex-wrap">
                              <span className="bg-slate-900 border border-slate-800 text-[#fdba74] font-mono text-[9px] px-1.5 py-0.5 rounded">
                                NISN: {std.nisn}
                              </span>
                              <span className="bg-orange-50 text-orange-850 font-bold text-[9px] px-1.5 py-0.5 rounded uppercase font-sans">
                                Kelas {std.kelas} {std.jurusan}
                              </span>
                              <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded ${
                                std.status === 'AKTIF' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {std.status}
                              </span>
                            </div>
                            <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">{std.nama}</h4>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentItem(std);
                                setStudentForm(std);
                                setIsEditingStudent(true);
                                setIsAddingStudent(false);
                              }}
                              className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-lg transition"
                              title="Ubah Siswa"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStudent(std.nisn);
                              }}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition"
                              title="Hapus Siswa"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Right Form or Details of Student */}
                  <div className="hidden md:block md:w-1/2 p-6 overflow-y-auto bg-slate-50">
                    {isAddingStudent || isEditingStudent ? (
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-slate-900 text-sm border-b pb-2 uppercase tracking-wide flex items-center gap-1.5">
                          <GraduationCap size={16} className="text-orange-500" />
                          {isAddingStudent ? "Tambah Siswa Baru" : `Ubah Profil: ${selectedStudentItem?.nama}`}
                        </h4>

                        <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-500 uppercase block tracking-wider">NISN Siswa (10 Digit)</label>
                              <input
                                type="text"
                                maxLength={10}
                                required
                                disabled={isEditingStudent}
                                value={studentForm.nisn}
                                onChange={(e) => setStudentForm({ ...studentForm, nisn: e.target.value })}
                                placeholder="Contoh: 0098765432"
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono font-bold"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Jenis Kelamin</label>
                              <select
                                value={studentForm.jenisKelamin}
                                onChange={(e) => setStudentForm({ ...studentForm, jenisKelamin: e.target.value as 'L' | 'P' })}
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                              >
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Nama Lengkap Siswa</label>
                            <input
                              type="text"
                              required
                              value={studentForm.nama}
                              onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                              placeholder="Masukkan nama lengkap siswa..."
                              className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-bold uppercase"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Tingkat Kelas</label>
                              <select
                                value={studentForm.kelas}
                                onChange={(e) => setStudentForm({ ...studentForm, kelas: e.target.value as 'X' | 'XI' | 'XII' })}
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800 font-bold"
                              >
                                <option value="X">Kelas X</option>
                                <option value="XI">Kelas XI</option>
                                <option value="XII">Kelas XII</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Program Kejuruan</label>
                              <select
                                value={studentForm.jurusan}
                                onChange={(e) => setStudentForm({ ...studentForm, jurusan: e.target.value as 'TKJ' | 'PEMASARAN' | 'UMUM' })}
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800 font-bold"
                              >
                                <option value="TKJ">TKJ (Komputer)</option>
                                <option value="PEMASARAN">PEMASARAN (Bisnis)</option>
                                <option value="UMUM">UMUM / LAINNYA</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Status Keanggotaan</label>
                              <select
                                value={studentForm.status}
                                onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value as 'AKTIF' | 'ALUMNI' | 'MUTASI' })}
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                              >
                                <option value="AKTIF">AKTIF</option>
                                <option value="MUTASI">MUTASI</option>
                                <option value="ALUMNI">ALUMNI</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Nomor Kontak Siswa / HP WA (Opsional)</label>
                            <input
                              type="text"
                              value={studentForm.telepon}
                              onChange={(e) => setStudentForm({ ...studentForm, telepon: e.target.value })}
                              placeholder="Contoh: 0857XXXXXXXX"
                              className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Alamat Tempat Tinggal (Opsional)</label>
                            <textarea
                              value={studentForm.alamat}
                              onChange={(e) => setStudentForm({ ...studentForm, alamat: e.target.value })}
                              placeholder="Masukkan alamat tinggal saat ini..."
                              className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 h-16 resize-none"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="submit"
                              className="flex-1 bg-slate-900 border border-slate-800 text-[#fdba74] font-black uppercase py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer text-[10px] tracking-widest transition"
                            >
                              SIMPAN DATA SISWA
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingStudent(false);
                                setIsEditingStudent(false);
                                setSelectedStudentItem(null);
                              }}
                              className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold uppercase transition text-[10px]"
                            >
                              BATAL
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : selectedStudentItem ? (
                      /* Display active student profile sheet nicely */
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div className="border-b border-orange-100 pb-4 flex justify-between items-start">
                          <div>
                            <span className="text-orange-600 text-[10px] uppercase tracking-widest font-extrabold block">Profil Siswa Terdaftar Sekolah</span>
                            <h3 className="font-black text-lg text-slate-900 uppercase mt-0.5">{selectedStudentItem.nama}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">NISN: {selectedStudentItem.nisn}</p>
                          </div>
                          <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded shadow-sm ${
                            selectedStudentItem.status === "AKTIF" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {selectedStudentItem.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Kelas / Jurusan</span>
                            <strong className="text-slate-800 uppercase">KELAS {selectedStudentItem.kelas} {selectedStudentItem.jurusan}</strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Jenis Kelamin</span>
                            <strong className="text-slate-800 uppercase">{selectedStudentItem.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">No Telepon</span>
                            <strong className="text-slate-800 font-mono">{selectedStudentItem.telepon || "-"}</strong>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Alamat Domisili</span>
                            <strong className="text-slate-800 leading-normal">{selectedStudentItem.alamat || "-"}</strong>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-[11px] text-slate-600 font-semibold space-y-1">
                          <p className="text-slate-900 font-extrabold flex items-center gap-1">
                            <Info size={12} className="text-orange-500 shrink-0" /> Catatan Admin Absensi:
                          </p>
                          <p className="leading-snug">NISN ini ({selectedStudentItem.nisn}) telah terdaftar dalam sistem absensi real-time. Ketika siswa melakukan scan biometrik dan memasukkan NISN ini, nama mereka ({selectedStudentItem.nama}) akan otomatis terdeteksi dan diisi ke formulir.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-center p-12 text-slate-400 font-bold text-xs">
                        <GraduationCap size={48} className="text-slate-300 mb-2" />
                        Silakan pilih salah satu siswa dari daftar kelas di samping kiri untuk mengedit atau melihat detail informasi secara mendalam.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: GURU & STAFF */}
            {activeTab === 'guru_staff' && (
              <>
                {/* Roster Guru Tools */}
                <div className="bg-slate-50 border-b border-gray-100 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full sm:max-w-sm">
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Cari guru berdasarkan Nama atau Kode Guru / NIP..."
                      className="w-full p-2.5 pl-9 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                    <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                  </div>

                  <button
                    onClick={() => {
                      setIsAddingTeacher(true);
                      setIsEditingTeacher(false);
                      setSelectedTeacherItem(null);
                      setTeacherForm({
                        id: "", nama: "", jabatan: "", kategori: "UMUM", foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400", pendidikan: "", mataPelajaran: "", email: "", kodeGuru: ""
                      });
                    }}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={15} />
                    DAFTARKAN GURU BARU
                  </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Left List of Teachers */}
                  <div className="w-full md:w-1/2 border-r border-gray-100 overflow-y-auto p-4 space-y-3">
                    <h3 className="font-extrabold text-xs text-slate-400 tracking-wider uppercase mb-1">
                      Basis Data Guru & Staff Sekolah ({teachers.filter(t => t.nama.toLowerCase().includes(teacherSearch.toLowerCase()) || t.kodeGuru.toUpperCase().includes(teacherSearch.toUpperCase())).length})
                    </h3>

                    {teachers.filter(t => t.nama.toLowerCase().includes(teacherSearch.toLowerCase()) || t.kodeGuru.toUpperCase().includes(teacherSearch.toUpperCase())).length === 0 ? (
                      <div className="text-center p-12 text-slate-400 font-bold text-xs bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        ⚠️ Tidak ada Guru & Staff yang cocok dengan pencarian.
                      </div>
                    ) : (
                      teachers
                        .filter(t => t.nama.toLowerCase().includes(teacherSearch.toLowerCase()) || t.kodeGuru.toUpperCase().includes(teacherSearch.toUpperCase()))
                        .map((tch) => (
                          <div
                            key={tch.id}
                            onClick={() => {
                              setSelectedTeacherItem(tch);
                              setIsAddingTeacher(false);
                              setIsEditingTeacher(false);
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                              selectedTeacherItem?.id === tch.id && !isAddingTeacher && !isEditingTeacher
                                ? "bg-orange-50/40 border-orange-400" 
                                : "bg-[#fffefe] border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={(tch as any).foto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"}
                                alt="Foto"
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"; }}
                              />
                              <div className="space-y-0.5">
                                <div className="flex gap-1 items-center flex-wrap">
                                  <span className="bg-slate-900 text-[#fdba74] font-mono text-[8px] px-1.5 py-0.5 rounded">
                                    Kode: {tch.kodeGuru}
                                  </span>
                                  {(tch as any).kategori && (
                                    <span className="bg-orange-50 text-orange-850 font-bold text-[8px] px-1.5 py-0.5 rounded font-mono">
                                      {(tch as any).kategori}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-xs text-slate-900 uppercase">{tch.nama}</h4>
                                <p className="text-[10px] text-slate-500 font-medium">{tch.jabatan}{tch.mataPelajaran ? ` | MP: ${tch.mataPelajaran}` : ''}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTeacherItem(tch);
                                  setTeacherForm(tch);
                                  setIsEditingTeacher(true);
                                  setIsAddingTeacher(false);
                                }}
                                className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-lg transition"
                                title="Ubah Profil Guru"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Gunakan kodeGuru sebagai identifier utama
                                  handleDeleteTeacher(tch.kodeGuru || (tch as any).id || '');
                                }}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition"
                                title="Hapus Guru"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Right Form or Details of Teacher */}
                  <div className="hidden md:block md:w-1/2 p-6 overflow-y-auto bg-slate-50">
                    {isAddingTeacher || isEditingTeacher ? (
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-slate-900 text-sm border-b pb-2 uppercase tracking-wide flex items-center gap-1.5">
                          <Users size={16} className="text-orange-500" />
                          {isAddingTeacher ? "Daftarkan Guru Baru" : `Ubah Profil Guru: ${selectedTeacherItem?.nama}`}
                        </h4>

                        <form onSubmit={handleSaveTeacher} className="space-y-3.5 text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Kode Guru / NIP (Identitas Absen)</label>
                              <input
                                type="text"
                                required
                                disabled={isEditingTeacher}
                                value={teacherForm.kodeGuru}
                                onChange={(e) => setTeacherForm({ ...teacherForm, kodeGuru: e.target.value })}
                                placeholder="Contoh: AR-07 atau NIP..."
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono font-bold"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Kategori Program Studi</label>
                              <select
                                value={teacherForm.kategori}
                                onChange={(e) => setTeacherForm({ ...teacherForm, kategori: e.target.value as any })}
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                              >
                                <option value="UMUM">UMUM / AGAMA / OLAHRAGA</option>
                                <option value="TKJ">TEKNIK KOMPUTER JARINGAN (TKJ)</option>
                                <option value="PEMASARAN">BISNIS DARING PEMASARAN (BDP)</option>
                                <option value="PIMPINAN">PIMPINAN SEKOLAH</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Nama Lengkap & Gelar Akademis</label>
                            <input
                              type="text"
                              required
                              value={teacherForm.nama}
                              onChange={(e) => setTeacherForm({ ...teacherForm, nama: e.target.value })}
                              placeholder="Contoh: Dian Nugraha, S.E."
                              className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-slate-800"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Struktur Jabatan</label>
                              <input
                                type="text"
                                required
                                value={teacherForm.jabatan}
                                onChange={(e) => setTeacherForm({ ...teacherForm, jabatan: e.target.value })}
                                placeholder="Contoh: Kepala Lab Komputer"
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Mata Pelajaran Utama</label>
                              <input
                                type="text"
                                required
                                value={teacherForm.mataPelajaran}
                                onChange={(e) => setTeacherForm({ ...teacherForm, mataPelajaran: e.target.value })}
                                placeholder="Contoh: Jaringan Nirkabel"
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Alamat Email Resmi</label>
                            <input
                              type="email"
                              value={teacherForm.email}
                              onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                              placeholder="guru@smkarrosyidcampaka.sch.id"
                              className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 uppercase block tracking-wider">Riwayat Pendidikan Terakhir</label>
                            <input
                              type="text"
                              value={teacherForm.pendidikan}
                              onChange={(e) => setTeacherForm({ ...teacherForm, pendidikan: e.target.value })}
                              placeholder="Contoh: S1 Informatika - Universitas Pendidikan Indonesia"
                              className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <label className="font-extrabold text-slate-600 uppercase block tracking-widest text-[10px]">Foto Profil Guru (Foto Formal)</label>
                            
                            {teacherForm.foto && (
                              <div className="my-2 flex items-center gap-3">
                                <img 
                                  src={teacherForm.foto} 
                                  alt="Preview" 
                                  className="w-12 h-12 object-cover rounded-xl border border-orange-200 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-[9px] text-slate-400 font-bold leading-tight">
                                  Pratinjau Foto Profil
                                  <div className="text-slate-500 font-normal truncate max-w-xs">{teacherForm.foto.substring(0, 45)}...</div>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                              <div>
                                <label htmlFor="teacher-file-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-orange-400 bg-white p-3 rounded-xl cursor-pointer transition text-center group">
                                  <Upload size={16} className="text-slate-400 group-hover:text-orange-550 mb-1" />
                                  <span className="text-[10px] font-extrabold text-slate-700">PILIH FILE GAMBAR</span>
                                  <span className="text-[8px] text-slate-400 font-medium">PNG, JPG, JPEG (Maks 10MB)</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const url = await uploadWebsiteImage(file, 'teachers');
                                        if (url) {
                                          setTeacherForm({ ...teacherForm, foto: url });
                                        } else {
                                          resizeAndCompressImage(file, 400, 400, 0.82).then(b64 => setTeacherForm({ ...teacherForm, foto: b64 }));
                                        }
                                      }
                                    }}
                                    className="hidden"
                                    id="teacher-file-upload"
                                  />
                                </label>
                              </div>

                              <div className="flex flex-col justify-center">
                                <span className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Atau masukkan URL Gambar:</span>
                                <input
                                  type="text"
                                  value={teacherForm.foto}
                                  onChange={(e) => setTeacherForm({ ...teacherForm, foto: e.target.value })}
                                  placeholder="https://images.unsplash.com/..."
                                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono text-[9px] leading-snug font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="submit"
                              className="flex-1 bg-slate-900 border border-slate-800 text-[#fdba74] font-black uppercase py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer text-[10px] tracking-widest transition"
                            >
                              DAFTARKAN GURU
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingTeacher(false);
                                setIsEditingTeacher(false);
                                setSelectedTeacherItem(null);
                              }}
                              className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold uppercase transition text-[10px]"
                            >
                              BATAL
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : selectedTeacherItem ? (
                      /* Display active teacher profile card nicely */
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-4 border-b border-orange-100 pb-5">
                          <img
                            src={selectedTeacherItem.foto}
                            alt={selectedTeacherItem.nama}
                            className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-500 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="text-orange-600 text-[9px] uppercase tracking-widest font-black block">Tenaga Pendidik Terdaftar</span>
                            <h3 className="font-extrabold text-base text-slate-900 uppercase leading-snug">{selectedTeacherItem.nama}</h3>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">NIP / KODE: {selectedTeacherItem.kodeGuru}</p>
                            <span className="inline-block mt-1 bg-slate-900 text-white font-mono text-[8px] px-2 py-0.5 rounded">
                              {selectedTeacherItem.kategori}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Struktur Jabatan</span>
                            <strong className="text-slate-800">{selectedTeacherItem.jabatan}</strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Mata Pelajaran Diampu</span>
                            <strong className="text-slate-800">{selectedTeacherItem.mataPelajaran}</strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Alamat Email</span>
                            <strong className="text-slate-800 font-mono">{selectedTeacherItem.email || "-"}</strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Riwayat Akademik</span>
                            <strong className="text-slate-800">{selectedTeacherItem.pendidikan}</strong>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-[11px] text-slate-600 font-semibold space-y-1">
                          <p className="text-slate-905 font-extrabold flex items-center gap-1">
                            <Info size={12} className="text-orange-500 shrink-0" /> Sinkronisasi Profil:
                          </p>
                          <p className="leading-snug">Data Guru ini disinkronisasikan langsung ke tab "Profil Guru & Staff" pada halaman depan "YANG ADA DI SEKOLAH" secara real-time. Perubahan di sini langsung mengubah profil publik guru.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-center p-12 text-slate-400 font-bold text-xs">
                        <Users size={48} className="text-slate-300 mb-2" />
                        Silakan pilih salah satu Guru dari daftar staff di samping kiri untuk mengubah profil atau memantau status identitas absensinya.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* TAB 4: REKAP ABSENSI JURNAL */}
            {activeTab === 'absensi_logs' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                {/* ── Sub-tab Siswa / Guru / Per Kelas ─────────────────── */}
                <div className="bg-white border-b border-gray-150 px-4 pt-3 pb-0 shrink-0">
                  <div className="flex gap-1 overflow-x-auto">
                    <button
                      onClick={() => { setAttendanceFilterRole('ALL'); setAttendanceFilterKelas('ALL'); }}
                      className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-all shrink-0 ${
                        attendanceFilterRole === 'ALL' && attendanceFilterKelas === 'ALL'
                          ? 'border-orange-500 text-orange-600 bg-orange-50'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📋 Semua ({attendanceLogs.length})
                    </button>
                    <button
                      onClick={() => { setAttendanceFilterRole('SISWA'); setAttendanceFilterKelas('ALL'); }}
                      className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-all shrink-0 ${
                        attendanceFilterRole === 'SISWA' && attendanceFilterKelas === 'ALL'
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🎓 Siswa ({attendanceLogs.filter(l => l.role === 'SISWA').length})
                    </button>
                    {/* Sub-tab per Kelas */}
                    {(['X','XI','XII'] as const).map(k => (
                      <button
                        key={k}
                        onClick={() => { setAttendanceFilterRole('SISWA'); setAttendanceFilterKelas(k); }}
                        className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-all shrink-0 ${
                          attendanceFilterRole === 'SISWA' && attendanceFilterKelas === k
                            ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Kelas {k} ({attendanceLogs.filter(l => l.role === 'SISWA' && l.kelas === k).length})
                      </button>
                    ))}
                    <button
                      onClick={() => { setAttendanceFilterRole('GURU'); setAttendanceFilterKelas('GURU'); }}
                      className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-all shrink-0 ${
                        attendanceFilterRole === 'GURU'
                          ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👨‍🏫 Guru ({attendanceLogs.filter(l => l.role === 'GURU').length})
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white border-b border-gray-150 p-4 space-y-3.5 shrink-0 shadow-sm z-10">
                  <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch sm:items-center">
                    <div className="relative flex-1 max-w-sm">
                      <input
                        type="text"
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        placeholder="Cari absensi (Nama atau NISN/Kode)..."
                        className="w-full p-2 pl-8 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-yellow-500"
                      />
                      <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
                    </div>

                    {/* Filter selectors */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {/* Filter Role — hanya tampil saat ALL */}
                      {attendanceFilterRole === 'ALL' && (
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                          <Users size={12} className="text-slate-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">PERAN:</span>
                          <select
                            value={attendanceFilterRole}
                            onChange={(e) => setAttendanceFilterRole(e.target.value as any)}
                            className="bg-transparent font-extrabold text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">SEMUA</option>
                            <option value="SISWA">SISWA</option>
                            <option value="GURU">GURU</option>
                          </select>
                        </div>
                      )}
                      {/* Filter Bulan */}
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        <Calendar size={12} className="text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">BULAN:</span>
                        <select
                          value={attendanceFilterMonth}
                          onChange={(e) => setAttendanceFilterMonth(e.target.value)}
                          className="bg-transparent font-extrabold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">SEMUA</option>
                          <option value="01">JAN</option><option value="02">FEB</option>
                          <option value="03">MAR</option><option value="04">APR</option>
                          <option value="05">MEI</option><option value="06">JUN</option>
                          <option value="07">JUL</option><option value="08">AGU</option>
                          <option value="09">SEP</option>
                          <option value="10">OKT</option>
                          <option value="11">NOV</option>
                          <option value="12">DES</option>
                        </select>
                      </div>

                      {/* Filter Status */}
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        <Filter size={12} className="text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">STATUS:</span>
                        <select
                          value={attendanceFilterStatus}
                          onChange={(e) => setAttendanceFilterStatus(e.target.value as any)}
                          className="bg-transparent font-extrabold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">SEMUA STATUS</option>
                          <option value="TEPAT WAKTU">TEPAT WAKTU</option>
                          <option value="TERLAMBAT">TERLAMBAT</option>
                          <option value="PULANG">PULANG</option>
                        </select>
                      </div>
                    </div>

                    {/* Export & Reset Functions */}
                    <div className="flex gap-1.5 justify-end shrink-0 flex-wrap">
                      <button
                        onClick={async () => {
                          notifConfirm(
                            "Reset Semua Catatan Absensi?",
                            "⚠️ Semua data rekap absensi siswa dan guru akan dihapus permanen. Tindakan ini tidak dapat dibatalkan!",
                            async () => {
                              await Promise.all([
                                clearAllStudentAttendance(),
                                clearAllTeacherAttendance(),
                              ]);
                              setAttendanceLogs([]);
                              setStudentAttLogs([]);
                              setTeacherAttLogs([]);
                              notifSuccess("Absensi Di-reset", "Semua catatan absensi berhasil di-reset!");
                            },
                            "Ya, Hapus Semua",
                            "Batal"
                          );
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black tracking-wider uppercase px-3 py-2 rounded-xl border border-rose-500 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        title="Hapus / Reset semua riwayat absensi"
                      >
                        <Trash2 size={12} />
                        RESET DATA
                      </button>

                      <button
                        onClick={handleDownloadAttendanceCsv}
                        className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black tracking-wider uppercase px-3 py-2 rounded-xl border border-green-500 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        title="Ekspor ke spreadsheet Excel (.xlsx)"
                      >
                        <Download size={12} />
                        EKSPOR EXCEL
                      </button>

                      <button
                        onClick={handlePrintReport}
                        className="bg-slate-900 hover:bg-slate-800 text-yellow-300 text-[10px] font-black tracking-wider uppercase px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        title="Cetak/Simpan Laporan Absensi ke PDF langsung"
                      >
                        <Printer size={12} />
                        CETAK LAPORAN (PDF)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Database Table Container */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  
                  {/* TABS UNTUK MEMISAHKAN KELAS X, XI, XII */}
                  <div className="bg-white p-2 rounded-2xl border border-gray-150 flex flex-wrap gap-1.5 shadow-sm">
                    <button
                      onClick={() => setAttendanceFilterKelas('ALL')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        attendanceFilterKelas === 'ALL'
                          ? 'bg-slate-900 text-[#fdba74]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      💡 Semua Hasil ({attendanceLogs.length})
                    </button>
                    <button
                      onClick={() => setAttendanceFilterKelas('X')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        attendanceFilterKelas === 'X'
                          ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/10'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      🎓 Kelas X ({attendanceLogs.filter(l => getLogClass(l) === 'X').length})
                    </button>
                    <button
                      onClick={() => setAttendanceFilterKelas('XI')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        attendanceFilterKelas === 'XI'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      🎓 Kelas XI ({attendanceLogs.filter(l => getLogClass(l) === 'XI').length})
                    </button>
                    <button
                      onClick={() => setAttendanceFilterKelas('XII')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        attendanceFilterKelas === 'XII'
                          ? 'bg-emerald-505 text-slate-95 success bg-emerald-500 text-slate-950'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      🎓 Kelas XII ({attendanceLogs.filter(l => getLogClass(l) === 'XII').length})
                    </button>
                    <button
                      onClick={() => setAttendanceFilterKelas('GURU')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        attendanceFilterKelas === 'GURU'
                          ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/10'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      💼 Guru & Staff ({attendanceLogs.filter(l => l.role === 'GURU').length})
                    </button>
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center p-12 text-slate-400 font-bold text-xs gap-2">
                      <ClipboardList size={40} className="text-slate-300" />
                      Belum ada data riwayat presensi yang sesuai dengan kriteria filter absensi Anda saat ini atau kelas yang Anda pilih.
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-extrabold text-[10px] tracking-wider uppercase border-b border-orange-500/30">
                            <th className="p-3.5 text-center w-12">No</th>
                            <th className="p-3.5">Tanggal / Jurnal</th>
                            <th className="p-3.5 text-center">Peran</th>
                            <th className="p-3.5">ID (NISN/NIP)</th>
                            <th className="p-3.5">Nama Lengkap</th>
                            <th className="p-3.5 text-center">Kelas / Tingkat</th>
                            <th className="p-3.5 text-center">Presensi</th>
                            <th className="p-3.5 text-center">Jarak Kampus</th>
                            <th className="p-3.5 text-center">Verifikasi Foto</th>
                            <th className="p-3.5 text-center">Status</th>
                            <th className="p-3.5 text-center w-10">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[11px] font-semibold text-slate-700">
                          {filteredLogs.map((log, index) => {
                            return (
                              <tr key={log.id} className="hover:bg-amber-50/20 transition-all">
                                <td className="p-3 text-center text-slate-450 font-mono">{index + 1}</td>
                                <td className="p-3 font-medium">{log.timestamp}</td>
                                <td className="p-3 text-center">
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                                    log.role === 'SISWA' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {log.role}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-500 font-bold">{log.idNumber}</td>
                                <td className="p-3 font-black text-slate-900 uppercase">{log.name}</td>
                                <td className="p-3 text-center">
                                  {log.role === 'SISWA' ? (
                                    (() => {
                                      const logClass = getLogClass(log);
                                      if (logClass === 'X') {
                                        return <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200">KELAS X</span>;
                                      } else if (logClass === 'XI') {
                                        return <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">KELAS XI</span>;
                                      } else if (logClass === 'XII') {
                                        return <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">KELAS XII</span>;
                                      }
                                      return <span className="text-[10px] text-slate-400 font-bold">-</span>;
                                    })()
                                  ) : (
                                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">GURU / STAFF</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-lg ${
                                    log.type === 'MASUK' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                                  }`}>
                                    {log.type}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-slate-800">{log.distanceInMeters}m</td>
                                <td className="p-3 text-center">
                                  {log.photo ? (
                                    <div className="group relative inline-block">
                                      <img
                                        src={log.photo}
                                        alt="Face scan"
                                        className="w-10 h-7 rounded border object-cover mx-auto hover:scale-150 transition-transform cursor-pointer"
                                        referrerPolicy="no-referrer"
                                      />
                                      {/* Large zoom-on-hover card */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-950 p-2 rounded-xl mb-2 hidden group-hover:block z-50 shadow-2xl border border-slate-800 w-32 aspect-[4/3]">
                                        <img
                                          src={log.photo}
                                          alt="Face scan zoomed"
                                          className="w-full h-full object-cover rounded"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 font-medium text-[9px]">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded shadow-sm ${
                                    log.status === 'TEPAT WAKTU'
                                      ? 'bg-green-100 text-green-700 border border-green-200'
                                      : log.status === 'TERLAMBAT'
                                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                                  }`}>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-rose-600 hover:text-white hover:bg-rose-500 rounded-lg transition"
                                    title="Hapus Catatan Absen"
                                  >
                                    <Trash2 size={13} className="mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* TAB REKAP NILAI PER KELAS */}
            {activeTab === 'rekap_nilai' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                {/* Sub-tab per Kelas */}
                <div className="bg-white border-b border-gray-150 px-4 pt-3 pb-0 shrink-0">
                  <div className="flex gap-1 overflow-x-auto">
                    {(['ALL','X','XI','XII'] as const).map(k => (
                      <button
                        key={k}
                        onClick={() => setNilaiFilterKelas(k)}
                        className={`px-5 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-all shrink-0 ${
                          nilaiFilterKelas === k
                            ? 'border-amber-500 text-amber-700 bg-amber-50'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {k === 'ALL' ? '📋 Semua' : `🎓 Kelas ${k}`}
                        {' '}({allSubmissions.filter(s => {
                          if (k === 'ALL') return true;
                          const enr = students.find(st => st.nisn === s.studentNisn);
                          return s.kelas === k || enr?.kelas === k;
                        }).length})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter status */}
                <div className="bg-white border-b border-gray-100 p-3 shrink-0 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
                  {(['ALL','submitted','graded'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setNilaiFilterStatus(st)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition ${
                        nilaiFilterStatus === st
                          ? 'bg-slate-900 text-amber-400'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? 'SEMUA' : st === 'submitted' ? 'BELUM DINILAI' : 'SUDAH DINILAI'}
                    </button>
                  ))}
                  <span className="ml-auto text-[10px] text-slate-400 font-semibold">
                    Total: {allSubmissions.filter(s => {
                      const enr = students.find(st => st.nisn === s.studentNisn);
                      const matchKelas = nilaiFilterKelas === 'ALL' || s.kelas === nilaiFilterKelas || enr?.kelas === nilaiFilterKelas;
                      const matchStatus = nilaiFilterStatus === 'ALL' || s.status === nilaiFilterStatus;
                      return matchKelas && matchStatus;
                    }).length} tugas
                  </span>
                </div>

                {/* Tabel Nilai */}
                <div className="flex-1 overflow-auto p-4">
                  {allSubmissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                      <Award size={40} className="text-slate-300" />
                      <p className="font-bold text-sm">Belum ada data pengumpulan tugas</p>
                      <p className="text-xs text-slate-400">Tugas yang dikumpulkan siswa akan muncul di sini</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-amber-50 border-b border-amber-100">
                            <th className="p-3 font-black text-amber-900 uppercase text-[10px]">Siswa</th>
                            <th className="p-3 font-black text-amber-900 uppercase text-[10px]">Kelas</th>
                            <th className="p-3 font-black text-amber-900 uppercase text-[10px]">Mata Pelajaran</th>
                            <th className="p-3 font-black text-amber-900 uppercase text-[10px]">File</th>
                            <th className="p-3 font-black text-amber-900 uppercase text-[10px]">Nilai</th>
                            <th className="p-3 font-black text-amber-900 uppercase text-[10px]">Status</th>
                            <th className="p-3 font-black text-amber-900 uppercase text-[10px]">Dinilai Oleh</th>
                            <th className="p-3 font-black text-amber-900 uppercase text-[10px]">Tanggal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {allSubmissions
                            .filter(s => {
                              const enr = students.find(st => st.nisn === s.studentNisn);
                              const matchKelas = nilaiFilterKelas === 'ALL' || s.kelas === nilaiFilterKelas || enr?.kelas === nilaiFilterKelas;
                              const matchStatus = nilaiFilterStatus === 'ALL' || s.status === nilaiFilterStatus;
                              return matchKelas && matchStatus;
                            })
                            .map(s => {
                              const enr = students.find(st => st.nisn === s.studentNisn);
                              const kelasInfo = s.kelas || enr?.kelas || '-';
                              const jurusanInfo = enr?.jurusan || '-';
                              return (
                                <tr key={s.id} className="hover:bg-amber-50/30 transition">
                                  <td className="p-3">
                                    <div className="font-bold text-slate-900">{s.studentName}</div>
                                    <div className="text-[9px] text-slate-400 font-mono">{s.studentNisn}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`font-black text-[10px] px-2 py-0.5 rounded ${
                                      kelasInfo === 'X' ? 'bg-orange-100 text-orange-800' :
                                      kelasInfo === 'XI' ? 'bg-amber-100 text-amber-800' :
                                      kelasInfo === 'XII' ? 'bg-emerald-100 text-emerald-800' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>{kelasInfo}</span>
                                    <div className="text-[9px] text-slate-400 mt-0.5">{jurusanInfo}</div>
                                  </td>
                                  <td className="p-3 text-slate-600 font-semibold">
                                    {s.mataPelajaran || s.courseId?.split('-')[0] || '-'}
                                  </td>
                                  <td className="p-3">
                                    {s.fileBase64 ? (
                                      <button
                                        onClick={() => {
                                          if (s.fileBase64.startsWith('http')) {
                                            window.open(s.fileBase64, '_blank');
                                          } else {
                                            const a = document.createElement('a');
                                            a.href = s.fileBase64;
                                            a.download = s.fileName;
                                            a.click();
                                          }
                                        }}
                                        className="text-blue-600 hover:text-blue-800 font-semibold text-[10px] flex items-center gap-1"
                                      >
                                        <FileText size={11} /> {s.fileName}
                                      </button>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">{s.fileName || '-'}</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {s.grade !== undefined ? (
                                      <span className={`font-black text-base ${
                                        s.grade >= 80 ? 'text-emerald-600' :
                                        s.grade >= 60 ? 'text-amber-600' : 'text-rose-600'
                                      }`}>{s.grade}</span>
                                    ) : (
                                      <span className="text-slate-300 font-bold">—</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                      s.status === 'graded' || s.status === 'DINILAI'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-yellow-100 text-yellow-700 animate-pulse'
                                    }`}>
                                      {s.status === 'graded' || s.status === 'DINILAI' ? '✓ DINILAI' : 'MENUNGGU'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-500 font-semibold">
                                    {s.gradedBy || '-'}
                                  </td>
                                  <td className="p-3 text-slate-400 text-[9px]">
                                    {s.gradedAt ? new Date(s.gradedAt).toLocaleDateString('id-ID') : s.submittedAt}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: KELOLA FASILITAS SEKOLAH */}
            {activeTab === 'kelola_fasilitas' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-4 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0 shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Fasilitas & Sarana Sekolah</h3>
                    <p className="text-[11px] text-slate-400 font-semibold">Kelola daftar fasilitas yang tampil di halaman Tentang Sekolah</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingFasilitas(true);
                      setIsEditingFasilitas(false);
                      setSelectedFasilitas(null);
                      setFasilitasForm({ id: `fas-${Date.now()}`, name: '', desc: '', image: '', sortOrder: fasilitasList.length });
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus size={14} /> Tambah Fasilitas
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {/* Form tambah/edit */}
                  {(isAddingFasilitas || isEditingFasilitas) && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!fasilitasForm.name || !fasilitasForm.image) {
                          notifError("Form Tidak Lengkap", "Nama dan Gambar wajib diisi!");
                          return;
                        }
                        const item: FasilitasItem = {
                          id: fasilitasForm.id || `fas-${Date.now()}`,
                          name: fasilitasForm.name!,
                          desc: fasilitasForm.desc || '',
                          image: fasilitasForm.image!,
                          sortOrder: fasilitasForm.sortOrder ?? fasilitasList.length,
                        };
                         const r = await upsertFasilitas(item);
                         if (!r.success) { notifError("Gagal Simpan", "Gagal: " + r.error); return; }
                        const refreshed = await fetchFasilitas();
                        setFasilitasList(refreshed);
                        setIsAddingFasilitas(false);
                        setIsEditingFasilitas(false);
                        setSelectedFasilitas(null);
                        setFasilitasForm({ id:'', name:'', desc:'', image:'', sortOrder:0 });
                         notifSuccess(isEditingFasilitas ? "Fasilitas Diperbarui" : "Fasilitas Ditambahkan", isEditingFasilitas ? "Fasilitas berhasil diperbarui!" : "Fasilitas baru berhasil ditambahkan!");
                       }}
                      className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm space-y-4"
                    >
                      <h4 className="font-black text-sm text-slate-900 border-b pb-2">
                        {isEditingFasilitas ? "Edit Fasilitas" : "Tambah Fasilitas Baru"}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Nama Fasilitas *</label>
                          <input
                            type="text" required
                            value={fasilitasForm.name || ''}
                            onChange={e => setFasilitasForm({...fasilitasForm, name: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-orange-400"
                            placeholder="Laboratorium Komputer TKJ..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Urutan Tampil</label>
                          <input
                            type="number" min={0}
                            value={fasilitasForm.sortOrder ?? 0}
                            onChange={e => setFasilitasForm({...fasilitasForm, sortOrder: parseInt(e.target.value)||0})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Deskripsi</label>
                          <textarea
                            rows={2}
                            value={fasilitasForm.desc || ''}
                            onChange={e => setFasilitasForm({...fasilitasForm, desc: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-orange-400"
                            placeholder="Deskripsi singkat fasilitas..."
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Gambar *</label>
                          <div className="flex gap-2">
                            <input
                              type="text" required
                              value={fasilitasForm.image || ''}
                              onChange={e => setFasilitasForm({...fasilitasForm, image: e.target.value})}
                              className="flex-1 p-2.5 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-700 focus:outline-none focus:border-orange-400"
                              placeholder="https://... atau upload file"
                            />
                            <label className="cursor-pointer px-3 py-2 bg-slate-900 text-amber-400 rounded-xl text-[10px] font-black flex items-center gap-1 shrink-0 hover:bg-slate-700 transition">
                              <Upload size={11} /> Upload
                              <input
                                type="file" accept="image/*" className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const { uploadWebsiteImage } = await import('../lib/services/storageService');
                                  const url = await uploadWebsiteImage(file, 'gallery');
                                  if (url) setFasilitasForm({...fasilitasForm, image: url});
                                  else {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setFasilitasForm({...fasilitasForm, image: reader.result as string});
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          {fasilitasForm.image && (
                            <img src={fasilitasForm.image} alt="preview" className="h-24 rounded-xl object-cover border" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                        <button type="button" onClick={() => { setIsAddingFasilitas(false); setIsEditingFasilitas(false); }}
                          className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                          Batal
                        </button>
                        <button type="submit"
                          className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5">
                          <CheckCircle size={13} /> {isEditingFasilitas ? "Simpan Perubahan" : "Tambah Fasilitas"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Grid fasilitas */}
                  {fasilitasList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                      <Building size={40} className="text-slate-300" />
                      <p className="font-bold text-sm">Belum ada data fasilitas</p>
                      <p className="text-xs">Klik "Tambah Fasilitas" untuk menambahkan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {fasilitasList.sort((a,b) => a.sortOrder - b.sortOrder).map(fas => (
                        <div key={fas.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                          <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
                            <img src={fas.image} alt={fas.name}
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800'; }}
                            />
                          </div>
                          <div className="p-4">
                            <h4 className="font-extrabold text-[#7c2d12] text-sm mb-1">{fas.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2">{fas.desc}</p>
                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  setSelectedFasilitas(fas);
                                  setFasilitasForm({...fas});
                                  setIsEditingFasilitas(true);
                                  setIsAddingFasilitas(false);
                                }}
                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Edit size={11} /> Edit
                              </button>
                              <button
                                onClick={() => notifConfirm("Hapus Fasilitas?", `Hapus fasilitas "${fas.name}"?`, async () => {
                                  await deleteFasilitas(fas.id);
                                  const refreshed = await fetchFasilitas();
                                  setFasilitasList(refreshed);
                                  notifSuccess("Fasilitas Dihapus", "Fasilitas berhasil dihapus!");
                                })}
                                className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MATA PELAJARAN (E-LEARNING COURSES) */}
            {activeTab === 'kelola_mapel' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center shrink-0 shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <BookOpen size={16} className="text-orange-500" /> Manajemen Mata Pelajaran
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      Tambah mata pelajaran, assign guru pengampu, dan kelola kursus E-Learning
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingCourse(true);
                      setIsEditingCourse(false);
                      setSelectedCourse(null);
                      setCourseForm({
                        id: `course-${Date.now()}`, code: '', title: '', major: 'TKJ',
                        grade: 'XI', teacher: '', modules: [], assignments: []
                      });
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus size={14} /> Tambah Mata Pelajaran
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {/* Form tambah/edit */}
                  {(isAddingCourse || isEditingCourse) && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!courseForm.title || !courseForm.code || !courseForm.teacher) {
                          notifError("Form Tidak Lengkap", "Nama, Kode, dan Guru Pengampu wajib diisi!");
                          return;
                        }
                        const item: ELCourse = {
                          id: courseForm.id || `course-${Date.now()}`,
                          code: courseForm.code!,
                          title: courseForm.title!,
                          major: courseForm.major || 'TKJ',
                          grade: courseForm.grade || 'XI',
                          teacher: courseForm.teacher!,
                          modules: courseForm.modules || [],
                          assignments: courseForm.assignments || [],
                        };
                        const r = await upsertCourse(item);
                        if (!r.success) { notifError("Gagal Simpan", "Gagal: " + r.error); return; }
                        const refreshed = await fetchCourses();
                        setCoursesList(refreshed as ELCourse[]);
                        setIsAddingCourse(false);
                        setIsEditingCourse(false);
                        setSelectedCourse(null);
                        setCourseForm({ id:'', code:'', title:'', major:'TKJ', grade:'XI', teacher:'', modules:[], assignments:[] });
                        notifSuccess(isEditingCourse ? "Mata Pelajaran Diperbarui" : "Mata Pelajaran Ditambahkan", isEditingCourse ? "Mata pelajaran berhasil diperbarui!" : "Mata pelajaran baru berhasil ditambahkan!");
                      }}
                      className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm space-y-4"
                    >
                      <h4 className="font-black text-sm text-slate-900 border-b pb-2">
                        {isEditingCourse ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Kode Mapel *</label>
                          <input type="text" required
                            value={courseForm.code || ''}
                            onChange={e => setCourseForm({...courseForm, code: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold text-slate-700 focus:outline-none focus:border-orange-400"
                            placeholder="TKJ-XI-SAJ"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Nama Mata Pelajaran *</label>
                          <input type="text" required
                            value={courseForm.title || ''}
                            onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-orange-400"
                            placeholder="Sistem Administrasi Jaringan"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Jurusan</label>
                          <select value={courseForm.major || 'TKJ'}
                            onChange={e => setCourseForm({...courseForm, major: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none cursor-pointer">
                            <option value="TKJ">TKJ</option>
                            <option value="BDP">BDP / Pemasaran</option>
                            <option value="ALL">Semua Jurusan</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Kelas</label>
                          <select value={courseForm.grade || 'XI'}
                            onChange={e => setCourseForm({...courseForm, grade: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none cursor-pointer">
                            <option value="X">Kelas X</option>
                            <option value="XI">Kelas XI</option>
                            <option value="XII">Kelas XII</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Guru Pengampu *</label>
                          <select value={courseForm.teacher || ''}
                            onChange={e => setCourseForm({...courseForm, teacher: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none cursor-pointer"
                            required>
                            <option value="">-- Pilih Guru --</option>
                            {(teachers as any[]).map((t: any) => (
                              <option key={t.kodeGuru || t.id} value={t.nama}>
                                {t.nama} {t.jabatan ? `(${t.jabatan})` : ''}
                              </option>
                            ))}
                          </select>
                          <span className="text-[9px] text-slate-400 block">Atau ketik manual jika guru belum ada di daftar:</span>
                          <input type="text"
                            value={courseForm.teacher || ''}
                            onChange={e => setCourseForm({...courseForm, teacher: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none text-[10px]"
                            placeholder="Nama guru pengampu..."
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                        <button type="button" onClick={() => { setIsAddingCourse(false); setIsEditingCourse(false); }}
                          className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                          Batal
                        </button>
                        <button type="submit"
                          className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5">
                          <CheckCircle size={13} /> {isEditingCourse ? "Simpan Perubahan" : "Tambah Mata Pelajaran"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tabel daftar mata pelajaran */}
                  {coursesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                      <BookOpen size={40} className="text-slate-300" />
                      <p className="font-bold text-sm">Belum ada mata pelajaran</p>
                      <p className="text-xs">Klik "Tambah Mata Pelajaran" untuk mulai</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-orange-50 border-b border-orange-100">
                            <th className="p-3 font-black text-orange-900 uppercase text-[10px]">Kode</th>
                            <th className="p-3 font-black text-orange-900 uppercase text-[10px]">Nama Mata Pelajaran</th>
                            <th className="p-3 font-black text-orange-900 uppercase text-[10px]">Kelas</th>
                            <th className="p-3 font-black text-orange-900 uppercase text-[10px]">Jurusan</th>
                            <th className="p-3 font-black text-orange-900 uppercase text-[10px]">Guru Pengampu</th>
                            <th className="p-3 font-black text-orange-900 uppercase text-[10px]">Modul</th>
                            <th className="p-3 font-black text-orange-900 uppercase text-[10px]">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {coursesList.map(c => (
                            <tr key={c.id} className="hover:bg-orange-50/30 transition">
                              <td className="p-3 font-mono font-black text-slate-700 text-[10px]">{c.code}</td>
                              <td className="p-3 font-bold text-slate-900">{c.title}</td>
                              <td className="p-3">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                  c.grade === 'X' ? 'bg-blue-100 text-blue-800' :
                                  c.grade === 'XI' ? 'bg-amber-100 text-amber-800' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}>{c.grade}</span>
                              </td>
                              <td className="p-3 text-slate-500 font-semibold">{c.major}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                                    <GraduationCap size={11} className="text-orange-600" />
                                  </div>
                                  <span className="text-slate-700 font-semibold">{c.teacher || '-'}</span>
                                </div>
                              </td>
                              <td className="p-3 text-slate-400 text-[10px]">{c.modules?.length || 0} modul</td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setSelectedCourse(c);
                                      setCourseForm({...c});
                                      setIsEditingCourse(true);
                                      setIsAddingCourse(false);
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 rounded-lg transition cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: KELOLA BERITA & PENGUMUMAN */}
            {activeTab === 'kelola_berita' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <div className="bg-white border-b border-gray-150 p-4 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0 shadow-sm z-10">
                  <div className="relative w-full sm:max-w-sm">
                    <input
                      type="text"
                      value={newsSearch}
                      onChange={(e) => setNewsSearch(e.target.value)}
                      placeholder="Cari berita berdasarkan judul..."
                      className="w-full p-2 pl-9 pr-4 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                  
                  {!isAddingNews && !isEditingNews && (
                    <button
                      onClick={() => {
                        setNewsForm({
                          title: "",
                          excerpt: "",
                          content: "",
                          category: "Akademik",
                          image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800"
                        });
                        setIsAddingNews(true);
                      }}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus size={14} />
                      Tambah Berita Baru
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6">
                  {isAddingNews || isEditingNews ? (
                    <div className="max-w-3xl bg-white border border-orange-100 rounded-2xl p-6 shadow-md mx-auto">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                        <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                          <FileText className="text-orange-500" size={18} />
                          {isEditingNews ? "Edit Berita/Pengumuman" : "Buat Berita/Pengumuman Baru"}
                        </h3>
                        <button
                          onClick={() => {
                            setIsAddingNews(false);
                            setIsEditingNews(false);
                            setSelectedNewsItem(null);
                          }}
                          className="p-1 hover:bg-gray-150 rounded"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveNews} className="space-y-4 text-xs font-bold text-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Judul Berita *</label>
                            <input
                              type="text"
                              required
                              value={newsForm.title}
                              onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                              placeholder="Contoh: Pembagian Rapor Semester Genap"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Kategori *</label>
                            <select
                              value={newsForm.category}
                              onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                            >
                              <option value="Akademik">Akademik</option>
                              <option value="Praktik">Praktik / Jurusan</option>
                              <option value="Prestasi">Prestasi Siswa</option>
                              <option value="Spmb">Informasi Pendaftaran</option>
                              <option value="Umum">Umum / Lainnya</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                          <label className="block mb-1 font-extrabold uppercase tracking-widest text-[10px] text-slate-600">Gambar Utama Headline Berita *</label>
                          
                          {newsForm.image && (
                            <div className="my-2.5 flex items-center gap-3">
                              <img 
                                src={newsForm.image} 
                                alt="Preview" 
                                className="w-20 aspect-video object-cover rounded-xl border border-orange-200 shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-[9px] text-slate-400 font-bold leading-tight">
                                Pratinjau Gambar Berita
                                <div className="text-slate-500 font-normal truncate max-w-sm">{newsForm.image.substring(0, 50)}...</div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                            <div>
                              <label htmlFor="news-file-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-orange-400 bg-white p-3 rounded-xl cursor-pointer transition text-center group">
                                <Upload size={16} className="text-slate-400 group-hover:text-orange-550 mb-1" />
                                <span className="text-[10px] font-extrabold text-slate-700">PILIH FILE GAMBAR</span>
                                <span className="text-[8px] text-slate-400 font-medium">PNG, JPG, JPEG (Maks 10MB)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const url = await uploadWebsiteImage(file, 'news');
                                      if (url) {
                                        setNewsForm({ ...newsForm, image: url });
                                      } else {
                                        // Fallback ke base64
                                        resizeAndCompressImage(file, 900, 600, 0.76).then(b64 => setNewsForm({ ...newsForm, image: b64 }));
                                      }
                                    }
                                  }}
                                  className="hidden"
                                  id="news-file-upload"
                                />
                              </label>
                            </div>

                            <div className="flex flex-col justify-center">
                              <span className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Atau masukkan URL Gambar:</span>
                              <input
                                type="text"
                                value={newsForm.image}
                                onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono text-[9px] leading-snug font-bold"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Ringkasan Singkat (Excerpt / Snippet)</label>
                          <input
                            type="text"
                            value={newsForm.excerpt}
                            onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                            placeholder="Biarkan kosong jika ingin otomatis mengambil dari 120 huruf pertama isi konten."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Konten Lengkap Berita (Dukungan Teks Bebas) *</label>
                          <textarea
                            required
                            rows={8}
                            value={newsForm.content}
                            onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                            placeholder="Tuliskan isi berita sekolah secara lengkap di sini..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none font-sans font-normal"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingNews(false);
                              setIsEditingNews(false);
                              setSelectedNewsItem(null);
                            }}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-850 rounded-xl transition"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl transition shadow"
                          >
                            Simpan Perubahan
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 uppercase tracking-wider font-extrabold text-[10px] text-slate-600 border-b border-slate-200">
                              <th className="p-4 w-28">Gambar</th>
                              <th className="p-4">Metadata Berita</th>
                              <th className="p-4">Judul & Cuplikan Konten</th>
                              <th className="p-4 text-center w-36">Aksi Panel</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {newsList
                              .filter(item => item.title.toLowerCase().includes(newsSearch.toLowerCase()))
                              .map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                  <td className="p-4">
                                    <img
                                      src={item.image}
                                      alt={item.title}
                                      className="w-20 aspect-video object-cover rounded-lg border border-slate-200"
                                      referrerPolicy="no-referrer"
                                    />
                                  </td>
                                  <td className="p-4 space-y-1">
                                    <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-200">
                                      {item.category}
                                    </span>
                                    <div className="text-[10px] text-slate-400 font-bold">{item.date}</div>
                                  </td>
                                  <td className="p-4 space-y-1 max-w-md">
                                    <div className="font-extrabold text-[#0c162c] text-sm leading-tight">{item.title}</div>
                                    <p className="text-slate-500 font-normal line-clamp-2 leading-relaxed">{item.excerpt || item.content}</p>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex gap-2 justify-center">
                                      <button
                                        onClick={() => {
                                          setSelectedNewsItem(item);
                                          setNewsForm({
                                            title: item.title,
                                            excerpt: item.excerpt,
                                            content: item.content,
                                            category: item.category,
                                            image: item.image,
                                          });
                                          setIsEditingNews(true);
                                        }}
                                        className="p-2 text-[#0c162c] border border-slate-200 hover:border-[#0c162c] hover:bg-slate-100 text-xs font-bold rounded-xl transition flex items-center gap-1"
                                      >
                                        <Edit size={12} />
                                        Ubah
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNews(item.id)}
                                        className="p-2 text-rose-600 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-xs font-bold rounded-xl transition flex items-center gap-1"
                                      >
                                        <Trash2 size={12} />
                                        Hapus
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            {newsList.filter(item => item.title.toLowerCase().includes(newsSearch.toLowerCase())).length === 0 && (
                              <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                                  Tidak ada berita yang ditemukan.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: KELOLA GALERI FOTO KEGIATAN */}
            {activeTab === 'kelola_galeri' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <div className="bg-white border-b border-gray-150 p-4 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0 shadow-sm z-10">
                  <div className="relative w-full sm:max-w-sm">
                    <input
                      type="text"
                      value={gallerySearch}
                      onChange={(e) => setGallerySearch(e.target.value)}
                      placeholder="Cari foto galeri berdasarkan judul..."
                      className="w-full p-2 pl-9 pr-4 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                  
                  {!isAddingGallery && !isEditingGallery && (
                    <button
                      onClick={() => {
                        setGalleryForm({
                          title: "",
                          description: "",
                          category: "Praktik",
                          image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800"
                        });
                        setIsAddingGallery(true);
                      }}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus size={14} />
                      Tambah Foto Baru
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6">
                  {isAddingGallery || isEditingGallery ? (
                    <div className="max-w-3xl bg-white border border-orange-100 rounded-2xl p-6 shadow-md mx-auto">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                        <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                          <ImageIcon className="text-orange-500" size={18} />
                          {isEditingGallery ? "Edit Gambar Galeri" : "Mendaftarkan Foto Galeri Baru"}
                        </h3>
                        <button
                          onClick={() => {
                            setIsAddingGallery(false);
                            setIsEditingGallery(false);
                            setSelectedGalleryItem(null);
                          }}
                          className="p-1 hover:bg-gray-150 rounded"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveGallery} className="space-y-4 text-xs font-bold text-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Judul Foto Kegiatan *</label>
                            <input
                              type="text"
                              required
                              value={galleryForm.title}
                              onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                              placeholder="Contoh: Praktik Perakitan Router TKJ"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Kategori Galeri *</label>
                            <select
                              value={galleryForm.category}
                              onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                            >
                              <option value="Praktik">Praktik Jurusan</option>
                              <option value="Infrastruktur">Infrastruktur & Gedung</option>
                              <option value="Event">Event Sekolah / Upacara</option>
                              <option value="Ekstrakurikuler">Ekstrakurikuler Marawis/Olah Raga</option>
                              <option value="Umum">Umum / Kampus</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                          <label className="block mb-1 font-extrabold uppercase tracking-widest text-[10px] text-slate-600">File Gambar Kegiatan *</label>
                          
                          {galleryForm.image && (
                            <div className="my-2.5 flex items-center gap-3">
                              <img 
                                src={galleryForm.image} 
                                alt="Preview" 
                                className="w-20 aspect-video object-cover rounded-xl border border-orange-200 shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-[9px] text-slate-400 font-bold leading-tight">
                                Pratinjau Gambar Galeri
                                <div className="text-slate-500 font-normal truncate max-w-sm">{galleryForm.image.substring(0, 50)}...</div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                            <div>
                              <label htmlFor="gallery-file-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-orange-400 bg-white p-3 rounded-xl cursor-pointer transition text-center group">
                                <Upload size={16} className="text-slate-400 group-hover:text-orange-550 mb-1" />
                                <span className="text-[10px] font-extrabold text-slate-700">PILIH FILE GAMBAR</span>
                                <span className="text-[8px] text-slate-400 font-medium">PNG, JPG, JPEG (Maks 10MB)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const url = await uploadWebsiteImage(file, 'gallery');
                                      if (url) {
                                        setGalleryForm({ ...galleryForm, image: url });
                                      } else {
                                        resizeAndCompressImage(file, 900, 650, 0.76).then(b64 => setGalleryForm({ ...galleryForm, image: b64 }));
                                      }
                                    }
                                  }}
                                  className="hidden"
                                  id="gallery-file-upload"
                                />
                              </label>
                            </div>

                            <div className="flex flex-col justify-center">
                              <span className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Atau masukkan URL Gambar:</span>
                              <input
                                type="text"
                                value={galleryForm.image}
                                onChange={(e) => setGalleryForm({ ...galleryForm, image: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono text-[9px] leading-snug font-bold"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Keterangan Singkat (Deskripsi Gambar)</label>
                          <textarea
                            rows={3}
                            value={galleryForm.description}
                            onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                            placeholder="Jelaskan secara singkat apa yang dilakukan pada foto kegiatan ini."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none font-sans font-normal"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingGallery(false);
                              setIsEditingGallery(false);
                              setSelectedGalleryItem(null);
                            }}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-850 rounded-xl transition"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl transition shadow"
                          >
                            Simpan ke Galeri
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {galleryList
                        .filter(item => item.title.toLowerCase().includes(gallerySearch.toLowerCase()))
                        .map((item) => (
                          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:shadow-lg transition">
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 shrink-0">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider bg-[#0c162c] text-white px-2 py-0.5 rounded-lg">
                                {item.category}
                              </span>
                            </div>
                            
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div className="mb-4">
                                <h4 className="font-extrabold text-slate-900 leading-tight line-clamp-1 mb-1">{item.title}</h4>
                                <p className="text-slate-500 text-[11px] font-normal line-clamp-2 leading-relaxed">{item.description || "Tidak ada rincian keterangan tambahan."}</p>
                              </div>

                              <div className="flex gap-1.5 pt-3 border-t border-slate-100 shrink-0">
                                <button
                                  onClick={() => {
                                    setSelectedGalleryItem(item);
                                    setGalleryForm({
                                      title: item.title,
                                      description: item.description,
                                      category: item.category,
                                      image: item.image,
                                    });
                                    setIsEditingGallery(true);
                                  }}
                                  className="flex-1 text-center py-2 text-[#0c162c] border border-slate-200 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1"
                                >
                                  <Edit size={11} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteGallery(item.id)}
                                  className="flex-1 text-center py-2 text-rose-600 border border-slate-200 hover:bg-rose-50 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1"
                                >
                                  <Trash2 size={11} />
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {galleryList.filter(item => item.title.toLowerCase().includes(gallerySearch.toLowerCase())).length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-400 font-medium">
                          Tidak ditemukan koleksi foto kegiatan.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: KELOLA CAROUSEL SLIDE BACKGROUND DASHBOARD */}
            {activeTab === 'kelola_slides' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <div className="bg-white border-b border-gray-150 p-4 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0 shadow-sm z-10">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Sesuaikan Gambar & Slide Banner Utama</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Admin dapat menambah, menghapus, atau mengganti gambar latar belakang landing page di beranda di bawah.</p>
                  </div>
                  
                  {!isAddingSlide && !isEditingSlide && (
                    <button
                      onClick={() => {
                        setSlideForm({
                          title: "",
                          subtitle: "",
                          image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600",
                          actionText: "Daftar SPMB Online",
                          actionSub: "formulir"
                        });
                        setIsAddingSlide(true);
                      }}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus size={14} />
                      Tambah Slide Baru
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6">
                  {isAddingSlide || isEditingSlide ? (
                    <div className="max-w-3xl bg-white border border-orange-100 rounded-2xl p-6 shadow-md mx-auto">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                        <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                          <Sparkles className="text-orange-500" size={18} />
                          {isEditingSlide ? "Edit Slide Latar Belakang" : "Buat Slide Latar Belakang Baru"}
                        </h3>
                        <button
                          onClick={() => {
                            setIsAddingSlide(false);
                            setIsEditingSlide(false);
                            setSelectedSlideItem(null);
                          }}
                          className="p-1 hover:bg-gray-150 rounded"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveSlide} className="space-y-4 text-xs font-bold text-slate-700">
                        <div>
                          <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Judul Slide Utama (Heading Text) *</label>
                          <input
                            type="text"
                            required
                            value={slideForm.title}
                            onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                            placeholder="Contoh: Selamat Datang di SMK Ar Rosyid Campaka Putra"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]/relaxed">Sub-Judul / Keterangan Penjelas *</label>
                          <input
                            type="text"
                            required
                            value={slideForm.subtitle}
                            onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                            placeholder="Contoh: Mewujudkan Pendidikan Kejuruan Berkarakter Islami, Unggul, Kompeten..."
                            className="w-full p-2.5 bg-slate-50 border border-[#e2e8f0] rounded-xl focus:border-orange-500 focus:outline-none font-sans font-normal"
                          />
                        </div>

                        <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                          <label className="block mb-1 font-extrabold uppercase tracking-widest text-[10px] text-slate-600">Gambar Latar Belakang Slide *</label>
                          
                          {slideForm.image && (
                            <div className="my-2.5 flex items-center gap-3">
                              <img 
                                src={slideForm.image} 
                                alt="Preview" 
                                className="w-24 aspect-video object-cover rounded-xl border border-orange-200 shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-[9px] text-slate-400 font-bold leading-tight">
                                Pratinjau Gambar Slide
                                <div className="text-slate-500 font-normal truncate max-w-sm">{slideForm.image.substring(0, 50)}...</div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                            <div>
                              <label htmlFor="slide-file-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-orange-400 bg-white p-3 rounded-xl cursor-pointer transition text-center group">
                                <Upload size={16} className="text-slate-400 group-hover:text-orange-550 mb-1" />
                                <span className="text-[10px] font-extrabold text-slate-700">PILIH FILE GAMBAR</span>
                                <span className="text-[8px] text-slate-400 font-medium">PNG, JPG, JPEG (Maks 10MB)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const url = await uploadWebsiteImage(file, 'slides');
                                      if (url) {
                                        setSlideForm({ ...slideForm, image: url });
                                      } else {
                                        resizeAndCompressImage(file, 1200, 750, 0.72).then(b64 => setSlideForm({ ...slideForm, image: b64 }));
                                      }
                                    }
                                  }}
                                  className="hidden"
                                  id="slide-file-upload"
                                />
                              </label>
                            </div>

                            <div className="flex flex-col justify-center">
                              <span className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Atau masukkan URL Gambar:</span>
                              <input
                                type="text"
                                value={slideForm.image}
                                onChange={(e) => setSlideForm({ ...slideForm, image: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono text-[9px] leading-snug font-bold"
                              />
                            </div>
                          </div>
                          <p className="text-[8px] text-slate-400 mt-1 font-medium italic">Gunakan gambar landscape berasio 16:9 beresolusi minimal 1600x900px untuk hasil terbaik.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Teks Tombol Aksi (Call To Action Button)</label>
                            <input
                              type="text"
                              value={slideForm.actionText}
                              onChange={(e) => setSlideForm({ ...slideForm, actionText: e.target.value })}
                              placeholder="Contoh: Daftar SPMB Online 2026 / Hubungi Kami"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block mb-1.5 uppercase font-extrabold tracking-wider text-[10px]">Sub-halaman Tujuan Tombol</label>
                            <select
                              value={slideForm.actionSub}
                              onChange={(e) => setSlideForm({ ...slideForm, actionSub: e.target.value })}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                            >
                              <option value="formulir">Formulir SPMB Baru</option>
                              <option value="jurusan">Penjelasan Jurusan TKJ / Pemasaran</option>
                              <option value="berita">Semua Berita Terkini</option>
                              <option value="kontak">Kontak Hubung & Alamat</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingSlide(false);
                              setIsEditingSlide(false);
                              setSelectedSlideItem(null);
                            }}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-850 rounded-xl transition"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl transition shadow"
                          >
                            Simpan Slide
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {slidesList.map((item, idx) => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
                          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 p-4 flex flex-col justify-end text-white">
                              <span className="text-[10px] uppercase font-mono tracking-widest text-orange-400 font-extrabold mb-1">Slide #{idx + 1}</span>
                              <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-1">{item.title}</h4>
                              <p className="text-[11px] text-slate-300 font-normal line-clamp-2 leading-tight">{item.subtitle}</p>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                            <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 text-slate-500 font-medium">
                              <div>
                                <span className="font-extrabold text-slate-700 block uppercase tracking-wider text-[8px]">Teks Tombol:</span>
                                {item.actionText || "Tanpa Tombol"}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-700 block uppercase tracking-wider text-[8px]">Tujuan Tombol:</span>
                                {item.actionSub === 'formulir' ? 'Formulir SPMB' : item.actionSub === 'jurusan' ? 'Daftar Jurusan' : 'Umum/Berita'}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  setSelectedSlideItem(item);
                                  setSlideForm({
                                    title: item.title,
                                    subtitle: item.subtitle,
                                    image: item.image,
                                    actionText: item.actionText,
                                    actionSub: item.actionSub,
                                  });
                                  setIsEditingSlide(true);
                                }}
                                className="flex-1 text-center py-2 text-[#0c162c] border border-slate-200 hover:bg-slate-100 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1"
                              >
                                <Edit size={11} />
                                Ganti Gambar / Teks
                              </button>
                              <button
                                onClick={() => handleDeleteSlide(item.id)}
                                className="px-3 py-2 text-rose-600 border border-slate-200 hover:bg-rose-50 text-[11px] font-bold rounded-xl transition flex items-center justify-center"
                                title="Hapus Slide Banner"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: PENGATURAN UMUM HALAMAN */}
            {activeTab === 'pengaturan_umum' && (
              <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-orange-100 pb-5 gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-950 flex items-center gap-2">
                      <span className="w-2.5 h-6 bg-orange-500 rounded-full inline-block"></span>
                      Pengaturan Umum Website & Halaman
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Kelola konten, jam operasional, waktu presensi, visi-misi, sambutan, dan status pendaftaran online sekolah.</p>
                  </div>
                  <button
                    onClick={async () => {
                      const result = await saveGeneralSettingsToDb(settings);
                      if (result.success) {
                        // Update parent state agar Home langsung tampilkan perubahan
                        setSettings(settings);
                        // Update localStorage cache
                        localStorage.setItem('ar_rosyid_general_settings_v1', JSON.stringify(settings));
                        notifSuccess("Pengaturan Disimpan", "Semua pengaturan berhasil disimpan ke Supabase!");
                      } else {
                        notifError("Gagal Simpan", "Gagal menyimpan pengaturan: " + result.error);
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-200 to-stone-100 hover:from-yellow-300 hover:to-stone-200 text-slate-950 font-black text-xs uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-yellow-300 shadow scale-102"
                  >
                    <CheckCircle size={14} />
                    Simpan Semua Perubahan
                  </button>
                </div>

                {/* CARDS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* 0. RUNNING TEXT / MARQUEE BAR */}
                  <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm space-y-4 lg:col-span-2">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-rose-100">
                      <span className="w-3 h-3 bg-rose-600 rounded-sm inline-block animate-pulse"></span>
                      Kotak Merah & Teks Berjalan (Running Text Navigation Bar)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold leading-normal bg-rose-50 p-3 rounded-xl border border-rose-100">
                      📢 Bagian ini mengatur label di kotak merah dan teks yang berjalan di bawah navigasi website. Biasanya digunakan untuk pengumuman SPMB, info penting, atau berita terkini.
                    </p>

                    {/* Preview */}
                    <div className="bg-amber-100 rounded-xl px-4 py-2 flex items-center gap-3 text-xs overflow-hidden border border-amber-200">
                      <span className="bg-rose-600 text-white font-black text-[10px] tracking-widest uppercase px-2 py-0.5 rounded shrink-0 animate-pulse">
                        {settings.marqueeLabel || 'INFO SPMB:'}
                      </span>
                      <span className="font-semibold text-slate-700 truncate">
                        {settings.marqueeText || '(belum ada teks)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Label Kotak Merah</label>
                        <input
                          type="text"
                          value={settings.marqueeLabel || ''}
                          onChange={(e) => setSettings({ ...settings, marqueeLabel: e.target.value })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400"
                          placeholder="INFO SPMB: / PENGUMUMAN: / BERITA:"
                        />
                        <span className="text-[9px] text-slate-400 font-medium block">Teks pendek di dalam kotak merah.</span>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block">Teks Berjalan (Running Text)</label>
                        <textarea
                          rows={2}
                          value={settings.marqueeText || ''}
                          onChange={(e) => setSettings({ ...settings, marqueeText: e.target.value })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400"
                          placeholder="⭐ Penerimaan Siswa Baru Tahun Ajaran 2026/2027 telah dibuka!..."
                        />
                        <span className="text-[9px] text-slate-400 font-medium block">Teks ini akan bergerak dari kanan ke kiri di bawah navigasi. Gunakan emoji untuk menarik perhatian.</span>
                      </div>
                    </div>
                  </div>

                  {/* PENGATURAN TOP HEADER BANNER (WAKTU, LOKASI, NO TELPON, EMAIL) */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-150">
                      <Settings size={16} className="text-orange-500" />
                      Konfigurasi Banner Top Header (Di Atas Nama Sekolah)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold leading-normal bg-orange-50 p-3 rounded-xl border border-orange-100">
                      ⚙️ Panel ini merubah teks lokasi, no telepon, email, dan konfigurasi jam berjalan pada bagian paling atas halaman situs (sejajar dengan tombol ADMIN PANEL).
                    </p>
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Lokasi Top Header</label>
                        <input
                          type="text"
                          value={settings.contactAlamat || ""}
                          onChange={(e) => setSettings({ ...settings, contactAlamat: e.target.value })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                          placeholder="Cianjur, Jawa Barat..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">No Telepon Top Header</label>
                          <input
                            type="text"
                            value={settings.contactTelepon || ""}
                            onChange={(e) => setSettings({ ...settings, contactTelepon: e.target.value })}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                            placeholder="+62 812-3456-7890..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Email Top Header</label>
                          <input
                            type="text"
                            value={settings.contactEmail || ""}
                            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                            placeholder="info@smkarrosyidcampaka.sch.id..."
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-3">
                        <span className="font-extrabold text-[10px] text-orange-600 block uppercase tracking-wider font-bold">⏱️ Konfigurasi Waktu/Jam yang Sedang Berjalan</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Zona Waktu / Suffix</label>
                            <input
                              type="text"
                              value={settings.clockTimezone || "WIB"}
                              onChange={(e) => setSettings({ ...settings, clockTimezone: e.target.value })}
                              className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                              placeholder="WIB / WITA / WIT / dsb..."
                            />
                            <span className="text-[9px] text-slate-400 font-medium block">Label penanda zona waktu (contoh: WIB atau WITA).</span>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Selisih Jam (Offset UTC)</label>
                            <select
                              value={settings.clockOffset !== undefined ? settings.clockOffset.toString() : "7"}
                              onChange={(e) => setSettings({ ...settings, clockOffset: parseInt(e.target.value, 10) })}
                              className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer text-slate-700"
                            >
                              {[-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((offset) => (
                                <option key={offset} value={offset} className="text-slate-700">
                                  {offset >= 0 ? `UTC +${offset}` : `UTC ${offset}`} {offset === 7 ? "(WIB)" : offset === 8 ? "(WITA)" : offset === 9 ? "(WIT)" : ""}
                                </option>
                              ))}
                            </select>
                            <span className="text-[9px] text-slate-400 font-medium block">Pilih jam offset zona waktu terhadap waktu UTC.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1. INFORMASI KONTAK & SOSIAL MEDIA */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-150">
                      <Info size={16} className="text-orange-500" />
                      Kanal Kontak & Lokasi Resmi
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Alamat Kampus</label>
                        <textarea
                          rows={2}
                          value={settings.contactAlamat || ""}
                          onChange={(e) => setSettings({ ...settings, contactAlamat: e.target.value })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                          placeholder="Masukkan alamat lengkap sekolah..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">No Telepon/HP Humas</label>
                          <input
                            type="text"
                            value={settings.contactTelepon || ""}
                            onChange={(e) => setSettings({ ...settings, contactTelepon: e.target.value })}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                            placeholder="628123456789..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Email Resmi Sekolah</label>
                          <input
                            type="text"
                            value={settings.contactEmail || ""}
                            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                            placeholder="smk@arrosyid.sch.id..."
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Jam Operasional Pelayanan</label>
                        <input
                          type="text"
                          value={settings.contactJamKerja || ""}
                          onChange={(e) => setSettings({ ...settings, contactJamKerja: e.target.value })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                          placeholder="Senin - Sabtu (07:00 - 15:00 WIB)..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Instagram Username / Link</label>
                          <input
                            type="text"
                            value={settings.contactInstagram || ""}
                            onChange={(e) => setSettings({ ...settings, contactInstagram: e.target.value })}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                            placeholder="@smkarrosyid_official..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">YouTube Channel / Link</label>
                          <input
                            type="text"
                            value={settings.contactYoutube || ""}
                            onChange={(e) => setSettings({ ...settings, contactYoutube: e.target.value })}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                            placeholder="SMK Ar Rosyid Campaka TV..."
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">URL Google Maps Embed</label>
                        <textarea
                          rows={2}
                          value={settings.contactMapUrl || ""}
                          onChange={(e) => setSettings({ ...settings, contactMapUrl: e.target.value })}
                          className="w-full p-2.5 font-mono text-[10px] text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                          placeholder="https://www.google.com/maps/embed?pb=..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. PENGATURAN SPMB & QUOTA */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-150">
                      <GraduationCap size={16} className="text-orange-500" />
                      Konfigurasi Penerimaan Peserta (SPMB)
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Tahun Ajaran Aktif</label>
                          <input
                            type="text"
                            value={settings.spmbTahunAjaran || ""}
                            onChange={(e) => setSettings({ ...settings, spmbTahunAjaran: e.target.value })}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                            placeholder="2026/2027"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Kuota Penerimaan</label>
                          <input
                            type="number"
                            value={settings.spmbKuotaTarget || 120}
                            onChange={(e) => setSettings({ ...settings, spmbKuotaTarget: parseInt(e.target.value, 10) || 120 })}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                            placeholder="120"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Keterangan Beasiswa KIP</label>
                        <textarea
                          rows={2}
                          value={settings.spmbBatasKip || ""}
                          onChange={(e) => setSettings({ ...settings, spmbBatasKip: e.target.value })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                          placeholder="Pemegang Kartu KIP Aktif berhak mendapatkan bebas biaya DSP..."
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Status Pendaftaran Online (Opsi Pilihan)</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { val: "DIBUKA", label: "DIBUKA (ONLINE)", desc: "Mengizinkan pendaftaran baru dibuka secara umum", color: "border-green-300 text-green-700 bg-green-50/40" },
                            { val: "DITUTUP", label: "DITUTUP (TUTUP)", desc: "Menutup form online & memunculkan poster penuh", color: "border-red-300 text-red-700 bg-red-50/40" }
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setSettings({ ...settings, spmbStatusPendaftaran: opt.val })}
                              className={`p-3 rounded-2xl border text-left transition relative cursor-pointer ${
                                settings.spmbStatusPendaftaran === opt.val 
                                  ? `${opt.color} ring-2 ring-offset-1 ring-orange-500 font-extrabold` 
                                  : "border-slate-150 hover:border-slate-300 text-slate-500 bg-slate-50/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] uppercase tracking-wider block font-bold">{opt.label}</span>
                                {settings.spmbStatusPendaftaran === opt.val && (
                                  <CheckCircle size={14} className="text-orange-600" />
                                )}
                              </div>
                              <span className="text-[8px] font-semibold text-slate-400 block mt-1 leading-normal">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. JAM ABSENSI / PRESENSI SEKOLAH */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-150">
                      <Clock size={16} className="text-orange-500" />
                      Waktu Toleransi Absen / Presensi Sekolah
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Jam Masuk (Batas Jam)</label>
                        <select
                          value={settings.absensiMasukHour?.toString() || "7"}
                          onChange={(e) => setSettings({ ...settings, absensiMasukHour: parseInt(e.target.value, 10) })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          {[6, 7, 8, 9].map((h) => (
                            <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <span className="text-[9px] text-slate-400 font-medium block">Jam absensi siswa/guru dinilai masuk tepat waktu.</span>
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Menit Masuk (Batas Menit)</label>
                        <select
                          value={settings.absensiMasukMinute?.toString() || "30"}
                          onChange={(e) => setSettings({ ...settings, absensiMasukMinute: parseInt(e.target.value, 10) })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          {[0, 10, 15, 20, 30, 40, 45, 50].map((m) => (
                            <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <span className="text-[9px] text-slate-400 font-medium block">Menit batas toleransi masuk tepat waktu (misal: pukul 07:30).</span>
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Jam Kepulangan Resmi</label>
                        <select
                          value={settings.absensiPulangHour?.toString() || "15"}
                          onChange={(e) => setSettings({ ...settings, absensiPulangHour: parseInt(e.target.value, 10) })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          {[12, 13, 14, 15, 16, 17].map((h) => (
                            <option key={h} value={h}>{h.toString().padStart(2, '0')}:00 WIB</option>
                          ))}
                        </select>
                        <span className="text-[9px] text-slate-400 font-medium block">Kehadiran pulang sebelum jam ini otomatis ditolak oleh sistem.</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. SAMBUTAN KEPALA SEKOLAH */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-150">
                      <Users size={16} className="text-orange-500" />
                      Sambutan Kepala Sekolah
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Nama Lengkap Kepala Sekolah</label>
                        <input
                          type="text"
                          value={settings.sambutanKepalaNama || ""}
                          onChange={(e) => setSettings({ ...settings, sambutanKepalaNama: e.target.value, sambutanNama: e.target.value })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                          placeholder="Drs. H. Ar Rosyid, M.Pd"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Unggah Foto (PNG atau JPEG)</span>
                          <label htmlFor="settings-kepala-photo-file-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50/50 p-4 rounded-xl cursor-pointer transition text-center group">
                            <Upload size={18} className="text-slate-400 group-hover:text-orange-500 mb-1 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-700">UNGGAH PNG / JPEG</span>
                            <span className="text-[7px] text-slate-400 font-medium">Auto-Compress Aman</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = await uploadWebsiteImage(file, 'general');
                                  if (url) {
                                    setSettings({ ...settings, sambutanKepalaFoto: url, sambutanFoto: url });
                                  } else {
                                    resizeAndCompressImage(file, 400, 400, 0.8).then(b64 => setSettings({ ...settings, sambutanKepalaFoto: b64, sambutanFoto: b64 }));
                                  }
                                }
                              }}
                              className="hidden"
                              id="settings-kepala-photo-file-upload"
                            />
                          </label>
                        </div>

                        <div className="flex items-center justify-center border border-slate-100 bg-slate-50 rounded-2xl p-2 min-h-[110px]">
                          {settings.sambutanKepalaFoto ? (
                            <div className="text-center">
                              <img
                                src={settings.sambutanKepalaFoto}
                                alt="Kepala Sekolah Preview"
                                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-orange-200 shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[8px] font-black text-emerald-600 block mt-1.5 flex items-center justify-center gap-0.5"><Check size={8} /> File Diunggah</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-bold">Belum Ada Foto</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Atau Masukkan URL Alternatif:</label>
                        <input
                          type="text"
                          value={settings.sambutanKepalaFoto || ""}
                          onChange={(e) => setSettings({ ...settings, sambutanKepalaFoto: e.target.value, sambutanFoto: e.target.value })}
                          className="w-full p-2 font-mono text-[9px] border border-slate-200 rounded-lg"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Isi Sambutan Resmi</label>
                        <textarea
                          rows={4}
                          value={settings.sambutanKepalaIsi || ""}
                          onChange={(e) => setSettings({ ...settings, sambutanKepalaIsi: e.target.value, sambutanIsi: e.target.value })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 leading-relaxed"
                          placeholder="Tuliskan kata sambutan kepala sekolah di sini..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. VISI & MISI SEKOLAH */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-150">
                      <Sparkles size={16} className="text-orange-500" />
                      Visi & Misi SMK Ar Rosyid
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Visi Utama Sekolah</label>
                        <textarea
                          rows={3}
                          value={settings.visiSekolah || ""}
                          onChange={(e) => setSettings({ ...settings, visiSekolah: e.target.value, visiText: e.target.value })}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 leading-relaxed"
                          placeholder="Tulis visi utama..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Misi Sekolah (Gunakan Batas Baris Baru)</label>
                        <textarea
                          rows={6}
                          value={settings.misiSekolah || ""}
                          onChange={(e) => {
                            const lines = e.target.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l);
                            setSettings({ ...settings, misiSekolah: e.target.value, misiList: lines });
                          }}
                          className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 leading-relaxed"
                          placeholder="1. Meningkatkan iman dan taqwa...&#10;2. Menciptakan siswa terampil siap kerja..."
                        />
                        <span className="text-[9px] text-slate-400 font-medium block">Tulis misi satu-persatu berurutan ke bawah (satu baris untuk setiap misi).</span>
                      </div>
                    </div>
                  </div>

                  {/* 6. LOGO RESMI SEKOLAH */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-150">
                      <ImageIcon size={16} className="text-orange-500" />
                      Logo Resmi Sekolah (Navigasi & Beranda)
                    </h3>
                    <div className="space-y-4 text-xs">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Unggah File Logo (PNG/JPEG)</span>
                          <label htmlFor="settings-school-logo-file-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50/50 p-4 rounded-xl cursor-pointer transition text-center group">
                            <Upload size={18} className="text-slate-400 group-hover:text-orange-500 mb-1 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-700">UNGGAH LOGO KAMPUS</span>
                            <span className="text-[7px] text-slate-400 font-medium">Auto-Scale 256x256 Bagus</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = await uploadWebsiteImage(file, 'logo');
                                  if (url) {
                                    setSettings({ ...settings, schoolLogo: url });
                                  } else {
                                    resizeAndCompressImage(file, 256, 256, 0.9).then(b64 => setSettings({ ...settings, schoolLogo: b64 }));
                                  }
                                }
                              }}
                              className="hidden"
                              id="settings-school-logo-file-upload"
                            />
                          </label>
                        </div>

                        {/* PREVIEW CONTAINER */}
                        <div className="flex flex-col justify-center items-center gap-3 border border-slate-100 bg-slate-50 rounded-2xl p-3 min-h-[110px]">
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Preview Tampilan Navigasi:</span>
                          <div className="flex items-center gap-4">
                            {/* Navbar preview */}
                            <div className="flex flex-col items-center">
                              <div className={`w-12 h-12 flex items-center justify-center ${settings.schoolLogo ? "" : "bg-white rounded-full p-1 shadow-md border-2 border-yellow-400"}`}>
                                {settings.schoolLogo ? (
                                  <img
                                    src={settings.schoolLogo}
                                    alt="Logo Preview Nav"
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-600 to-yellow-500 flex flex-col items-center justify-center text-white leading-none">
                                    <Award size={16} className="text-yellow-200" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[7px] text-slate-400 font-bold mt-1">Header (w-12)</span>
                            </div>

                            {/* Footer preview */}
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 flex items-center justify-center ${settings.schoolLogo ? "" : "bg-white rounded-full p-1 border-2 border-yellow-400"}`}>
                                {settings.schoolLogo ? (
                                  <img
                                    src={settings.schoolLogo}
                                    alt="Logo Preview Foot"
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-600 to-yellow-500 flex flex-col items-center justify-center text-white leading-none">
                                    <Award size={12} className="text-yellow-100" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[7px] text-slate-400 font-bold mt-1">Footer (w-10)</span>
                            </div>
                          </div>

                          {settings.schoolLogo && (
                            <button
                              type="button"
                              onClick={() => {
                                notifConfirm("Hapus Logo Custom?", "Logo custom akan dihapus dan menggunakan logo bawaan.", () => {
                                  setSettings({ ...settings, schoolLogo: "" });
                                })
                              }}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[8px] uppercase rounded border border-red-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={10} />
                              Hapus Custom Logo
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase tracking-widest block font-bold text-slate-400">Atau Masukkan URL Gambar Logo:</label>
                        <input
                          type="text"
                          value={settings.schoolLogo || ""}
                          onChange={(e) => setSettings({ ...settings, schoolLogo: e.target.value })}
                          className="w-full p-2 font-mono text-[9px] border border-slate-200 rounded-lg text-slate-700"
                          placeholder="https://smk-arrosyid.sch.id/logo.png..."
                        />
                      </div>

                      <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl space-y-1">
                        <h4 className="text-[10px] font-black text-orange-800 flex items-center gap-1">
                          <Info size={12} />
                          Informasi Proporsi Gambar:
                        </h4>
                        <p className="text-[9px] text-orange-700 font-semibold leading-relaxed">
                          Sangat disarankan menggunakan gambar berasio <strong>1:1 (persegi/kotak)</strong> dengan background transparan (PNG) atau putih bersih agar logo menyatu sempurna di dalam lingkaran bingkai navigasi.
                        </p>
                      </div>

                    </div>
                  </div>

                </div>

                {/* SUBMIT ROW AT BOTTOM */}
                <div className="flex justify-end pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await saveGeneralSettingsToDb(settings);
                      if (result.success) {
                        setSettings(settings);
                        localStorage.setItem('ar_rosyid_general_settings_v1', JSON.stringify(settings));
                        notifSuccess("Pengaturan Disimpan", "Semua pengaturan berhasil disimpan ke Supabase!");
                      } else {
                        notifError("Gagal Simpan", "Gagal menyimpan pengaturan: " + result.error);
                      }
                    }}
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg tracking-wider"
                  >
                    <CheckCircle size={15} />
                    Simpan Permanen
                  </button>
                </div>
              </div>
            )}

            {/* TAB: AKUN E-LEARNING (SISWA & GURU) */}
            {activeTab === 'akun_elearning' && (
              <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-orange-100 pb-5 gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-950 flex items-center gap-2">
                      <span className="w-2.5 h-6 bg-orange-500 rounded-full inline-block"></span>
                      Manajemen Akun E-Learning
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Tambahkan, ubah, dan nonaktifkan akses portal E-Learning untuk Siswa (siswa) dan Guru Pengajar.
                    </p>
                  </div>
                  
                  {/* View Toggles */}
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                    <button
                      onClick={() => setEleView('siswa')}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
                        eleView === 'siswa' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <GraduationCap size={14} />
                      Siswa ({eleSiswa.length})
                    </button>
                    <button
                      onClick={() => setEleView('guru')}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
                        eleView === 'guru' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Users size={14} />
                      Guru ({eleGuru.length})
                    </button>
                  </div>
                </div>

                {/* SISWA SECTION */}
                {eleView === 'siswa' && (
                  <div className="space-y-4">
                    {/* Filter & Add Row */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
                      <div className="relative w-full sm:max-w-xs">
                        <input
                          type="text"
                          value={eleSiswaSearch}
                          onChange={(e) => setEleSiswaSearch(e.target.value)}
                          placeholder="Cari nama atau NISN..."
                          className="w-full p-2.5 pl-9 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                        />
                        <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsAddingEleSiswa(true);
                          setIsEditingEleSiswa(false);
                          setEleSiswaForm({ nisn: "", name: "", kelas: "X", jurusan: "TKJ", status: "AKTIF" });
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Plus size={14} />
                        Tambah Akun Siswa
                      </button>
                    </div>

                    {/* Adding/Editing Form Card */}
                    {(isAddingEleSiswa || isEditingEleSiswa) && (
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!eleSiswaForm.nisn || !eleSiswaForm.name) {
                            notifError("Form Tidak Lengkap", "NISN dan Nama wajib diisi!");
                            return;
                          }
                          let updated: ELearningStudentAccount[];
                          if (isEditingEleSiswa && selectedEleSiswa) {
                            updated = eleSiswa.map(item => item.id === selectedEleSiswa.id ? {
                              ...item,
                              nisn: eleSiswaForm.nisn || "",
                              name: eleSiswaForm.name || "",
                              kelas: eleSiswaForm.kelas as any,
                              jurusan: eleSiswaForm.jurusan || "",
                              status: eleSiswaForm.status as any
                            } : item);
                            notifSuccess("Akun Diperbarui", "Akun siswa berhasil diperbarui!");
                          } else {
                            const newAcc: ELearningStudentAccount = {
                              id: `e-std-${Date.now()}`,
                              nisn: eleSiswaForm.nisn,
                              name: eleSiswaForm.name.toUpperCase(),
                              kelas: (eleSiswaForm.kelas || 'X') as any,
                              jurusan: eleSiswaForm.jurusan || 'TKJ',
                              status: (eleSiswaForm.status || 'AKTIF') as any
                            };
                            updated = [...eleSiswa, newAcc];
                            notifSuccess("Akun Ditambahkan", "Akun siswa baru berhasil ditambahkan!");
                          }
                          setEleSiswa(updated);
                          // Simpan ke Supabase
                          await replaceAllELStudents(updated);
                          setIsAddingEleSiswa(false);
                          setIsEditingEleSiswa(false);
                          setSelectedEleSiswa(null);
                        }}
                        className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-2xl space-y-4 shadow-inner"
                      >
                        <div className="flex justify-between items-center border-b border-amber-100 pb-2">
                          <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                            {isEditingEleSiswa ? "Ubah Data Akun Siswa" : "Input Akun Siswa Baru"}
                          </h3>
                          <button 
                            type="button" 
                            onClick={() => {
                              setIsAddingEleSiswa(false);
                              setIsEditingEleSiswa(false);
                            }}
                            className="text-amber-900 font-bold text-xs"
                          >
                            Batal
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-amber-950 uppercase tracking-widest block mb-1">NISN (Username Login)</label>
                            <input 
                              type="text"
                              value={eleSiswaForm.nisn || ""}
                              onChange={e => setEleSiswaForm({...eleSiswaForm, nisn: e.target.value})}
                              placeholder="Masukkan NISN..."
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-amber-950 uppercase tracking-widest block mb-1">Nama Lengkap Siswa</label>
                            <input 
                              type="text"
                              value={eleSiswaForm.name || ""}
                              onChange={e => setEleSiswaForm({...eleSiswaForm, name: e.target.value.toUpperCase()})}
                              placeholder="NUR CAHYO..."
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-amber-950 uppercase tracking-widest block mb-1">Tingkat Kelas</label>
                            <select
                              value={eleSiswaForm.kelas || "X"}
                              onChange={e => setEleSiswaForm({...eleSiswaForm, kelas: e.target.value as any})}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                            >
                              <option value="X">Kelas X</option>
                              <option value="XI">Kelas XI</option>
                              <option value="XII">Kelas XII</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-amber-950 uppercase tracking-widest block mb-1">Kompetensi Keahlian (Jurusan)</label>
                            <select
                              value={eleSiswaForm.jurusan || "TKJ"}
                              onChange={e => setEleSiswaForm({...eleSiswaForm, jurusan: e.target.value})}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                            >
                              <option value="TKJ">Teknik Komputer & Jaringan</option>
                              <option value="PEMASARAN">Bisnis Daring & Pemasaran</option>
                              <option value="UMUM">Umum</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex md:justify-between items-center pt-2 flex-col sm:flex-row gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-amber-950 uppercase tracking-widest">Status Akses:</span>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                              <input 
                                type="radio" 
                                name="siswaStatus" 
                                checked={eleSiswaForm.status === "AKTIF"}
                                onChange={() => setEleSiswaForm({...eleSiswaForm, status: "AKTIF"})}
                                className="accent-orange-500" 
                              />
                              AKTIF
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                              <input 
                                type="radio" 
                                name="siswaStatus" 
                                checked={eleSiswaForm.status === "NON_AKTIF"}
                                onChange={() => setEleSiswaForm({...eleSiswaForm, status: "NON_AKTIF"})}
                                className="accent-orange-500" 
                              />
                              NON-AKTIF
                            </label>
                          </div>
                          <button 
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs uppercase rounded-xl transition cursor-pointer"
                          >
                            Simpan Akun
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Siswa Table list */}
                    <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden min-w-full">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-150">
                          <thead className="bg-slate-50 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                            <tr>
                              <th className="px-6 py-4 text-left font-black">Siswa/siswa</th>
                              <th className="px-6 py-4 text-left font-black">NISN Username</th>
                              <th className="px-6 py-4 text-left font-black">Kelas & Jurusan</th>
                              <th className="px-6 py-4 text-left font-black">Status</th>
                              <th className="px-6 py-4 text-center font-black">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100 text-xs font-semibold text-slate-750">
                            {eleSiswa.filter(s => 
                              s.name.toLowerCase().includes(eleSiswaSearch.toLowerCase()) ||
                              s.nisn.includes(eleSiswaSearch)
                            ).map((item, index) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-6 py-4">
                                  <div className="font-extrabold text-slate-900">{item.name}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 text-[10px] tracking-wide font-bold">{item.nisn}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-bold">
                                  Kelas {item.kelas} - {item.jurusan}
                                </td>
                                <td className="px-6 py-4">
                                  {item.status === 'AKTIF' ? (
                                    <span className="inline-flex items-center gap-1 font-black text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase">
                                      ● AKTIF
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-black text-[9px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full uppercase">
                                      ● NON-AKTIF
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setIsEditingEleSiswa(true);
                                        setIsAddingEleSiswa(false);
                                        setSelectedEleSiswa(item);
                                        setEleSiswaForm(item);
                                      }}
                                      className="p-1 px-2.5 text-slate-550 hover:bg-slate-100 text-[10px] font-black border border-slate-200 rounded-lg transition cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        notifConfirm('Hapus Akun?', 'Hapus akun E-Learning siswa ' + item.name + '?', async () => {
                                          const updated = eleSiswa.filter(e => e.id !== item.id);
                                          setEleSiswa(updated);
                                          await deleteELStudent(item.id);
                                          notifSuccess('Akun Dihapus', 'Akun berhasil dihapus!');
                                        });
                                      }}
                                      title="Hapus"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* GURU SECTION */}
                {eleView === 'guru' && (
                  <div className="space-y-4">
                    {/* Filter & Add Row */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
                      <div className="relative w-full sm:max-w-xs">
                        <input
                          type="text"
                          value={eleGuruSearch}
                          onChange={(e) => setEleGuruSearch(e.target.value)}
                          placeholder="Cari guru atau NIP..."
                          className="w-full p-2.5 pl-9 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                        />
                        <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsAddingEleGuru(true);
                          setIsEditingEleGuru(false);
                          setEleGuruForm({ nip: "", name: "", mataPelajaran: "", pin: "", status: "AKTIF" });
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Plus size={14} />
                        Tambah Akun Guru
                      </button>
                    </div>

                    {/* Adding/Editing Form Card */}
                    {(isAddingEleGuru || isEditingEleGuru) && (
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!eleGuruForm.nip || !eleGuruForm.name || !eleGuruForm.pin) {
                            notifError("Form Tidak Lengkap", "NIP, Nama, dan PIN Keamanan wajib diisi!");
                            return;
                          }
                          let updated: ELearningTeacherAccount[];
                          if (isEditingEleGuru && selectedEleGuru) {
                            const updatedItem: ELearningTeacherAccount = {
                              ...selectedEleGuru,
                              nip: eleGuruForm.nip || "",
                              name: eleGuruForm.name || "",
                              mataPelajaran: eleGuruForm.mataPelajaran || "",
                              pin: eleGuruForm.pin || "",
                              status: eleGuruForm.status as any
                            };
                            const result = await upsertELTeacher(updatedItem, eleGuruForm.pin || "");
                            if (!result.success) { notifError("Gagal Update", "Gagal: " + result.error); return; }
                            updated = eleGuru.map(item => item.id === selectedEleGuru.id ? updatedItem : item);
                            notifSuccess("Akun Diperbarui", "Akun Guru berhasil diperbarui!");
                          } else {
                            const newAcc: ELearningTeacherAccount = {
                              id: `e-tch-${Date.now()}`,
                              nip: eleGuruForm.nip,
                              name: eleGuruForm.name,
                              mataPelajaran: eleGuruForm.mataPelajaran || "SAJ",
                              pin: eleGuruForm.pin,
                              status: (eleGuruForm.status || 'AKTIF') as any
                            };
                            const result = await upsertELTeacher(newAcc, eleGuruForm.pin || "");
                            if (!result.success) { notifError("Gagal Tambah", "Gagal: " + result.error); return; }
                            updated = [...eleGuru, newAcc];
                            notifSuccess("Akun Ditambahkan", "Akun Guru baru berhasil ditambahkan!");
                          }
                          setEleGuru(updated);
                          setIsAddingEleGuru(false);
                          setIsEditingEleGuru(false);
                          setSelectedEleGuru(null);
                        }}
                        className="bg-sky-50/50 border border-sky-200/60 p-5 rounded-2xl space-y-4 shadow-inner"
                      >
                        <div className="flex justify-between items-center border-b border-sky-100 pb-2">
                          <h3 className="text-xs font-black text-sky-950 uppercase tracking-wider">
                            {isEditingEleGuru ? "Ubah Data Akun Guru" : "Input Akun Guru Baru"}
                          </h3>
                          <button 
                            type="button" 
                            onClick={() => {
                              setIsAddingEleGuru(false);
                              setIsEditingEleGuru(false);
                            }}
                            className="text-sky-900 font-bold text-xs"
                          >
                            Batal
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-sky-950 uppercase tracking-widest block mb-1">NIP/ID Pendidik</label>
                            <input 
                              type="text"
                              value={eleGuruForm.nip || ""}
                              onChange={e => setEleGuruForm({...eleGuruForm, nip: e.target.value})}
                              placeholder="Masukkan NIP/ID..."
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-sky-950 uppercase tracking-widest block mb-1">Nama Lengkap Guru</label>
                            <input 
                              type="text"
                              value={eleGuruForm.name || ""}
                              onChange={e => setEleGuruForm({...eleGuruForm, name: e.target.value})}
                              placeholder="Drs. Hermawan Agung..."
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-sky-950 uppercase tracking-widest block mb-1">Mata Pelajaran Utama</label>
                            <input 
                              type="text"
                              value={eleGuruForm.mataPelajaran || ""}
                              onChange={e => setEleGuruForm({...eleGuruForm, mataPelajaran: e.target.value})}
                              placeholder="SAJ / EDA / Jaringan..."
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-sky-950 uppercase tracking-widest block mb-1">PIN Keamanan Login (Pihak Ke-3)</label>
                            <input 
                              type="text"
                              value={eleGuruForm.pin || ""}
                              onChange={e => setEleGuruForm({...eleGuruForm, pin: e.target.value})}
                              placeholder="Masukkan PIN (cth: 1234)..."
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex md:justify-between items-center pt-2 flex-col sm:flex-row gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-sky-950 uppercase tracking-widest">Status Akses:</span>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                              <input 
                                type="radio" 
                                name="guruStatus" 
                                checked={eleGuruForm.status === "AKTIF"}
                                onChange={() => setEleGuruForm({...eleGuruForm, status: "AKTIF"})}
                                className="accent-orange-500" 
                              />
                              AKTIF
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                              <input 
                                type="radio" 
                                name="guruStatus" 
                                checked={eleGuruForm.status === "NON_AKTIF"}
                                onChange={() => setEleGuruForm({...eleGuruForm, status: "NON_AKTIF"})}
                                className="accent-orange-500" 
                              />
                              NON-AKTIF
                            </label>
                          </div>
                          <button 
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer"
                          >
                            Simpan Akun
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Guru Table list */}
                    <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden min-w-full">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-150">
                          <thead className="bg-slate-50 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                            <tr>
                              <th className="px-6 py-4 text-left font-black">Guru Pendidik</th>
                              <th className="px-6 py-4 text-left font-black">NIP / ID</th>
                              <th className="px-6 py-4 text-left font-black">Mata Pelajaran</th>
                              <th className="px-6 py-4 text-left font-black">PIN Login</th>
                              <th className="px-6 py-4 text-left font-black">Status</th>
                              <th className="px-6 py-4 text-center font-black">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100 text-xs font-semibold text-slate-750">
                            {eleGuru.filter(g => 
                              g.name.toLowerCase().includes(eleGuruSearch.toLowerCase()) ||
                              g.nip.includes(eleGuruSearch) ||
                              g.mataPelajaran.toLowerCase().includes(eleGuruSearch.toLowerCase())
                            ).map((item, index) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition whitespace-nowrap">
                                <td className="px-6 py-4">
                                  <div className="font-extrabold text-slate-900">{item.name}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 text-[10px] tracking-wide font-bold">{item.nip}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-bold">
                                  {item.mataPelajaran}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono text-slate-800 font-black tracking-widest bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded text-[10px]">
                                    {item.pin}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {item.status === 'AKTIF' ? (
                                    <span className="inline-flex items-center gap-1 font-black text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase">
                                      ● AKTIF
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-black text-[9px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full uppercase">
                                      ● NON-AKTIF
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center w-24">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setIsEditingEleGuru(true);
                                        setIsAddingEleGuru(false);
                                        setSelectedEleGuru(item);
                                        setEleGuruForm(item);
                                      }}
                                      className="p-1 px-2.5 text-slate-550 hover:bg-slate-100 text-[10px] font-black border border-slate-200 rounded-lg transition cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        notifConfirm('Hapus Akun?', 'Hapus akun E-Learning guru ' + item.name + '?', async () => {
                                          const result = await deleteELTeacher(item.id);
                                          if (!result.success) { notifError('Gagal Hapus', 'Gagal: ' + result.error); return; }
                                          setEleGuru(prev => prev.filter(e => e.id !== item.id));
                                          notifSuccess('Akun Dihapus', 'Akun berhasil dihapus!');
                                        });
                                      }}
                                      title="Hapus"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: KELOLA AKUN ADMIN */}
            {activeTab === 'kelola_admin' && (
              <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in text-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-rose-100 pb-5 gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-950 flex items-center gap-2">
                      <span className="w-2.5 h-6 bg-rose-500 rounded-full inline-block animate-pulse"></span>
                      Kelola Akun & Sesi Admin
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Buat akun administrator baru, kelola sandi, serta ganti sesi aktif atau kembalikan kredensial ke setelan awal.
                    </p>
                  </div>

                  <div className="flex gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleResetAdmins}
                      className="px-4 py-2 border border-rose-205 text-rose-600 bg-rose-50 hover:bg-rose-100 font-black text-[11px] tracking-wider rounded-xl transition flex items-center gap-2 uppercase cursor-pointer"
                    >
                      <RefreshCw size={13} className="text-rose-500" />
                      Reset Semua Admin
                    </button>
                    {!isAddingAdmin && !isEditingAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAdmin(true);
                          setIsEditingAdmin(false);
                          setSelectedAdminItem(null);
                          setAdminForm({ username: "", name: "", password: "", role: "ADMIN_STAF" });
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] tracking-wider rounded-xl transition flex items-center gap-2 uppercase cursor-pointer shadow-md"
                      >
                        <Plus size={14} />
                        Buat Admin Baru
                      </button>
                    )}
                  </div>
                </div>

                {/* Sesi Aktif Header Overview card */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 text-xl font-black flex items-center justify-center shadow-lg shadow-amber-400/25">
                      {currentAdmin ? currentAdmin.name.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest block">SESI SAAT INI</span>
                      <h3 className="text-base md:text-lg font-black tracking-tight text-white">{currentAdmin?.name || "Administrator Utama"}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300 font-semibold">
                        <span className="bg-slate-800 px-2.5 py-0.5 rounded text-[10px] font-mono text-amber-300">@{currentAdmin?.username || "admin"}</span>
                        <span>•</span>
                        <span>{currentAdmin?.role === "SUPER_ADMIN" ? "Super Administrator Utama" : "Staf Administrator Terbatas"}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSwitchUsername("");
                      setSwitchPassword("");
                      setSwitchError("");
                      setShowSessionSwitchModal(true);
                    }}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase rounded-xl transition flex items-center gap-2 cursor-pointer shadow shadow-amber-400/20"
                  >
                    <LogIn size={14} />
                    Pindah / Login Sesi Lain
                  </button>
                </div>

                {/* Form Tambah/Ubah Admin */}
                {(isAddingAdmin || isEditingAdmin) && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 md:p-6 space-y-4 animate-fade-in text-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        {isEditingAdmin ? "Ubah Informasi Akun Admin" : "Buat Akun Administrator Baru"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAdmin(false);
                          setIsEditingAdmin(false);
                          setSelectedAdminItem(null);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold font-sans"
                      >
                        Batal
                      </button>
                    </div>

                    <form onSubmit={handleSaveAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1 col-span-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Username Akses</label>
                        <input
                          type="text"
                          required
                          disabled={isEditingAdmin}
                          value={adminForm.username}
                          onChange={e => setAdminForm({...adminForm, username: e.target.value})}
                          placeholder="Masukkan username unik..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 disabled:bg-slate-100 placeholder-slate-400"
                        />
                      </div>

                      <div className="md:col-span-1 col-span-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Nama Pengguna (Tampilan)</label>
                        <input
                          type="text"
                          required
                          value={adminForm.name}
                          onChange={e => setAdminForm({...adminForm, name: e.target.value})}
                          placeholder="Nama lengkap admin..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="md:col-span-1 col-span-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">
                          Kata Sandi / Password
                          {isEditingAdmin && <span className="text-slate-400 font-normal ml-1">(kosongkan jika tidak ingin diubah)</span>}
                        </label>
                        <input
                          type="password"
                          required={!isEditingAdmin}
                          value={adminForm.password}
                          onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                          placeholder={isEditingAdmin ? "Isi hanya jika ingin ganti password..." : "Buat password baru..."}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="md:col-span-1 col-span-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Level Akses (Role)</label>
                        <select
                          value={adminForm.role}
                          onChange={e => setAdminForm({...adminForm, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN_STAF'})}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="SUPER_ADMIN">SUPER ADMIN (Semua Akses)</option>
                          <option value="ADMIN_STAF">ADMIN STAF (Terbatas/Umum)</option>
                        </select>
                      </div>

                      <div className="md:col-span-4 col-span-1 flex flex-col gap-2">
                        {adminError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            {adminError}
                          </div>
                        )}
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={adminSaving}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {adminSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                            {adminSaving ? "Menyimpan..." : (isEditingAdmin ? "Simpan Perubahan" : "Simpan Admin Baru")}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* List of Admins */}
                <div className="bg-white rounded-2xl border border-slate-205 shadow-sm overflow-hidden text-slate-800">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Daftar Akun Administrator Terdaftar</span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-200/60 px-2 py-0.5 rounded-full">{adminAccounts.length} Akun</span>
                  </div>

                  <div className="overflow-x-auto font-sans">
                    <table className="min-w-full divide-y divide-gray-150">
                      <thead className="bg-slate-50 text-[9px] font-mono uppercase tracking-wider text-slate-450">
                        <tr>
                          <th className="px-6 py-4 text-left font-black">Detail Identitas</th>
                          <th className="px-6 py-4 text-left font-black">Username</th>
                          <th className="px-6 py-4 text-left font-black">Kata Sandi</th>
                          <th className="px-6 py-4 text-left font-black">Level Akses</th>
                          <th className="px-6 py-4 text-center font-black">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100 text-xs font-semibold text-slate-750">
                        {adminAccounts.map((account) => {
                          const isCurrent = currentAdmin?.username.toLowerCase() === account.username.toLowerCase();
                          const isMainDefault = account.username.toLowerCase() === "admin";
                          
                          return (
                            <tr key={account.username} className={`hover:bg-slate-50/40 transition whitespace-nowrap ${isCurrent ? 'bg-amber-50/30' : ''}`}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs uppercase ${
                                    account.role === "SUPER_ADMIN" ? "bg-red-55 text-red-600 border border-red-200" : "bg-sky-55 text-sky-600 border border-sky-200"
                                  }`}>
                                    {account.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                      {account.name}
                                      {isCurrent && (
                                        <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md animate-pulse">AKTIF</span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-400">Dibuat: {account.createdAt ? new Date(account.createdAt).toLocaleDateString("id-ID") : "-"}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span className="font-mono bg-slate-100 text-slate-650 px-2 py-0.5 rounded font-bold">@{account.username}</span>
                              </td>

                              <td className="px-6 py-4 font-mono font-bold tracking-tight text-slate-600">
                                {account.password}
                              </td>

                              <td className="px-6 py-4">
                                {account.role === "SUPER_ADMIN" ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black bg-red-100 text-red-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    ★ SUPERADMIN
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    STAF ADMIN
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setIsEditingAdmin(true);
                                      setIsAddingAdmin(false);
                                      setSelectedAdminItem(account);
                                      setAdminForm({
                                        username: account.username,
                                        name: account.name,
                                        password: account.password || "",
                                        role: account.role || "ADMIN_STAF"
                                      });
                                    }}
                                    className="p-1 px-2.5 text-slate-550 hover:bg-slate-100 text-[10px] font-black border border-slate-200 rounded-lg transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  {!isMainDefault && (
                                    <button
                                      disabled={isCurrent}
                                      onClick={() => handleDeleteAdmin(account.username)}
                                      className="p-1 text-rose-650 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-40"
                                      title={isCurrent ? "Tidak dapat menghapus sesi aktif" : "Hapus Akun"}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: PINDAH SESI / GANTI AKUN ADMIN */}
            {showSessionSwitchModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-55 flex items-center justify-center p-4 font-sans animate-fade-in text-slate-800">
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 max-w-sm w-full p-6 space-y-5 animate-slide-up">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-amber-500" />
                      <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">Beralih Sesi Admin</h3>
                    </div>
                    <button 
                      onClick={() => setShowSessionSwitchModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {switchError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[11px] font-bold">
                      {switchError}
                    </div>
                  )}

                  <form onSubmit={handleSwitchSessionSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Username Admin Baru</label>
                      <input 
                        type="text" 
                        value={switchUsername}
                        onChange={(e) => setSwitchUsername(e.target.value)}
                        placeholder="Username admin..." 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Password Admin Baru</label>
                      <input 
                        type="password" 
                        value={switchPassword}
                        onChange={(e) => setSwitchPassword(e.target.value)}
                        placeholder="Sandi ketat..." 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between font-bold text-[10px] text-slate-500 pt-1">
                      <span>Atau log out total:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSessionSwitchModal(false);
                          handleLogout();
                        }}
                        className="text-rose-550 hover:underline hover:text-rose-600 font-black cursor-pointer uppercase tracking-wider text-[9px]"
                      >
                        LOGOUT TOTAL SESI
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Masuk ke Sesi Terpilih
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal Notifikasi Profesional */}
      <ModalNotif notif={notif} onClose={closeNotif} />
      </div>
    </div>
  );
}
