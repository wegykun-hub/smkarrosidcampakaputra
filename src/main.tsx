import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import React from 'react';

// ── Prevent horizontal swipe navigation browser (back/forward) ──
// Hanya blokir gerak horizontal dominan, biarkan vertikal bebas
let startX = 0;
let startY = 0;

document.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (e.touches.length !== 1) return;
  const dx = Math.abs(e.touches[0].clientX - startX);
  const dy = Math.abs(e.touches[0].clientY - startY);

  if (dx > dy && dx > 10) {
    const target = e.target as HTMLElement;
    const allowH = target.closest('.overflow-x-auto, [data-allow-swipe]');
    if (!allowH) e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById('root')!).render(
  React.createElement(App)
);
