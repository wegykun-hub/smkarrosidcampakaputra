import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Camera, MapPin, Clock, AlertTriangle, CheckCircle2, Trash2, 
  Compass, ShieldCheck, UserCheck, RefreshCw, AlertCircle, 
  HelpCircle, List, CheckSquare, Smile, Award, Info, Loader2,
  Lock, UploadCloud
} from "lucide-react";
import { AttendanceRecord } from "../types";
import {
  insertStudentAttendance, fetchStudentAttendance,
  deleteStudentAttendance, clearAllStudentAttendance,
  insertTeacherAttendance, fetchTeacherAttendance,
  deleteTeacherAttendance, clearAllTeacherAttendance,
  type StudentAttendance, type TeacherAttendance,
} from "../lib/services/attendanceService";
import { fetchStudents, fetchTeachers } from "../lib/services/rosterService";
import { uploadAttendancePhoto } from "../lib/services/storageService";
import ModalNotif, { useNotif } from "./ModalNotif";

// Official Coordinates of SMK Ar Rosyid Campaka Putra (Campaka, Cianjur)
const SCHOOL_COORDINATES = {
  latitude: -6.90372,
  longitude: 107.13515,
  name: "SMK Ar Rosyid Campaka"
};

// Max distance allowed to register attendance (in meters)
const MAX_ALLOWED_DISTANCE_METERS = 100;

interface AbsensiProps {
  initialRole?: string;
  settings?: any;
}

