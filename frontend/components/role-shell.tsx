"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, type ReactNode } from "react";
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
  Search,
  Settings,
  Bell,
  ChevronUp,
  Sun,
  Moon,
  Monitor,
  User as UserIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/ui";
import { authApi, clearStoredToken, getStoredToken, getStoredUser, type User } from "@/lib/api";
import { KobarAssistant } from "./kobar-assistant";
import { BackToTop } from "@/components/ui";

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

const bottomNavConfig: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User", icon: Users },
    { href: "/admin/akademik", label: "Akademik", icon: Building2 },
    { href: "/admin/presensi", label: "Presensi", icon: Clock },
  ],
  KAPRODI: [
    { href: "/kaprodi/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/kaprodi/dosen", label: "Dosen", icon: Users },
    { href: "/kaprodi/mahasiswa", label: "Mahasiswa", icon: GraduationCap },
    { href: "/kaprodi/presensi", label: "Presensi", icon: Clock },
  ],
  DOSEN: [
    { href: "/dosen/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dosen/kelas", label: "Kelas", icon: BookOpen },
    { href: "/dosen/presensi", label: "Presensi", icon: Clock },
    { href: "/dosen/tugas", label: "Tugas", icon: CheckSquare },
  ],
  KETUA_KELAS: [
    { href: "/ketua-kelas/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ketua-kelas/presensi", label: "Verifikasi", icon: Clock },
    { href: "/ketua-kelas/rekan", label: "Rekan", icon: Users },
    { href: "/ketua-kelas/jadwal", label: "Jadwal", icon: Calendar },
  ],
  MAHASISWA: [
    { href: "/mahasiswa/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/mahasiswa/krs", label: "KRS", icon: Calendar },
    { href: "/mahasiswa/presensi", label: "Presensi", icon: Clock },
    { href: "/mahasiswa/tugas", label: "Tugas", icon: CheckSquare },
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
  const confirm = useConfirm();
  const [user, setUser] = useState<User | null>(() => {
    const cached = getStoredUser();
    return cached && cached.role === role ? cached : null;
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close desktop popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  // Close mobile drawer and popovers on route change (React-recommended pattern for prop change)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileDrawerOpen(false);
    setUserMenuOpen(false);
  }

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      const origHtmlOverflow = document.documentElement.style.overflow;
      const origBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = origHtmlOverflow;
        document.body.style.overflow = origBodyOverflow;
      };
    }
  }, [mobileDrawerOpen]);

  // Handle Escape key to close popovers/drawers
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  // Auth & Session check
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
        // Allow MAHASISWA with active class leader assignment to access KETUA_KELAS routes
        const isLeaderAuthorized =
          role === "KETUA_KELAS" &&
          result.data.role === "MAHASISWA" &&
          Boolean(result.data.is_class_leader);

        if (isLeaderAuthorized) {
          setUser(result.data);
        } else {
          router.replace(homeFor(result.data.role));
        }
      } else {
        setUser(result.data);
      }
    });
  }, [role, router]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileDrawerOpen(false);
    const ok = await confirm({
      title: "Keluar dari SADITA",
      message:
        "Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem? Anda harus masuk kembali untuk mengakses akun Anda.",
      variant: "warning",
      confirmText: "Ya, Keluar",
      cancelText: "Batal",
      icon: LogOut,
    });
    if (ok) {
      clearStoredToken();
      router.replace("/login");
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#e9ebef]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-slate-500 text-[13px]">Memverifikasi otentikasi SADITA…</p>
        </div>
      </main>
    );
  }

  const baseItems = navigation[role] || [];
  // PO & Audit: integrate class leader verification menu directly into student portal when assigned
  const items =
    role === "MAHASISWA" && user.is_class_leader
      ? [
          ...baseItems.slice(0, 6),
          { href: "/ketua-kelas/presensi", label: "Verifikasi Presensi (Ketua Kelas)", icon: CheckSquare },
          ...baseItems.slice(6),
        ]
      : baseItems;

  const initials = user.full_name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const quickBottomItems = bottomNavConfig[role] || baseItems.slice(0, 4);

  return (
    <div className="app-shell relative">
      {/* =========================================================================
          1. MOBILE TOP HEADER (Sticky, iPhone Notch / Dynamic Island Safe Area)
          ========================================================================= */}
      <header className="flex md:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#eceef2] dark:border-slate-800 pt-safe px-3.5 pb-2.5 items-center justify-between shadow-xs">
        {/* Brand & Drawer Toggle */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="touch-target w-10 h-10 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Buka menu navigasi"
            title="Menu"
          >
            <MenuIcon size={20} />
          </button>
          <Link href={homeFor(role)} className="flex items-center gap-1.5 min-w-0">
            <Image
              src="/logo.png"
              alt="SADITA.ai"
              width={115}
              height={30}
              priority
              className="w-26 h-auto object-contain"
            />
          </Link>
        </div>

        {/* Quick Header Actions: Notifications & User Avatar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={homeFor(role)}
            className="touch-target w-9 h-9 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            aria-label="Notifikasi"
            title="Notifikasi"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white rounded-full text-[9.5px] font-bold flex items-center justify-center leading-none">
              6
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="touch-target w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-[11px] grid place-items-center shadow-xs ml-0.5"
            aria-label="Profil pengguna"
            title={user.full_name}
          >
            {initials}
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. DESKTOP SIDEBAR (Sticky 228px, Hidden on Mobile/Tablet < md)
          ========================================================================= */}
      <aside className="sidebar hidden md:flex">
        {/* Brand */}
        <div className="sidebar-brand">
          <Link href={homeFor(role)} className="inline-block">
            <Image
              src="/logo.png"
              alt="SADITA.ai"
              width={155}
              height={40}
              priority
              className="brand-logo"
              style={{ width: "155px", height: "auto" }}
            />
          </Link>
          <div className="brand-badge">Sistem Akademik Terintegrasi</div>
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
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop Sidebar Footer */}
        <div className="sidebar-footer" ref={menuRef} style={{ position: "relative" }}>
          {/* Notifications Item */}
          <Link
            href={homeFor(role)}
            className="nav-link footer-nav-item flex items-center justify-between w-full mb-0.5"
          >
            <div className="flex items-center gap-2">
              <Bell size={16} />
              <span>Notifications</span>
            </div>
            <span className="sidebar-badge-pill">6</span>
          </Link>

          {/* User Trigger & Popover Container */}
          <div className="relative w-full">
            {/* User Popover Menu */}
            {userMenuOpen && (
              <div className="sidebar-user-popover animate-in fade-in zoom-in-95 duration-150">
                {/* User Header */}
                <div className="user-popover-header">
                  <UserIcon size={16} className="text-slate-600 dark:text-slate-300" />
                  <span className="user-popover-name" title={user.full_name}>{user.full_name}</span>
                </div>

                <div className="user-popover-divider" />

                {/* Theme toggle row (Light, Dark, System) */}
                <div className="user-popover-theme-row">
                  <button
                    type="button"
                    className={`theme-btn ${theme === "light" ? "active" : ""}`}
                    onClick={() => setTheme("light")}
                    title="Mode Terang"
                  >
                    <Sun size={15} />
                  </button>
                  <button
                    type="button"
                    className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                    onClick={() => setTheme("dark")}
                    title="Mode Gelap"
                  >
                    <Moon size={15} />
                  </button>
                  <button
                    type="button"
                    className={`theme-btn ${theme === "system" ? "active" : ""}`}
                    onClick={() => setTheme("system")}
                    title="Otomatis Sistem"
                  >
                    <Monitor size={15} />
                  </button>
                </div>

                <div className="user-popover-divider" />

                {/* Sign out row */}
                <button
                  type="button"
                  className="user-popover-logout"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            )}

            {/* Clickable User Trigger */}
            <button
              type="button"
              className="sidebar-user-trigger"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-expanded={userMenuOpen}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="user-avatar">{initials}</div>
                <span className="user-name" title={user.full_name}>{user.full_name}</span>
              </div>
              <ChevronUp
                size={16}
                className="text-slate-500 transition-transform duration-200 shrink-0"
                style={{
                  transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          3. MOBILE SLIDE-OUT DRAWER (Full Navigation, Profile & System Actions)
          ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop with Soft Black Tint */}
          <div
            className="fixed inset-0 bg-black/45"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Body Sliding From Left */}
          <div
            className="relative w-[285px] max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col pt-safe pb-safe z-50 animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi SADITA"
          >
            {/* Header: Logo & Close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eceef2] dark:border-slate-800">
              <Link href={homeFor(role)} onClick={() => setMobileDrawerOpen(false)}>
                <Image
                  src="/logo.png"
                  alt="SADITA.ai"
                  width={130}
                  height={34}
                  priority
                  className="w-28 h-auto object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="touch-target w-9 h-9 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Tutup menu"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="p-3.5 mx-3 my-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm grid place-items-center shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.full_name}
                </div>
                <div className="text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {role.replace("_", " ")}
                </div>
              </div>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 overscroll-contain">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Menu Utama
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`touch-target flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors w-full ${
                      isActive
                        ? "bg-navy/10 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-navy dark:text-blue-400" : "text-slate-400"} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer: Theme & Logout */}
            <div className="p-3 border-t border-[#eceef2] dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
              {/* Theme Row */}
              <div className="flex items-center justify-between px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                <span className="text-[11.5px] text-slate-500 font-medium">Tema Tampilan</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-1.5 rounded text-xs transition-colors ${theme === "light" ? "bg-slate-200 text-slate-900 font-bold" : "text-slate-400"}`}
                    title="Terang"
                  >
                    <Sun size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-1.5 rounded text-xs transition-colors ${theme === "dark" ? "bg-slate-700 text-white font-bold" : "text-slate-400"}`}
                    title="Gelap"
                  >
                    <Moon size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`p-1.5 rounded text-xs transition-colors ${theme === "system" ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold" : "text-slate-400"}`}
                    title="Sistem"
                  >
                    <Monitor size={14} />
                  </button>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="touch-target w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-[13px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 transition-colors"
              >
                <LogOut size={16} />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MAIN CONTENT AREA (Adaptive Desktop / Mobile Layout)
          ========================================================================= */}
      <main className="content-area">
        {/* Topbar: Visible on desktop for operational context */}
        <div className="topbar">
          <div className="topbar-greeting">
            <span>{getGreeting()}, {user.full_name.split(" ")[0]}!</span>
            <span className="wave">👋</span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <label className="topbar-search">
              <Search size={14} />
              <input type="text" placeholder="Cari data operasional..." />
            </label>
          </div>
        </div>

        {/* Route Page Children */}
        {children}
      </main>

      {/* =========================================================================
          5. MOBILE BOTTOM NAVIGATION (Ergonomic Thumb Zone, iPhone Safe Area)
          ========================================================================= */}
      <nav
        className="flex md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[#eceef2] dark:border-slate-800 pb-safe pt-1 px-1 shadow-lg"
        aria-label="Navigasi Bawah Seluler"
      >
        <div className="grid grid-cols-5 w-full items-center">
          {quickBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== homeFor(role) && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`touch-target flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-all rounded-md ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <div className={`p-1 rounded-full transition-transform ${isActive ? "scale-105 bg-blue-50 dark:bg-blue-950/50" : ""}`}>
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
                </div>
                <span className="text-[10px] leading-tight truncate max-w-16 text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* 5th Button: Drawer / Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            className={`touch-target flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-all rounded-md ${
              mobileDrawerOpen
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            aria-label="Buka menu lengkap"
          >
            <div className={`p-1 rounded-full transition-transform ${mobileDrawerOpen ? "scale-105 bg-blue-50 dark:bg-blue-950/50" : ""}`}>
              <MenuIcon size={19} strokeWidth={mobileDrawerOpen ? 2.4 : 1.8} />
            </div>
            <span className="text-[10px] leading-tight truncate max-w-16 text-center">
              Menu
            </span>
          </button>
        </div>
      </nav>

      {/* =========================================================================
          6. FLOATING CONTROLS: SI KOBAR AI Assistant & Back to Top
          ========================================================================= */}
      <KobarAssistant user={user} />
      <BackToTop />
    </div>
  );
}
