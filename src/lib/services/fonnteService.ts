/**
 * Fonnte WhatsApp API Service
 * https://fonnte.com
 *
 * Setup:
 * 1. Daftar di https://fonnte.com → tambahkan device WA
 * 2. Copy Token dari dashboard
 * 3. Isi VITE_FONNTE_TOKEN di file .env
 */

const FONNTE_TOKEN = (import.meta as any).env?.VITE_FONNTE_TOKEN as string | undefined;

/**
 * Kirim pesan WhatsApp via Fonnte
 * @param target  Nomor WA (08xxx atau 628xxx)
 * @param message Isi pesan teks
 */
export async function sendWhatsApp(
  target: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!FONNTE_TOKEN || FONNTE_TOKEN.trim() === "" || FONNTE_TOKEN === "ISI_TOKEN_FONNTE") {
    console.warn("[Fonnte] Token belum diset. Notif WA dilewati.");
    return { success: false, error: "Token Fonnte belum dikonfigurasi" };
  }

  const phone = normalizePhone(target);
  if (!phone) {
    return { success: false, error: "Nomor WA tidak valid" };
  }

  try {
    const form = new FormData();
    form.append("target", phone);
    form.append("message", message);
    form.append("countryCode", "62");

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: FONNTE_TOKEN },
      body: form,
    });

    const data = await res.json() as { status: boolean; reason?: string; message?: string };

    if (data.status === true) {
      console.log(`[Fonnte] WA terkirim ke ${phone}`);
      return { success: true };
    }
    console.warn("[Fonnte] Gagal:", data.reason || data.message);
    return { success: false, error: data.reason || data.message || "Gagal" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Fonnte] Error:", msg);
    return { success: false, error: msg };
  }
}

/** Normalisasi nomor Indonesia → format 628xxx */
function normalizePhone(phone: string): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("62")) return d;
  if (d.startsWith("0"))  return "62" + d.slice(1);
  if (d.startsWith("8"))  return "62" + d;
  return d;
}

/** Buat pesan notif absensi untuk orang tua */
export function buildAbsensiWAMessage(p: {
  namaSiswa: string;
  kelas: string;
  jurusan: string;
  tipe: "MASUK" | "PULANG";
  status: string;
  timestamp: string;
  jarak: number;
  namaSekolah?: string;
}): string {
  const sekolah = p.namaSekolah || "SMK Ar Rosyid Campaka Putra";
  const icon = p.tipe === "MASUK"
    ? (p.status === "TERLAMBAT" ? "⚠️" : "✅")
    : "🏠";

  return `${icon} *NOTIFIKASI ABSENSI*
*${sekolah}*

Yth. Orang Tua/Wali Murid,

Putra/putri Anda telah melakukan presensi:

👤 *Nama*   : ${p.namaSiswa}
📚 *Kelas*   : ${p.kelas} – ${p.jurusan}
📋 *Jenis*   : ${p.tipe === "MASUK" ? "Masuk Sekolah" : "Pulang Sekolah"}
🕐 *Waktu*  : ${p.timestamp}
📍 *Status*  : ${p.status}
📡 *Jarak*   : ${p.jarak} meter dari sekolah

_Pesan otomatis dari Sistem Absensi Digital ${sekolah}._`;
}
