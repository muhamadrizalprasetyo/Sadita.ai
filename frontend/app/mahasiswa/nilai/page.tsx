"use client";

import { useEffect, useState } from "react";
import { Award, BookOpen, Printer, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { academicApi, CourseClass, gradingApi, StudentGrade, authApi, User } from "@/lib/api";
import { LoadingSpinner, StatusBadge, StatCard } from "@/components/ui";

const GRADE_POINTS: Record<string, number> = {
  A: 4.0,
  B: 3.0,
  C: 2.0,
  D: 1.0,
  E: 0.0,
};

export default function MahasiswaNilaiPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [grades, setGrades] = useState<Record<number, StudentGrade | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function loadKHS() {
      try {
        const [uRes, cRes] = await Promise.all([
          authApi.getMe(),
          academicApi.getClasses(),
        ]);

        if (uRes.data) setUser(uRes.data);
        const classList = cRes.data ?? [];
        setClasses(classList);

        const studentId = uRes.data?.student_profile?.id;
        if (studentId && classList.length > 0) {
          const gradePromises = classList.map(async (c) => {
            const gRes = await gradingApi.getStudentGrade(c.id, studentId);
            return { classId: c.id, grade: gRes.data ?? null };
          });
          const gradeResults = await Promise.all(gradePromises);
          const gradeMap: Record<number, StudentGrade | null> = {};
          gradeResults.forEach(({ classId, grade }) => {
            gradeMap[classId] = grade;
          });
          setGrades(gradeMap);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat KHS");
      } finally {
        setLoading(false);
      }
    }

    void loadKHS();
  }, []);

  if (loading) return <LoadingSpinner text="Memuat Kartu Hasil Studi (KHS)..." />;

  // Calculate GPA / IPS
  let totalSks = 0;
  let earnedSks = 0;
  let totalPoints = 0;

  classes.forEach((c) => {
    const sks = c.course?.credits || 3;
    totalSks += sks;
    const g = grades[c.id];
    if (g && g.grade_scale) {
      const point = GRADE_POINTS[g.grade_scale] ?? 0;
      totalPoints += point * sks;
      if (point >= 2.0) {
        earnedSks += sks;
      }
    }
  });

  const ips = totalSks > 0 && totalPoints > 0 ? (totalPoints / totalSks).toFixed(2) : "0.00";

  const getPredikat = (gpa: number) => {
    if (gpa >= 3.51) return "Dengan Pujian (Cum Laude)";
    if (gpa >= 3.0) return "Sangat Memuaskan";
    if (gpa >= 2.75) return "Memuaskan";
    if (gpa >= 2.0) return "Cukup";
    return "Kurang";
  };

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kartu Hasil Studi (KHS)</h1>
          <p className="page-subtitle">Transkrip Nilai Akademik Semester Ganjil • S1 Teknologi Informasi</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => window.print()}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Printer size={16} /> Cetak KHS Resmi
        </button>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--error)", padding: "1rem" }}>
          <p style={{ color: "var(--error)" }}>{error}</p>
        </div>
      )}

      {/* Student Academic Info Card */}
      <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "1.25rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NAMA MAHASISWA</span>
          <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{user?.full_name}</div>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NOMOR INDUK MAHASISWA (NIM)</span>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", fontFamily: "var(--font-mono)" }}>
            {user?.student_profile?.nim || "202401001"}
          </div>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PROGRAM STUDI</span>
          <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
            {user?.student_profile?.department || "S1 Teknologi Informasi"}
          </div>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>TAHUN ANGKATAN</span>
          <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
            {user?.student_profile?.batch_year || 2024}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="stats">
        <StatCard
          label="Indeks Prestasi Semester (IPS)"
          value={ips}
          icon={Award}
          color="blue"
          subtext={getPredikat(Number(ips))}
        />
        <StatCard
          label="Total SKS Ditempuh"
          value={`${totalSks} SKS`}
          icon={BookOpen}
          color="purple"
          subtext={`${classes.length} Mata Kuliah Aktif`}
        />
        <StatCard
          label="SKS Lulus"
          value={`${earnedSks} SKS`}
          icon={CheckCircle}
          color="green"
          subtext={`Efektivitas ${totalSks > 0 ? Math.round((earnedSks / totalSks) * 100) : 0}%`}
        />
        <StatCard
          label="Status Akademik"
          value={Number(ips) >= 2.0 || totalPoints === 0 ? "AKTIF" : "PERINGATAN"}
          icon={FileText}
          color="orange"
          subtext="Memenuhi syarat kelulusan"
        />
      </div>

      {/* KHS Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Rincian Nilai Komponen & Huruf Mutu</h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Formula: Absen (10%) + Tugas (20%) + Aktif (10%) + UTS (30%) + UAS (30%)
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kode & Mata Kuliah</th>
                <th style={{ textAlign: "center" }}>SKS</th>
                <th style={{ textAlign: "center" }}>Absen (10%)</th>
                <th style={{ textAlign: "center" }}>Tugas (20%)</th>
                <th style={{ textAlign: "center" }}>Aktif (10%)</th>
                <th style={{ textAlign: "center" }}>UTS (30%)</th>
                <th style={{ textAlign: "center" }}>UAS (30%)</th>
                <th style={{ textAlign: "center" }}>Nilai Akhir</th>
                <th style={{ textAlign: "center" }}>Grade</th>
                <th style={{ textAlign: "center" }}>Bobot</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Belum ada mata kuliah yang diambil semester ini
                  </td>
                </tr>
              ) : (
                classes.map((c, idx) => {
                  const g = grades[c.id];
                  const sks = c.course?.credits || 3;
                  const gradeScale = g?.grade_scale;
                  const point = gradeScale ? GRADE_POINTS[gradeScale] : undefined;
                  const isPassed = point !== undefined && point >= 2.0;

                  return (
                    <tr key={c.id}>
                      <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.course?.name || c.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                          {c.name}
                        </div>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>{sks}</td>
                      <td style={{ textAlign: "center" }}>{g?.absen_score?.toFixed(1) ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{g?.tugas_score?.toFixed(1) ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{g?.aktif_score?.toFixed(1) ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{g?.uts_score?.toFixed(1) ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{g?.uas_score?.toFixed(1) ?? "—"}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "var(--primary-light)" }}>
                        {g?.final_score?.toFixed(1) ?? "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {gradeScale ? (
                          <span
                            className={`badge ${
                              gradeScale === "A" || gradeScale === "B"
                                ? "badge-success"
                                : gradeScale === "C"
                                ? "badge-warning"
                                : "badge-error"
                            }`}
                          >
                            {gradeScale}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>Belum dinilai</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {point !== undefined ? point.toFixed(1) : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {gradeScale ? (
                          <StatusBadge
                            status={isPassed ? "success" : "error"}
                            label={isPassed ? "LULUS" : "MENGULANG"}
                          />
                        ) : (
                          <StatusBadge status="neutral" label="BERJALAN" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
