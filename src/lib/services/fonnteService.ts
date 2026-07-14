/**
 * Fonnte WhatsApp Service
 * Memanggil Vercel Serverless Function /api/send-wa
 */

export async function sendWhatsApp(
  target: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!target || !message) {
    return { success: false, error: "target dan message wajib diisi" };
  }

  try {
    // /api/send-wa adalah Vercel serverless function
    const res = await fetch("/api/send-wa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, message }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("[Fonnte] HTTP error:", res.status, text);
      return { success: false, error: `Server error ${res.status}` };
    }

    const data = await res.json() as { success: boolean; error?: string };
    if (data.success) {
      console.log(`[Fonnte] WA terkirim ke ${target}`);
    } else {
      console.warn("[Fonnte] Gagal:", data.error);
    }
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Fonnte] Network error:", msg);
    return { success: false, error: msg };
  }
}

/** Buat pesan notifikasi absensi untuk orang tua */
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
