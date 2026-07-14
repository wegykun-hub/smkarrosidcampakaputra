/**
 * Fonnte WhatsApp Service
 * Memanggil https://api.fonnte.com/send langsung dari browser.
 *
 * Token didapat dari environment variable VITE_FONNTE_TOKEN.
 * Set di Vercel Dashboard → Settings → Environment Variables:
 *   Key: VITE_FONNTE_TOKEN
 *   Value: <token dari https://fonnte.com/dashboard>
 */

const FONNTE_TOKEN = (() => {
  try { return (import.meta as any).env?.VITE_FONNTE_TOKEN as string || ""; }
  catch { return ""; }
})();

/**
 * Kirim WA langsung via Fonnte API
 */
export async function sendWhatsApp(
  target: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!FONNTE_TOKEN || FONNTE_TOKEN.trim() === "") {
    console.warn("[Fonnte] VITE_FONNTE_TOKEN belum diset.");
    return { success: false, error: "Token belum dikonfigurasi" };
  }
  if (!target || !message) {
    return { success: false, error: "target dan message wajib diisi" };
  }

  const phone = normalizePhone(target);
  if (!phone) return { success: false, error: "Nomor WA tidak valid" };

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
      console.log(`[Fonnte] ✓ WA terkirim ke ${phone}`);
      return { success: true };
    }
    const err = data.reason || data.message || "Gagal";
    console.warn("[Fonnte] ✗ Gagal:", err);
    return { success: false, error: err };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[Fonnte] Error:", msg);
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

function normalizePhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("8")) return "62" + d;
  return d;
}
