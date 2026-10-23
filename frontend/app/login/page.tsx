"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { authApi, setStoredToken } from "@/lib/api";
import { homeFor, Role } from "@/components/role-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@unipi.ac.id");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: "Admin", email: "admin@unipi.ac.id", pass: "admin123" },
    { label: "Kaprodi", email: "kaprodi@unipi.ac.id", pass: "kaprodi123" },
    { label: "Dosen", email: "dosen@unipi.ac.id", pass: "dosen123" },
    { label: "Ketua Kelas", email: "budi@mhs.unipi.ac.id", pass: "mhs123" },
    { label: "Mahasiswa", email: "rizal@mhs.unipi.ac.id", pass: "mhs123" },
  ];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    const r = await authApi.login(email, password);
    setLoading(false);

    if (!r.data) {
      setError(r.error ?? "Login gagal. Silakan periksa kembali email dan password.");
      return;
    }

    setStoredToken(r.data.access_token);
    router.replace(homeFor(r.data.user.role as Role));
  }

  const fillDemo = (demo: typeof demoAccounts[0]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setError(undefined);
  };

  return (
    <main className="login-page-wrap">
      <div className="login-glass-card">
        {/* Brand Header with Logo */}
        <div className="login-brand-header">
          <img
            src="/logo.png"
            alt="SADITA.ai"
            className="login-brand-logo"
          />
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "0" }}>
            Sistem Akademik Terintegrasi &amp; Presensi IoT
          </p>
        </div>

        {/* Demo Fast Selector */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "8px" }}>
            Akun Simulasi:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {demoAccounts.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => fillDemo(d)}
                style={{
                  fontSize: "12px",
                  padding: "5px 12px",
                  borderRadius: "var(--radius-full)",
                  background: email === d.email ? "var(--navy)" : "var(--bg)",
                  color: email === d.email ? "white" : "var(--muted)",
                  border: `1px solid ${email === d.email ? "var(--navy)" : "var(--line)"}`,
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: "grid", gap: "16px" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email / NIM Kampus</label>
            <div style={{ position: "relative" }}>
              <input
                required
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="nama@unipi.ac.id atau NIM"
                style={{ paddingLeft: "40px" }}
              />
              <Mail size={16} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                style={{ paddingLeft: "40px" }}
              />
              <Lock size={16} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            </div>
          </div>

          {error && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-search)",
              background: "var(--error-bg)",
              border: "1px solid var(--error-border)",
              color: "var(--error)",
              fontSize: "13px"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "4px", fontSize: "14px" }}
          >
            {loading ? "Memverifikasi Akses..." : "Masuk ke Sistem"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--muted)", marginTop: "24px" }}>
          Universitas Pramita Indonesia • S1 Teknologi Informasi
        </p>
      </div>
    </main>
  );
}
