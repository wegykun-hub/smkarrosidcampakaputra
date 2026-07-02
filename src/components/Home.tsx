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
    {
      title: "Tentang Kami",
      desc: "Visi, Misi & Profil",
      icon: Building,
      color: "bg-red-500",
      tab: "tentang",
      subTab: "visi-misi"
    },
    {
      title: "Pendaftaran (SPMB)",
      desc: "Formulir Online Baru",
      icon: GraduationCap,
      color: "bg-amber-500",
      tab: "spmb",
      subTab: "formulir"
    },
    {
      title: "E-Learning Kelas",
      desc: "Portal Tugas & Kuis",
      icon: Laptop,
      color: "bg-indigo-600",
      tab: "elearning",
      subTab: "siswa"
    },
    {
      title: "Program Jurusan",
      desc: "TKJ & Pemasaran",
      icon: BookOpen,
      color: "bg-amber-500",
      tab: "akademik",
      subTab: "jurusan"
    },
    {
      title: "Kegiatan & Prestasi",
      desc: "Aktivitas Ekstrakurikuler",
      icon: Award,
      color: "bg-yellow-600",
      tab: "akademik",
      subTab: "kegiatan"
    }
  ];

  const stats = [
    { value: "100+", label: "Siswa Aktif", icon: Users },
    { value: "2", label: "Jurusan Favorit", icon: BookOpen },
    { value: "15+", label: "Guru & Staf Ahli", icon: Award },
    { value: "10+", label: "DUDIKA Mitra Industri", icon: Briefcase },
  ];

  return (
    <div className="w-full bg-orange-grid pb-12 animate-fade-in font-sans">
      
      {/* 1. Hero Slideshow Area with Orange/Yellow Gradient Overlay */}
      <div className="relative w-full h-[50vh] md:h-[65vh] bg-slate-900 overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000"
            />
            {/* Elegant Gradient Orange/Yellow Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-orange-900/40"></div>
            
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-5xl mx-auto z-25 text-white">
              <span className="text-amber-400 font-bold tracking-widest text-xs md:text-sm uppercase flex items-center gap-1.5 mb-2 bg-slate-900/40 w-fit px-3 py-1 rounded-full border border-orange-500">
                <Sparkles size={14} className="animate-spin-slow" />
                Dunia Pendidikan Vokasi Unggulan
              </span>
              <h1 className="text-2xl md:text-5xl font-black tracking-tight leading-tight mb-3 drop-shadow bg-gradient-to-r from-white via-amber-100 to-yellow-200 bg-clip-text text-transparent">
                {slide.title}
              </h1>
              <p className="text-xs md:text-lg text-slate-200 mb-6 max-w-3xl drop-shadow leading-relaxed">
                {slide.subtitle}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setTab("spmb", slide.actionSub)}
                  className="bg-gradient-to-r from-yellow-200 to-stone-100 hover:from-yellow-300 hover:to-stone-200 text-slate-900 border border-yellow-300/80 font-black text-xs md:text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-yellow-500/10 transition-all duration-300 flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  {slide.actionText}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Slideshow Arrow Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-orange-600 text-white rounded-full p-2.5 z-30 transition-transform hover:scale-110 cursor-pointer hidden md:block"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-orange-600 text-white rounded-full p-2.5 z-30 transition-transform hover:scale-110 cursor-pointer hidden md:block"
        >
          <ChevronRight size={20} />
        </button>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "bg-amber-400 w-8" : "bg-slate-400/50"
              }`}
            ></button>
          ))}
        </div>
      </div>

      {/* 2. Quick Links Section reminiscent of Universitas Suryakancana */}
      <div className="max-w-7xl mx-auto px-4 -translate-y-8 relative z-30">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <div
                key={idx}
                onClick={() => setTab(link.tab, link.subTab)}
                className="bg-white rounded-2xl p-5 shadow-xl border border-orange-100 flex items-center gap-4 cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div className={`p-4 rounded-2xl ${link.color} text-white shadow-md transform group-hover:rotate-6 transition-transform`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight group-hover:text-orange-600 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {link.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Welcome Section & Vision / Mission Banner */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Sambutan Kepala Sekolah */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-md border border-amber-100/80 flex flex-col justify-between">
          <div>
            <div className="border-l-4 border-orange-500 pl-4 mb-4">
              <span className="text-orange-600 font-extrabold text-xs tracking-widest uppercase block">
                SAMBUTAN HANGAT
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Kepala SMK Ar Rosyid Campaka Putra
              </h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 mt-6 items-start">
              <div className="w-full sm:w-1/3 shrink-0">
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
              <div className="text-slate-600 text-xs md:text-sm leading-relaxed space-y-3 whitespace-pre-line font-medium">
                {settings?.sambutanKepalaIsi || settings?.sambutanIsi || SAMBUTAN_KEPALA_SEKOLAH.isi}
              </div>
            </div>
          </div>
          
          <div className="border-t border-orange-50 mt-6 pt-4 flex justify-between items-center bg-orange-50/50 p-3 rounded-xl">
            <span className="text-xs font-bold text-slate-700">Tertarik bergabung dengan kami?</span>
            <button 
              onClick={() => setTab("spmb", "formulir")}
              className="bg-slate-900 text-amber-400 font-black text-xs px-4 py-2 rounded-lg hover:bg-orange-600 hover:text-white transition duration-300 cursor-pointer"
            >
              Mulai Pendaftaran Online
            </button>
          </div>
        </div>

        {/* Visi Mini Card & Misi Card + Keunggulan */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card Gradient Kuning-Putih representing beautiful Visi branding */}
          <div className="bg-gradient-to-br from-yellow-100 to-stone-100 text-slate-800 rounded-3xl p-6 shadow-md relative overflow-hidden border border-yellow-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300/10 rounded-full blur-2xl"></div>
            <div>
              <div className="bg-yellow-200/50 text-amber-900 border border-amber-200/80 w-fit px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest mb-3 uppercase flex items-center gap-1.5 animate-pulse">
                <Sparkles size={11} className="text-amber-700" /> VISI SEKOLAH
              </div>
              <p className="font-serif italic text-sm md:text-base leading-relaxed text-slate-800">
                "{settings?.visiText || settings?.visiSekolah || VISI_MISI.visi}"
              </p>
            </div>
            
            <div className="border-t border-slate-200 mt-4 pt-3">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-widest gap-2 flex items-center mb-1.5">
                <CheckSquare size={13} className="text-amber-700" /> Keunggulan Kompetitif
              </h4>
              <ul className="text-[11px] space-y-0.5 text-slate-600">
                <li className="flex items-center gap-1.5">✓ Integrasi Akhlak Islami & Kompetensi Ritel</li>
                <li className="flex items-center gap-1.5">✓ Penguasaan Praktis TKJ Mikrotik & Cisco</li>
                <li className="flex items-center gap-1.5">✓ Beasiswa KIP & Bebas DSP Siswa Kurang Mampu</li>
              </ul>
            </div>
          </div>

          {/* Misi Card below Visi */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-amber-100/70 flex flex-col justify-between">
            <div>
              <div className="bg-orange-50 text-orange-700 w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-widest mb-3.5 uppercase flex items-center gap-1.5 border border-orange-150">
                <Award size={11} /> MISI SEKOLAH
              </div>
              <ul className="space-y-3 text-[11px] md:text-xs">
                {(settings?.misiList || VISI_MISI.misi).map((misiLine, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <span className="flex items-center justify-center w-5 h-5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-full shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-slate-700 font-semibold">{misiLine}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Statistics Meter */}
      <div className="mt-16 bg-gradient-to-r from-yellow-100 to-stone-100 text-slate-800 py-12 px-6 shadow-sm border-y border-yellow-200 relative">
        <div className="absolute inset-0 bg-yellow-50/5"></div>
        <div className="max-w-7xl mx-auto relative z-20 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex flex-col items-center group">
                <div className="w-14 h-14 bg-yellow-250/30 rounded-2xl flex items-center justify-center border border-yellow-300/40 mb-3 transform group-hover:scale-110 transition shadow-sm">
                  <Icon size={28} className="text-amber-700" />
                </div>
                <div className="text-3xl md:text-5xl font-black tracking-tight font-mono text-slate-900">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm font-bold text-slate-500 tracking-wider uppercase mt-1">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Jurusan / Kompetensi Keahlian (TKJ & Pemasaran) */}
      <div className="max-w-7xl mx-auto px-4 mt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-orange-600 font-extrabold text-xs tracking-widest uppercase block mb-1">
            KOMPETENSI KEAHLIAN
          </span>
          <h2 className="text-2xl md:text-3.5xl font-black text-slate-900 tracking-tight">
            Pilihan Program Studi Unggulan
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2 leading-relaxed">
            Materi produktif disusun bersama mitra industri terkemuka demi membekali siswa dengan kompetensi komputasi dan marketing modern.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {JURUSAN_DETAILS.map((jurusan) => {
            const Icon = jurusan.id === "tkj" ? Network : TrendingUp;
            return (
              <div
                key={jurusan.id}
                className="bg-white rounded-3xl overflow-hidden shadow-xl border border-orange-100 flex flex-col justify-between transform hover:-translate-y-2 transition-all duration-300 animate-fade-in"
              >
                {/* Visual Header */}
                <div className={`p-6 bg-gradient-to-r ${jurusan.color} text-white flex justify-between items-start`}>
                  <div>
                    <span className="bg-slate-950/20 px-3 py-1 rounded text-[10px] font-black tracking-widest block w-fit mb-2">
                      {jurusan.abbr}
                    </span>
                    <h3 className="font-black text-lg md:text-xl leading-snug">
                      {jurusan.name}
                    </h3>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-inner">
                    <Icon size={24} />
                  </div>
                </div>

                <div className="p-6 md:p-8 flex-grow">
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-6">
                    {jurusan.description}
                  </p>

                  <div className="mb-6">
                    <h4 className="text-slate-900 text-xs font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-orange-500" /> Materi Unggulan:
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-1 pl-1">
                      {jurusan.materi.slice(0, 3).map((mat, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{mat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-slate-900 text-xs font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-orange-500" /> Prospek Lulusan:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {jurusan.prospek.slice(0, 3).map((job, i) => (
                        <span key={i} className="bg-orange-50 text-orange-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-orange-100">
                          {job}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-orange-50 bg-orange-50/20 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">{jurusan.tagline}</span>
                  <button
                    onClick={() => setTab("akademik", "jurusan")}
                    className="text-orange-600 hover:text-orange-700 font-extrabold text-xs flex items-center gap-1 group cursor-pointer"
                  >
                    Selengkapnya 
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. News Highlights */}
      <div className="max-w-7xl mx-auto px-4 mt-20">
        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-orange-100 pb-4 mb-8 gap-4">
          <div>
            <span className="text-orange-600 font-extrabold text-xs tracking-widest uppercase block">
              MEDIA CENTER
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Berita & Pengumuman Sekolah
            </h2>
          </div>
          <button
            onClick={() => setTab("berita")}
            className="bg-slate-900 hover:bg-orange-600 text-white hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            Lihat Semua Berita
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsList.slice(0, 3).map((news) => (
            <div
              key={news.id}
              onClick={() => onNewsClick(news)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100/60 cursor-pointer transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-orange-600 text-white font-extrabold text-[9px] tracking-widest uppercase px-2.5 py-1 rounded shadow-md">
                    {news.category}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">
                    <Calendar size={11} className="text-amber-500" />
                    {news.date}
                  </div>
                  <h3 className="font-extrabold text-sm md:text-base text-slate-900 tracking-tight group-hover:text-orange-600 line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                    {news.excerpt}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-3 border-t border-orange-50 flex items-center justify-between text-xs font-bold text-orange-600 hover:text-orange-700">
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
