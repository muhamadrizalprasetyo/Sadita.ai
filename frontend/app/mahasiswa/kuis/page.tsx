"use client";

import { useEffect, useState, useCallback } from "react";
import {
  HelpCircle,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import {
  academicApi,
  lmsApi,
  CourseClass,
  Quiz,
  QuizQuestion,
  QuizSubmission
} from "@/lib/api";
import { LoadingSpinner, EmptyState, StatusBadge } from "@/components/ui";

export default function MahasiswaKuisPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number>();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Active quiz-taking session
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<QuizSubmission | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<Record<number, QuizSubmission[]>>({});

  const loadQuizzes = useCallback(async (classId: number) => {
    setLoading(true);
    const res = await lmsApi.getQuizzes(classId);
    if (res.data) {
      // Filter published quizzes for students
      const pub = res.data.filter(q => q.is_published);
      setQuizzes(pub);

      // Load previous submissions for each quiz
      const subsMap: Record<number, QuizSubmission[]> = {};
      for (const q of pub) {
        const subRes = await lmsApi.getQuizSubmissions(q.id);
        if (subRes.data) {
          subsMap[q.id] = subRes.data;
        }
      }
      setUserSubmissions(subsMap);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void academicApi.getClasses().then(r => {
      const cls = r.data ?? [];
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClass(cls[0].id);
        void loadQuizzes(cls[0].id);
      } else {
        setLoading(false);
      }
    });
  }, [loadQuizzes]);

  const handleClassChange = (classId: number) => {
    setSelectedClass(classId);
    setActiveQuiz(null);
    setLastResult(null);
    void loadQuizzes(classId);
  };

  const handleStartQuiz = async (quiz: Quiz) => {
    setLoading(true);
    const res = await lmsApi.getQuiz(quiz.id);
    if (res.data) {
      setActiveQuiz(res.data);
      setQuizQuestions(res.data.questions || []);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTextAnswers({});
      setLastResult(null);
    } else {
      alert("Gagal memuat pertanyaan kuis.");
    }
    setLoading(false);
  };

  const handleSelectOption = (questionId: number, optionId: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    if (
      !confirm(
        `Kirim jawaban kuis sekarang? Pastikan Anda sudah memeriksa seluruh jawaban.`
      )
    ) {
      return;
    }

    setSubmitting(true);
    const answers = quizQuestions.map(q => ({
      question_id: q.id,
      selected_option_id: selectedAnswers[q.id],
      text_answer: textAnswers[q.id]
    }));

    const res = await lmsApi.submitQuiz(activeQuiz.id, answers);
    setSubmitting(false);

    if (res.data) {
      setLastResult(res.data);
      // Refresh submissions
      if (selectedClass) {
        void loadQuizzes(selectedClass);
      }
    } else {
      alert(res.error || "Gagal mengirimkan kuis.");
    }
  };

  if (loading && !activeQuiz) {
    return <LoadingSpinner text="Memuat daftar kuis online..." />;
  }

  // Active quiz view
  if (activeQuiz) {
    const currentQ = quizQuestions[currentQuestionIndex];
    const totalQuestions = quizQuestions.length;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (lastResult) {
      return (
        <div style={{ maxWidth: "48rem", margin: "2rem auto" }}>
          <div className="card" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                background: lastResult.passed
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
                color: lastResult.passed ? "var(--success)" : "var(--error)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem"
              }}
            >
              {lastResult.passed ? <CheckCircle size={36} /> : <XCircle size={36} />}
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              {lastResult.passed ? "Selamat, Anda Lulus Kuis!" : "Belum Mencapai Nilai Kelulusan"}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.75rem" }}>
              Kuis: <strong>{activeQuiz.title}</strong>
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
                background: "rgba(0,0,0,0.2)",
                padding: "1.25rem",
                borderRadius: "var(--radius-md)",
                marginBottom: "2rem"
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Skor Perolehan</span>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: lastResult.passed ? "var(--success)" : "var(--error)"
                  }}
                >
                  {lastResult.score}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Passing Grade</span>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  {activeQuiz.passing_score}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Percobaan Ke-</span>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-light)" }}>
                  {lastResult.attempt_number} / {activeQuiz.max_attempts}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setActiveQuiz(null);
                  setLastResult(null);
                }}
              >
                Kembali ke Daftar Kuis
              </button>
              {lastResult.attempt_number < activeQuiz.max_attempts && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleStartQuiz(activeQuiz)}
                >
                  <RotateCcw size={16} /> Coba Lagi
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: "56rem", margin: "1.5rem auto", display: "grid", gap: "1.5rem" }}>
        {/* Quiz Header Bar */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="badge badge-info">Kuis Sedang Berlangsung</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Soal {currentQuestionIndex + 1} dari {totalQuestions}
              </span>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.35rem" }}>
              {activeQuiz.title}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {activeQuiz.time_limit_minutes && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--warning)" }}>
                <Clock size={16} />
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Durasi: {activeQuiz.time_limit_minutes} Menit
                </span>
              </div>
            )}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (confirm("Yakin ingin membatalkan pengerjaan kuis? Jawaban belum tersimpan.")) {
                  setActiveQuiz(null);
                }
              }}
            >
              Batal
            </button>
          </div>
        </div>

        {/* Question Area */}
        {currentQ ? (
          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ fontWeight: 700, color: "var(--primary-light)", fontSize: "0.9rem" }}>
                Pertanyaan #{currentQuestionIndex + 1}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Bobot: {currentQ.points} Poin
              </span>
            </div>

            <p style={{ fontSize: "1.1rem", fontWeight: 500, lineHeight: 1.6, marginBottom: "1.75rem", color: "var(--text-primary)" }}>
              {currentQ.question_text}
            </p>

            {/* Multiple Choice Options */}
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {currentQ.options && currentQ.options.length > 0 ? (
                currentQ.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.id;
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "var(--radius-md)",
                        border: isSelected
                          ? "2px solid var(--primary-light)"
                          : "1px solid var(--border-subtle)",
                        background: isSelected
                          ? "rgba(56, 189, 248, 0.08)"
                          : "rgba(255, 255, 255, 0.02)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div
                        style={{
                          width: "2rem",
                          height: "2rem",
                          borderRadius: "50%",
                          background: isSelected ? "var(--primary)" : "rgba(255, 255, 255, 0.06)",
                          color: isSelected ? "#fff" : "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.875rem"
                        }}
                      >
                        {letter}
                      </div>
                      <span style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        {opt.option_text}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "1rem", color: "var(--text-muted)" }}>
                  Tidak ada opsi jawaban tersedia untuk pertanyaan ini.
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "2.5rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid var(--border-subtle)"
              }}
            >
              <button
                className="btn btn-secondary"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(i => i - 1)}
              >
                Sebelumnya
              </button>

              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Terjawab: {answeredCount} dari {totalQuestions}
              </span>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentQuestionIndex(i => i + 1)}
                >
                  Selanjutnya <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={handleSubmitQuiz}
                  style={{ background: "var(--success)", borderColor: "var(--success)" }}
                >
                  {submitting ? "Mengirim Jawaban..." : "Selesai & Kumpulkan Kuis"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={HelpCircle}
            title="Tidak ada pertanyaan"
            description="Kuis ini belum memiliki daftar pertanyaan yang ditambahkan oleh dosen."
          />
        )}
      </div>
    );
  }

  // Quiz listing view
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kuis & Ujian Online</h1>
          <p className="page-subtitle">
            Daftar evaluasi formatif dan kuis daring mandiri untuk mahasiswa
          </p>
        </div>
      </div>

      {/* Class filter */}
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Pilih Kelas Mata Kuliah:</label>
        <select
          className="form-select"
          style={{ maxWidth: "20rem" }}
          value={selectedClass ?? ""}
          onChange={e => handleClassChange(Number(e.target.value))}
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.course?.name})
            </option>
          ))}
        </select>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Belum ada kuis aktif"
          description="Dosen pengampu belum mempublikasikan kuis online pada kelas ini."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", gap: "1.25rem" }}>
          {quizzes.map(quiz => {
            const subs = userSubmissions[quiz.id] || [];
            const attemptsMade = subs.length;
            const bestScore = subs.length > 0 ? Math.max(...subs.map(s => s.score)) : null;
            const hasPassed = subs.some(s => s.passed);
            const canAttempt = attemptsMade < quiz.max_attempts;

            return (
              <div key={quiz.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                      {quiz.title}
                    </h3>
                    <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                      {quiz.description || "Evaluasi materi perkuliahan"}
                    </p>
                  </div>
                  {hasPassed ? (
                    <StatusBadge status="success" label="Lulus" />
                  ) : attemptsMade > 0 ? (
                    <StatusBadge status="warning" label={`Nilai: ${bestScore}`} />
                  ) : (
                    <StatusBadge status="info" label="Tersedia" />
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "0.75rem",
                    background: "rgba(0,0,0,0.2)",
                    padding: "0.85rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.825rem",
                    color: "var(--text-secondary)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Award size={15} color="var(--primary-light)" />
                    <span>Passing: <strong>{quiz.passing_score}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <RefreshCw size={15} color="var(--primary-light)" />
                    <span>Percobaan: <strong>{attemptsMade} / {quiz.max_attempts}</strong></span>
                  </div>
                  {quiz.time_limit_minutes && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Clock size={15} color="var(--warning)" />
                      <span>Batas: <strong>{quiz.time_limit_minutes} Menit</strong></span>
                    </div>
                  )}
                  {bestScore !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <CheckCircle size={15} color={hasPassed ? "var(--success)" : "var(--error)"} />
                      <span>Terbaik: <strong>{bestScore}</strong></span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
                  {canAttempt ? (
                    <button
                      className="btn btn-primary w-full"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => handleStartQuiz(quiz)}
                    >
                      {attemptsMade > 0 ? (
                        <>
                          <RotateCcw size={16} /> Kerjakan Ulang ({quiz.max_attempts - attemptsMade} tersisa)
                        </>
                      ) : (
                        <>
                          Mulai Kuis <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary w-full"
                      style={{ width: "100%", justifyContent: "center" }}
                      disabled
                    >
                      Batas Percobaan Habis
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
