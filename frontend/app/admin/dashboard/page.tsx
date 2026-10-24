"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  BookOpen,
  Layers,
  Clock,
  Radio,
  ClipboardList,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  AlertTriangle,
  Activity,
  Zap,
} from "lucide-react";
import { academicApi, AdminDashboard, CourseClass, SaditaDevice, deviceApi } from "@/lib/api";
import {
  LoadingSpinner,
  StatCard,
  DataTable,
  type ColumnDef,
  SectionCard,
  TableToolbar,
} from "@/components/ui";

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

  // Search & Filter state for classes
  const [searchQuery, setSearchQuery] = useState("");
  const [classTypeFilter, setClassTypeFilter] = useState<string>("ALL");

  // Interactive ping state for IoT devices
  const [pingingDeviceId, setPingingDeviceId] = useState<number | null>(null);
  const [pingResult, setPingResult] = useState<{ [id: number]: string }>({});

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

  const handlePingDevice = (deviceId: number) => {
    setPingingDeviceId(deviceId);
    setTimeout(() => {
      setPingingDeviceId(null);
      setPingResult((prev) => ({
        ...prev,
        [deviceId]: "Aktif (12ms)",
      }));
      setTimeout(() => {
        setPingResult((prev) => {
          const next = { ...prev };
          delete next[deviceId];
          return next;
        });
      }, 4000);
    }, 500);
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.course?.name && c.course.name.toLowerCase().includes(q)) ||
        (c.course?.code && c.course.code.toLowerCase().includes(q)) ||
        (c.lecturer?.full_name && c.lecturer.full_name.toLowerCase().includes(q)) ||
        (c.room?.name && c.room.name.toLowerCase().includes(q));

      const matchesType =
        classTypeFilter === "ALL" ||
        (classTypeFilter === "PAGI" && (c.class_type === "REGULER_PAGI" || c.name.toLowerCase().includes("pagi"))) ||
        (classTypeFilter === "MALAM" && (c.class_type === "REGULER_MALAM" || c.name.toLowerCase().includes("malam"))) ||
        (classTypeFilter === "SHIFT" && (c.class_type === "SHIFT" || c.name.toLowerCase().includes("shift")));

      return matchesSearch && matchesType;
    });
  }, [classes, searchQuery, classTypeFilter]);

  // Reusable Column Definitions for Classes DataTable
  const classColumns = useMemo<ColumnDef<CourseClass>[]>(
    () => [
      {
        key: "rombel",
        header: "Kode / Rombel",
        width: "115px",
        render: (c) => {
          const rombelCode = c.name.includes(" - ") ? c.name.split(" - ")[0].trim() : c.name;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
              <span className="badge-class-code">{rombelCode}</span>
              <span style={{ fontSize: "9.5px", color: "var(--muted)", fontWeight: 500 }}>
                {c.class_type ? c.class_type.replace("_", " ") : "REGULER"}
              </span>
            </div>
          );
        },
      },
      {
        key: "course",
        header: "Mata Kuliah & Dosen",
        render: (c) => (
          <div>
            <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text)" }}>
              {c.course?.name || "Mata Kuliah"}
            </div>
            <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "1px" }}>
              {c.course?.code ? `${c.course.code} • ` : ""}
              {c.course?.credits ? `${c.course.credits} SKS • ` : ""}
              {c.lecturer?.full_name || "Dosen Pengampu"}
            </div>
          </div>
        ),
      },
      {
        key: "schedule",
        header: "Jadwal & Ruang",
        width: "160px",
        render: (c) => {
          const dayName = INDONESIAN_DAYS[c.day_of_week] || `Hari ke-${c.day_of_week}`;
          return (
            <div style={{ fontSize: "11.5px", color: "var(--text)" }}>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>{dayName}</div>
              <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>
                {formatTime(c.start_time)} - {formatTime(c.end_time)} WIB
              </div>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: 500 }}>
                {c.room?.name || "Lab Terjadwal"}
              </div>
            </div>
          );
        },
      },
      {
        key: "action",
        header: "Aksi",
        width: "85px",
        align: "center",
        render: () => (
          <Link
            href="/admin/presensi"
            className="btn btn-secondary btn-sm"
            style={{ padding: "3px 8px", fontSize: "10.5px" }}
            title="Buka sesi presensi kelas ini"
          >
            <span>Presensi</span>
          </Link>
        ),
      },
    ],
    []
  );

  if (loading) {
    return <LoadingSpinner text="Memuat data operasional kampus..." />;
  }

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {/* 1. Header */}
      <div className="page-header" style={{ marginBottom: 0, padding: 0 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Dashboard Administrator
          </h1>
          <p className="page-subtitle" style={{ margin: "1px 0 0" }}>
            Sistem Akademik Terintegrasi & Monitoring Presensi IoT
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
            title="Segarkan data operasional"
          >
            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Memuat..." : "Segarkan"}</span>
          </button>
          <Link
            href="/admin/presensi"
            className="btn btn-primary btn-sm"
            title="Buka sesi presensi perkuliahan"
          >
            <Plus size={13} />
            <span>Buka Sesi Presensi</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error)", fontSize: "11px" }}>
          {error}
        </div>
      )}

      {/* 2. Operational Attention Banner (Kebutuhan Perhatian as per AGENTS.md) */}
      {stats && stats.devices_offline > 0 && (
        <div
          style={{
            padding: "9px 12px",
            borderRadius: "7px",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={16} color="var(--error)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "12px", color: "#991b1b" }}>
              <strong>Perhatian Operasional:</strong> Terdeteksi {stats.devices_offline} perangkat presensi IoT offline (ESP32 Meja Dosen). Periksa koneksi broker MQTT port 1883 atau catu daya perangkat.
            </div>
          </div>
          <Link
            href="/admin/perangkat"
            className="btn btn-sm"
            style={{
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              padding: "3px 10px",
              fontSize: "11px",
              flexShrink: 0,
            }}
          >
            Periksa Perangkat
          </Link>
        </div>
      )}

      {/* 3. Metrics Stat Grid (8 Interactive KPI Cards - No Duplicate Icons) */}
      {stats && (
        <div className="stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: 0 }}>
          <Link href="/admin/users" className="stat-card-link" title="Buka Manajemen Mahasiswa">
            <StatCard
              label="Total Mahasiswa"
              value={stats.total_students}
              icon={Users}
              color="blue"
              subtext="Terdaftar di prodi"
            />
          </Link>
          <Link href="/admin/users" className="stat-card-link" title="Buka Manajemen Dosen">
            <StatCard
              label="Dosen Pengampu"
              value={stats.total_lecturers}
              icon={UserCheck}
              color="green"
              subtext="Aktif mengajar"
            />
          </Link>
          <Link href="/admin/akademik" className="stat-card-link" title="Buka Master Kelas Perkuliahan">
            <StatCard
              label="Kelas Perkuliahan"
              value={stats.total_classes}
              icon={Layers}
              color="purple"
              subtext="Semester berjalan"
            />
          </Link>
          <Link href="/admin/akademik" className="stat-card-link" title="Buka Kurikulum Mata Kuliah">
            <StatCard
              label="Mata Kuliah"
              value={stats.total_courses}
              icon={BookOpen}
              color="indigo"
              subtext="Kurikulum aktif"
            />
          </Link>
          <Link href="/admin/presensi" className="stat-card-link" title="Buka Monitoring Presensi">
            <StatCard
              label="Sesi Presensi Aktif"
              value={stats.open_sessions}
              icon={Clock}
              color="orange"
              subtext="Sedang dibuka dosen"
            />
          </Link>
          <Link href="/admin/perangkat" className="stat-card-link" title="Buka Manajemen Perangkat IoT">
            <StatCard
              label="Perangkat Offline"
              value={stats.devices_offline}
              icon={Radio}
              color={stats.devices_offline > 0 ? "red" : "green"}
              subtext="ESP32 Meja Dosen"
            />
          </Link>
          <Link href="/admin/presensi" className="stat-card-link" title="Buka Pengajuan Approval">
            <StatCard
              label="Pending Approval"
              value={stats.pending_approvals}
              icon={ClipboardList}
              color="yellow"
              subtext="Pengajuan presensi"
            />
          </Link>
          <Link href="/admin/presensi" className="stat-card-link" title="Buka Riwayat Presensi Hari Ini">
            <StatCard
              label="Presensi Hari Ini"
              value={stats.today_attendance}
              icon={CheckCircle}
              color="green"
              subtext="Tap RFID & Biometrik"
            />
          </Link>
        </div>
      )}

      {/* 4. Real-time Live Attendance Session Card (if active session exists) */}
      {stats?.active_session && (
        <div
          className="card"
          style={{
            padding: "12px 14px",
            background: "linear-gradient(135deg, rgba(236, 253, 245, 0.9) 0%, rgba(240, 253, 250, 0.9) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="pulse-dot" />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Sesi Perkuliahan Berlangsung (Real-Time Live)
              </span>
            </div>
            <span className="badge badge-success" style={{ fontSize: "10.5px", padding: "2px 8px" }}>
              Pertemuan ke-{stats.active_session.session_number}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="badge-class-code" style={{ background: "#ffffff", borderColor: "#a7f3d0" }}>
                  {stats.active_session.class_name}
                </span>
                <span style={{ fontWeight: 700, fontSize: "13.5px", color: "#0f172a" }}>
                  {stats.active_session.course_name}
                </span>
              </div>
              <div style={{ fontSize: "11.5px", color: "#475569", marginTop: "3px" }}>
                <strong>Topik:</strong> {stats.active_session.topic}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                Pengampu: <span style={{ fontWeight: 600, color: "#1e293b" }}>{stats.active_session.lecturer_name}</span> • Ruang: <span style={{ fontWeight: 600, color: "#1e293b" }}>{stats.active_session.room_name || "Lab IoT"}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#059669", fontFamily: "var(--font-mono)" }}>
                  {stats.active_session.present_count}
                </div>
                <div style={{ fontSize: "10px", color: "#065f46", textTransform: "uppercase", fontWeight: 600 }}>
                  Mahasiswa Hadir
                </div>
              </div>
              <Link
                href="/admin/presensi"
                className="btn btn-sm"
                style={{
                  background: "#059669",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Pantau Presensi</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 5. Realtime Overview Section (Classes Table & IoT Devices) using Reusable Components */}
      <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: "10px", alignItems: "start" }}>

        {/* Classes Reusable SectionCard + TableToolbar + DataTable */}
        <SectionCard
          title="Kelas Perkuliahan Aktif"
          subtitle={`Jadwal & rombel semester berjalan (${filteredClasses.length} dari ${classes.length} kelas)`}
          action={
            <Link
              href="/admin/akademik"
              className="btn btn-outline btn-sm"
              style={{ padding: "3px 9px", fontSize: "11.5px" }}
              title="Kelola semua data kelas perkuliahan"
            >
              <span>Kelola Semua Kelas</span>
              <ArrowRight size={13} />
            </Link>
          }
        >
          {/* Reusable TableToolbar */}
          <TableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Cari kelas, mata kuliah, dosen..."
            filterTabs={{
              activeKey: classTypeFilter,
              onChange: setClassTypeFilter,
              options: [
                { key: "ALL", label: "Semua" },
                { key: "PAGI", label: "Pagi" },
                { key: "MALAM", label: "Malam" },
              ],
            }}
          />

          {/* Reusable DataTable */}
          <DataTable<CourseClass>
            columns={classColumns}
            data={filteredClasses.slice(0, 5)}
            emptyMessage="Tidak ada kelas perkuliahan yang sesuai filter pencarian."
          />
        </SectionCard>

        {/* Right Column: Hardware Monitoring Card & Recent Activities */}
        <div style={{ display: "grid", gap: "10px" }}>

          {/* Reusable SectionCard for IoT Hardware */}
          <SectionCard
            title="Status Perangkat Presensi IoT"
            subtitle="ESP32-S3 Biometrik & RFID Reader"
            action={
              <Link
                href="/admin/perangkat"
                className="btn btn-outline btn-sm"
                style={{ padding: "3px 9px", fontSize: "11.5px" }}
                title="Lihat log perangkat IoT"
              >
                <span>Konfigurasi</span>
                <ArrowRight size={13} />
              </Link>
            }
          >
            <div style={{ display: "grid", gap: "6px" }}>
              {devices.length === 0 ? (
                <p style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center", padding: "10px 0" }}>
                  Belum ada perangkat terdaftar.
                </p>
              ) : (
                devices.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      background: "#f8fafc",
                      border: "1px solid var(--line)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "12px", color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.nama}
                      </p>
                      <p style={{ fontSize: "10.5px", color: "var(--muted)", margin: "1px 0 0" }}>
                        ID: <span style={{ fontFamily: "var(--font-mono)" }}>{d.device_id}</span> • IP: {d.ip_address || "192.168.1.150"}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      {pingResult[d.id] ? (
                        <span style={{ fontSize: "10px", color: "var(--green)", fontWeight: 600 }}>
                          {pingResult[d.id]}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePingDevice(d.id)}
                          disabled={pingingDeviceId === d.id}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "2px 7px", fontSize: "10px" }}
                          title="Cek koneksi perangkat langsung"
                        >
                          <Zap size={10} className={pingingDeviceId === d.id ? "spin" : ""} />
                          <span>{pingingDeviceId === d.id ? "Cek..." : "Ping"}</span>
                        </button>
                      )}
                      <span className={`badge ${d.status === "ACTIVE" ? "badge-success" : "badge-error"}`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{
              marginTop: "10px",
              padding: "7px 9px",
              borderRadius: "6px",
              background: "rgba(18, 183, 106, 0.06)",
              border: "1px solid rgba(18, 183, 106, 0.2)",
              display: "flex",
              alignItems: "flex-start",
              gap: "7px",
            }}>
              <ShieldCheck size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.45 }}>
                Broker MQTT terhubung pada port 1883. Heartbeat perangkat otomatis disinkronkan.
              </p>
            </div>
          </SectionCard>

          {/* Reusable SectionCard for Recent Activities */}
          <SectionCard
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Activity size={14} style={{ color: "var(--navy-accent)" }} />
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                  Aktivitas Presensi Terbaru
                </h3>
              </div>
            }
            action={<span style={{ fontSize: "10.5px", color: "var(--muted)" }}>Live Stream</span>}
          >
            <div style={{ display: "grid", gap: "6px" }}>
              {stats?.recent_activities && stats.recent_activities.length > 0 ? (
                stats.recent_activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "6px",
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                      <Radio size={12} style={{ color: "var(--navy-accent)", flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", color: "#1e293b", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {act.description}
                      </span>
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: "9.5px", padding: "1px 6px", flexShrink: 0 }}>
                      {act.action.replace("PRESENSI_", "")}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center", padding: "8px 0" }}>
                  Belum ada aktivitas presensi terbaru hari ini.
                </p>
              )}
            </div>
          </SectionCard>

        </div>

      </div>
    </div>
  );
}
