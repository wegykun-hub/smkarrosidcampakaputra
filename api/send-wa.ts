/**
 * Vercel Serverless Function — Proxy Fonnte WA
 * Endpoint: POST /api/send-wa
 * Body: { target: string, message: string }
 *
 * Set environment variable FONNTE_TOKEN di Vercel Dashboard:
 * Settings → Environment Variables → FONNTE_TOKEN
 */

import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
    return;
  }

  const FONNTE_TOKEN = process.env.FONNTE_TOKEN || process.env.VITE_FONNTE_TOKEN;
  if (!FONNTE_TOKEN) {
    console.warn("[send-wa] FONNTE_TOKEN tidak dikonfigurasi");
    res.statusCode = 200;
    res.end(JSON.stringify({ success: false, error: "Token Fonnte belum diset di server" }));
    return;
  }

  // Parse body
  let body: { target?: string; message?: string } = {};
  try {
    if (req.body) {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } else {
      body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => { data += chunk; });
        req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); } });
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

  const phone = normalizePhone(target);
  if (!phone) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: "Nomor WA tidak valid" }));
    return;
  }

  try {
    const form = new URLSearchParams();
    form.append("target", phone);
    form.append("message", message);
    form.append("countryCode", "62");

    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: FONNTE_TOKEN },
      body: form,
    });

    const data = await fonnteRes.json() as { status: boolean; reason?: string; message?: string };

    if (data.status === true) {
      console.log(`[send-wa] OK → ${phone}`);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    console.warn("[send-wa] Gagal:", data.reason || data.message);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: false, error: data.reason || data.message || "Gagal" }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-wa] Error:", msg);
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: msg }));
  }
}

function normalizePhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("8")) return "62" + d;
  return d;
}
