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
  const [pendingRequests, setPendingRequests] = useState<AttendanceRequest[]>([]);
  const [students, setStudents] = useState<Record<number, { name: string; nim: string }>>({});
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const reloadPending = async (classId: number) => {
    const res = await workflowApi.pendingPresence(classId);
    setPendingRequests(res.data ?? []);
  };

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
      void reloadPending(selected);
      void academicApi.getClassStudents(selected).then(r => {
        const map: Record<number, { name: string; nim: string }> = {};
        for (const enr of r.data ?? []) {
          map[enr.student_id] = {
            name: enr.student?.full_name ?? "—",
            nim: enr.student?.nim ?? String(enr.student_id),
          };
        }
        setStudents(map);
      });
    }
  }, [selected]);

  const handleVerify = async (requestId: number) => {
    if (!selected) return;
    setVerifyingId(requestId);
    setFeedback(null);
    const res = await workflowApi.verifyPresence(selected, requestId);
    setVerifyingId(null);
    if (res.error) {
      setFeedback({ type: "error", text: res.error });
    } else {
      setFeedback({ type: "success", text: "Kehadiran mahasiswa berhasil diverifikasi! Menunggu persetujuan dosen." });
      void reloadPending(selected);
    }
  };

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

      {feedback && (
        <div className={`alert alert-${feedback.type === "error" ? "error" : "success"}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{feedback.text}</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setFeedback(null)}>
            Tutup
          </button>
        </div>
      )}

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

      {/* Pending Attendance Requests (Verifikasi Ketua Kelas) */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <ShieldCheck size={20} color="var(--primary, #2563eb)" />
            <h3 style={{ fontWeight: 700 }}>Pengajuan Presensi Mandiri Menunggu Verifikasi</h3>
          </div>
          <span className="badge badge-info">{pendingRequests.length} Menunggu</span>
        </div>
        {pendingRequests.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Tidak ada pengajuan presensi mandiri yang sedang menunggu verifikasi untuk kelas ini.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mahasiswa</th>
                  <th>Waktu Pengajuan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(req => {
                  const stu = students[req.student_id];
                  return (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{stu?.name ?? `Mahasiswa #${req.student_id}`}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {stu?.nim ?? `ID: ${req.student_id}`}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.825rem" }}>
                        {new Date(req.submitted_at).toLocaleString("id-ID")}
                      </td>
                      <td>
                        <StatusBadge status="warning" label={req.status} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={verifyingId === req.id}
                          onClick={() => void handleVerify(req.id)}
                        >
                          <CheckCircle size={14} />
                          {verifyingId === req.id ? "Memverifikasi…" : "Verifikasi Hadir"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
