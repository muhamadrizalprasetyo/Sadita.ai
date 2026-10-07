"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { academicApi, attendanceApi, authApi, workflowApi, type AttendanceRequest, type AttendanceSession, type CourseClass, type User } from "@/lib/api";

export function AttendanceWorkspace() {
  const [user, setUser] = useState<User>();
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [classId, setClassId] = useState<number>();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [message, setMessage] = useState<string>(); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(true);
  const active = useMemo(() => sessions.find((item) => item.status === "OPEN"), [sessions]);
  async function load() {
    setLoading(true); setError(undefined);
    const [me, classResult] = await Promise.all([authApi.getMe(), academicApi.getClasses()]);
    if (!me.data || !classResult.data) { setError(me.error ?? classResult.error ?? "Data tidak dapat dimuat."); setLoading(false); return; }
    setUser(me.data); setClasses(classResult.data); const chosen = classId ?? classResult.data[0]?.id; setClassId(chosen);
    if (chosen) await loadClass(chosen, me.data);
    setLoading(false);
  }
  async function loadClass(id: number, current = user) {
    const sessionResult = await attendanceApi.getSessions(id); if (!sessionResult.data) { setError(sessionResult.error); return; }
    setSessions(sessionResult.data);
    if (current?.role === "MAHASISWA") { const pending = await workflowApi.pendingPresence(id); setRequests(pending.data ?? []); }
  }
  // Initial API bootstrap.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);
  async function mutate(action: () => Promise<{ error?: string }>) { setMessage(undefined); setError(undefined); const result = await action(); if (result.error) setError(result.error); else { setMessage("Perubahan tersimpan."); if (classId) await loadClass(classId); } }
  async function create(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); await mutate(() => attendanceApi.createSession({ class_id: classId!, session_number: Number(fd.get("number")), date: String(fd.get("date")), topic: String(fd.get("topic") || "") })); e.currentTarget.reset(); }
  if (loading) return <p className="empty">Memuat presensi…</p>;
  return <section className="workspace"><div className="toolbar"><label>Kelas <select value={classId ?? ""} onChange={(e) => { const id = Number(e.target.value); setClassId(id); void loadClass(id); }}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>{error && <p className="error">{error}</p>}{message && <p className="success">{message}</p>}
    {(user?.role === "ADMIN" || user?.role === "DOSEN") && classId ? <form className="inline-form" onSubmit={create}><input required name="number" type="number" min="1" max="16" placeholder="Pertemuan"/><input required name="date" type="date"/><input name="topic" placeholder="Topik"/><button>Buat sesi</button></form> : null}
    {active && user?.role === "MAHASISWA" ? <button onClick={() => void mutate(() => workflowApi.submitAttendance(active.id))}>Saya Hadir — Pertemuan {active.session_number}</button> : null}
    <table><thead><tr><th>Pertemuan</th><th>Tanggal</th><th>Topik</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{sessions.map((item) => <tr key={item.id}><td>{item.session_number}</td><td>{item.date}</td><td>{item.topic ?? "—"}</td><td>{item.status}</td><td>{(user?.role === "ADMIN" || user?.role === "DOSEN") && item.status === "SCHEDULED" ? <button onClick={() => void mutate(() => attendanceApi.openSession(item.id))}>Buka</button> : null}{(user?.role === "ADMIN" || user?.role === "DOSEN") && item.status === "OPEN" ? <button onClick={() => void mutate(() => attendanceApi.closeSession(item.id))}>Tutup</button> : null}</td></tr>)}</tbody></table>
    {user?.role === "MAHASISWA" && requests.length > 0 ? <><h2>Pengajuan menunggu verifikasi</h2><table><thead><tr><th>Request</th><th>Sesi</th><th>Status</th><th>Aksi ketua</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td>{request.id}</td><td>{request.session_id}</td><td>{request.status}</td><td><button onClick={() => classId && void mutate(() => workflowApi.verifyPresence(classId, request.id))}>Verifikasi</button></td></tr>)}</tbody></table></> : null}
  </section>;
}
