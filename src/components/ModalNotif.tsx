import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, XCircle, X } from "lucide-react";

export type NotifType = 'success' | 'error' | 'warning' | 'info';

export interface NotifState {
  show: boolean;
  type: NotifType;
  title: string;
  message: string;
  onConfirm?: () => void;     // kalau ada → tampilkan tombol konfirmasi
  confirmText?: string;
  cancelText?: string;
}

interface ModalNotifProps {
  notif: NotifState;
  onClose: () => void;
}

const CONFIG = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700',
    title: 'text-emerald-900',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50',
    border: 'border-rose-200',
    btnColor: 'bg-rose-600 hover:bg-rose-700',
    title: 'text-rose-900',
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    border: 'border-amber-200',
    btnColor: 'bg-amber-600 hover:bg-amber-700',
    title: 'text-amber-900',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    border: 'border-blue-200',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
    title: 'text-blue-900',
  },
};

export default function ModalNotif({ notif, onClose }: ModalNotifProps) {
  const cfg = CONFIG[notif.type];
  const Icon = cfg.icon;

  // Auto-close sukses setelah 3 detik kalau tidak ada tombol konfirmasi
  useEffect(() => {
    if (notif.show && notif.type === 'success' && !notif.onConfirm) {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [notif.show, notif.type, notif.onConfirm, onClose]);

  // Tutup saat klik backdrop
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !notif.onConfirm) onClose();
  };

  if (!notif.show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdrop}
    >
      <div
        className={`relative bg-white rounded-3xl shadow-2xl border-2 ${cfg.border} w-full max-w-sm mx-auto p-6 space-y-4 animate-fade-in`}
        style={{ animation: 'modal-pop 0.25s ease-out' }}
      >
        {/* Tombol X tutup */}
        {!notif.onConfirm && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        )}

        {/* Ikon */}
        <div className={`w-16 h-16 rounded-2xl ${cfg.iconBg} flex items-center justify-center mx-auto shadow-inner`}>
          <Icon size={32} className={cfg.iconColor} />
        </div>

        {/* Konten */}
        <div className="text-center space-y-2">
          <h3 className={`font-black text-lg ${cfg.title} leading-tight`}>
            {notif.title}
          </h3>
          {notif.message && (
            <p className="text-sm text-slate-500 font-medium leading-relaxed whitespace-pre-line">
              {notif.message}
            </p>
          )}
        </div>

        {/* Tombol aksi */}
        <div className={`flex gap-2 pt-1 ${notif.onConfirm ? 'flex-row' : 'flex-col'}`}>
          {notif.onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                {notif.cancelText || 'Batal'}
              </button>
              <button
                onClick={() => { notif.onConfirm!(); onClose(); }}
                className={`flex-1 py-2.5 ${cfg.btnColor} text-white font-black text-sm rounded-xl transition cursor-pointer shadow-sm`}
              >
                {notif.confirmText || 'Ya, Lanjutkan'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`w-full py-2.5 ${cfg.btnColor} text-white font-black text-sm rounded-xl transition cursor-pointer shadow-sm`}
            >
              OK
            </button>
          )}
        </div>

        {/* Progress bar auto-close untuk success */}
        {notif.type === 'success' && !notif.onConfirm && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-3xl overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ animation: 'shrink 3s linear forwards' }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ── Hook untuk pakai modal notif dengan mudah ──────────────
export function useNotif() {
  const [notif, setNotif] = React.useState<NotifState>({
    show: false, type: 'success', title: '', message: '',
  });

  const showNotif = (
    type: NotifType,
    title: string,
    message = '',
    options?: { onConfirm?: () => void; confirmText?: string; cancelText?: string }
  ) => {
    setNotif({ show: true, type, title, message, ...options });
  };

  const closeNotif = () => setNotif(prev => ({ ...prev, show: false }));

  const notifSuccess = (title: string, message = '') => showNotif('success', title, message);
  const notifError   = (title: string, message = '') => showNotif('error', title, message);
  const notifWarning = (title: string, message = '') => showNotif('warning', title, message);
  const notifConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal'
  ) => showNotif('warning', title, message, { onConfirm, confirmText, cancelText });

  return { notif, showNotif, closeNotif, notifSuccess, notifError, notifWarning, notifConfirm };
}
