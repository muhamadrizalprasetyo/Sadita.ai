"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Calendar,
  Monitor,
  ClipboardList,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
} from "lucide-react";
import { academicApi, AdminDashboard, CourseClass, SaditaDevice, deviceApi } from "@/lib/api";
import { LoadingSpinner, StatCard } from "@/components/ui";

const INDONESIAN_DAYS = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function formatTime(t?: string | null): string {
  if (!t) return "--:--";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [devices, setDevices] = useState<SaditaDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true);
    Promise.all([
      academicApi.getDashboard(),
      academicApi.getClasses(),
      deviceApi.list(),
    ])
      .then(([statsRes, classesRes, devicesRes]) => {
        if (statsRes.data) setStats(statsRes.data);
        if (classesRes.data) setClasses(classesRes.data);
        if (devicesRes.data) setDevices(devicesRes.data);
        setError(null);
      })
      .catch(() => {
        setError("Gagal memuat data dashboard operasional. Pastikan backend terhubung.");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      academicApi.getDashboard(),
      academicApi.getClasses(),
      deviceApi.list(),
    ])
      .then(([statsRes, classesRes, devicesRes]) => {
        if (!isMounted) return;
        if (statsRes.data) setStats(statsRes.data);
        if (classesRes.data) setClasses(classesRes.data);
        if (devicesRes.data) setDevices(devicesRes.data);
        setError(null);
      })
      .catch(() => {
        if (isMounted) setError("Gagal memuat data dashboard operasional. Pastikan backend terhubung.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner text="Memuat data operasional kampus..." />;
  }

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {/* 1. Header */}
      <div className="page-header" style={{ marginBottom: 0, padding: 0 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
            Dashboard Administrator
          </h1>
          <p className="page-subtitle" style={{ fontSize: "12.5px", color: "var(--muted)", margin: "2px 0 0" }}>
            Sistem Akademik Terintegrasi & Monitoring Presensi IoT
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: "8px" }}
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Memuat..." : "Segarkan"}</span>
          </button>
          <Link
            href="/admin/akademik"
            className="btn btn-primary btn-sm"
            style={{ borderRadius: "8px" }}
          >
            <Plus size={14} />
            <span>Kelola Akademik</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error)", fontSize: "12.5px" }}>
          {error}
        </div>
      )}

      {/* 2. Metrics Stat Grid (8 Cards, tightly spaced) */}
      {stats && (
        <div className="stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: 0 }}>
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

      {/* 3. Realtime Overview Section (Classes Table & IoT Devices) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: "14px", alignItems: "start" }}>

        {/* Classes Table */}
        <div className="card" style={{ padding: "16px 18px", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
              Kelas Perkuliahan Aktif
            </h2>
            <Link
              href="/admin/akademik"
              className="btn btn-outline btn-sm"
              style={{ borderRadius: "8px", padding: "4px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <span>Semua Kelas</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {classes.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "12.5px", padding: "16px 0", textAlign: "center" }}>
              Belum ada kelas terdaftar.
            </p>
          ) : (
            <div className="table-container" style={{ borderRadius: "10px", border: "1px solid var(--line)", boxShadow: "none" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "135px" }}>Kode / Kelas</th>
                    <th>Mata Kuliah</th>
                    <th style={{ width: "165px" }}>Jadwal</th>
                    <th style={{ width: "80px", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.slice(0, 5).map((c) => {
                    const dayName = INDONESIAN_DAYS[c.day_of_week] || `Hari ke-${c.day_of_week}`;
                    const rombelCode = c.name.includes(" - ") ? c.name.split(" - ")[0].trim() : c.name;
                    return (
                      <tr key={c.id}>
                        <td>
                          <span className="badge-class-code" style={{ borderRadius: "6px" }}>
                            {rombelCode}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text)" }}>
                            {c.course?.name || "Mata Kuliah"}
                          </div>
                          {c.course?.code && (
                            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                              Kode: {c.course.code}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--text)" }}>
                          <div style={{ fontWeight: 500, color: "#1e293b" }}>{dayName}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                            {formatTime(c.start_time)} - {formatTime(c.end_time)} WIB
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge badge-success" style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "6px" }}>
                            Aktif
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hardware Monitoring Card */}
        <div className="card" style={{ padding: "16px 18px", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
              Status Perangkat Presensi IoT
            </h2>
            <Link
              href="/admin/perangkat"
              className="btn btn-outline btn-sm"
              style={{ borderRadius: "8px", padding: "4px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <span>Detail</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            {devices.length === 0 ? (
              <p style={{ fontSize: "12.5px", color: "var(--muted)", textAlign: "center", padding: "14px 0" }}>
                Belum ada perangkat terdaftar.
              </p>
            ) : (
              devices.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px"
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "12.5px", color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.nama}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", margin: "2px 0 0" }}>
                      ID: <span style={{ fontFamily: "var(--font-mono)" }}>{d.device_id}</span> • IP: {d.ip_address || "192.168.1.150"}
                    </p>
                  </div>
                  <span className={`badge ${d.status === "ACTIVE" ? "badge-success" : "badge-error"}`} style={{ borderRadius: "6px", fontSize: "11px", padding: "2px 7px", flexShrink: 0 }}>
                    {d.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{
            marginTop: "12px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(18, 183, 106, 0.06)",
            border: "1px solid rgba(18, 183, 106, 0.2)",
            display: "flex",
            alignItems: "flex-start",
            gap: "9px"
          }}>
            <ShieldCheck size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <p style={{ fontSize: "11.5px", color: "var(--muted)", margin: 0, lineHeight: 1.45 }}>
              Broker MQTT terhubung pada port 1883. Heartbeat perangkat otomatis disinkronkan ke database.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
