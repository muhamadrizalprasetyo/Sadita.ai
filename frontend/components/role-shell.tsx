"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { authApi, clearStoredToken, getStoredToken, type User } from "@/lib/api";

type Role = "ADMIN" | "DOSEN" | "MAHASISWA";

const navigation: Record<Role, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/akademik/tahun-akademik", label: "Tahun Akademik" },
    { href: "/admin/akademik/mata-kuliah", label: "Mata Kuliah" },
    { href: "/admin/akademik/kelas", label: "Kelas & KRS" },
    { href: "/admin/akademik/dosen", label: "Dosen" },
    { href: "/admin/akademik/mahasiswa", label: "Mahasiswa" },
    { href: "/admin/presensi/sesi", label: "Sesi Presensi" },
    { href: "/admin/lms/materi", label: "Materi" },
    { href: "/admin/lms/tugas", label: "Tugas" },
    { href: "/admin/perangkat/devices", label: "Perangkat" },
  ],
  DOSEN: [
    { href: "/dosen/dashboard", label: "Dashboard" },
    { href: "/dosen/kelas", label: "Kelas Saya" },
    { href: "/dosen/presensi", label: "Presensi" },
    { href: "/dosen/materi", label: "Materi" },
    { href: "/dosen/tugas", label: "Tugas" },
    { href: "/dosen/nilai", label: "Nilai" },
  ],
  MAHASISWA: [
    { href: "/mahasiswa/dashboard", label: "Dashboard" },
    { href: "/mahasiswa/jadwal", label: "Jadwal" },
    { href: "/mahasiswa/presensi", label: "Presensi" },
    { href: "/mahasiswa/presensi/verifikasi", label: "Verifikasi Presensi" },
    { href: "/mahasiswa/mata-kuliah", label: "Mata Kuliah" },
    { href: "/mahasiswa/materi", label: "Materi" },
    { href: "/mahasiswa/tugas", label: "Tugas" },
    { href: "/mahasiswa/nilai", label: "Nilai" },
  ],
};

function homeFor(role: Role) {
  return role === "ADMIN" ? "/admin/dashboard" : role === "DOSEN" ? "/dosen/dashboard" : "/mahasiswa/dashboard";
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

  if (!user) return <main className="screen-center">Memverifikasi akses…</main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href={homeFor(role)}>SADITA.ai</Link>
      <p className="user-name">{user.full_name}</p><small>{user.role}</small>
      <nav>{navigation[role].map((item) => <Link key={item.href} className={pathname === item.href ? "nav-active" : ""} href={item.href}>{item.label}</Link>)}</nav>
      <button className="secondary" onClick={() => { clearStoredToken(); router.replace("/login"); }}>Logout</button>
    </aside>
    <main className="content">{children}</main>
  </div>;
}
