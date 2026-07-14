/**
 * Vercel Serverless Function — Proxy Fonnte WA
 * POST /api/send-wa
 * Body JSON: { target: "08xxx", message: "..." }
 *
 * Environment variable di Vercel Dashboard:
 *   FONNTE_TOKEN = <token dari https://fonnte.com/dashboard>
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
    return;
  }

  const FONNTE_TOKEN = process.env.FONNTE_TOKEN || process.env.VITE_FONNTE_TOKEN;
  if (!FONNTE_TOKEN) {
    console.warn("[send-wa] Token Fonnte tidak ada di environment");
    res.statusCode = 200;
    res.end(JSON.stringify({ success: false, error: "Token belum dikonfigurasi" }));
    return;
  }

  // Parse request body
  let body = {};
  try {
    if (req.body) {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } else {
      body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => { data += chunk; });
        req.on("end", () => {
          try { resolve(JSON.parse(data || "{}")); }
          catch { resolve({}); }
        });
        req.on("error", reject);
      });
    }
  } catch {
    body = {};
  }

  const { target, message } = body;

  if (!target || !message) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: "target dan message wajib diisi" }));
    return;
  }

  const phone = normalizePhone(String(target));
  if (!phone) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: "Nomor WA tidak valid" }));
    return;
  }

  try {
    const form = new URLSearchParams();
    form.append("target", phone);
    form.append("message", String(message));
    form.append("countryCode", "62");

    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: FONNTE_TOKEN },
      body: form,
    });

    const data = await fonnteRes.json();

    if (data.status === true) {
      console.log(`[send-wa] OK → ${phone}`);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
    } else {
      const errMsg = data.reason || data.message || "Gagal kirim";
      console.warn("[send-wa] Gagal:", errMsg);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: false, error: errMsg }));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-wa] Error:", msg);
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: msg }));
  }
}

function normalizePhone(phone) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("8")) return "62" + d;
  return d;
}
