"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useInitialClassId } from "@/components/dosen/use-class-query";
import { CheckCircle, Plus, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import {
  academicApi,
  attendanceApi,
  workflowApi,
  type AttendanceRecord,
  type AttendanceRequest,
  type AttendanceSession,
  type AttendanceStatus,
} from "@/lib/api";
import { ClassToolbar } from "@/components/dosen/class-toolbar";
import { useLecturerClasses } from "@/components/dosen/use-lecturer-classes";
import { EmptyState, LoadingSpinner, Modal } from "@/components/ui";

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function sessionStatusLabel(status: AttendanceSession["status"]): string {
  if (status === "OPEN") return "Berlangsung";
  if (status === "CLOSED") return "Ditutup";
  return "Terjadwal";
}

function sessionStatusClass(status: AttendanceSession["status"]): string {
  if (status === "OPEN") return "text-status-open";
  if (status === "CLOSED") return "text-status-closed";
  return "text-status-scheduled";
}

export function DosenAttendanceWorkspace() {
  const { classes, loading: classesLoading, error: classesError, reload: reloadClasses } = useLecturerClasses();
  const [classId, setClassId] = useInitialClassId(classes);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string>();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string }>();

  const [pendingRequests, setPendingRequests] = useState<AttendanceRequest[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<number, { name: string; nim: string }>>({});
  const [rejectingTarget, setRejectingTarget] = useState<AttendanceRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [detailSession, setDetailSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    session_number: 1,
    date: new Date().toISOString().slice(0, 10),
    topic: "",
  });

  const openCreateModal = () => {
    const nextNum =
      sessions.length > 0
        ? Math.min(16, Math.max(...sessions.map((s) => s.session_number)) + 1)
        : 1;
    setCreateForm({
      session_number: nextNum,
      date: new Date().toISOString().slice(0, 10),
      topic: "",
    });
    setCreateOpen(true);
  };

  const [manualTarget, setManualTarget] = useState<{
    sessionId: number;
    studentId: number;
    status: AttendanceStatus;
    notes: string;
  } | null>(null);

  const activeSession = useMemo(() => sessions.find((s) => s.status === "OPEN"), [sessions]);

  const loadRequests = useCallback(async (id: number) => {
    const [pRes, sRes] = await Promise.all([
      workflowApi.pendingPresence(id),
      academicApi.getClassStudents(id),
    ]);
    setPendingRequests(pRes.data ?? []);
    const map: Record<number, { name: string; nim: string }> = {};
    for (const enr of sRes.data ?? []) {
      map[enr.student_id] = {
        name: enr.student?.full_name ?? "—",
        nim: enr.student?.nim ?? String(enr.student_id),
      };
    }
    setStudentsMap(map);
  }, []);

  const loadSessions = useCallback(async (id: number) => {
    setSessionsLoading(true);
    setSessionsError(undefined);
    const res = await attendanceApi.getSessions(id);
    if (res.error) {
      setSessionsError(res.error);
      setSessions([]);
    } else {
      setSessions(res.data ?? []);
    }
    setSessionsLoading(false);
    void loadRequests(id);
  }, [loadRequests]);

  useEffect(() => {
    if (classId) void loadSessions(classId);
  }, [classId, loadSessions]);

  const openDetail = async (session: AttendanceSession) => {
    setDetailSession(session);
    setRecordsLoading(true);
    const res = await attendanceApi.getSessionRecords(session.id);
    setRecords(res.data ?? []);
    setRecordsLoading(false);
  };

  const runMutation = async (action: () => Promise<{ error?: string }>, successText: string) => {
    setFeedback(undefined);
    const result = await action();
    if (result.error) {
      setFeedback({ type: "error", text: result.error });
    } else {
      setFeedback({ type: "success", text: successText });
      if (classId) await loadSessions(classId);
      if (detailSession) {
        const res = await attendanceApi.getSessionRecords(detailSession.id);
        setRecords(res.data ?? []);
      }
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    await runMutation(
      () =>
        attendanceApi.createSession({
          class_id: classId,
          session_number: createForm.session_number,
          date: createForm.date,
          topic: createForm.topic || undefined,
        }),
      "Sesi pertemuan berhasil dibuat."
    );
    setCreateOpen(false);
  };

  const handleManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualTarget) return;
    await runMutation(
      () =>
        attendanceApi.manualUpdate(manualTarget.sessionId, {
          student_id: manualTarget.studentId,
          status: manualTarget.status,
          notes: manualTarget.notes || undefined,
        }),
      "Kehadiran diperbarui."
    );
    setManualTarget(null);
  };

  const handleApprove = async (requestId: number) => {
    if (!classId) return;
    await runMutation(
      () => workflowApi.approve(requestId),
      "Kehadiran online disetujui dan tercatat HADIR."
    );
    void loadRequests(classId);
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectingTarget || !classId) return;
    await runMutation(
      () => workflowApi.reject(rejectingTarget.id, rejectReason || "Ditolak dosen pengampu"),
      "Pengajuan kehadiran online ditolak."
    );
    setRejectingTarget(null);
    setRejectReason("");
    void loadRequests(classId);
  };

  if (classesLoading) return <LoadingSpinner text="Memuat data kelas…" />;

  const selectedClass = classes.find((c) => c.id === classId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sesi Presensi</h1>
          <p className="page-subtitle">
            Kelola pertemuan, buka dan tutup sesi presensi, serta pantau kehadiran mahasiswa terdaftar.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!classId}
          onClick={openCreateModal}
        >
          <Plus size={16} /> Buat pertemuan
        </button>
      </div>

      {classesError && (
        <div className="alert alert-error">
          {classesError}{" "}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void reloadClasses()}>
            Coba lagi
          </button>
        </div>
      )}

      <ClassToolbar classes={classes} selectedId={classId} onChange={setClassId} />

      {selectedClass && (
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Jadwal: {DAY_NAMES[selectedClass.day_of_week] ?? "—"},{" "}
          {selectedClass.start_time.slice(0, 5)}–{selectedClass.end_time.slice(0, 5)}
          {selectedClass.term?.name ? ` · ${selectedClass.term.name}` : ""}
        </p>
      )}

      {activeSession && (
        <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            Sesi aktif: Pertemuan {activeSession.session_number}
            {activeSession.topic ? ` — ${activeSession.topic}` : ""}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void openDetail(activeSession)}
          >
            Lihat daftar hadir
          </button>
        </div>
      )}

      {feedback && (
        <div className={`alert alert-${feedback.type === "error" ? "error" : "success"}`}>{feedback.text}</div>
      )}

      {pendingRequests.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid rgba(37, 99, 235, 0.3)", background: "rgba(37, 99, 235, 0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <ShieldCheck size={20} color="var(--primary, #2563eb)" />
              <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Pengajuan Kehadiran Online ({pendingRequests.length})</h3>
            </div>
            <span className="badge badge-info">Perlu Persetujuan Dosen</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mahasiswa</th>
                  <th>Waktu Pengajuan</th>
                  <th>Status Verifikasi</th>
                  <th>Aksi Dosen</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => {
                  const stu = studentsMap[req.student_id];
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
                        <span className={`badge badge-${req.status === "VERIFIED" ? "success" : "warning"}`}>
                          {req.status === "VERIFIED" ? "Diverifikasi Ketua Kelas" : "Menunggu Verifikasi"}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void handleApprove(req.id)}
                        >
                          <CheckCircle size={14} /> Setujui Hadir
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ color: "var(--error, #ef4444)" }}
                          onClick={() => setRejectingTarget(req)}
                        >
                          <XCircle size={14} /> Tolak
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sessionsLoading ? (
        <LoadingSpinner text="Memuat sesi…" />
      ) : sessionsError ? (
        <div className="alert alert-error">{sessionsError}</div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Belum ada sesi pertemuan"
          description="Buat pertemuan untuk kelas ini, lalu buka sesi presensi saat perkuliahan berlangsung."
          action={
            classId ? (
              <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                Buat pertemuan pertama
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pertemuan</th>
                <th>Tanggal</th>
                <th>Topik</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.session_number}</td>
                  <td>{item.date}</td>
                  <td>{item.topic ?? "—"}</td>
                  <td>
                    <span className={sessionStatusClass(item.status)}>{sessionStatusLabel(item.status)}</span>
                  </td>
                  <td style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => void openDetail(item)}>
                      Kehadiran
                    </button>
                    {item.status === "SCHEDULED" && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => void runMutation(() => attendanceApi.openSession(item.id), "Sesi dibuka.")}
                      >
                        Buka sesi
                      </button>
                    )}
                    {item.status === "OPEN" && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => void runMutation(() => attendanceApi.closeSession(item.id), "Sesi ditutup.")}
                      >
                        Tutup sesi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Buat pertemuan baru">
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Nomor pertemuan</label>
            <input
              required
              type="number"
              min={1}
              max={16}
              className="form-input"
              value={createForm.session_number}
              onChange={(e) => setCreateForm({ ...createForm, session_number: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input
              required
              type="date"
              className="form-input"
              value={createForm.date}
              onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Topik (opsional)</label>
            <input
              className="form-input"
              value={createForm.topic}
              onChange={(e) => setCreateForm({ ...createForm, topic: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Simpan
          </button>
        </form>
      </Modal>

      {detailSession && (
        <Modal
          isOpen={!!detailSession}
          onClose={() => setDetailSession(null)}
          title={`Kehadiran — Pertemuan ${detailSession.session_number}`}
        >
          {recordsLoading ? (
            <LoadingSpinner text="Memuat catatan…" />
          ) : records.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Belum ada catatan kehadiran. Presensi RFID atau koreksi manual akan muncul di sini.
            </p>
          ) : (
            <div className="table-container" style={{ maxHeight: "20rem", overflowY: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>NPM</th>
                    <th>Status</th>
                    <th>Waktu</th>
                    <th>Metode</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.student?.full_name ?? "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{r.student?.nim ?? r.student_id}</td>
                      <td>{r.status}</td>
                      <td>{r.check_in_time ? new Date(r.check_in_time).toLocaleString("id-ID") : "—"}</td>
                      <td>{r.method ?? "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            setManualTarget({
                              sessionId: detailSession.id,
                              studentId: r.student_id,
                              status: r.status,
                              notes: r.notes ?? "",
                            })
                          }
                        >
                          Koreksi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void openDetail(detailSession)}>
              <RefreshCw size={14} /> Muat ulang
            </button>
          </div>
        </Modal>
      )}

      {manualTarget && (
        <Modal isOpen title="Koreksi kehadiran manual" onClose={() => setManualTarget(null)}>
          <form onSubmit={handleManual} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={manualTarget.status}
                onChange={(e) =>
                  setManualTarget({ ...manualTarget, status: e.target.value as AttendanceStatus })
                }
              >
                <option value="HADIR">Hadir</option>
                <option value="TERLAMBAT">Terlambat</option>
                <option value="IZIN">Izin</option>
                <option value="SAKIT">Sakit</option>
                <option value="ALFA">Alfa</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Catatan</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={manualTarget.notes}
                onChange={(e) => setManualTarget({ ...manualTarget, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Simpan koreksi
            </button>
          </form>
        </Modal>
      )}

      {rejectingTarget && (
        <Modal
          isOpen
          title="Tolak Pengajuan Kehadiran Online"
          onClose={() => {
            setRejectingTarget(null);
            setRejectReason("");
          }}
        >
          <form onSubmit={handleReject} style={{ display: "grid", gap: "1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Mahasiswa: <strong>{studentsMap[rejectingTarget.student_id]?.name ?? rejectingTarget.student_id}</strong> (
              {studentsMap[rejectingTarget.student_id]?.nim ?? ""})
            </p>
            <div className="form-group">
              <label className="form-label">Alasan Penolakan</label>
              <textarea
                required
                className="form-textarea"
                rows={3}
                placeholder="Contoh: Tidak hadir di sesi Google Meet perkuliahan online"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setRejectingTarget(null);
                  setRejectReason("");
                }}
              >
                Batal
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: "var(--error, #ef4444)", borderColor: "var(--error, #ef4444)" }}>
                Tolak Pengajuan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
