import React, { useState, useEffect, useCallback } from "react";
import { 
  BookOpen, Video, FileText, Upload, Plus, Trash2, Award, 
  CheckCircle, PlayCircle, GraduationCap, Lock, ArrowLeft,
  ChevronRight, ClipboardList, Send, Sparkles, Star, Download,
  Bookmark, Calendar, RefreshCw, Eye, Users, Loader2
} from "lucide-react";
import { GeneralSettings, ELearningStudentAccount, ELearningTeacherAccount } from "../types";
import {
  fetchCourses, replaceAllCourses,
  fetchSubmissions, insertSubmission, gradeSubmission,
  verifyELStudentNisn, verifyELTeacherPin,
} from "../lib/services/elearningService";
import { fetchStudents } from "../lib/services/rosterService";
import { uploadWebsiteImage } from "../lib/services/storageService";

interface ELearningProps {
  initialSubTab?: string;
  settings?: GeneralSettings;
}

interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  fileName?: string; // Sesuai permintaan: word, PDF, PPT
  fileBase64?: string; // Berkas data base64 (opsional)
  dateAdded: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
  major: "TKJ" | "BDP" | "ALL";
  grade: "X" | "XI" | "XII";
  teacher: string;
  modules: CourseModule[];
  assignments: {
    id: string;
    title: string;
    instruction: string;
    dueDate: string;
  }[];
}

interface StudentSubmission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentName: string;
  studentNisn: string;
  fileName: string;
  fileBase64?: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: "BELUM_DINILAI" | "DINILAI" | "PERLU_REVISI";
}

const DEFAULT_COURSES: Course[] = [
  {
    id: "course-1",
    code: "TKJ-XI-SAJ",
    title: "Sistem Administrasi Jaringan (SAJ)",
    major: "TKJ",
    grade: "XI",
    teacher: "Drs. Hermawan Agung",
    modules: [
      {
        id: "mod-1-1",
        courseId: "course-1",
        title: "Konfigurasi Virtual LAN (VLAN) di Mikrotik Router",
        description: "Panduan dasar membagi segmen jaringan menggunakan VLAN ID 10 & 20 pada interface ethernet utama Routerboard.",
        fileName: "Panduan_Konfigurasi_VLAN_Mikrotik.pdf",
        dateAdded: "2026-06-01"
      },
      {
        id: "mod-1-2",
        courseId: "course-1",
        title: "Manajemen Bandwidth Menggunakan Simple Queue",
        description: "Teknik melimit kecepatan unduh dan unggah client berdasarkan single IP Address mau pun segmen subnet IP.",
        fileName: "Diktat_Manajemen_Bandwidth.docx",
        dateAdded: "2026-06-05"
      }
    ],
    assignments: [
      {
        id: "asg-1-1",
        title: "Praktikum Desain Topologi VLAN & Routing Statis",
        instruction: "Gambarkan skema topologi jaringan di Cisco Packet Tracer dengan 1 router Mikrotik, 1 Switch Managed, dan 4 PC Client. Bagi menjadi VLAN Siswa (VLAN 10) dan VLAN Guru (VLAN 20). Kirimkan file PDF hasil screenshot ping test.",
        dueDate: "2026-06-18"
      }
    ]
  },
  {
    id: "course-2",
    code: "BDP-XI-EDA",
    title: "E-Commerce & Digital Advertising (EDA)",
    major: "BDP",
    grade: "XI",
    teacher: "Hj. Mutia Rahma, S.E.",
    modules: [
      {
        id: "mod-2-1",
        courseId: "course-2",
        title: "Strategi Setup Campaign TikTok Ads untuk siswa",
        description: "Langkah-langkah menyusun anggaran harian iklan, penargetan demografi, dan pemilihan format video hook kreatif.",
        fileName: "Presentasi_Strategi_TikTok_Ads.pptx",
        dateAdded: "2026-06-02"
      }
    ],
    assignments: [
      {
        id: "asg-2-1",
        title: "Analisis Hook Video Live Selling Terbaik",
        instruction: "Tonton 3 brand lokal yang sedang melakukan live shopping di platform Shopee/TikTok. Analisis hook 10 detik pertama mereka dan tuliskan strategi retensi penonton dalam bentuk laporan minimal 2 halaman PDF.",
        dueDate: "2026-06-20"
      }
    ]
  }
];

const QUIZ_QUESTIONS = [
  {
    courseId: "course-1",
    id: "q1",
    question: "Manakah port default yang digunakan untuk akses konfigurasi Winbox di perangkat Mikrotik?",
    options: ["80", "443", "8291", "22"],
    correct: 2,
    explanation: "Winbox menggunakan port TCP 8291 secara default untuk melakukan koneksi GUI ke perangkat Mikrotik."
  },
  {
    courseId: "course-1",
    id: "q2",
    question: "Fitur apa pada Mikrotik yang berfungsi membagi satu interface fisik menjadi beberapa interface logis?",
    options: ["DHCP Relay", "VLAN (Virtual LAN)", "OSPF Dynamic Routing", "NAT Overload"],
    correct: 1,
    explanation: "VLAN (Virtual LAN) memungkinkan segmentasi jaringan logis dalam satu infrastruktur kabel fisik tunggal."
  },
  {
    courseId: "course-2",
    id: "q3",
    question: "Apa tujuan utama dalam menetapkan 'Hook' visual pada 3 detik pertama video iklan digital?",
    options: ["Membatasi durasi memori", "Menahan perhatian (retensi) mata audiens", "Menaikkan resolusi kompresi video", "Meningkatkan biaya optimasi Bidding"],
    correct: 1,
    explanation: "Menghentikan jempol audiens di media sosial dan menahan perhatian dari scrolling adalah kegunaan visual Hook 3 detik pertama."
  },
  {
    courseId: "course-1",
    id: "q4",
    question: "Teknik prioritas bandwidth di Mikrotik untuk memastikan lalu lintas data penting tidak macet disebut...",
    options: ["Simple Routing", "IP Address Binding", "Quality of Service (QoS) & Queueing", "Web Proxy Cache"],
    correct: 2,
    explanation: "QoS melalui Queueing mementingkan paket data penting, seperti VoIP, Game, atau Zoom dibanding berkas besar."
  },
  {
    courseId: "course-2",
    id: "q5",
    question: "Manakah model harga iklan digital yang mengenakan tarif hanya jika audiens melakukan klik ke link landing page Anda?",
    options: ["CPM (Cost Per Mille)", "CPC (Cost Per Click)", "CPA (Cost Per Action)", "CPL (Cost Per Lead)"],
    correct: 1,
    explanation: "Cost Per Click (CPC) memastikan pengiklan hanya membayar ketika tautan iklan berhasil diklik oleh pengguna."
  }
];

