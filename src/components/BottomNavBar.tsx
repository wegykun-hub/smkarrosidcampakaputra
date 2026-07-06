import React, { useState, useRef, useEffect } from "react";
import {
  Home, BookOpen, ClipboardCheck, Users, MoreHorizontal,
  GraduationCap, Briefcase, X
} from "lucide-react";

interface BottomNavBarProps {
  currentTab: string;
  setTab: (tab: string, subTab?: string) => void;
}

type PopupMenu = "absensi" | "elearning" | null;

export default function BottomNavBar({ currentTab, setTab }: BottomNavBarProps) {
  const [openPopup, setOpenPopup] = useState<PopupMenu>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Tutup popup saat klik di luar
  useEffect(() => {
    const handleOutside = (e: TouchEvent | MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpenPopup(null);
      }
    };
    if (openPopup) {
      document.addEventListener("touchstart", handleOutside);
      document.addEventListener("mousedown", handleOutside);
    }
    return () => {
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [openPopup]);

  const handleNavClick = (key: string, sub?: string) => {
    if (key === "absensi") {
      // Toggle popup atau langsung tutup kalau sudah open
      setOpenPopup(prev => prev === "absensi" ? null : "absensi");
      return;
    }
    if (key === "elearning") {
      setOpenPopup(prev => prev === "elearning" ? null : "elearning");
      return;
    }
    setOpenPopup(null);
    setTab(key, sub);
  };

  const handleRoleSelect = (tab: string, role: string) => {
    setOpenPopup(null);
    setTab(tab, role);
  };

  const navItems = [
    { key: "home",      label: "Beranda",   icon: Home,          sub: undefined },
    { key: "spmb",      label: "SPMB",      icon: Users,         sub: "jadwal" },
    { key: "absensi",   label: "Absensi",   icon: ClipboardCheck, sub: undefined },
    { key: "elearning", label: "E-Learning", icon: BookOpen,      sub: undefined },
    { key: "lainnya",   label: "Lainnya",   icon: MoreHorizontal, sub: "galeri" },
  ];

  return (
    <>
      {/* Backdrop gelap saat popup terbuka */}
      {openPopup && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpenPopup(null)}
        />
      )}

      {/* Popup pilihan Absensi */}
      {openPopup === "absensi" && (
        <div
          ref={popupRef}
          className="lg:hidden fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          style={{
            bottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(280px, 85vw)",
            animation: "popup-up 0.18s ease-out forwards",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={14} className="text-orange-500" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Absensi Digital</span>
            </div>
            <button onClick={() => setOpenPopup(null)} className="p-0.5 text-slate-400 cursor-pointer">
              <X size={15} />
            </button>
          </div>

          {/* Pilihan */}
          <div className="p-2 flex flex-col gap-1.5">
            <button
              onClick={() => handleRoleSelect("absensi", "siswa")}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-amber-50 active:bg-amber-100 transition cursor-pointer text-left w-full group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition">
                <GraduationCap size={18} className="text-amber-700" />
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-900 leading-tight">Presensi Siswa</p>
                <p className="text-[10px] text-slate-400 font-medium">Absensi harian siswa aktif</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect("absensi", "guru")}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer text-left w-full group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition">
                <Briefcase size={18} className="text-slate-600" />
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-900 leading-tight">Presensi Guru & Staff</p>
                <p className="text-[10px] text-slate-400 font-medium">Absensi harian tenaga pengajar</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Popup pilihan E-Learning */}
      {openPopup === "elearning" && (
        <div
          ref={popupRef}
          className="lg:hidden fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          style={{
            bottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(280px, 85vw)",
            animation: "popup-up 0.18s ease-out forwards",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-indigo-500" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">E-Learning</span>
            </div>
            <button onClick={() => setOpenPopup(null)} className="p-0.5 text-slate-400 cursor-pointer">
              <X size={15} />
            </button>
          </div>

          {/* Pilihan */}
          <div className="p-2 flex flex-col gap-1.5">
            <button
              onClick={() => handleRoleSelect("elearning", "siswa")}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-amber-50 active:bg-amber-100 transition cursor-pointer text-left w-full group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition">
                <GraduationCap size={18} className="text-amber-700" />
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-900 leading-tight">Portal Siswa</p>
                <p className="text-[10px] text-slate-400 font-medium">Materi, tugas, dan kuis</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect("elearning", "guru")}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50 active:bg-indigo-100 transition cursor-pointer text-left w-full group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition">
                <Briefcase size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-900 leading-tight">Portal Guru & Staff</p>
                <p className="text-[10px] text-slate-400 font-medium">Upload materi & nilai tugas</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-2px_16px_rgba(0,0,0,0.08)] flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;
          const hasPopup = item.key === "absensi" || item.key === "elearning";
          const isPopupOpen = openPopup === item.key;

          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key, item.sub)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-all duration-150 cursor-pointer relative min-h-[56px] ${
                isActive || isPopupOpen ? "text-orange-600" : "text-slate-400"
              }`}
            >
              {/* Active top indicator */}
              {(isActive || isPopupOpen) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-orange-500" />
              )}

              {/* Icon dengan badge chevron untuk item yang punya popup */}
              <div className="relative">
                <Icon
                  size={21}
                  strokeWidth={isActive || isPopupOpen ? 2.5 : 1.8}
                  className={`transition-transform duration-150 ${isActive || isPopupOpen ? "scale-110" : ""}`}
                />
                {hasPopup && (
                  <span
                    className={`absolute -top-1 -right-2 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center transition-colors ${
                      isPopupOpen ? "bg-orange-500" : "bg-slate-300"
                    }`}
                  >
                    <svg width="5" height="4" viewBox="0 0 5 4" fill="none">
                      <path d="M1 1.5L2.5 3L4 1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </div>

              <span className={`text-[9px] font-bold tracking-tight leading-none ${isActive || isPopupOpen ? "text-orange-600" : "text-slate-400"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Animasi popup-up */}
      <style>{`
        @keyframes popup-up {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
