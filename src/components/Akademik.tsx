import React, { useState } from "react";
import { JURUSAN_DETAILS, KEGIATAN_SEKOLAH } from "../data";
import { Network, TrendingUp, Award, Briefcase, BookOpen, Trophy, ShieldAlert, Heart, CheckSquare } from "lucide-react";

interface AkademikProps {
  initialSubTab?: string;
}

export default function Akademik({ initialSubTab = "jurusan" }: AkademikProps) {
  const [activeSub, setActiveSub] = useState(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSub(initialSubTab);
    }
  }, [initialSubTab]);

  const getKegiatanIcon = (iconName: string) => {
    switch (iconName) {
      case "Briefcase":
        return <Briefcase size={22} className="text-orange-500" />;
      case "Award":
        return <Award size={22} className="text-amber-500" />;
      case "ShieldAlert":
        return <ShieldAlert size={22} className="text-red-500" />;
      case "Heart":
        return <Heart size={22} className="text-rose-500" />;
      case "Trophy":
        return <Trophy size={22} className="text-yellow-600" />;
      default:
        return <BookOpen size={22} className="text-orange-500" />;
    }
  };

  return (
    <div className="w-full bg-orange-grid pb-16 animate-fade-in font-sans">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-yellow-101 via-yellow-100 to-stone-100 text-slate-800 py-12 px-4 shadow-sm text-center border-b border-yellow-250/60">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-slate-900">AKADEMIK & KEJURUAN</h1>
          <p className="text-xs md:text-sm text-slate-600 italic mt-2">
            Mencetak Tenaga Ahli yang Siap Berkontribusi di Dunia Teknologi dan Bisnis Modern.
          </p>
        </div>
      </div>

      {/* Sub Menu Links */}
      <div className="max-w-7xl mx-auto px-4 -translate-y-4">
        <div className="bg-white rounded-xl shadow-md p-1.5 border border-yellow-200/50 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap justify-start md:justify-center">
          <button
            onClick={() => setActiveSub("jurusan")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
              activeSub === "jurusan" ? "bg-amber-400 text-slate-950 shadow-sm border border-amber-300" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Jurusan & Kompetensi Keahlian
          </button>
          <button
            onClick={() => setActiveSub("kegiatan")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
              activeSub === "kegiatan" ? "bg-amber-400 text-slate-950 shadow-sm border border-amber-300" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Kegiatan & Ekskul Sekolah
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        
        {/* Jurusan / Kompetensi Keahlian */}
        {activeSub === "jurusan" && (
          <div className="space-y-12">
            {JURUSAN_DETAILS.map((jurusan) => {
              const IconComp = jurusan.id === "tkj" ? Network : TrendingUp;
              return (
                <div
                  key={jurusan.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-xl border border-orange-100 transition-all duration-300 transform hover:-translate-y-1.5"
                >
                  {/* Jurusan Strip Header */}
                  <div className={`p-6 md:p-8 bg-gradient-to-r ${jurusan.color} text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                    <div>
                      <span className="bg-slate-950/25 text-[#fff2d4] font-black tracking-widest text-[10px] px-3 py-1 rounded uppercase mb-2 block w-fit">
                        {jurusan.abbr} STUDY PROGRAM
                      </span>
                      <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight">
                        {jurusan.name}
                      </h2>
                      <p className="text-xs text-orange-100 italic mt-1 font-medium select-none">
                        "{jurusan.tagline}"
                      </p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/20 shadow-inner shrink-0">
                      <IconComp size={36} />
                    </div>
                  </div>

                  {/* Jurusan Content Grid */}
                  <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    
                    {/* Deskripsi Utama */}
                    <div className="md:col-span-6 space-y-6">
                      <h3 className="text-sm tracking-widest uppercase font-black text-orange-600">
                        Profil & Deskripsi Lulusan
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                        {jurusan.description}
                      </p>
                      <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 italic text-[11px] leading-relaxed text-[#7c2d12] font-semibold">
                        ⭐ Lulusan jurusan {jurusan.abbr} akan memperoleh Sertifikat Kompetensi Khusus dari Lembaga Sertifikasi Profesi (LSP) berkolaborasi dengan partner industri berkelas.
                      </div>
                    </div>

                    {/* Kurikulum & Prospek */}
                    <div className="md:col-span-6 space-y-6">
                      {/* Kurikulum */}
                      <div className="bg-orange-50/15 border border-orange-100 p-5 rounded-2xl">
                        <h4 className="text-slate-900 text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <CheckSquare size={14} className="text-orange-500" /> Materi Keahlian Inti
                        </h4>
                        <ul className="text-xs md:text-sm text-slate-600 space-y-2">
                          {jurusan.materi.map((mat, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 shrink-0"></span>
                              <span className="font-medium">{mat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Karir */}
                      <div>
                        <h4 className="text-slate-900 text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Briefcase size={14} className="text-orange-500" /> Prospek Lapangan Kerja
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {jurusan.prospek.map((job, idx) => (
                            <span 
                              key={idx} 
                              className="bg-orange-100/60 text-[#7c2d12] text-xs font-extrabold px-3 py-1.5 rounded-full border border-orange-100 shadow-sm"
                            >
                              {job}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Kegiatan & Ekskul Sekolah */}
        {activeSub === "kegiatan" && (
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-orange-100/60">
            <h2 className="text-xl md:text-2xl font-black text-slate-950 border-b border-orange-100 pb-4 mb-8 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-orange-500 rounded-full inline-block"></span>
              Kegiatan Belajar & Ekstrakurikuler
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {KEGIATAN_SEKOLAH.map((keg, idx) => (
                <div
                  key={idx}
                  className="bg-orange-50/20 hover:bg-orange-50/40 p-6 rounded-2xl border border-orange-100 transition-all duration-300 shadow-sm flex gap-4 items-start"
                >
                  <div className="p-3 bg-white rounded-xl shadow border border-orange-100 shrink-0">
                    {getKegiatanIcon(keg.icon)}
                  </div>
                  <div>
                    <span className="bg-orange-100 text-orange-700 font-extrabold text-[9px] tracking-widest px-2 py-0.5 rounded uppercase block w-fit mb-1.5">
                      {keg.category}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm md:text-base mb-1.5">
                      {keg.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {keg.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
