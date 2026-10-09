"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  BookOpen
} from "lucide-react";
import { academicApi, CourseClass, attendanceApi, authApi, User, AttendanceSession } from "@/lib/api";
import { StatCard, LoadingSpinner } from "@/components/ui";

export default function KetuaKelasDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [userRes, classesRes] = await Promise.all([
        authApi.getMe(),
        academicApi.getClasses(),
      ]);
      if (userRes.data) setUser(userRes.data);
      if (classesRes.data) {
        setClasses(classesRes.data);
        // Load sessions for the first class
        if (classesRes.data.length > 0) {
          const sessRes = await attendanceApi.getSessions(classesRes.data[0].id);
          if (sessRes.data) setSessions(sessRes.data);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingSpinner text="Memuat dashboard Ketua Kelas..." />;

  const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const openSessions = sessions.filter(s => s.status === "OPEN");

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Ketua Kelas</h1>
          <p className="page-subtitle">
            Koordinasi presensi, verifikasi kehadiran rekan kelas, dan monitoring kelas
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={loadData} className="btn btn-secondary">
            <RefreshCw size={16} />
            <span>Segarkan</span>
          </button>
          <Link href="/ketua-kelas/presensi" className="btn btn-primary">
            <ShieldCheck size={16} />
            <span>Verifikasi Presensi</span>
          </Link>
        </div>
      </div>

      {/* Identity Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(139, 92, 246, 0.06))", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "var(--radius-lg)", background: "var(--primary-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "1.25rem" }}>
            {user?.full_name?.charAt(0) || "K"}
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{user?.full_name}</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Ketua Kelas • NIM: {user?.student_profile?.nim || "202401002"} • S1 Teknologi Informasi
            </p>
          </div>
          <span className="badge badge-info" style={{ marginLeft: "auto" }}>KETUA_KELAS</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid">
        <StatCard
          label="Kelas Diampu"
          value={classes.length}
          icon={BookOpen}
          color="indigo"
          subtext="Terdaftar di semester ini"
        />
        <StatCard
          label="Sesi Presensi Aktif"
          value={openSessions.length}
          icon={Clock}
          color={openSessions.length > 0 ? "orange" : "green"}
          subtext={openSessions.length > 0 ? "Menunggu verifikasi" : "Semua terverifikasi"}
        />
        <StatCard
          label="Total Pertemuan"
          value={sessions.length}
          icon={Calendar}
          color="blue"
          subtext="Seluruh riwayat sesi"
        />
        <StatCard
          label="Status Verifikasi"
          value="Aktif"
          icon={ShieldCheck}
          color="green"
          subtext="Hak verifikasi presensi"
        />
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", gap: "1.5rem" }}>
        {/* Classes List */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Kelas Perkuliahan</h2>
            <Link href="/ketua-kelas/jadwal" className="btn btn-outline btn-sm">
              Jadwal <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {classes.map(c => (
              <div
                key={c.id}
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius-lg)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{c.course?.name || c.name}</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                    {c.name} • {c.course?.credits || 3} SKS
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--primary-light)", marginTop: "0.2rem" }}>
                    <Calendar size={12} style={{ display: "inline", marginRight: "4px" }} />
                    {dayNames[c.day_of_week] || "Senin"}, {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)} WIB
                  </p>
                </div>
                <Link href="/ketua-kelas/presensi" className="btn btn-secondary btn-sm">
                  Presensi
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Aksi Ketua Kelas</h2>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            <Link href="/ketua-kelas/presensi" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <ShieldCheck size={18} color="var(--primary-light)" />
              <div>
                <div style={{ fontWeight: 600 }}>Verifikasi Presensi Rekan</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Verifikasi dan ajukan presensi manual mahasiswa di kelas</div>
              </div>
            </Link>

            <Link href="/ketua-kelas/rekan" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <Users size={18} color="#10B981" />
              <div>
                <div style={{ fontWeight: 600 }}>Daftar Rekan Mahasiswa</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Lihat anggota kelas dan status KTM/biometrik</div>
              </div>
            </Link>

            <Link href="/ketua-kelas/materi" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <FileText size={18} color="#8B5CF6" />
              <div>
                <div style={{ fontWeight: 600 }}>Materi Perkuliahan</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Akses modul dan materi yang diunggah dosen</div>
              </div>
            </Link>

            <Link href="/ketua-kelas/jadwal" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <Calendar size={18} color="#F59E0B" />
              <div>
                <div style={{ fontWeight: 600 }}>Jadwal & Ruang Kuliah</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Cek jadwal mingguan dan lokasi ruangan</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
