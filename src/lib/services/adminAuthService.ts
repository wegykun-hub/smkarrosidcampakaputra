import { supabase } from '../supabaseClient';

// ── Tipe ─────────────────────────────────────────────────────────────────

export interface AdminAccount {
  id?: string;
  username: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN_STAF';
  isActive: boolean;
  createdAt?: string;
}

export interface LoginResult {
  success: boolean;
  admin?: AdminAccount;
  error?: string;
}

// ── Hash SHA-256 — kompatibel localhost HTTP dan Network HTTP ─────────────
// Menggunakan implementasi pure-JS sebagai fallback kalau crypto.subtle tidak tersedia
// (crypto.subtle hanya tersedia di HTTPS atau localhost)
export async function hashPassword(username: string, password: string): Promise<string> {
  const msg = `${username}:${password}`;

  // Coba Web Crypto API dulu (HTTPS / localhost)
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const buf = new TextEncoder().encode(msg);
      const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    } catch { /* fallthrough ke pure-JS */ }
  }

  // Fallback: SHA-256 pure JavaScript (untuk HTTP non-localhost)
  return sha256PureJs(msg);
}

// SHA-256 implementasi pure JavaScript — RFC 6234 compliant
function sha256PureJs(str: string): string {
  // Convert string ke bytes UTF-8
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80)       { bytes.push(c); }
    else if (c < 0x800) { bytes.push((c >> 6) | 0xC0, (c & 0x3F) | 0x80); }
    else                { bytes.push((c >> 12) | 0xE0, ((c >> 6) & 0x3F) | 0x80, (c & 0x3F) | 0x80); }
  }

  // Pre-processing: padding
  const msgLen = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  // 64-bit big-endian bit length
  const bitLen = msgLen * 8;
  bytes.push(0, 0, 0, 0,
    (bitLen / 0x1000000) & 0xFF,
    (bitLen / 0x10000)   & 0xFF,
    (bitLen / 0x100)     & 0xFF,
     bitLen               & 0xFF
  );

  // Initial hash values (first 32 bits of fractional parts of sqrt of first 8 primes)
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  // Round constants (first 32 bits of fractional parts of cube roots of first 64 primes)
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];

  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < bytes.length; i += 64) {
    const w = new Array(64).fill(0);
    for (let j = 0; j < 16; j++) {
      w[j] = ((bytes[i + j*4]     << 24) |
              (bytes[i + j*4 + 1] << 16) |
              (bytes[i + j*4 + 2] <<  8) |
               bytes[i + j*4 + 3]) >>> 0;
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(w[j-15], 7) ^ rotr(w[j-15], 18) ^ (w[j-15] >>> 3);
      const s1 = rotr(w[j-2],  17) ^ rotr(w[j-2],  19) ^ (w[j-2]  >>> 10);
      w[j] = (w[j-16] + s0 + w[j-7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let j = 0; j < 64; j++) {
      const S1  = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch  = (e & f) ^ (~e & g);
      const tmp1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
      const S0  = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const tmp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + tmp1) >>> 0;
      d = c; c = b; b = a; a = (tmp1 + tmp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }

  return H.map(n => n.toString(16).padStart(8, '0')).join('');
}

// ── Service Functions ─────────────────────────────────────────────────────

/**
 * Login admin – verifikasi username + password
 */
export async function loginAdmin(
  username: string,
  password: string
): Promise<LoginResult> {
  if (!username.trim() || !password.trim()) {
    return { success: false, error: 'Username dan password harus diisi.' };
  }

  try {
    const { data, error } = await (supabase as any)
      .from('admin_accounts')
      .select('id, username, name, role, is_active, password_hash, created_at')
      .eq('username', username.trim().toLowerCase())
      .eq('is_active', true)
      .maybeSingle();  // maybeSingle() tidak 406 saat 0 baris

    if (error) {
      console.error('[AdminAuth] Supabase query error:', error.code, error.message);
      return { success: false, error: `Database error: ${error.message}` };
    }

    if (!data) {
      return { success: false, error: 'Username tidak ditemukan atau akun tidak aktif.' };
    }

    const inputHash = await hashPassword(username.trim().toLowerCase(), password);
    console.log('[AdminAuth] Input hash:', inputHash);
    console.log('[AdminAuth] Stored hash:', data.password_hash);

    if (inputHash !== data.password_hash) {
      return { success: false, error: 'Password salah. Silakan coba lagi.' };
    }

    return {
      success: true,
      admin: {
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role,
        isActive: data.is_active,
        createdAt: data.created_at,
      },
    };
  } catch (err: any) {
    console.error('[AdminAuth] Unexpected error:', err);
    return { success: false, error: `Koneksi gagal: ${err?.message ?? 'Unknown error'}. Periksa koneksi internet Anda.` };
  }
}

/**
 * Buat akun admin baru
 */
export async function createAdminAccount(
  username: string,
  name: string,
  password: string,
  role: 'SUPER_ADMIN' | 'ADMIN_STAF'
): Promise<{ success: boolean; error?: string }> {
  const cleanUsername = username.trim().toLowerCase();

  // Cek duplikat — gunakan .maybeSingle() agar tidak 406 kalau tidak ada
  const { data: existing, error: checkError } = await (supabase as any)
    .from('admin_accounts')
    .select('id')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (checkError) {
    console.error('[AdminAuth] Check duplicate error:', checkError);
    return { success: false, error: checkError.message };
  }

  if (existing) {
    return { success: false, error: `Username "${cleanUsername}" sudah digunakan.` };
  }

  const passwordHash = await hashPassword(cleanUsername, password);

  const { error } = await (supabase as any)
    .from('admin_accounts')
    .insert({
      username: cleanUsername,
      name: name.trim(),
      password_hash: passwordHash,
      role,
      is_active: true,
    });

  if (error) {
    console.error('[AdminAuth] Create error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Ambil semua akun admin
 */
export async function fetchAdminAccounts(): Promise<AdminAccount[]> {
  const { data, error } = await (supabase as any)
    .from('admin_accounts')
    .select('id, username, name, role, is_active, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[AdminAuth] Fetch error:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}

/**
 * Ganti password admin
 */
export async function changeAdminPassword(
  username: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  const newHash = await hashPassword(cleanUsername, newPassword);

  const { error } = await (supabase as any)
    .from('admin_accounts')
    .update({ password_hash: newHash })
    .eq('username', cleanUsername);

  if (error) {
    console.error('[AdminAuth] Change password error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Nonaktifkan / aktifkan akun admin
 */
export async function setAdminActiveStatus(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('admin_accounts')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    console.error('[AdminAuth] Toggle active error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
