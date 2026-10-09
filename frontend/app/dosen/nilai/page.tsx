"use client";

import { useEffect, useState } from "react";
import { Award, Calculator, Edit, Save, RefreshCw } from "lucide-react";
import { academicApi, gradingApi, CourseClass, StudentGrade, ClassEnrollment } from "@/lib/api";
import { LoadingSpinner, Modal, StatusBadge } from "@/components/ui";

export default function DosenNilaiPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number>();
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [students, setStudents] = useState<ClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedStudentGrade, setSelectedStudentGrade] = useState<{ studentId: number; component: string; score: number } | null>(null);

  const loadData = async (classId: number) => {
    const [gRes, sRes] = await Promise.all([
      gradingApi.getClassGrades(classId),
      academicApi.getClassStudents(classId),
    ]);
    if (gRes.data) setGrades(gRes.data);
    if (sRes.data) setStudents(sRes.data);
  };

  useEffect(() => {
    void academicApi.getClasses().then(r => {
      setClasses(r.data ?? []);
      if (r.data && r.data.length > 0) {
        setSelectedClass(r.data[0].id);
        void loadData(r.data[0].id);
      }
      setLoading(false);
    });
  }, []);

  const handleClassChange = (classId: number) => {
    setSelectedClass(classId);
    void loadData(classId);
  };

  const handleCalculate = async () => {
    if (!selectedClass) return;
    setCalculating(true);
    const res = await gradingApi.calculateClassGrades(selectedClass, true);
    setCalculating(false);
    if (res.data) {
      setGrades(res.data);
      alert("Kalkulasi nilai kelas berhasil diperbarui!");
    } else {
      alert(res.error || "Gagal mengkalkulasi nilai");
    }
  };

  const handleUpdateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudentGrade) return;

    const res = await gradingApi.updateGradeComponent(
      selectedClass,
      selectedStudentGrade.studentId,
      selectedStudentGrade.component,
      selectedStudentGrade.score
    );

    if (res.data) {
      setSelectedStudentGrade(null);
      void loadData(selectedClass);
    } else {
      alert(res.error || "Gagal memperbarui nilai");
    }
  };

  if (loading) return <LoadingSpinner text="Memuat rekap nilai perkuliahan..." />;

  const getStudentNim = (studentId: number) => {
    const found = students.find(s => s.student_id === studentId);
    return found?.student?.nim || `Mhs #${studentId}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Nilai & KHS</h1>
          <p className="page-subtitle">Formula SADITA: Absensi (10%) + Tugas (20%) + Keaktifan (10%) + UTS (30%) + UAS (30%)</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleCalculate}
          disabled={calculating}
        >
          <Calculator size={16} />
          {calculating ? "Menghitung..." : "Kalkulasi Otomatis"}
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

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mahasiswa</th>
              <th>Absen (10%)</th>
              <th>Tugas (20%)</th>
              <th>Aktif (10%)</th>
              <th>UTS (30%)</th>
              <th>UAS (30%)</th>
              <th>Nilai Akhir</th>
              <th>Grade</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  Belum ada data nilai terhitung. Klik tombol <strong>Kalkulasi Otomatis</strong> di atas untuk memproses data presensi dan tugas.
                </td>
              </tr>
            ) : (
              grades.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {getStudentNim(g.student_id)}
                  </td>
                  <td>{g.absen_score?.toFixed(1) ?? "—"}</td>
                  <td>{g.tugas_score?.toFixed(1) ?? "—"}</td>
                  <td>{g.aktif_score?.toFixed(1) ?? "—"}</td>
                  <td>{g.uts_score?.toFixed(1) ?? "—"}</td>
                  <td>{g.uas_score?.toFixed(1) ?? "—"}</td>
                  <td style={{ fontWeight: 800, color: "var(--primary-light)", fontSize: "0.95rem" }}>
                    {g.final_score?.toFixed(1) ?? "—"}
                  </td>
                  <td>
                    {g.grade_scale ? (
                      <span className={`badge ${g.grade_scale === "A" || g.grade_scale === "B" ? "badge-success" : g.grade_scale === "C" ? "badge-warning" : "badge-error"}`}>
                        {g.grade_scale}
                      </span>
                    ) : "—"}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedStudentGrade({ studentId: g.student_id, component: "uts", score: g.uts_score ?? 80 })}
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Component Modal */}
      {selectedStudentGrade && (
        <Modal
          isOpen={!!selectedStudentGrade}
          onClose={() => setSelectedStudentGrade(null)}
          title={`Input Nilai Mahasiswa (${getStudentNim(selectedStudentGrade.studentId)})`}
        >
          <form onSubmit={handleUpdateComponent} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Komponen Penilaian</label>
              <select
                className="form-select"
                value={selectedStudentGrade.component}
                onChange={e => setSelectedStudentGrade({ ...selectedStudentGrade, component: e.target.value })}
              >
                <option value="uts">UTS (Ujian Tengah Semester - 30%)</option>
                <option value="uas">UAS (Ujian Akhir Semester - 30%)</option>
                <option value="tugas">Tugas & Praktikum (20%)</option>
                <option value="aktif">Keaktifan Kelas (10%)</option>
                <option value="absen">Presensi (10%)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Skor (0 - 100)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                required
                className="form-input"
                value={selectedStudentGrade.score}
                onChange={e => setSelectedStudentGrade({ ...selectedStudentGrade, score: Number(e.target.value) })}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Simpan Komponen Nilai
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
