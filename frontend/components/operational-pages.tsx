"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Plus,
  Users,
  Radio,
  Search,
  CheckCircle,
  Edit3,
  Upload
} from "lucide-react";
import {
  academicApi,
  attendanceApi,
  deviceApi,
  healthApi,
  lmsApi,
  studentApi,
  lecturerApi,
  uploadApi,
  authApi,
  getFileUrl,
  type User,
  type Assignment,
  type AttendanceSession,
  type CourseClass,
  type CourseMaterial,
  type Course,
  type AcademicTerm,
  type SaditaDevice,
  type ClassEnrollment,
  type LecturerProfile,
  type StudentProfile
} from "@/lib/api";
import { LoadingSpinner, Modal, StatusBadge } from "@/components/ui";

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ============================================================================
// 1. Terms / Semester Page with Add Modal
// ============================================================================
export function TermsPage() {
  const [items, setItems] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", start_date: "", end_date: "", is_active: true });

  const loadData = () => {
    setLoading(true);
    void academicApi.getTerms().then(r => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  };

  useEffect(() => {
    void academicApi.getTerms().then(r => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await academicApi.createTerm(formData);
    if (res.data) {
      setIsModalOpen(false);
      setFormData({ name: "", start_date: "", end_date: "", is_active: true });
      loadData();
    } else {
      alert(res.error || "Gagal menambah semester");
    }
  };

  if (loading) return <LoadingSpinner text="Memuat tahun akademik..." />;

  return (
    <div>
      <PageHeader
        title="Tahun Akademik & Semester"
        subtitle="Manajemen kalender semester perkuliahan aktif"
        action={
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Tambah Semester
          </button>
        }
      />

      {error && <div className="card" style={{ color: "var(--error)", marginBottom: "1rem" }}>{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Semester</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Selesai</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x.id}>
                <td style={{ fontWeight: 600 }}>{x.name}</td>
                <td>{x.start_date}</td>
                <td>{x.end_date}</td>
                <td>
                  <StatusBadge
                    status={x.is_active ? "success" : "neutral"}
                    label={x.is_active ? "Aktif Berjalan" : "Selesai"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Semester Baru">
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Nama Semester</label>
            <input required placeholder="Contoh: Genap 2026/2027" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Tanggal Mulai</label>
              <input required type="date" className="form-input" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Selesai</label>
              <input required type="date" className="form-input" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>Simpan Semester</button>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 2. Courses / Mata Kuliah Page with Add Modal
// ============================================================================
export function CoursesPage() {
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", credits: 3, semester_ke: 1, description: "" });

  const loadData = () => {
    setLoading(true);
    void academicApi.getCourses().then(r => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  };

  useEffect(() => {
    void academicApi.getCourses().then(r => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await academicApi.createCourse(formData);
    if (res.data) {
      setIsModalOpen(false);
      setFormData({ code: "", name: "", credits: 3, semester_ke: 1, description: "" });
      loadData();
    } else {
      alert(res.error || "Gagal menambah mata kuliah");
    }
  };

  const filtered = items.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Memuat mata kuliah..." />;

  return (
    <div>
      <PageHeader
        title="Katalog Mata Kuliah"
        subtitle="Daftar mata kuliah kurikulum Program Studi Teknologi Informasi"
        action={
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Tambah Mata Kuliah
          </button>
        }
      />

      {error && <div style={{ color: "#ef4444", marginBottom: "0.75rem", fontSize: "0.85rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "24rem" }}>
          <input
            type="text"
            placeholder="Cari kode atau nama mata kuliah..."
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
          <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Mata Kuliah</th>
              <th>Bobot SKS</th>
              <th>Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(x => (
              <tr key={x.id}>
                <td style={{ fontWeight: 700, color: "var(--primary-light)", fontFamily: "var(--font-mono)" }}>{x.code}</td>
                <td style={{ fontWeight: 600 }}>{x.name}</td>
                <td>
                  <span className="badge badge-info">{x.credits} SKS</span>
                </td>
                <td style={{ color: "var(--text-secondary)", fontSize: "0.825rem", maxWidth: "28rem" }}>
                  {x.description || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Mata Kuliah Baru">
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Kode MK</label>
              <input required placeholder="IF201" className="form-input" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="form-group">
              <label className="form-label">Nama Mata Kuliah</label>
              <input required placeholder="Pemrograman Web Modern" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Bobot SKS</label>
              <input required type="number" min="1" max="6" className="form-input" value={formData.credits} onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Semester Rekomendasi</label>
              <input required type="number" min="1" max="8" className="form-input" value={formData.semester_ke} onChange={e => setFormData({ ...formData, semester_ke: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi & Capaian Pembelajaran</label>
            <textarea rows={3} className="form-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary">Simpan Mata Kuliah</button>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 3. Classes / Kelas Kuliah Page with Add Modal & Student Enrollment
// ============================================================================
export function ClassesPage({ mine = false }: { mine?: boolean }) {
  const [items, setItems] = useState<CourseClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [lecturers, setLecturers] = useState<LecturerProfile[]>([]);
  const [rooms, setRooms] = useState<{ id: number; kode: string; name: string; capacity: number; gedung?: string; lantai?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<CourseClass | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    course_id: 1,
    term_id: 1,
    lecturer_id: 1,
    room_id: undefined as number | undefined,
    day_of_week: 1,
    start_time: "08:00:00",
    end_time: "10:30:00",
    class_type: "REGULER_PAGI"
  });

  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [studentToEnroll, setStudentToEnroll] = useState<number>();
  const [enrolling, setEnrolling] = useState(false);

  // Edit class state (Admin authority to assign/reassign lecturer & room)
  const [editTarget, setEditTarget] = useState<CourseClass | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    course_id: 1,
    term_id: 1,
    lecturer_id: 1,
    room_id: undefined as number | undefined,
    day_of_week: 1,
    start_time: "08:00:00",
    end_time: "10:30:00",
  });

  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const getCohortNumber = (name: string): number => {
    const match = name.match(/TEKFO\.?\s*(\d+)/i) || name.match(/TI-?(\d+)/i) || name.match(/Smt\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 999;
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loadData = async () => {
    const [cRes, crsRes, tRes, lRes, uRes, rRes] = await Promise.all([
      academicApi.getClasses(),
      academicApi.getCourses(),
      academicApi.getTerms(),
      lecturerApi.list({ limit: 100 }),
      authApi.getMe(),
      academicApi.getRooms(),
    ]);
    if (uRes.data) setCurrentUser(uRes.data);
    if (cRes.data) setItems(cRes.data);
    if (rRes.data) {
      const roomList = rRes.data;
      setRooms(roomList);
      if (roomList.length > 0) {
        setFormData((f) => ({ ...f, room_id: roomList[0].id }));
      }
    }
    if (crsRes.data && crsRes.data.length > 0) {
      const crsData = crsRes.data;
      setCourses(crsData);
      setFormData((f) => ({ ...f, course_id: crsData[0].id }));
    }
    if (tRes.data && tRes.data.length > 0) {
      const tData = tRes.data;
      setTerms(tData);
      setFormData((f) => ({ ...f, term_id: tData[0].id }));
    }
    if (lRes.data && lRes.data.length > 0) {
      const lData = lRes.data;
      setLecturers(lData);
      setFormData((f) => ({ ...f, lecturer_id: lData[0].id }));
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      academicApi.getClasses(),
      academicApi.getCourses(),
      academicApi.getTerms(),
      lecturerApi.list({ limit: 100 }),
      authApi.getMe(),
      academicApi.getRooms(),
    ]).then(([cRes, crsRes, tRes, lRes, uRes, rRes]) => {
      if (!isMounted) return;
      if (uRes.data) setCurrentUser(uRes.data);
      if (cRes.data) setItems(cRes.data);
      if (rRes.data) {
        const roomList = rRes.data;
        setRooms(roomList);
        if (roomList.length > 0) {
          setFormData((f) => ({ ...f, room_id: roomList[0].id }));
        }
      }
      if (crsRes.data && crsRes.data.length > 0) {
        const crsData = crsRes.data;
        setCourses(crsData);
        setFormData((f) => ({ ...f, course_id: crsData[0].id }));
      }
      if (tRes.data && tRes.data.length > 0) {
        const tData = tRes.data;
        setTerms(tData);
        setFormData((f) => ({ ...f, term_id: tData[0].id }));
      }
      if (lRes.data && lRes.data.length > 0) {
        const lData = lRes.data;
        setLecturers(lData);
        setFormData((f) => ({ ...f, lecturer_id: lData[0].id }));
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await academicApi.createClass(formData);
    if (res.data) {
      setIsModalOpen(false);
      await loadData();
    } else {
      alert(res.error || "Gagal membuat kelas perkuliahan");
    }
  };

  const openEdit = (c: CourseClass) => {
    setEditTarget(c);
    setEditFormData({
      name: c.name,
      course_id: c.course_id,
      term_id: c.term_id,
      lecturer_id: c.lecturer_id,
      room_id: c.room_id,
      day_of_week: c.day_of_week,
      start_time: c.start_time,
      end_time: c.end_time,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const res = await academicApi.updateClass(editTarget.id, editFormData);
    if (res.data) {
      setEditTarget(null);
      await loadData();
    } else {
      alert(res.error || "Gagal memperbarui dosen pengampu / jadwal kelas");
    }
  };

  const openEnrollments = async (c: CourseClass) => {
    setSelectedClass(c);
    const [stuRes, enrollRes] = await Promise.all([
      studentApi.list(0, 200),
      academicApi.getClassStudents(c.id),
    ]);
    if (enrollRes.data) setEnrollments(enrollRes.data);
    if (stuRes.data) {
      setAllStudents(stuRes.data);
      if (stuRes.data.length > 0) setStudentToEnroll(stuRes.data[0].id);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !studentToEnroll) return;
    setEnrolling(true);
    const res = await academicApi.enrollStudent(selectedClass.id, studentToEnroll);
    if (res.error) {
      alert(res.error);
    } else {
      const refreshed = await academicApi.getClassStudents(selectedClass.id);
      if (refreshed.data) setEnrollments(refreshed.data);
    }
    setEnrolling(false);
  };

  if (loading) return <LoadingSpinner text="Memuat kelas perkuliahan..." />;

  const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  const filteredAndSorted = items
    .filter((x) => {
      if (filterSemester !== "all") {
        const cohortNum = getCohortNumber(x.name);
        if (cohortNum !== parseInt(filterSemester, 10)) return false;
      }
      if (filterDay !== "all") {
        if (x.day_of_week !== parseInt(filterDay, 10)) return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchText = `${x.name} ${x.course?.name || ""} ${x.course?.code || ""} ${x.lecturer?.full_name || ""} ${x.lecturer?.nidn || ""}`.toLowerCase();
        if (!matchText.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const coA = getCohortNumber(a.name);
      const coB = getCohortNumber(b.name);
      if (coA !== coB) return coA - coB;
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return (a.start_time || "").localeCompare(b.start_time || "");
    });

  const isAdmin = !mine && currentUser?.role === "ADMIN";

  return (
    <div>
      <PageHeader
        title={mine ? "Kelas Perkuliahan Saya" : "Kelas & Enrollment KRS"}
        subtitle="Jadwal kelas, dosen pengampu multi-matkul, dan daftar mahasiswa terdaftar"
        action={
          isAdmin && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Buka Kelas Baru
            </button>
          )
        }
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "16rem", maxWidth: "24rem" }}>
          <input
            type="text"
            placeholder="Cari mata kuliah, kelas, atau dosen..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
          <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Semester:</label>
          <select
            className="form-select"
            style={{ minWidth: "10rem" }}
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
          >
            <option value="all">Semua Semester</option>
            <option value="1">Semester 1 (TEKFO 1)</option>
            <option value="2">Semester 2 (TEKFO 2)</option>
            <option value="3">Semester 3 (TEKFO 3)</option>
            <option value="4">Semester 4 (TEKFO 4)</option>
            <option value="5">Semester 5 (TEKFO 5)</option>
            <option value="6">Semester 6 (TEKFO 6)</option>
            <option value="7">Semester 7 (TEKFO 7)</option>
            <option value="8">Semester 8 (TEKFO 8)</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Hari:</label>
          <select
            className="form-select"
            style={{ minWidth: "8.5rem" }}
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
          >
            <option value="all">Semua Hari</option>
            <option value="1">Senin</option>
            <option value="2">Selasa</option>
            <option value="3">Rabu</option>
            <option value="4">Kamis</option>
            <option value="5">Jumat</option>
            <option value="6">Sabtu</option>
          </select>
        </div>

        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "auto" }}>
          Menampilkan: <strong>{filteredAndSorted.length}</strong> kelas
        </span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode / Nama Kelas</th>
              <th>Mata Kuliah</th>
              <th>Dosen Pengampu</th>
              <th>Ruang & Lokasi</th>
              <th>Jadwal Kuliah</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((x) => (
              <tr key={x.id}>
                <td style={{ fontWeight: 700 }}>{x.name}</td>
                <td>{x.course?.name || "Mata Kuliah"}</td>
                <td>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {x.lecturer?.full_name ?? (x.lecturer?.nidn ? `NIDN ${x.lecturer.nidn}` : "Dosen Pengampu")}
                  </div>
                  {x.lecturer?.full_name && x.lecturer?.nidn && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      NIDN: {x.lecturer.nidn}
                    </div>
                  )}
                </td>
                <td>
                  {x.room ? (
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {x.room.name} {x.room.code ? `(${x.room.code})` : ""}
                      </div>
                      {(x.room.building || x.room.floor) && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {x.room.building || "Gedung Utama"} {x.room.floor ? `• Lantai ${x.room.floor}` : ""}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Daring / Belum Ada Ruang</span>
                  )}
                </td>
                <td style={{ fontSize: "0.85rem" }}>
                  {dayNames[x.day_of_week] || `Hari ${x.day_of_week}`}, {x.start_time.slice(0, 5)} - {x.end_time.slice(0, 5)} WIB
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(x)}
                        title="Atur dosen pengampu & jadwal"
                      >
                        <Edit3 size={14} /> Atur Dosen
                      </button>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => openEnrollments(x)}>
                      <Users size={14} /> Mahasiswa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enrollment Modal */}
      {selectedClass && (
        <Modal isOpen={!!selectedClass} onClose={() => setSelectedClass(null)} title={`Mahasiswa Kelas ${selectedClass.name}`}>
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Total Mahasiswa Terdaftar KRS: <strong>{enrollments.length} orang</strong>
            </p>
          </div>
          <div className="table-container" style={{ maxHeight: "18rem", overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NPM / NIM</th>
                  <th>KTM Status</th>
                  <th>Status KRS</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr) => (
                  <tr key={enr.id}>
                    <td style={{ fontWeight: 600 }}>{enr.student?.full_name ?? "—"}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{enr.student?.nim || `ID ${enr.student_id}`}</td>
                    <td>
                      <StatusBadge status="success" label="Terdaftar" />
                    </td>
                    <td>
                      <span className="badge badge-info">{enr.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form Tambah Mahasiswa ke Kelas (Admin only) */}
          {isAdmin && (
            <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>
                Daftarkan Mahasiswa Tambahan (KRS)
              </label>
              <form onSubmit={handleEnrollStudent} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select
                  className="form-select"
                  style={{ flex: 1 }}
                  value={studentToEnroll}
                  onChange={(e) => setStudentToEnroll(Number(e.target.value))}
                >
                  {allStudents
                    .filter((s) => !enrollments.some((e) => e.student_id === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.nim}) - Angkatan {s.batch_year}
                      </option>
                    ))}
                </select>
                <button type="submit" className="btn btn-primary btn-sm" disabled={enrolling}>
                  <Plus size={14} /> {enrolling ? "Mendaftarkan..." : "Daftarkan"}
                </button>
              </form>
            </div>
          )}
        </Modal>
      )}

      {/* Create Class Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buka Kelas Perkuliahan Baru">
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Nama / Kode Kelas</label>
            <input required placeholder="TI-2024-PAGI-B atau TEKFO. 1" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Mata Kuliah</label>
              <select className="form-select" value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: Number(e.target.value) })}>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select className="form-select" value={formData.term_id} onChange={e => setFormData({ ...formData, term_id: Number(e.target.value) })}>
                {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dosen Pengampu (Kewenangan Admin)</label>
            <select
              className="form-select"
              value={formData.lecturer_id}
              onChange={e => setFormData({ ...formData, lecturer_id: Number(e.target.value) })}
            >
              {lecturers.map(l => (
                <option key={l.id} value={l.id}>
                  {l.full_name ? `${l.full_name} (${l.nidn})` : `NIDN ${l.nidn}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ruang Kuliah & Lokasi Gedung</label>
            <select
              className="form-select"
              value={formData.room_id ?? ""}
              onChange={e => setFormData({ ...formData, room_id: e.target.value ? Number(e.target.value) : undefined })}
            >
              <option value="">-- Kelas Daring / Tanpa Ruangan --</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.kode}) {r.gedung ? `- ${r.gedung}` : ""} {r.lantai ? `Lt. ${r.lantai}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Hari Kuliah</label>
              <select className="form-select" value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: Number(e.target.value) })}>
                <option value={1}>Senin</option>
                <option value={2}>Selasa</option>
                <option value={3}>Rabu</option>
                <option value={4}>Kamis</option>
                <option value={5}>Jumat</option>
                <option value={6}>Sabtu</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Jam Mulai</label>
              <input required type="time" className="form-input" value={formData.start_time.slice(0, 5)} onChange={e => setFormData({ ...formData, start_time: `${e.target.value}:00` })} />
            </div>
            <div className="form-group">
              <label className="form-label">Jam Selesai</label>
              <input required type="time" className="form-input" value={formData.end_time.slice(0, 5)} onChange={e => setFormData({ ...formData, end_time: `${e.target.value}:00` })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Buka Kelas</button>
        </form>
      </Modal>

      {/* Edit Class / Reassign Lecturer Modal */}
      {editTarget && (
        <Modal isOpen onClose={() => setEditTarget(null)} title={`Atur Dosen & Jadwal Kelas — ${editTarget.name}`}>
          <form onSubmit={handleUpdate} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Nama / Kode Kelas</label>
              <input
                required
                className="form-input"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dosen Pengampu (Atur / Ganti Dosen)</label>
              <select
                className="form-select"
                value={editFormData.lecturer_id}
                onChange={(e) => setEditFormData({ ...editFormData, lecturer_id: Number(e.target.value) })}
              >
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name ? `${l.full_name} (${l.nidn})` : `NIDN ${l.nidn}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Mata Kuliah</label>
                <select
                  className="form-select"
                  value={editFormData.course_id}
                  onChange={(e) => setEditFormData({ ...editFormData, course_id: Number(e.target.value) })}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester / Tahun Ajaran</label>
                <select
                  className="form-select"
                  value={editFormData.term_id}
                  onChange={(e) => setEditFormData({ ...editFormData, term_id: Number(e.target.value) })}
                >
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ruang Kuliah & Lokasi Gedung</label>
              <select
                className="form-select"
                value={editFormData.room_id ?? ""}
                onChange={(e) => setEditFormData({ ...editFormData, room_id: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">-- Kelas Daring / Tanpa Ruangan --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.kode}) {r.gedung ? `- ${r.gedung}` : ""} {r.lantai ? `Lt. ${r.lantai}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Hari Kuliah</label>
                <select
                  className="form-select"
                  value={editFormData.day_of_week}
                  onChange={(e) => setEditFormData({ ...editFormData, day_of_week: Number(e.target.value) })}
                >
                  <option value={1}>Senin</option>
                  <option value={2}>Selasa</option>
                  <option value={3}>Rabu</option>
                  <option value={4}>Kamis</option>
                  <option value={5}>Jumat</option>
                  <option value={6}>Sabtu</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jam Mulai</label>
                <input
                  required
                  type="time"
                  className="form-input"
                  value={editFormData.start_time.slice(0, 5)}
                  onChange={(e) => setEditFormData({ ...editFormData, start_time: `${e.target.value}:00` })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jam Selesai</label>
                <input
                  required
                  type="time"
                  className="form-input"
                  value={editFormData.end_time.slice(0, 5)}
                  onChange={(e) => setEditFormData({ ...editFormData, end_time: `${e.target.value}:00` })}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="btn btn-outline" onClick={() => setEditTarget(null)}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary">
                Simpan Perubahan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// 4. People (Students & Lecturers) Directory
// ============================================================================
export function PeoplePage({ lecturer = false }: { lecturer?: boolean }) {
  const [items, setItems] = useState<(LecturerProfile | StudentProfile)[]>([]);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState<string>("all");
  const [classTypeFilter, setClassTypeFilter] = useState<string>("all");

  useEffect(() => {
    void Promise.all([
      lecturer ? lecturerApi.list({ limit: 200 }) : studentApi.list(0, 200),
      academicApi.getClasses(),
    ]).then(([pRes, cRes]) => {
      setItems((pRes.data as (LecturerProfile | StudentProfile)[]) ?? []);
      if (cRes.data) setClasses(cRes.data);
      setLoading(false);
    });
  }, [lecturer]);

  if (loading) return <LoadingSpinner text={lecturer ? "Memuat data dosen..." : "Memuat data mahasiswa..."} />;

  const filtered = items.filter(p => {
    if (lecturer) {
      const lec = p as LecturerProfile;
      const text = `${lec.full_name || ""} ${lec.nidn || ""} ${lec.department || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    } else {
      const stu = p as StudentProfile;
      if (cohortFilter !== "all") {
        const cNum = stu.academic_cohort ?? 1;
        if (cNum !== parseInt(cohortFilter, 10)) return false;
      }
      if (classTypeFilter !== "all") {
        const ct = stu.class_type || "REGULER_PAGI";
        if (ct !== classTypeFilter) return false;
      }
      const text = `${stu.full_name || ""} ${stu.nim || ""} ${stu.department || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    }
  });

  return (
    <div>
      <PageHeader
        title={lecturer ? "Direktori Dosen Pengajar" : "Direktori Mahasiswa"}
        subtitle={lecturer ? "Dosen pengampu Program Studi Teknik Informatika & penugasan kelas" : "Data mahasiswa, nomor induk, rombongan belajar (cohort TEKFO 1–8), dan status KTM/RFID"}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "16rem", maxWidth: "24rem" }}>
          <input
            type="text"
            placeholder={lecturer ? "Cari nama / NIDN dosen..." : "Cari nama / NPM mahasiswa..."}
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
          <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>

        {!lecturer && (
          <>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Tingkat (Cohort):</label>
              <select
                className="form-select"
                style={{ minWidth: "11rem" }}
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value)}
              >
                <option value="all">Semua Tingkat</option>
                <option value="1">TEKFO 1 (Smt 1)</option>
                <option value="2">TEKFO 2 (Smt 2)</option>
                <option value="3">TEKFO 3 (Smt 3)</option>
                <option value="4">TEKFO 4 (Smt 4)</option>
                <option value="5">TEKFO 5 (Smt 5)</option>
                <option value="6">TEKFO 6 (Smt 6)</option>
                <option value="7">TEKFO 7 (Smt 7)</option>
                <option value="8">TEKFO 8 (Smt 8)</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Jenis Kelas:</label>
              <select
                className="form-select"
                style={{ minWidth: "10rem" }}
                value={classTypeFilter}
                onChange={(e) => setClassTypeFilter(e.target.value)}
              >
                <option value="all">Semua Jenis</option>
                <option value="REGULER_PAGI">Reguler Pagi</option>
                <option value="REGULER_MALAM">Reguler Malam</option>
                <option value="REGULER_SHIFT">Reguler Shift</option>
              </select>
            </div>
          </>
        )}

        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "auto" }}>
          Total: <strong>{filtered.length}</strong> {lecturer ? "Dosen" : "Mahasiswa"}
        </span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Lengkap</th>
              <th>{lecturer ? "NIDN" : "NPM / NIM"}</th>
              <th>Program Studi & Tingkat</th>
              <th>{lecturer ? "Kelas yang Diampu" : "Kelompok Kelas"}</th>
              <th>{lecturer ? "Kontak" : "Status KTM & RFID"}</th>
              <th>Status Akun</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              if (lecturer) {
                const lec = item as LecturerProfile;
                const taughtClasses = classes.filter(c => c.lecturer_id === lec.id);
                return (
                  <tr key={lec.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{lec.full_name || "—"}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                        {lec.nidn}
                      </span>
                    </td>
                    <td>{lec.department || "Teknik Informatika"}</td>
                    <td>
                      {taughtClasses.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                          {taughtClasses.map(c => (
                            <span key={c.id} className="badge badge-info" style={{ fontSize: "0.725rem" }}>
                              {c.name} {c.course?.name ? `(${c.course.name})` : ""}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Belum ada kelas</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{lec.phone || "—"}</span>
                    </td>
                    <td>
                      <StatusBadge status="success" label="Aktif" />
                    </td>
                  </tr>
                );
              } else {
                const stu = item as StudentProfile;
                const cNum = stu.academic_cohort ?? 1;
                const classLabel = stu.class_type === "REGULER_MALAM"
                  ? "Reguler Malam"
                  : stu.class_type === "REGULER_SHIFT"
                    ? "Reguler Shift"
                    : "Reguler Pagi";

                return (
                  <tr key={stu.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{stu.full_name || "—"}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                        {stu.nim}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>{stu.department || "Teknik Informatika"}</span>
                        <span className="badge badge-info" style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                          TEKFO {cNum}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        Angkatan {stu.batch_year}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: "0.8rem" }}>
                        {classLabel}
                      </span>
                    </td>
                    <td>
                      {stu.ktm_status === "KTM_TERDAFTAR" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span className="badge badge-success">KTM Terdaftar</span>
                          {stu.rfid_uid && (
                            <code style={{ fontSize: "0.75rem", color: "var(--primary-light)" }}>
                              UID: {stu.rfid_uid}
                            </code>
                          )}
                        </div>
                      ) : stu.ktm_status === "BELUM_MEMILIKI_KTM" ? (
                        <span className="badge badge-warning">Belum Memiliki KTM</span>
                      ) : stu.ktm_status === "KTM_TIDAK_DIBAWA" ? (
                        <span className="badge badge-warning">KTM Tidak Dibawa</span>
                      ) : stu.ktm_status === "KTM_HILANG" ? (
                        <span className="badge badge-danger">KTM Hilang</span>
                      ) : stu.rfid_uid ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span className="badge badge-success">KTM Terhubung</span>
                          <code style={{ fontSize: "0.75rem", color: "var(--primary-light)" }}>{stu.rfid_uid}</code>
                        </div>
                      ) : (
                        <span className="badge badge-warning">Belum Ada KTM</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status="success" label="Aktif" />
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 5. IoT Devices Monitoring Page
// ============================================================================
export function DevicesPage() {
  const [items, setItems] = useState<SaditaDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadData = () => {
    setLoading(true);
    void deviceApi.list().then(r => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  };

  useEffect(() => {
    void deviceApi.list().then(r => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner text="Memeriksa status perangkat IoT..." />;

  return (
    <div>
      <PageHeader
        title="Perangkat Presensi IoT (ESP32-S3)"
        subtitle="Monitoring hardware, sensor RFID RC522, fingerprint AS608, dan broker MQTT"
        action={
          <button className="btn btn-secondary" onClick={loadData}>
            Segarkan
          </button>
        }
      />

      {error && <div style={{ color: "#ef4444", marginBottom: "0.75rem", fontSize: "0.85rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "1.25rem" }}>
        {items.map(d => (
          <div key={d.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "var(--radius-md)", background: "rgba(56, 189, 248, 0.12)", color: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Radio size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{d.nama}</h3>
                  <code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.device_id}</code>
                </div>
              </div>
              <StatusBadge status={d.status === "ACTIVE" ? "success" : "error"} label={d.status} />
            </div>

            <div style={{ display: "grid", gap: "0.4rem", fontSize: "0.825rem", color: "var(--text-secondary)", background: "rgba(0,0,0,0.2)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div>IP Address: <strong style={{ color: "var(--text-primary)" }}>{d.ip_address || "192.168.1.150"}</strong></div>
              <div>Firmware: <strong style={{ color: "var(--text-primary)" }}>{d.firmware_version || "v2.1.0-ESP32S3"}</strong></div>
              <div>Deskripsi: {d.keterangan || "Sensor RC522 SPI + AS608 UART + LCD I2C"}</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "auto" }}>
              <CheckCircle size={14} color="var(--success)" /> Terkoneksi ke broker Mosquitto localhost:1883
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 6. Attendance & Session Page
// ============================================================================
export function AttendancePage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selected, setSelected] = useState<number>();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void academicApi.getClasses().then(r => {
      setClasses(r.data ?? []);
      if (r.data && r.data.length > 0) {
        setSelected(r.data[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selected) {
      void attendanceApi.getSessions(selected).then(r => setSessions(r.data ?? []));
    }
  }, [selected]);

  if (loading) return <LoadingSpinner text="Memuat sesi presensi..." />;

  return (
    <div>
      <PageHeader
        title="Monitoring Sesi Presensi"
        subtitle="Riwayat pertemuan perkuliahan dan status pembukaan sesi tap RFID"
      />

      <div className="card" style={{ marginBottom: "0.85rem", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Pilih Kelas Perkuliahan:</label>
        <select
          className="form-select"
          style={{ maxWidth: "20rem" }}
          value={selected ?? ""}
          onChange={e => setSelected(Number(e.target.value))}
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.course?.name})</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pertemuan Ke-</th>
              <th>Tanggal</th>
              <th>Topik Bahasan</th>
              <th>Status Sesi</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(x => (
              <tr key={x.id}>
                <td style={{ fontWeight: 700 }}>Pertemuan {x.session_number}</td>
                <td>{x.date}</td>
                <td style={{ fontWeight: 500 }}>{x.topic || "—"}</td>
                <td>
                  <StatusBadge
                    status={x.status === "OPEN" ? "warning" : x.status === "CLOSED" ? "success" : "neutral"}
                    label={x.status === "OPEN" ? "Sesi Terbuka" : x.status === "CLOSED" ? "Selesai Ditutup" : "Terjadwal"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 7. LMS Materials & Assignments Page
// ============================================================================
export function LmsPage({ assignment = false }: { assignment?: boolean }) {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selected, setSelected] = useState<number>();
  const [items, setItems] = useState<(Assignment | CourseMaterial)[]>([]);
  const [loading, setLoading] = useState(true);

  // Student assignment PDF submission state
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    void academicApi.getClasses().then(r => {
      setClasses(r.data ?? []);
      if (r.data && r.data.length > 0) {
        setSelected(r.data[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selected) {
      if (assignment) {
        void lmsApi.getAssignments(selected).then(r => setItems(r.data ?? []));
      } else {
        void lmsApi.getMaterials(selected).then(r => setItems(r.data ?? []));
      }
    }
  }, [assignment, selected]);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTarget) return;
    if (!submitFile) {
      alert("Harap pilih berkas PDF untuk dikumpulkan.");
      return;
    }
    if (!submitFile.name.toLowerCase().endsWith(".pdf")) {
      alert("Format berkas harus berformat PDF (.pdf)!");
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);

    // 1. Upload PDF
    const uploadRes = await uploadApi.upload(submitFile);
    if (!uploadRes.data?.file_url) {
      setSubmitting(false);
      alert(uploadRes.error || "Gagal mengunggah berkas PDF.");
      return;
    }

    // 2. Submit assignment with file_url
    const res = await lmsApi.submitAssignment(submitTarget.id, {
      file_url: uploadRes.data.file_url,
      content: submitNotes.trim() || undefined,
    });
    setSubmitting(false);

    if (res.data) {
      setSubmitSuccess("Tugas PDF berhasil dikumpulkan!");
      setTimeout(() => {
        setSubmitTarget(null);
        setSubmitFile(null);
        setSubmitNotes("");
        setSubmitSuccess(null);
      }, 1500);
    } else {
      alert(res.error || "Gagal mengumpulkan tugas.");
    }
  };

  if (loading) return <LoadingSpinner text={assignment ? "Memuat tugas..." : "Memuat materi kuliah..."} />;

  return (
    <div>
      <PageHeader
        title={assignment ? "Manajemen Tugas & Penugasan" : "Manajemen Materi Perkuliahan"}
        subtitle={assignment ? "Tugas terstruktur kelas, pengumpulan berkas PDF, dan batas waktu" : "Dokumen modul, slide PPT perkuliahan, dan link pembelajaran"}
      />

      <div className="card" style={{ marginBottom: "0.85rem", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Pilih Kelas Perkuliahan:</label>
        <select
          className="form-select"
          style={{ maxWidth: "20rem" }}
          value={selected ?? ""}
          onChange={e => setSelected(Number(e.target.value))}
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.course?.name})</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>{assignment ? "Deadline / Batas Waktu" : "Format Materi"}</th>
              <th>{assignment ? "Skor Maksimal" : "Aksi"}</th>
              {assignment && <th>Kumpul Tugas</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x.id}>
                <td style={{ fontWeight: 600 }}>{x.title}</td>
                <td>
                  {assignment && "due_date" in x ? (
                    x.due_date.slice(0, 10)
                  ) : "material_type" in x ? (
                    <span className="badge badge-info">{x.material_type}</span>
                  ) : "—"}
                </td>
                <td>
                  {assignment && "max_score" in x ? (
                    <span className="badge badge-success">{x.max_score} Poin</span>
                  ) : "resource_url" in x && x.resource_url ? (
                    <a href={getFileUrl(x.resource_url)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                      Buka Dokumen
                    </a>
                  ) : "—"}
                </td>
                {assignment && "due_date" in x && (
                  <td>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSubmitTarget(x as Assignment);
                        setSubmitFile(null);
                        setSubmitNotes("");
                        setSubmitSuccess(null);
                      }}
                    >
                      <Upload size={14} /> Kirim PDF
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student PDF Submission Modal */}
      {submitTarget && (
        <Modal isOpen onClose={() => setSubmitTarget(null)} title={`Pengumpulan Tugas (PDF) — ${submitTarget.title}`}>
          <form onSubmit={handleSubmitAssignment} style={{ display: "grid", gap: "1rem" }}>
            {submitSuccess && (
              <div style={{ background: "#dcfce7", color: "#166534", padding: "0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600 }}>
                ✅ {submitSuccess}
              </div>
            )}

            {submitTarget.description && (
              <div style={{ fontSize: "0.875rem", background: "var(--bg-secondary, #f8fafc)", padding: "0.75rem", borderRadius: "0.375rem" }}>
                <strong>Petunjuk Tugas:</strong>
                <p style={{ margin: "0.25rem 0 0 0", color: "var(--text-secondary)" }}>{submitTarget.description}</p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Unggah Berkas Jawaban / Tugas (Wajib PDF)
              </label>
              <input
                required
                type="file"
                accept=".pdf,application/pdf"
                className="form-input"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && !f.name.toLowerCase().endsWith(".pdf")) {
                    alert("Berkas yang dipilih harus berformat PDF (.pdf)!");
                    e.target.value = "";
                    setSubmitFile(null);
                    return;
                  }
                  setSubmitFile(f);
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Materi kuliah dari dosen dapat berupa PPT/PDF, sedangkan pengumpulan tugas mahasiswa harus berformat <strong>.PDF</strong>.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan Tambahan (Opsional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Tuliskan catatan atau keterangan singkat bila ada..."
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button type="button" className="btn btn-outline" onClick={() => setSubmitTarget(null)}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Mengunggah & Mengirim…" : "Kirimkan Tugas (PDF)"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function HealthPage() {
  const [result, setResult] = useState<{
    status: string;
    timestamp?: string;
    components: {
      database?: { status: string; version?: string };
      mqtt?: { status: string; broker_host?: string; broker_port?: number };
    };
  }>();
  useEffect(() => {
    void healthApi.check().then(r => setResult(r.data));
  }, []);

  return (
    <div>
      <PageHeader title="Status Layanan & Healthcheck" subtitle="Kondisi backend FastAPI, PostgreSQL, dan broker MQTT" />
      {result && (
        <div className="stat-grid">
          <div className="card">
            <span className="stat-label">Backend Status</span>
            <div className="stat-number" style={{ color: "var(--success)" }}>{result.status}</div>
          </div>
          <div className="card">
            <span className="stat-label">PostgreSQL Database</span>
            <div className="stat-number" style={{ color: "var(--success)" }}>{result.components?.database?.status || "Connected"}</div>
          </div>
          <div className="card">
            <span className="stat-label">Mosquitto MQTT</span>
            <div className="stat-number" style={{ color: "var(--success)" }}>{result.components?.mqtt?.status || "Connected"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
