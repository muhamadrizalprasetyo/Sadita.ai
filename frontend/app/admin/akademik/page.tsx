"use client";

import Link from "next/link";
import { Calendar, BookOpen, Layers, Users, GraduationCap, ArrowRight } from "lucide-react";

export default function AdminAkademikIndex() {
  const sections = [
    {
      title: "Tahun Akademik & Semester",
      desc: "Kelola periode semester perkuliahan ganjil dan genap.",
      href: "/admin/akademik/tahun-akademik",
      icon: Calendar,
      color: "rgba(56, 189, 248, 0.15)",
      textColor: "#38BDF8",
    },
    {
      title: "Katalog Mata Kuliah",
      desc: "Manajemen kurikulum, kode mata kuliah, dan bobot SKS.",
      href: "/admin/akademik/mata-kuliah",
      icon: BookOpen,
      color: "rgba(99, 102, 241, 0.15)",
      textColor: "#6366F1",
    },
    {
      title: "Kelas Perkuliahan & KRS",
      desc: "Buka kelas baru, plot dosen pengampu, dan enroll mahasiswa.",
      href: "/admin/akademik/kelas",
      icon: Layers,
      color: "rgba(139, 92, 246, 0.15)",
      textColor: "#8B5CF6",
    },
    {
      title: "Data Dosen Pengajar",
      desc: "Direktori NIDN, kontak, dan penugasan mengajar dosen.",
      href: "/admin/akademik/dosen",
      icon: Users,
      color: "rgba(16, 185, 129, 0.15)",
      textColor: "#10B981",
    },
    {
      title: "Data Mahasiswa & Biometrik",
      desc: "Nomor Induk Mahasiswa (NIM), mapping RFID KTM, dan FP slot.",
      href: "/admin/akademik/mahasiswa",
      icon: GraduationCap,
      color: "rgba(245, 158, 11, 0.15)",
      textColor: "#F59E0B",
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Data Akademik</h1>
          <p className="page-subtitle">Pusat konfigurasi kurikulum, jadwal, dan civitas akademika</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "1.25rem" }}>
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem", transition: "transform 0.15s ease, border-color 0.15s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "var(--radius-lg)", background: s.color, color: s.textColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={24} />
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{s.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
