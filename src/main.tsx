import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ── Prevent browser swipe-back/forward — hanya blokir swipe HORIZONTAL ──────
// Scroll vertikal tetap berfungsi normal

let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;

document.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (e.touches.length !== 1 || isSwiping) return;

  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;

  // Hanya blokir kalau gerak HORIZONTAL lebih dominan dari vertikal
  // Dan geraknya lebih dari 15px (bukan micro-movement)
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) {
    const target = e.target as HTMLElement;

    // Izinkan scroll horizontal di elemen yang memang perlu horizontal scroll
    const allowHorizontal = target.closest('.overflow-x-auto') ||
                            target.closest('[data-allow-swipe]') ||
                            target.closest('.swiper') ||
                            target.closest('.carousel') ||
                            target.closest('input[type="range"]');

    if (!allowHorizontal) {
      e.preventDefault();  // Blokir swipe navigation browser
      isSwiping = true;
    }
  }
}, { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
