"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Users, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Check, 
  X, 
  Clock, 
  AlertCircle,
  FileCheck2
} from "lucide-react";
import { 
  academicApi, 
  krsApi, 
  type ClassEnrollment, 
  type CourseClass, 
  type KrsRequest 
} from "@/lib/api";
import { useLecturerClasses } from "@/components/dosen/use-lecturer-classes";
import { EmptyState, LoadingSpinner, Modal, StatusBadge } from "@/components/ui";

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function DosenClassesPage() {
  const { classes, loading, error, reload } = useLecturerClasses();
  const [activeTab, setActiveTab] = useState<"kelas" | "persetujuan">("kelas");
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<CourseClass | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // KRS requests state
  const [krsRequests, setKrsRequests] = useState<KrsRequest[]>([]);
  const [krsLoading, setKrsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState<KrsRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const loadCounts = () => {
    if (classes.length === 0) return;
    void Promise.all(
      classes.map(async (c) => {
        const res = await academicApi.getClassStudents(c.id);
        return [c.id, res.data?.length ?? 0] as const;
      })
    ).then((pairs) => {
      const map: Record<number, number> = {};
      pairs.forEach(([id, n]) => {
        map[id] = n;
      });
      setCounts(map);
    });
  };

  useEffect(() => {
    loadCounts();
  }, [classes]);

  const loadKrsRequests = async () => {
    setKrsLoading(true);
    const param = statusFilter !== "all" ? statusFilter : undefined;
    const res = await krsApi.getLecturerRequests(param);
    if (res.data) setKrsRequests(res.data);
    setKrsLoading(false);
  };

  useEffect(() => {
    void loadKrsRequests();
  }, [statusFilter]);

  const pendingCount = useMemo(() => {
    return krsRequests.filter((r) => r.status === "PENDING_APPROVAL").length;
  }, [krsRequests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.course?.name.toLowerCase().includes(q) ||
        c.course?.code.toLowerCase().includes(q)
    );
  }, [classes, search]);

  const openStudents = async (c: CourseClass) => {
    setSelected(c);
    setEnrollLoading(true);
    const res = await academicApi.getClassStudents(c.id);
    setEnrollments(res.data ?? []);
    setEnrollLoading(false);
  };

  const handleOpenReview = (request: KrsRequest, action: "APPROVE" | "REJECT") => {
    setReviewTarget(request);
    setReviewAction(action);
    setReviewNotes(action === "APPROVE" ? "Disetujui untuk mengikuti kelas" : "");
    setReviewError(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;

    setSubmittingReview(true);
    setReviewError(null);

    const res = await krsApi.reviewRequest(reviewTarget.id, {
      action: reviewAction,
      notes: reviewNotes.trim() || undefined,
    });

    setSubmittingReview(false);

    if (res.error) {
      setReviewError(res.error);
    } else {
      setReviewTarget(null);
      await Promise.all([loadKrsRequests(), reload()]);
      loadCounts();
    }
  };

  if (loading) return <LoadingSpinner text="Memuat kelas…" />;

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", paddingBottom: "3rem" }}>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Kelas Pengajar & Persetujuan KRS
          </h1>
          <p className="page-subtitle" style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Daftar kelas perkuliahan yang Anda ampu serta peninjauan pengajuan <strong>Tambah SKS</strong> dan <strong>Mengulang</strong> dari mahasiswa.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
          {error}{" "}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void reload()}>
            Coba lagi
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <button
          className={`btn ${activeTab === "kelas" ? "btn-primary" : "btn-outline"}`}
          style={{ borderRadius: "8px 8px 0 0", borderBottom: "none", fontWeight: 600 }}
          onClick={() => setActiveTab("kelas")}
        >
          <BookOpen size={16} /> Kelas Saya ({classes.length})
        </button>
        <button
          className={`btn ${activeTab === "persetujuan" ? "btn-primary" : "btn-outline"}`}
          style={{ borderRadius: "8px 8px 0 0", borderBottom: "none", fontWeight: 600, position: "relative" }}
          onClick={() => {
            setActiveTab("persetujuan");
            void loadKrsRequests();
          }}
        >
          <FileCheck2 size={16} /> Persetujuan Tambah SKS / Mengulang
          {pendingCount > 0 && (
            <span
              style={{
                background: "var(--danger)",
                color: "#fff",
                fontSize: "0.7rem",
                fontWeight: 700,
                borderRadius: "999px",
                padding: "1px 6px",
                marginLeft: "6px",
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: KELAS SAYA */}
      {activeTab === "kelas" && (
        <div>
          <div className="toolbar-row" style={{ marginBottom: "1.25rem" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "22rem" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="search"
                className="form-input"
                placeholder="Cari nama kelas atau mata kuliah…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.25rem", width: "100%" }}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={classes.length === 0 ? "Belum ada penugasan kelas" : "Tidak ada hasil pencarian"}
              description={
                classes.length === 0
                  ? "Hubungi administrator akademik jika Anda seharusnya mengampu kelas pada semester ini."
                  : "Ubah kata kunci pencarian."
              }
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kelas / Tingkat</th>
                    <th>Mata Kuliah & SKS</th>
                    <th>Semester</th>
                    <th>Jadwal Kuliah</th>
                    <th>Mahasiswa</th>
                    <th>Aksi Modul</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x) => (
                    <tr key={x.id}>
                      <td style={{ fontWeight: 600 }}>{x.name}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{x.course?.name || "Mata Kuliah"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {x.course?.code} • {x.course?.credits ?? 3} SKS
                        </div>
                      </td>
                      <td>{x.term?.name ?? "—"}</td>
                      <td style={{ fontSize: "0.85rem" }}>
                        <div>{DAY_NAMES[x.day_of_week] ?? "—"}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          {x.start_time.slice(0, 5)}–{x.end_time.slice(0, 5)} WIB
                        </div>
                      </td>
                      <td>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => void openStudents(x)}>
                          <Users size={14} /> {counts[x.id] !== undefined ? counts[x.id] : "…"} orang
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                          <Link href={`/dosen/presensi?class=${x.id}`} className="btn btn-outline btn-sm">
                            Presensi
                          </Link>
                          <Link href={`/dosen/materi?class=${x.id}`} className="btn btn-outline btn-sm">
                            Materi
                          </Link>
                          <Link href={`/dosen/tugas?class=${x.id}`} className="btn btn-outline btn-sm">
                            Tugas
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PERSETUJUAN KRS */}
      {activeTab === "persetujuan" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Status Permohonan:</label>
              <select
                className="form-select"
                style={{ minWidth: "12rem" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
                <option value="APPROVED">Telah Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>

            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Total Pengajuan: <strong>{krsRequests.length}</strong> mahasiswa
            </span>
          </div>

          {krsLoading ? (
            <LoadingSpinner text="Memuat daftar pengajuan KRS..." />
          ) : krsRequests.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Tidak Ada Pengajuan KRS"
              description="Belum ada mahasiswa yang mengajukan Tambah SKS atau Mengulang untuk kelas yang Anda ampu."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Mahasiswa</th>
                    <th>Kelas yang Diajukan</th>
                    <th>Tipe Pengajuan</th>
                    <th>Alasan Mahasiswa</th>
                    <th>Status</th>
                    <th>Catatan Dosen</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {krsRequests.map((r) => {
                    const statusBadge =
                      r.status === "APPROVED" ? (
                        <span className="badge badge-success">Disetujui</span>
                      ) : r.status === "REJECTED" ? (
                        <span className="badge badge-danger">Ditolak</span>
                      ) : r.status === "CANCELLED" ? (
                        <span className="badge badge-neutral">Dibatalkan</span>
                      ) : (
                        <span className="badge badge-warning">Menunggu Keputusan</span>
                      );

                    const typeBadge =
                      r.request_type === "TAMBAH_SKS" ? (
                        <span className="badge badge-info">Tambah SKS</span>
                      ) : (
                        <span className="badge badge-warning">Mengulang</span>
                      );

                    return (
                      <tr key={r.id}>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {new Date(r.submitted_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.student?.full_name || "Mahasiswa"}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                            NPM: {r.student?.nim || "—"} • Cohort TEKFO {r.student?.academic_cohort ?? "—"}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.course_class?.name || `Kelas #${r.class_id}`}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {r.course_class?.course?.name} ({r.course_class?.course?.credits ?? 3} SKS)
                          </div>
                        </td>
                        <td>{typeBadge}</td>
                        <td style={{ maxWidth: "15rem", fontSize: "0.85rem" }}>
                          {r.alasan || "—"}
                        </td>
                        <td>{statusBadge}</td>
                        <td style={{ maxWidth: "12rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {r.reviewer_notes || "—"}
                        </td>
                        <td>
                          {r.status === "PENDING_APPROVAL" ? (
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ background: "var(--green)", borderColor: "var(--green)" }}
                                onClick={() => handleOpenReview(r, "APPROVE")}
                                title="Setujui pengajuan KRS"
                              >
                                <Check size={14} /> Setujui
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                                onClick={() => handleOpenReview(r, "REJECT")}
                                title="Tolak pengajuan KRS"
                              >
                                <X size={14} /> Tolak
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Selesai</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL LIHAT MAHASISWA KELAS */}
      {selected && (
        <Modal isOpen onClose={() => setSelected(null)} title={`Mahasiswa Terdaftar — ${selected.name}`}>
          {enrollLoading ? (
            <LoadingSpinner text="Memuat daftar mahasiswa..." />
          ) : enrollments.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Belum ada mahasiswa terdaftar pada kelas ini.</p>
          ) : (
            <div className="table-container" style={{ maxHeight: "20rem", overflowY: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NPM / NIM</th>
                    <th>Nama Mahasiswa</th>
                    <th>Jalur KRS</th>
                    <th>Status</th>
                    <th>RFID UID</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enr) => {
                    const badgeType =
                      enr.enrollment_type === "TAMBAH_SKS" ? (
                        <span className="badge badge-info">Tambah SKS</span>
                      ) : enr.enrollment_type === "MENGULANG" ? (
                        <span className="badge badge-warning">Mengulang</span>
                      ) : (
                        <span className="badge badge-neutral">Reguler</span>
                      );

                    return (
                      <tr key={enr.id}>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                          {enr.student?.nim ?? enr.student_id}
                        </td>
                        <td style={{ fontWeight: 600 }}>{enr.student?.full_name || "—"}</td>
                        <td>{badgeType}</td>
                        <td>
                          <StatusBadge status="success" label={enr.status} />
                        </td>
                        <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {enr.student?.rfid_uid ?? "Belum ada"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL REVIEW / APPROVE KRS */}
      {reviewTarget && (
        <Modal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          title={reviewAction === "APPROVE" ? "Setujui Pengajuan KRS" : "Tolak Pengajuan KRS"}
        >
          <form onSubmit={handleSubmitReview}>
            {reviewError && (
              <div className="alert alert-error" style={{ marginBottom: "1rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{reviewError}</span>
              </div>
            )}

            <div
              style={{
                padding: "1rem",
                borderRadius: "8px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                {reviewTarget.student?.full_name} ({reviewTarget.student?.nim})
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Kelas: <strong>{reviewTarget.course_class?.name}</strong> • {reviewTarget.request_type === "TAMBAH_SKS" ? "Tambah SKS" : "Mengulang"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Alasan Mahasiswa: <em>&ldquo;{reviewTarget.alasan || "—"}&rdquo;</em>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" style={{ fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>
                Catatan Dosen Pengampu (Opsional)
              </label>
              <textarea
                className="form-input"
                style={{ width: "100%", minHeight: "80px" }}
                placeholder={reviewAction === "APPROVE" ? "Tambahkan catatan persetujuan jika ada..." : "Berikan alasan penolakan (misal: kuota kelas penuh, tidak memenuhi prasyarat)..."}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={submittingReview}
                onClick={() => setReviewTarget(null)}
              >
                Batal
              </button>
              <button
                type="submit"
                className={`btn ${reviewAction === "APPROVE" ? "btn-primary" : "btn-danger"}`}
                disabled={submittingReview}
                style={reviewAction === "APPROVE" ? { background: "var(--green)", borderColor: "var(--green)" } : {}}
              >
                {submittingReview
                  ? "Menyimpan Keputusan..."
                  : reviewAction === "APPROVE"
                  ? "Konfirmasi Setujui & Daftarkan"
                  : "Konfirmasi Tolak Pengajuan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
