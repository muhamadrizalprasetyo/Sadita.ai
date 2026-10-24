"use client";

import { useEffect, useState } from "react";
import {
  academicApi,
  authApi,
  lmsApi,
  uploadApi,
  getFileUrl,
  type Assignment,
  type AssignmentSubmission,
  type CourseClass,
  type User,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/ui";
import { Upload, CheckCircle, Clock, AlertCircle, FileText } from "lucide-react";

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function SubmissionBadge({ sub }: { sub: AssignmentSubmission | null | undefined }) {
  if (!sub) return <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Belum dikumpulkan</span>;
  if (sub.status === "GRADED")
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#10B981", fontWeight: 700, fontSize: "0.82rem" }}>
        <CheckCircle size={13} /> Dinilai ({sub.score ?? "—"})
      </span>
    );
  if (sub.status === "LATE")
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#F59E0B", fontWeight: 700, fontSize: "0.82rem" }}>
        <Clock size={13} /> Terlambat
      </span>
    );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#60A5FA", fontWeight: 700, fontSize: "0.82rem" }}>
      <CheckCircle size={13} /> Dikumpulkan
    </span>
  );
}

export default function MahasiswaTugasPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<number, AssignmentSubmission | null>>({});
  const [loading, setLoading] = useState(true);
  const [assLoading, setAssLoading] = useState(false);

  // Submission modal state
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const [meRes, classRes] = await Promise.all([authApi.getMe(), academicApi.getClasses()]);
      if (meRes.data) setUser(meRes.data);
      const classList = classRes.data ?? [];
      setClasses(classList);
      if (classList.length > 0) setSelectedClass(classList[0].id);
      setLoading(false);
    }
    void init();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setAssLoading(true);
    void lmsApi.getAssignments(selectedClass).then(async (r) => {
      const list = r.data ?? [];
      setAssignments(list);

      // Fetch submission status for each assignment
      const subMap: Record<number, AssignmentSubmission | null> = {};
      await Promise.all(
        list.map(async (a) => {
          const res = await lmsApi.getMySubmission(a.id);
          subMap[a.id] = res.data ?? null;
        })
      );
      setSubmissions(subMap);
      setAssLoading(false);
    });
  }, [selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTarget || !submitFile) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const uploadRes = await uploadApi.upload(submitFile);
    if (!uploadRes.data?.file_url) {
      setSubmitting(false);
      setSubmitError(uploadRes.error ?? "Gagal mengunggah berkas.");
      return;
    }

    const res = await lmsApi.submitAssignment(submitTarget.id, {
      file_url: uploadRes.data.file_url,
      content: submitNotes.trim() || undefined,
    });

    setSubmitting(false);
    if (res.data) {
      setSubmitSuccess("Tugas berhasil dikumpulkan!");
      setSubmissions((prev) => ({ ...prev, [submitTarget.id]: res.data! }));
      setTimeout(() => {
        setSubmitTarget(null);
        setSubmitFile(null);
        setSubmitNotes("");
        setSubmitSuccess(null);
      }, 1800);
    } else {
      setSubmitError(res.error ?? "Gagal mengumpulkan tugas.");
    }
  };

  if (loading) return <LoadingSpinner text="Memuat tugas mahasiswa..." />;

  const now = new Date();
  const pending = assignments.filter((a) => !submissions[a.id]);
  const done = assignments.filter((a) => !!submissions[a.id]);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tugas Saya</h1>
          <p className="page-subtitle">
            Daftar tugas dari dosen dan status pengumpulan berkas PDF Anda
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))" }}>
        <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>{assignments.length}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Total Tugas</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#F59E0B" }}>{pending.length}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Belum Dikumpulkan</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10B981" }}>{done.length}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Sudah Dikumpulkan</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#A78BFA" }}>
            {Object.values(submissions).filter((s) => s?.status === "GRADED").length}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Sudah Dinilai</div>
        </div>
      </div>

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
              {c.course?.credits ? ` (${c.course.credits} SKS)` : ""} — {DAY_NAMES[c.day_of_week]}
            </option>
          ))}
        </select>
      </div>

      {/* Assignments Table */}
      {assLoading ? (
        <LoadingSpinner text="Memuat tugas..." />
      ) : assignments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
          <FileText size={40} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
          <p>Belum ada tugas untuk mata kuliah ini.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Judul Tugas</th>
                <th>Deadline</th>
                <th>Skor Maks</th>
                <th>Status</th>
                <th>Nilai</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const sub = submissions[a.id];
                const isPast = new Date(a.due_date) < now;
                const isLate = isPast && !sub;
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>
                      {a.title}
                      {a.description && (
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0.2rem 0 0 0", fontWeight: 400 }}>
                          {a.description.slice(0, 80)}{a.description.length > 80 ? "…" : ""}
                        </p>
                      )}
                    </td>
                    <td>
                      <span style={{ color: isPast ? (isLate ? "#EF4444" : "var(--text-secondary)") : "var(--text-primary)", fontWeight: isPast && isLate ? 700 : 400, fontSize: "0.85rem" }}>
                        {new Date(a.due_date).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {isLate && " ⚠ Lewat"}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">{a.max_score} Poin</span>
                    </td>
                    <td>
                      <SubmissionBadge sub={sub} />
                    </td>
                    <td style={{ fontWeight: 700, color: "#A78BFA" }}>
                      {sub?.score != null ? `${sub.score} / ${a.max_score}` : "—"}
                    </td>
                    <td>
                      {sub ? (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                          {sub.file_url && (
                            <a href={getFileUrl(sub.file_url)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                              Lihat PDF
                            </a>
                          )}
                          {sub.feedback && (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                              Feedback: {sub.feedback.slice(0, 40)}{sub.feedback.length > 40 ? "…" : ""}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSubmitTarget(a);
                            setSubmitFile(null);
                            setSubmitNotes("");
                            setSubmitSuccess(null);
                            setSubmitError(null);
                          }}
                          disabled={isPast && !a.allow_late}
                          title={isPast && !a.allow_late ? "Batas waktu telah lewat dan tugas tidak menerima keterlambatan" : ""}
                        >
                          <Upload size={13} /> Kirim PDF
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Submission Modal */}
      {submitTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", display: "grid", placeItems: "center", zIndex: 9999, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: "34rem", width: "100%", padding: "1.75rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.4rem" }}>
              Kumpulkan Tugas — {submitTarget.title}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Deadline: {new Date(submitTarget.due_date).toLocaleString("id-ID")} • Skor Maks: {submitTarget.max_score}
            </p>

            {submitSuccess && (
              <div style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "0.5rem", padding: "0.75rem", color: "#10B981", fontWeight: 600, fontSize: "0.875rem", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <CheckCircle size={16} /> {submitSuccess}
              </div>
            )}
            {submitError && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.5rem", padding: "0.75rem", color: "#EF4444", fontWeight: 600, fontSize: "0.875rem", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <AlertCircle size={16} /> {submitError}
              </div>
            )}

            {submitTarget.description && (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", padding: "0.85rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                <strong style={{ color: "var(--primary-light)" }}>Instruksi Tugas:</strong>
                <p style={{ margin: "0.4rem 0 0", color: "var(--text-secondary)" }}>{submitTarget.description}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.1rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Berkas Jawaban (PDF) <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  required
                  type="file"
                  accept=".pdf,application/pdf"
                  className="form-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && !f.name.toLowerCase().endsWith(".pdf")) {
                      alert("Berkas harus berformat PDF!");
                      e.target.value = "";
                      setSubmitFile(null);
                      return;
                    }
                    setSubmitFile(f);
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
                  Hanya format <strong>.PDF</strong> yang diterima. Ukuran maks 50 MB.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Tambahan (opsional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Tuliskan keterangan singkat bila diperlukan..."
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSubmitTarget(null)} disabled={submitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !submitFile}>
                  {submitting ? "Mengunggah & Mengirim…" : "Kirimkan Tugas (PDF)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
