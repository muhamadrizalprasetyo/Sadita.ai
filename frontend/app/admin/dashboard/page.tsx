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
    <div style={{ display: "grid", gap: "24px" }}>
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
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-search)", background: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error)", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Metrics Stat Grid */}
      {stats && (
        <div className="stats">
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Classes Table */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Kelas Perkuliahan Aktif</h2>
            <Link href="/admin/akademik" className="btn btn-outline btn-sm">
              Semua Kelas <ArrowRight size={14} />
            </Link>
          </div>

          {classes.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>Belum ada kelas terdaftar.</p>
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
                      <td style={{ fontSize: "12px", color: "var(--muted)" }}>
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
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Status Perangkat Presensi IoT</h2>
            <Link href="/admin/perangkat" className="btn btn-outline btn-sm">
              Detail <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {devices.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-search)",
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--text)" }}>{d.nama}</p>
                  <p style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "2px" }}>
                    ID: {d.device_id} • IP: {d.ip_address || "192.168.1.x"}
                  </p>
                </div>
                <span className={`badge ${d.status === "ACTIVE" ? "badge-success" : "badge-error"}`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "var(--radius-search)", background: "rgba(18, 183, 106, 0.06)", border: "1px solid rgba(18, 183, 106, 0.2)", display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={18} color="var(--green)" />
            <p style={{ fontSize: "12px", color: "var(--muted)" }}>
              Broker MQTT terhubung pada port 1883. Heartbeat perangkat otomatis disinkronkan ke database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
