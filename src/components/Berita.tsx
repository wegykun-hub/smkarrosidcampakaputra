import React, { useState } from "react";
import { NEWS_DATA } from "../data";
import { NewsItem } from "../types";
import { Calendar, User, ArrowLeft, ArrowRight, Share2, MessageCircle } from "lucide-react";

interface BeritaProps {
  selectedNews: NewsItem | null;
  setSelectedNews: (news: NewsItem | null) => void;
  newsList?: NewsItem[];
}

export default function Berita({ selectedNews, setSelectedNews, newsList = NEWS_DATA }: BeritaProps) {
  const [filter, setFilter] = useState("Semua");
  const categories = ["Semua", "Akademik", "Praktik", "Prestasi"];

  const filteredNews = filter === "Semua" 
    ? newsList 
    : newsList.filter(n => n.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="w-full bg-orange-grid pb-16 animate-fade-in font-sans">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-yellow-101 via-yellow-100 to-stone-100 text-slate-800 py-12 px-4 shadow-sm text-center border-b border-yellow-250/60">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-slate-900">MEDIA & BERITA SEKOLAH</h1>
          <p className="text-xs md:text-sm text-slate-600 italic mt-2">
            Mengabarkan Aktivitas, Informasi, Pengumuman Resmi dan Segudang Prestasi SMK Ar Rosyid Campaka Putra.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        
        {/* DETAIL VIEW */}
        {selectedNews ? (
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-orange-100/60 animate-fade-in space-y-6">
            <button
              onClick={() => setSelectedNews(null)}
              className="flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer mb-4"
            >
              <ArrowLeft size={16} /> Kembali ke Daftar Berita
            </button>

            <span className="bg-orange-600 text-white font-extrabold text-[10px] tracking-widest uppercase px-3 py-1 rounded w-fit block shadow">
              {selectedNews.category}
            </span>

            <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">
              {selectedNews.title}
            </h2>

            <div className="flex items-center gap-4 text-slate-400 text-xs font-semibold py-2 border-y border-orange-50">
              <span className="flex items-center gap-1"><Calendar size={13} className="text-amber-500" /> {selectedNews.date}</span>
              <span className="flex items-center gap-1"><User size={13} className="text-amber-500" /> Penulis: Admin Sekolah</span>
            </div>

            <div className="relative aspect-[16/9] w-full bg-slate-100 rounded-2xl overflow-hidden shadow">
              <img
                src={selectedNews.image}
                alt={selectedNews.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line font-medium pt-4">
              {selectedNews.content}
            </div>

            {/* Simulated social footer */}
            <div className="border-t border-orange-50 pt-6 flex justify-between items-center bg-orange-50/20 p-4 rounded-xl">
              <span className="text-xs font-semibold text-slate-500">Bagikan berita ini kepada rekan Anda:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => alert("Tautkan URL berita disalin ke papan klip!")}
                  className="p-2.5 bg-white text-slate-700 rounded-full hover:bg-orange-500 hover:text-white border border-orange-100 transition shadow-sm cursor-pointer"
                  title="Salin Link"
                >
                  <Share2 size={14} />
                </button>
                <button
                  onClick={() => alert("Layanan komentar online segera diaktifkan.")}
                  className="p-2.5 bg-white text-slate-700 rounded-full hover:bg-orange-500 hover:text-white border border-orange-100 transition shadow-sm cursor-pointer"
                  title="Simulasikan Komentar"
                >
                  <MessageCircle size={14} />
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-6">
            
            {/* Category selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase shrink-0 transition cursor-pointer ${
                    filter === cat 
                      ? "bg-slate-900 border border-amber-400 text-white" 
                      : "bg-white text-slate-600 border border-orange-100 hover:bg-orange-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredNews.map((news) => (
                <div
                  key={news.id}
                  onClick={() => setSelectedNews(news)}
                  className="bg-white rounded-2xl overflow-hidden shadow-md border border-orange-100 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                      <h3 className="font-extrabold text-sm md:text-base text-slate-900 tracking-tight leading-snug group-hover:text-orange-600 line-clamp-2 transition-colors">
                        {news.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-3 font-semibold leading-relaxed">
                        {news.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-3 border-t border-orange-50 flex items-center justify-between text-xs font-bold text-orange-600 group-hover:text-orange-700">
                    <span>Baca Berita Lengkap</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
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
