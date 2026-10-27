"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useInitialClassId } from "@/components/dosen/use-class-query";
import { Plus, Trash2, CheckSquare, ClipboardList } from "lucide-react";
import {
  lmsApi,
  getFileUrl,
  type Assignment,
  type AssignmentSubmission,
} from "@/lib/api";
import { ClassToolbar } from "@/components/dosen/class-toolbar";
import { useLecturerClasses } from "@/components/dosen/use-lecturer-classes";
import { EmptyState, LoadingSpinner, Modal, useConfirm } from "@/components/ui";

export function DosenAssignmentsPage() {
  const confirm = useConfirm();
  const { classes, loading: classesLoading, error: classesError, reload } = useLecturerClasses();
  const [classId, setClassId] = useInitialClassId(classes);
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    max_score: 100,
    allow_late: false,
  });

  const [gradeTarget, setGradeTarget] = useState<AssignmentSubmission | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: 0, feedback: "" });
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  const loadAssignments = useCallback(async (id: number) => {
    setLoading(true);
    setError(undefined);
    const res = await lmsApi.getAssignments(id);
    if (res.error) {
      setError(res.error);
      setItems([]);
    } else {
      setItems(res.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (classId) {
      void lmsApi.getAssignments(classId).then((res) => {
        if (res.error) {
          setError(res.error);
          setItems([]);
        } else {
          setItems(res.data ?? []);
        }
        setLoading(false);
      });
    }
  }, [classId]);

  const openSubmissions = async (assignment: Assignment) => {
    setActiveAssignment(assignment);
    setSubmissionsLoading(true);
    const res = await lmsApi.listSubmissions(assignment.id);
    setSubmissions(res.data ?? []);
    setSubmissionsLoading(false);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    const due = form.due_date.includes("T") ? form.due_date : `${form.due_date}T23:59:00`;
    const res = await lmsApi.createAssignment({
      class_id: classId,
      title: form.title,
      description: form.description || undefined,
      due_date: due,
      max_score: form.max_score,
      allow_late: form.allow_late,
      is_published: true,
    });
    if (res.error) {
      await confirm.alert(res.error, "Gagal Membuat Tugas", "danger");
      return;
    }
    setCreateOpen(false);
    setForm({ title: "", description: "", due_date: "", max_score: 100, allow_late: false });
    void loadAssignments(classId);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Hapus Tugas Perkuliahan",
      message: "Apakah Anda yakin ingin menghapus tugas ini? Seluruh data pengumpulan mahasiswa akan ikut terhapus.",
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });
    if (!ok) return;
    const res = await lmsApi.deleteAssignment(id);
    if (res.error) {
      await confirm.alert(res.error, "Gagal Menghapus Tugas", "danger");
    } else if (classId) {
      void loadAssignments(classId);
    }
  };

  const handleGrade = async (e: FormEvent) => {
    e.preventDefault();
    if (!gradeTarget) return;
    const res = await lmsApi.gradeSubmission(gradeTarget.id, {
      score: gradeForm.score,
      feedback: gradeForm.feedback || undefined,
    });
    if (res.error) {
      await confirm.alert(res.error, "Gagal Memberi Nilai", "danger");
      return;
    }
    setGradeTarget(null);
    if (activeAssignment) void openSubmissions(activeAssignment);
  };

  if (classesLoading) return <LoadingSpinner text="Memuat kelas…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tugas & Penilaian</h1>
          <p className="page-subtitle">Buat penugasan, pantau pengumpulan, dan berikan nilai serta umpan balik.</p>
        </div>
        <button type="button" className="btn btn-primary" disabled={!classId} onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Buat tugas
        </button>
      </div>

      {classesError && (
        <div className="alert alert-error">
          {classesError}{" "}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void reload()}>
            Coba lagi
          </button>
        </div>
      )}

      <ClassToolbar classes={classes} selectedId={classId} onChange={setClassId} />
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <LoadingSpinner text="Memuat tugas…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Belum ada tugas"
          description="Buat tugas untuk kelas yang dipilih."
          action={
            classId ? (
              <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
                Buat tugas
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Tenggat</th>
                <th>Skor maks.</th>
                <th>Pengumpulan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.title}</td>
                  <td>{a.due_date.slice(0, 16).replace("T", " ")}</td>
                  <td>{a.max_score}</td>
                  <td>{a.submission_count ?? "—"}</td>
                  <td style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => void openSubmissions(a)}>
                      <ClipboardList size={14} /> Submission
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => void handleDelete(a.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Buat tugas">
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Judul</label>
            <input required className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Instruksi</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Tenggat</label>
              <input required type="datetime-local" className="form-input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Skor maksimum</label>
              <input type="number" min={1} max={1000} className="form-input" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: Number(e.target.value) })} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <input type="checkbox" checked={form.allow_late} onChange={(e) => setForm({ ...form, allow_late: e.target.checked })} />
            Izinkan pengumpulan terlambat
          </label>
          <button type="submit" className="btn btn-primary">
            Simpan
          </button>
        </form>
      </Modal>

      {activeAssignment && (
        <Modal
          isOpen
          onClose={() => {
            setActiveAssignment(null);
            setSubmissions([]);
          }}
          title={`Submission — ${activeAssignment.title}`}
        >
          {submissionsLoading ? (
            <LoadingSpinner text="Memuat submission…" />
          ) : submissions.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Belum ada mahasiswa yang mengumpulkan.</p>
          ) : (
            <div className="table-container" style={{ maxHeight: "18rem", overflowY: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>NPM / NIM</th>
                    <th>Waktu</th>
                    <th>File PDF</th>
                    <th>Status</th>
                    <th>Nilai</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.student?.full_name ?? "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{s.student?.nim ?? s.student_id}</td>
                      <td>{new Date(s.submitted_at).toLocaleString("id-ID")}</td>
                      <td>
                        {s.file_url ? (
                          <a
                            href={getFileUrl(s.file_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                          >
                            Lihat PDF
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>—</span>
                        )}
                      </td>
                      <td>{s.status}</td>
                      <td>{s.score ?? "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setGradeTarget(s);
                            setGradeForm({ score: s.score ?? 0, feedback: s.feedback ?? "" });
                          }}
                        >
                          Nilai
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {gradeTarget && (
        <Modal isOpen title={`Penilaian — ${gradeTarget.student?.nim ?? gradeTarget.student_id}`} onClose={() => setGradeTarget(null)}>
          <form onSubmit={handleGrade} style={{ display: "grid", gap: "1rem" }}>
            {gradeTarget.content && (
              <div style={{ fontSize: "0.875rem", background: "#f8fafc", padding: "0.75rem", borderRadius: "0.375rem" }}>
                {gradeTarget.content}
              </div>
            )}
            {gradeTarget.file_url && (
              <a href={getFileUrl(gradeTarget.file_url)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                Buka lampiran
              </a>
            )}
            <div className="form-group">
              <label className="form-label">Skor</label>
              <input
                required
                type="number"
                min={0}
                max={activeAssignment?.max_score ?? 100}
                className="form-input"
                value={gradeForm.score}
                onChange={(e) => setGradeForm({ ...gradeForm, score: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Umpan balik</label>
              <textarea className="form-textarea" rows={3} value={gradeForm.feedback} onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">
              Simpan nilai
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
