"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  Clock,
  Award,
  ArrowRight,
  RefreshCw,
  BarChart3,
  TrendingUp,
  GraduationCap,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { academicApi, AdminDashboard, CourseClass, attendanceApi } from "@/lib/api";
import { StatCard, LoadingSpinner } from "@/components/ui";

export default function KaprodiDashboardPage() {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [loading, setLoading] = useState(true);

  function loadData() {
    setLoading(true);
    void Promise.all([
      academicApi.getDashboard(),
      academicApi.getClasses(),
    ]).then(([statsRes, classesRes]) => {
      if (statsRes.data) setStats(statsRes.data);
      if (classesRes.data) setClasses(classesRes.data);
    }).finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  if (loading) return <LoadingSpinner text="Memuat dashboard Ketua Program Studi..." />;

  const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Ketua Program Studi</h1>
          <p className="page-subtitle">
            Monitoring akademik, kinerja dosen, dan analisis kehadiran Program Studi Teknologi Informasi
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={loadData} className="btn btn-secondary">
            <RefreshCw size={16} />
            <span>Segarkan</span>
          </button>
          <Link href="/kaprodi/kurikulum" className="btn btn-primary">
            <BookOpen size={16} />
            <span>Kurikulum & Kelas</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      {stats && (
        <div className="stat-grid">
          <StatCard
            label="Total Mahasiswa"
            value={stats.total_students}
            icon={GraduationCap}
            color="blue"
            subtext="Mahasiswa terdaftar di prodi"
          />
          <StatCard
            label="Dosen Pengampu"
            value={stats.total_lecturers}
            icon={Users}
            color="green"
            subtext="Tenaga pengajar aktif"
          />
          <StatCard
            label="Kelas Berjalan"
            value={stats.total_classes}
            icon={BookOpen}
            color="purple"
            subtext="Semester ganjil aktif"
          />
          <StatCard
            label="Mata Kuliah"
            value={stats.total_courses}
            icon={BookOpen}
            color="indigo"
            subtext="Kurikulum tersedia"
          />
          <StatCard
            label="Sesi Presensi Aktif"
            value={stats.open_sessions}
            icon={Clock}
            color="orange"
            subtext="Sedang dibuka dosen"
          />
          <StatCard
            label="Presensi Hari Ini"
            value={stats.today_attendance}
            icon={CheckCircle}
            color="green"
            subtext="Tap RFID & Biometrik"
          />
          <StatCard
            label="Pending Approval"
            value={stats.pending_approvals}
            icon={AlertCircle}
            color={stats.pending_approvals > 0 ? "yellow" : "green"}
            subtext="Menunggu verifikasi"
          />
          <StatCard
            label="Perangkat Offline"
            value={stats.devices_offline}
            icon={BarChart3}
            color={stats.devices_offline > 0 ? "red" : "green"}
            subtext="Monitoring ESP32"
          />
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", gap: "1.5rem" }}>
        {/* Classes Overview */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Monitoring Kelas Perkuliahan</h2>
            <Link href="/kaprodi/kurikulum" className="btn btn-outline btn-sm">
              Kelola Kelas <ArrowRight size={14} />
            </Link>
          </div>

          {classes.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Belum ada kelas terdaftar.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kode Kelas</th>
                    <th>Mata Kuliah</th>
                    <th>Jadwal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.course?.name || "Mata Kuliah"}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {dayNames[c.day_of_week] || "Senin"}, {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)} WIB
                      </td>
                      <td>
                        <span className="badge badge-success">Aktif</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Menu Monitoring Kaprodi</h2>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            <Link href="/kaprodi/dosen" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <Users size={18} color="var(--primary-light)" />
              <div>
                <div style={{ fontWeight: 600 }}>Monitoring Kinerja Dosen</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Evaluasi keaktifan mengajar dan frekuensi membuka sesi presensi</div>
              </div>
            </Link>

            <Link href="/kaprodi/mahasiswa" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <GraduationCap size={18} color="#10B981" />
              <div>
                <div style={{ fontWeight: 600 }}>Monitoring Mahasiswa</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Data kehadiran, KTM, dan status akademik mahasiswa prodi</div>
              </div>
            </Link>

            <Link href="/kaprodi/presensi" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <TrendingUp size={18} color="#F59E0B" />
              <div>
                <div style={{ fontWeight: 600 }}>Analisis Presensi</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Tren kehadiran lintas kelas dan semester</div>
              </div>
            </Link>

            <Link href="/kaprodi/kurikulum" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <Award size={18} color="#8B5CF6" />
              <div>
                <div style={{ fontWeight: 600 }}>Kurikulum & Evaluasi</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Kelola mata kuliah, distribusi kelas, dan capaian pembelajaran</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
