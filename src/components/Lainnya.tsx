import React, { useState } from "react";
import { GALLERY_DATA, CONTACT_INFO } from "../data";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Image as ImageIcon, Star, Instagram, Youtube } from "lucide-react";
import { GalleryItem } from "../types";

interface LainnyaProps {
  initialSubTab?: string;
  galleryList?: GalleryItem[];
  settings?: any;
}

export default function Lainnya({ initialSubTab = "galeri", galleryList = GALLERY_DATA, settings }: LainnyaProps) {
  const [activeSub, setActiveSub] = useState(initialSubTab);
  const [galleryFilter, setGalleryFilter] = useState("Semua");
  const [messageForm, setMessageForm] = useState({ name: "", email: "", subject: "", text: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const infoAlamat = settings?.contactAlamat || CONTACT_INFO.alamat;
  const infoTelepon = settings?.contactTelepon || CONTACT_INFO.telepon;
  const infoEmail = settings?.contactEmail || CONTACT_INFO.email;
  const infoJamKerja = settings?.contactJamKerja || CONTACT_INFO.jamKerja;
  const infoInstagram = settings?.contactInstagram || CONTACT_INFO.instagram;
  const infoYoutube = settings?.contactYoutube || CONTACT_INFO.youtube;
  const infoMapUrl = settings?.contactMapUrl || CONTACT_INFO.mapUrl;

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSub(initialSubTab);
    }
  }, [initialSubTab]);

  const categories = ["Semua", "Praktik", "Infrastruktur", "Event", "Ekstrakurikuler"];

  const filteredGallery = galleryFilter === "Semua"
    ? galleryList
    : galleryList.filter(g => g.category.toLowerCase() === galleryFilter.toLowerCase());

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.name || !messageForm.email || !messageForm.text) {
      alert("Mohon lengkapi kolom yang wajib diisi!");
      return;
    }
    setFormSubmitted(true);
    setMessageForm({ name: "", email: "", subject: "", text: "" });
  };

  return (
    <div className="w-full bg-orange-grid pb-16 animate-fade-in font-sans">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-yellow-101 via-yellow-100 to-stone-100 text-slate-800 py-12 px-4 shadow-sm text-center border-b border-yellow-250/60">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-slate-900">GALERI & HUBUNGI KAMI</h1>
          <p className="text-xs md:text-sm text-slate-600 italic mt-2">
            Mengabadikan Momen Inspiratif & Memberikan Layanan Layanan Informasi Cepat Terintegrasi.
          </p>
        </div>
      </div>

      {/* Sub Menu Links */}
      <div className="max-w-7xl mx-auto px-4 -translate-y-4">
        <div className="bg-white rounded-xl shadow-md p-1 border border-orange-100 flex flex-wrap justify-center gap-1">
          <button
            onClick={() => setActiveSub("galeri")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSub === "galeri" ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Galeri Foto Dokumentasi
          </button>
          <button
            onClick={() => setActiveSub("kontak")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSub === "kontak" ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Kontak \& Peta Sekolah
          </button>
        </div>
      </div>

      {/* Main content body */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        
        {/* GALERI FOTO */}
        {activeSub === "galeri" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-orange-100/60">
              <h2 className="text-xl md:text-2xl font-black text-slate-950 border-b border-orange-100 pb-4 mb-6 flex items-center gap-2">
                <ImageIcon size={22} className="text-orange-500" />
                Galeri Foto Kegiatan Siswa
              </h2>

              {/* Gallery Filter buttons */}
              <div className="flex flex-wrap gap-1.5 justify-center mb-8">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGalleryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer uppercase ${
                      galleryFilter === cat
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredGallery.map((photo) => (
                  <div
                    key={photo.id}
                    className="group bg-orange-50/15 border border-orange-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300"
                  >
                    <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                      <img
                        src={photo.image}
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute bottom-3 left-3 bg-slate-900/80 text-amber-300 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded">
                        {photo.category}
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="font-extrabold text-sm text-[#7c2d12] leading-tight mb-1">
                        {photo.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                        {photo.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KONTAK & LOKASI MAPS */}
        {activeSub === "kontak" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Contact Details & Maps Info */}
            <div className="md:col-span-5 bg-white rounded-3xl p-6 md:p-8 shadow-md border border-orange-100/60 space-y-6">
              <h2 className="text-xl font-black text-slate-950 border-b border-orange-100 pb-3">
                Informasi Kontak
              </h2>

               <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-orange-55 border border-orange-100 rounded-xl text-orange-600 shrink-0 shadow-sm">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Alamat Kampus</h4>
                    <p className="text-xs text-slate-700 font-extrabold mt-1">{infoAlamat}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-orange-55 border border-orange-100 rounded-xl text-orange-600 shrink-0 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Nomor Layanan</h4>
                    <p className="text-xs text-slate-700 font-extrabold mt-1">{infoTelepon}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-orange-55 border border-orange-100 rounded-xl text-orange-600 shrink-0 shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Email Resmi</h4>
                    <p className="text-xs text-slate-700 font-extrabold mt-1 font-mono">{infoEmail}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-orange-55 border border-orange-100 rounded-xl text-orange-600 shrink-0 shadow-sm">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Layanan Jam Kerja</h4>
                    <p className="text-xs text-slate-700 font-extrabold mt-1">{infoJamKerja}</p>
                  </div>
                </div>
              </div>

              {/* Social Channels panel */}
              <div className="border-t border-orange-100 pt-5 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wide">Ikuti Media Sosial</h4>
                <div className="flex gap-2">
                  <a href="#instagram" className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100 transition">
                    <Instagram size={14} />
                    {infoInstagram}
                  </a>
                  <a href="#youtube" className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 transition">
                    <Youtube size={14} />
                    YouTube Channel
                  </a>
                </div>
              </div>
            </div>

            {/* Hubungi kami form & MAPS mockup */}
            <div className="md:col-span-7 space-y-6">
              
              {/* Form Pesan */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-orange-100/60">
                <h3 className="font-black text-lg text-slate-900 border-b pb-3 mb-4">Kirim Pesan / Pengaduan</h3>
                
                {formSubmitted && (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl mb-4 flex gap-2 items-center">
                    <CheckCircle size={16} />
                    <span>Terima kasih! Pesan Anda telah terkirim. Panitia kami segera memproses aduan.</span>
                  </div>
                )}

                <form onSubmit={handleMessageSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Nama Anda <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={messageForm.name}
                        onChange={(e) => setMessageForm({...messageForm, name: e.target.value})}
                        placeholder="Contoh: Budi Santoso"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Alamat Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        required
                        value={messageForm.email}
                        onChange={(e) => setMessageForm({...messageForm, email: e.target.value})}
                        placeholder="Masukkan email valid"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Subjek</label>
                    <input
                      type="text"
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                      placeholder="Contoh: Info Layanan Beasiswa"
                      className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Isi Pesan / Aduan / Pertanyaan <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      value={messageForm.text}
                      onChange={(e) => setMessageForm({...messageForm, text: e.target.value})}
                      rows={3}
                      placeholder="Tuliskan pesan lengkap Anda di sini..."
                      className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Send size={14} />
                    Kirim Pesan Sekarang
                  </button>
                </form>
              </div>

              {/* Interactive Virtual Embed Map Frame */}
              <div className="bg-white rounded-3xl p-4 shadow-md border border-orange-100/60 overflow-hidden">
                <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest pb-3">Lokasi Fisik SMK</h3>
                <div className="w-full h-64 rounded-xl overflow-hidden relative shadow-inner bg-slate-100 border border-slate-200">
                  <iframe
                    src={infoMapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    title="Peta SMK Ar Rosyid"
                    referrerPolicy="no-referrer"
                  ></iframe>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
