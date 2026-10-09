"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Shield, Lock, Mail, ArrowRight, UserCheck } from "lucide-react";
import { authApi, setStoredToken } from "@/lib/api";
import { homeFor, Role } from "@/components/role-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@unipi.ac.id");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: "Admin", email: "admin@unipi.ac.id", pass: "admin123", role: "ADMIN" },
    { label: "Kaprodi", email: "kaprodi@unipi.ac.id", pass: "kaprodi123", role: "KAPRODI" },
    { label: "Dosen", email: "dosen@unipi.ac.id", pass: "dosen123", role: "DOSEN" },
    { label: "Ketua Kelas", email: "budi@mhs.unipi.ac.id", pass: "mhs123", role: "KETUA_KELAS" },
    { label: "Mahasiswa", email: "rizal@mhs.unipi.ac.id", pass: "mhs123", role: "MAHASISWA" },
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
        {/* Brand Header */}
        <div className="login-brand-header">
          <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: "var(--primary-gradient)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "white", boxShadow: "0 0 25px var(--primary-glow)" }}>
            <Sparkles size={28} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.025em" }}>SADITA.ai</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Sistem Akademik Terintegrasi & Presensi IoT
          </p>
        </div>

        {/* Demo Fast Selector */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            Pilih Akun Simulasi:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {demoAccounts.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => fillDemo(d)}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "var(--radius-full)",
                  background: email === d.email ? "var(--primary)" : "rgba(255, 255, 255, 0.05)",
                  color: email === d.email ? "white" : "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  transition: "all 0.15s ease",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Kampus</label>
            <div style={{ position: "relative" }}>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="nama@unipi.ac.id"
                style={{ paddingLeft: "2.5rem" }}
              />
              <Mail size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
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
                style={{ paddingLeft: "2.5rem" }}
              />
              <Lock size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>

          {error && (
            <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", background: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error)", fontSize: "0.825rem" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.75rem 1rem", marginTop: "0.5rem" }}
          >
            {loading ? "Memverifikasi Akses..." : "Masuk ke Sistem"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>
          Universitas Pramita Indonesia • S1 Teknologi Informasi
        </p>
      </div>
    </main>
  );
}
