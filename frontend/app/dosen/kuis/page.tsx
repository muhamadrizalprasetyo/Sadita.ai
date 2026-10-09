"use client";

import { useEffect, useState } from "react";
import { 
  HelpCircle, 
  Plus, 
  Trash2, 
  Clock, 
  Award, 
  CheckCircle, 
  Users,
  Check,
  ChevronDown
} from "lucide-react";
import { academicApi, lmsApi, CourseClass, Quiz, QuizQuestion, QuizSubmission } from "@/lib/api";
import { LoadingSpinner, EmptyState, Modal, StatusBadge } from "@/components/ui";

export default function DosenKuisPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number>();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Forms
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    passing_score: 70,
    max_attempts: 2,
    time_limit_minutes: 30,
    is_published: true,
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

  const loadQuizzes = async (classId: number) => {
    const res = await lmsApi.getQuizzes(classId);
    if (res.data) setQuizzes(res.data);
  };

  useEffect(() => {
    void academicApi.getClasses().then(r => {
      setClasses(r.data ?? []);
      if (r.data && r.data.length > 0) {
        setSelectedClass(r.data[0].id);
        void loadQuizzes(r.data[0].id);
      }
      setLoading(false);
    });
  }, []);

  const handleClassChange = (classId: number) => {
    setSelectedClass(classId);
    void loadQuizzes(classId);
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    const res = await lmsApi.createQuiz({
      class_id: selectedClass,
      ...quizForm,
    });

    if (res.data) {
      setIsQuizModalOpen(false);
      setQuizForm({ title: "", description: "", passing_score: 70, max_attempts: 2, time_limit_minutes: 30, is_published: true });
      loadQuizzes(selectedClass);
    } else {
      alert(res.error || "Gagal membuat kuis");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) return;

    // 1. Create question
    const qRes = await lmsApi.addQuizQuestion(selectedQuiz.id, {
      question_text: questionForm.question_text,
      points: questionForm.points,
      question_number: 1,
    });

    if (!qRes.data) {
      alert(qRes.error || "Gagal membuat pertanyaan");
      return;
    }

    const questionId = qRes.data.id;

    // 2. Add options
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
    alert("Pertanyaan berhasil ditambahkan ke kuis!");
    if (selectedClass) loadQuizzes(selectedClass);
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!confirm("Hapus kuis ini?")) return;
    await lmsApi.deleteQuiz(id);
    if (selectedClass) loadQuizzes(selectedClass);
  };

  if (loading) return <LoadingSpinner text="Memuat kuis online..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Kuis Online</h1>
          <p className="page-subtitle">Evaluasi pemahaman mahasiswa dengan penilaian otomatis</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsQuizModalOpen(true)}>
          <Plus size={16} /> Buat Kuis Baru
        </button>
      </div>

      {/* Class Selector */}
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Pilih Kelas Perkuliahan:</label>
        <select
          className="form-select"
          style={{ maxWidth: "20rem" }}
          value={selectedClass ?? ""}
          onChange={e => handleClassChange(Number(e.target.value))}
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.course?.name})</option>)}
        </select>
      </div>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Belum Ada Kuis Terdaftar"
          description="Buat kuis pertama untuk menguji pemahaman materi pertemuan mahasiswa."
          action={
            <button className="btn btn-primary" onClick={() => setIsQuizModalOpen(true)}>
              <Plus size={16} /> Buat Kuis
            </button>
          }
        />
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {quizzes.map(q => (
            <div key={q.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{q.title}</h3>
                  <StatusBadge status={q.is_published ? "success" : "neutral"} label={q.is_published ? "Dipublikasikan" : "Draft"} />
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {q.description || "Tidak ada deskripsi."}
                </p>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>Passing Score: <strong style={{ color: "var(--text-primary)" }}>{q.passing_score}</strong></span>
                  <span>Batas Waktu: <strong style={{ color: "var(--text-primary)" }}>{q.time_limit_minutes || 30} Menit</strong></span>
                  <span>Max Percobaan: <strong style={{ color: "var(--text-primary)" }}>{q.max_attempts}x</strong></span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedQuiz(q);
                    setIsQuestionModalOpen(true);
                  }}
                >
                  <Plus size={14} /> Tambah Soal
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteQuiz(q.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat Kuis */}
      <Modal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} title="Buat Kuis Baru">
        <form onSubmit={handleCreateQuiz} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Judul Kuis</label>
            <input required placeholder="Kuis 1: Pengenalan IoT & RFID" className="form-input" value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea rows={2} className="form-textarea" placeholder="Instruksi dan cakupan materi kuis..." value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Passing Score</label>
              <input type="number" min="0" max="100" className="form-input" value={quizForm.passing_score} onChange={e => setQuizForm({ ...quizForm, passing_score: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Waktu (Menit)</label>
              <input type="number" min="5" max="180" className="form-input" value={quizForm.time_limit_minutes} onChange={e => setQuizForm({ ...quizForm, time_limit_minutes: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Percobaan</label>
              <input type="number" min="1" max="5" className="form-input" value={quizForm.max_attempts} onChange={e => setQuizForm({ ...quizForm, max_attempts: Number(e.target.value) })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Simpan Kuis</button>
        </form>
      </Modal>

      {/* Modal Tambah Soal */}
      {selectedQuiz && (
        <Modal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} title={`Tambah Soal ke ${selectedQuiz.title}`}>
          <form onSubmit={handleAddQuestion} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Pertanyaan</label>
              <textarea required rows={3} placeholder="Tuliskan pertanyaan kuis..." className="form-textarea" value={questionForm.question_text} onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Poin Soal</label>
              <input type="number" min="1" max="100" className="form-input" value={questionForm.points} onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })} />
            </div>

            <div style={{ display: "grid", gap: "0.6rem" }}>
              <label className="form-label">Pilihan Jawaban (Tandai yang Benar):</label>
              {questionForm.options.map((opt, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <input
                    type="radio"
                    name="correct_option"
                    checked={opt.is_correct}
                    onChange={() => {
                      const newOpts = questionForm.options.map((o, i) => ({
                        ...o,
                        is_correct: i === idx,
                      }));
                      setQuestionForm({ ...questionForm, options: newOpts });
                    }}
                  />
                  <input
                    type="text"
                    required
                    placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                    className="form-input"
                    value={opt.text}
                    onChange={e => {
                      const newOpts = [...questionForm.options];
                      newOpts[idx].text = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOpts });
                    }}
                  />
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>Simpan Pertanyaan</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
