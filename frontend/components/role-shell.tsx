"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Users, 
  GraduationCap, 
  Clock, 
  FileText, 
  CheckSquare, 
  Radio, 
  Award, 
  HelpCircle, 
  LogOut, 
  Building2,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { authApi, clearStoredToken, getStoredToken, type User } from "@/lib/api";
import { KobarAssistant } from "./kobar-assistant";

export type Role = "ADMIN" | "KAPRODI" | "DOSEN" | "KETUA_KELAS" | "MAHASISWA";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navigation: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/akademik", label: "Master Akademik", icon: Building2 },
    { href: "/admin/presensi", label: "Sesi Presensi", icon: Clock },
    { href: "/admin/lms", label: "Materi & Tugas", icon: BookOpen },
    { href: "/admin/perangkat", label: "Perangkat IoT", icon: Radio },
  ],
  KAPRODI: [
    { href: "/kaprodi/dashboard", label: "Dashboard Prodi", icon: LayoutDashboard },
    { href: "/kaprodi/dosen", label: "Monitoring Dosen", icon: Users },
    { href: "/kaprodi/mahasiswa", label: "Monitoring Mahasiswa", icon: GraduationCap },
    { href: "/kaprodi/kurikulum", label: "Kurikulum & Kelas", icon: BookOpen },
    { href: "/kaprodi/presensi", label: "Analisis Presensi", icon: Clock },
  ],
  DOSEN: [
    { href: "/dosen/dashboard", label: "Dashboard Pengajar", icon: LayoutDashboard },
    { href: "/dosen/kelas", label: "Kelas Saya", icon: BookOpen },
    { href: "/dosen/presensi", label: "Sesi Presensi", icon: Clock },
    { href: "/dosen/materi", label: "Materi Kuliah", icon: FileText },
    { href: "/dosen/tugas", label: "Tugas & Submission", icon: CheckSquare },
    { href: "/dosen/kuis", label: "Kuis Online", icon: HelpCircle },
    { href: "/dosen/nilai", label: "Rekap Nilai", icon: Award },
  ],
  KETUA_KELAS: [
    { href: "/ketua-kelas/dashboard", label: "Dashboard Kelas", icon: LayoutDashboard },
    { href: "/ketua-kelas/presensi", label: "Verifikasi Presensi", icon: Clock },
    { href: "/ketua-kelas/rekan", label: "Daftar Mahasiswa", icon: Users },
    { href: "/ketua-kelas/materi", label: "Materi Kuliah", icon: FileText },
    { href: "/ketua-kelas/jadwal", label: "Jadwal & Ruang", icon: Calendar },
  ],
  MAHASISWA: [
    { href: "/mahasiswa/dashboard", label: "Dashboard Belajar", icon: LayoutDashboard },
    { href: "/mahasiswa/mata-kuliah", label: "Mata Kuliah & Materi", icon: BookOpen },
    { href: "/mahasiswa/tugas", label: "Tugas Saya", icon: CheckSquare },
    { href: "/mahasiswa/kuis", label: "Kuis Online", icon: HelpCircle },
    { href: "/mahasiswa/presensi", label: "Riwayat Presensi", icon: Clock },
    { href: "/mahasiswa/nilai", label: "KHS & Nilai", icon: Award },
  ],
};

export function homeFor(role: Role): string {
  switch (role) {
    case "ADMIN": return "/admin/dashboard";
    case "KAPRODI": return "/kaprodi/dashboard";
    case "DOSEN": return "/dosen/dashboard";
    case "KETUA_KELAS": return "/ketua-kelas/dashboard";
    case "MAHASISWA": return "/mahasiswa/dashboard";
  }
}

export function RoleShell({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }
    void authApi.getMe().then((result) => {
      if (!result.data) {
        clearStoredToken();
        router.replace("/login");
      } else if (result.data.role !== role) {
        router.replace(homeFor(result.data.role));
      } else {
        setUser(result.data);
      }
    });
  }, [role, router]);

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border-subtle)", borderTopColor: "var(--primary-light)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>Memverifikasi otentikasi SADITA…</p>
        </div>
      </main>
    );
  }

  const items = navigation[role] || [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="brand-title">SADITA.ai</div>
            <div className="brand-badge">Teknologi Informasi</div>
          </div>
        </div>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="user-meta">
            <div className="user-name" title={user.full_name}>{user.full_name}</div>
            <span className="user-role-badge badge badge-info" style={{ marginTop: "0.25rem", display: "inline-flex" }}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu Utama</div>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="btn btn-secondary w-full"
            style={{ width: "100%", justifyContent: "flex-start", gap: "0.75rem" }}
            onClick={() => {
              clearStoredToken();
              router.replace("/login");
            }}
          >
            <LogOut size={16} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {children}
      </main>

      {/* Embedded SI KOBAR AI Assistant */}
      <KobarAssistant user={user} />
    </div>
  );
}
