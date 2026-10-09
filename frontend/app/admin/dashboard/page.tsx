"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Monitor, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus
} from "lucide-react";
import { academicApi, AdminDashboard, CourseClass, SaditaDevice, deviceApi } from "@/lib/api";
import { StatCard, LoadingSpinner, EmptyState } from "@/components/ui";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [devices, setDevices] = useState<SaditaDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    void Promise.all([
      academicApi.getDashboard(),
      academicApi.getClasses(),
      deviceApi.list(),
    ])
      .then(([statsRes, classesRes, devicesRes]) => {
        if (statsRes.data) setStats(statsRes.data);
        if (classesRes.data) setClasses(classesRes.data);
        if (devicesRes.data) setDevices(devicesRes.data);
      })
      .catch(() => {
        setError("Gagal memuat data dashboard operasional.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    void Promise.all([
      academicApi.getDashboard(),
      academicApi.getClasses(),
      deviceApi.list(),
    ])
      .then(([statsRes, classesRes, devicesRes]) => {
        if (statsRes.data) setStats(statsRes.data);
        if (classesRes.data) setClasses(classesRes.data);
        if (devicesRes.data) setDevices(devicesRes.data);
      })
      .catch(() => {
        setError("Gagal memuat data dashboard operasional.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner text="Memuat data operasional kampus..." />;

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Administrator</h1>
          <p className="page-subtitle">Sistem Akademik Terintegrasi & Monitoring Presensi IoT</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={loadData} className="btn btn-secondary">
            <RefreshCw size={16} />
            <span>Segarkan</span>
          </button>
          <Link href="/admin/akademik" className="btn btn-primary">
            <Plus size={16} />
            <span>Kelola Akademik</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", background: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error)" }}>
          {error}
        </div>
      )}

      {/* Metrics Stat Grid */}
      {stats && (
        <div className="stat-grid">
          <StatCard
            label="Total Mahasiswa"
            value={stats.total_students}
            icon={Users}
            color="blue"
            subtext="Terdaftar di prodi"
          />
          <StatCard
            label="Dosen Pengampu"
            value={stats.total_lecturers}
            icon={Users}
            color="green"
            subtext="Aktif mengajar"
          />
          <StatCard
            label="Kelas Perkuliahan"
            value={stats.total_classes}
            icon={BookOpen}
            color="purple"
            subtext="Semester berjalan"
          />
          <StatCard
            label="Mata Kuliah"
            value={stats.total_courses}
            icon={BookOpen}
            color="indigo"
            subtext="Kurikulum aktif"
          />
          <StatCard
            label="Sesi Presensi Aktif"
            value={stats.open_sessions}
            icon={Calendar}
            color="orange"
            subtext="Sedang dibuka dosen"
          />
          <StatCard
            label="Perangkat Offline"
            value={stats.devices_offline}
            icon={Monitor}
            color={stats.devices_offline > 0 ? "red" : "green"}
            subtext="ESP32 Meja Dosen"
          />
          <StatCard
            label="Pending Approval"
            value={stats.pending_approvals}
            icon={ClipboardList}
            color="yellow"
            subtext="Pengajuan presensi"
          />
          <StatCard
            label="Presensi Hari Ini"
            value={stats.today_attendance}
            icon={CheckCircle}
            color="green"
            subtext="Tap RFID & Biometrik"
          />
        </div>
      )}

      {/* Realtime Overview Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", gap: "1.5rem" }}>
        {/* Classes Table */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Kelas Perkuliahan Aktif</h2>
            <Link href="/admin/akademik" className="btn btn-outline btn-sm">
              Semua Kelas <ArrowRight size={14} />
            </Link>
          </div>

          {classes.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Belum ada kelas terdaftar.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kode / Kelas</th>
                    <th>Mata Kuliah</th>
                    <th>Jadwal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.course?.name || "Mata Kuliah"}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Hari ke-{c.day_of_week} ({c.start_time} - {c.end_time})
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

        {/* Hardware Monitoring Card */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Status Perangkat Presensi IoT</h2>
            <Link href="/admin/perangkat" className="btn btn-outline btn-sm">
              Detail <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {devices.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-lg)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{d.nama}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    ID: {d.device_id} • IP: {d.ip_address || "192.168.1.x"}
                  </p>
                </div>
                <span className={`badge ${d.status === "ACTIVE" ? "badge-success" : "badge-error"}`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1.5rem", padding: "1rem", borderRadius: "var(--radius-md)", background: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ShieldCheck size={20} color="var(--primary-light)" />
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Broker MQTT terhubung pada port 1883. Heartbeat perangkat otomatis disinkronkan ke database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
