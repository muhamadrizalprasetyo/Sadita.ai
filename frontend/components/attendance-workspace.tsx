"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { academicApi, attendanceApi, authApi, workflowApi, type AttendanceRequest, type AttendanceSession, type CourseClass, type User } from "@/lib/api";
import { LoadingSpinner, StatusBadge } from "@/components/ui";
import { Clock, Plus, CheckCircle, ShieldCheck } from "lucide-react";

export function AttendanceWorkspace() {
  const [user, setUser] = useState<User>();
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [classId, setClassId] = useState<number>();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const active = useMemo(() => sessions.find((item) => item.status === "OPEN"), [sessions]);

  async function load() {
    setLoading(true);
    setError(undefined);
    const [me, classResult] = await Promise.all([authApi.getMe(), academicApi.getClasses()]);
    if (!me.data || !classResult.data) {
      setError(me.error ?? classResult.error ?? "Data tidak dapat dimuat.");
      setLoading(false);
      return;
    }
    setUser(me.data);
    setClasses(classResult.data);
    const chosen = classId ?? classResult.data[0]?.id;
    setClassId(chosen);
    if (chosen) await loadClass(chosen, me.data);
    setLoading(false);
  }

  async function loadClass(id: number, current = user) {
    const sessionResult = await attendanceApi.getSessions(id);
    if (!sessionResult.data) {
      setError(sessionResult.error);
      return;
    }
    setSessions(sessionResult.data);
    if (current?.role === "MAHASISWA" || current?.role === "KETUA_KELAS") {
      const pending = await workflowApi.pendingPresence(id);
      setRequests(pending.data ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function mutate(action: () => Promise<{ error?: string }>) {
    setMessage(undefined);
    setError(undefined);
    const result = await action();
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("Perubahan berhasil tersimpan.");
      if (classId) await loadClass(classId);
    }
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await mutate(() =>
      attendanceApi.createSession({
        class_id: classId!,
        session_number: Number(fd.get("number")),
        date: String(fd.get("date")),
        topic: String(fd.get("topic") || ""),
      })
    );
    e.currentTarget.reset();
  }

  if (loading) return <LoadingSpinner text="Memuat workspace presensi…" />;

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Top Controls Card */}
      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "240px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Pilih Kelas:</span>
            <select
              className="form-select"
              style={{ width: "auto", minWidth: "200px" }}
              value={classId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setClassId(id);
                void loadClass(id);
              }}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {active && (user?.role === "MAHASISWA" || user?.role === "KETUA_KELAS") && (
            <button
              className="btn btn-primary"
              onClick={() => void mutate(() => workflowApi.submitAttendance(active.id))}
            >
              <CheckCircle size={16} /> Saya Hadir — Pertemuan {active.session_number}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-search)", background: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error)", fontSize: "13px" }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-search)", background: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success)", fontSize: "13px" }}>
          {message}
        </div>
      )}

      {/* Sesi Presensi Creator for Admin/Dosen */}
      {(user?.role === "ADMIN" || user?.role === "DOSEN") && classId && (
        <div className="card">
          <div className="card-head">
            <h3>Buat Sesi Presensi Baru</h3>
          </div>
          <form onSubmit={create} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "12px" }}>
            <div className="form-group" style={{ marginBottom: 0, width: "120px" }}>
              <label className="form-label">Pertemuan Ke</label>
              <input required name="number" type="number" min="1" max="16" placeholder="1-16" className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: "160px" }}>
              <label className="form-label">Tanggal</label>
              <input required name="date" type="date" className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "180px" }}>
              <label className="form-label">Topik Pembahasan</label>
              <input name="topic" placeholder="Topik materi pertemuan..." className="form-input" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: "42px" }}>
              <Plus size={16} /> Buat Sesi
            </button>
          </form>
        </div>
      )}

      {/* Sessions Table */}
      <div className="card">
        <div className="card-head">
          <h3 className="lg">Daftar Sesi Presensi</h3>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pertemuan</th>
                <th>Tanggal</th>
                <th>Topik Perkuliahan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    Belum ada sesi presensi untuk kelas ini.
                  </td>
                </tr>
              ) : (
                sessions.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>Pertemuan {item.session_number}</td>
                    <td style={{ fontSize: "12.5px" }}>{item.date}</td>
                    <td style={{ color: item.topic ? "var(--text)" : "var(--muted)" }}>{item.topic ?? "—"}</td>
                    <td>
                      <StatusBadge
                        status={item.status === "OPEN" ? "warning" : item.status === "CLOSED" ? "success" : "neutral"}
                        label={item.status}
                      />
                    </td>
                    <td>
                      {(user?.role === "ADMIN" || user?.role === "DOSEN") && item.status === "SCHEDULED" && (
                        <button className="btn btn-primary btn-sm" onClick={() => void mutate(() => attendanceApi.openSession(item.id))}>
                          Buka Sesi
                        </button>
                      )}
                      {(user?.role === "ADMIN" || user?.role === "DOSEN") && item.status === "OPEN" && (
                        <button className="btn btn-danger btn-sm" onClick={() => void mutate(() => attendanceApi.closeSession(item.id))}>
                          Tutup Sesi
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requests Pending Verification for Ketua Kelas / Mahasiswa */}
      {requests.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} color="var(--green)" /> Pengajuan Presensi Menunggu Verifikasi
            </h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Request</th>
                  <th>ID Sesi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td style={{ fontWeight: 600 }}>#{request.id}</td>
                    <td>Sesi {request.session_id}</td>
                    <td>
                      <StatusBadge status="warning" label={request.status} />
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => classId && void mutate(() => workflowApi.verifyPresence(classId, request.id))}
                      >
                        Verifikasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