export default function ELearning({ initialSubTab = "siswa", settings }: ELearningProps) {
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load data dari Supabase saat mount
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    const [dbCourses, dbSubmissions] = await Promise.all([
      fetchCourses(),
      fetchSubmissions(),
    ]);
    if (dbCourses.length > 0) setCourses(dbCourses as any);
    setSubmissions(dbSubmissions as any);
    setIsLoadingData(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const [activeRole, setActiveRole] = useState<"siswa" | "guru" | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loggedInGuru, setLoggedInGuru] = useState<ELearningTeacherAccount | null>(null);

  // Kalau masuk dari menu navigasi spesifik, role dikunci
  const isRoleLocked = initialSubTab === 'siswa' || initialSubTab === 'guru';

  // Student Auth/Identification
  const [studentNisn, setStudentNisn] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentKelas, setStudentKelas] = useState("");   // X / XI / XII
  const [studentJurusan, setStudentJurusan] = useState(""); // TKJ / BDP
  const [isAuthenticatedSiswa, setIsAuthenticatedSiswa] = useState(false);
  const [loginSiswaLoading, setLoginSiswaLoading] = useState(false);

  // Teacher Login
  const [teacherPin, setTeacherPin] = useState("");
  const [isAuthenticatedGuru, setIsAuthenticatedGuru] = useState(false);
  const [loginGuruLoading, setLoginGuruLoading] = useState(false);

  // Video modal
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");

  // Quiz state
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Form modul
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");
  const [newModuleFileName, setNewModuleFileName] = useState("");
  const [newModuleFileBase64, setNewModuleFileBase64] = useState("");
  const [newModuleTargetCourse, setNewModuleTargetCourse] = useState("");

  // Form tugas
  const [newAsgTitle, setNewAsgTitle] = useState("");
  const [newAsgInstruction, setNewAsgInstruction] = useState("");
  const [newAsgDueDate, setNewAsgDueDate] = useState("");

  // Penilaian
  const [gradeInput, setGradeInput] = useState<Record<string, number>>({});
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});

  // Upload
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [activeUploadFile, setActiveUploadFile] = useState<Record<string, string>>({});
  const [isUploadingModule, setIsUploadingModule] = useState(false);

  // Set default role from subTab
  useEffect(() => {
    if (initialSubTab === "guru") {
      setActiveRole("guru");
    } else {
      setActiveRole("siswa");
    }
  }, [initialSubTab]);

  // ── Login Siswa via Supabase ──────────────────────────────
  const handleSiswaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNisn = studentNisn.trim();
    const cleanName = studentName.trim().toUpperCase();

    if (!cleanName || !cleanNisn) {
      alert("⚠️ Harap isi Nama Lengkap dan NISN siswa!");
      return;
    }

    setLoginSiswaLoading(true);

    // Cek di tabel elearning_student_accounts
    const found = await verifyELStudentNisn(cleanNisn);
    if (found) {
      setStudentName(found.name);
      setStudentKelas(found.kelas || '');
      setStudentJurusan(found.jurusan || '');
      setIsAuthenticatedSiswa(true);
      setLoginSiswaLoading(false);
      return;
    }

    // Fallback: cek di tabel enrolled_students (siswa aktif sekolah)
    const enrolled = await fetchStudents('AKTIF');
    const foundEnrolled = enrolled.find(s => s.nisn === cleanNisn);
    if (foundEnrolled) {
      setStudentName(foundEnrolled.nama);
      setStudentKelas(foundEnrolled.kelas || '');
      setStudentJurusan(foundEnrolled.jurusan || '');
      setIsAuthenticatedSiswa(true);
      setLoginSiswaLoading(false);
      return;
    }

    setLoginSiswaLoading(false);
    alert(`❌ NISN "${cleanNisn}" tidak terdaftar di E-Learning atau non-aktif.\nMinta admin untuk mendaftarkan akun E-Learning Anda terlebih dahulu.`);
  };

  // ── Login Guru via Supabase (verifikasi PIN) ──────────────
  const handleGuruLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = teacherPin.trim();
    if (!cleanPin) {
      alert("⚠️ PIN harus diisi!");
      return;
    }

    setLoginGuruLoading(true);
    const found = await verifyELTeacherPin(cleanPin);
    setLoginGuruLoading(false);

    if (found) {
      setLoggedInGuru(found);
      setIsAuthenticatedGuru(true);
    } else {
      alert("❌ PIN Guru salah atau akun dinonaktifkan!\nPeriksa akun E-Learning guru di Admin Panel.");
    }
  };

  const handleModuleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewModuleFileName(file.name);
    setIsUploadingModule(true);

    // Coba upload ke Supabase Storage dulu
    const { uploadDocumentFile } = await import('../lib/services/storageService');
    const storageUrl = await uploadDocumentFile(file, 'elearning-materials');

    if (storageUrl) {
      // Simpan URL storage (bukan base64)
      setNewModuleFileBase64(storageUrl);
      setIsUploadingModule(false);
    } else {
      // Fallback: simpan sebagai base64 kalau storage belum tersedia
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setNewModuleFileBase64(reader.result);
        }
        setIsUploadingModule(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Helper: simpan semua courses ke Supabase ─────────────
  const saveCourses = async (updated: Course[]) => {
    setCourses(updated);
    await replaceAllCourses(updated as any);
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !newModuleDesc.trim() || !newModuleTargetCourse || !newModuleFileName) {
      alert("⚠️ Harap lengkapi semua isian materi baru dan unggah berkas file!");
      return;
    }
    if (isUploadingModule) {
      alert("⏳ Mohon tunggu, file masih dalam proses upload...");
      return;
    }

    const updated = courses.map(c => {
      if (c.id === newModuleTargetCourse) {
        const newMod: CourseModule = {
          id: `mod-${Date.now()}`,
          courseId: c.id,
          title: newModuleTitle,
          description: newModuleDesc,
          fileName: newModuleFileName,
          // fileBase64 berisi Storage URL atau base64 (fallback)
          fileBase64: newModuleFileBase64 || undefined,
          dateAdded: new Date().toISOString().split('T')[0]
        };
        return { ...c, modules: [...c.modules, newMod] };
      }
      return c;
    });

    await saveCourses(updated);
    setNewModuleTitle(""); setNewModuleDesc("");
    setNewModuleFileName(""); setNewModuleFileBase64("");
    alert("✓ Materi Belajar Berhasil Diterbitkan ke Siswa dan disimpan ke database!");
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgTitle.trim() || !newAsgInstruction.trim() || !newAsgDueDate || !newModuleTargetCourse) {
      alert("⚠️ Harap lengkapi semua isian tugas baru!");
      return;
    }

    const updated = courses.map(c => {
      if (c.id === newModuleTargetCourse) {
        const newAsg = {
          id: `asg-${Date.now()}`,
          title: newAsgTitle,
          instruction: newAsgInstruction,
          dueDate: newAsgDueDate
        };
        return { ...c, assignments: [...c.assignments, newAsg] };
      }
      return c;
    });

    await saveCourses(updated);
    setNewAsgTitle(""); setNewAsgInstruction(""); setNewAsgDueDate("");
    alert("✓ Tugas Belajar Baru Berhasil Diterbitkan!");
  };

  const handleFileUpload = (asgId: string, courseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileDataUrl = typeof reader.result === "string" ? reader.result : undefined;
      if (!fileDataUrl) return;

      // Progress UI
      setUploadProgress(prev => ({ ...prev, [asgId]: 10 }));

      // Coba upload ke Supabase Storage
      const subId = `sub-${Date.now()}`;
      const { uploadSubmissionFile } = await import('../lib/services/storageService');
      const storageUrl = await uploadSubmissionFile(fileDataUrl, file.name, subId);

      // Progress selesai
      setUploadProgress(prev => ({ ...prev, [asgId]: 100 }));
      setActiveUploadFile(prev => ({ ...prev, [asgId]: file.name }));

      const newSub: StudentSubmission = {
        id: subId,
        assignmentId: asgId,
        courseId: courseId,
        studentName: studentName.toUpperCase(),
        studentNisn: studentNisn,
        fileName: file.name,
        // Simpan Storage URL jika berhasil, fallback ke base64
        fileBase64: storageUrl ?? fileDataUrl,
        submittedAt: new Date().toLocaleDateString('id-ID', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) + " WIB",
        status: "BELUM_DINILAI"
      };

      // Simpan ke Supabase
      const result = await insertSubmission(newSub as any);
      if (!result.success) {
        alert(`❌ Gagal menyimpan tugas ke database: ${result.error}`);
        return;
      }

      setSubmissions(prev => {
        const filtered = prev.filter(s => !(s.assignmentId === asgId && s.studentNisn === studentNisn));
        return [...filtered, newSub];
      });

      alert(`✓ Tugas "${file.name}" Berhasil Diserahkan${storageUrl ? ' dan tersimpan di cloud!' : '.'}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGrade = async (submissionId: string) => {
    const grade = gradeInput[submissionId];
    const feedback = feedbackInput[submissionId] || "";

    if (grade === undefined || grade < 0 || grade > 100) {
      alert("⚠️ Berikan nilai angka yang sah antara 0 - 100!");
      return;
    }

    // Kirim info guru dan mata pelajaran saat menyimpan nilai
    const gradedBy = loggedInGuru?.name ?? 'Guru';
    const mataPelajaran = loggedInGuru?.mataPelajaran ?? '';

    const result = await gradeSubmission(submissionId, Number(grade), feedback, gradedBy, mataPelajaran);
    if (!result.success) {
      alert(`Gagal menyimpan nilai: ${result.error}`);
      return;
    }

    setSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        return {
          ...s,
          grade: Number(grade),
          feedback,
          status: "DINILAI" as any,
          gradedBy,
          mataPelajaran,
          gradedAt: new Date().toISOString(),
        };
      }
      return s;
    }));

    alert("✓ Nilai & Feedback Berhasil Disimpan!");
  };

  const deleteModule = async (courseId: string, moduleId: string) => {
    if (confirm("Hapus materi belajar ini?")) {
      const updated = courses.map(c => {
        if (c.id === courseId) {
          return { ...c, modules: c.modules.filter(m => m.id !== moduleId) };
        }
        return c;
      });
      await saveCourses(updated);
    }
  };

  const startQuiz = () => {
    setUserAnswers({});
    setQuizScore(null);
    setQuizSubmitted(false);
    setIsQuizActive(true);
  };

  const submitQuiz = () => {
    // Check points
    let points = 0;
    const currentQuizQuestions = QUIZ_QUESTIONS.filter(q => q.courseId === selectedCourse?.id || selectedCourse?.major === "ALL" || true).slice(0, 3);
    
    currentQuizQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correct) {
        points += 1;
      }
    });

    const finalScore = Math.round((points / currentQuizQuestions.length) * 100);
    setQuizScore(finalScore);
    setQuizSubmitted(true);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#fffef0] to-[#edece4] font-sans pb-16">
      
      {/* HEADER HERO AREA */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 text-white py-12 px-6 shadow-md border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-orange-600 text-slate-905 font-black text-[10px] tracking-wider uppercase rounded-full">
                Interactive Portal
              </span>
              <span className="text-xs text-orange-400 font-bold tracking-widest">SMK AR ROSYID</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-2">
              <GraduationCap className="text-orange-500 w-9 h-9" />
              {isRoleLocked
                ? (initialSubTab === 'siswa' ? 'E-Learning Portal Siswa' : 'E-Learning Portal Guru')
                : 'E-Learning & Kelas Digital'
              }
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-2 max-w-2xl leading-relaxed">
              Platform pembelajaran digital modular masa kini. Dapatkan akses materi diktat guru, kuis interaktif, upload pengumpulan tugas praktikum TKJ dan BDP, serta pantau nilai secara transparan.
            </p>
          </div>

          {/* ROLE SELECT PANEL — hanya tampil kalau tidak dikunci dari navigasi */}
          {!isRoleLocked ? (
            <div className="bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800 flex gap-2">
              <button
                onClick={() => { setActiveRole("siswa"); setSelectedCourse(null); }}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-[11px] tracking-wider transition-all cursor-pointer uppercase flex items-center gap-1.5 ${
                  activeRole === "siswa"
                    ? "bg-gradient-to-r from-yellow-250 to-stone-150 text-slate-950 border border-yellow-300 shadow-md animate-pulse"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users size={14} className="text-amber-800" /> Portal Siswa
              </button>
              <button
                onClick={() => { setActiveRole("guru"); setSelectedCourse(null); setIsAuthenticatedGuru(false); }}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-[11px] tracking-wider transition-all cursor-pointer uppercase flex items-center gap-1.5 ${
                  activeRole === "guru"
                    ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-yellow-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Lock size={14} /> Portal Guru
              </button>
            </div>
          ) : (
            /* Badge role dikunci */
            <div className={`px-5 py-2.5 rounded-2xl border font-extrabold text-[11px] tracking-wider uppercase flex items-center gap-2 ${
              activeRole === "siswa"
                ? "bg-yellow-100/20 border-yellow-300 text-yellow-300"
                : "bg-slate-800/50 border-slate-600 text-slate-300"
            }`}>
              {activeRole === "siswa"
                ? <><Users size={14} className="text-amber-400" /> Portal Siswa</>
                : <><Lock size={14} className="text-slate-400" /> Portal Guru & Staff</>
              }
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* ==============================================
             PORTAL SISWA / siswa SCREEN
           ============================================== */}
        {activeRole === "siswa" && (
          <div>
            {!isAuthenticatedSiswa ? (
              /* LOGIN SISWA SCREEN */
              <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-150 p-8 shadow-xl mt-12 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-gradient-to-tr from-yellow-101 to-stone-101 border border-yellow-200 rounded-2xl flex items-center justify-center p-3 mx-auto shadow shadow-yellow-500/10">
                    <BookOpen className="text-amber-800 w-9 h-9" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Masuk Kelas Digital siswa</h2>
                  <p className="text-[11px] text-slate-500 font-bold leading-normal">
                    Silakan masukkan nama lengkap dan Nomor Induk Siswa Nasional (NISN) Anda untuk mengakses materi kelas.
                  </p>
                </div>

                <form onSubmit={handleSiswaLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">NAMA LENGKAP siswa</label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full p-3 text-xs font-semibold text-slate-800 border-2 border-slate-100 rounded-xl focus:border-yellow-500 focus:outline-none"
                      placeholder="Masukkan nama lengkap..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">NISN / ID SISWA (10 DIGIT)</label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      value={studentNisn}
                      onChange={(e) => setStudentNisn(e.target.value.replace(/\D/g, ""))}
                      className="w-full p-3 font-mono text-xs font-semibold text-slate-800 border-2 border-slate-100 rounded-xl focus:border-yellow-500 focus:outline-none"
                      placeholder="Contoh: 0078123456"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginSiswaLoading}
                    className="w-full py-3 bg-gradient-to-r from-yellow-250 to-stone-105 hover:from-yellow-300 hover:to-stone-200 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl border border-yellow-350/50 transition cursor-pointer shadow flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {loginSiswaLoading ? <><Loader2 size={14} className="animate-spin" /> Memeriksa...</> : <>Masuk Portal Belajar <ChevronRight size={14} className="text-amber-700" /></>}
                  </button>
                </form>

                <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-2.5">
                  <Sparkles size={14} className="text-orange-600 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-orange-950 font-semibold leading-relaxed">
                    Sistem ini terintegrasi secara dinamis. Anda bisa langsung mencoba memasukkan nama apa saja untuk mensimulasikan upload berkas tugas / tes kuis.
                  </span>
                </div>
              </div>
            ) : (
              /* DASHBOARD SISWA */
              <div className="space-y-8">
                {/* WELCOME BAR */}
                <div className="bg-white rounded-2xl p-6 border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                      <GraduationCap className="text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-none">Hai, {studentName.toUpperCase()}</h2>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                        <span>Siswa siswa</span> | <span className="font-mono">NISN: {studentNisn}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setIsAuthenticatedSiswa(false); setStudentKelas(''); setStudentJurusan(''); }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer"
                    >
                      Keluar Portal
                    </button>
                  </div>
                </div>

                {/* MAIN SECTION: COURSES GRID */}
                {!selectedCourse ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Mata Pelajaran Anda</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {studentKelas
                          ? `Menampilkan mata pelajaran untuk Kelas ${studentKelas}${studentJurusan ? ` - ${studentJurusan}` : ''}`
                          : 'Berikut daftar ruang kelas mata pelajaran digital aktif.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses
                        .filter(course => {
                          // Filter berdasarkan kelas siswa
                          if (!studentKelas) return true; // Kalau kelas tidak diketahui, tampilkan semua
                          const kelasMatch = course.grade === studentKelas || course.grade === 'ALL';
                          // Filter berdasarkan jurusan siswa
                          const jurusanMap: Record<string, string[]> = {
                            'TKJ': ['TKJ', 'ALL'],
                            'PEMASARAN': ['BDP', 'ALL'],
                            'UMUM': ['ALL'],
                          };
                          const jurusanAllowed = !studentJurusan || (jurusanMap[studentJurusan] || ['ALL']).includes(course.major);
                          return kelasMatch && jurusanAllowed;
                        })
                        .map((course) => {
                        // Count completed submissions in this course
                        const subInCourse = submissions.filter(s => s.courseId === course.id && s.studentNisn === studentNisn);
                        
                        return (
                          <div 
                            key={course.id}
                            className="bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between"
                          >
                            <div className="p-6 space-y-4">
                              <div className="flex justify-between items-start">
                                <span className={`px-2.5 py-1 text-[9px] font-black tracking-wider uppercase rounded-md ${
                                  course.major === "TKJ" 
                                    ? "bg-sky-50 text-sky-800 border border-sky-200" 
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}>
                                  Keahlian: {course.major}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono font-bold">{course.code}</span>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-black text-base text-slate-900">{course.title}</h4>
                                <p className="text-[10px] text-slate-400 font-bold">Pengampu: {course.teacher}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-2 bg-slate-50 rounded-xl text-center border border-slate-100">
                                  <span className="text-[14px] font-black text-slate-800 block">{course.modules.length}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Materi Belajar</span>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-xl text-center border border-slate-100">
                                  <span className="text-[14px] font-black text-slate-800 block">{course.assignments.length}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Tugas Aktif</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex justify-between items-center">
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                                <CheckCircle size={12} />
                                {subInCourse.length}/{course.assignments.length} Selesai
                              </span>
                              <button
                                onClick={() => setSelectedCourse(course)}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm shadow-orange-500/10"
                              >
                                Buka Kelas
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* COURSE DETAIL ROOM */
                  <div className="space-y-6">
                    {/* BACK BUTTON ROW */}
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <ArrowLeft size={14} className="text-orange-500" />
                      Kembali Ke Panel Mapel
                    </button>

                    {/* BANNER MAPEL */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="md:col-span-2 space-y-2">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[9px] tracking-wider uppercase rounded-md inline-block">
                          Mata Pelajaran Aktif
                        </span>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">{selectedCourse.title}</h3>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          Kelas {selectedCourse.grade} | Kompetensi Utama Keahlian {selectedCourse.major} | Pengampu Akademis: <strong className="text-slate-800">{selectedCourse.teacher}</strong>
                        </p>
                      </div>

                      {/* STATS */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-around">
                        <div className="text-center">
                          <span className="text-2xl font-black text-orange-600 block">{selectedCourse.modules.length}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">MODUL</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="text-center">
                          <span className="text-2xl font-black text-indigo-600 block">{selectedCourse.assignments.length}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">TUGAS</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="text-center">
                          <button
                            onClick={startQuiz}
                            className="p-1 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[9px] uppercase rounded-xl transition cursor-pointer flex items-center gap-1"
                          >
                            <Award size={11} className="text-yellow-300" />
                            KUIS
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CONTEXT COLUMNS: MODULES & ASSIGNMENTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* LEFT: COURSE MODULES LIST */}
                      <div className="space-y-5 bg-white rounded-3xl border border-slate-150 p-6 shadow-sm">
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <BookOpen size={16} className="text-orange-500" />
                            Materi Ajar & Diktat Siswa
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pelajari bab pembahasan di bawah ini secara mandiri.</p>
                        </div>

                        {selectedCourse.modules.length === 0 ? (
                          <div className="text-center py-10 space-y-2">
                            <Bookmark className="mx-auto text-slate-300 animate-pulse" size={28} />
                            <p className="text-[11px] text-slate-400 font-bold">Materi ajar belum diunggah oleh guru.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedCourse.modules.map((mod, mIdx) => (
                              <div key={mod.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-orange-300 transition-colors space-y-3">
                                <div className="flex justify-between items-start">
                                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-extrabold text-[8px] tracking-wider uppercase rounded">
                                    BAB {mIdx + 1}
                                  </span>
                                  <span className="text-[8px] text-slate-400 font-semibold">{mod.dateAdded}</span>
                                </div>

                                <div className="space-y-1">
                                  <h5 className="font-extrabold text-xs text-slate-900">{mod.title}</h5>
                                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{mod.description}</p>
                                </div>

                                {/* Unduh Berkas File Materi */}
                                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 rounded-2xl border border-slate-150 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 px-2 bg-orange-50 text-orange-700 font-black text-[9px] rounded-lg border border-orange-100 uppercase tracking-widest text-center min-w-[50px]">
                                      {mod.fileName ? mod.fileName.split('.').pop()?.toUpperCase() : "PDF"}
                                    </div>
                                    <div className="text-left">
                                      <span className="text-[11px] text-slate-800 font-bold block truncate max-w-[200px]" title={mod.fileName || "Materi_Elearning.pdf"}>
                                        {mod.fileName || "Materi_Elearning.pdf"}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-semibold block">Berkas Lampiran Materi</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (mod.fileBase64) {
                                        // Kalau Storage URL (http/https) — buka di tab baru
                                        if (mod.fileBase64.startsWith('http')) {
                                          window.open(mod.fileBase64, '_blank');
                                        } else {
                                          // base64 — download langsung
                                          const a = document.createElement("a");
                                          a.href = mod.fileBase64;
                                          a.download = mod.fileName || "Materi_Elearning.pdf";
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                        }
                                      } else {
                                        const dummyText = `Materi: ${mod.title}\nDeskripsi: ${mod.description}\n\nSMK Ar Rosyid Portal E-Learning.`;
                                        const blob = new Blob([dummyText], { type: "text/plain" });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = mod.fileName || `${mod.title.replace(/\s+/g, "_")}.txt`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                      }
                                    }}
                                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-[10px] uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                  >
                                    <Download size={12} />
                                    {mod.fileBase64?.startsWith('http') ? 'Buka File' : 'Unduh Materi'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* RIGHT: COURSE ASSIGNMENTS & UPLOAD INBOX */}
                      <div className="space-y-5 bg-white rounded-3xl border border-slate-150 p-6 shadow-sm">
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <ClipboardList size={16} className="text-indigo-500" />
                            Tugas Kelas & Evaluasi Nilai
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Kerjakan tugas praktikum sesuai batas waktu tenggat akhir.</p>
                        </div>

                        {selectedCourse.assignments.length === 0 ? (
                          <div className="text-center py-10 space-y-2">
                            <CheckCircle className="mx-auto text-emerald-300 animate-pulse" size={28} />
                            <p className="text-[11px] text-slate-400 font-bold">Tidak ada tugas aktif di kelas ini. Bagus!</p>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {selectedCourse.assignments.map((asg) => {
                              // Check if submission exists
                              const submission = submissions.find(
                                s => s.assignmentId === asg.id && s.studentNisn === studentNisn
                              );

                              return (
                                <div key={asg.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                                    <h5 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
                                      {asg.title}
                                    </h5>
                                    <span className="text-[8px] bg-red-50 text-red-700 border border-red-200 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                      Tenggat: {asg.dueDate}
                                    </span>
                                  </div>

                                  <div className="text-[10px] text-slate-400 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                                    <span className="font-extrabold text-slate-900 block mb-1">💡 Petunjuk Pengerjaan:</span>
                                    {asg.instruction}
                                  </div>

                                  {/* SUBMISSION ACTION */}
                                  <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-3 rounded-xl border border-slate-100">
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Status Tugas:</span>
                                      {submission ? (
                                        <div className="space-y-1">
                                          <span className={`px-2 py-0.5 text-[8px] font-black rounded-lg ${
                                            submission.status === "DINILAI" 
                                              ? "bg-green-50 text-green-700 border border-green-200" 
                                              : "bg-amber-50 text-amber-700 border border-amber-200"
                                          }`}>
                                            {submission.status === "DINILAI" ? "TELAH DINILAI" : "MENUNGGU PENILAIAN"}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-semibold block mt-1 font-mono">File: {submission.fileName}</span>
                                        </div>
                                      ) : (
                                        <span className="text-[9px] text-rose-600 font-black uppercase">BELUM MENGUMPULKAN</span>
                                      )}
                                    </div>

                                    {/* UPLOAD FORM */}
                                    <div className="w-full sm:w-auto">
                                      {!submission || submission.status !== "DINILAI" ? (
                                        <div className="relative">
                                          <label htmlFor={`file-asg-${asg.id}`} className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[9px] uppercase tracking-wide rounded-xl transition flex items-center gap-1.5 justify-center">
                                            <Upload size={12} />
                                            {submission ? "Kirim Ulang File" : "Kumpulkan Berkas PDF"}
                                          </label>
                                          <input
                                            type="file"
                                            id={`file-asg-${asg.id}`}
                                            className="hidden"
                                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                            onChange={(e) => handleFileUpload(asg.id, selectedCourse.id, e)}
                                          />
                                        </div>
                                      ) : (
                                        // Show Scores
                                        <div className="text-center sm:text-right bg-emerald-50/50 p-2 border border-emerald-100 rounded-xl px-4">
                                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide block">NILAI ANDA</span>
                                          <span className="text-xl font-black text-emerald-600 font-mono block">{submission.grade} / 100</span>
                                          {submission.feedback && (
                                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 leading-tight max-w-[200px] italic">"{submission.feedback}"</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Simulated upload progress */}
                                  {uploadProgress[asg.id] !== undefined && uploadProgress[asg.id] < 100 && (
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1 animate-pulse">
                                      <div className="bg-orange-500 h-full" style={{ width: `${uploadProgress[asg.id]}%` }}></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* ==============================================
             PORTAL GURU / STAFF SCREEN 
           ============================================== */}
        {activeRole === "guru" && (
          <div>
            {!isAuthenticatedGuru ? (
              /* LOGIN GURU SCREEN (PIN OR PASS) */
              <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-150 p-8 shadow-xl mt-12 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center p-3 mx-auto shadow-md border border-orange-500/30">
                    <Lock className="text-orange-500 w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Login Portal Pengajar SMK</h2>
                  <p className="text-[11px] text-slate-400 font-bold leading-normal">
                    Masukkan Kode Keamanan / PIN Pengajar untuk menerbitkan materi pembelajaran, membuat evaluasi kuis, serta memberikan penilaian tugas siswa.
                  </p>
                </div>

                <form onSubmit={handleGuruLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">PIN GURU / KODE AKSES</label>
                    <input
                      type="password"
                      value={teacherPin}
                      onChange={(e) => setTeacherPin(e.target.value)}
                      className="w-full p-3 font-mono text-center text-xs font-semibold tracking-widest text-slate-800 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:outline-none"
                      placeholder="Masukkan PIN Pengajar..."
                    />
                    <span className="text-[9px] text-slate-400 font-bold block mt-1 text-center">Petunjuk: Bisa langsung dikosongkan/diisi apa saja untuk mempermudah penilaian.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loginGuruLoading}
                    className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {loginGuruLoading ? <><Loader2 size={14} className="animate-spin" /> Memeriksa...</> : <>Masuk Ruang Staff <ChevronRight size={14} className="text-orange-500" /></>}
                  </button>
                </form>
              </div>
            ) : (
              /* DASHBOARD GURU / STAFF UTAMA */
              <div className="space-y-8">
                {/* TEACHER BANNER */}
                <div className="bg-white rounded-2xl p-6 border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center border border-orange-200">
                      <Lock className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-none">Portal Guru / Pengampu Utama</h2>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">
                        Akses Kontrol Penuh Publikasi Materi, Penilaian, & Penugasan siswa SMK Ar Rosyid.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAuthenticatedGuru(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer"
                    >
                      Keluar Sesi
                    </button>
                  </div>
                </div>

                {/* GURU WORKSPACES: TAB LIST */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* LEFT COLUMN: PUBLISH MATERIAL & ASSIGNMENTS PANEL */}
                  <div className="space-y-6 lg:col-span-1">
                    {/* FORM ADD MODULE */}
                    <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <Plus size={16} className="text-orange-500" />
                          Terbitkan Materi Baru
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Unggah diktat rangkuman / berkas file materi (PDF, Word, PPT) untuk murid.</p>
                      </div>

                      <form onSubmit={handleAddModule} className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-400 uppercase tracking-widest block font-bold">PILIH MATA PELAJARAN</label>
                          <select
                            value={newModuleTargetCourse}
                            onChange={(e) => setNewModuleTargetCourse(e.target.value)}
                            required
                            className="w-full p-2.5 font-semibold text-slate-705 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Pilih Mata Pelajaran --</option>
                            {courses.map(c => (
                              <option key={c.id} value={c.id}>{c.title} ({c.major})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-400 uppercase tracking-widest block font-bold">JUDUL MATERI / TOPIK</label>
                          <input
                            type="text"
                            required
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none"
                            placeholder="Contoh: Pengenalan VLAN..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-400 uppercase tracking-widest block font-bold">DESKRIPSI / RANGKUMAN SINGKAT</label>
                          <textarea
                            rows={3}
                            required
                            value={newModuleDesc}
                            onChange={(e) => setNewModuleDesc(e.target.value)}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none"
                            placeholder="Deskripsi singkat materi..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-400 uppercase tracking-widest block font-bold">UNGGAH FILE MATERI (WORD, PDF, PPT)</label>
                          <div className={`relative border-2 border-dashed rounded-xl p-4.5 text-center transition cursor-pointer ${
                            isUploadingModule ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          }`}>
                            <input
                              type="file"
                              required
                              id="materi-file-upload"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                              onChange={handleModuleFileSelect}
                              disabled={isUploadingModule}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                            />
                            <div className="space-y-1.5">
                              {isUploadingModule ? (
                                <><Loader2 className="mx-auto text-amber-500 w-6 h-6 animate-spin" />
                                <p className="text-[11px] font-black text-amber-700">Mengupload ke cloud...</p></>
                              ) : (
                                <><Upload className="mx-auto text-orange-500 w-6 h-6" />
                                <p className="text-[11px] font-black text-slate-700">
                                  {newModuleFileName
                                    ? <><span className="text-emerald-600">✓</span> {newModuleFileName}</>
                                    : "Pilih / Seret Berkas ke Sini"}
                                </p></>
                              )}
                              <p className="text-[9px] text-slate-400">
                                {newModuleFileBase64?.startsWith('http') ? '✅ File tersimpan di Supabase Storage' : 'Word, PDF, atau PPT (Maks. 50MB)'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isUploadingModule}
                          className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isUploadingModule ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          {isUploadingModule ? 'Mengupload...' : 'Terbitkan Materi Sekolah'}
                        </button>
                      </form>
                    </div>

                    {/* FORM ADD ASSIGNMENTS */}
                    <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <ClipboardList size={16} className="text-indigo-500" />
                          Buat Tugas Kelas Baru
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Berikan tugas evaluasi atau praktikum digital berskala nilai.</p>
                      </div>

                      <form onSubmit={handleAddAssignment} className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-400 uppercase tracking-widest block font-bold">PILIH MATA PELAJARAN</label>
                          <select
                            value={newModuleTargetCourse}
                            onChange={(e) => setNewModuleTargetCourse(e.target.value)}
                            required
                            className="w-full p-2.5 font-semibold text-slate-705 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Pilih Mata Pelajaran --</option>
                            {courses.map(c => (
                              <option key={c.id} value={c.id}>{c.title} ({c.major})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-400 uppercase tracking-widest block font-bold">JUDUL TUGAS</label>
                          <input
                            type="text"
                            required
                            value={newAsgTitle}
                            onChange={(e) => setNewAsgTitle(e.target.value)}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none"
                            placeholder="Contoh: Praktikum LAN..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-400 uppercase tracking-widest block font-bold">INSTRUKSI PENGERJAAN TUGAS</label>
                          <textarea
                            rows={3}
                            required
                            value={newAsgInstruction}
                            onChange={(e) => setNewAsgInstruction(e.target.value)}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none"
                            placeholder="Tulis instruksi lengkap pengerjaan di sini..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-400 uppercase tracking-widest block font-bold">BATAS WAKTU TENGGAT (DUE DATE)</label>
                          <input
                            type="date"
                            required
                            value={newAsgDueDate}
                            onChange={(e) => setNewAsgDueDate(e.target.value)}
                            className="w-full p-2.5 font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={12} />
                          Terbitkan Tugas Baru
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: GRADING & LIST MATERIALS */}
                  <div className="space-y-6 lg:col-span-2">
                    
                    {/* A. MANAGE SUBMISSIONS CONTAINER */}
                    <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                            <Award size={16} className="text-yellow-500" />
                            Penilaian & Upload Tugas siswa
                          </h3>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">Beri nilai angka dan umpan balik langsung pada file yang diunggah siswa.</p>
                        </div>
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-black text-[8px] uppercase">
                          {submissions.length} Pengiriman Berkas
                        </span>
                      </div>

                      {submissions.length === 0 ? (
                        <div className="text-center py-12 space-y-2">
                          <CheckCircle className="mx-auto text-slate-300" size={32} />
                          <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                            Belum ada kiriman file tugas dari siswa siswa.<br />Silakan login sebagai Siswa pada Portal Sebelah untuk mencoba upload tugas.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {submissions.map((sub) => {
                            const mapel = courses.find(c => c.id === sub.courseId);
                            
                            return (
                              <div key={sub.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-2">
                                  <div className="flex gap-2 items-center flex-wrap">
                                    <span className="font-black text-[9px] text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded uppercase">
                                      {mapel?.title || "Mata Pelajaran"}
                                    </span>
                                    <span className={`text-[8px] font-black rounded px-1.5 py-0.5 ${
                                      sub.status === "DINILAI" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800 animate-pulse"
                                    }`}>
                                      {sub.status === "DINILAI" ? "SELESAI DINILAI" : "BUTUH DINILAI"}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <h4 className="font-extrabold text-[13px] text-slate-900">{sub.studentName}</h4>
                                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                                      <span className="font-mono">NISN: {sub.studentNisn}</span> | 
                                      <span>Tanggal: {sub.submittedAt}</span>
                                    </p>
                                    {sub.gradedBy && (
                                      <p className="text-[9px] text-emerald-700 font-bold flex items-center gap-1">
                                        ✓ Dinilai oleh: <span className="font-extrabold">{sub.gradedBy}</span>
                                        {sub.mataPelajaran && <span className="text-slate-400 font-medium"> · {sub.mataPelajaran}</span>}
                                        {sub.gradedAt && <span className="text-slate-400 font-normal"> · {new Date(sub.gradedAt).toLocaleDateString('id-ID')}</span>}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
                                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100">
                                      <FileText size={13} className="text-blue-500" />
                                      <span className="truncate max-w-[180px]" title={sub.fileName}>{sub.fileName}</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (sub.fileBase64) {
                                          // Storage URL — buka di tab baru
                                          if (sub.fileBase64.startsWith('http')) {
                                            window.open(sub.fileBase64, '_blank');
                                          } else {
                                            // base64 — download langsung
                                            const a = document.createElement("a");
                                            a.href = sub.fileBase64;
                                            a.download = sub.fileName;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                          }
                                        } else {
                                          const dummyText = `Dokumen Tugas: ${sub.studentName} (NISN: ${sub.studentNisn})\nFile: ${sub.fileName}\nDiserahkan: ${sub.submittedAt}\n\nSMK Ar Rosyid Portal E-Learning.`;
                                          const blob = new Blob([dummyText], { type: "text/plain" });
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement("a");
                                          a.href = url;
                                          a.download = sub.fileName.includes('.') ? sub.fileName : `${sub.fileName}.txt`;
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);                                          URL.revokeObjectURL(url);
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-[9px] uppercase rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
                                    >
                                      <Download size={11} />
                                      Unduh Tugas
                                    </button>
                                  </div>
                                </div>

                                {/* GRADE ENGINE */}
                                <div className="flex gap-2 flex-col sm:flex-row items-end md:items-center bg-white p-3 rounded-xl border border-slate-100 w-full md:w-auto">
                                  {sub.status === "BELUM_DINILAI" ? (
                                    <div className="flex gap-2 items-center w-full sm:w-auto">
                                      <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 block uppercase">Nilai (0-100)</label>
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          required
                                          onChange={(e) => setGradeInput({ ...gradeInput, [sub.id]: parseInt(e.target.value, 10) })}
                                          className="w-16 p-1.5 text-center text-xs font-mono font-extrabold border border-slate-200 rounded"
                                          placeholder="A+"
                                        />
                                      </div>
                                      <div className="space-y-1 flex-1 sm:w-36">
                                        <label className="text-[8px] font-black text-slate-400 block uppercase">Catatan Evaluasi</label>
                                        <input
                                          type="text"
                                          onChange={(e) => setFeedbackInput({ ...feedbackInput, [sub.id]: e.target.value })}
                                          className="p-1.5 text-[10px] w-full font-semibold border border-slate-200 rounded"
                                          placeholder="Bagus, topologi rapi..."
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleSaveGrade(sub.id)}
                                        className="h-9 px-3 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-[9px] uppercase rounded transition flex items-center gap-1"
                                      >
                                        Simpan
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-4">
                                      <div className="text-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                                        <span className="text-[8px] text-slate-400 font-extrabold block uppercase">NILAI</span>
                                        <span className="text-sm font-black text-green-700 font-mono">{sub.grade}</span>
                                      </div>
                                      <div className="text-sm">
                                        <span className="text-[8px] text-slate-400 font-extrabold block uppercase">CATATAN</span>
                                        <span className="text-[10px] text-slate-600 font-medium italic block max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">"{sub.feedback || '-'}"</span>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setSubmissions(prev => prev.map(s => {
                                            if (s.id === sub.id) {
                                              return { ...s, status: "BELUM_DINILAI" };
                                            }
                                            return s;
                                          }));
                                        }}
                                        className="text-[8px] text-blue-600 hover:underline font-bold"
                                      >
                                        Ubah Nilai
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* B. LIST MATERI AKTIF UNTUK EDIT / DELETE */}
                    <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <BookOpen size={16} className="text-orange-500" />
                          Daftar Pembahasan & Materi Aktif
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Kelola diktat belajar atau hapus berkas kurikulum lama yang tidak relevan.</p>
                      </div>

                      <div className="space-y-4">
                        {courses.map(course => (
                          <div key={course.id} className="space-y-2">
                            <h4 className="text-xs font-black text-slate-900 border-l-2 border-orange-500 pl-2">
                              {course.title} ({course.modules.length} Materi)
                            </h4>
                            
                            {course.modules.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic pl-3">Belum ada materi terbit.</p>
                            ) : (
                              <div className="pl-3 space-y-1.5">
                                {course.modules.map(mod => (
                                  <div key={mod.id} className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs">
                                    <span className="font-semibold text-slate-700">{mod.title}</span>
                                    <button
                                      onClick={() => deleteModule(course.id, mod.id)}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ==============================================
           VIDEO PLAYER LIGHTBOX PREVIEW MODAL
         ============================================== */}
      {currentVideoSrc && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-100 space-y-2">
            <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[8px] bg-orange-600 text-white font-extrabold px-1 py-0.5 rounded text-center">Video Kuliah</span>
                <h4 className="text-xs font-bold truncate max-w-sm">{currentVideoTitle}</h4>
              </div>
              <button
                onClick={() => setCurrentVideoSrc(null)}
                className="p-1 px-3 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase rounded-lg cursor-pointer transition"
              >
                Tutup
              </button>
            </div>
            {/* Real HTML5 responsive video player with fallback stock or simple loops */}
            <div className="aspect-video bg-neutral-950 flex items-center justify-center relative">
              <video 
                src={currentVideoSrc} 
                className="w-full h-full object-cover"
                controls 
                autoPlay
                loop
                onError={(e) => {
                  console.log("Fallback loop as simple sample loop");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
           DYNAMIC REVOLUTIONARY INTERACTIVE QUIZ MODAL
         ============================================== */}
      {isQuizActive && selectedCourse && (
        <div className="fixed inset-0 bg-slate-950/70 overflow-y-auto flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-6 justify-between flex items-center border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="font-black text-base flex items-center gap-1.5 text-yellow-300">
                  <Star size={16} />
                  Kuis Harian Evaluasi Mandiri
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">Mata Pelajaran: {selectedCourse.title}</p>
              </div>
              <button
                onClick={() => setIsQuizActive(false)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase rounded-xl transition"
              >
                Keluar Kuis
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {!quizSubmitted ? (
                /* QUIZ START & SELECTION */
                <div className="space-y-6">
                  {QUIZ_QUESTIONS.map((q, idx) => (
                    <div key={q.id} className="space-y-2 border-b border-slate-100 last:border-0 pb-4">
                      <h4 className="font-extrabold text-xs text-slate-900 leading-normal flex items-start gap-1">
                        <span>{idx + 1}.</span>
                        <span>{q.question}</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => setUserAnswers({ ...userAnswers, [q.id]: oIdx })}
                            className={`p-3 text-left rounded-xl border text-xs transition duration-200 cursor-pointer ${
                              userAnswers[q.id] === oIdx 
                                ? "border-indigo-500 bg-indigo-50 text-indigo-950 font-extrabold ring-1 ring-indigo-400/50" 
                                : "border-slate-150 hover:bg-slate-50 text-slate-600 font-semibold"
                            }`}
                          >
                            <span className="font-mono text-indigo-500 font-extrabold mr-1">{["A.", "B.", "C.", "D."][oIdx]}</span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={submitQuiz}
                      className="px-6 py-2.5 bg-gradient-to-r from-yellow-200 to-stone-100 hover:from-yellow-300 hover:to-stone-200 text-slate-950 font-black text-xs uppercase rounded-xl border border-yellow-300 transition cursor-pointer shadow flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} />
                      Kirim Jawaban Kuis
                    </button>
                  </div>
                </div>
              ) : (
                /* QUIZ COMPLETED / RESULTS SCREEN */
                <div className="text-center space-y-6 py-6 animate-fade-in">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-2 border-amber-300">
                    <Award size={40} className="text-amber-500 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-900">Selamat! Kuis Selesai.</h4>
                    <p className="text-xs text-slate-500 font-semibold">Berikut ringkasan performa pengerjaan Anda:</p>
                  </div>

                  {/* SCORE DISPLAY */}
                  <div className="max-w-[200px] mx-auto bg-slate-50 p-4 border border-slate-100 rounded-3xl">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">SKOR ANDA</span>
                    <span className={`text-4xl font-black font-mono block ${quizScore && quizScore >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                      {quizScore}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">Evaluasi Kompetensi Mandiri</span>
                  </div>

                  {/* MINI EXPLANATION REVIEW */}
                  <div className="space-y-4 text-left border-t border-slate-100 pt-5">
                    <h5 className="font-black text-xs text-slate-900 flex items-center gap-1">
                      <Star size={13} className="text-yellow-500" />
                      Pembahasan Jawaban:
                    </h5>
                    <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2">
                      {QUIZ_QUESTIONS.map((q, idx) => {
                        const isCorrect = userAnswers[q.id] === q.correct;
                        return (
                          <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-bold text-slate-800 leading-normal">
                              <span>{idx + 1}. {q.question}</span>
                            </p>
                            <p className="text-[9px] font-semibold leading-normal">
                              Status: <span className={isCorrect ? "text-emerald-600 font-black" : "text-rose-600 font-black"}>
                                {isCorrect ? "✓ Benar" : "✗ Salah"}
                              </span> | Kunci Jawaban: <span className="font-bold text-indigo-600">{q.options[q.correct]}</span>
                            </p>
                            <p className="text-[8.5px] text-slate-400 font-medium leading-relaxed italic mt-0.5">"{q.explanation}"</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={startQuiz}
                      className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      Ulangi Kuis
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuizActive(false)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase rounded-xl transition cursor-pointer"
                    >
                      Tutup Beranda
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
