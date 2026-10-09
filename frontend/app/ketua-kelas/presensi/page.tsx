"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle
} from "lucide-react";
import { academicApi, attendanceApi, workflowApi, CourseClass, AttendanceSession, AttendanceRecord, AttendanceRequest } from "@/lib/api";
import { LoadingSpinner, StatusBadge } from "@/components/ui";

export default function KetuaKelasPresensiPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selected, setSelected] = useState<number>();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void academicApi.getClasses().then(r => {
      setClasses(r.data ?? []);
      if (r.data && r.data.length > 0) setSelected(r.data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selected) {
      void attendanceApi.getSessions(selected).then(r => {
        const sess = r.data ?? [];
        setSessions(sess);
        const open = sess.find(s => s.status === "OPEN");
        setActiveSession(open || null);
        if (open) {
          void attendanceApi.getSessionRecords(open.id).then(rr => setRecords(rr.data ?? []));
        } else {
          setRecords([]);
        }
      });
    }
  }, [selected]);

  if (loading) return <LoadingSpinner text="Memuat panel verifikasi presensi..." />;

  const statusColor = (s: string) => {
    switch (s) {
      case "HADIR": return "success";
      case "TERLAMBAT": return "warning";
      case "IZIN": case "SAKIT": return "info";
      case "ALFA": return "error";
      default: return "neutral";
    }
  };

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Verifikasi Presensi Kelas</h1>
          <p className="page-subtitle">
            Sebagai Ketua Kelas, Anda dapat memverifikasi kehadiran rekan yang mengalami kendala RFID/biometrik
          </p>
        </div>
      </div>

      {/* Class Selector */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Pilih Kelas:</label>
        <select
          className="form-select"
          style={{ maxWidth: "20rem" }}
          value={selected ?? ""}
          onChange={e => setSelected(Number(e.target.value))}
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.course?.name})</option>)}
        </select>
      </div>

      {/* Active Session Info */}
      {activeSession ? (
        <div className="card" style={{ border: "1px solid rgba(245, 158, 11, 0.3)", background: "rgba(245, 158, 11, 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <Clock size={20} color="#F59E0B" />
            <div>
              <h3 style={{ fontWeight: 700 }}>Sesi Pertemuan {activeSession.session_number} — TERBUKA</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {activeSession.topic || "Topik belum ditentukan"} • Tanggal: {activeSession.date}
              </p>
            </div>
            <StatusBadge status="warning" label="OPEN" />
          </div>

          {/* Attendance Records */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mahasiswa</th>
                  <th>Status Kehadiran</th>
                  <th>Metode</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>
                      {r.student?.nim || `ID ${r.student_id}`}
                    </td>
                    <td>
                      <StatusBadge
                        status={statusColor(r.status)}
                        label={r.status}
                      />
                    </td>
                    <td style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                      {r.method || "Menunggu"}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {r.check_in_time || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {records.filter(r => r.status === "ALFA").length > 0 && (
            <div style={{ marginTop: "1rem", padding: "0.85rem", borderRadius: "var(--radius-md)", background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertCircle size={18} color="var(--error)" />
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                <strong>{records.filter(r => r.status === "ALFA").length} mahasiswa</strong> berstatus ALFA. Jika ada yang hadir namun gagal tap, Anda dapat mengajukan verifikasi manual ke Dosen Pengampu.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <CheckCircle size={40} color="var(--success)" style={{ margin: "0 auto 1rem" }} />
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Tidak Ada Sesi Aktif</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Belum ada sesi presensi yang sedang terbuka untuk kelas ini. Sesi akan dibuka oleh Dosen Pengampu.
          </p>
        </div>
      )}

      {/* Session History */}
      <div className="card">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Riwayat Sesi Presensi</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pertemuan</th>
                <th>Tanggal</th>
                <th>Topik</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>Pertemuan {s.session_number}</td>
                  <td>{s.date}</td>
                  <td>{s.topic || "—"}</td>
                  <td>
                    <StatusBadge
                      status={s.status === "OPEN" ? "warning" : s.status === "CLOSED" ? "success" : "neutral"}
                      label={s.status === "OPEN" ? "Terbuka" : s.status === "CLOSED" ? "Selesai" : "Terjadwal"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
