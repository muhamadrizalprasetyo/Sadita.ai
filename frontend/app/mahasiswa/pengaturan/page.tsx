"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  ShieldCheck, 
  GraduationCap, 
  CreditCard, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { authApi, studentApi, type StudentProfile, type User as CurrentUser } from "@/lib/api";
import { LoadingSpinner, StatusBadge } from "@/components/ui";

export default function PengaturanAkunPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [uRes, pRes] = await Promise.all([
        authApi.getMe(),
        studentApi.getMyProfile(),
      ]);
      if (uRes.data) setCurrentUser(uRes.data);
      if (pRes.data) setProfile(pRes.data);
      setLoading(false);
    }
    void loadData();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Masukkan kata sandi saat ini");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("Kata sandi baru tidak boleh sama dengan kata sandi lama");
      return;
    }

    setSavingPassword(true);
    const res = await authApi.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });

    setSavingPassword(false);

    if (res.error) {
      setPasswordError(res.error);
    } else {
      setPasswordSuccess(res.data?.message || "Kata sandi Anda berhasil diperbarui!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Memuat informasi profil dan akun..." />;
  }

  const cohortNum = profile?.academic_cohort ?? 1;
  const classTypeLabel = profile?.class_type === "REGULER_MALAM"
    ? "Reguler Malam"
    : profile?.class_type === "REGULER_SHIFT"
    ? "Reguler Shift"
    : "Reguler Pagi";

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Profil & Keamanan Akun
          </h1>
          <p className="page-subtitle" style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Informasi identitas akademik mahasiswa, rombongan belajar (cohort), dan kelola kata sandi akun SADITA.ai.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.75rem" }}>
        {/* Kolom 1: Profil Akademik */}
        <div className="card" style={{ padding: "1.75rem", height: "fit-content" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--green), #059669)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.25rem",
                boxShadow: "0 4px 12px rgba(18, 183, 106, 0.25)",
              }}
            >
              {(currentUser?.full_name || "M").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {currentUser?.full_name}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                <span className="badge badge-info" style={{ fontWeight: 600 }}>
                  {currentUser?.role}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                  NPM: {profile?.nim || "—"}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.25rem 0" }} />

          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <GraduationCap size={18} color="var(--primary)" /> Data Akademik
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>Program Studi</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{profile?.department || "Teknik Informatika"}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>Angkatan Masuk</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{profile?.batch_year || "2024"}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>Tingkat Semester (Cohort)</span>
              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                TEKFO {cohortNum} (Semester {cohortNum})
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>Kelompok / Jenis Kelas</span>
              <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                {classTypeLabel}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>Status KTM / RFID</span>
              {profile?.rfid_uid ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <StatusBadge status="success" label="Terhubung" />
                  <code style={{ fontSize: "0.8rem", color: "var(--text-primary)", background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                    {profile.rfid_uid}
                  </code>
                </div>
              ) : (
                <StatusBadge status="warning" label="Belum Ada RFID" />
              )}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.25rem 0" }} />

          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Mail size={18} color="var(--primary)" /> Informasi Kontak
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>Email Akun</span>
              <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{currentUser?.email}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>No. Telepon / WhatsApp</span>
              <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{profile?.phone || "Belum diisi"}</span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Keamanan Akun & Ubah Kata Sandi */}
        <div className="card" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
            <Lock size={20} color="var(--green)" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Ubah Kata Sandi
            </h2>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Anda dapat menggunakan <strong>Email</strong> atau <strong>NPM</strong> Anda saat masuk ke sistem SADITA.ai. Pastikan kata sandi Anda kuat dan tidak mudah ditebak.
          </p>

          {passwordSuccess && (
            <div className="alert alert-success" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle size={18} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="alert alert-error" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={18} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.4rem", display: "block" }}>
                Kata Sandi Saat Ini <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  className="form-input"
                  style={{ width: "100%", paddingRight: "2.75rem" }}
                  placeholder="Masukkan kata sandi lama Anda"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.4rem", display: "block" }}>
                Kata Sandi Baru <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNew ? "text" : "password"}
                  className="form-input"
                  style={{ width: "100%", paddingRight: "2.75rem" }}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <small style={{ color: "var(--text-muted)", fontSize: "0.775rem", marginTop: "0.25rem", display: "block" }}>
                Gunakan kombinasi huruf dan angka agar akun Anda tetap aman.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.4rem", display: "block" }}>
                Konfirmasi Kata Sandi Baru <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type={showNew ? "text" : "password"}
                className="form-input"
                style={{ width: "100%" }}
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingPassword}
              style={{ width: "100%", padding: "0.75rem", fontWeight: 600 }}
            >
              {savingPassword ? "Memperbarui Kata Sandi..." : "Simpan Perubahan Kata Sandi"}
            </button>
          </form>

          <div
            style={{
              marginTop: "1.75rem",
              padding: "1rem",
              borderRadius: "8px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              <strong>Tips Keamanan SADITA.ai:</strong> Jangan pernah membagikan kata sandi Anda kepada orang lain. Tim administrator kampus tidak akan pernah meminta kata sandi Anda.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
