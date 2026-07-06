import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Phone, Mail, Award, BookOpen, MapPin, Search, Calendar, UserCheck, Home } from "lucide-react";
import { GeneralSettings } from "../types";

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string, subTab?: string) => void;
  onOpenAdmin: () => void;
  settings?: GeneralSettings;
}

export default function Navigation({ currentTab, setTab, onOpenAdmin, settings }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownActive, setDropdownActive] = useState<string | null>(null);
  const [wibTime, setWibTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      // Calculate adjusted local time based on custom offset
      const offset = settings && typeof settings.clockOffset === 'number' ? settings.clockOffset : 7;
      const tzSuffix = settings?.clockTimezone || "WIB";
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const localAdjusted = new Date(utc + 3600000 * offset);
      
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setWibTime(localAdjusted.toLocaleDateString('id-ID', options) + " " + tzSuffix);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  const handleMenuClick = (tab: string, sub?: string) => {
    setTab(tab, sub);
    setIsOpen(false);
    setDropdownActive(null);
  };

  const navItems = [
    {
      name: "TENTANG SEKOLAH",
      key: "tentang",
      children: [
        { name: "Sambutan Kepala Sekolah", sub: "sambutan" },
        { name: "Profil, Visi & Misi", sub: "visi-misi" },
        { name: "Profil Guru & Staff", sub: "guru" },
        { name: "Fasilitas Umum", sub: "fasilitas" }
      ]
    },
    {
      name: "AKADEMIK",
      key: "akademik",
      children: [
        { name: "Kompetensi Keahlian (Jurusan)", sub: "jurusan" },
        { name: "Kegiatan Sekolah", sub: "kegiatan" }
      ]
    },
    {
      name: "SPMB",
      key: "spmb",
      children: [
        { name: "Alur Pendaftaran \& Informasi", sub: "jadwal" },
        { name: "Formulir Pendaftaran", sub: "formulir" },
        { name: "Cek Status & Cari Data", sub: "data-pendaftar" }
      ]
    },
    {
      name: "ABSENSI DIGITAL",
      key: "absensi",
      children: [
        { name: "Presensi Siswa / siswa", sub: "siswa" },
        { name: "Presensi Guru & Staff", sub: "guru" }
      ]
    },
    {
      name: "E-LEARNING",
      key: "elearning",
      children: [
        { name: "Portal Siswa (siswa)", sub: "siswa" },
        { name: "Portal Guru & Staff", sub: "guru" }
      ]
    },
    {
      name: "BERITA",
      key: "berita",
      children: null
    },
    {
      name: "LAINNYA",
      key: "lainnya",
      children: [
        { name: "Galeri Foto", sub: "galeri" },
        { name: "Hubungi Kontak Kami", sub: "kontak" }
      ]
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full shadow-lg font-sans">
      {/* Top Banner Bar — hidden on mobile (save space) */}
      <div className="hidden sm:flex bg-neutral-900 text-white text-xs py-2 px-4 flex-wrap justify-between items-center gap-2 border-b border-yellow-350">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Mail size={12} />
            <span className="font-mono text-[11px] text-gray-300">{settings?.contactEmail || "info@smkarrosyidcampaka.sch.id"}</span>
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-amber-400">
            <MapPin size={12} />
            <span className="text-gray-300">{settings?.contactAlamat || "Cianjur, Jawa Barat"}</span>
          </span>
          <span className="hidden lg:flex items-center gap-1.5 text-amber-400">
            <Phone size={12} />
            <span className="text-gray-300">{settings?.contactTelepon || "+62 812-3456-7890"}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-mono hidden sm:inline text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {wibTime}
          </span>
          <button 
            onClick={onOpenAdmin}
            className="text-[11px] font-bold tracking-wider bg-gradient-to-r from-yellow-200 to-stone-100 border border-yellow-300 text-slate-900 px-3 py-1 rounded-full text-center hover:from-yellow-300 hover:to-stone-200 transition duration-300 flex items-center gap-1 cursor-pointer shadow"
          >
            <UserCheck size={12} className="text-amber-700" />
            ADMIN PANEL
          </button>
        </div>
      </div>

      {/* Main Bar with Logo and Gradasi background */}
      <div className="bg-gradient-to-r from-yellow-101 via-yellow-100 to-stone-100 text-[#1e293b] py-2 md:py-3 px-3 md:px-8 border-b border-yellow-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo Brand */}
          <div 
            onClick={() => handleMenuClick("home")} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className={`w-9 h-9 md:w-12 md:h-12 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 ${
              settings?.schoolLogo ? "" : "bg-white rounded-full p-1 shadow-md border-2 border-yellow-400"
            }`}>
              {settings?.schoolLogo ? (
                <img 
                  src={settings.schoolLogo} 
                  alt="Logo SMK" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-yellow-200 to-stone-100 flex flex-col items-center justify-center text-slate-800 font-bold leading-none select-none text-[10px] border border-yellow-300">
                  <Award size={14} className="text-amber-700 animate-pulse" />
                  <span className="text-[7px] tracking-tighter">SMK-AR</span>
                </div>
              )}
            </div>
            <div>
              <div className="font-black text-base md:text-xl tracking-tight leading-none text-slate-900">
                SMK AR ROSYID
              </div>
              <div className="font-extrabold text-[#78350f] text-[10px] md:text-sm tracking-widest uppercase pb-0.5">
                Campaka Putra
              </div>
              <div className="text-[9px] text-slate-550 italic font-medium leading-none hidden sm:block">
                Sekolah Menengah Kejuruan Berkarakter Islami &amp; Unggul
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => handleMenuClick("home")}
              className={`px-3 py-2 rounded-lg text-xs font-black tracking-wider transition-all duration-300 cursor-pointer ${
                currentTab === "home" 
                ? "bg-slate-900 text-white shadow-md border border-amber-400" 
                : "text-slate-800 hover:bg-yellow-200/60 hover:text-slate-900"
              }`}
            >
              HOME
            </button>

            {navItems.map((item) => (
              <div
                key={item.key}
                className="relative group"
                onMouseEnter={() => setDropdownActive(item.key)}
                onMouseLeave={() => setDropdownActive(null)}
              >
                <div className="py-2">
                  <button
                    onClick={() => {
                      if (!item.children) {
                        handleMenuClick(item.key);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-black tracking-wider transition-all duration-300 flex items-center gap-1 cursor-pointer uppercase ${
                      currentTab === item.key 
                        ? "bg-slate-900 text-white shadow-md border border-amber-400" 
                        : "text-slate-800 hover:bg-yellow-200/60 hover:text-slate-900"
                    }`}
                  >
                    <span>{item.name}</span>
                    {item.children && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />}
                  </button>
                </div>

                {/* Dropdown Menu */}
                {item.children && dropdownActive === item.key && (
                  <div className="absolute left-0 mt-0 w-64 bg-white text-slate-900 rounded-lg shadow-2xl py-2 z-50 border border-slate-100 transition-all duration-300 transform scale-100 origin-top-left animate-in fade-in slide-in-from-top-1.5">
                    <div className="absolute -top-1 left-6 w-3 h-3 bg-white rotate-45 border-t border-l border-slate-100"></div>
                    {item.children.map((subItem) => (
                      <button
                        key={subItem.sub}
                        onClick={() => handleMenuClick(item.key, subItem.sub)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile right side: Admin + Hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Admin button compact on mobile */}
            <button
              onClick={onOpenAdmin}
              className="sm:hidden flex items-center gap-1 bg-gradient-to-r from-yellow-200 to-stone-100 border border-yellow-300 text-slate-900 px-2.5 py-1.5 rounded-lg text-[10px] font-black cursor-pointer shadow"
            >
              <UserCheck size={12} className="text-amber-700" />
              ADMIN
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-800 hover:bg-yellow-250 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile News Flash / Marquee Bar */}
      <div className="bg-amber-100 text-slate-900 py-1.5 px-4 overflow-hidden border-b border-yellow-250">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs">
          <span className="bg-rose-600 text-white font-black text-[10px] tracking-widest uppercase px-2 py-0.5 rounded flex items-center gap-1 blink shrink-0 shadow-sm animate-pulse">
            <Calendar size={11} /> {settings?.marqueeLabel || 'INFO SPMB:'}
          </span>
          <div className="w-full relative whitespace-nowrap overflow-hidden">
            <div className="inline-block animate-marquee font-semibold text-slate-800 py-0.5">
              {settings?.marqueeText || '⭐ Penerimaan Siswa Didik Baru (SPMB) Gelombang 1 Tahun Ajaran 2026/2027 telah dibuka! Dapatkan Beasiswa Khusus bagi Pemilik Kartu Indonesia Pintar (KIP) & Prestasi. 🌐 Daftarkan Diri Anda Secara Berkas Online dengan Cepat & Cetak Kartu Registrasi Sekarang Juga! ⭐'}
            </div>
          </div>
        </div>
      </div>

       {/* Mobile Dropdown Menu Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-white text-slate-900 shadow-2xl border-b border-amber-300 overflow-y-auto max-h-[75vh] transition duration-300 animate-in slide-in-from-top-2">
          <div className="p-4 space-y-2">
            <button
              onClick={() => handleMenuClick("home")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black tracking-wider transition-all duration-200 flex items-center gap-2.5 ${
                currentTab === "home" 
                  ? "bg-amber-100 border border-amber-300 text-slate-950 shadow-sm" 
                  : "text-slate-700 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <Home size={15} className="text-amber-600 shrink-0" />
              <span>DASHBOARD UTAMA</span>
            </button>

            {navItems.map((item) => (
              <div key={item.key} className="border-t border-slate-100 pt-2 pb-1">
                <div className="px-4 py-1 text-[10px] font-black tracking-widest text-[#92400e] uppercase">
                  {item.name}
                </div>
                {item.children ? (
                  <div className="space-y-1 mt-1 pl-2">
                    {item.children.map((subItem) => (
                        <button
                          key={subItem.sub}
                          onClick={() => handleMenuClick(item.key, subItem.sub)}
                          className="w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-amber-50/70 hover:text-[#92400e] transition flex items-center gap-2 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                          <span>{subItem.name}</span>
                        </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 pl-2">
                    <button
                      onClick={() => handleMenuClick(item.key)}
                      className="w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-amber-50/70 hover:text-[#92400e] transition flex items-center gap-2 cursor-pointer"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                      <span>Kelola {item.name}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
