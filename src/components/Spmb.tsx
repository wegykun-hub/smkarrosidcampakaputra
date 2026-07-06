import React, { useState, useEffect, useCallback } from "react";
import { RegistrationData } from "../types";
import { 
  FileText, Clipboard, CheckCircle, Search, Printer, 
  ChevronRight, Calendar, User, Heart, Home, DollarSign,
  AlertCircle, Users, Percent, Download, Trash2, Award, Loader2
} from "lucide-react";
import {
  insertRegistration,
  fetchAllRegistrations,
  searchRegistrations,
  generateRegistrationId,
} from "../lib/services/spmbService";

interface SpmbProps {
  initialSubTab?: string;
  onNewRegistration?: (reg: RegistrationData) => void;
  settings?: any;
}

export default function Spmb({ initialSubTab = "jadwal", onNewRegistration, settings }: SpmbProps) {
  const [activeSub, setActiveSub] = useState(initialSubTab);
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RegistrationData[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<RegistrationData | null>(null);

  const infoTahunAjaran = settings?.spmbTahunAjaran || "2026/2027";
  const infoBatasKip = settings?.spmbBatasKip || "Bagi calon siswa yang memegang Kartu Indonesia Pintar (KIP) atau memiliki prestasi di bidang keagamaan (Tahfidz) atau olahraga di tingkat Kabupaten, dibebaskan dari biaya Dana Sumbangan Pendidikan (DSP) sebesar 100% hingga lulus sekolah.";
  const infoKuotaTarget = settings?.spmbKuotaTarget || "120";
  const infoStatusPendaftaran = settings?.spmbStatusPendaftaran || "DIBUKA";

  // Form step: 0 = Info/Jadwal, 1=DataPribadi, 2=DataAyah, 3=DataIbu, 4=SuksesReceipt
  const [formStep, setFormStep] = useState(1);
  const [validationError, setValidationError] = useState("");

  // INITIAL STATE FOR SPMB FORM
  const [formData, setFormData] = useState({
    // DATA PRIBADI SISWA BARU
    namaLengkap: "",
    jenisKelamin: "L" as "L" | "P",
    nisn: "",
    nik: "",
    noKk: "",
    tempatLahir: "",
    tanggalLahir: "",
    noAktaLahir: "",
    agama: "Islam" as RegistrationData['agama'],
    kewarganegaraan: "WNI" as "WNI" | "WNA",
    alamat: "",
    rt: "",
    rw: "",
    desa: "",
    kecamatan: "",
    kodePos: "",
    anakKe: 1,
    memilikiKip: "TIDAK" as "YA" | "TIDAK",
    noKip: "",

    // DATA ORANG TUA (AYAH)
    namaAyah: "",
    nikAyah: "",
    tempatLahirAyah: "",
    tanggalLahirAyah: "",
    pendidikanAyah: "SMA / SMK / MA",
    pekerjaanAyah: "Karyawan Swasta",
    penghasilanAyah: "Rp 1.000.000 - Rp 2.499.999",

    // DATA ORANG TUA (IBU)
    namaIbu: "",
    nikIbu: "",
    tempatLahirIbu: "",
    tanggalLahirIbu: "",
    pendidikanIbu: "SMA / SMK / MA",
    pekerjaanIbu: "Ibu Rumah Tangga",
    penghasilanIbu: "Kurang dari Rp 1.000.000",
  });

  // Opsi Dropdown
  const OPSI_AGAMA = ["Islam", "Protestan", "Katholik", "Hindu", "Buddha", "Konghucu"];
  const OPSI_KEWARGANEGARAAN = ["WNI", "WNA"];
  const OPSI_KIP = ["YA", "TIDAK"];
  const OPSI_JENIS_KELAMIN = [
    { label: "Laki-laki (L)", value: "L" },
    { label: "Perempuan (P)", value: "P" }
  ];

  const OPSI_PENDIDIKAN = [
    "Tidak Sekolah",
    "SD / MI",
    "SMP / MTs",
    "SMA / SMK / MA",
    "D1 / D2 / D3",
    "S1 (Sarjana)",
    "S2 (Magister)",
    "S3 (Doktor)"
  ];

  const OPSI_PEKERJAAN = [
    "Tidak Bekerja",
    "Ibu Rumah Tangga",
    "PNS / TNI / POLRI",
    "Karyawan Swasta",
    "Wiraswasta / Pedagang",
    "Petani / Pekebun",
    "Buruh",
    "Lainnya"
  ];

  const OPSI_PENGHASILAN = [
    "Tidak Berpenghasilan",
    "Kurang dari Rp 1.000.000",
    "Rp 1.000.000 - Rp 2.499.999",
    "Rp 2.500.000 - Rp 4.999.999",
    "Rp 5.000.000 - Rp 9.999.999",
    "Lebih dari Rp 10.000.000"
  ];

  // Load submissions from Supabase
  const loadRegistrations = useCallback(async () => {
    setIsLoadingData(true);
    const data = await fetchAllRegistrations();
    setRegistrations(data);
    setIsLoadingData(false);
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSub(initialSubTab);
      if (initialSubTab === "formulir") {
        setFormStep(1);
        setSelectedReceipt(null);
      }
    }
  }, [initialSubTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "anakKe" ? parseInt(value) || 1 : value
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const results = await searchRegistrations(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Form validation per step
  const validateStep = (step: number) => {
    setValidationError("");
    if (step === 1) {
      if (!formData.namaLengkap.trim()) return "Nama Lengkap wajib diisi.";
      if (!formData.nisn || formData.nisn.length < 10) return "NISN harus diisi 10 digit angka.";
      if (!formData.nik || formData.nik.length < 16) return "NIK harus diisi 16 digit angka.";
      if (!formData.noKk || formData.noKk.length < 16) return "Nomor KK harus diisi 16 digit angka.";
      if (!formData.tempatLahir.trim()) return "Tempat Lahir wajib diisi.";
      if (!formData.tanggalLahir) return "Tanggal Lahir wajib diisi.";
      if (!formData.noAktaLahir.trim()) return "Nomor Registrasi Akta Kelahiran wajib diisi.";
      if (!formData.alamat.trim()) return "Alamat Rumah lengkap wajib diisi.";
      if (!formData.desa.trim()) return "Desa/Kelurahan wajib diisi.";
      if (!formData.kecamatan.trim()) return "Kecamatan wajib diisi.";
      if (!formData.kodePos || formData.kodePos.length < 5) return "Kode Pos harus diisi 5 digit angka.";
    } else if (step === 2) {
      if (!formData.namaAyah.trim()) return "Nama Ayah kandung wajib diisi.";
      if (!formData.nikAyah || formData.nikAyah.length < 16) return "NIK Ayah harus diisi 16 digit angka.";
      if (!formData.tempatLahirAyah.trim() || !formData.tanggalLahirAyah) return "Tempat & Tanggal Lahir Ayah wajib diisi.";
    } else if (step === 3) {
      if (!formData.namaIbu.trim()) return "Nama Ibu kandung wajib diisi.";
      if (!formData.nikIbu || formData.nikIbu.length < 16) return "NIK Ibu harus diisi 16 digit angka.";
      if (!formData.tempatLahirIbu.trim() || !formData.tanggalLahirIbu) return "Tempat & Tanggal Lahir Ibu wajib diisi.";
    }
    return "";
  };

  const nextStep = () => {
    const error = validateStep(formStep);
    if (error) {
      setValidationError(error);
      window.scrollTo({ top: 300, behavior: "smooth" });
      return;
    }
    setFormStep((prev) => prev + 1);
    setValidationError("");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const prevStep = () => {
    setFormStep((prev) => prev - 1);
    setValidationError("");
  };

  const executeRegistrationSubmission = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const error = validateStep(3);
    if (error) {
      setValidationError(error);
      // Scroll ke atas form agar error terlihat
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Generate ID dari Supabase (counter-based)
    const generatedId = await generateRegistrationId();

    const newRegistration: RegistrationData = {
      ...formData,
      id: generatedId,
      timestamp: new Date().toLocaleString("id-ID"),
    };

    // Simpan ke Supabase
    const result = await insertRegistration(newRegistration);

    if (!result.success) {
      setSubmitError(`Pendaftaran gagal disimpan: ${result.error}. Silakan coba lagi.`);
      setIsSubmitting(false);
      return;
    }

    // Callback jika disediakan
    if (onNewRegistration) {
      onNewRegistration(newRegistration);
    }

    // Update list lokal
    setRegistrations((prev) => [newRegistration, ...prev]);

    // Tampilkan kartu sukses
    setSelectedReceipt(newRegistration);
    setFormStep(4);
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      namaLengkap: "",
      jenisKelamin: "L",
      nisn: "",
      nik: "",
      noKk: "",
      tempatLahir: "",
      tanggalLahir: "",
      noAktaLahir: "",
      agama: "Islam",
      kewarganegaraan: "WNI",
      alamat: "",
      rt: "",
      rw: "",
      desa: "",
      kecamatan: "",
      kodePos: "",
      anakKe: 1,
      memilikiKip: "TIDAK",
      noKip: "",
      namaAyah: "",
      nikAyah: "",
      tempatLahirAyah: "",
      tanggalLahirAyah: "",
      pendidikanAyah: "SMA / SMK / MA",
      pekerjaanAyah: "Karyawan Swasta",
      penghasilanAyah: "Rp 1.000.000 - Rp 2.499.999",
      namaIbu: "",
      nikIbu: "",
      tempatLahirIbu: "",
      tanggalLahirIbu: "",
      pendidikanIbu: "SMA / SMK / MA",
      pekerjaanIbu: "Ibu Rumah Tangga",
      penghasilanIbu: "Kurang dari Rp 1.000.000",
    });
  };


  const printReceipt = () => {
    if (!selectedReceipt) return;
    const r = selectedReceipt;

    const row = (label: string, value: string) =>
      `<tr><td>${label}</td><td>: <strong>${value || '-'}</strong></td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Kartu Pendaftaran SPMB - SMK Ar Rosyid</title>
<style>
  @page { size: A4 portrait; margin: 15mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .wrap { border: 2.5px solid #1e293b; width: 100%; }

  /* ── HEADER ── */
  .head { background: #fef9c3; border-bottom: 2px solid #1e293b; display: flex; align-items: center; gap: 14px; padding: 12px 16px; }
  .head-logo { width: 56px; height: 56px; border: 2px solid #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: 900; color: #92400e; text-align: center; background: #fffbeb; flex-shrink: 0; }
  .head-info { flex: 1; }
  .head-info .sub { font-size: 8pt; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; }
  .head-info .school { font-size: 15pt; font-weight: 900; color: #0f172a; line-height: 1.1; }
  .head-info .ta { font-size: 8pt; color: #555; font-style: italic; }
  .head-noreg { text-align: right; }
  .head-noreg .label { font-size: 7pt; color: #555; font-weight: 600; text-transform: uppercase; }
  .head-noreg .val { font-family: monospace; font-size: 11pt; font-weight: 900; background: #fff; border: 1.5px solid #d97706; padding: 4px 10px; display: block; margin-top: 2px; }

  /* ── BODY ── */
  .body { display: grid; grid-template-columns: 108px 1fr; gap: 0; }
  .photo-col { border-right: 1.5px solid #e2e8f0; padding: 14px 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .photo-box { width: 96px; height: 122px; border: 1.5px dashed #94a3b8; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7pt; color: #888; text-align: center; gap: 4px; }
  .photo-stamp { font-size: 6.5pt; font-family: monospace; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 5px; text-align: center; line-height: 1.5; width: 96px; }

  .data-col { padding: 14px 16px; }
  .section-title { font-size: 8pt; font-weight: 900; color: #c2410c; text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1.5px solid #fed7aa; padding-bottom: 3px; margin-bottom: 7px; margin-top: 12px; }
  .section-title:first-child { margin-top: 0; }

  table.tbl { width: 100%; border-collapse: collapse; }
  table.tbl td { padding: 2.5px 2px; vertical-align: top; font-size: 8.5pt; border-bottom: 0.5px solid #f1f5f9; }
  table.tbl td:first-child { width: 33%; color: #475569; font-weight: 600; }
  table.tbl td:last-child { color: #0f172a; }
  table.tbl td strong { font-weight: 800; }

  /* ── KIP BADGE ── */
  .kip-yes { color: #dc2626; font-weight: 900; }

  /* ── FOOTER ── */
  .foot { border-top: 2px solid #1e293b; padding: 10px 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 7.5pt; background: #f8fafc; }
  .foot .note { color: #475569; line-height: 1.6; }
  .foot .ttd { text-align: center; }
  .foot .ttd .place { margin-bottom: 40px; }
  .foot .ttd strong { font-size: 8pt; }
  .foot .stamp { text-align: right; color: #475569; }
  .foot .stamp .box { border: 1px dashed #94a3b8; width: 80px; height: 80px; margin-left: auto; display: flex; align-items: center; justify-content: center; font-size: 7pt; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="head">
    <div class="head-logo">SMK<br/>AR<br/>ROSYID</div>
    <div class="head-info">
      <div class="sub">Kartu Peserta Bukti Registrasi Online</div>
      <div class="school">SMK AR ROSYID CAMPAKA PUTRA</div>
      <div class="ta">Penerimaan Siswa &amp; Murid Baru (SPMB) — Tahun Ajaran ${infoTahunAjaran}</div>
    </div>
    <div class="head-noreg">
      <div class="label">No. Registrasi</div>
      <div class="val">${r.id}</div>
      <div style="font-size:7pt;color:#64748b;margin-top:4px;">Terdaftar: ${r.timestamp}</div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">
    <div class="photo-col">
      <div class="photo-box">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        Tempel<br/>Pas Foto<br/>3 × 4
      </div>
      <div class="photo-stamp">TERDAFTAR<br/>ONLINE<br/>${r.timestamp}</div>
    </div>

    <div class="data-col">
      <!-- I. DATA PRIBADI -->
      <div class="section-title">I. Data Pribadi Calon Siswa</div>
      <table class="tbl">
        ${row('Nama Lengkap', r.namaLengkap?.toUpperCase())}
        ${row('NISN', r.nisn)}
        ${row('NIK', r.nik)}
        ${row('No. KK', r.noKk || '-')}
        ${row('No. Akta Lahir', r.noAktaLahir || '-')}
        ${row('Tempat, Tgl Lahir', (r.tempatLahir || '-') + ', ' + (r.tanggalLahir || '-'))}
        ${row('Jenis Kelamin', r.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan')}
        ${row('Agama', r.agama || '-')}
        ${row('Kewarganegaraan', r.kewarganegaraan || 'WNI')}
        ${row('Anak Ke-', String(r.anakKe || 1))}
        ${row('Alamat Lengkap', ((r.alamat||'') + ', RT ' + (r.rt||'-') + '/RW ' + (r.rw||'-') + ', Desa ' + (r.desa||'-') + ', Kec. ' + (r.kecamatan||'-') + ', ' + (r.kodePos||'')))}
        <tr><td>Status KIP</td><td>: <strong class="${r.memilikiKip === 'YA' ? 'kip-yes' : ''}">${r.memilikiKip === 'YA' ? '✔ MEMILIKI KIP' : 'Tidak'}</strong>${r.memilikiKip === 'YA' && r.noKip ? ' &nbsp;|&nbsp; No. KIP: <strong>' + r.noKip + '</strong>' : ''}</td></tr>
      </table>

      <!-- II. DATA AYAH -->
      <div class="section-title">II. Data Orang Tua — Ayah Kandung</div>
      <table class="tbl">
        ${row('Nama Ayah', (r.namaAyah||'').toUpperCase())}
        ${row('NIK Ayah', r.nikAyah||'-')}
        ${row('Tempat, Tgl Lahir', (r.tempatLahirAyah||'-') + ', ' + (r.tanggalLahirAyah||'-'))}
        ${row('Pendidikan Terakhir', r.pendidikanAyah||'-')}
        ${row('Pekerjaan', r.pekerjaanAyah||'-')}
        ${row('Penghasilan Bulanan', r.penghasilanAyah||'-')}
      </table>

      <!-- III. DATA IBU -->
      <div class="section-title">III. Data Orang Tua — Ibu Kandung</div>
      <table class="tbl">
        ${row('Nama Ibu', (r.namaIbu||'').toUpperCase())}
        ${row('NIK Ibu', r.nikIbu||'-')}
        ${row('Tempat, Tgl Lahir', (r.tempatLahirIbu||'-') + ', ' + (r.tanggalLahirIbu||'-'))}
        ${row('Pendidikan Terakhir', r.pendidikanIbu||'-')}
        ${row('Pekerjaan', r.pekerjaanIbu||'-')}
        ${row('Penghasilan Bulanan', r.penghasilanIbu||'-')}
      </table>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="foot">
    <div class="note">
      <strong>Catatan Penting:</strong><br/>
      • Kartu ini wajib dibawa saat verifikasi berkas.<br/>
      • Tempel pas foto 3×4 pada kotak di atas.<br/>
      • Dokumen sah dari Sistem Informasi SPMB.
    </div>
    <div class="ttd">
      <div class="place">Campaka, ${new Date().toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</div>
      <strong>Panitia SPMB ${infoTahunAjaran}</strong><br/>
      <span style="font-size:6.5pt;color:#64748b;">SMK Ar Rosyid Campaka Putra</span>
    </div>
    <div class="stamp">
      <div style="font-size:7pt;color:#475569;margin-bottom:4px;">Cap &amp; Tanda Tangan Resmi:</div>
      <div class="box">Stempel<br/>Resmi</div>
    </div>
  </div>

</div>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
  };

  // Quick statistics for landing visual
  const stats = {
    total: registrations.length,
    kip: registrations.filter(r => r.memilikiKip === 'YA').length,
    laki: registrations.filter(r => r.jenisKelamin === 'L').length,
    perempuan: registrations.filter(r => r.jenisKelamin === 'P').length,
  };

  return (
    <div className="w-full bg-orange-grid pb-16 animate-fade-in font-sans">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-yellow-101 via-yellow-100 to-stone-100 text-slate-800 py-12 px-4 shadow-sm text-center border-b border-yellow-200">
        <div className="max-w-4xl mx-auto">
          <span className="bg-yellow-200/60 text-amber-900 font-extrabold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-amber-300 inline-block mb-2">
            SPMB ONLINE - TAHUN AJARAN {infoTahunAjaran}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            SISTEM PENERIMAAN MAHASISWA & SISWA DIDIK BARU (SPMB)
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-2 font-medium">
            Gabung bersama ribuan siswa cerdas di SMK Ar Rosyid Campaka Putra. Daftar secara instan berkas online sekarang!
          </p>
        </div>
      </div>

      {/* Sub Menu Links */}
      <div className="max-w-7xl mx-auto px-4 -translate-y-4 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg p-1.5 border border-yellow-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap justify-start md:justify-center max-w-2xl mx-auto">
          <button
            onClick={() => { setActiveSub("jadwal"); setFormStep(1); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition shrink-0 uppercase cursor-pointer ${
              activeSub === "jadwal" ? "bg-amber-400 text-slate-950 shadow border border-amber-300" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Alur \& Informasi
          </button>
          <button
            onClick={() => { setActiveSub("formulir"); setFormStep(1); setSelectedReceipt(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition shrink-0 uppercase cursor-pointer ${
              activeSub === "formulir" ? "bg-amber-400 text-slate-950 shadow border border-amber-300" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Formulir Pendaftaran
          </button>
          <button
            onClick={() => { setActiveSub("data-pendaftar"); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition shrink-0 uppercase cursor-pointer ${
              activeSub === "data-pendaftar" ? "bg-amber-400 text-slate-950 shadow border border-amber-300" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Cari & Cetak Kartu
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">

        {/* 1. JADWAL & ALUR PENDAFTARAN */}
        {activeSub === "jadwal" && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-orange-100/60">
              <h2 className="text-xl md:text-2xl font-black text-slate-950 border-b border-orange-100 pb-4 mb-6 flex items-center gap-2">
                <span className="w-2.5 h-6 bg-orange-500 rounded-full inline-block"></span>
                Alur Pendaftaran SPMB Online
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative mt-10">
                {[
                  { step: "01", title: "Registrasi Akun/Form", desc: "Isi data formulir online secara lengkap: Data Pribadi, Data Ayah, dan Data Ibu." },
                  { step: "02", title: "Verifikasi Berkas", desc: "Tim SPMB melakukan verifikasi data NISN, NIK, dan kelengkapan dokumen pendukung." },
                  { step: "03", title: "Cetak Kartu Registrasi", desc: "Unduh dan cetak Kartu Registrasi Anda sebagai bukti pengisian data berhasil." },
                  { step: "04", title: "Pengumuman Kelulusan", desc: "Pantau kelulusan melalui menu Cek Status atau kunjungi langsung kampus SMK." }
                ].map((item, idx) => (
                  <div key={idx} className="relative bg-orange-50/20 border border-orange-100 p-5 rounded-2xl flex flex-col justify-between">
                    <span className="absolute -top-6 left-4 font-black font-mono text-4xl text-orange-200 bg-white px-2 border border-orange-100 rounded-lg">{item.step}</span>
                    <div className="pt-2">
                      <h3 className="font-extrabold text-sm text-[#7c2d12] mb-1.5">{item.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Syarat Pendaftaran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-orange-100/60">
                <h3 className="font-black text-lg text-slate-900 mb-4 border-b pb-2">Dokumen Syarat Fisik</h3>
                <ul className="text-xs md:text-sm text-slate-600 space-y-2.5 font-medium pl-1">
                  <li className="flex gap-2">✔️ SKL (Surat Keterangan Lulus) atau Ijazah SMP/MTs sederajat</li>
                  <li className="flex gap-2">✔️ Fotokopi Akta Kelahiran & Kartu Keluarga (KK)</li>
                  <li className="flex gap-2">✔️ Fotokopi KIP (Kartu Indonesia Pintar) bagi pemilik KIP</li>
                  <li className="flex gap-2">✔️ Pas foto saku berwarna ukuran 3x4 (3 lembar)</li>
                  <li className="flex gap-2">✔️ Cetak Bukti Registrasi SPMB Online dari Website</li>
                </ul>
              </div>

              <div className="bg-orange-600 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-yellow-300 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300/10 rounded-full blur-2xl"></div>
                <div>
                  <h3 className="font-black text-lg text-[#fff2d4] mb-3">⭐ Promo Beasiswa KIP & Prestasi</h3>
                  <p className="text-xs leading-relaxed text-orange-50 font-medium whitespace-pre-line">
                    {infoBatasKip}
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveSub("formulir")}
                    className="w-full bg-white text-orange-600 font-extrabold text-xs py-3 rounded-xl hover:bg-yellow-300 hover:text-slate-900 transition-colors cursor-pointer shadow"
                  >
                    Daftar Secara Online Sekarang juga
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. FORMULIR PENDAFTARAN (MULTISTEP) */}
        {activeSub === "formulir" && (
          infoStatusPendaftaran === "DITUTUP" ? (
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-red-100 text-center space-y-6">
              <div className="w-16 h-16 bg-red-150 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Pendaftaran Telah Ditutup</h3>
              <p className="text-sm text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                Mohon maaf, pendaftaran online siswa didik baru untuk Tahun Ajaran {infoTahunAjaran} saat ini telah ditutup/kuota terpenuhi. 
                <br /><br />
                Silakan hubungi pihak akademik/humas sekolah untuk menanyakan pendaftaran gelombang khusus.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setActiveSub("jadwal")}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase cursor-pointer"
                >
                  Kembali ke Alur Pendaftaran
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-orange-100/60">
            
            {/* Step Indicators */}
            {formStep < 4 && (
              <div className="mb-10">
                <div className="flex justify-between items-center max-w-md mx-auto">
                  {[
                    { nr: 1, text: "Data Pribadi" },
                    { nr: 2, text: "Data Ayah" },
                    { nr: 3, text: "Data Ibu" }
                  ].map((s) => (
                    <div key={s.nr} className="flex flex-col items-center flex-grow last:flex-grow-0 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm z-10 ${
                        formStep === s.nr 
                          ? "bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-900 border-2 border-yellow-300 shadow-md scale-110" 
                          : formStep > s.nr 
                          ? "bg-green-600 text-white" 
                          : "bg-slate-100 text-slate-400"
                      }`}>
                        {s.nr}
                      </div>
                      <span className={`text-[10px] font-extrabold tracking-wider mt-1 uppercase ${
                        formStep === s.nr ? "text-orange-600" : "text-slate-400"
                      }`}>{s.text}</span>
                    </div>
                  ))}
                </div>
                {validationError && (
                  <div className="max-w-md mx-auto mt-6 p-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-xs font-bold flex gap-2 items-start">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>
            )}

            {/* FORM MULTISTEP BODY */}
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-8">
              
              {/* STEP 1: DATA PRIBADI SISWA BARU */}
              {formStep === 1 && (
                <div className="animate-fade-in space-y-6">
                  <div className="border-b border-orange-100 pb-3">
                    <h3 className="font-black text-base text-[#7c2d12] uppercase tracking-wide flex items-center gap-2">
                      <User size={18} className="text-orange-500" /> I. Data Pribadi Calon Siswa Baru
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Nama Lengkap */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-nama" className="text-xs font-bold text-slate-700">NAMA LENGKAP <span className="text-red-500">*</span></label>
                      <input
                        id="txt-nama"
                        type="text"
                        name="namaLengkap"
                        value={formData.namaLengkap}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama lengkap sesuai ijazah/akta"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Jenis Kelamin */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-jk" className="text-xs font-bold text-slate-700">JENIS KELAMIN <span className="text-red-500">*</span></label>
                      <select
                        id="sel-jk"
                        name="jenisKelamin"
                        value={formData.jenisKelamin}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_JENIS_KELAMIN.map((j) => (
                          <option key={j.value} value={j.value}>{j.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* NISN */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-nisn" className="text-xs font-bold text-slate-700">NISN (Nomor Induk Siswa Nasional) <span className="text-red-500">*</span></label>
                      <input
                        id="txt-nisn"
                        type="text"
                        name="nisn"
                        value={formData.nisn}
                        onChange={handleInputChange}
                        maxLength={10}
                        placeholder="10 digit angka"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* NIK */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-nik" className="text-xs font-bold text-slate-700">NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span></label>
                      <input
                        id="txt-nik"
                        type="text"
                        name="nik"
                        value={formData.nik}
                        onChange={handleInputChange}
                        maxLength={16}
                        placeholder="16 digit angka NIK KTP Anda"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* NO KK */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-nokk" className="text-xs font-bold text-slate-700">NO KK (Nomor Kartu Keluarga) <span className="text-red-500">*</span></label>
                      <input
                        id="txt-nokk"
                        type="text"
                        name="noKk"
                        value={formData.noKk}
                        onChange={handleInputChange}
                        maxLength={16}
                        placeholder="16 digit angka Nomor KK"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* TEMPAT LAHIR */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-tmpt-lahir" className="text-xs font-bold text-slate-700">TEMPAT LAHIR <span className="text-red-500">*</span></label>
                      <input
                        id="txt-tmpt-lahir"
                        type="text"
                        name="tempatLahir"
                        value={formData.tempatLahir}
                        onChange={handleInputChange}
                        placeholder="Kota/Kabupaten lahir"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* TANGGAL LAHIR */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-tgl-lahir" className="text-xs font-bold text-slate-700">TANGGAL LAHIR <span className="text-red-500">*</span></label>
                      <input
                        id="txt-tgl-lahir"
                        type="date"
                        name="tanggalLahir"
                        value={formData.tanggalLahir}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      />
                    </div>

                    {/* NO REG REGISTRASI AKTA KELAHIRAN */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-noakta" className="text-xs font-bold text-slate-700">NO REGISTRASI AKTA KELAHIRAN <span className="text-red-500">*</span></label>
                      <input
                        id="txt-noakta"
                        type="text"
                        name="noAktaLahir"
                        value={formData.noAktaLahir}
                        onChange={handleInputChange}
                        placeholder="Contoh: 3203-LU-012026-0001"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* AGAMA dengan opsi pilihan */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-agama" className="text-xs font-bold text-slate-700">AGAMA <span className="text-red-500">*</span></label>
                      <select
                        id="sel-agama"
                        name="agama"
                        value={formData.agama}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_AGAMA.map((ag) => (
                          <option key={ag} value={ag}>{ag}</option>
                        ))}
                      </select>
                    </div>

                    {/* KEWARGANEGARAAN dengan opsi pilihan */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-wn" className="text-xs font-bold text-slate-700">KEWARGANEGARAAN <span className="text-red-500">*</span></label>
                      <select
                        id="sel-wn"
                        name="kewarganegaraan"
                        value={formData.kewarganegaraan}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_KEWARGANEGARAAN.map((wn) => (
                          <option key={wn} value={wn}>{wn}</option>
                        ))}
                      </select>
                    </div>

                    {/* ANAK KEBERAPA */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-anakke" className="text-xs font-bold text-slate-700">ANAK KEBERAPA <span className="text-red-500">*</span></label>
                      <select
                        id="sel-anakke"
                        name="anakKe"
                        value={formData.anakKe}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <option key={n} value={n}>Anak ke-{n}</option>
                        ))}
                      </select>
                    </div>

                    {/* APA MEMILIKI KIP? dengan opsi pilihan */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-has-kip" className="text-xs font-bold text-slate-700">APA MEMILIKI KARTU KIP? <span className="text-red-500">*</span></label>
                      <select
                        id="sel-has-kip"
                        name="memilikiKip"
                        value={formData.memilikiKip}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_KIP.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>

                    {formData.memilikiKip === "YA" && (
                      <div className="flex flex-col gap-1 animate-fade-in">
                        <label id="lbl-no-kip" className="text-xs font-bold text-slate-700">NOMOR KARTU KIP <span className="text-red-500">*</span></label>
                        <input
                          id="txt-no-kip"
                          type="text"
                          name="noKip"
                          required={formData.memilikiKip === "YA"}
                          value={formData.noKip}
                          onChange={handleInputChange}
                          placeholder="Masukkan No Kartu KIP..."
                          className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* ALAMAT LENGKAP */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1">
                      <label id="lbl-alamat" className="text-xs font-bold text-slate-700">ALAMAT RUMAH LENGKAP (JALAN, DITANDAI DUSUN) <span className="text-red-500">*</span></label>
                      <textarea
                        id="txt-alamat"
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        rows={2}
                        placeholder="Masukkan nama jalan, nomor rumah, RT, RW"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* RT */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-rt" className="text-xs font-bold text-slate-700">RT <span className="text-red-500">*</span></label>
                      <input
                        id="txt-rt"
                        type="text"
                        name="rt"
                        value={formData.rt}
                        onChange={handleInputChange}
                        placeholder="Contoh: 003"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* RW */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-rw" className="text-xs font-bold text-slate-700">RW <span className="text-red-500">*</span></label>
                      <input
                        id="txt-rw"
                        type="text"
                        name="rw"
                        value={formData.rw}
                        onChange={handleInputChange}
                        placeholder="Contoh: 005"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* DESA */}
                    <div className="flex flex-col gap-11 md:col-span-1">
                      <label id="lbl-desa" className="text-xs font-bold text-slate-700">DESA / KELURAHAN <span className="text-red-500">*</span></label>
                      <input
                        id="txt-desa"
                        type="text"
                        name="desa"
                        value={formData.desa}
                        onChange={handleInputChange}
                        placeholder="Nama desa"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* KECAMATAN */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-kec" className="text-xs font-bold text-slate-700">KECAMATAN <span className="text-red-500">*</span></label>
                      <input
                        id="txt-kec"
                        type="text"
                        name="kecamatan"
                        value={formData.kecamatan}
                        onChange={handleInputChange}
                        placeholder="Nama kecamatan"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* KODE POS */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-kodepos" className="text-xs font-bold text-slate-700">KODE POS <span className="text-red-500">*</span></label>
                      <input
                        id="txt-kodepos"
                        type="text"
                        name="kodePos"
                        value={formData.kodePos}
                        onChange={handleInputChange}
                        maxLength={5}
                        placeholder="5 digit"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t flex flex-col gap-3">
                    {validationError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex gap-2 items-start">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{validationError}</span>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={nextStep}
                        className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-xs px-8 py-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md min-h-[52px] active:scale-95 w-full sm:w-auto justify-center"
                      >
                        Lanjut ke Data Ayah
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DATA ORANG TUA (AYAH) */}
              {formStep === 2 && (
                <div className="animate-fade-in space-y-6">
                  <div className="border-b border-orange-100 pb-3">
                    <h3 className="font-black text-base text-[#7c2d12] uppercase tracking-wide flex items-center gap-2">
                      <Users size={18} className="text-orange-500" /> II. Data Orang Tua (Kandung / Wali) - Ayah
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Ayah */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-nama-ayah" className="text-xs font-bold text-slate-700">NAMA AYAH KANDUNG <span className="text-red-500">*</span></label>
                      <input
                        id="txt-nama-ayah"
                        type="text"
                        name="namaAyah"
                        value={formData.namaAyah}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama lengkap ayah kandung"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* NIK Ayah */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-nik-ayah" className="text-xs font-bold text-slate-700">NIK AYAH <span className="text-red-500">*</span></label>
                      <input
                        id="txt-nik-ayah"
                        type="text"
                        name="nikAyah"
                        value={formData.nikAyah}
                        onChange={handleInputChange}
                        maxLength={16}
                        placeholder="16 digit angka NIK Ayah"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Tempat Lahir Ayah */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-tmpt-ayah" className="text-xs font-bold text-slate-700">TEMPAT LAHIR AYAH <span className="text-red-500">*</span></label>
                      <input
                        id="txt-tmpt-ayah"
                        type="text"
                        name="tempatLahirAyah"
                        value={formData.tempatLahirAyah}
                        onChange={handleInputChange}
                        placeholder="Kota tempat lahir"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Tanggal Lahir Ayah */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-tgl-ayah" className="text-xs font-bold text-slate-700">TANGGAL LAHIR AYAH <span className="text-red-500">*</span></label>
                      <input
                        id="txt-tgl-ayah"
                        type="date"
                        name="tanggalLahirAyah"
                        value={formData.tanggalLahirAyah}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      />
                    </div>

                    {/* Pendidikan Ayah dengan opsi pilihan */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-pend-ayah" className="text-xs font-bold text-slate-700">PENDIDIKAN TERAKHIR AYAH <span className="text-red-500">*</span></label>
                      <select
                        id="sel-pend-ayah"
                        name="pendidikanAyah"
                        value={formData.pendidikanAyah}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_PENDIDIKAN.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* Pekerjaan Ayah dengan opsi pilihan */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-pek-ayah" className="text-xs font-bold text-slate-700">PEKERJAAN AYAH <span className="text-red-500">*</span></label>
                      <select
                        id="sel-pek-ayah"
                        name="pekerjaanAyah"
                        value={formData.pekerjaanAyah}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_PEKERJAAN.map((pek) => (
                          <option key={pek} value={pek}>{pek}</option>
                        ))}
                      </select>
                    </div>

                    {/* Penghasilan Ayah dengan opsi pilihan */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-gaji-ayah" className="text-xs font-bold text-slate-700">PENGHASILAN BULANAN AYAH <span className="text-red-500">*</span></label>
                      <select
                        id="sel-gaji-ayah"
                        name="penghasilanAyah"
                        value={formData.penghasilanAyah}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_PENGHASILAN.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t flex flex-col gap-3">
                    {validationError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex gap-2 items-start">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{validationError}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold text-xs px-6 py-4 rounded-xl transition cursor-pointer min-h-[52px]"
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-xs px-8 py-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md min-h-[52px] active:scale-95"
                      >
                        Lanjut ke Data Ibu
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DATA ORANG TUA (IBU) */}
              {formStep === 3 && (
                <div className="animate-fade-in space-y-6">
                  <div className="border-b border-orange-100 pb-3">
                    <h3 className="font-black text-base text-[#7c2d12] uppercase tracking-wide flex items-center gap-2">
                      <Users size={18} className="text-orange-500" /> III. Data Orang Tua (Kandung / Wali) - Ibu
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Ibu */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-nama-ibu" className="text-xs font-bold text-slate-700">NAMA IBU KANDUNG <span className="text-red-500">*</span></label>
                      <input
                        id="txt-nama-ibu"
                        type="text"
                        name="namaIbu"
                        value={formData.namaIbu}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama lengkap ibu kandung"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* NIK Ibu */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-nik-ibu" className="text-xs font-bold text-slate-700">NIK IBU <span className="text-red-500">*</span></label>
                      <input
                        id="txt-nik-ibu"
                        type="text"
                        name="nikIbu"
                        value={formData.nikIbu}
                        onChange={handleInputChange}
                        maxLength={16}
                        placeholder="16 digit angka NIK Ibu"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Tempat Lahir Ibu */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-tmpt-ibu" className="text-xs font-bold text-slate-700">TEMPAT LAHIR IBU <span className="text-red-500">*</span></label>
                      <input
                        id="txt-tmpt-ibu"
                        type="text"
                        name="tempatLahirIbu"
                        value={formData.tempatLahirIbu}
                        onChange={handleInputChange}
                        placeholder="Kota tempat lahir"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Tanggal Lahir Ibu */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-tgl-ibu" className="text-xs font-bold text-slate-700">TANGGAL LAHIR IBU <span className="text-red-500">*</span></label>
                      <input
                        id="txt-tgl-ibu"
                        type="date"
                        name="tanggalLahirIbu"
                        value={formData.tanggalLahirIbu}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      />
                    </div>

                    {/* Pendidikan Ibu dengan opsi pilihan */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-pend-ibu" className="text-xs font-bold text-slate-700">PENDIDIKAN TERAKHIR IBU <span className="text-red-500">*</span></label>
                      <select
                        id="sel-pend-ibu"
                        name="pendidikanIbu"
                        value={formData.pendidikanIbu}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_PENDIDIKAN.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* Pekerjaan Ibu dengan opsi pilihan */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-pek-ibu" className="text-xs font-bold text-slate-700">PEKERJAAN IBU <span className="text-red-500">*</span></label>
                      <select
                        id="sel-pek-ibu"
                        name="pekerjaanIbu"
                        value={formData.pekerjaanIbu}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_PEKERJAAN.map((pek) => (
                          <option key={pek} value={pek}>{pek}</option>
                        ))}
                      </select>
                    </div>

                    {/* Penghasilan Ibu dengan opsi pilihan */}
                    <div className="flex flex-col gap-1">
                      <label id="lbl-gaji-ibu" className="text-xs font-bold text-slate-700">PENGHASILAN BULANAN IBU <span className="text-red-500">*</span></label>
                      <select
                        id="sel-gaji-ibu"
                        name="penghasilanIbu"
                        value={formData.penghasilanIbu}
                        onChange={handleInputChange}
                        className="p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {OPSI_PENGHASILAN.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t flex flex-col gap-3">
                    {(validationError || submitError) && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex gap-2 items-start">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{validationError || submitError}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold text-xs px-6 py-4 rounded-xl transition cursor-pointer min-h-[52px]"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={(e) => {
                        e.preventDefault();
                        executeRegistrationSubmission(e as any);
                      }}
                      className="bg-gradient-to-r from-yellow-200 to-stone-100 hover:from-yellow-300 hover:to-stone-200 active:from-yellow-400 text-slate-900 border border-yellow-300 font-black text-xs px-8 py-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 min-h-[52px]"
                    >
                      {isSubmitting ? (
                        <><Loader2 size={16} className="animate-spin" /> Menyimpan ke Database...</>
                      ) : (
                        <><CheckCircle size={16} className="text-amber-700" /> Kirim &amp; Simpan Data Pendaftaran</>
                      )}
                    </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: SUCCESS REGISTRATION CARD PRINT (KARTU PENDAFTARAN) */}
              {formStep === 4 && selectedReceipt && (
                <div className="animate-fade-in space-y-6">
                  
                  <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center max-w-xl mx-auto space-y-2">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto">
                      <CheckCircle size={28} />
                    </div>
                    <h3 className="font-black text-slate-900 text-md">Pendaftaran SPMB Berhasil Dilakukan!</h3>
                    <p className="text-xs text-slate-500">
                      Silakan **Cetak/Print Kartu Bukti Registrasi** di bawah ini untuk dibawa saat datang verifikasi berkas di kampus SMK Ar Rosyid Campaka Putra.
                    </p>
                  </div>

                  {/* DIGITAL REGISTRATION CARD */}
                  <div id="print-area" className="border-4 border-dashed border-yellow-300 p-4 md:p-8 rounded-3xl bg-yellow-50/10 max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl border border-yellow-100 overflow-hidden">
                      
                      {/* Header */}
                      <div className="card-header bg-gradient-to-r from-yellow-101 via-yellow-100 to-stone-101 text-slate-900 p-5 flex justify-between items-center border-b border-yellow-200">
                        <div>
                          <div className="title font-extrabold text-sm tracking-wide">KARTU PESERTA BUKTI REGISTRASI ONLINE</div>
                          <div className="school font-black text-lg md:text-xl text-slate-950">SMK AR ROSYID CAMPAKA PUTRA</div>
                          <div className="ta text-[10px] text-slate-500 italic font-mono uppercase">Tahun Ajaran {infoTahunAjaran}</div>
                        </div>
                        <div className="noreg bg-yellow-200/60 text-amber-955 border border-yellow-300 rounded font-bold font-mono text-[11px] uppercase tracking-wider px-3 py-1">
                          NO REG: {selectedReceipt.id}
                        </div>
                      </div>

                      {/* Card Info Details */}
                      <div className="card-body p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        
                        {/* Photo placeholder */}
                        <div className="photo-box md:col-span-3 flex flex-col items-center gap-3">
                          <div className="photo-placeholder w-28 h-36 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-400 font-bold select-none aspect-[3/4]">
                            <User size={32} className="text-slate-300 mb-1" />
                            Foto 3x4 Calon Siswa
                          </div>
                          <div className="photo-timestamp text-[10px] font-mono bg-slate-100 px-2.5 py-1 text-slate-500 rounded text-center leading-tight">
                            TERDAFTAR ONLINE<br />
                            {selectedReceipt.timestamp}
                          </div>
                        </div>

                        {/* Text data fields */}
                        <div className="data-section md:col-span-9 space-y-4">
                          <h4 className="text-xs font-black text-orange-600 border-b border-orange-50 uppercase tracking-widest pb-1">I. DATA PRIBADI SISWA</h4>
                          
                          <table className="data-table w-full text-xs text-left text-slate-700 font-medium leading-relaxed border-collapse">
                            <tbody>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 w-1/3 font-semibold text-slate-500">NAMA LENGKAP</td>
                                <td className="py-1 font-bold text-slate-950 uppercase">: {selectedReceipt.namaLengkap}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 font-semibold text-slate-500">NISN</td>
                                <td className="py-1 font-mono font-bold">: {selectedReceipt.nisn}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 font-semibold text-slate-500">NIK</td>
                                <td className="py-1 font-mono font-bold">: {selectedReceipt.nik}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 font-semibold text-slate-500">TTL / AGAMA</td>
                                <td className="py-1">: {selectedReceipt.tempatLahir}, {selectedReceipt.tanggalLahir} / {selectedReceipt.agama}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 font-semibold text-slate-500">JENIS KELAMIN</td>
                                <td className="py-1">: {selectedReceipt.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 font-semibold text-slate-500">ALAMAT</td>
                                <td className="py-1 uppercase text-[11px] leading-tight">: {selectedReceipt.alamat}, RT {selectedReceipt.rt}/RW {selectedReceipt.rw}, DESA {selectedReceipt.desa}, KEC. {selectedReceipt.kecamatan}, {selectedReceipt.kodePos}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 font-semibold text-slate-500">PEMILIK KIP?</td>
                                <td className="py-1 font-bold text-red-600">: {selectedReceipt.memilikiKip} {selectedReceipt.memilikiKip === "YA" && selectedReceipt.noKip && `[No. KIP: ${selectedReceipt.noKip}]`}</td>
                              </tr>
                            </tbody>
                          </table>

                          <h4 className="text-xs font-black text-orange-600 border-b border-orange-50 uppercase tracking-widest pb-1 pt-2">II. DATA ORANG TUA</h4>
                          
                          <table className="data-table w-full text-xs text-left text-slate-700 font-medium leading-relaxed border-collapse">
                            <tbody>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 w-1/3 font-semibold text-slate-500">NAMA AYAH</td>
                                <td className="py-1 font-bold text-slate-900">: {selectedReceipt.namaAyah} (NIK: {selectedReceipt.nikAyah})</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 font-semibold text-slate-500">PEKERJAAN / GAJI</td>
                                <td className="py-1">: {selectedReceipt.pekerjaanAyah} / {selectedReceipt.penghasilanAyah}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 font-semibold text-slate-500">NAMA IBU</td>
                                <td className="py-1 font-bold text-slate-900">: {selectedReceipt.namaIbu} (NIK: {selectedReceipt.nikIbu})</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 font-semibold text-slate-500">PEKERJAAN / GAJI</td>
                                <td className="py-1">: {selectedReceipt.pekerjaanIbu} / {selectedReceipt.penghasilanIbu}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Footer signatures */}
                      <div className="card-footer bg-slate-50/50 p-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                        <div>
                          * Dokumen ini sah dikeluarkan oleh Sistem Informasi Pendaftaran Akademik SMK Ar Rosyid.
                        </div>
                        <div className="text-right">
                          Petugas SPMB,<br /><br /><br />
                          <strong>( Panitia SPMB {infoTahunAjaran} )</strong>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Actions for printing */}
                  <div className="flex gap-4 max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={printReceipt}
                      className="flex-1 bg-gradient-to-r from-yellow-200 to-stone-100 border border-yellow-300 text-slate-900 font-black text-xs py-3.5 rounded-xl hover:from-yellow-300 hover:to-stone-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Printer size={16} className="text-amber-700" />
                      CETAK / PRINT KARTU SEKARANG
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormStep(1);
                        setSelectedReceipt(null);
                      }}
                      className="flex-1 bg-slate-900 hover:bg-yellow-500 hover:text-slate-950 text-white font-bold text-xs py-3.5 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      Daftar Siswa Baru Lainnya
                    </button>
                  </div>

                </div>
              )}

            </form>

          </div>
          )
        )}

        {/* 3. CARI DATA & TABEL PENDAFTAR */}
        {activeSub === "data-pendaftar" && (
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-orange-100/60 space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-slate-950 border-b border-orange-100 pb-4 mb-6 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-orange-500 rounded-full inline-block"></span>
              Cari & Cetak Kartu Registrasi Peserta
            </h2>

            {/* Simulated Live Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-orange-55 shadow-sm border border-orange-100 p-4 rounded-2xl text-center">
                <span className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Total Pendaftar</span>
                <span className="font-extrabold text-2xl text-[#ea580c] font-mono leading-none">{stats.total}</span>
              </div>
              <div className="bg-orange-55 shadow-sm border border-orange-100 p-4 rounded-2xl text-center">
                <span className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Memiliki KIP</span>
                <span className="font-extrabold text-2xl text-[#ea580c] font-mono leading-none">{stats.kip}</span>
              </div>
              <div className="bg-orange-55 shadow-sm border border-orange-100 p-4 rounded-2xl text-center">
                <span className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Laki-laki (L)</span>
                <span className="font-extrabold text-2xl text-[#ea580c] font-mono leading-none">{stats.laki}</span>
              </div>
              <div className="bg-orange-55 shadow-sm border border-orange-100 p-4 rounded-2xl text-center">
                <span className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Perempuan (P)</span>
                <span className="font-extrabold text-2xl text-[#ea580c] font-mono leading-none">{stats.perempuan}</span>
              </div>
            </div>

            {/* Look up entry */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masukkan Nomor Registrasi, Nama Lengkap, atau NISN Siswa..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 shadow-sm"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="bg-slate-900 hover:bg-orange-600 text-white font-bold text-xs px-6 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60"
              >
                {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Cari
              </button>
            </form>

            <div className="pt-6">
              {searchResults ? (
                <div className="space-y-4">
                  <h3 className="font-black text-sm text-[#7c2d12] uppercase tracking-wider mb-2">Hasil Pencarian ({searchResults.length}):</h3>
                  {searchResults.length === 0 ? (
                    <div className="p-8 bg-slate-50 text-center rounded-2xl border border-dashed border-slate-200 font-bold text-slate-400 text-xs text-medium">
                      ⚠️ Maaf, data dengan kata kunci tersebut tidak ditemukan. Silakan periksa kembali pengejaan nama, NISN, atau NIK Anda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          className="p-5 bg-orange-50/15 border border-orange-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow transition-all"
                        >
                          <div>
                            <span className="bg-slate-900/5 text-[#7c2d12] font-black font-mono text-[10px] px-2 py-0.5 rounded border border-orange-100">
                              {item.id}
                            </span>
                            <h4 className="font-extrabold text-base text-slate-900 mt-1 uppercase">{item.namaLengkap}</h4>
                            <p className="text-[11px] text-slate-400 font-medium">
                              NISN: {item.nisn} | NIK: {item.nik} | KIP: <strong className="text-orange-600">{item.memilikiKip}{item.memilikiKip === 'YA' && item.noKip ? ` [No. KIP: ${item.noKip}]` : ''}</strong> | Terdaftar: {item.timestamp}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedReceipt(item);
                              setFormStep(4);
                              setActiveSub("formulir");
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                          >
                            <Printer size={14} />
                            Cetak Kartu
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : registrations.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest mb-1.5">Pendaftar Terakhir (Cek & Cetak):</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {registrations.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-[#fffefe] border border-orange-100/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow transition"
                      >
                        <div>
                          <span className="bg-orange-50 text-[#7c2d12] font-bold font-mono text-[9px] px-2 py-0.5 rounded border border-orange-100/50">
                            {item.id}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 mt-1 uppercase">{item.namaLengkap}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            NISN: {item.nisn} | KIP: <strong>{item.memilikiKip}{item.memilikiKip === 'YA' && item.noKip ? ` [No. KIP: ${item.noKip}]` : ''}</strong> | {item.timestamp}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedReceipt(item);
                            setFormStep(4);
                            setActiveSub("formulir");
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                        >
                          <Printer size={12} />
                          Cetak Kartu
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-bold text-xs">
                  📌 Belum ada data pendaftar baru yang dimasukkan. Silakan masuk menu **Formulir Pendaftaran** untuk mendaftar pertama kali.
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
