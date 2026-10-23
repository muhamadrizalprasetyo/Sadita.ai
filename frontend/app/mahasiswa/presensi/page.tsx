"use client";

import { useEffect, useState } from "react";
import {
  academicApi,
  attendanceApi,
  workflowApi,
  authApi,
  type AttendanceRecord,
  type AttendanceSession,
  type CourseClass,
  type User,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/ui";
import { Clock, CheckCircle, AlertCircle, XCircle, Timer, Send } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  HADIR: { label: "Hadir", color: "#10B981", icon: <CheckCircle size={14} /> },
  TERLAMBAT: { label: "Terlambat", color: "#F59E0B", icon: <Timer size={14} /> },
  IZIN: { label: "Izin", color: "#60A5FA", icon: <AlertCircle size={14} /> },
  SAKIT: { label: "Sakit", color: "#A78BFA", icon: <AlertCircle size={14} /> },
  ALFA: { label: "Alfa", color: "#EF4444", icon: <XCircle size={14} /> },
};

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function MahasiswaPresensiPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number>();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [recordsBySession, setRecordsBySession] = useState<Record<number, AttendanceRecord | null>>({});
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [submittingSessionId, setSubmittingSessionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function init() {
      const [meRes, classRes] = await Promise.all([authApi.getMe(), academicApi.getClasses()]);
      if (meRes.data) setUser(meRes.data);
      const classList = classRes.data ?? [];
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClass(classList[0].id);
      }
      setLoading(false);
    }
    void init();
  }, []);

  useEffect(() => {
    if (!selectedClass || !user) return;
    setSessionsLoading(true);
    void attendanceApi.getSessions(selectedClass).then(async (r) => {
      const list = r.data ?? [];
      setSessions(list);

      const studentId = user.student_profile?.id;
      if (!studentId) {
        setSessionsLoading(false);
        return;
      }

      // Fetch attendance records for this student in this class
      const historyRes = await attendanceApi.getStudentHistory(studentId, selectedClass);
      const allRecords = historyRes.data ?? [];

      // Map session_id → record
      const mapped: Record<number, AttendanceRecord | null> = {};
      for (const session of list) {
        const found = allRecords.find((r) => r.session_id === session.id) ?? null;
        mapped[session.id] = found;
      }
      setRecordsBySession(mapped);
      setSessionsLoading(false);
    });
  }, [selectedClass, user]);

  const handleSubmitPresence = async (sessionId: number) => {
    setSubmittingSessionId(sessionId);
    setFeedback(null);
    const res = await workflowApi.submitAttendance(sessionId);
    setSubmittingSessionId(null);
    if (res.error) {
      setFeedback({ type: "error", text: res.error });
    } else {
      setFeedback({
        type: "success",
        text: "Pengajuan kehadiran berhasil dikirim! Menunggu verifikasi Ketua Kelas dan persetujuan Dosen.",
      });
    }
  };

  if (loading) return <LoadingSpinner text="Memuat riwayat presensi..." />;

  const studentProfile = user?.student_profile;
  const closedSessions = sessions.filter((s) => s.status === "CLOSED");
  const attended = closedSessions.filter((s) => {
    const r = recordsBySession[s.id];
    return r && (r.status === "HADIR" || r.status === "TERLAMBAT");
  }).length;
  const attendancePct = closedSessions.length > 0 ? Math.round((attended / closedSessions.length) * 100) : 100;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Riwayat Presensi</h1>
          <p className="page-subtitle">
            Rekap kehadiran perkuliahan per sesi — {studentProfile?.full_name ?? user?.full_name}
            {studentProfile?.nim ? ` · NIM ${studentProfile.nim}` : ""}
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

      {/* Class selector */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap" }}>Pilih Mata Kuliah:</label>
        <select
          className="form-select"
          style={{ maxWidth: "24rem", flex: 1 }}
          value={selectedClass ?? ""}
          onChange={(e) => setSelectedClass(Number(e.target.value))}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.course?.name ?? c.name}
              {c.course?.credits ? ` (${c.course.credits} SKS)` : ""} — {DAY_NAMES[c.day_of_week]}{" "}
              {c.start_time?.slice(0, 5)}
            </option>
          ))}
        </select>

        {/* Summary badges */}
        {closedSessions.length > 0 && (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginLeft: "auto" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "0.5rem", padding: "0.4rem 0.85rem", fontSize: "0.82rem", fontWeight: 700, color: "#10B981" }}>
              <Clock size={13} style={{ display: "inline", marginRight: 5 }} />
              Kehadiran: {attendancePct}% ({attended}/{closedSessions.length})
            </div>
            {attendancePct < 75 && (
              <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.5rem", padding: "0.4rem 0.85rem", fontSize: "0.82rem", fontWeight: 700, color: "#EF4444" }}>
                ⚠ Di bawah ambang 75%
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance Table */}
      {sessionsLoading ? (
        <LoadingSpinner text="Memuat sesi..." />
      ) : sessions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
          <Clock size={40} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
          <p>Belum ada sesi pertemuan untuk mata kuliah ini.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pertemuan</th>
                <th>Tanggal</th>
                <th>Topik</th>
                <th>Nama</th>
                <th>NIM</th>
                <th>Status</th>
                <th>Waktu Check-in</th>
                <th>Metode</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const rec = recordsBySession[session.id];
                const cfg = rec ? STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.ALFA : null;
                const isOpen = session.status === "OPEN";
                const isScheduled = session.status === "SCHEDULED";
                return (
                  <tr key={session.id}>
                    <td style={{ fontWeight: 700 }}>Pertemuan {session.session_number}</td>
                    <td>{session.date}</td>
                    <td style={{ maxWidth: "12rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {session.topic ?? "—"}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {rec?.student?.full_name ?? studentProfile?.full_name ?? user?.full_name ?? "—"}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                      {rec?.student?.nim ?? studentProfile?.nim ?? "—"}
                    </td>
                    <td>
                      {isScheduled ? (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Terjadwal</span>
                      ) : isOpen ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.78rem", color: "#F59E0B", fontWeight: 700 }}>Berlangsung</span>
                          {!rec && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                              onClick={() => void handleSubmitPresence(session.id)}
                              disabled={submittingSessionId === session.id}
                            >
                              <Send size={12} />
                              {submittingSessionId === session.id ? "Mengajukan…" : "Ajukan Presensi"}
                            </button>
                          )}
                        </div>
                      ) : rec && cfg ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontWeight: 600, color: cfg.color, fontSize: "0.85rem" }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                      {rec?.check_in_time
                        ? new Date(rec.check_in_time).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, day: "2-digit", month: "short" })
                        : "—"}
                    </td>
                    <td>
                      {rec?.method ? (
                        <span className="badge badge-info" style={{ fontSize: "0.75rem" }}>{rec.method}</span>
                      ) : "—"}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: "10rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {rec?.notes ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
