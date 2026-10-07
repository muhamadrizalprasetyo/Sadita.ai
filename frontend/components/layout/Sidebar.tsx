"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  Settings, 
  Monitor,
  ClipboardList,
  GraduationCap
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "dosen" | "mahasiswa";
  className?: string;
}

const adminMenu = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/akademik", label: "Akademik", icon: BookOpen },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/kelas", label: "Kelas", icon: GraduationCap },
  { href: "/admin/presensi", label: "Presensi", icon: Calendar },
  { href: "/admin/lms", label: "LMS", icon: FileText },
  { href: "/admin/perangkat", label: "Perangkat", icon: Monitor },
  { href: "/admin/audit", label: "Audit", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const dosenMenu = [
  { href: "/dosen/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dosen/kelas", label: "Kelas Saya", icon: GraduationCap },
  { href: "/dosen/presensi", label: "Presensi", icon: Calendar },
  { href: "/dosen/materi", label: "Materi", icon: FileText },
  { href: "/dosen/tugas", label: "Tugas", icon: BookOpen },
  { href: "/dosen/quiz", label: "Quiz", icon: ClipboardList },
  { href: "/dosen/nilai", label: "Nilai", icon: GraduationCap },
];

const mahasiswaMenu = [
  { href: "/mahasiswa/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mahasiswa/kelas", label: "Kelas Saya", icon: GraduationCap },
  { href: "/mahasiswa/jadwal", label: "Jadwal", icon: Calendar },
  { href: "/mahasiswa/presensi", label: "Presensi", icon: Calendar },
  { href: "/mahasiswa/presensi/verifikasi", label: "Verifikasi Presensi", icon: ClipboardList },
  { href: "/mahasiswa/materi", label: "Materi", icon: FileText },
  { href: "/mahasiswa/tugas", label: "Tugas", icon: BookOpen },
  { href: "/mahasiswa/quiz", label: "Quiz", icon: ClipboardList },
  { href: "/mahasiswa/nilai", label: "Nilai", icon: GraduationCap },
  { href: "/mahasiswa/profil", label: "Profil", icon: Users },
];

export default function Sidebar({ role, className = "" }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = role === "admin" ? adminMenu : role === "dosen" ? dosenMenu : mahasiswaMenu;

  return (
    <aside className={`w-64 bg-slate-900 text-white min-h-screen ${className}`}>
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-blue-400">SADITA.ai</h1>
        <p className="text-sm text-slate-400 mt-1 capitalize">{role} Portal</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
