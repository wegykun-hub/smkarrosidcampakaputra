import React, { useState, useEffect } from "react";
import { 
  Network, TrendingUp, Award, BookOpen, Users, CheckCircle, 
  ArrowRight, ChevronLeft, ChevronRight, Calendar, Building, 
  GraduationCap, Briefcase, FileText, Sparkles, MapPin, CheckSquare, Laptop
} from "lucide-react";
import { JURUSAN_DETAILS, NEWS_DATA, SAMBUTAN_KEPALA_SEKOLAH, VISI_MISI } from "../data";
import { NewsItem, DashboardSlide, GeneralSettings } from "../types";

interface HomeProps {
  setTab: (tab: string, subTab?: string) => void;
  onNewsClick: (news: NewsItem) => void;
  newsList?: NewsItem[];
  slidesList?: DashboardSlide[];
  settings?: GeneralSettings;
}

export default function Home({ setTab, onNewsClick, newsList = NEWS_DATA, slidesList = [], settings }: HomeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultSlides = [
    {
      id: "slide-1",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600",
      title: "Selamat Datang di SMK Ar Rosyid Campaka Putra",
      subtitle: "Mewujudkan Pendidikan Kejuruan Berkarakter Islami, Unggul, Kompeten, & Berorientasi Industri Modern.",
      actionText: "Daftar SPMB Online 2026/2027",
      actionSub: "formulir"
    },
    {
      id: "slide-2",
      image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1600",
      title: "Unggul Terdepan dalam Teknologi Komputer TKJ",
      subtitle: "Didukung sertifikasi industri internasional Mikrotik Academy, menguasai infrastruktur jaringan masa depan.",
      actionText: "Pelajari Jurusan TKJ",
      actionSub: "jurusan"
    },
    {
      id: "slide-3",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600",
      title: "Inovatif & Kreatif Bersama Bisnis Daring & Pemasaran",
      subtitle: "Membentuk sosiopreneur handal yang piawai mengelola e-commerce, live streams, dan strategi branding.",
      actionText: "Pelajari Jurusan Pemasaran",
      actionSub: "jurusan"
    }
  ];

  const slides = slidesList.length > 0 ? slidesList : defaultSlides;


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const quickLinks = [
    { title: "Tentang Kami",       desc: "Visi, Misi & Profil",      icon: Building,     tab: "tentang",  subTab: "visi-misi" },
    { title: "Pendaftaran (SPMB)", desc: "Formulir Online Baru",      icon: GraduationCap,tab: "spmb",     subTab: "formulir" },
    { title: "E-Learning Kelas",   desc: "Portal Tugas & Kuis",       icon: Laptop,       tab: "elearning",subTab: "siswa" },
    { title: "Program Jurusan",    desc: "TKJ & Pemasaran",           icon: BookOpen,     tab: "akademik", subTab: "jurusan" },
    { title: "Kegiatan & Prestasi",desc: "Aktivitas Ekstrakurikuler", icon: Award,        tab: "akademik", subTab: "kegiatan" },
  ];

  const stats = [
    { value: "100+", label: "Siswa Aktif", icon: Users },
    { value: "2", label: "Jurusan Favorit", icon: BookOpen },
    { value: "15+", label: "Guru & Staf Ahli", icon: Award },
    { value: "10+", label: "DUDIKA Mitra Industri", icon: Briefcase },
  ];

  return (
    <div className="w-full bg-orange-grid pb-12 font-sans">
      
      {/* 1. Hero Slideshow */}
      <div className="relative w-full h-[44vh] md:h-[65vh] overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute', inset: 0,
              opacity: idx === currentSlide ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              zIndex: idx === currentSlide ? 1 : 0,
              willChange: 'opacity',
            }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
              loading={idx === 0 ? "eager" : "lazy"}
            />
            {/* Gradient: lebih gelap di tengah-bawah agar teks terbaca */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.15) 0%, rgba(2,6,23,0.5) 45%, rgba(2,6,23,0.85) 100%)' }} />
            
            {/* Teks di bawah slide — mobile & desktop */}
            <div
              className="absolute inset-0 flex flex-col justify-end px-5 md:pl-8 md:pr-16 text-white md:pb-[3%] pb-[8%]"
              style={{ zIndex: 2, maxWidth: '900px' }}
            >
              <span className="text-amber-400 font-bold tracking-widest text-[9px] md:text-sm uppercase flex items-center gap-1.5 mb-2 bg-black/30 w-fit px-2.5 py-0.5 md:py-1 rounded-full border border-orange-500/60">
                <Sparkles size={10} />
                Dunia Pendidikan Vokasi Unggulan
              </span>
              <h1 className="text-xl md:text-5xl font-black tracking-tight leading-tight mb-2 md:mb-3 drop-shadow text-white line-clamp-3 md:line-clamp-none">
                {slide.title}
              </h1>
              <p className="text-[10px] md:text-lg text-slate-200 mb-3 md:mb-6 max-w-3xl drop-shadow leading-relaxed hidden md:block">
                {slide.subtitle}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTab("spmb", slide.actionSub)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-[10px] md:text-sm px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-md transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                >
                  {slide.actionText}
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Arrows — desktop only */}
        <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-orange-600 text-white rounded-full p-2.5 z-30 transition cursor-pointer hidden md:flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-orange-600 text-white rounded-full p-2.5 z-30 transition cursor-pointer hidden md:flex items-center justify-center">
          <ChevronRight size={20} />
        </button>

        {/* Dots — di bawah slide */}
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
          {slides.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? "bg-amber-400 w-5" : "bg-white/40 w-1.5"}`}
            />
          ))}
        </div>
      </div>

      {/* 2. Quick Links — mobile: di bawah slide (tidak overlap), desktop: overlap sedikit */}
      <div className="max-w-7xl mx-auto px-3 mt-5 md:mt-8 md:pl-8 relative z-30">
        {/* Mobile: horizontal scroll row */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 md:hidden no-scrollbar snap-x snap-mandatory">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <button
                key={idx}
                onClick={() => setTab(link.tab, link.subTab)}
                className="snap-start shrink-0 flex flex-col items-center gap-1.5 bg-white rounded-2xl px-4 py-3 shadow border border-slate-200 cursor-pointer active:scale-95 transition-all min-w-[80px]"
              >
                <Icon size={22} className="text-slate-700" />
                <span className="text-[9px] font-black text-slate-800 text-center leading-tight tracking-tight">
                  {link.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop: grid normal */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-4">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <div
                key={idx}
                onClick={() => setTab(link.tab, link.subTab)}
                className="bg-white rounded-2xl p-5 shadow-xl border border-slate-200 flex items-center gap-4 cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300 group hover:border-slate-400"
              >
                <Icon size={26} className="text-slate-700 group-hover:text-slate-900 transition-colors shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight group-hover:text-slate-700 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {link.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Welcome Section & Vision / Mission Banner */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 mt-2 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-stretch">
        
        {/* Sambutan Kepala Sekolah */}
        <div className="lg:col-span-7 bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm md:shadow-md border border-amber-100/80 flex flex-col justify-between">
          <div>
            <div className="border-l-4 border-orange-500 pl-3 md:pl-4 mb-3 md:mb-4">
              <span className="text-orange-600 font-extrabold text-[10px] tracking-widest uppercase block">
                SAMBUTAN HANGAT
              </span>
              <h2 className="text-base md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Kepala SMK Ar Rosyid Campaka Putra
              </h2>
            </div>

            {/* Mobile: foto di atas, teks penuh di bawah */}
            <div className="flex flex-col gap-3 mt-3 md:hidden">
              {/* Foto lebih besar di mobile */}
              <div className="w-full max-w-[160px] mx-auto">
                <div className="relative rounded-2xl overflow-hidden border-2 border-orange-100 shadow aspect-[3/4]">
                  <img
                    src={settings?.sambutanKepalaFoto || settings?.sambutanFoto || SAMBUTAN_KEPALA_SEKOLAH.foto}
                    alt={settings?.sambutanKepalaNama || settings?.sambutanNama || SAMBUTAN_KEPALA_SEKOLAH.nama}
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white p-2 text-center text-[9px] font-black tracking-wide leading-tight">
                    {settings?.sambutanKepalaNama || settings?.sambutanNama || SAMBUTAN_KEPALA_SEKOLAH.nama}
                  </div>
                </div>
              </div>
              {/* Teks sambutan penuh — tidak di-clamp */}
              <div className="text-slate-700 text-xs leading-relaxed font-medium whitespace-pre-line">
                {settings?.sambutanKepalaIsi || settings?.sambutanIsi || SAMBUTAN_KEPALA_SEKOLAH.isi}
              </div>
            </div>

            {/* Desktop: foto di kiri, teks di kanan */}
            <div className="hidden md:flex gap-6 mt-6 items-start">
              <div className="shrink-0 w-1/3">
                <div className="relative rounded-2xl overflow-hidden border-4 border-orange-100 shadow-md aspect-[3/4]">
                  <img
                    src={settings?.sambutanKepalaFoto || settings?.sambutanFoto || SAMBUTAN_KEPALA_SEKOLAH.foto}
                    alt={settings?.sambutanKepalaNama || settings?.sambutanNama || SAMBUTAN_KEPALA_SEKOLAH.nama}
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white p-2.5 text-center text-[10px] font-black tracking-wide">
                    {settings?.sambutanKepalaNama || settings?.sambutanNama || SAMBUTAN_KEPALA_SEKOLAH.nama}
                  </div>
                </div>
              </div>
              <div className="text-slate-600 text-sm leading-relaxed space-y-3 whitespace-pre-line font-medium">
                {settings?.sambutanKepalaIsi || settings?.sambutanIsi || SAMBUTAN_KEPALA_SEKOLAH.isi}
              </div>
            </div>
          </div>
          
          <div className="border-t border-orange-50 mt-4 pt-3 flex justify-between items-center bg-orange-50/50 p-2.5 md:p-3 rounded-xl">
            <span className="text-[10px] md:text-xs font-bold text-slate-700 hidden sm:block">Tertarik bergabung dengan kami?</span>
            <button 
              onClick={() => setTab("spmb", "formulir")}
              className="bg-slate-900 text-amber-400 font-black text-[10px] md:text-xs px-3 md:px-4 py-2 rounded-lg hover:bg-orange-600 hover:text-white transition duration-300 cursor-pointer w-full sm:w-auto text-center"
            >
              Mulai Pendaftaran Online
            </button>
          </div>
        </div>

        {/* Visi & Misi — mobile: compact accordion style */}
        <div className="lg:col-span-5 flex flex-col gap-3 md:gap-6">
          {/* Visi Card */}
          <div className="bg-gradient-to-br from-yellow-100 to-stone-100 text-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm md:shadow-md relative overflow-hidden border border-yellow-200">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-300/10 rounded-full blur-2xl"></div>
            <div className="bg-yellow-200/50 text-amber-900 border border-amber-200/80 w-fit px-2.5 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-extrabold tracking-widest mb-2 uppercase flex items-center gap-1.5">
              <Sparkles size={10} className="text-amber-700" /> VISI SEKOLAH
            </div>
            <p className="font-serif italic text-[11px] md:text-base leading-relaxed text-slate-800 line-clamp-3 md:line-clamp-none">
              "{settings?.visiText || settings?.visiSekolah || VISI_MISI.visi}"
            </p>
            
            {/* Keunggulan — hidden di mobile */}
            <div className="hidden md:block border-t border-slate-200 mt-4 pt-3">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-widest gap-2 flex items-center mb-1.5">
                <CheckSquare size={13} className="text-amber-700" /> Keunggulan Kompetitif
              </h4>
              <ul className="text-[11px] space-y-0.5 text-slate-600">
                <li className="flex items-center gap-1.5">✓ Integrasi Akhlak Islami & Kompetensi Ritel</li>
                <li className="flex items-center gap-1.5">✓ Penguasaan Praktis TKJ Mikrotik & Cisco</li>
                <li className="flex items-center gap-1.5">✓ Beasiswa KIP & Bebas DSP Siswa Kurang Mampu</li>
              </ul>
            </div>

            {/* Mobile keunggulan ringkas */}
            <div className="md:hidden flex flex-wrap gap-1.5 mt-2">
              {["Akhlak Islami", "TKJ Mikrotik", "Beasiswa KIP"].map(k => (
                <span key={k} className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200">✓ {k}</span>
              ))}
            </div>
          </div>

          {/* Misi Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm md:shadow-md border border-amber-100/70">
            <div className="bg-orange-50 text-orange-700 w-fit px-2.5 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black tracking-widest mb-2 md:mb-3.5 uppercase flex items-center gap-1.5 border border-orange-150">
              <Award size={10} /> MISI SEKOLAH
            </div>
            {/* Mobile: tampilkan 3 misi pertama saja */}
            <ul className="space-y-2 text-[10px] md:text-xs">
              {(settings?.misiList || VISI_MISI.misi).slice(0, 3).map((misiLine, idx) => (
                <li key={idx} className="flex gap-2 items-start">
                  <span className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-orange-100 text-orange-700 text-[9px] md:text-[10px] font-black rounded-full shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed text-slate-700 font-semibold">{misiLine}</span>
                </li>
              ))}
              {/* Lebih banyak misi hanya di desktop */}
              <div className="hidden md:contents">
                {(settings?.misiList || VISI_MISI.misi).slice(3).map((misiLine, idx) => (
                  <li key={idx + 3} className="flex gap-2 items-start">
                    <span className="flex items-center justify-center w-5 h-5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-full shrink-0 mt-0.5">
                      {idx + 4}
                    </span>
                    <span className="leading-relaxed text-slate-700 font-semibold">{misiLine}</span>
                  </li>
                ))}
              </div>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Statistics — compact di mobile */}
      <div className="mt-10 md:mt-16 bg-gradient-to-r from-yellow-100 to-stone-100 text-slate-800 py-7 md:py-12 px-4 md:px-6 shadow-sm border-y border-yellow-200 relative">
        <div className="max-w-7xl mx-auto relative z-20 grid grid-cols-4 gap-3 md:gap-8 text-center">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex flex-col items-center group">
                <div className="w-9 h-9 md:w-14 md:h-14 bg-yellow-250/30 rounded-xl md:rounded-2xl flex items-center justify-center border border-yellow-300/40 mb-1.5 md:mb-3 shadow-sm">
                  <Icon size={18} className="md:hidden text-amber-700" />
                  <Icon size={28} className="hidden md:block text-amber-700" />
                </div>
                <div className="text-xl md:text-5xl font-black tracking-tight font-mono text-slate-900">
                  {stat.value}
                </div>
                <div className="text-[9px] md:text-sm font-bold text-slate-500 tracking-wide uppercase mt-0.5 leading-tight">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Jurusan — minimalis di mobile */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 mt-10 md:mt-16">
        <div className="text-center max-w-2xl mx-auto mb-5 md:mb-10">
          <span className="text-orange-600 font-extrabold text-[10px] md:text-xs tracking-widest uppercase block mb-0.5">
            KOMPETENSI KEAHLIAN
          </span>
          <h2 className="text-lg md:text-3xl font-black text-slate-900 tracking-tight">
            Pilihan Program Studi Unggulan
          </h2>
          <p className="text-[11px] md:text-sm text-slate-500 mt-1 leading-relaxed hidden md:block">
            Materi produktif disusun bersama mitra industri terkemuka demi membekali siswa dengan kompetensi komputasi dan marketing modern.
          </p>
        </div>

        {/* Mobile: card compact horizontal */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {JURUSAN_DETAILS.map((jurusan) => {
            const Icon = jurusan.id === "tkj" ? Network : TrendingUp;
            return (
              <div
                key={jurusan.id}
                className="bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-sm flex"
              >
                {/* Left color strip */}
                <div className={`w-1.5 shrink-0 bg-gradient-to-b ${jurusan.color}`} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-orange-600 uppercase block">{jurusan.abbr}</span>
                      <h3 className="font-black text-sm text-slate-900 leading-tight">{jurusan.name}</h3>
                    </div>
                    <div className={`p-2 rounded-xl bg-gradient-to-r ${jurusan.color} text-white shrink-0`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-2 line-clamp-2">{jurusan.description}</p>
                  {/* Prospek chips */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {jurusan.prospek.slice(0, 2).map((job, i) => (
                      <span key={i} className="bg-orange-50 text-orange-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-orange-100">
                        {job}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setTab("akademik", "jurusan")}
                    className="text-orange-600 font-extrabold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    Selengkapnya <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: full card */}
        <div className="hidden md:grid grid-cols-2 gap-8 max-w-4xl mx-auto">
          {JURUSAN_DETAILS.map((jurusan) => {
            const Icon = jurusan.id === "tkj" ? Network : TrendingUp;
            return (
              <div
                key={jurusan.id}
                className="bg-white rounded-3xl overflow-hidden shadow-xl border border-orange-100 flex flex-col justify-between transform hover:-translate-y-2 transition-all duration-300 animate-fade-in"
              >
                <div className={`p-6 bg-gradient-to-r ${jurusan.color} text-white flex justify-between items-start`}>
                  <div>
                    <span className="bg-slate-950/20 px-3 py-1 rounded text-[10px] font-black tracking-widest block w-fit mb-2">
                      {jurusan.abbr}
                    </span>
                    <h3 className="font-black text-xl leading-snug">{jurusan.name}</h3>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-inner">
                    <Icon size={24} />
                  </div>
                </div>
                <div className="p-8 flex-grow">
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{jurusan.description}</p>
                  <div className="mb-6">
                    <h4 className="text-slate-900 text-xs font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-orange-500" /> Materi Unggulan:
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-1 pl-1">
                      {jurusan.materi.slice(0, 3).map((mat, i) => (
                        <li key={i} className="flex gap-2"><span className="text-amber-500 font-bold">•</span><span>{mat}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-slate-900 text-xs font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-orange-500" /> Prospek Lulusan:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {jurusan.prospek.slice(0, 3).map((job, i) => (
                        <span key={i} className="bg-orange-50 text-orange-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-orange-100">{job}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-orange-50 bg-orange-50/20 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">{jurusan.tagline}</span>
                  <button onClick={() => setTab("akademik", "jurusan")} className="text-orange-600 hover:text-orange-700 font-extrabold text-xs flex items-center gap-1 group cursor-pointer">
                    Selengkapnya <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. News Highlights — mobile: list compact, desktop: grid */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 mt-10 md:mt-20">
        <div className="flex justify-between items-center border-b border-orange-100 pb-3 md:pb-4 mb-4 md:mb-8 gap-3">
          <div>
            <span className="text-orange-600 font-extrabold text-[9px] md:text-xs tracking-widest uppercase block">
              MEDIA CENTER
            </span>
            <h2 className="text-base md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Berita & Pengumuman
            </h2>
          </div>
          <button
            onClick={() => setTab("berita")}
            className="bg-slate-900 hover:bg-orange-600 text-white font-bold text-[10px] md:text-xs px-3 md:px-5 py-2 md:py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow shrink-0"
          >
            Semua <ArrowRight size={12} />
          </button>
        </div>

        {/* Mobile: list vertical compact */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {newsList.slice(0, 3).map((news) => (
            <div
              key={news.id}
              onClick={() => onNewsClick(news)}
              className="bg-white rounded-xl border border-orange-100/60 cursor-pointer active:scale-[0.98] transition-all flex gap-3 p-3 shadow-sm"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                <img
                  src={news.image}
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[8px] font-black text-orange-600 uppercase tracking-wider">{news.category}</span>
                <h3 className="font-extrabold text-[11px] text-slate-900 leading-tight line-clamp-2 mt-0.5">{news.title}</h3>
                <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Calendar size={9} className="text-amber-500" /> {news.date}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: grid cards */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {newsList.slice(0, 3).map((news) => (
            <div
              key={news.id}
              onClick={() => onNewsClick(news)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100/60 cursor-pointer transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img src={news.image} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  <span className="absolute top-3 left-3 bg-orange-600 text-white font-extrabold text-[9px] tracking-widest uppercase px-2.5 py-1 rounded shadow-md">{news.category}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">
                    <Calendar size={11} className="text-amber-500" /> {news.date}
                  </div>
                  <h3 className="font-extrabold text-sm md:text-base text-slate-900 tracking-tight line-clamp-2">{news.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3">{news.excerpt}</p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-3 border-t border-orange-50 flex items-center justify-between text-xs font-bold text-orange-600">
                <span>Baca Selengkapnya</span>
                <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
