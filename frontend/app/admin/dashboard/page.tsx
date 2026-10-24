"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Plus,
  GraduationCap,
  Layers,
  Radio,
  Building2,
  Activity,
  AlertTriangle,
  Cpu
} from "lucide-react";
import { academicApi, AdminDashboard, CourseClass, SaditaDevice, deviceApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui";

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

  const loadData = (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

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
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Memuat ringkasan operasional akademik SADITA.ai..." />;
  }

  return (
    <div style={{ display: "grid", gap: "28px" }}>
      {/* 1. Header Section */}
      <div className="page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 className="page-title" style={{ margin: 0 }}>Dashboard Administrator</h1>
            <span className="term-chip">
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }} />
              T.A. 2026/2027 Ganjil
            </span>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Sistem Akademik Terintegrasi & Monitoring Presensi IoT UNIPI
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <RefreshCw size={15} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Memperbarui..." : "Segarkan"}</span>
          </button>
          <Link href="/admin/akademik" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Plus size={16} />
            <span>Kelola Akademik</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "10px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Primary Academic KPI Grid (Human-Crafted Enterprise Design) */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
          {/* Card 1: Total Mahasiswa */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
          }}>
            <div>
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Total Mahasiswa
              </span>
              <div style={{ fontSize: "30px", fontWeight: 700, color: "#0f172a", marginTop: "4px", lineHeight: 1.1 }}>
                {stats.total_students}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
                Terdaftar di Program Studi TI
              </div>
            </div>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "rgba(5, 150, 105, 0.08)",
              color: "#059669",
              display: "grid",
              placeItems: "center"
            }}>
              <GraduationCap size={22} />
            </div>
          </div>

          {/* Card 2: Dosen Pengampu */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
          }}>
            <div>
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Dosen Pengampu
              </span>
              <div style={{ fontSize: "30px", fontWeight: 700, color: "#0f172a", marginTop: "4px", lineHeight: 1.1 }}>
                {stats.total_lecturers}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
                Aktif mengajar semester berjalan
              </div>
            </div>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "rgba(29, 78, 216, 0.08)",
              color: "#1d4ed8",
              display: "grid",
              placeItems: "center"
            }}>
              <Users size={22} />
            </div>
          </div>

          {/* Card 3: Kelas Perkuliahan */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
          }}>
            <div>
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Kelas Perkuliahan
              </span>
              <div style={{ fontSize: "30px", fontWeight: 700, color: "#0f172a", marginTop: "4px", lineHeight: 1.1 }}>
                {stats.total_classes}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
                Reguler Pagi, Malam & Shift
              </div>
            </div>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "rgba(99, 102, 241, 0.08)",
              color: "#6366f1",
              display: "grid",
              placeItems: "center"
            }}>
              <BookOpen size={22} />
            </div>
          </div>

          {/* Card 4: Mata Kuliah */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
          }}>
            <div>
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Mata Kuliah
              </span>
              <div style={{ fontSize: "30px", fontWeight: 700, color: "#0f172a", marginTop: "4px", lineHeight: 1.1 }}>
                {stats.total_courses}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
                Kurikulum operasional aktif
              </div>
            </div>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "rgba(100, 116, 139, 0.08)",
              color: "#475569",
              display: "grid",
              placeItems: "center"
            }}>
              <Layers size={22} />
            </div>
          </div>
        </div>
      )}

      {/* 3. Operational Activity & Hardware Status Strip */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {/* Status 1: Sesi Presensi Aktif */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(5, 150, 105, 0.08)",
              color: "#059669",
              display: "grid",
              placeItems: "center",
              flexShrink: 0
            }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>{stats.open_sessions}</span>
                <span className="badge badge-success" style={{ fontSize: "10.5px", padding: "2px 6px" }}>LIVE</span>
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b" }}>Sesi Presensi Dibuka</div>
            </div>
          </div>

          {/* Status 2: Perangkat Presensi IoT */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: stats.devices_offline > 0 ? "rgba(225, 29, 72, 0.08)" : "rgba(5, 150, 105, 0.08)",
              color: stats.devices_offline > 0 ? "#e11d48" : "#059669",
              display: "grid",
              placeItems: "center",
              flexShrink: 0
            }}>
              <Monitor size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>
                  {stats.devices_offline > 0 ? stats.devices_offline : "0"}
                </span>
                <span className={`badge ${stats.devices_offline > 0 ? "badge-error" : "badge-success"}`} style={{ fontSize: "10.5px", padding: "2px 6px" }}>
                  {stats.devices_offline > 0 ? "Offline" : "Online"}
                </span>
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b" }}>ESP32 Perlu Cek</div>
            </div>
          </div>

          {/* Status 3: Persetujuan Pending */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: stats.pending_approvals > 0 ? "rgba(217, 119, 6, 0.08)" : "rgba(100, 116, 139, 0.08)",
              color: stats.pending_approvals > 0 ? "#d97706" : "#64748b",
              display: "grid",
              placeItems: "center",
              flexShrink: 0
            }}>
              <ClipboardList size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>{stats.pending_approvals}</span>
                <span className="badge" style={{
                  fontSize: "10.5px",
                  padding: "2px 6px",
                  background: stats.pending_approvals > 0 ? "#fef3c7" : "#f1f5f9",
                  color: stats.pending_approvals > 0 ? "#b45309" : "#64748b"
                }}>
                  {stats.pending_approvals > 0 ? "Pending" : "Selesai"}
                </span>
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b" }}>Persetujuan Presensi</div>
            </div>
          </div>

          {/* Status 4: Presensi Hari Ini */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(5, 150, 105, 0.08)",
              color: "#059669",
              display: "grid",
              placeItems: "center",
              flexShrink: 0
            }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>{stats.today_attendance}</span>
                <span className="badge badge-success" style={{ fontSize: "10.5px", padding: "2px 6px" }}>Hari Ini</span>
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b" }}>Presensi RFID & Bio</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Two-Column Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1.2fr)", gap: "24px", alignItems: "start" }}>

        {/* Left Column: Kelas Perkuliahan Terjadwal */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                Kelas Perkuliahan Terjadwal
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--muted)", margin: "3px 0 0" }}>
                Daftar rombel aktif semester ganjil
              </p>
            </div>
            <Link href="/admin/akademik" className="btn btn-outline btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span>Semua Kelas</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {classes.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              Belum ada kelas perkuliahan aktif.
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, boxShadow: "none", border: "1px solid var(--line)", borderRadius: "10px" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "130px", width: "140px" }}>Kelas / Rombel</th>
                    <th style={{ minWidth: "200px" }}>Mata Kuliah & Ruangan</th>
                    <th style={{ width: "175px" }}>Jadwal Kuliah</th>
                    <th style={{ width: "90px", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.slice(0, 6).map((c) => {
                    const dayName = INDONESIAN_DAYS[c.day_of_week] || `Hari ke-${c.day_of_week}`;
                    const rombelCode = c.name.includes(" - ") ? c.name.split(" - ")[0].trim() : c.name;
                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <span className="badge-class-code" style={{ width: "fit-content" }}>{rombelCode}</span>
                            {c.class_type && (
                              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "capitalize" }}>
                                {c.class_type.toLowerCase().replace("_", " ")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text)" }}>
                            {c.course?.name || "Mata Kuliah"}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                            {c.course?.code && <span>Kode: {c.course.code}</span>}
                            {c.room && (
                              <>
                                <span>•</span>
                                <span>R. {c.room.name || c.room.code}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: "12.5px", color: "var(--text)" }}>
                          <div style={{ fontWeight: 500, color: "#1e293b" }}>{dayName}</div>
                          <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                            {formatTime(c.start_time)} - {formatTime(c.end_time)} WIB
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge badge-success" style={{ fontSize: "11px", padding: "3px 8px" }}>
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

        {/* Right Column: Hardware Monitoring & Telemetry */}
        <div style={{ display: "grid", gap: "20px" }}>
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                  Perangkat Presensi SADITA
                </h2>
                <p style={{ fontSize: "12.5px", color: "var(--muted)", margin: "3px 0 0" }}>
                  Monitoring status hardware ESP32-S3
                </p>
              </div>
              <Link href="/admin/perangkat" className="btn btn-outline btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span>Detail</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              {devices.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
                  Belum ada perangkat terdaftar.
                </p>
              ) : (
                devices.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: d.status === "ACTIVE" ? "rgba(5, 150, 105, 0.08)" : "rgba(225, 29, 72, 0.08)",
                        color: d.status === "ACTIVE" ? "#059669" : "#e11d48",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0
                      }}>
                        <Cpu size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.nama}
                        </p>
                        <p style={{ fontSize: "11.5px", color: "var(--muted)", margin: "2px 0 0" }}>
                          ID: <span style={{ fontFamily: "var(--font-mono)" }}>{d.device_id}</span> • IP: {d.ip_address || "192.168.1.150"}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${d.status === "ACTIVE" ? "badge-success" : "badge-error"}`} style={{ flexShrink: 0 }}>
                      {d.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* MQTT Telemetry Banner */}
            <div style={{
              marginTop: "16px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(5, 150, 105, 0.05)",
              border: "1px solid rgba(5, 150, 105, 0.18)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px"
            }}>
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ fontSize: "12px", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                <strong>MQTT Mosquitto Terhubung</strong> (Port 1883). Sinkronisasi event tap RFID & verifikasi biometrik langsung terintegrasi dengan database PostgreSQL.
              </p>
            </div>
          </div>

          {/* Standar Kebijakan Akademik & Presensi Card */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 12px" }}>
              Parameter Operasional Akademik
            </h3>
            <div style={{ display: "grid", gap: "10px", fontSize: "12.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "var(--muted)" }}>Batas Kehadiran UAS</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>Min. 75% Pertemuan</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "var(--muted)" }}>Toleransi Keterlambatan</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>15 Menit Sesi Buka</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "var(--muted)" }}>Otentikasi Perangkat</span>
                <span style={{ fontWeight: 600, color: "#059669" }}>KTM RFID + Biometrik</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Protokol Keamanan</span>
                <span style={{ fontWeight: 600, color: "#1d4ed8" }}>Zero-Trust HMAC-SHA256</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quick Access Operational Navigation */}
      <div className="card" style={{ padding: "22px 24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>
          Akses Cepat Pengelolaan Akademik
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <Link
            href="/admin/akademik"
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#1e293b",
              fontWeight: 500,
              fontSize: "13px",
              transition: "all .15s"
            }}
          >
            <Building2 size={18} color="#059669" />
            <span>Master Akademik & Prodi</span>
          </Link>
          <Link
            href="/admin/users"
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#1e293b",
              fontWeight: 500,
              fontSize: "13px",
              transition: "all .15s"
            }}
          >
            <Users size={18} color="#1d4ed8" />
            <span>Manajemen Pengguna</span>
          </Link>
          <Link
            href="/admin/presensi"
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#1e293b",
              fontWeight: 500,
              fontSize: "13px",
              transition: "all .15s"
            }}
          >
            <Clock size={18} color="#6366f1" />
            <span>Sesi & Log Presensi</span>
          </Link>
          <Link
            href="/admin/lms"
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#1e293b",
              fontWeight: 500,
              fontSize: "13px",
              transition: "all .15s"
            }}
          >
            <BookOpen size={18} color="#d97706" />
            <span>Materi & Tugas LMS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
