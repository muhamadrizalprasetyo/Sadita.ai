"use client";

import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Radio,
  BookOpen,
  Building2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  UserCheck,
  CheckCircle2,
  X
} from "lucide-react";
import { authApi, setStoredToken } from "@/lib/api";
import { homeFor, Role } from "@/components/role-shell";

import Image from "next/image";

interface DemoAccount {
  label: string;
  email: string;
  pass: string;
  roleTitle: string;
  desc: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Admin",
    email: "admin@unipi.ac.id",
    pass: "admin123",
    roleTitle: "Administrator Sistem",
    desc: "Akses penuh tata kelola akademik, perangkat IoT, dan audit log",
  },
  {
    label: "Kaprodi",
    email: "kaprodi@unipi.ac.id",
    pass: "kaprodi123",
    roleTitle: "Ketua Program Studi TI",
    desc: "Pengawasan kurikulum, beban dosen, dan kepatuhan presensi",
  },
  {
    label: "Dosen",
    email: "dosen@unipi.ac.id",
    pass: "dosen123",
    roleTitle: "Dosen Pengampu",
    desc: "Live attendance perkuliahan, materi LMS, dan penilaian mahasiswa",
  },
  {
    label: "Ketua Kelas",
    email: "budi@mhs.unipi.ac.id",
    pass: "mhs123",
    roleTitle: "Ketua Kelas TI-2024",
    desc: "Monitoring presensi rekan dan verifikasi sesi perkuliahan pengganti",
  },
  {
    label: "Mahasiswa",
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

  // Restore remember me preference asynchronously to prevent cascading renders
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState("CapsLock"));
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
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

  const currentRoleInfo = DEMO_ACCOUNTS.find((d) => d.label === selectedRole);

  return (
    <main className="login-split-layout">
      {/* ====================================================================
          LEFT SHOWCASE PANE (Institutional Authority & System Value)
          ==================================================================== */}
      <section className="login-showcase-pane" aria-label="Informasi Institusi SADITA.ai">
        <div className="login-showcase-grid-bg" />

        {/* Top Institutional Badge */}
        <div className="login-showcase-top">
          <div className="login-institution-badge">
            <Building2 size={16} color="#38bdf8" />
            <span>UNIVERSITAS INSAN PEMBANGUNAN INDONESIA</span>
          </div>
          <span className="login-faculty-tag">Fakultas Ilmu Komputer • S1 TI</span>
        </div>

        {/* Hero & Feature Highlights */}
        <div className="login-showcase-hero">
          <div className="login-showcase-tag">
            <Sparkles size={13} />
            <span>Ekosistem Akademik &amp; Presensi Cerdas</span>
          </div>
          <h1 className="login-showcase-title">
            Transformasi Digital Akademik Terintegrasi Masa Depan
          </h1>
          <p className="login-showcase-desc">
            Satu portal operasional menyatukan administrasi perkuliahan, presensi biometrik &amp; RFID berbasis IoT, sistem manajemen pembelajaran (LMS), serta evaluasi nilai berbobot secara terpadu.
          </p>

          <div className="login-feature-list">
            <div className="login-feature-card">
              <div className="login-feature-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                <Radio size={20} />
              </div>
              <div>
                <h4 className="login-feature-title">Presensi IoT mTLS &amp; Anti-Replay</h4>
                <p className="login-feature-text">Autentikasi mikrokontroler ESP32-S3 dengan enkripsi ganda RFID RC522 &amp; sidik jari secara real-time.</p>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon-wrap" style={{ background: "rgba(37, 99, 235, 0.15)", color: "#60a5fa", border: "1px solid rgba(37, 99, 235, 0.3)" }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h4 className="login-feature-title">LMS &amp; Kurikulum Terpadu</h4>
                <p className="login-feature-text">Penyampaian materi kuliah terstruktur, tugas mahasiswa berbatas waktu, dan bank soal kuis interaktif.</p>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon-wrap" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="login-feature-title">Keamanan Zero-Trust &amp; Audit Trail</h4>
                <p className="login-feature-text">Rotasi token JWT 15 menit, pembagian hak akses RBAC ketat, dan pencatatan riwayat transaksi data imutabel.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status & Trust Line */}
        <div className="login-showcase-footer">
          <div className="login-status-indicator">
            <span className="status-dot-pulse" />
            <span>Sistem Operasional Normal</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: "#94a3b8" }}>Mosquitto Broker Aktif</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: "#94a3b8" }}>TLS 1.3 Terenkripsi</span>
          </div>
          <div>© 2026 UNIPI • All Rights Reserved</div>
        </div>
      </section>

      {/* ====================================================================
          RIGHT FORM PANE (Clean, Modern, Focused Authentication)
          ==================================================================== */}
      <section className="login-form-pane" aria-label="Formulir Masuk Sistem">
        <div className="login-form-container">
          {/* Header Brand */}
          <div className="login-form-header">
            <Image
              src="/logo.png"
              alt="SADITA.ai — Sistem Akademik Terintegrasi"
              width={190}
              height={52}
              priority
              className="login-form-logo"
              style={{ width: "180px", height: "auto" }}
            />
            <h2 className="login-form-title">Masuk ke Sistem</h2>
            <p className="login-form-subtitle">
              Silakan masukkan kredensial akun institusi Anda untuk mengakses portal akademik.
            </p>
          </div>

          {/* Role Simulation Switcher */}
          <div className="login-role-selector-wrap">
            <div className="login-role-selector-header">
              <span className="login-role-selector-label">Akun Uji Coba (Pilih Role):</span>
              {currentRoleInfo && (
                <span className="login-role-badge-active">
                  {currentRoleInfo.roleTitle}
                </span>
              )}
            </div>
            <div className="login-role-pills">
              {DEMO_ACCOUNTS.map((d) => {
                const isActive = selectedRole === d.label;
                return (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => fillDemo(d)}
                    className={`login-role-btn ${isActive ? "active" : ""}`}
                    title={d.roleTitle}
                  >
                    <UserCheck size={13} opacity={isActive ? 1 : 0.6} />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
            {currentRoleInfo && (
              <p className="login-role-hint">
                <CheckCircle2 size={13} color="#10b981" />
                <span>{currentRoleInfo.desc}</span>
              </p>
            )}
          </div>

          {/* Authentication Form */}
          <form onSubmit={submit} noValidate>
            {/* Email / NIM Field */}
            <div className="login-input-group">
              <label htmlFor="login-email" className="login-input-label">
                Email Kampus / NIM / NIDN
              </label>
              <div className="login-input-wrapper">
                <input
                  id="login-email"
                  required
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input-field"
                  placeholder="admin@unipi.ac.id atau NIM"
                />
                <Mail size={17} className="login-input-icon" />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-input-group">
              <div className="login-input-label-row">
                <label htmlFor="login-password" className="login-input-label">
                  Kata Sandi (Password)
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="login-forgot-link"
                >
                  Lupa password?
                </button>
              </div>
              <div className="login-input-wrapper">
                <input
                  id="login-password"
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  className="login-input-field"
                  placeholder="Masukkan kata sandi"
                />
                <Lock size={17} className="login-input-icon" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-toggle-pw-btn"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {capsLockActive && (
                <div className="login-caps-alert">
                  <AlertCircle size={14} />
                  <span>Peringatan: <strong>Caps Lock</strong> sedang aktif</span>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <label className="login-remember-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="login-remember-checkbox"
              />
              <span className="login-remember-label">
                Ingat akun saya di perangkat ini
              </span>
            </label>

            {/* Error Message */}
            {error && (
              <div className="login-error-alert" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <strong style={{ display: "block", marginBottom: "2px" }}>Gagal Mengautentikasi</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderColor: "#ffffff transparent #ffffff transparent" }} />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Portal Akademik</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Form Footer & Institutional Trust Badges */}
          <footer className="login-form-footer">
            <p className="login-support-note">
              Mengalami kendala akun? Hubungi{" "}
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="login-support-link"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
              >
                Helpdesk BAAK UNIPI
              </button>
            </p>
            <div className="login-trust-badges">
              <span className="login-trust-badge">
                <ShieldCheck size={14} color="#10b981" />
                <span>Enkripsi TLS 1.3</span>
              </span>
              <span>•</span>
              <span className="login-trust-badge">
                <UserCheck size={14} color="#2563eb" />
                <span>Zero-Trust RBAC</span>
              </span>
              <span>•</span>
              <span>Versi 2.4 Enterprise</span>
            </div>
          </footer>
        </div>
      </section>

      {/* ====================================================================
          HELP / SUPPORT MODAL (Zero-Blur Enterprise Dialog)
          ==================================================================== */}
      {showHelpModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHelpModal(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-box" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <HelpCircle size={20} color="#2563eb" />
                <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700 }}>
                  Bantuan Akses &amp; Reset Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "16px", fontSize: "13.5px", color: "var(--text)" }}>
              <p style={{ lineHeight: 1.5, color: "#475569" }}>
                Untuk menjaga standar keamanan akademik, pengaturan ulang kata sandi dilakukan melalui verifikasi resmi institusi:
              </p>

              <div style={{ padding: "14px 16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "block", color: "var(--navy)", marginBottom: "4px" }}>
                  1. Biro Administrasi Akademik &amp; Kemahasiswaan (BAAK)
                </strong>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                  Gedung Rektorat Lt. 2, Kampus UNIPI • Jam Layanan: 08:00 – 16:30 WIB
                </p>
                <p style={{ fontSize: "12.5px", color: "#2563eb", marginTop: "4px", margin: 0, fontWeight: 500 }}>
                  Email: baak@unipi.ac.id • WhatsApp Helpdesk: +62 812-3456-7890
                </p>
              </div>

              <div style={{ padding: "14px 16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "block", color: "var(--navy)", marginBottom: "4px" }}>
                  2. Akun Uji Coba (Demo Mode)
                </strong>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                  Anda dapat menggunakan tombol <strong>Akun Uji Coba</strong> di atas formulir login untuk masuk otomatis sebagai Admin, Kaprodi, Dosen, Ketua Kelas, atau Mahasiswa.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="btn btn-primary"
                style={{ width: "100%", padding: "10px", marginTop: "8px" }}
              >
                Mengerti &amp; Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
