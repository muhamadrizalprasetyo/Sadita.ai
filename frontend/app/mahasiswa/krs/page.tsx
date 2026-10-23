"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Calendar, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search, 
  Users, 
  GraduationCap, 
  RotateCcw,
  FileText,
  Trash2,
  Info
} from "lucide-react";
import { 
  academicApi, 
  krsApi, 
  studentApi,
  type CourseClass, 
  type ClassEnrollment, 
  type KrsRequest,
  type StudentProfile
} from "@/lib/api";
import { LoadingSpinner, EmptyState, Modal, StatusBadge } from "@/components/ui";

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function MahasiswaKrsPage() {
  const [activeTab, setActiveTab] = useState<"krs_saya" | "katalog" | "riwayat">("krs_saya");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // KRS Saya state
  const [myClasses, setMyClasses] = useState<CourseClass[]>([]);

  // Available classes (katalog) state
  const [availableClasses, setAvailableClasses] = useState<CourseClass[]>([]);
  const [katalogLoading, setKatalogLoading] = useState(false);
  const [searchKatalog, setSearchKatalog] = useState("");
  const [cohortFilter, setCohortFilter] = useState<string>("all");

  // Requests state
  const [myRequests, setMyRequests] = useState<KrsRequest[]>([]);

  // Modal Ajukan KRS
  const [selectedClass, setSelectedClass] = useState<CourseClass | null>(null);
  const [requestType, setRequestType] = useState<"TAMBAH_SKS" | "MENGULANG">("TAMBAH_SKS");
  const [alasan, setAlasan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Cancel action state
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [profRes, classRes, reqRes] = await Promise.all([
      studentApi.getMyProfile(),
      academicApi.getClasses(), // Automatically returns student's enrolled classes for student role
      krsApi.getMyRequests(),
    ]);

    if (profRes.data) setProfile(profRes.data);
    if (classRes.data) setMyClasses(classRes.data);
    if (reqRes.data) setMyRequests(reqRes.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const loadKatalog = async () => {
    setKatalogLoading(true);
    const cohortParam = cohortFilter !== "all" ? parseInt(cohortFilter, 10) : undefined;
    const res = await krsApi.getAvailableClasses({
      cohort: cohortParam,
      search: searchKatalog.trim() || undefined,
    });
    if (res.data) setAvailableClasses(res.data);
    setKatalogLoading(false);
  };

  useEffect(() => {
    if (activeTab === "katalog") {
      void loadKatalog();
    }
  }, [activeTab, cohortFilter, searchKatalog]);

  const handleOpenRequestModal = (c: CourseClass) => {
    setSelectedClass(c);
    setRequestType("TAMBAH_SKS");
    setAlasan("");
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    if (!alasan.trim()) {
      setSubmitError("Mohon berikan alasan pengajuan KRS ini.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const res = await krsApi.requestKrs({
      class_id: selectedClass.id,
      request_type: requestType,
      alasan: alasan.trim(),
    });

    setSubmitting(false);

    if (res.error) {
      setSubmitError(res.error);
    } else {
      setSubmitSuccess("Pengajuan KRS berhasil dikirimkan ke Dosen Pengampu!");
      setTimeout(() => {
        setSelectedClass(null);
        setSubmitSuccess(null);
        void loadData();
        setActiveTab("riwayat");
      }, 1400);
    }
  };

  const handleCancelRequest = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pengajuan KRS ini?")) return;
    setCancellingId(id);
    const res = await krsApi.cancelRequest(id);
    setCancellingId(null);
    if (res.error) {
      alert(res.error);
    } else {
      void loadData();
    }
  };

  const totalSks = useMemo(() => {
    return myClasses.reduce((acc, c) => acc + (c.course?.credits || 0), 0);
  }, [myClasses]);

  const pendingRequestsCount = useMemo(() => {
    return myRequests.filter((r) => r.status === "PENDING_APPROVAL").length;
  }, [myRequests]);

  if (loading) {
    return <LoadingSpinner text="Memuat Rencana Studi (KRS)..." />;
  }

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Kartu Rencana Studi (KRS)
          </h1>
          <p className="page-subtitle" style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Kelola kelas semester reguler Anda serta ajukan <strong>Tambah SKS</strong> atau <strong>Mengulang Mata Kuliah</strong> dengan persetujuan dosen.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", marginBottom: "1.75rem" }}>
        <button
          className={`btn ${activeTab === "krs_saya" ? "btn-primary" : "btn-outline"}`}
          style={{ borderRadius: "8px 8px 0 0", borderBottom: "none", fontWeight: 600 }}
          onClick={() => setActiveTab("krs_saya")}
        >
          <BookOpen size={16} /> KRS Saya ({myClasses.length} Kelas)
        </button>
        <button
          className={`btn ${activeTab === "katalog" ? "btn-primary" : "btn-outline"}`}
          style={{ borderRadius: "8px 8px 0 0", borderBottom: "none", fontWeight: 600 }}
          onClick={() => setActiveTab("katalog")}
        >
          <Plus size={16} /> Ajukan Tambah SKS / Mengulang
        </button>
        <button
          className={`btn ${activeTab === "riwayat" ? "btn-primary" : "btn-outline"}`}
          style={{ borderRadius: "8px 8px 0 0", borderBottom: "none", fontWeight: 600, position: "relative" }}
          onClick={() => setActiveTab("riwayat")}
        >
          <RotateCcw size={16} /> Riwayat Pengajuan
          {pendingRequestsCount > 0 && (
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
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: KRS Saya */}
      {activeTab === "krs_saya" && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Total SKS Diambil</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--green)", marginTop: "0.25rem" }}>
                {totalSks} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-secondary)" }}>SKS</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Batas maksimal 24 SKS per semester
              </div>
            </div>

            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Tingkat / Cohort Utama</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--primary)", marginTop: "0.25rem" }}>
                TEKFO {profile?.academic_cohort ?? 1}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                {profile?.class_type === "REGULER_MALAM" ? "Kelas Reguler Malam" : "Kelas Reguler Pagi"}
              </div>
            </div>

            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Total Kelas Terdaftar</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                {myClasses.length} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-secondary)" }}>Mata Kuliah</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Semester Ganjil 2024/2025
              </div>
            </div>
          </div>

          {/* Table of Classes */}
          {myClasses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Belum Ada Kelas Terdaftar"
              description="Anda belum terdaftar pada kelas perkuliahan aktif. Silakan hubungi bagian akademik atau ajukan kelas melalui tab 'Ajukan Tambah SKS'."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kelas / Tingkat</th>
                    <th>Mata Kuliah</th>
                    <th>SKS</th>
                    <th>Dosen Pengampu</th>
                    <th>Jadwal Kuliah</th>
                    <th>Ruang</th>
                  </tr>
                </thead>
                <tbody>
                  {myClasses.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{c.name}</div>
                        <span className="badge badge-info" style={{ fontSize: "0.7rem", marginTop: "2px" }}>
                          Reguler Terdaftar
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.course?.name || "Mata Kuliah"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                          Kode: {c.course?.code || "—"}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                          {c.course?.credits ?? 3}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {c.lecturer?.full_name || "Dosen Pengampu"}
                        </div>
                        {c.lecturer?.nidn && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                            NIDN: {c.lecturer.nidn}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        <div style={{ fontWeight: 600 }}>{DAY_NAMES[c.day_of_week] || `Hari ${c.day_of_week}`}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)} WIB
                        </div>
                      </td>
                      <td>
                        {c.room ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.room.name}</div>
                            {c.room.code && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                {c.room.code} {c.room.building ? `• ${c.room.building}` : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Daring / Lab</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Katalog & Pengajuan */}
      {activeTab === "katalog" && (
        <div>
          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "8px",
              background: "rgba(18, 183, 106, 0.08)",
              border: "1px solid rgba(18, 183, 106, 0.25)",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <Info size={20} color="var(--green)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
              <strong>Ketentuan Pengajuan KRS Lintas Tingkat / Tambah SKS:</strong>
              <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                <li>Hanya menampilkan kelas yang belum Anda ambil pada semester berjalan.</li>
                <li>Pengajuan akan diperiksa otomatis terhadap bentrok jadwal kelas aktif Anda.</li>
                <li>Setiap pengajuan memerlukan persetujuan langsung dari Dosen Pengampu mata kuliah bersangkutan.</li>
              </ul>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "16rem", maxWidth: "24rem" }}>
              <input
                type="text"
                placeholder="Cari mata kuliah, nama kelas, atau dosen..."
                className="form-input"
                value={searchKatalog}
                onChange={(e) => setSearchKatalog(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
              <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Tingkat / Cohort:</label>
              <select
                className="form-select"
                style={{ minWidth: "12rem" }}
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value)}
              >
                <option value="all">Semua Tingkat (TEKFO 1–8)</option>
                <option value="1">TEKFO 1 (Semester 1)</option>
                <option value="2">TEKFO 2 (Semester 2)</option>
                <option value="3">TEKFO 3 (Semester 3)</option>
                <option value="4">TEKFO 4 (Semester 4)</option>
                <option value="5">TEKFO 5 (Semester 5)</option>
                <option value="6">TEKFO 6 (Semester 6)</option>
                <option value="7">TEKFO 7 (Semester 7)</option>
                <option value="8">TEKFO 8 (Semester 8)</option>
              </select>
            </div>

            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "auto" }}>
              Tersedia: <strong>{availableClasses.length}</strong> kelas
            </span>
          </div>

          {katalogLoading ? (
            <LoadingSpinner text="Memuat katalog kelas yang dapat diajukan..." />
          ) : availableClasses.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Tidak Ada Kelas Tersedia"
              description="Tidak ada kelas yang cocok dengan filter atau seluruh kelas sudah terdaftar pada KRS Anda."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kelas / Tingkat</th>
                    <th>Mata Kuliah & SKS</th>
                    <th>Dosen Pengampu</th>
                    <th>Jadwal Kuliah</th>
                    <th>Ruang</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {availableClasses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.course?.name || "Mata Kuliah"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {c.course?.code || "—"} • <strong>{c.course?.credits ?? 3} SKS</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.lecturer?.full_name || "—"}</div>
                        {c.lecturer?.nidn && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                            NIDN: {c.lecturer.nidn}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        <div>{DAY_NAMES[c.day_of_week] || `Hari ${c.day_of_week}`}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)} WIB
                        </div>
                      </td>
                      <td>
                        {c.room ? (
                          <span style={{ fontSize: "0.85rem" }}>{c.room.name}</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Daring</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenRequestModal(c)}
                        >
                          <Plus size={14} /> Ajukan KRS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Riwayat Pengajuan */}
      {activeTab === "riwayat" && (
        <div>
          {myRequests.length === 0 ? (
            <EmptyState
              icon={RotateCcw}
              title="Belum Ada Pengajuan KRS"
              description="Anda belum memiliki riwayat pengajuan Tambah SKS atau Mengulang Mata Kuliah. Buka tab 'Ajukan Tambah SKS / Mengulang' untuk mengajukan kelas baru."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Waktu Pengajuan</th>
                    <th>Kelas & Mata Kuliah</th>
                    <th>Tipe Pengajuan</th>
                    <th>Alasan Mahasiswa</th>
                    <th>Status Persetujuan</th>
                    <th>Catatan Dosen</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((r) => {
                    const statusBadge = 
                      r.status === "APPROVED" ? (
                        <span className="badge badge-success">Disetujui</span>
                      ) : r.status === "REJECTED" ? (
                        <span className="badge badge-danger">Ditolak</span>
                      ) : r.status === "CANCELLED" ? (
                        <span className="badge badge-neutral">Dibatalkan</span>
                      ) : (
                        <span className="badge badge-warning">Menunggu Dosen</span>
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
                          <div style={{ fontWeight: 600 }}>{r.course_class?.name || `Kelas #${r.class_id}`}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {r.course_class?.course?.name} ({r.course_class?.course?.credits ?? 3} SKS)
                          </div>
                        </td>
                        <td>{typeBadge}</td>
                        <td style={{ maxWidth: "16rem", fontSize: "0.85rem" }}>
                          {r.alasan || "—"}
                        </td>
                        <td>{statusBadge}</td>
                        <td style={{ maxWidth: "14rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {r.reviewer_notes || "—"}
                        </td>
                        <td>
                          {r.status === "PENDING_APPROVAL" && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                              disabled={cancellingId === r.id}
                              onClick={() => handleCancelRequest(r.id)}
                            >
                              <Trash2 size={14} /> Batalkan
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
        </div>
      )}

      {/* Modal Ajukan KRS */}
      {selectedClass && (
        <Modal
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          title={`Ajukan Rencana Studi: ${selectedClass.name}`}
        >
          <form onSubmit={handleSubmitRequest}>
            {submitSuccess && (
              <div className="alert alert-success" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle size={18} />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="alert alert-error" style={{ marginBottom: "1rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{submitError}</span>
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
                {selectedClass.course?.name} ({selectedClass.course?.credits ?? 3} SKS)
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Dosen Pengampu: <strong>{selectedClass.lecturer?.full_name || "—"}</strong>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Jadwal: {DAY_NAMES[selectedClass.day_of_week]}, {selectedClass.start_time.slice(0, 5)} - {selectedClass.end_time.slice(0, 5)} WIB
                {selectedClass.room ? ` • Ruang ${selectedClass.room.name}` : ""}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label" style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                Jenis Pengajuan KRS <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="request_type"
                    value="TAMBAH_SKS"
                    checked={requestType === "TAMBAH_SKS"}
                    onChange={() => setRequestType("TAMBAH_SKS")}
                  />
                  <span>
                    <strong>Tambah SKS</strong> — Mengambil mata kuliah semester lain / pengayaan
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="request_type"
                    value="MENGULANG"
                    checked={requestType === "MENGULANG"}
                    onChange={() => setRequestType("MENGULANG")}
                  />
                  <span>
                    <strong>Mengulang Mata Kuliah</strong> — Perbaikan nilai / remedial semester berjalan
                  </span>
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" style={{ fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>
                Alasan Pengajuan <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <textarea
                className="form-input"
                style={{ width: "100%", minHeight: "90px", resize: "vertical" }}
                placeholder="Jelaskan alasan Anda mengajukan kelas ini (misal: telah memenuhi prasyarat IPK, ingin mempercepat kelulusan, atau perbaikan nilai mata kuliah)..."
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                required
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                Alasan ini akan ditinjau langsung oleh dosen pengampu sebelum menyetujui.
              </small>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={submitting}
                onClick={() => setSelectedClass(null)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Mengirimkan Pengajuan..." : "Kirim Pengajuan ke Dosen"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
