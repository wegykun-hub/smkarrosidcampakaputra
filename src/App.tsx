import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import Home from "./components/Home";
import TentangSekolah from "./components/TentangSekolah";
import Akademik from "./components/Akademik";
import Spmb from "./components/Spmb";
import Berita from "./components/Berita";
import Lainnya from "./components/Lainnya";
import AdminPanel from "./components/AdminPanel";
import Absensi from "./components/Absensi";
import ELearning from "./components/ELearning";
import WhatsAppWidget from "./components/WhatsAppWidget";
import BottomNavBar from "./components/BottomNavBar";
import { CONTACT_INFO } from "./data";
import { NewsItem, RegistrationData, GalleryItem, DashboardSlide, GeneralSettings } from "./types";
import { getGeneralSettings } from "./utils/dataStore";
import {
  fetchNews, fetchGallery, fetchSlides, fetchGeneralSettings,
} from "./lib/services/contentService";
import { Award, Mail, Phone, MapPin, Sparkles, Building, Globe, ShieldCheck } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [subTab, setSubTab] = useState<string | undefined>(undefined);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>([]);
  const [slidesList, setSlidesList] = useState<DashboardSlide[]>([]);
  const [settings, setSettings] = useState<GeneralSettings>(getGeneralSettings());

  // Load semua konten dari Supabase saat mount
  useEffect(() => {
    fetchNews().then(setNewsList);
    fetchGallery().then(setGalleryList);
    fetchSlides().then(list => { if (list.length > 0) setSlidesList(list); });
    fetchGeneralSettings().then(s => {
      setSettings(s);
      // cache lokal agar komponen lain bisa akses via getGeneralSettings()
      localStorage.setItem('ar_rosyid_general_settings_v1', JSON.stringify(s));
    });
  }, []);

  // Auto-scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentTab, subTab]);

  const setTabAndSub = (tab: string, sub?: string) => {
    setCurrentTab(tab);
    setSubTab(sub);
    // If we clicked on News, clear current deep detailed view on news tab
    if (tab !== "berita") {
      setSelectedNews(null);
    }
  };

  const handleNewsItemClick = (news: NewsItem) => {
    setSelectedNews(news);
    setCurrentTab("berita");
  };

  const handleNewRegistrationSubmitted = (reg: RegistrationData) => {
    // We can do an immediate alert or success toast inside Spmb anyway
    console.log("New student registered online:", reg);
  };

  return (
    <div className="min-h-screen min-h-dvh bg-[#fffef0] flex flex-col justify-between font-sans selection:bg-orange-500 selection:text-white">
      
      {/* 1. BRAND NAVIGATION HEADER */}
      <Navigation 
        currentTab={currentTab} 
        setTab={setTabAndSub} 
        onOpenAdmin={() => setIsAdminOpen(true)} 
        settings={settings}
      />

      {/* 2. DYNAMIC SCREEN ROUTER SYSTEM */}
      <main className="flex-grow">
        {currentTab === "home" && (
          <Home 
            setTab={setTabAndSub} 
            onNewsClick={handleNewsItemClick}
            newsList={newsList} 
            slidesList={slidesList}
            settings={settings}
          />
        )}
        {currentTab === "tentang" && (
          <TentangSekolah 
            initialSubTab={subTab} 
            settings={settings}
          />
        )}
        {currentTab === "akademik" && (
          <Akademik 
            initialSubTab={subTab} 
          />
        )}
        {currentTab === "spmb" && (
          <Spmb 
            initialSubTab={subTab || "jadwal"} 
            onNewRegistration={handleNewRegistrationSubmitted}
            settings={settings}
          />
        )}
        {currentTab === "berita" && (
          <Berita 
            newsList={newsList}
            selectedNews={selectedNews} 
            setSelectedNews={setSelectedNews} 
          />
        )}
        {currentTab === "lainnya" && (
          <Lainnya 
            initialSubTab={subTab}
            galleryList={galleryList} 
            settings={settings}
          />
        )}
        {currentTab === "absensi" && (
          <Absensi initialRole={subTab} settings={settings} />
        )}
        {currentTab === "elearning" && (
          <ELearning initialSubTab={subTab} settings={settings} />
        )}
      </main>

      {/* 3. FULLY-DETAILED INDUSTRIAL WEB FOOTER */}
      <footer className="bg-neutral-900 text-stone-300 border-t-4 border-yellow-300 shadow">
        
        {/* Upper footer — hidden on mobile, full on desktop */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Logo brand & tagline */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 flex items-center justify-center overflow-hidden ${
                settings?.schoolLogo ? "" : "bg-white rounded-full p-1 border-2 border-yellow-400"
              }`}>
                {settings?.schoolLogo ? (
                  <img 
                    src={settings.schoolLogo} 
                    alt="Logo SMK" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-yellow-200 to-stone-100 flex flex-col items-center justify-center text-slate-800 border border-yellow-300 leading-none">
                    <Award size={14} className="text-amber-700 animate-pulse" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white tracking-widest leading-none">SMK AR ROSYID</h3>
                <span className="text-xs text-yellow-400 uppercase font-black tracking-widest">Campaka Putra</span>
              </div>
            </div>
            
            <p className="text-xs text-stone-400 leading-relaxed font-semibold">
              SMK Ar Rosyid Campaka Putra berkomitmen menyelenggarakan pendidikan vokasi berbasis keahlian praktis yang kental akan nilai-nilai religi, melahirkan generasi handal di era transformasi digital.
            </p>

            <div className="space-y-1.5 pt-2">
              <div className="flex gap-2 items-center text-xs">
                <MapPin size={14} className="text-amber-500 shrink-0" />
                <span className="text-[11px] text-stone-300">{settings.contactAlamat}</span>
              </div>
              <div className="flex gap-2 items-center text-xs">
                <Phone size={14} className="text-amber-500 shrink-0" />
                <span className="font-mono text-stone-300">{settings.contactTelepon}</span>
              </div>
            </div>
          </div>

          {/* Quick linkages: Tentang */}
          <div className="md:col-span-2.5 space-y-3.5">
            <h4 className="text-white text-xs font-black uppercase tracking-wider border-b border-amber-400/20 pb-2">Tentang Kami</h4>
            <ul className="text-xs space-y-2 font-medium text-stone-300">
              <li>
                <button onClick={() => setTabAndSub("tentang", "sambutan")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Sambutan Kepala Sekolah
                </button>
              </li>
              <li>
                <button onClick={() => setTabAndSub("tentang", "visi-misi")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Profil & Visi Misi
                </button>
              </li>
              <li>
                <button onClick={() => setTabAndSub("tentang", "fasilitas")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Fasilitas Gedung & Lab
                </button>
              </li>
              <li>
                <button onClick={() => setTabAndSub("lainnya", "kontak")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Jam Kerja Layanan Akademik
                </button>
              </li>
            </ul>
          </div>

          {/* Quick linkages: Akademik */}
          <div className="md:col-span-2.5 space-y-3.5">
            <h4 className="text-white text-xs font-black uppercase tracking-wider border-b border-amber-400/20 pb-2">Kompetensi</h4>
            <ul className="text-xs space-y-2 font-medium text-stone-300">
              <li>
                <button onClick={() => setTabAndSub("akademik", "jurusan")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Teknik Komputer & Jaringan
                </button>
              </li>
              <li>
                <button onClick={() => setTabAndSub("akademik", "jurusan")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Bisnis Daring & Pemasaran
                </button>
              </li>
              <li>
                <button onClick={() => setTabAndSub("akademik", "kegiatan")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Praktik Kerja Lapangan (PKL)
                </button>
              </li>
              <li>
                <button onClick={() => setTabAndSub("akademik", "kegiatan")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Ekstrakurikuler \& Organisasi
                </button>
              </li>
            </ul>
          </div>

          {/* New Admissions highlights */}
          <div className="md:col-span-3 space-y-3.5">
            <h4 className="text-white text-xs font-black uppercase tracking-wider border-b border-amber-400/20 pb-2">Pendaftaran SPMB</h4>
            <ul className="text-xs space-y-2 font-medium text-stone-300">
              <li>
                <button onClick={() => setTabAndSub("spmb", "jadwal")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Alur \& Persyaratan SPMB
                </button>
              </li>
              <li>
                <button onClick={() => setTabAndSub("spmb", "formulir")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Pengisian Formulir Baru
                </button>
              </li>
              <li>
                <button onClick={() => setTabAndSub("spmb", "data-pendaftar")} className="hover:text-amber-400 transition cursor-pointer text-left">
                  Reprint / Cetak Bukti Registrasi
                </button>
              </li>
              <li>
                <button onClick={() => setTabAndSub("tentang", "sambutan")} className="hover:text-amber-400 transition cursor-pointer text-left flex items-center gap-1">
                  ⭐ Beasiswa KIP & Tahfidz
                </button>
              </li>
            </ul>
          </div>

        </div>
        {/* end hidden md:block */}
        </div>

        {/* Lower footer copyright */}
        <div className="bg-neutral-950 py-4 md:py-6 border-t border-neutral-850 px-4 md:px-6 font-mono text-[10px]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5 text-center sm:text-left">
            <div>
              &copy; {new Date().getFullYear()} SMK Ar Rosyid Campaka Putra. Hak Cipta Dilindungi.
            </div>
            <div className="flex gap-3 items-center">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck size={11} fill="currentColor" className="text-emerald-400/20" />
                Akreditasi A
              </span>
              <span className="hidden sm:inline">Website Resmi SMK</span>
            </div>
          </div>
        </div>

        {/* Mobile footer compact — visible only on mobile */}
        <div className="md:hidden bg-neutral-900 border-t border-neutral-800 px-4 py-4 grid grid-cols-2 gap-3 text-xs font-medium text-stone-400">
          <button onClick={() => setTabAndSub("tentang", "sambutan")} className="text-left hover:text-amber-400 transition">Sambutan Kepsek</button>
          <button onClick={() => setTabAndSub("spmb", "formulir")} className="text-left hover:text-amber-400 transition">Daftar SPMB</button>
          <button onClick={() => setTabAndSub("absensi", "siswa")} className="text-left hover:text-amber-400 transition">Absensi Siswa</button>
          <button onClick={() => setTabAndSub("elearning", "siswa")} className="text-left hover:text-amber-400 transition">E-Learning</button>
          <button onClick={() => setTabAndSub("lainnya", "kontak")} className="text-left hover:text-amber-400 transition">Kontak Kami</button>
          <button onClick={() => setTabAndSub("berita", undefined)} className="text-left hover:text-amber-400 transition">Berita Sekolah</button>
        </div>

      </footer>

      {/* 4. MODAL ADMIN PANEL */}
      {isAdminOpen && (
        <AdminPanel 
          onClose={() => setIsAdminOpen(false)}
          newsList={newsList}
          setNewsList={setNewsList}
          galleryList={galleryList}
          setGalleryList={setGalleryList}
          slidesList={slidesList}
          setSlidesList={setSlidesList}
          settings={settings}
          setSettings={setSettings}
        />
      )}

      {/* 5. FLOATING WHATSAPP CRITICISM & SUGGESTIONS WIDGET */}
      <WhatsAppWidget settings={settings} />

      {/* 6. MOBILE BOTTOM NAVIGATION BAR */}
      <BottomNavBar currentTab={currentTab} setTab={setTabAndSub} />

    </div>
  );
}
