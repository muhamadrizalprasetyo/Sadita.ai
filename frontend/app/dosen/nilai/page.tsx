"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Calculator, Save } from "lucide-react";
import {
  academicApi,
  gradingApi,
  type ClassEnrollment,
  type StudentGrade,
} from "@/lib/api";
import { ClassToolbar } from "@/components/dosen/class-toolbar";
import { useInitialClassId } from "@/components/dosen/use-class-query";
import { useLecturerClasses } from "@/components/dosen/use-lecturer-classes";
import { EmptyState, LoadingSpinner, Modal, useConfirm } from "@/components/ui";

/** Bobot resmi dari backend GradingService.WEIGHTS */
const WEIGHT_LABEL =
  "Bobot sistem: UTS 30%, UAS 35%, Keaktifan 10%, Tugas 15%, Presensi 10%. Nilai akhir dihitung di server.";

export default function DosenNilaiPage() {
  const confirm = useConfirm();
  const { classes, loading: classesLoading, error: classesError, reload } = useLecturerClasses();
  const [classId, setClassId] = useInitialClassId(classes);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [students, setStudents] = useState<ClassEnrollment[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string>();
  const [calculating, setCalculating] = useState(false);
  const [filter, setFilter] = useState<"all" | "incomplete">("all");
  const [editRow, setEditRow] = useState<{
    studentId: number;
    component: string;
    score: number;
  } | null>(null);

  const loadData = async (id: number) => {
    setDataLoading(true);
    setDataError(undefined);
    const [gRes, sRes] = await Promise.all([
      gradingApi.getClassGrades(id),
      academicApi.getClassStudents(id),
    ]);
    if (gRes.error || sRes.error) {
      setDataError(gRes.error ?? sRes.error);
    }
    setGrades(gRes.data ?? []);
    setStudents(sRes.data ?? []);
    setDataLoading(false);
  };

  useEffect(() => {
    let ignore = false;
    if (classId) {
      Promise.resolve().then(() => {
        if (!ignore) {
          void loadData(classId);
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [classId]);

  const rows = useMemo(() => {
    const gradeByStudent = new Map(grades.map((g) => [g.student_id, g]));
    return students.map((enr) => ({
      studentId: enr.student_id,
      nim: enr.student?.nim ?? String(enr.student_id),
      name: enr.student?.full_name ?? "—",
      grade: gradeByStudent.get(enr.student_id),
    }));
  }, [grades, students]);

  const visibleRows = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => !r.grade?.final_score);
  }, [rows, filter]);

  const handleCalculate = async () => {
    if (!classId) return;
    setCalculating(true);
    const res = await gradingApi.calculateClassGrades(classId, true);
    setCalculating(false);
    if (res.error) {
      await confirm.alert(res.error, "Gagal Menghitung Nilai", "danger");
    } else if (res.data) {
      setGrades(res.data);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!classId || !editRow) return;
    const res = await gradingApi.updateGradeComponent(
      classId,
      editRow.studentId,
      editRow.component,
      editRow.score
    );
    if (res.error) {
      await confirm.alert(res.error, "Gagal Memperbarui Nilai", "danger");
    } else {
      setEditRow(null);
      void loadData(classId);
    }
  };

  if (classesLoading) return <LoadingSpinner text="Memuat kelas…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rekap Nilai Mahasiswa</h1>
          <p className="page-subtitle">{WEIGHT_LABEL}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!classId || calculating}
          onClick={() => void handleCalculate()}
        >
          <Calculator size={16} />
          {calculating ? "Menghitung…" : "Hitung ulang nilai kelas"}
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

      <div className="toolbar-row">
        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Filter</label>
        <select className="form-select" style={{ maxWidth: "14rem" }} value={filter} onChange={(e) => setFilter(e.target.value as "all" | "incomplete")}>
          <option value="all">Semua mahasiswa ({rows.length})</option>
          <option value="incomplete">Belum ada nilai akhir ({rows.filter(r => !r.grade?.final_score).length})</option>
        </select>
      </div>

      {dataError && <div className="alert alert-error">{dataError}</div>}

      {dataLoading ? (
        <LoadingSpinner text="Memuat nilai…" />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Belum ada mahasiswa terdaftar"
          description="Daftar peserta kelas diperlukan sebelum rekap nilai dapat ditampilkan."
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mahasiswa</th>
                <th>Presensi (10%)</th>
                <th>Tugas (15%)</th>
                <th>Keaktifan (10%)</th>
                <th>UTS (30%)</th>
                <th>UAS (35%)</th>
                <th>Nilai Akhir</th>
                <th>Huruf</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const g = row.grade;
                return (
                  <tr key={row.studentId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.name}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.nim}</div>
                    </td>
                    <td>{g?.absen_score !== undefined && g?.absen_score !== null ? g.absen_score.toFixed(1) : "—"}</td>
                    <td>{g?.tugas_score !== undefined && g?.tugas_score !== null ? g.tugas_score.toFixed(1) : "—"}</td>
                    <td>{g?.aktif_score !== undefined && g?.aktif_score !== null ? g.aktif_score.toFixed(1) : "—"}</td>
                    <td>{g?.uts_score !== undefined && g?.uts_score !== null ? g.uts_score.toFixed(1) : "—"}</td>
                    <td>{g?.uas_score !== undefined && g?.uas_score !== null ? g.uas_score.toFixed(1) : "—"}</td>
                    <td style={{ fontWeight: 700, color: g?.final_score ? "var(--primary-color, #1e40af)" : undefined }}>
                      {g?.final_score !== undefined && g?.final_score !== null ? g.final_score.toFixed(1) : "—"}
                    </td>
                    <td>
                      {g?.grade_scale ? (
                        <span className="badge badge-primary">{g.grade_scale}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          setEditRow({
                            studentId: row.studentId,
                            component: "uts",
                            score: g?.uts_score ?? 0,
                          })
                        }
                      >
                        Input komponen
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editRow && (
        <Modal
          isOpen
          onClose={() => setEditRow(null)}
          title={`Input Nilai — ${rows.find((r) => r.studentId === editRow.studentId)?.name ?? ""} (${rows.find((r) => r.studentId === editRow.studentId)?.nim ?? editRow.studentId})`}
        >
          <form onSubmit={handleUpdate} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Komponen</label>
              <select
                className="form-select"
                value={editRow.component}
                onChange={(e) => setEditRow({ ...editRow, component: e.target.value })}
              >
                <option value="uts">UTS</option>
                <option value="uas">UAS</option>
                <option value="tugas">Tugas</option>
                <option value="aktif">Keaktifan</option>
                <option value="absen">Presensi</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Skor (0–100)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                required
                className="form-input"
                value={editRow.score}
                onChange={(e) => setEditRow({ ...editRow, score: Number(e.target.value) })}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Simpan
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
