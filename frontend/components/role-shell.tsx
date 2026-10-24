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
  Search,
  Settings,
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
    { href: "/admin/users", label: "Manajemen User", icon: Users },
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
    { href: "/dosen/kelas", label: "Kelas & Persetujuan", icon: BookOpen },
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
    { href: "/mahasiswa/krs", label: "Rencana Studi (KRS)", icon: Calendar },
    { href: "/mahasiswa/mata-kuliah", label: "Mata Kuliah & Materi", icon: BookOpen },
    { href: "/mahasiswa/tugas", label: "Tugas Saya", icon: CheckSquare },
    { href: "/mahasiswa/kuis", label: "Kuis Online", icon: HelpCircle },
    { href: "/mahasiswa/presensi", label: "Riwayat Presensi", icon: Clock },
    { href: "/mahasiswa/nilai", label: "KHS & Nilai", icon: Award },
    { href: "/mahasiswa/pengaturan", label: "Profil & Akun", icon: Settings },
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 19) return "Selamat Sore";
  return "Selamat Malam";
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
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#e9ebef" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>Memverifikasi otentikasi SADITA…</p>
        </div>
      </main>
    );
  }

  const items = navigation[role] || [];
  const initials = user.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <Link href={homeFor(role)} style={{ display: "inline-block" }}>
            <img
              src="/logo.png"
              alt="SADITA.ai"
              className="brand-logo"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </Link>
          <div className="brand-badge">Sistem Akademik Terintegrasi</div>
        </div>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-meta">
            <div className="user-name" title={user.full_name}>{user.full_name}</div>
            <span className="user-role-badge">{user.role}</span>
          </div>
        </div>

        {/* Navigation */}
        <ul className="sidebar-nav">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="nav-link"
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
            onClick={() => {
              clearStoredToken();
              router.replace("/login");
            }}
          >
            <LogOut size={20} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-greeting">
            <span>{getGreeting()}, {user.full_name.split(" ")[0]}!</span>
            <span className="wave">👋</span>
          </div>
          <label className="topbar-search">
            <Search size={18} />
            <input type="text" placeholder="Cari..." />
          </label>
          <div className="topbar-avatar">{initials}</div>
        </div>

        {children}
      </main>

      {/* Embedded SI KOBAR AI Assistant */}
      <KobarAssistant user={user} />
    </div>
  );
}
