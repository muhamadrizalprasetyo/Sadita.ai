"use client";

import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  X,
  Building2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { authApi, setStoredToken } from "@/lib/api";
import { homeFor, Role } from "@/components/role-shell";

interface DemoAccount {
  label: string;
  shortLabel: string;
  email: string;
  pass: string;
  roleTitle: string;
  desc: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Admin",
    shortLabel: "Admin",
    email: "admin@unipi.ac.id",
    pass: "admin123",
    roleTitle: "Administrator Sistem",
    desc: "Akses penuh tata kelola akademik, perangkat IoT, dan audit log",
  },
  {
    label: "Kaprodi",
    shortLabel: "Kaprodi",
    email: "kaprodi@unipi.ac.id",
    pass: "kaprodi123",
    roleTitle: "Ketua Program Studi TI",
    desc: "Pengawasan kurikulum, beban dosen, dan kepatuhan presensi",
  },
  {
    label: "Dosen",
    shortLabel: "Dosen",
    email: "dosen@unipi.ac.id",
    pass: "dosen123",
    roleTitle: "Dosen Pengampu",
    desc: "Live attendance perkuliahan, materi LMS, dan penilaian mahasiswa",
  },
  {
    label: "Ketua",
    shortLabel: "Ketua",
    email: "budi@mhs.unipi.ac.id",
    pass: "mhs123",
    roleTitle: "Ketua Kelas TI-2024",
    desc: "Monitoring presensi rekan dan verifikasi sesi perkuliahan pengganti",
  },
  {
    label: "Mahasiswa",
    shortLabel: "Mhs",
    email: "rizal@mhs.unipi.ac.id",
    pass: "mhs123",
    roleTitle: "Mahasiswa Aktif",
    desc: "Jadwal kuliah, presensi mandiri IoT, tugas LMS, dan transkrip nilai",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@unipi.ac.id");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        const savedEmail = localStorage.getItem("sadita_remember_user");
        if (savedEmail) {
          setEmail(savedEmail);
          const matched = DEMO_ACCOUNTS.find((d) => d.email === savedEmail);
          if (matched) {
            setSelectedRole(matched.label);
            setPassword(matched.pass);
          }
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Lock background scroll on Desktop cursor and Apple iPhone Safari touch gestures
  useEffect(() => {
    if (!showHelpModal) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const origBodyOverflow = document.body.style.overflow;
    const origBodyPaddingRight = document.body.style.paddingRight;
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".login-modal-box")) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setShowHelpModal(false);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.paddingRight = origBodyPaddingRight;
      document.body.style.touchAction = origTouchAction;
      document.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showHelpModal]);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState("CapsLock"));
  };

  const handleInputKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState("CapsLock"));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    const r = await authApi.login(email, password);
    setLoading(false);

    if (!r.data) {
      setError(r.error ?? "Login gagal. Silakan periksa kembali email dan password Anda.");
      return;
    }

    setStoredToken(r.data.access_token);

    if (rememberMe && typeof window !== "undefined") {
      localStorage.setItem("sadita_remember_user", email);
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("sadita_remember_user");
    }

    router.replace(homeFor(r.data.user.role as Role));
  }

  const fillDemo = (demo: DemoAccount) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setSelectedRole(demo.label);
    setError(undefined);
  };

  return (
    <div className="login-page-wrapper">
      {/* Top Brand Accent Line */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "3px", background: "#1B2D4F", zIndex: 50 }} />

      <div style={{ width: "100%", maxWidth: "420px", margin: "auto 0" }}>
        {/* Main Authentication Card */}
        <div className="login-card">
          {/* Header & Logo */}
          <div className="login-brand-header">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
              <Image
                src="/logo.png"
                alt="SADITA.ai"
                width={150}
                height={40}
                priority
                className="login-brand-logo"
              />
            </div>
            <h1 className="login-card-title">
              Masuk ke Sistem
            </h1>
            <p className="login-card-subtitle">
              Sistem Absensi Digital Terintegrasi Akademik &amp; LMS
            </p>
          </div>

          {/* Quick Demo Selector (Clean & Compact) */}
          <div className="login-demo-box">
            <div className="login-demo-header">
              <span>Pilih Akun Uji Coba:</span>
              <span style={{ color: "#2563eb", fontWeight: 600 }}>{selectedRole}</span>
            </div>
            <div className="login-demo-grid">
              {DEMO_ACCOUNTS.map((d) => {
                const isActive = selectedRole === d.label;
                return (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => fillDemo(d)}
                    className={`login-demo-btn ${isActive ? "active" : ""}`}
                    title={`${d.label} — ${d.roleTitle}`}
                  >
                    <span className="hidden sm:inline">{d.label}</span>
                    <span className="inline sm:hidden">{d.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{ marginBottom: "16px", padding: "10px 12px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "12px", display: "flex", alignItems: "flex-start", gap: "8px" }} role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px", color: "#dc2626" }} />
              <div>
                <strong style={{ display: "block", fontWeight: 600 }}>Gagal Masuk</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} noValidate>
            <div className="login-field-group">
              <label htmlFor="login-email" className="login-field-label" style={{ display: "block", marginBottom: "6px" }}>
                Email Kampus / NIM / NIDN
              </label>
              <div className="login-input-box">
                <input
                  id="login-email"
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input-element"
                  placeholder="admin@unipi.ac.id atau NIM"
                />
                <Mail className="input-icon-left" />
              </div>
            </div>

            <div className="login-field-group">
              <div className="login-field-label-row">
                <label htmlFor="login-password" className="login-field-label">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="login-field-forgot"
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="login-input-box">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onKeyUp={handleInputKeyUp}
                  className="login-input-element"
                  placeholder="Masukkan kata sandi"
                />
                <Lock className="input-icon-left" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-eye-btn"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {capsLockActive && (
                <div style={{ marginTop: "6px", padding: "6px 10px", fontSize: "11px", color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={13} style={{ flexShrink: 0, color: "#d97706" }} />
                  <span><strong>Caps Lock</strong> sedang aktif</span>
                </div>
              )}
            </div>

            <div className="login-checkbox-row">
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="login-checkbox-input"
              />
              <label htmlFor="login-remember" className="login-checkbox-label">
                Ingat akun saya di perangkat ini
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-button-primary"
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderColor: "#ffffff transparent #ffffff transparent" }} />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Portal Akademik</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="login-footer-help">
            <p>
              Butuh bantuan akses?{" "}
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="login-footer-link"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
              >
                Hubungi BAAK UNIPI
              </button>
            </p>
          </div>
        </div>

        {/* Outer Minimal Institutional Footer */}
        <footer className="login-outer-footer">
          <p>© 2026 Universitas Insan Pembangunan Indonesia (UNIPI)</p>
          <p style={{ opacity: 0.8 }}>Sistem Akademik &amp; Presensi Cerdas Terintegrasi</p>
        </footer>
      </div>

      {/* Help Modal (Responsive & Apple iOS Compliant) */}
      {showHelpModal && (
        <div
          className="login-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHelpModal(false);
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-help-title"
        >
          <div className="login-modal-box">
            <div className="login-modal-header">
              <div className="login-modal-header-left">
                <div className="login-modal-icon-badge">
                  <HelpCircle size={18} />
                </div>
                <h3 id="modal-help-title" className="login-modal-title">
                  Bantuan Akses &amp; Reset Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="login-modal-close-btn"
                aria-label="Tutup jendela bantuan"
              >
                <X size={16} />
              </button>
            </div>

            <p className="login-modal-desc">
              Untuk menjaga integritas dan kerahasiaan data akademik institusi, pengaturan ulang kata sandi diverifikasi langsung oleh unit layanan resmi BAAK UNIPI:
            </p>

            {/* Card 1: BAAK UNIPI */}
            <div className="login-modal-card login-modal-card-baak">
              <div className="login-modal-card-title">
                <Building2 size={15} className="text-slate-700 shrink-0" />
                <span>Biro Administrasi Akademik &amp; Kemahasiswaan (BAAK)</span>
              </div>
              <p className="login-modal-card-text">
                Gedung Rektorat Lt. 2, Kampus UNIPI • Layanan: Senin – Jumat, 08:00 – 16:30 WIB
              </p>
              <div className="login-modal-contact-row">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20BAAK%20UNIPI,%20saya%20membutuhkan%20bantuan%20reset%20password%20akun%20SADITA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="login-modal-contact-chip wa"
                  title="Hubungi BAAK via WhatsApp"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp: +62 812-3456-7890</span>
                </a>
                <a
                  href="mailto:baak@unipi.ac.id?subject=Bantuan%20Reset%20Password%20Akun%20SADITA"
                  className="login-modal-contact-chip email"
                  title="Kirim email ke BAAK"
                >
                  <Mail size={14} />
                  <span>Email: baak@unipi.ac.id</span>
                </a>
              </div>
            </div>

            {/* Card 2: Demo Account Notice */}
            <div className="login-modal-card login-modal-card-demo">
              <div className="login-modal-card-title">
                <Sparkles size={15} className="text-emerald-700 shrink-0" />
                <span>Ingin Mencoba Akun Pengujian?</span>
              </div>
              <p className="login-modal-card-text">
                Anda dapat memilih salah satu peran (Admin, Kaprodi, Dosen, Ketua Kelas, atau Mahasiswa) pada tombol pilihan cepat di atas formulir login untuk mengisi otomatis kredensial simulasi tanpa perlu memasukkan password manual.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="login-modal-dismiss-btn"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