export default function Absensi({ initialRole, settings }: AbsensiProps) {
  const { notif, closeNotif, notifConfirm } = useNotif();
  // Configurable attendance times from settings state
  const limitMasukHour = settings?.absensiMasukHour !== undefined ? parseInt(settings.absensiMasukHour, 10) : 7;
  const limitMasukMin = settings?.absensiMasukMinute !== undefined ? parseInt(settings.absensiMasukMinute, 10) : 30;
  const limitPulangHour = settings?.absensiPulangHour !== undefined ? parseInt(settings.absensiPulangHour, 10) : 15;

  // Apakah role dikunci dari luar (dari navigasi menu)
  const isRoleLocked = initialRole === 'siswa' || initialRole === 'guru';

  // Input fields
  const [role, setRole] = useState<'SISWA' | 'GURU'>(initialRole === 'guru' ? 'GURU' : 'SISWA');
  const [idNumber, setIdNumber] = useState('');
  const [name, setName] = useState('');
  const [presenceType, setPresenceType] = useState<'MASUK' | 'PULANG'>('MASUK');

  // Sync role selection when initialRole prop changes
  useEffect(() => {
    if (initialRole === 'guru') {
      setRole('GURU');
    } else if (initialRole === 'siswa') {
      setRole('SISWA');
    }
  }, [initialRole]);

  // Logs state — terpisah siswa dan guru
  const [studentLogs, setStudentLogs] = useState<StudentAttendance[]>([]);
  const [teacherLogs, setTeacherLogs] = useState<TeacherAttendance[]>([]);
  // Combined untuk backward compat tampilan (akan difilter by role)
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);

  // Simulation controls
  const [useSimulatedGps, setUseSimulatedGps] = useState<boolean>(true);
  const [simulatedDistance, setSimulatedDistance] = useState<number>(25); // default 25 meters (inside campus)
  const [useSimulatedTime, setUseSimulatedTime] = useState<boolean>(false);
  const [simulatedHour, setSimulatedHour] = useState<number>(7); // 07:00
  const [simulatedMinute, setSimulatedMinute] = useState<number>(15); // :15

  // Real GPS State
  const [realCoords, setRealCoords] = useState<{lat: number; lng: number} | null>(null);
  const [realDistance, setRealDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [streamObj, setStreamObj] = useState<MediaStream | null>(null);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Auto-complete roster states
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [schoolTeachers, setSchoolTeachers] = useState<any[]>([]);
  const [autofillDetectedText, setAutofillDetectedText] = useState("");
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Validasi — apakah ID terdaftar di database
  const [idValidated, setIdValidated] = useState<boolean | null>(null); // null=belum dicek, true=valid, false=tidak terdaftar
  const [idValidationMsg, setIdValidationMsg] = useState("");

  // Admin session — cek apakah ada admin yang login untuk izin hapus
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      const session = sessionStorage.getItem("ar_rosyid_admin_session");
      setIsAdminLoggedIn(!!session);
    };
    checkAdmin();
    window.addEventListener("storage", checkAdmin);
    return () => window.removeEventListener("storage", checkAdmin);
  }, []);

  // Time & Info notification
  const [timeInfo, setTimeInfo] = useState({ hour: 0, minute: 0, text: "" });
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Load existing logs and roster references from Supabase on mount
  const loadAllData = useCallback(async () => {
    setIsLoadingLogs(true);

    // Muat logs absensi dari tabel TERPISAH
    const [sLogs, tLogs, students, teachers] = await Promise.all([
      fetchStudentAttendance(500),
      fetchTeacherAttendance(500),
      fetchStudents('AKTIF'),
      fetchTeachers(),
    ]);

    setStudentLogs(sLogs);
    setTeacherLogs(tLogs);

    // Gabungkan ke format AttendanceRecord untuk tampilan tabel
    const combined: AttendanceRecord[] = [
      ...sLogs.map(s => ({
        id: s.id, role: 'SISWA' as const, idNumber: s.nisn, name: s.nama,
        type: s.type, timestamp: s.timestamp, photo: s.photo,
        latitude: s.latitude, longitude: s.longitude,
        distanceInMeters: s.distanceInMeters, status: s.status, kelas: s.kelas,
      })),
      ...tLogs.map(t => ({
        id: t.id, role: 'GURU' as const, idNumber: t.kodeGuru, name: t.nama,
        type: t.type, timestamp: t.timestamp, photo: t.photo,
        latitude: t.latitude, longitude: t.longitude,
        distanceInMeters: t.distanceInMeters, status: t.status, kelas: undefined,
      })),
    ].sort((a, b) => b.id.localeCompare(a.id));

    setLogs(combined);
    setEnrolledStudents(students);
    setSchoolTeachers(teachers);
    setIsLoadingLogs(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const saveLogs = async (_updatedLogs: AttendanceRecord[]) => {
    // no-op — simpan langsung via insert, reload via loadAllData
  };


  // Autocomplete + validasi: cek apakah ID terdaftar di database
  useEffect(() => {
    const idClean = idNumber.trim().toUpperCase();

    // Reset validasi saat input berubah
    setIdValidated(null);
    setIdValidationMsg("");

    if (idClean.length < 4) {
      setAutofillDetectedText("");
      return;
    }

    if (role === 'SISWA') {
      const found = enrolledStudents.find(s => s.nisn.toUpperCase() === idClean);
      if (found) {
        setName(found.nama.toUpperCase());
        setAutofillDetectedText(`Siswa Terdaftar: Kelas ${found.kelas} – ${found.jurusan}`);
        setIdValidated(true);
        setIdValidationMsg("");
      } else if (enrolledStudents.length > 0) {
        // Data sudah dimuat tapi tidak ditemukan
        setIdValidated(false);
        setIdValidationMsg(`NISN "${idClean}" tidak terdaftar sebagai siswa aktif di database sekolah.`);
        setAutofillDetectedText("");
      }
    } else {
      const found = schoolTeachers.find(
        t => t.kodeGuru?.toUpperCase() === idClean || t.id?.toString().toUpperCase() === idClean
      );
      if (found) {
        setName(found.nama.toUpperCase());
        setAutofillDetectedText(`Guru Terdaftar: ${found.jabatan}`);
        setIdValidated(true);
        setIdValidationMsg("");
      } else if (schoolTeachers.length > 0) {
        setIdValidated(false);
        setIdValidationMsg(`Kode Guru "${idClean}" tidak terdaftar di database sekolah.`);
        setAutofillDetectedText("");
      }
    }
  }, [idNumber, role, enrolledStudents, schoolTeachers]);

  // Clock ticks
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Adjust to WIB (GMT+7)
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const wib = new Date(utc + 3600000 * 7);
      
      if (!useSimulatedTime) {
        setTimeInfo({
          hour: wib.getHours(),
          minute: wib.getMinutes(),
          text: wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB"
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [useSimulatedTime]);

  // Handle Simulated Time updates
  useEffect(() => {
    if (useSimulatedTime) {
      const formatNum = (num: number) => num.toString().padStart(2, '0');
      setTimeInfo({
        hour: simulatedHour,
        minute: simulatedMinute,
        text: `${formatNum(simulatedHour)}:${formatNum(simulatedMinute)}:00 WIB (SIMULASI)`
      });
    }
  }, [useSimulatedTime, simulatedHour, simulatedMinute]);

  // Request actual Geolocation coordinates
  const triggerRealGpsFetch = () => {
    if (!navigator.geolocation) {
      setGpsError("Browser Anda tidak mendukung layanan Lokasi Geolocation.");
      return;
    }

    setIsFetchingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setRealCoords({ lat, lng });
        
        // Calculate Haversine distance
        const dist = calculateHaversineDistance(
          lat, lng, 
          SCHOOL_COORDINATES.latitude, SCHOOL_COORDINATES.longitude
        );
        setRealDistance(dist);
        setIsFetchingGps(false);
      },
      (error) => {
        console.warn("GPS Access Error", error);
        let errorMsg = "Gagal menjangkau sensor GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Izin lokasi ditolak oleh browser/pengguna. Silakan gunakan mode SIMULASI di bawah.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Informasi lokasi tidak tersedia saat ini.";
        }
        setGpsError(errorMsg);
        setIsFetchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Helper formula: Haversine distance in meters
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // returns distance in meters rounded
  };

  // Turn ON webcam stream — robust untuk localhost HTTP dan HTTPS
  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhotoUrl(null);
    
    // Cek browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Browser Anda tidak mendukung akses kamera. Gunakan Chrome/Firefox terbaru, " +
        "atau pastikan halaman diakses via HTTPS."
      );
      return;
    }

    try {
      // Coba kamera depan dulu (facingMode: user)
      const constraints: MediaStreamConstraints = {
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user"
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setStreamObj(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Tunggu metadata video siap sebelum play
        await new Promise<void>((resolve) => {
          const v = videoRef.current!;
          if (v.readyState >= 1) {
            resolve();
          } else {
            v.onloadedmetadata = () => resolve();
          }
        });
        await videoRef.current.play().catch(() => {
          // Autoplay mungkin perlu interaksi user — tetap lanjutkan, video akan play saat user berinteraksi
        });
      }
      setCameraActive(true);
      setCameraError(null);
    } catch (err: any) {
      console.warn("Webcam access error:", err.name, err.message);
      
      let msg = "Kamera tidak dapat diakses.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Izin kamera ditolak. Klik ikon kunci 🔒 di address bar browser → izinkan kamera → coba lagi.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera yang terpasang.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain lalu coba lagi.";
      } else if (err.name === "OverconstrainedError") {
        // Coba tanpa constraint facingMode
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStreamObj(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraActive(true);
          return;
        } catch { /* fallthrough */ }
        msg = "Kamera tidak mendukung resolusi yang diminta.";
      } else {
        msg = `Kamera tidak dapat dibuka (${err.name}). Coba refresh halaman dan izinkan akses kamera.`;
      }
      
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  // Stop Webcam stream
  const stopCamera = () => {
    if (streamObj) {
      streamObj.getTracks().forEach(track => track.stop());
      setStreamObj(null);
    }
    setCameraActive(false);
  };

  // Capture snapshot on video — resolusi lebih baik
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Gunakan resolusi asli video jika tersedia
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror effect (selfie look)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Compress ke JPEG 85% quality
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedPhotoUrl(dataUrl);
        stopCamera();
        showToast("success", "✅ Foto wajah berhasil diambil!");
      }
    } catch (e) {
      console.error(e);
      setCameraError("Gagal mengambil gambar. Coba klik 'Aktifkan Kamera' lagi.");
    }
  };

  // Kompres foto ke thumbnail kecil untuk simpan ke DB (max ~8KB)
  // Menggunakan createImageBitmap yang lebih andal dari Image element
  const compressThumbnail = async (dataUrl: string, w: number, h: number, quality: number): Promise<string> => {
    if (!dataUrl || !dataUrl.startsWith('data:')) return '';
    
    try {
      // Konversi dataURL ke Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      // Buat ImageBitmap (lebih andal, tidak perlu onload event)
      const bitmap = await createImageBitmap(blob);
      
      // Kompres ke canvas kecil
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      const ratio = Math.max(w / bitmap.width, h / bitmap.height);
      const sw = bitmap.width * ratio, sh = bitmap.height * ratio;
      ctx.drawImage(bitmap, (w - sw) / 2, (h - sh) / 2, sw, sh);
      bitmap.close();
      
      return canvas.toDataURL('image/jpeg', quality);
    } catch {
      // Fallback: kembalikan string pendek agar tidak crash DB
      return dataUrl.length > 5000 ? '' : dataUrl;
    }
  };

  // Show status popup toast
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Process and save attendance submission
  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAttendance(true);

    if (!name.trim()) {
      showToast("error", "Simpan gagal: Nama lengkap harus diisi!");
      setIsSavingAttendance(false); return;
    }
    if (!idNumber.trim()) {
      showToast("error", `Simpan gagal: ${role === 'SISWA' ? 'NISN' : 'Kode Guru'} wajib diisi!`);
      setIsSavingAttendance(false); return;
    }

    // ── VALIDASI WAJIB: ID harus terdaftar di database ──────
    if (idValidated === false) {
      showToast("error", idValidationMsg || `${role === 'SISWA' ? 'NISN' : 'Kode Guru'} tidak terdaftar di database sekolah. Hubungi admin.`);
      setIsSavingAttendance(false); return;
    }
    if (idValidated === null && (enrolledStudents.length > 0 || schoolTeachers.length > 0)) {
      showToast("error", `Verifikasi ${role === 'SISWA' ? 'NISN' : 'Kode Guru'} belum selesai. Tunggu sebentar atau coba refresh.`);
      setIsSavingAttendance(false); return;
    }

    // Capture photo condition
    if (!capturedPhotoUrl) {
      showToast("error", "Simpan gagal: Anda harus mengambil verifikasi foto wajah terlebih dahulu.");
      setIsSavingAttendance(false); return;
    }

    // Determine target location & distance
    let finalLat = SCHOOL_COORDINATES.latitude;
    let finalLng = SCHOOL_COORDINATES.longitude;
    let finalDistance = 0;

    if (useSimulatedGps) {
      finalDistance = simulatedDistance;
      // Synthesize shifted coordinates slightly away based on simulated distance
      finalLat += (simulatedDistance / 111111) * 0.707;
      finalLng += (simulatedDistance / (111111 * Math.cos(finalLat * Math.PI / 180))) * 0.707;
    } else {
      if (realDistance === null || realCoords === null) {
        showToast("error", "Gagal mendapatkan lokasi real GPS Anda. Silakan tekan tombol Ambil Lokasi GPS atau gunakan Mode Simulasi.");
        setIsSavingAttendance(false); return;
      }
      finalDistance = realDistance;
      finalLat = realCoords.lat;
      finalLng = realCoords.lng;
    }

    // Distance enforcement
    if (finalDistance > MAX_ALLOWED_DISTANCE_METERS) {
      showToast("error", `Presensi Ditolak! Jarak Anda (${finalDistance}m) melebihi batas maksimal smk (${MAX_ALLOWED_DISTANCE_METERS}m).`);
      setIsSavingAttendance(false); return;
    }

    // Determine late status based on simulated or real time hours
    // School Hours:
    // MASUK: TEPAT WAKTU/TERLAMBAT based on settings thresholds
    // PULANG: Based on settings thresholds
    let statusDetermined: 'TEPAT WAKTU' | 'TERLAMBAT' | 'PULANG' = 'TEPAT WAKTU';
    const hourToCheck = timeInfo.hour;
    const minToCheck = timeInfo.minute;

    if (presenceType === 'MASUK') {
      if (hourToCheck > limitMasukHour || (hourToCheck === limitMasukHour && minToCheck > limitMasukMin)) {
        statusDetermined = 'TERLAMBAT';
      } else {
        statusDetermined = 'TEPAT WAKTU';
      }
    } else {
      statusDetermined = 'PULANG';
      if (hourToCheck < limitPulangHour) {
        showToast("error", `Presensi Pulang Ditolak! Belum memasuki jam kepulangan resmi (Pukul ${limitPulangHour.toString().padStart(2, '0')}:00 WIB).`);
        setIsSavingAttendance(false); return;
      }
    }

    // Tentukan kelas (untuk absensi siswa)

    const uniqueId = `ATT-${role.substring(0, 3)}-${Date.now().toString().slice(-6)}`;

    const ts = new Date().toLocaleDateString('id-ID') + " " +
      (useSimulatedTime
        ? `${simulatedHour.toString().padStart(2,'0')}:${simulatedMinute.toString().padStart(2,'0')}`
        : new Date().toLocaleTimeString('id-ID'));

    // ── Kompres foto thumbnail untuk disimpan segera ─────────
    // Simpan absensi langsung pakai thumbnail, upload ke Storage di background
    const thumbnailUrl = await compressThumbnail(capturedPhotoUrl, 200, 150, 0.6);
    console.log('[Absensi] thumbnail size:', thumbnailUrl.length, 'chars (', Math.round(thumbnailUrl.length * 0.75 / 1024), 'KB)');

    if (role === 'SISWA') {
      // ── Simpan ke student_attendance ─────────────────────
      const found = enrolledStudents.find(s => s.nisn.trim() === idNumber.trim());
      const rec: StudentAttendance = {
        id: uniqueId,
        nisn: idNumber.trim().toUpperCase(),
        nama: name.trim().toUpperCase(),
        kelas: found?.kelas,
        jurusan: found?.jurusan,
        type: presenceType,
        timestamp: ts,
        photo: thumbnailUrl,
        latitude: Number(finalLat.toFixed(6)),
        longitude: Number(finalLng.toFixed(6)),
        distanceInMeters: finalDistance,
        status: statusDetermined,
      };
      const result = await insertStudentAttendance(rec);
      if (!result.success) {
        showToast("error", `Gagal menyimpan absensi siswa: ${result.error}`);
        setIsSavingAttendance(false); return;
      }
      setStudentLogs(prev => [rec, ...prev]);
      setLogs(prev => [{
        id: rec.id, role: 'SISWA', idNumber: rec.nisn, name: rec.nama,
        type: rec.type, timestamp: rec.timestamp, photo: rec.photo,
        latitude: rec.latitude, longitude: rec.longitude,
        distanceInMeters: rec.distanceInMeters, status: rec.status, kelas: rec.kelas,
      }, ...prev]);

      // Upload foto asli ke Storage di background (tidak blocking)
      uploadAttendancePhoto(capturedPhotoUrl, uniqueId).then(async storageUrl => {
        if (storageUrl.startsWith('http')) {
          // Update foto dengan Storage URL di database
          await (await import('../lib/services/attendanceService')).updateStudentAttendancePhoto?.(uniqueId, storageUrl);
        }
      }).catch(() => {/* silent fail */});

    } else {
      // ── Simpan ke teacher_attendance ─────────────────────
      const found = schoolTeachers.find(t => t.kodeGuru?.toUpperCase() === idNumber.trim().toUpperCase());
      const rec: TeacherAttendance = {
        id: uniqueId,
        kodeGuru: idNumber.trim().toUpperCase(),
        nama: name.trim().toUpperCase(),
        jabatan: found?.jabatan,
        type: presenceType,
        timestamp: ts,
        photo: thumbnailUrl,
        latitude: Number(finalLat.toFixed(6)),
        longitude: Number(finalLng.toFixed(6)),
        distanceInMeters: finalDistance,
        status: statusDetermined,
      };
      const result = await insertTeacherAttendance(rec);
      if (!result.success) {
        showToast("error", `Gagal menyimpan absensi guru: ${result.error}`);
        setIsSavingAttendance(false); return;
      }
      setTeacherLogs(prev => [rec, ...prev]);
      setLogs(prev => [{
        id: rec.id, role: 'GURU', idNumber: rec.kodeGuru, name: rec.nama,
        type: rec.type, timestamp: rec.timestamp, photo: rec.photo,
        latitude: rec.latitude, longitude: rec.longitude,
        distanceInMeters: rec.distanceInMeters, status: rec.status, kelas: undefined,
      }, ...prev]);

      // Upload foto asli ke Storage di background (tidak blocking)
      uploadAttendancePhoto(capturedPhotoUrl, uniqueId).then(async storageUrl => {
        if (storageUrl.startsWith('http')) {
          await (await import('../lib/services/attendanceService')).updateTeacherAttendancePhoto?.(uniqueId, storageUrl);
        }
      }).catch(() => {/* silent fail */});
    }

    showToast("success", `Presensi ${presenceType} atas nama ${name.toUpperCase()} berhasil disimpan!`);
    setName('');
    setIdNumber('');
    setCapturedPhotoUrl(null);
    setIdValidated(null);
    setIdValidationMsg("");
    setAutofillDetectedText("");
    setIsSavingAttendance(false);
  };

  const deleteLog = async (id: string, personName: string) => {
    if (!isAdminLoggedIn) {
      showToast("error", "❌ Akses Ditolak: Hanya Admin yang dapat menghapus catatan absensi.");
      return;
    }
    notifConfirm(
      'Hapus Log Absensi?',
      `Log absensi milik ${personName} akan dihapus permanen.`,
      async () => {
        setLogs(prev => prev.filter(l => l.id !== id));
        setStudentLogs(prev => prev.filter(l => l.id !== id));
        setTeacherLogs(prev => prev.filter(l => l.id !== id));
        const [r1, r2] = await Promise.all([
          deleteStudentAttendance(id),
          deleteTeacherAttendance(id),
        ]);
        if (!r1.success && !r2.success) {
          showToast("error", "Gagal menghapus dari database.");
          await loadAllData();
        } else {
          showToast("success", `Log absensi ${personName} berhasil dihapus.`);
        }
      },
      'Ya, Hapus',
      'Batal'
    );
  };

  const clearAllLogs = async () => {
    if (!isAdminLoggedIn) {
      showToast("error", "❌ Akses Ditolak: Hanya Admin yang dapat menghapus seluruh catatan absensi.");
      return;
    }
    const roleLabel = role === 'SISWA' ? 'siswa' : role === 'GURU' ? 'guru' : 'siswa DAN guru';
    notifConfirm(
      'Hapus Semua Absensi?',
      `Semua catatan absensi ${roleLabel} akan dihapus permanen dan tidak dapat dikembalikan!`,
      async () => {
        setLogs([]);
        setStudentLogs([]);
        setTeacherLogs([]);
        if (role === 'SISWA' || role !== 'GURU') {
          await clearAllStudentAttendance();
        }
        if (role === 'GURU' || role !== 'SISWA') {
          await clearAllTeacherAttendance();
        }
        showToast("success", `Semua catatan absensi ${roleLabel} berhasil dihapus.`);
      },
      'Ya, Hapus Semua',
      'Batal'
    );
  };

  // Mini summary calculations
  const totalSiswaMsk = logs.filter(l => l.role === 'SISWA' && l.status === 'TEPAT WAKTU').length;
  const totalSiswaTmb = logs.filter(l => l.role === 'SISWA' && l.status === 'TERLAMBAT').length;
  const totalGuruPresence = logs.filter(l => l.role === 'GURU').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans" id="absensi-container">
      
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 md:p-8 border-2 border-amber-400 shadow-xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 font-extrabold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-amber-500/30">
            <Compass size={12} className="animate-spin text-amber-400" />
            Satelit Presensi Geospasial
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-white uppercase sm:text-4xl">
            {isRoleLocked
              ? (role === 'SISWA'
                  ? <>Presensi Siswa <span className="text-amber-400">Digital</span></>
                  : <>Presensi Guru <span className="text-amber-400">& Staff</span></>)
              : <>Sistem Absensi Digital <span className="text-amber-400">Real-Time</span></>
            }
          </h1>
          <p className="text-xs text-slate-300 font-semibold leading-relaxed max-w-2xl">
            Validasi presensi harian Siswa dan Guru SMK Ar Rosyid berbasis visual biometrik kamera, sinkronisasi jam kerja, dan batas jarak radius GPS koordinat area smk.
          </p>
        </div>

        <div className="w-full md:w-auto bg-slate-950/70 p-4 rounded-2xl border border-slate-750 text-center shrink-0">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jam Digital Aktif WIB</span>
          <div className="text-xl md:text-2xl font-black text-amber-500 tracking-wide font-mono mt-1 flex items-center justify-center gap-2">
            <Clock size={18} className="text-amber-500 animate-pulse" />
            {timeInfo.text}
          </div>
          <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">Smk Ar Rosyid Campaka Putra, Cianjur</p>
        </div>
      </div>

      {/* Grid: Form Left, Simulation Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Simulation Console & Quick Rules */}
        <div className="lg:col-span-4 space-y-6">

          {/* Rules info */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <ShieldCheck size={14} className="text-emerald-500" />
              Verifikasi & Aturan Resmi
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600 font-medium">
              <div className="p-3 bg-estate bg-green-50/50 rounded-xl border border-green-100">
                <span className="block text-green-700 font-extrabold mb-0.5">📍 Batas Radius Maksimal</span>
                Wajib berada maksimal <strong className="text-green-800">100 meter</strong> dari koordinat pusat SMK Ar Rosyid Campaka Putra.
              </div>

              <div className="p-3 bg-amber-5/50 border border-amber-100 rounded-xl">
                <span className="block text-amber-700 font-extrabold mb-0.5">⏰ Jam Kehadiran Sekolah</span>
                <ul className="space-y-1 list-disc list-inside mt-1 text-slate-500 leading-relaxed font-semibold">
                  <li><strong className="text-slate-700">Absen Masuk:</strong> 06:00 s.d {limitMasukHour.toString().padStart(2, '0')}:{limitMasukMin.toString().padStart(2, '0')} WIB (Tepat Waktu). Lewat dari itu dihitung <span className="text-rose-600 font-black">TERLAMBAT</span>.</li>
                  <li><strong className="text-slate-700">Absen Pulang:</strong> Diizinkan setelah pukul <strong className="text-slate-700">{limitPulangHour.toString().padStart(2, '0')}:00 WIB</strong>.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SIMULATOR PANEL (Very critical for continuous reliable testing inside frame container) */}
          <div className="bg-slate-900 text-slate-300 rounded-3xl p-5 border border-slate-780 shadow-md">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-xs text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
                <RefreshCw size={13} className="text-amber-400 animate-spin" />
                Panel Simulator Pengujian
              </h3>
              <span className="bg-amber-400 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded uppercase">DEVELOPER</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed mt-2.5 font-medium">
              Gunakan panel ini untuk menguji skenario jarak koordinat GPS dan perubahan jam kerja tanpa perlu berpindah lokasi fisik dari tempat Anda saat ini.
            </p>

            {/* GPS Radius Simulator */}
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center gap-1">
                  <MapPin size={12} className="text-amber-500" />
                  Skenario Jarak Smk 
                </span>
                <span className="font-mono text-amber-400 font-bold">{simulatedDistance} meter</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUseSimulatedGps(true);
                    setSimulatedDistance(15);
                  }}
                  className={`text-[10px] p-2 rounded-xl font-bold border transition ${
                    useSimulatedGps && simulatedDistance === 15 
                      ? 'bg-amber-400 text-slate-950 border-amber-400' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  Di Dalam Kelas (15m)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseSimulatedGps(true);
                    setSimulatedDistance(85);
                  }}
                  className={`text-[10px] p-2 rounded-xl font-bold border transition ${
                    useSimulatedGps && simulatedDistance === 85 
                      ? 'bg-amber-400 text-slate-950 border-amber-400' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  Gerbang Parkir (85m)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseSimulatedGps(true);
                    setSimulatedDistance(350);
                  }}
                  className={`text-[10px] p-2 rounded-xl font-bold border transition ${
                    useSimulatedGps && simulatedDistance === 350
                      ? 'bg-rose-500 text-white border-rose-500' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  Rumah/Luar Radius (350m)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseSimulatedGps(false);
                    triggerRealGpsFetch();
                  }}
                  className={`text-[10px] p-2 rounded-xl font-bold border transition flex items-center justify-center gap-1 ${
                    !useSimulatedGps 
                      ? 'bg-blue-500 text-white border-blue-500 animate-pulse' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <Compass size={11} /> GPS Asli Sensor
                </button>
              </div>

              {!useSimulatedGps && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
                  {isFetchingGps && <p className="text-yellow-400 animate-pulse font-semibold">🔄 Sedang berkomunikasi dengan satelit...</p>}
                  {gpsError && <p className="text-rose-400 font-semibold">❌ {gpsError}</p>}
                  {realDistance !== null && (
                    <p className="text-green-400 font-mono font-bold">
                      Jarak GPS Asli: {realDistance} meter dari SMK Ar Rosyid.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Time Shift Simulator */}
            <div className="space-y-3 mt-5 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center gap-1">
                  <Clock size={12} className="text-amber-500" />
                  Skenario Waktu Presensi
                </span>
                <span className="font-mono text-amber-400 font-black">
                  {useSimulatedTime ? "SIMULASI SHIFT" : "REAL WIB TIME"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setUseSimulatedTime(true);
                    setSimulatedHour(7);
                    setSimulatedMinute(15);
                  }}
                  className={`p-2 rounded-xl font-bold border transition ${
                    useSimulatedTime && simulatedHour === 7 && simulatedMinute === 15 
                      ? 'bg-green-500 text-slate-950 border-green-500' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  Pagi (07:15) Tepat Waktu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseSimulatedTime(true);
                    setSimulatedHour(7);
                    setSimulatedMinute(45);
                  }}
                  className={`p-2 rounded-xl font-bold border transition ${
                    useSimulatedTime && simulatedHour === 7 && simulatedMinute === 45 
                      ? 'bg-amber-550 text-white border-amber-500' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  Pagi (07:45) Terlambat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseSimulatedTime(true);
                    setSimulatedHour(15);
                    setSimulatedMinute(10);
                  }}
                  className={`p-2 rounded-xl font-bold border transition ${
                    useSimulatedTime && simulatedHour === 15 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  Sore (15:10) Jam Pulang
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseSimulatedTime(false);
                  }}
                  className={`p-2 rounded-xl font-bold border transition ${
                    !useSimulatedTime 
                      ? 'bg-amber-400 text-slate-950 border-amber-400' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  Reset ke Waktu Riil
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Middle/Center: Presence Submission Form */}
        <div className="lg:col-span-8 space-y-8">

          {/* Toast Notification Box */}
          {toastMessage && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow transition animate-fade-in ${
              toastMessage.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {toastMessage.type === 'success' ? <CheckCircle2 className="text-green-600 shrink-0" size={20} /> : <AlertCircle className="text-rose-600 shrink-0" size={20} />}
              <div className="text-xs font-bold">{toastMessage.text}</div>
            </div>
          )}

          {/* Main Attendance Form */}
          <form onSubmit={handleSubmitAttendance} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            
            {/* Form Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="text-amber-500" />
                  FORMULIR PRESENSI DIGITAL
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Lengkapi data pribadi dan selesaikan verifikasi biometrik</p>
              </div>

              {/* Action type switch: MASUK or PULANG */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPresenceType('MASUK')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    presenceType === 'MASUK' 
                      ? 'bg-amber-400 text-slate-950 shadow' 
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Absen Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setPresenceType('PULANG')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    presenceType === 'PULANG' 
                      ? 'bg-slate-900 text-white shadow' 
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Absen Pulang
                </button>
              </div>
            </div>

            {/* Inputs: Role, Name, ID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Role Select — hanya tampil kalau tidak dikunci dari navigasi */}
              {!isRoleLocked && (
                <div className="md:col-span-4 space-y-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Status Jabatan / Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setRole('SISWA'); setIdNumber(''); }}
                      className={`p-2.5 rounded-xl text-xs font-extrabold border transition text-center ${
                        role === 'SISWA' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
                      }`}
                    >Siswa (siswa)</button>
                    <button
                      type="button"
                      onClick={() => { setRole('GURU'); setIdNumber(''); }}
                      className={`p-2.5 rounded-xl text-xs font-extrabold border transition text-center ${
                        role === 'GURU' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
                      }`}
                    >Guru & Staff</button>
                  </div>
                </div>
              )}

              {/* Badge role kalau dikunci */}
              {isRoleLocked && (
                <div className="md:col-span-4 space-y-2">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Status Jabatan / Role</label>
                  <div className={`p-2.5 rounded-xl text-xs font-extrabold border text-center ${
                    role === 'SISWA' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {role === 'SISWA' ? '🎓 Presensi Siswa / siswa' : '👨‍🏫 Presensi Guru & Staff'}
                  </div>
                </div>
              )}

              {/* ID Number */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  {role === 'SISWA' ? 'Nomor Induk Siswa (NISN)' : 'Kode Guru (sesuai database sekolah)'}
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => {
                    setIdNumber(e.target.value);
                    setIdValidated(null);
                  }}
                  placeholder={role === 'SISWA' ? "Contoh: 0098765432" : "Contoh: TKJ-01 atau AR-01"}
                  className={`w-full text-xs font-semibold p-2.5 border rounded-xl focus:outline-none uppercase font-mono transition ${
                    idValidated === true ? 'border-emerald-400 bg-emerald-50' :
                    idValidated === false ? 'border-rose-400 bg-rose-50' :
                    'border-gray-200 focus:border-orange-500'
                  }`}
                />
                {/* Status validasi */}
                {autofillDetectedText && idValidated === true && (
                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
                    <CheckCircle2 size={10} className="shrink-0" /> {autofillDetectedText}
                  </span>
                )}
                {idValidated === false && (
                  <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1 mt-1">
                    <AlertCircle size={10} className="shrink-0" /> {idValidationMsg}
                  </span>
                )}
                {idValidated === null && idNumber.trim().length >= 4 && (enrolledStudents.length === 0 && schoolTeachers.length === 0) && (
                  <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                    <Loader2 size={10} className="animate-spin shrink-0" /> Memuat data dari database...
                  </span>
                )}
              </div>

              {/* Name */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: ADITYA PUTRA PRATAMA"
                  className="w-full text-xs font-semibold p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 uppercase"
                />
              </div>
            </div>

            {/* Camera Interface Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Photo Area / Camera Viewfinder */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  Verifikasi Wajah Biometrik (Live)
                </label>
                
                <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 group">
                  
                  {cameraActive ? (
                    /* Real Live Video — autoPlay + playsInline wajib untuk mobile dan desktop */
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-cover scale-x-[-1]"
                      playsInline
                      autoPlay
                      muted
                    />
                  ) : capturedPhotoUrl ? (
                    /* Captured Photo preview */
                    <img 
                      src={capturedPhotoUrl} 
                      alt="Biometric Capture" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    /* Standby screen with instructions */
                    <div className="text-center p-6 space-y-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-500/80">
                        <Camera size={22} className="animate-pulse" />
                      </div>
                      <p className="text-xs font-bold text-slate-300">Kamera Belum Aktif</p>
                      <p className="text-[10px] text-slate-500 max-w-xs font-medium">Klik Aktifkan Kamera untuk berfoto. Pastikan browser mengizinkan akses kamera.</p>
                    </div>
                  )}

                  {/* Top-Right visual feedback overlay */}
                  {capturedPhotoUrl && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-black text-[9px] tracking-widest px-2.5 py-1 rounded-lg uppercase shadow flex items-center gap-1">
                      <CheckCircle2 size={10} /> TERVERIFIKASI
                    </div>
                  )}

                  {cameraActive && (
                    <div className="absolute inset-0 border-[3px] border-orange-500/40 pointer-events-none rounded-2xl animate-pulse">
                      <div className="w-[80%] h-[1px] bg-orange-400 absolute top-1/2 left-[10%] animate-scan"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action and Control column for photo */}
              <div className="space-y-4 flex flex-col justify-center">
                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <h4 className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase flex items-center gap-1 leading-none">
                    <Info size={11} className="text-orange-500" /> OPSI PENGAMBILAN CITRA WAJAH
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    Pastikan wajah Anda berada di tengah bidang sensor kamera, terpapar cahaya dengan cukup terang, dan tidak mengenakan kacamata hitam sebelum melakukan capture.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full py-3 bg-slate-900 text-white font-extrabold text-xs tracking-wider rounded-xl hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
                    >
                      <Camera size={16} className="text-orange-400" />
                      AKTIFKAN KAMERA LAPTOP / HP
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={captureSnapshot}
                      className="w-full py-3 bg-gradient-to-r from-yellow-200 to-stone-100 text-slate-950 font-black text-xs tracking-wider rounded-xl border border-yellow-300 hover:from-yellow-300 hover:to-stone-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm animate-pulse"
                    >
                      <Camera size={16} />
                      📸 AMBIL FOTO SEKARANG
                    </button>
                  )}

                  {/* Tombol upload foto dari file — alternatif kamera */}
                  {!cameraActive && !capturedPhotoUrl && (
                    <label className="w-full py-2.5 bg-blue-50 text-blue-700 font-extrabold text-xs tracking-wider rounded-xl border border-blue-200 hover:bg-blue-100 transition cursor-pointer flex items-center justify-center gap-1.5">
                      <UploadCloud size={14} />
                      UPLOAD FOTO DARI FILE
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCapturedPhotoUrl(reader.result as string);
                            showToast("success", "✅ Foto berhasil dimuat dari file!");
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}

                  {cameraActive && (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-full py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-[10px] rounded-lg transition"
                    >
                      Matikan Kamera
                    </button>
                  )}

                  {capturedPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => { setCapturedPhotoUrl(null); setCameraError(null); }}
                      className="w-full py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-[10px] rounded-lg transition"
                    >
                      🔄 Ulangi Foto
                    </button>
                  )}

                  {cameraError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <p className="text-[10px] text-amber-800 font-bold">⚠️ {cameraError}</p>
                      <p className="text-[9px] text-amber-600 font-medium leading-relaxed">
                        Solusi: Klik ikon 🔒 di address bar browser → <b>Izinkan Kamera</b> → refresh halaman.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GPS Radius Check Indicator */}
            <div className={`p-4 rounded-2xl border ${
              useSimulatedGps 
                ? (simulatedDistance <= MAX_ALLOWED_DISTANCE_METERS ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')
                : (realDistance !== null && realDistance <= MAX_ALLOWED_DISTANCE_METERS ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')
            } space-y-2`}>
              
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin size={14} className="text-orange-500" />
                  JARAK GEOSPASIAL SEKARANG:
                </span>
                
                <span className={`font-mono font-black border px-2 py-0.5 rounded text-xs leading-none ${
                  useSimulatedGps 
                    ? (simulatedDistance <= MAX_ALLOWED_DISTANCE_METERS ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200')
                    : (realDistance !== null && realDistance <= MAX_ALLOWED_DISTANCE_METERS ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200')
                }`}>
                  {useSimulatedGps ? `${simulatedDistance} METER` : realDistance !== null ? `${realDistance} METER` : 'BELUM DILACAK'}
                </span>
              </div>

              {/* Guidance status message */}
              <p className="text-[11px] text-slate-500 font-medium">
                {useSimulatedGps ? (
                  simulatedDistance <= MAX_ALLOWED_DISTANCE_METERS 
                    ? "✓ Status GPS valid! Anda terdeteksi berada di dalam area SMK Ar Rosyid, Cianjur (Aman untuk presensi)." 
                    : "⚠️ Status GPS Tidak Valid! Jarak Anda berada di luar radius batas maksimal 100 meter. Tombol kirim presensi akan tertutup otomatis."
                ) : (
                  realDistance !== null 
                    ? (realDistance <= MAX_ALLOWED_DISTANCE_METERS ? "✓ GPS Sinkron! Anda berada di dalam koordinat Ar Rosyid." : "⚠️ GPS Tidak Valid! Jarak asli Anda terlalu jauh dari lokasi Ar Rosyid Campaka Putra.") 
                    : "⚠️ GPS belum terinisiasi. Silakan gunakan koordinat simulasi di kiri atau ijinkan GPS handphone/laptop Anda."
                )}
              </p>
            </div>

            {/* Submission triggers */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={
                  isSavingAttendance ||
                  idValidated === false ||
                  (useSimulatedGps ? simulatedDistance > MAX_ALLOWED_DISTANCE_METERS : (realDistance === null || realDistance > MAX_ALLOWED_DISTANCE_METERS))
                }
                className={`w-full py-3.5 text-center font-black text-xs tracking-widest rounded-2xl shadow transition-all flex items-center justify-center gap-2 uppercase cursor-pointer ${
                  !isSavingAttendance && idValidated !== false && (useSimulatedGps ? simulatedDistance <= MAX_ALLOWED_DISTANCE_METERS : (realDistance !== null && realDistance <= MAX_ALLOWED_DISTANCE_METERS))
                    ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800 hover:shadow-lg'
                    : 'bg-slate-100 text-slate-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                {isSavingAttendance ? (
                  <><Loader2 size={16} className="animate-spin" /> MENYIMPAN ABSENSI...</>
                ) : idValidated === false ? (
                  `❌ ${role === 'SISWA' ? 'NISN' : 'KODE GURU'} TIDAK TERDAFTAR`
                ) : (
                  <><CheckSquare size={16} className="text-orange-400" /> SIMPAN ABSENSI SEKARANG ({presenceType})</>
                )}
              </button>
              {idValidated === false && (
                <p className="text-[10px] text-rose-600 font-bold text-center mt-1">
                  {role === 'SISWA' ? 'Siswa' : 'Guru'} harus terdaftar di database sekolah untuk bisa absensi.
                  Hubungi admin untuk mendaftarkan data Anda.
                </p>
              )}
            </div>

          </form>

        </div>

      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block">Presensi Siswa Tepat Waktu</span>
            <span className="text-3xl font-black text-slate-950 mt-1 block">{totalSiswaMsk}</span>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block">Presensi Siswa Terlambat</span>
            <span className="text-3xl font-black text-slate-950 mt-1 block">{totalSiswaTmb}</span>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block">Kehadiran Guru & Staff</span>
            <span className="text-3xl font-black text-slate-950 mt-1 block">{totalGuruPresence}</span>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center border border-orange-100">
            <UserCheck size={24} />
          </div>
        </div>

      </div>

      {/* Logs Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mt-8 p-6 md:p-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase flex items-center gap-2">
              <List className="text-orange-500" />
              HISTORY LOGS KEHADIRAN (HARI INI)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Daftar log absensi siswa & guru terpusat hasil capture validasi kamera</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                // Populate high quality mock records if table is empty
                if (logs.length === 0) {
                  const demoPresence: AttendanceRecord[] = [
                    {
                      id: "ATT-SIS-990812",
                      role: "SISWA",
                      idNumber: "0098765432",
                      name: "ADITYA PUTRA PRATAMA",
                      type: "MASUK",
                      timestamp: "11/06/2026 07:12:04 WIB",
                      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
                      latitude: -6.90372,
                      longitude: 107.13515,
                      distanceInMeters: 4,
                      status: "TEPAT WAKTU"
                    },
                    {
                      id: "ATT-GUR-450129",
                      role: "GURU",
                      idNumber: "198804122015091001",
                      name: "H. AHMAD RIYADI, S.Pd.I.",
                      type: "MASUK",
                      timestamp: "11/06/2026 06:45:12 WIB",
                      photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
                      latitude: -6.90375,
                      longitude: 107.13512,
                      distanceInMeters: 12,
                      status: "TEPAT WAKTU"
                    },
                    {
                      id: "ATT-SIS-992110",
                      role: "SISWA",
                      idNumber: "0091122334",
                      name: "SITI NUR HALIZAH",
                      type: "MASUK",
                      timestamp: "11/06/2026 07:44:35 WIB",
                      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                      latitude: -6.90365,
                      longitude: 107.13520,
                      distanceInMeters: 28,
                      status: "TERLAMBAT"
                    }
                  ];
                  saveLogs(demoPresence);
                  showToast("success", "Demo data absensi hari ini berhasil dimuat!");
                }
              }}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-[10px] tracking-wider uppercase px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={11} className="text-amber-400" />
              Isi Demo Log
            </button>

            {logs.length > 0 && (
              <button
                onClick={clearAllLogs}
                className={`font-extrabold text-[10px] tracking-wider uppercase px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                  isAdminLoggedIn
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title={isAdminLoggedIn ? "Hapus semua log" : "Hanya Admin yang bisa menghapus"}
              >
                {isAdminLoggedIn ? <Trash2 size={11} /> : <Lock size={11} />}
                {isAdminLoggedIn ? 'Kosongkan Table' : 'Admin Only'}
              </button>
            )}
          </div>

          {/* Badge info status admin */}
          {!isAdminLoggedIn && logs.length > 0 && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <Lock size={11} className="text-amber-600 shrink-0" />
              <span className="text-[10px] text-amber-700 font-bold">
                Untuk menghapus catatan absensi, login ke Admin Panel terlebih dahulu.
              </span>
            </div>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center p-12 text-slate-400 font-bold text-xs bg-slate-50 border-2 border-dashed border-gray-100 rounded-3xl space-y-2">
            <UserCheck className="mx-auto text-slate-300" size={36} />
            <p className="text-slate-500 font-extrabold">Belum ada aktivitas absensi hari ini.</p>
            <p className="text-[11px] text-slate-400 font-semibold">Silakan isi formulir presensi digital di atas atau klik tombol "Isi Demo Log" untuk pengujian instan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto ring-1 ring-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-gray-150">
                  <th className="p-4">Calon/Pegawai</th>
                  <th className="p-4">Kontak / ID Induk</th>
                  <th className="p-4">Jenis Presensi</th>
                  <th className="p-4">Jam Absensi</th>
                  <th className="p-4">Jarak & Koor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Cam Verif</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-slate-700 font-semibold uppercase">
                {logs.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Person info */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${
                          record.role === 'GURU' 
                            ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {record.role}
                        </span>
                        <span>{record.name}</span>
                      </div>
                    </td>

                    {/* NISN / NIP */}
                    <td className="p-4">
                      <span className="font-mono text-slate-500 text-[11px]">{record.idNumber}</span>
                    </td>

                    {/* Type indicator */}
                    <td className="p-4">
                      <span className={`font-extrabold text-[10px] tracking-wider ${record.type === 'MASUK' ? 'text-green-600' : 'text-slate-800'}`}>
                        {record.type}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="p-4 font-mono text-[11px] text-slate-500">
                      {record.timestamp}
                    </td>

                    {/* GPS Coordinates & computed radius */}
                    <td className="p-4">
                      <div className="leading-snug">
                        <span className="text-[11px] block font-extrabold text-slate-800">🖈 Radius: {record.distanceInMeters} meter</span>
                        <span className="text-[9px] text-slate-400 font-mono font-medium block">lat:{record.latitude} | lng:{record.longitude}</span>
                      </div>
                    </td>

                    {/* Badget status */}
                    <td className="p-4">
                      <span className={`text-[8px] font-black tracking-widest px-2 py-1 rounded inline-block shadow-sm ${
                        record.status === 'TEPAT WAKTU' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : record.status === 'TERLAMBAT'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-slate-150 text-slate-700 border border-slate-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>

                    {/* captured image thumbnail */}
                    <td className="p-4 text-center">
                      <div className="inline-block relative">
                        <img 
                          src={record.photo} 
                          alt="Thumbnail Bio" 
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 shadow-sm"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // If Unsplash image or other fails, default back to simulated visual
                            e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect width='40' height='40' fill='%23ea580c'/><circle cx='20' cy='15' r='8' fill='%23fff'/><path d='M8 32 C 8 22, 32 22, 32 32' fill='%23fff'/></svg>";
                          }}
                        />
                      </div>
                    </td>

                    {/* Actions tools */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => deleteLog(record.id, record.name)}
                        className={`p-1.5 rounded-lg transition ${
                          isAdminLoggedIn
                            ? 'text-rose-500 hover:text-white hover:bg-rose-600'
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                        title={isAdminLoggedIn ? "Hapus log ini" : "Hanya Admin yang bisa menghapus"}
                      >
                        {isAdminLoggedIn ? <Trash2 size={13} /> : <Lock size={13} />}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <ModalNotif notif={notif} onClose={closeNotif} />
    </div>
  );
}
