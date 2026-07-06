import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Heart, HelpCircle, CheckCircle2 } from "lucide-react";
import { CONTACT_INFO } from "../data";

interface WhatsAppWidgetProps {
  settings?: {
    contactTelepon: string;
  };
}

export default function WhatsAppWidget({ settings }: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    peran: "SISWA",
    kategori: "FASILITAS",
    pesan: "",
  });
  const [isSuccess, setIsSuccess] = useState(false);

  // Clean phone number from settings or CONTACT_INFO fallback
  const rawNumber = settings?.contactTelepon || CONTACT_INFO.telepon; // "+62 812-3456-7890"
  const cleanNumber = rawNumber.replace(/[^0-9]/g, ""); // "6281234567890"

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.pesan.trim()) {
      return;
    }

    const rolesMap: Record<string, string> = {
      SISWA: "Siswa Aktif",
      WALI_MURID: "Orang Tua / Wali Murid",
      ALUMNI: "Alumni Sekolah",
      MASYARAKAT: "Masyarakat Umum",
      GURU: "Guru / Staff",
    };

    const categoriesMap: Record<string, string> = {
      FASILITAS: "Fasilitas & Sarusun Gedung",
      KURIKULUM: "Kurikulum & Kegiatan KBM",
      PELAYANAN: "Pelayanan Akademik & Administrasi",
      UMUM: "Kritik / Saran Umum",
    };

    const formattedRole = rolesMap[formData.peran] || formData.peran;
    const formattedCategory = categoriesMap[formData.kategori] || formData.kategori;

    // Create the message template
    const textMsg = `Halo Humas SMK Ar Rosyid Campaka Putra,
Saya ingin menyampaikan kritik & saran melalui Website Resmi:

*Nama Lengkap:* ${formData.nama.trim().toUpperCase()}
*Kategori Feedback:* ${formattedCategory}
*Status / Peran:* ${formattedRole}

*Isi Kritik & Saran:*
"${formData.pesan.trim()}"

Terima kasih atas perhatian jajaran sekolah.`;

    const encodedText = encodeURIComponent(textMsg);
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

    // Open WhatsApp in a new tab safely
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // Display temporary success state
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        nama: "",
        peran: "SISWA",
        kategori: "FASILITAS",
        pesan: "",
      });
      setIsOpen(false);
    }, 3000);
  };

  return (
    <div className="fixed right-4 z-40 font-sans whatsapp-widget-container" id="wa-feedback-root"
      style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            id="wa-feedback-panel"
            className="absolute bottom-16 right-0 w-[350px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-slate-150 shadow-2xl overflow-hidden flex flex-col mb-2 text-slate-800"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <MessageSquare size={18} className="text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wide leading-none uppercase">Kritik & Saran</h4>
                  <span className="text-[10px] text-emerald-100 font-bold tracking-wider">RESPON CEPAT WHATSAPP</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSuccess(false);
                }}
                className="w-7 h-7 rounded-full bg-black/10 hover:bg-black/25 flex items-center justify-center text-white transition cursor-pointer"
                aria-label="Tutup"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-4 overflow-y-auto max-h-[380px] bg-slate-50">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                    <CheckCircle2 size={36} />
                  </div>
                  <h5 className="font-extrabold text-slate-900 text-sm uppercase">Pesan Siap Dikirim!</h5>
                  <p className="text-[11px] text-slate-500 font-bold max-w-xs leading-relaxed px-4">
                    Pesan Anda telah diformat. Anda akan diarahkan otomatis ke WhatsApp Web/Aplikasi untuk mengirim pesan tersebut.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    Sampaikan masukan, apresiasi, kritik, maupun saran membangun untuk kemajuan kualitas pembelajaran di *SMK Ar Rosyid Campaka Putra*.
                  </p>

                  {/* Nama Lengkap */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Nama Lengkap *</label>
                    <input
                      type="text"
                      name="nama"
                      required
                      value={formData.nama}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama lengkap Anda..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Peran / Status */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Hubungan / Peran *</label>
                      <select
                        name="peran"
                        value={formData.peran}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="SISWA">Siswa Aktif</option>
                        <option value="WALI_MURID">Wali Murid</option>
                        <option value="ALUMNI">Alumni</option>
                        <option value="MASYARAKAT">Masyarakat</option>
                        <option value="GURU">Guru / Staff</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Kategori *</label>
                      <select
                        name="kategori"
                        value={formData.kategori}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="FASILITAS">Fasilitas Sekolah</option>
                        <option value="KURIKULUM">Pembelajaran</option>
                        <option value="PELAYANAN">Layanan Akademik</option>
                        <option value="UMUM">Lainnya (Umum)</option>
                      </select>
                    </div>
                  </div>

                  {/* Isi Pesan */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Kritik, Saran atau Pesan *</label>
                    <textarea
                      name="pesan"
                      required
                      rows={3}
                      value={formData.pesan}
                      onChange={handleInputChange}
                      placeholder="Ketik isi kritik dan saran Anda..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!formData.nama.trim() || !formData.pesan.trim()}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15 cursor-pointer uppercase transition-all duration-200"
                  >
                    <Send size={13} />
                    Kirim via WhatsApp
                  </button>
                </form>
              )}
            </div>

            {/* Footer info */}
            <div className="bg-slate-100 p-2 text-center text-[9px] text-slate-400 font-bold border-t border-slate-150 flex items-center justify-center gap-1.5">
              <Heart size={10} className="text-rose-500 fill-rose-500" />
              Satu Aspirasi demi SMK yang Berkemajuan
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative group p-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl flex items-center justify-center border-2 border-white cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-emerald-500/30"
        aria-label="Kritik & Saran via WhatsApp"
        id="wa-toggle-btn"
      >
        {/* Breathing Ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-50 scale-100 group-hover:animate-ping -z-10" />

        {/* Dynamic Icon */}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="wa-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              {/* Custom SVG clean WhatsApp icon pathway */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                className="w-5 h-5 fill-current"
              >
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
              <span className="hidden md:inline text-xs font-black uppercase tracking-wider">Kritik & Saran</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
