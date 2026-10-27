"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { HelpCircle, Plus, Trash2, ListChecks } from "lucide-react";
import {
  lmsApi,
  type Quiz,
  type QuizSubmission,
} from "@/lib/api";
import { ClassToolbar } from "@/components/dosen/class-toolbar";
import { useInitialClassId } from "@/components/dosen/use-class-query";
import { useLecturerClasses } from "@/components/dosen/use-lecturer-classes";
import { EmptyState, LoadingSpinner, Modal, useConfirm } from "@/components/ui";

export default function DosenKuisPage() {
  const confirm = useConfirm();
  const { classes, loading: classesLoading, error: classesError, reload } = useLecturerClasses();
  const [classId, setClassId] = useInitialClassId(classes);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [submissionsQuiz, setSubmissionsQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    passing_score: 70,
    max_attempts: 2,
    time_limit_minutes: 30,
    is_published: false,
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    points: 10,
    options: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  });

  const loadQuizzes = useCallback(async (id: number) => {
    setLoading(true);
    setError(undefined);
    const res = await lmsApi.getQuizzes(id);
    if (res.error) {
      setError(res.error);
      setQuizzes([]);
    } else {
      setQuizzes(res.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (classId) {
      void lmsApi.getQuizzes(classId).then((res) => {
        if (res.error) {
          setError(res.error);
          setQuizzes([]);
        } else {
          setQuizzes(res.data ?? []);
        }
        setLoading(false);
      });
    }
  }, [classId]);

  const handleCreateQuiz = async (e: FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    const res = await lmsApi.createQuiz({ class_id: classId, ...quizForm });
    if (res.error) {
      await confirm.alert(res.error, "Gagal Membuat Kuis", "danger");
      return;
    }
    setIsQuizModalOpen(false);
    setQuizForm({
      title: "",
      description: "",
      passing_score: 70,
      max_attempts: 2,
      time_limit_minutes: 30,
      is_published: false,
    });
    void loadQuizzes(classId);
  };

  const handleAddQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz || !classId) return;

    const detail = await lmsApi.getQuiz(selectedQuiz.id);
    const nextNumber = (detail.data?.questions?.length ?? detail.data?.question_count ?? 0) + 1;

    const qRes = await lmsApi.addQuizQuestion(selectedQuiz.id, {
      question_text: questionForm.question_text,
      points: questionForm.points,
      question_number: nextNumber,
    });

    if (!qRes.data) {
      await confirm.alert(qRes.error || "Gagal menambah pertanyaan", "Gagal Menambah Pertanyaan", "danger");
      return;
    }

    const questionId = qRes.data.id;
    for (let i = 0; i < questionForm.options.length; i++) {
      const opt = questionForm.options[i];
      if (opt.text.trim()) {
        await lmsApi.addQuizOption(questionId, {
          option_text: opt.text,
          is_correct: opt.is_correct,
          option_number: i + 1,
        });
      }
    }

    setIsQuestionModalOpen(false);
    setQuestionForm({
      question_text: "",
      points: 10,
      options: [
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    });
    void loadQuizzes(classId);
  };

  const handleDeleteQuiz = async (id: number) => {
    const ok = await confirm({
      title: "Hapus Kuis Perkuliahan",
      message: "Apakah Anda yakin ingin menghapus kuis ini? Seluruh daftar pertanyaan dan respon nilai mahasiswa akan ikut terhapus.",
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });
    if (!ok) return;
    const res = await lmsApi.deleteQuiz(id);
    if (res.error) {
      await confirm.alert(res.error, "Gagal Menghapus Kuis", "danger");
    } else if (classId) {
      void loadQuizzes(classId);
    }
  };

  const openSubmissions = async (quiz: Quiz) => {
    setSubmissionsQuiz(quiz);
    setSubmissionsLoading(true);
    const res = await lmsApi.getQuizSubmissions(quiz.id);
    setSubmissions(res.data ?? []);
    setSubmissionsLoading(false);
  };

  if (classesLoading) return <LoadingSpinner text="Memuat kelas…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kuis Online</h1>
          <p className="page-subtitle">Susun pertanyaan, publikasikan kuis, dan tinjau hasil percobaan mahasiswa.</p>
        </div>
        <button type="button" className="btn btn-primary" disabled={!classId} onClick={() => setIsQuizModalOpen(true)}>
          <Plus size={16} /> Buat kuis
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
        <LoadingSpinner text="Memuat kuis…" />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Belum ada kuis"
          description="Buat kuis untuk kelas yang dipilih, lalu tambahkan pertanyaan sebelum dipublikasikan."
          action={
            classId ? (
              <button type="button" className="btn btn-primary" onClick={() => setIsQuizModalOpen(true)}>
                Buat kuis
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
                <th>Status</th>
                <th>Soal</th>
                <th>Passing</th>
                <th>Batas waktu</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{q.title}</div>
                    {q.description && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{q.description}</div>
                    )}
                  </td>
                  <td>{q.is_published ? "Dipublikasikan" : "Draft"}</td>
                  <td>{q.question_count ?? "—"}</td>
                  <td>{q.passing_score}</td>
                  <td>{q.time_limit_minutes ? `${q.time_limit_minutes} menit` : "—"}</td>
                  <td style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setSelectedQuiz(q);
                        setIsQuestionModalOpen(true);
                      }}
                    >
                      <Plus size={14} /> Soal
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => void openSubmissions(q)}>
                      <ListChecks size={14} /> Hasil
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => void handleDeleteQuiz(q.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} title="Buat kuis">
        <form onSubmit={handleCreateQuiz} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Judul</label>
            <input required className="form-input" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Instruksi</label>
            <textarea className="form-textarea" rows={2} value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Nilai lulus</label>
              <input type="number" min={0} max={100} className="form-input" value={quizForm.passing_score} onChange={(e) => setQuizForm({ ...quizForm, passing_score: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Menit</label>
              <input type="number" min={5} max={180} className="form-input" value={quizForm.time_limit_minutes} onChange={(e) => setQuizForm({ ...quizForm, time_limit_minutes: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Max percobaan</label>
              <input type="number" min={1} max={5} className="form-input" value={quizForm.max_attempts} onChange={(e) => setQuizForm({ ...quizForm, max_attempts: Number(e.target.value) })} />
            </div>
          </div>
          <label style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", alignItems: "center" }}>
            <input type="checkbox" checked={quizForm.is_published} onChange={(e) => setQuizForm({ ...quizForm, is_published: e.target.checked })} />
            Publikasikan setelah dibuat
          </label>
          <button type="submit" className="btn btn-primary">
            Simpan
          </button>
        </form>
      </Modal>

      {selectedQuiz && (
        <Modal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} title={`Tambah soal — ${selectedQuiz.title}`}>
          <form onSubmit={handleAddQuestion} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Pertanyaan</label>
              <textarea required rows={3} className="form-textarea" value={questionForm.question_text} onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Poin</label>
              <input type="number" min={1} max={100} className="form-input" value={questionForm.points} onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })} />
            </div>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <label className="form-label">Pilihan (tandai jawaban benar)</label>
              {questionForm.options.map((opt, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="correct_option"
                    checked={opt.is_correct}
                    onChange={() => {
                      const newOpts = questionForm.options.map((o, i) => ({ ...o, is_correct: i === idx }));
                      setQuestionForm({ ...questionForm, options: newOpts });
                    }}
                  />
                  <input
                    required
                    className="form-input"
                    placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                    value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...questionForm.options];
                      newOpts[idx].text = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOpts });
                    }}
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-primary">
              Simpan pertanyaan
            </button>
          </form>
        </Modal>
      )}

      {submissionsQuiz && (
        <Modal isOpen onClose={() => setSubmissionsQuiz(null)} title={`Hasil kuis — ${submissionsQuiz.title}`}>
          {submissionsLoading ? (
            <LoadingSpinner text="Memuat percobaan…" />
          ) : submissions.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Belum ada mahasiswa mengerjakan kuis ini.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mahasiswa</th>
                    <th>Percobaan</th>
                    <th>Skor</th>
                    <th>Lulus</th>
                    <th>Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.student_id}</td>
                      <td>{s.attempt_number}</td>
                      <td>{s.score}</td>
                      <td>{s.passed ? "Ya" : "Tidak"}</td>
                      <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleString("id-ID") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
