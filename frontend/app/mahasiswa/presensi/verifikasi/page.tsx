"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { academicApi, attendanceApi, CourseClass, AttendanceSession } from "@/lib/api";
import { LoadingSpinner, StatusBadge } from "@/components/ui";

export default function MahasiswaPresensiVerifikasiPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number>();

  useEffect(() => {
    void academicApi.getClasses().then(r => {
      const data = r.data ?? [];
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id);
        void attendanceApi.getSessions(data[0].id).then(sr => {
          setSessions(sr.data ?? []);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleClassChange = async (classId: number) => {
    setSelectedClassId(classId);
    const sr = await attendanceApi.getSessions(classId);
    setSessions(sr.data ?? []);
  };

  if (loading) return <LoadingSpinner text="Memuat riwayat presensi..." />;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Status Presensi Saya</h1>
          <p className="page-subtitle">Riwayat kehadiran dan status verifikasi presensi RFID / manual</p>
        </div>
      </div>

      {classes.length > 0 && (
        <div className="card" style={{ padding: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Kelas:</span>
            <select
              value={selectedClassId ?? ""}
              onChange={e => void handleClassChange(Number(e.target.value))}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
              }}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.course?.name || c.name}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Pertemuan</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Tanggal</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Topik</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Status Sesi</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Belum ada sesi presensi untuk kelas ini
                </td>
              </tr>
            ) : (
              sessions.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Pertemuan {s.session_number}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{s.date}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>{s.topic || "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <StatusBadge
                      status={s.status === "OPEN" ? "info" : s.status === "CLOSED" ? "success" : "neutral"}
                      label={s.status}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: "1.5rem", textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
        <Clock size={28} color="var(--text-muted)" style={{ margin: "0 auto 0.5rem" }} />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
          Status kehadiran individual akan tersedia setelah sesi ditutup oleh dosen.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.4rem", fontStyle: "italic" }}>
          Prototype — detail verifikasi presensi sedang dikembangkan
        </p>
      </div>
    </div>
  );
}
