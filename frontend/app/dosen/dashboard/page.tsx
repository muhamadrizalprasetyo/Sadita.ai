"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  academicApi,
  attendanceApi,
  lmsApi,
  type AssignmentSubmission,
  type AttendanceSession,
  type CourseClass,
  type Quiz,
} from "@/lib/api";
import { EmptyState, LoadingSpinner, StatCard } from "@/components/ui";
import { BookOpen, Clock, CheckSquare, HelpCircle } from "lucide-react";

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

type PendingGrade = {
  assignmentId: number;
  assignmentTitle: string;
  className: string;
  count: number;
};

export default function DosenDashboardPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [openSessions, setOpenSessions] = useState<(AttendanceSession & { className: string })[]>([]);
  const [pendingGrades, setPendingGrades] = useState<PendingGrade[]>([]);
  const [publishedQuizzes, setPublishedQuizzes] = useState<(Quiz & { className: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(undefined);
      const classRes = await academicApi.getClasses();
      if (classRes.error) {
        setError(classRes.error);
        setLoading(false);
        return;
      }
      const classList = classRes.data ?? [];
      setClasses(classList);

      if (classList.length === 0) {
        setLoading(false);
        return;
      }

      const sessionResults = await Promise.all(
        classList.map(async (c) => {
          const s = await attendanceApi.getSessions(c.id);
          return { class: c, sessions: s.data ?? [] };
        })
      );

      const open: (AttendanceSession & { className: string })[] = [];
      sessionResults.forEach(({ class: c, sessions }) => {
        sessions
          .filter((s) => s.status === "OPEN")
          .forEach((s) => open.push({ ...s, className: c.name }));
      });
      setOpenSessions(open);

      const assignResults = await Promise.all(
        classList.map(async (c) => {
          const a = await lmsApi.getAssignments(c.id);
          return { class: c, assignments: a.data ?? [] };
        })
      );

      const pending: PendingGrade[] = [];
      for (const { class: c, assignments } of assignResults) {
        for (const a of assignments) {
          const subRes = await lmsApi.listSubmissions(a.id);
          const subs = subRes.data ?? [];
          const ungraded = subs.filter((s: AssignmentSubmission) => s.status !== "GRADED").length;
          if (ungraded > 0) {
            pending.push({
              assignmentId: a.id,
              assignmentTitle: a.title,
              className: c.name,
              count: ungraded,
            });
          }
        }
      }
      setPendingGrades(pending);

      const quizResults = await Promise.all(
        classList.map(async (c) => {
          const q = await lmsApi.getQuizzes(c.id);
          return { class: c, quizzes: q.data ?? [] };
        })
      );
      const quizzes: (Quiz & { className: string })[] = [];
      quizResults.forEach(({ class: c, quizzes: list }) => {
        list.filter((q) => q.is_published).forEach((q) => quizzes.push({ ...q, className: c.name }));
      });
      setPublishedQuizzes(quizzes);

      setLoading(false);
    }
    void load();
  }, []);

  const nextBySchedule = useMemo(() => {
    return [...classes].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    });
  }, [classes]);

  if (loading) return <LoadingSpinner text="Memuat ringkasan perkuliahan…" />;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Ringkasan kelas yang Anda ampu dan pekerjaan yang memerlukan tindakan.
          </p>
        </div>
        <Link href="/dosen/presensi" className="btn btn-primary">
          Kelola presensi
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum ada kelas diampu"
          description="Data kelas akan muncul setelah penugasan pengampu tercatat di sistem akademik."
        />
      ) : (
        <>
          <div className="stats">
            <StatCard
              label="Kelas Diampu"
              value={classes.length}
              icon={BookOpen}
              color="blue"
              subtext="Semester aktif"
            />
            <StatCard
              label="Sesi Presensi Aktif"
              value={openSessions.length}
              icon={Clock}
              color="green"
              subtext="Sedang berlangsung"
            />
            <StatCard
              label="Submission Belum Dinilai"
              value={pendingGrades.reduce((n, p) => n + p.count, 0)}
              icon={CheckSquare}
              color="orange"
              subtext="Perlu penilaian"
            />
            <StatCard
              label="Kuis Dipublikasikan"
              value={publishedQuizzes.length}
              icon={HelpCircle}
              color="purple"
              subtext="Kuis aktif mahasiswa"
            />
          </div>

          <div className="grid2">
            <section className="card">
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>Kelas & jadwal</h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kelas</th>
                      <th>Mata kuliah</th>
                      <th>Jadwal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextBySchedule.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.course ? `${c.course.code}` : "—"}</td>
                        <td style={{ fontSize: "0.8125rem" }}>
                          {DAY_NAMES[c.day_of_week]}, {c.start_time.slice(0, 5)}–{c.end_time.slice(0, 5)}
                        </td>
                        <td>
                          <Link href={`/dosen/kelas`} className="btn btn-outline btn-sm">
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card" style={{ display: "grid", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Clock size={16} /> Sesi presensi berlangsung
                </h2>
                {openSessions.length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Tidak ada sesi terbuka saat ini.</p>
                ) : (
                  <ul style={{ listStyle: "none", display: "grid", gap: "0.5rem" }}>
                    {openSessions.map((s) => (
                      <li key={s.id} style={{ fontSize: "0.8125rem" }}>
                        <strong>{s.className}</strong> — Pertemuan {s.session_number}
                        <Link href={`/dosen/presensi?class=${s.class_id}`} className="btn btn-outline btn-sm" style={{ marginLeft: "0.5rem" }}>
                          Buka
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <CheckSquare size={16} /> Penilaian tugas
                </h2>
                {pendingGrades.length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Semua submission sudah dinilai atau belum ada pengumpulan.</p>
                ) : (
                  <ul style={{ listStyle: "none", display: "grid", gap: "0.5rem" }}>
                    {pendingGrades.slice(0, 5).map((p) => (
                      <li key={p.assignmentId} style={{ fontSize: "0.8125rem" }}>
                        {p.assignmentTitle} ({p.className}) — {p.count} belum dinilai
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/dosen/tugas" className="btn btn-outline btn-sm" style={{ marginTop: "0.5rem" }}>
                  Ke halaman tugas
                </Link>
              </div>

              <div>
                <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <HelpCircle size={16} /> Kuis aktif
                </h2>
                {publishedQuizzes.length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Belum ada kuis dipublikasikan.</p>
                ) : (
                  <ul style={{ listStyle: "none", display: "grid", gap: "0.35rem", fontSize: "0.8125rem" }}>
                    {publishedQuizzes.slice(0, 4).map((q) => (
                      <li key={q.id}>
                        {q.title} — {q.className}
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/dosen/kuis" className="btn btn-outline btn-sm" style={{ marginTop: "0.5rem" }}>
                  Kelola kuis
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
