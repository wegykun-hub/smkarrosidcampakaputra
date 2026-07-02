import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ── Prevent swipe-back/forward navigation on mobile ─────────────────────────
// Deteksi swipe horizontal dan batalkan kalau bukan scroll dalam elemen
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const dx = Math.abs(e.touches[0].clientX - touchStartX);
  const dy = Math.abs(e.touches[0].clientY - touchStartY);

  // Kalau gerakan horizontal lebih dominan dari vertikal, cegah swipe navigation
  if (dx > dy && dx > 10) {
    // Cek apakah target adalah elemen yang perlu horizontal scroll (carousel, table, dll)
    const target = e.target as HTMLElement;
    const scrollable = target.closest('[data-allow-swipe]') ||
                       target.closest('.overflow-x-auto') ||
                       target.closest('.no-scrollbar') ||
                       target.closest('table') ||
                       target.closest('.swiper');

    if (!scrollable) {
      // Bukan elemen scroll horizontal — blokir swipe navigation browser
      e.preventDefault();
    }
  }
}, { passive: false });

// Blokir swipe dari tepi kiri/kanan layar (zona 20px) yang biasanya trigger back/forward
document.addEventListener('touchstart', (e) => {
  const x = e.touches[0].clientX;
  const screenWidth = window.innerWidth;
  // Zona tepi kiri (back) dan tepi kanan (forward)
  if (x < 20 || x > screenWidth - 20) {
    // Ini mungkin swipe navigation gesture — tandai
    (document as any).__edgeSwipe = true;
  } else {
    (document as any).__edgeSwipe = false;
  }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if ((document as any).__edgeSwipe) {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
