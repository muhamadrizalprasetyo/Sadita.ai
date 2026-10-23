"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  FileText,
  CheckSquare,
  HelpCircle,
  Award,
  LogOut,
  Search,
  type LucideIcon,
} from "lucide-react";
import { authApi, clearStoredToken, getStoredToken, type User } from "@/lib/api";
import { KobarAssistant } from "@/components/kobar-assistant";
import { homeFor } from "@/components/role-shell";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dosen/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dosen/kelas", label: "Kelas Saya", icon: BookOpen },
  { href: "/dosen/presensi", label: "Sesi Presensi", icon: Clock },
  { href: "/dosen/materi", label: "Materi Kuliah", icon: FileText },
  { href: "/dosen/tugas", label: "Tugas & Penilaian", icon: CheckSquare },
  { href: "/dosen/kuis", label: "Kuis Online", icon: HelpCircle },
  { href: "/dosen/nilai", label: "Rekap Nilai", icon: Award },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 19) return "Selamat Sore";
  return "Selamat Malam";
}

export function DosenShell({ children }: { children: ReactNode }) {
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
      } else if (result.data.role !== "DOSEN") {
        router.replace(homeFor(result.data.role));
      } else {
        setUser(result.data);
      }
    });
  }, [router]);

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#e9ebef" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>Memverifikasi sesi dosen…</p>
        </div>
      </main>
    );
  }

  const initials = user.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-title">
            SADITA<span>.ai</span>
          </div>
          <div className="brand-badge">Teknologi Informasi</div>
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-meta">
            <div className="user-name" title={user.full_name}>{user.full_name}</div>
            <span className="user-role-badge">Dosen</span>
          </div>
        </div>

        {/* Navigation */}
        <ul className="sidebar-nav">
          <li className="sidebar-section-title">Perkuliahan</li>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link href={item.href} className={`nav-link ${isActive ? "active" : ""}`}>
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
            type="button"
            className="nav-link"
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
            onClick={() => {
              clearStoredToken();
              router.replace("/login");
            }}
          >
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

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

      <KobarAssistant user={user} />
    </div>
  );
}
