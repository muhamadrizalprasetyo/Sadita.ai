"use client";

import { useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import {
  Plus,
  Users,
  Radio,
  CheckCircle,
  Edit3,
  Upload,
  LayoutGrid,
  List,
  ExternalLink,
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
  type StudentProfile,
  type ClassRoom,
} from "@/lib/api";
import {
  Modal,
  StatusBadge,
  DataTable,
  useConfirm,
  type ColumnDef,
  type TableFilterDef,
} from "@/components/ui";

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
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
// 1. Terms / Semester Page with Reusable DataTable & Add Modal
// ============================================================================
export function TermsPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", start_date: "", end_date: "", is_active: true });

  // DataTable State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    void academicApi.getTerms().then((r) => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  }, []);

  const refreshData = () => {
    setLoading(true);
    void academicApi.getTerms().then((r) => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await academicApi.createTerm(formData);
    if (res.data) {
      setIsModalOpen(false);
      setFormData({ name: "", start_date: "", end_date: "", is_active: true });
      refreshData();
    } else {
      await confirm.alert(res.error || "Gagal menambah semester", "Gagal Menambah Semester", "danger");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = items.filter((x) => {
      if (statusFilter === "ACTIVE" && !x.is_active) return false;
      if (statusFilter === "INACTIVE" && x.is_active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!x.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA: string | boolean = "";
        let valB: string | boolean = "";
        if (sortKey === "name") {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortKey === "start_date") {
          valA = a.start_date;
          valB = b.start_date;
        } else if (sortKey === "end_date") {
          valA = a.end_date;
          valB = b.end_date;
        } else if (sortKey === "is_active") {
          valA = a.is_active ? "1" : "0";
          valB = b.is_active ? "1" : "0";
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [items, search, statusFilter, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const columns = useMemo<ColumnDef<AcademicTerm>[]>(
    () => [
      {
        key: "name",
        header: "Nama Semester",
        sortable: true,
        toggleable: false,
        render: (x) => (
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{x.name}</span>
        ),
      },
      {
        key: "start_date",
        header: "Tanggal Mulai",
        sortable: true,
        render: (x) => (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>{x.start_date}</span>
        ),
      },
      {
        key: "end_date",
        header: "Tanggal Selesai",
        sortable: true,
        render: (x) => (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>{x.end_date}</span>
        ),
      },
      {
        key: "is_active",
        header: "Status Berjalan",
        align: "center",
        sortable: true,
        render: (x) => (
          <StatusBadge
            status={x.is_active ? "success" : "neutral"}
            label={x.is_active ? "Aktif Berjalan" : "Selesai"}
          />
        ),
      },
    ],
    []
  );

  const filters: TableFilterDef[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status Semester",
        value: statusFilter,
        onChange: (v) => {
          setStatusFilter(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua Status" },
          { value: "ACTIVE", label: "Aktif Berjalan" },
          { value: "INACTIVE", label: "Selesai" },
        ],
      },
    ],
    [statusFilter]
  );

  return (
    <div style={{ display: "grid", gap: "12px" }}>
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

      <DataTable<AcademicTerm>
        columns={columns}
        data={paginatedData}
        loading={loading}
        loadingText="Memuat data tahun akademik…"
        emptyMessage="Tidak ada semester yang sesuai dengan pencarian atau filter."
        searchable
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Cari nama semester (contoh: Genap 2026)..."
        filters={filters}
        showColumnToggle
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        pagination={{
          currentPage,
          totalPages,
          perPage,
          onPageChange: setCurrentPage,
          onPerPageChange: (p) => {
            setPerPage(p);
            setCurrentPage(1);
          },
          totalRecords: filteredAndSorted.length,
        }}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Semester Baru">
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Nama Semester</label>
            <input
              required
              placeholder="Contoh: Genap 2026/2027"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Tanggal Mulai</label>
              <input
                required
                type="date"
                className="form-input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Selesai</label>
              <input
                required
                type="date"
                className="form-input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
            Simpan Semester
          </button>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 2. Courses / Mata Kuliah Page with Reusable DataTable & Add Modal
// ============================================================================
export function CoursesPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", credits: 3, semester_ke: 1, description: "" });

  // DataTable State
  const [search, setSearch] = useState("");
  const [sksFilter, setSksFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<string>("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    void academicApi.getCourses().then((r) => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  }, []);

  const refreshData = () => {
    setLoading(true);
    void academicApi.getCourses().then((r) => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await academicApi.createCourse(formData);
    if (res.data) {
      setIsModalOpen(false);
      setFormData({ code: "", name: "", credits: 3, semester_ke: 1, description: "" });
      refreshData();
    } else {
      await confirm.alert(res.error || "Gagal menambah mata kuliah", "Gagal Menambah Mata Kuliah", "danger");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = items.filter((c) => {
      if (sksFilter !== "ALL" && c.credits !== parseInt(sksFilter, 10)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";
        if (sortKey === "code") {
          valA = a.code.toLowerCase();
          valB = b.code.toLowerCase();
        } else if (sortKey === "name") {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortKey === "credits") {
          valA = a.credits;
          valB = b.credits;
        } else if (sortKey === "semester_ke") {
          valA = a.semester_ke || 0;
          valB = b.semester_ke || 0;
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [items, search, sksFilter, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        key: "code",
        header: "Kode MK",
        sortable: true,
        width: "120px",
        render: (x) => (
          <span style={{ fontWeight: 700, color: "var(--primary-light)", fontFamily: "var(--font-mono)" }}>
            {x.code}
          </span>
        ),
      },
      {
        key: "name",
        header: "Nama Mata Kuliah",
        sortable: true,
        toggleable: false,
        render: (x) => <span style={{ fontWeight: 600 }}>{x.name}</span>,
      },
      {
        key: "credits",
        header: "Bobot SKS",
        align: "center",
        sortable: true,
        width: "110px",
        render: (x) => <span className="badge badge-info">{x.credits} SKS</span>,
      },
      {
        key: "semester_ke",
        header: "Semester",
        align: "center",
        sortable: true,
        width: "100px",
        render: (x) => (
          <span className="badge badge-neutral" style={{ fontSize: "11px" }}>
            Smt {x.semester_ke || 1}
          </span>
        ),
      },
      {
        key: "description",
        header: "Deskripsi & Capaian Pembelajaran",
        sortable: false,
        render: (x) => (
          <span style={{ color: "var(--text-secondary)", fontSize: "0.825rem", maxWidth: "28rem", display: "inline-block" }}>
            {x.description || "—"}
          </span>
        ),
      },
    ],
    []
  );

  const filters: TableFilterDef[] = useMemo(
    () => [
      {
        key: "credits",
        label: "Bobot SKS",
        value: sksFilter,
        onChange: (v) => {
          setSksFilter(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua SKS" },
          { value: "2", label: "2 SKS" },
          { value: "3", label: "3 SKS" },
          { value: "4", label: "4 SKS" },
        ],
      },
    ],
    [sksFilter]
  );

  return (
    <div style={{ display: "grid", gap: "12px" }}>
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

      <DataTable<Course>
        columns={columns}
        data={paginatedData}
        loading={loading}
        loadingText="Memuat katalog mata kuliah…"
        emptyMessage="Tidak ada mata kuliah yang cocok dengan kata kunci atau filter."
        searchable
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Cari kode atau nama mata kuliah (contoh: IF201)..."
        filters={filters}
        showColumnToggle
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        pagination={{
          currentPage,
          totalPages,
          perPage,
          onPageChange: setCurrentPage,
          onPerPageChange: (p) => {
            setPerPage(p);
            setCurrentPage(1);
          },
          totalRecords: filteredAndSorted.length,
        }}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Mata Kuliah Baru">
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Kode MK</label>
              <input
                required
                placeholder="IF201"
                className="form-input"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nama Mata Kuliah</label>
              <input
                required
                placeholder="Pemrograman Web Modern"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Bobot SKS</label>
              <input
                required
                type="number"
                min="1"
                max="6"
                className="form-input"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Semester Rekomendasi</label>
              <input
                required
                type="number"
                min="1"
                max="8"
                className="form-input"
                value={formData.semester_ke}
                onChange={(e) => setFormData({ ...formData, semester_ke: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi & Capaian Pembelajaran</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Simpan Mata Kuliah
          </button>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 3. Classes / Kelas Kuliah Page with Reusable DataTable & Student Enrollment
// ============================================================================
export function ClassesPage({ mine = false }: { mine?: boolean }) {
  const confirm = useConfirm();
  const [items, setItems] = useState<CourseClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [lecturers, setLecturers] = useState<LecturerProfile[]>([]);
  const [rooms, setRooms] = useState<ClassRoom[]>([]);
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
    class_type: "REGULER_PAGI",
  });

  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [studentToEnroll, setStudentToEnroll] = useState<number>();
  const [enrolling, setEnrolling] = useState(false);

  // Edit class state
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

  // DataTable State
  const [search, setSearch] = useState<string>("");
  const [filterSemester, setFilterSemester] = useState<string>("ALL");
  const [filterDay, setFilterDay] = useState<string>("ALL");
  const [filterClassType, setFilterClassType] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Enrollment table search
  const [enrollSearch, setEnrollSearch] = useState("");

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const getCohortNumber = (name: string): number => {
    const match = name.match(/TEKFO\.?\s*(\d+)/i) || name.match(/TI-?(\d+)/i) || name.match(/Smt\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 999;
  };

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void Promise.all([
      academicApi.getClasses(),
      academicApi.getCourses(),
      academicApi.getTerms(),
      lecturerApi.list({ limit: 100 }),
      authApi.getMe(),
      academicApi.getRooms(),
    ]).then(([cRes, crsRes, tRes, lRes, uRes, rRes]) => {
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
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await academicApi.createClass(formData);
    if (res.data) {
      setIsModalOpen(false);
      await loadData();
    } else {
      await confirm.alert(res.error || "Gagal membuat kelas perkuliahan", "Gagal Membuat Kelas", "danger");
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
      await confirm.alert(res.error || "Gagal memperbarui dosen pengampu / jadwal kelas", "Gagal Memperbarui", "danger");
    }
  };

  const openEnrollments = async (c: CourseClass) => {
    setSelectedClass(c);
    setEnrollSearch("");
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
      await confirm.alert(res.error, "Gagal Menambah Mahasiswa", "danger");
    } else {
      const refreshed = await academicApi.getClassStudents(selectedClass.id);
      if (refreshed.data) setEnrollments(refreshed.data);
    }
    setEnrolling(false);
  };

  const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  const filteredAndSorted = useMemo(() => {
    let result = items.filter((x) => {
      if (filterSemester !== "ALL") {
        const cohortNum = getCohortNumber(x.name);
        if (cohortNum !== parseInt(filterSemester, 10)) return false;
      }
      if (filterDay !== "ALL") {
        if (x.day_of_week !== parseInt(filterDay, 10)) return false;
      }
      if (filterClassType !== "ALL") {
        const ct = x.class_type || "REGULER_PAGI";
        if (ct !== filterClassType) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchText = `${x.name} ${x.course?.name || ""} ${x.course?.code || ""} ${x.lecturer?.full_name || ""} ${x.lecturer?.nidn || ""} ${x.room?.name || ""}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }
      return true;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";
        if (sortKey === "name") {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortKey === "course") {
          valA = (a.course?.name || "").toLowerCase();
          valB = (b.course?.name || "").toLowerCase();
        } else if (sortKey === "lecturer") {
          valA = (a.lecturer?.full_name || "").toLowerCase();
          valB = (b.lecturer?.full_name || "").toLowerCase();
        } else if (sortKey === "schedule") {
          valA = a.day_of_week * 10000 + parseInt((a.start_time || "00").replace(/:/g, ""), 10);
          valB = b.day_of_week * 10000 + parseInt((b.start_time || "00").replace(/:/g, ""), 10);
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, search, filterSemester, filterDay, filterClassType, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const isAdmin = !mine && currentUser?.role === "ADMIN";

  const columns = useMemo<ColumnDef<CourseClass>[]>(
    () => [
      {
        key: "name",
        header: "Kode / Nama Kelas",
        sortable: true,
        toggleable: false,
        width: "160px",
        render: (x) => (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{x.name}</span>
            <span style={{ fontSize: "10.5px", color: "var(--muted)" }}>
              {x.class_type ? x.class_type.replace("_", " ") : "REGULER PAGI"}
            </span>
          </div>
        ),
      },
      {
        key: "course",
        header: "Mata Kuliah",
        sortable: true,
        render: (x) => (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 600 }}>{x.course?.name || "Mata Kuliah"}</span>
            {x.course?.code && (
              <span style={{ fontSize: "11px", color: "var(--primary-light)", fontFamily: "var(--font-mono)" }}>
                {x.course.code} • {x.course.credits} SKS
              </span>
            )}
          </div>
        ),
      },
      {
        key: "lecturer",
        header: "Dosen Pengampu",
        sortable: true,
        render: (x) => (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {x.lecturer?.full_name ?? (x.lecturer?.nidn ? `NIDN ${x.lecturer.nidn}` : "Dosen Pengampu")}
            </span>
            {x.lecturer?.nidn && (
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                NIDN: {x.lecturer.nidn}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "room",
        header: "Ruang & Lokasi",
        sortable: false,
        render: (x) =>
          x.room ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {x.room.name} {x.room.code ? `(${x.room.code})` : ""}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {x.room.building || "Gedung Utama"} {x.room.floor ? `• Lt. ${x.room.floor}` : ""}
              </span>
            </div>
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Daring / Belum Ada Ruang</span>
          ),
      },
      {
        key: "schedule",
        header: "Jadwal Perkuliahan",
        sortable: true,
        render: (x) => (
          <span style={{ fontSize: "12.5px" }}>
            {dayNames[x.day_of_week] || `Hari ${x.day_of_week}`}, {x.start_time.slice(0, 5)} - {x.end_time.slice(0, 5)} WIB
          </span>
        ),
      },
      {
        key: "actions",
        header: "Aksi",
        align: "right",
        sortable: false,
        toggleable: false,
        render: (x) => (
          <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => openEdit(x)}
                title="Atur dosen pengampu & jadwal"
              >
                <Edit3 size={13} /> Atur Dosen
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => openEnrollments(x)}>
              <Users size={13} /> Mahasiswa
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAdmin]
  );

  const filters: TableFilterDef[] = useMemo(
    () => [
      {
        key: "semester",
        label: "Semester / Tingkat",
        value: filterSemester,
        onChange: (v) => {
          setFilterSemester(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua Tingkat" },
          { value: "1", label: "Semester 1 (TEKFO 1)" },
          { value: "2", label: "Semester 2 (TEKFO 2)" },
          { value: "3", label: "Semester 3 (TEKFO 3)" },
          { value: "4", label: "Semester 4 (TEKFO 4)" },
          { value: "5", label: "Semester 5 (TEKFO 5)" },
          { value: "6", label: "Semester 6 (TEKFO 6)" },
          { value: "7", label: "Semester 7 (TEKFO 7)" },
          { value: "8", label: "Semester 8 (TEKFO 8)" },
        ],
      },
      {
        key: "day",
        label: "Hari Kuliah",
        value: filterDay,
        onChange: (v) => {
          setFilterDay(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua Hari" },
          { value: "1", label: "Senin" },
          { value: "2", label: "Selasa" },
          { value: "3", label: "Rabu" },
          { value: "4", label: "Kamis" },
          { value: "5", label: "Jumat" },
          { value: "6", label: "Sabtu" },
        ],
      },
      {
        key: "class_type",
        label: "Jenis Kelas",
        value: filterClassType,
        onChange: (v) => {
          setFilterClassType(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua Jenis" },
          { value: "REGULER_PAGI", label: "Reguler Pagi" },
          { value: "REGULER_MALAM", label: "Reguler Malam" },
          { value: "REGULER_SHIFT", label: "Reguler Shift" },
        ],
      },
    ],
    [filterSemester, filterDay, filterClassType]
  );

  // Enrollment columns inside Modal
  const enrollmentColumns = useMemo<ColumnDef<ClassEnrollment>[]>(
    () => [
      {
        key: "student",
        header: "Nama Mahasiswa",
        sortable: true,
        toggleable: false,
        render: (enr) => <span style={{ fontWeight: 600 }}>{enr.student?.full_name ?? "—"}</span>,
      },
      {
        key: "nim",
        header: "NPM / NIM",
        sortable: true,
        render: (enr) => (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            {enr.student?.nim || `ID ${enr.student_id}`}
          </span>
        ),
      },
      {
        key: "ktm_status",
        header: "Status KTM",
        align: "center",
        render: (enr) => (
          <StatusBadge
            status={enr.student?.rfid_uid ? "success" : "warning"}
            label={enr.student?.rfid_uid ? "KTM Terhubung" : "Belum Ada KTM"}
          />
        ),
      },
      {
        key: "status",
        header: "Status KRS",
        align: "center",
        render: (enr) => <span className="badge badge-info">{enr.status}</span>,
      },
    ],
    []
  );

  const filteredEnrollments = useMemo(() => {
    if (!enrollSearch.trim()) return enrollments;
    const q = enrollSearch.toLowerCase();
    return enrollments.filter(
      (enr) =>
        (enr.student?.full_name && enr.student.full_name.toLowerCase().includes(q)) ||
        (enr.student?.nim && enr.student.nim.toLowerCase().includes(q))
    );
  }, [enrollments, enrollSearch]);

  return (
    <div style={{ display: "grid", gap: "12px" }}>
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

      <DataTable<CourseClass>
        columns={columns}
        data={paginatedData}
        loading={loading}
        loadingText="Memuat data kelas perkuliahan…"
        emptyMessage="Tidak ada kelas perkuliahan yang cocok dengan kriteria pencarian."
        searchable
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Cari kelas, mata kuliah, atau dosen..."
        filters={filters}
        showColumnToggle
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        pagination={{
          currentPage,
          totalPages,
          perPage,
          onPageChange: setCurrentPage,
          onPerPageChange: (p) => {
            setPerPage(p);
            setCurrentPage(1);
          },
          totalRecords: filteredAndSorted.length,
        }}
      />

      {/* Enrollment Modal */}
      {selectedClass && (
        <Modal
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          title={`Mahasiswa Kelas ${selectedClass.name} (${selectedClass.course?.name || "Mata Kuliah"})`}
        >
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Total Mahasiswa Terdaftar KRS: <strong>{enrollments.length} orang</strong>
            </p>
          </div>

          <DataTable<ClassEnrollment>
            columns={enrollmentColumns}
            data={filteredEnrollments}
            loading={false}
            emptyMessage="Belum ada mahasiswa yang terdaftar di kelas ini."
            searchable
            searchQuery={enrollSearch}
            onSearchChange={setEnrollSearch}
            searchPlaceholder="Cari nama atau NIM mahasiswa..."
          />

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
            <input
              required
              placeholder="TI-2024-PAGI-B atau TEKFO. 1"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Mata Kuliah</label>
              <select
                className="form-select"
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: Number(e.target.value) })}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select
                className="form-select"
                value={formData.term_id}
                onChange={(e) => setFormData({ ...formData, term_id: Number(e.target.value) })}
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
            <label className="form-label">Dosen Pengampu (Kewenangan Admin)</label>
            <select
              className="form-select"
              value={formData.lecturer_id}
              onChange={(e) => setFormData({ ...formData, lecturer_id: Number(e.target.value) })}
            >
              {lecturers.map((l) => (
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
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value ? Number(e.target.value) : undefined })}
            >
              <option value="">-- Kelas Daring / Tanpa Ruangan --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.code ? `(${r.code})` : ""} {r.building ? `- ${r.building}` : ""} {r.floor ? `Lt. ${r.floor}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Hari Kuliah</label>
              <select
                className="form-select"
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: Number(e.target.value) })}
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
                value={formData.start_time.slice(0, 5)}
                onChange={(e) => setFormData({ ...formData, start_time: `${e.target.value}:00` })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Jam Selesai</label>
              <input
                required
                type="time"
                className="form-input"
                value={formData.end_time.slice(0, 5)}
                onChange={(e) => setFormData({ ...formData, end_time: `${e.target.value}:00` })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Buka Kelas
          </button>
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
                    {r.name} {r.code ? `(${r.code})` : ""} {r.building ? `- ${r.building}` : ""} {r.floor ? `Lt. ${r.floor}` : ""}
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
// 4. People (Students & Lecturers) Directory with Reusable DataTable
// ============================================================================
export function PeoplePage({ lecturer = false }: { lecturer?: boolean }) {
  const [items, setItems] = useState<(LecturerProfile | StudentProfile)[]>([]);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [loading, setLoading] = useState(true);

  // DataTable State
  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState<string>("ALL");
  const [classTypeFilter, setClassTypeFilter] = useState<string>("ALL");
  const [ktmFilter, setKtmFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<string>("full_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

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

  const filteredAndSorted = useMemo(() => {
    let result = items.filter((p) => {
      if (lecturer) {
        const lec = p as LecturerProfile;
        if (search.trim()) {
          const text = `${lec.full_name || ""} ${lec.nidn || ""} ${lec.department || ""}`.toLowerCase();
          if (!text.includes(search.toLowerCase())) return false;
        }
        return true;
      } else {
        const stu = p as StudentProfile;
        if (cohortFilter !== "ALL") {
          const cNum = stu.academic_cohort ?? 1;
          if (cNum !== parseInt(cohortFilter, 10)) return false;
        }
        if (classTypeFilter !== "ALL") {
          const ct = stu.class_type || "REGULER_PAGI";
          if (ct !== classTypeFilter) return false;
        }
        if (ktmFilter !== "ALL") {
          if (ktmFilter === "TERDAFTAR" && !(stu.ktm_status === "KTM_TERDAFTAR" || stu.rfid_uid)) return false;
          if (ktmFilter === "BELUM" && (stu.ktm_status === "KTM_TERDAFTAR" || stu.rfid_uid)) return false;
        }
        if (search.trim()) {
          const text = `${stu.full_name || ""} ${stu.nim || ""} ${stu.department || ""}`.toLowerCase();
          if (!text.includes(search.toLowerCase())) return false;
        }
        return true;
      }
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA = "";
        let valB = "";
        if (sortKey === "full_name") {
          valA = (a.full_name || "").toLowerCase();
          valB = (b.full_name || "").toLowerCase();
        } else if (sortKey === "id_num") {
          valA = (lecturer ? (a as LecturerProfile).nidn : (a as StudentProfile).nim) || "";
          valB = (lecturer ? (b as LecturerProfile).nidn : (b as StudentProfile).nim) || "";
        } else if (sortKey === "department") {
          valA = (a.department || "").toLowerCase();
          valB = (b.department || "").toLowerCase();
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, lecturer, search, cohortFilter, classTypeFilter, ktmFilter, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const lecturerColumns = useMemo<ColumnDef<LecturerProfile>[]>(
    () => [
      {
        key: "full_name",
        header: "Nama Dosen",
        sortable: true,
        toggleable: false,
        render: (lec) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{lec.full_name || "—"}</span>,
      },
      {
        key: "id_num",
        header: "NIDN",
        sortable: true,
        render: (lec) => (
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)", fontSize: "12.5px" }}>
            {lec.nidn}
          </span>
        ),
      },
      {
        key: "department",
        header: "Program Studi",
        sortable: true,
        render: (lec) => <span>{lec.department || "Teknik Informatika"}</span>,
      },
      {
        key: "classes",
        header: "Kelas yang Diampu",
        sortable: false,
        render: (lec) => {
          const taughtClasses = classes.filter((c) => c.lecturer_id === lec.id);
          return taughtClasses.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {taughtClasses.map((c) => (
                <span key={c.id} className="badge badge-info" style={{ fontSize: "0.725rem" }}>
                  {c.name} {c.course?.name ? `(${c.course.name})` : ""}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Belum ada kelas</span>
          );
        },
      },
      {
        key: "phone",
        header: "Kontak / No. HP",
        sortable: false,
        render: (lec) => <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{lec.phone || "—"}</span>,
      },
      {
        key: "status",
        header: "Status Akun",
        align: "center",
        render: () => <StatusBadge status="success" label="Aktif" />,
      },
    ],
    [classes]
  );

  const studentColumns = useMemo<ColumnDef<StudentProfile>[]>(
    () => [
      {
        key: "full_name",
        header: "Nama Mahasiswa",
        sortable: true,
        toggleable: false,
        render: (stu) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{stu.full_name || "—"}</span>,
      },
      {
        key: "id_num",
        header: "NPM / NIM",
        sortable: true,
        render: (stu) => (
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)", fontSize: "12.5px" }}>
            {stu.nim}
          </span>
        ),
      },
      {
        key: "department",
        header: "Program Studi & Tingkat",
        sortable: true,
        render: (stu) => {
          const cNum = stu.academic_cohort ?? 1;
          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>{stu.department || "Teknik Informatika"}</span>
                <span className="badge badge-info" style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                  TEKFO {cNum}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Angkatan {stu.batch_year}</div>
            </div>
          );
        },
      },
      {
        key: "class_type",
        header: "Kelompok Kelas",
        sortable: false,
        render: (stu) => {
          const classLabel =
            stu.class_type === "REGULER_MALAM"
              ? "Reguler Malam"
              : stu.class_type === "REGULER_SHIFT"
                ? "Reguler Shift"
                : "Reguler Pagi";
          return (
            <span className="badge badge-neutral" style={{ fontSize: "0.8rem" }}>
              {classLabel}
            </span>
          );
        },
      },
      {
        key: "ktm_status",
        header: "Status KTM & RFID",
        sortable: false,
        render: (stu) => {
          if (stu.ktm_status === "KTM_TERDAFTAR" || stu.rfid_uid) {
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                <span className="badge badge-success">KTM Terhubung</span>
                {stu.rfid_uid && (
                  <code style={{ fontSize: "0.75rem", color: "var(--primary-light)" }}>UID: {stu.rfid_uid}</code>
                )}
              </div>
            );
          }
          if (stu.ktm_status === "KTM_HILANG") {
            return <span className="badge badge-danger">KTM Hilang</span>;
          }
          if (stu.ktm_status === "KTM_TIDAK_DIBAWA") {
            return <span className="badge badge-warning">KTM Tidak Dibawa</span>;
          }
          return <span className="badge badge-warning">Belum Ada KTM</span>;
        },
      },
      {
        key: "status",
        header: "Status Akun",
        align: "center",
        render: () => <StatusBadge status="success" label="Aktif" />,
      },
    ],
    []
  );

  const studentFilters: TableFilterDef[] = useMemo(
    () => [
      {
        key: "cohort",
        label: "Tingkat (Cohort)",
        value: cohortFilter,
        onChange: (v) => {
          setCohortFilter(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua Tingkat" },
          { value: "1", label: "TEKFO 1 (Smt 1)" },
          { value: "2", label: "TEKFO 2 (Smt 2)" },
          { value: "3", label: "TEKFO 3 (Smt 3)" },
          { value: "4", label: "TEKFO 4 (Smt 4)" },
          { value: "5", label: "TEKFO 5 (Smt 5)" },
          { value: "6", label: "TEKFO 6 (Smt 6)" },
          { value: "7", label: "TEKFO 7 (Smt 7)" },
          { value: "8", label: "TEKFO 8 (Smt 8)" },
        ],
      },
      {
        key: "class_type",
        label: "Jenis Kelas",
        value: classTypeFilter,
        onChange: (v) => {
          setClassTypeFilter(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua Jenis" },
          { value: "REGULER_PAGI", label: "Reguler Pagi" },
          { value: "REGULER_MALAM", label: "Reguler Malam" },
          { value: "REGULER_SHIFT", label: "Reguler Shift" },
        ],
      },
      {
        key: "ktm",
        label: "Status KTM",
        value: ktmFilter,
        onChange: (v) => {
          setKtmFilter(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua Status KTM" },
          { value: "TERDAFTAR", label: "KTM Terhubung" },
          { value: "BELUM", label: "Belum Ada KTM" },
        ],
      },
    ],
    [cohortFilter, classTypeFilter, ktmFilter]
  );

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <PageHeader
        title={lecturer ? "Direktori Dosen Pengajar" : "Direktori Mahasiswa"}
        subtitle={
          lecturer
            ? "Dosen pengampu Program Studi Teknik Informatika & penugasan kelas"
            : "Data mahasiswa, nomor induk, rombongan belajar (cohort TEKFO 1–8), dan status KTM/RFID"
        }
      />

      {lecturer ? (
        <DataTable<LecturerProfile>
          columns={lecturerColumns}
          data={paginatedData as LecturerProfile[]}
          loading={loading}
          loadingText="Memuat data dosen…"
          emptyMessage="Tidak ada dosen yang cocok dengan kriteria pencarian."
          searchable
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setCurrentPage(1);
          }}
          searchPlaceholder="Cari nama, NIDN, atau prodi dosen..."
          showColumnToggle
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            onPageChange: setCurrentPage,
            onPerPageChange: (p) => {
              setPerPage(p);
              setCurrentPage(1);
            },
            totalRecords: filteredAndSorted.length,
          }}
        />
      ) : (
        <DataTable<StudentProfile>
          columns={studentColumns}
          data={paginatedData as StudentProfile[]}
          loading={loading}
          loadingText="Memuat direktori mahasiswa…"
          emptyMessage="Tidak ada mahasiswa yang cocok dengan kriteria pencarian."
          searchable
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setCurrentPage(1);
          }}
          searchPlaceholder="Cari nama atau NPM mahasiswa..."
          filters={studentFilters}
          showColumnToggle
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            onPageChange: setCurrentPage,
            onPerPageChange: (p) => {
              setPerPage(p);
              setCurrentPage(1);
            },
            totalRecords: filteredAndSorted.length,
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// 5. IoT Devices Monitoring Page with Reusable DataTable & View Switcher
// ============================================================================
export function DevicesPage() {
  const [items, setItems] = useState<SaditaDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // DataTable State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<string>("nama");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    void deviceApi.list().then((r) => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  }, []);

  const refreshData = () => {
    setLoading(true);
    void deviceApi.list().then((r) => {
      setItems(r.data ?? []);
      setError(r.error);
      setLoading(false);
    });
  };

  const filteredAndSorted = useMemo(() => {
    let result = items.filter((d) => {
      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = d.nama.toLowerCase().includes(q) || d.device_id.toLowerCase().includes(q) || (d.ip_address || "").includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA = "";
        let valB = "";
        if (sortKey === "nama") {
          valA = a.nama.toLowerCase();
          valB = b.nama.toLowerCase();
        } else if (sortKey === "device_id") {
          valA = a.device_id.toLowerCase();
          valB = b.device_id.toLowerCase();
        } else if (sortKey === "status") {
          valA = a.status;
          valB = b.status;
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [items, search, statusFilter, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const columns = useMemo<ColumnDef<SaditaDevice>[]>(
    () => [
      {
        key: "nama",
        header: "Nama Perangkat",
        sortable: true,
        toggleable: false,
        render: (d) => (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="rounded-md"
              style={{
                width: "32px",
                height: "32px",
                background: "rgba(56, 189, 248, 0.12)",
                color: "var(--primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Radio size={16} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{d.nama}</span>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                ID: {d.device_id}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "ip_address",
        header: "IP Address",
        sortable: false,
        render: (d) => (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>
            {d.ip_address || "192.168.1.150"}
          </span>
        ),
      },
      {
        key: "firmware_version",
        header: "Firmware",
        sortable: false,
        render: (d) => (
          <span className="badge badge-neutral" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
            {d.firmware_version || "v2.1.0-ESP32S3"}
          </span>
        ),
      },
      {
        key: "keterangan",
        header: "Sensor & Konfigurasi",
        sortable: false,
        render: (d) => (
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {d.keterangan || "Sensor RC522 SPI + AS608 UART + LCD I2C"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status Koneksi",
        align: "center",
        sortable: true,
        render: (d) => (
          <StatusBadge
            status={d.status === "ACTIVE" ? "success" : "error"}
            label={d.status === "ACTIVE" ? "Online" : "Offline"}
          />
        ),
      },
      {
        key: "mqtt",
        header: "Broker MQTT",
        align: "center",
        sortable: false,
        render: () => (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--success)" }}>
            <CheckCircle size={13} /> Terhubung
          </div>
        ),
      },
    ],
    []
  );

  const filters: TableFilterDef[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status Koneksi",
        value: statusFilter,
        onChange: (v) => {
          setStatusFilter(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua Status" },
          { value: "ACTIVE", label: "Online (Aktif)" },
          { value: "OFFLINE", label: "Offline" },
        ],
      },
    ],
    [statusFilter]
  );

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <PageHeader
        title="Perangkat Presensi IoT (ESP32-S3)"
        subtitle="Monitoring hardware, sensor RFID RC522, fingerprint AS608, dan broker MQTT"
        action={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "inline-flex", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "2px" }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "table" ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "6px" }}
                onClick={() => setViewMode("table")}
                title="Tampilan Tabel"
              >
                <List size={14} /> Tabel
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "6px" }}
                onClick={() => setViewMode("grid")}
                title="Tampilan Kartu"
              >
                <LayoutGrid size={14} /> Kartu
              </button>
            </div>
            <button className="btn btn-secondary btn-sm rounded-md" onClick={refreshData}>
              Segarkan
            </button>
          </div>
        }
      />

      {error && <div style={{ color: "#ef4444", marginBottom: "0.75rem", fontSize: "0.85rem" }}>{error}</div>}

      {viewMode === "table" ? (
        <DataTable<SaditaDevice>
          columns={columns}
          data={paginatedData}
          loading={loading}
          loadingText="Memeriksa status perangkat IoT…"
          emptyMessage="Tidak ada perangkat presensi IoT yang cocok dengan kriteria."
          searchable
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setCurrentPage(1);
          }}
          searchPlaceholder="Cari nama atau ID perangkat..."
          filters={filters}
          showColumnToggle
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            onPageChange: setCurrentPage,
            onPerPageChange: (p) => {
              setPerPage(p);
              setCurrentPage(1);
            },
            totalRecords: filteredAndSorted.length,
          }}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "1.25rem" }}>
          {items.map((d) => (
            <div key={d.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    className="rounded-md"
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      background: "rgba(56, 189, 248, 0.12)",
                      color: "var(--primary-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Radio size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{d.nama}</h3>
                    <code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.device_id}</code>
                  </div>
                </div>
                <StatusBadge status={d.status === "ACTIVE" ? "success" : "error"} label={d.status} />
              </div>

              <div
                className="rounded-md"
                style={{
                  display: "grid",
                  gap: "0.4rem",
                  fontSize: "0.825rem",
                  color: "var(--text-secondary)",
                  background: "rgba(0,0,0,0.2)",
                  padding: "0.85rem",
                }}
              >
                <div>
                  IP Address: <strong style={{ color: "var(--text-primary)" }}>{d.ip_address || "192.168.1.150"}</strong>
                </div>
                <div>
                  Firmware: <strong style={{ color: "var(--text-primary)" }}>{d.firmware_version || "v2.1.0-ESP32S3"}</strong>
                </div>
                <div>Deskripsi: {d.keterangan || "Sensor RC522 SPI + AS608 UART + LCD I2C"}</div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "auto",
                }}
              >
                <CheckCircle size={14} color="var(--success)" /> Terkoneksi ke broker Mosquitto localhost:1883
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. Attendance & Session Page with Reusable DataTable
// ============================================================================
export function AttendancePage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selected, setSelected] = useState<number>();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  // DataTable State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<string>("session_number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    void academicApi.getClasses().then((r) => {
      setClasses(r.data ?? []);
      if (r.data && r.data.length > 0) {
        setSelected(r.data[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selected) {
      void attendanceApi.getSessions(selected).then((r) => setSessions(r.data ?? []));
    }
  }, [selected]);

  const filteredAndSorted = useMemo(() => {
    let result = sessions.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = (s.topic && s.topic.toLowerCase().includes(q)) || s.date.includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";
        if (sortKey === "session_number") {
          valA = a.session_number;
          valB = b.session_number;
        } else if (sortKey === "date") {
          valA = a.date;
          valB = b.date;
        } else if (sortKey === "topic") {
          valA = (a.topic || "").toLowerCase();
          valB = (b.topic || "").toLowerCase();
        } else if (sortKey === "status") {
          valA = a.status;
          valB = b.status;
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [sessions, search, statusFilter, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const columns = useMemo<ColumnDef<AttendanceSession>[]>(
    () => [
      {
        key: "session_number",
        header: "Pertemuan Ke-",
        sortable: true,
        toggleable: false,
        width: "140px",
        render: (x) => <span style={{ fontWeight: 700 }}>Pertemuan {x.session_number}</span>,
      },
      {
        key: "date",
        header: "Tanggal",
        sortable: true,
        width: "130px",
        render: (x) => <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>{x.date}</span>,
      },
      {
        key: "topic",
        header: "Topik Bahasan",
        sortable: true,
        render: (x) => <span style={{ fontWeight: 500 }}>{x.topic || "—"}</span>,
      },
      {
        key: "status",
        header: "Status Sesi",
        align: "center",
        sortable: true,
        width: "140px",
        render: (x) => (
          <StatusBadge
            status={x.status === "OPEN" ? "warning" : x.status === "CLOSED" ? "success" : "neutral"}
            label={x.status === "OPEN" ? "Sesi Terbuka" : x.status === "CLOSED" ? "Selesai Ditutup" : "Terjadwal"}
          />
        ),
      },
    ],
    []
  );

  const filters: TableFilterDef[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status Sesi",
        value: statusFilter,
        onChange: (v) => {
          setStatusFilter(v);
          setCurrentPage(1);
        },
        options: [
          { value: "ALL", label: "Semua Status" },
          { value: "OPEN", label: "Sesi Terbuka" },
          { value: "CLOSED", label: "Selesai Ditutup" },
          { value: "SCHEDULED", label: "Terjadwal" },
        ],
      },
    ],
    [statusFilter]
  );

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <PageHeader
        title="Monitoring Sesi Presensi"
        subtitle="Riwayat pertemuan perkuliahan dan status pembukaan sesi tap RFID"
      />

      <div
        className="card"
        style={{
          padding: "0.65rem 0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Pilih Kelas Perkuliahan:</label>
        <select
          className="form-select"
          style={{ maxWidth: "20rem" }}
          value={selected ?? ""}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.course?.name})
            </option>
          ))}
        </select>
      </div>

      <DataTable<AttendanceSession>
        columns={columns}
        data={paginatedData}
        loading={loading}
        loadingText="Memuat sesi presensi…"
        emptyMessage="Belum ada sesi presensi untuk kelas yang dipilih."
        searchable
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Cari topik atau tanggal pertemuan..."
        filters={filters}
        showColumnToggle
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        pagination={{
          currentPage,
          totalPages,
          perPage,
          onPageChange: setCurrentPage,
          onPerPageChange: (p) => {
            setPerPage(p);
            setCurrentPage(1);
          },
          totalRecords: filteredAndSorted.length,
        }}
      />
    </div>
  );
}

// ============================================================================
// 7. LMS Materials & Assignments Page with Reusable DataTable
// ============================================================================
export function LmsPage({ assignment = false }: { assignment?: boolean }) {
  const confirm = useConfirm();
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

  // DataTable State
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    void academicApi.getClasses().then((r) => {
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
        void lmsApi.getAssignments(selected).then((r) => setItems(r.data ?? []));
      } else {
        void lmsApi.getMaterials(selected).then((r) => setItems(r.data ?? []));
      }
    }
  }, [assignment, selected]);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTarget) return;
    if (!submitFile) {
      await confirm.alert("Harap pilih berkas PDF untuk dikumpulkan.", "Pilih Berkas", "warning");
      return;
    }
    if (!submitFile.name.toLowerCase().endsWith(".pdf")) {
      await confirm.alert("Format berkas harus berformat PDF (.pdf)!", "Format Berkas Tidak Sesuai", "warning");
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);

    // 1. Upload PDF
    const uploadRes = await uploadApi.upload(submitFile);
    if (!uploadRes.data?.file_url) {
      setSubmitting(false);
      await confirm.alert(uploadRes.error || "Gagal mengunggah berkas PDF.", "Gagal Mengunggah", "danger");
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
      await confirm.alert(res.error || "Gagal mengumpulkan tugas.", "Gagal Mengumpulkan", "danger");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = items.filter((x) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!x.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";
        if (sortKey === "title") {
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, search, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const assignmentColumns = useMemo<ColumnDef<Assignment>[]>(
    () => [
      {
        key: "title",
        header: "Judul Penugasan",
        sortable: true,
        toggleable: false,
        render: (x) => <span style={{ fontWeight: 600 }}>{x.title}</span>,
      },
      {
        key: "due_date",
        header: "Batas Waktu (Deadline)",
        sortable: true,
        width: "160px",
        render: (x) => (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>
            {x.due_date ? x.due_date.slice(0, 10) : "—"}
          </span>
        ),
      },
      {
        key: "max_score",
        header: "Skor Maksimal",
        align: "center",
        sortable: false,
        width: "130px",
        render: (x) => <span className="badge badge-success">{x.max_score} Poin</span>,
      },
      {
        key: "actions",
        header: "Aksi Pengumpulan",
        align: "right",
        sortable: false,
        toggleable: false,
        render: (x) => (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSubmitTarget(x);
              setSubmitFile(null);
              setSubmitNotes("");
              setSubmitSuccess(null);
            }}
          >
            <Upload size={13} /> Kirim PDF
          </button>
        ),
      },
    ],
    []
  );

  const materialColumns = useMemo<ColumnDef<CourseMaterial>[]>(
    () => [
      {
        key: "title",
        header: "Judul Materi",
        sortable: true,
        toggleable: false,
        render: (x) => <span style={{ fontWeight: 600 }}>{x.title}</span>,
      },
      {
        key: "material_type",
        header: "Format Materi",
        sortable: true,
        align: "center",
        width: "130px",
        render: (x) => <span className="badge badge-info">{x.material_type}</span>,
      },
      {
        key: "actions",
        header: "Tautan Berkas",
        align: "right",
        sortable: false,
        toggleable: false,
        render: (x) =>
          x.resource_url ? (
            <a
              href={getFileUrl(x.resource_url)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ExternalLink size={13} /> Buka Dokumen
            </a>
          ) : (
            <span style={{ color: "var(--muted)", fontSize: "12px" }}>—</span>
          ),
      },
    ],
    []
  );

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <PageHeader
        title={assignment ? "Manajemen Tugas & Penugasan" : "Manajemen Materi Perkuliahan"}
        subtitle={
          assignment
            ? "Tugas terstruktur kelas, pengumpulan berkas PDF, dan batas waktu"
            : "Dokumen modul, slide PPT perkuliahan, dan link pembelajaran"
        }
      />

      <div
        className="card"
        style={{
          padding: "0.65rem 0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Pilih Kelas Perkuliahan:</label>
        <select
          className="form-select"
          style={{ maxWidth: "20rem" }}
          value={selected ?? ""}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.course?.name})
            </option>
          ))}
        </select>
      </div>

      {assignment ? (
        <DataTable<Assignment>
          columns={assignmentColumns}
          data={paginatedData as Assignment[]}
          loading={loading}
          loadingText="Memuat daftar penugasan…"
          emptyMessage="Belum ada tugas terstruktur untuk kelas ini."
          searchable
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setCurrentPage(1);
          }}
          searchPlaceholder="Cari judul tugas..."
          showColumnToggle
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            onPageChange: setCurrentPage,
            onPerPageChange: (p) => {
              setPerPage(p);
              setCurrentPage(1);
            },
            totalRecords: filteredAndSorted.length,
          }}
        />
      ) : (
        <DataTable<CourseMaterial>
          columns={materialColumns}
          data={paginatedData as CourseMaterial[]}
          loading={loading}
          loadingText="Memuat materi perkuliahan…"
          emptyMessage="Belum ada berkas materi untuk kelas ini."
          searchable
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setCurrentPage(1);
          }}
          searchPlaceholder="Cari judul materi perkuliahan..."
          showColumnToggle
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            onPageChange: setCurrentPage,
            onPerPageChange: (p) => {
              setPerPage(p);
              setCurrentPage(1);
            },
            totalRecords: filteredAndSorted.length,
          }}
        />
      )}

      {/* Student PDF Submission Modal */}
      {submitTarget && (
        <Modal isOpen onClose={() => setSubmitTarget(null)} title={`Pengumpulan Tugas (PDF) — ${submitTarget.title}`}>
          <form onSubmit={handleSubmitAssignment} style={{ display: "grid", gap: "1rem" }}>
            {submitSuccess && (
              <div
                className="rounded-md"
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                ✅ {submitSuccess}
              </div>
            )}

            {submitTarget.description && (
              <div
                className="rounded-md"
                style={{
                  fontSize: "0.875rem",
                  background: "var(--bg-secondary, #f8fafc)",
                  padding: "0.75rem",
                }}
              >
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
                onChange={async (e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && !f.name.toLowerCase().endsWith(".pdf")) {
                    await confirm.alert("Berkas yang dipilih harus berformat PDF (.pdf)!", "Format Berkas Tidak Sesuai", "warning");
                    e.target.value = "";
                    setSubmitFile(null);
                    return;
                  }
                  setSubmitFile(f);
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Materi kuliah dari dosen dapat berupa PPT/PDF, sedangkan pengumpulan tugas mahasiswa harus berformat{" "}
                <strong>.PDF</strong>.
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

// ============================================================================
// 8. Health Status Page
// ============================================================================
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
    void healthApi.check().then((r) => setResult(r.data));
  }, []);

  return (
    <div>
      <PageHeader title="Status Layanan & Healthcheck" subtitle="Kondisi backend FastAPI, PostgreSQL, dan broker MQTT" />
      {result && (
        <div className="stat-grid">
          <div className="card">
            <span className="stat-label">Backend Status</span>
            <div className="stat-number" style={{ color: "var(--success)" }}>
              {result.status}
            </div>
          </div>
          <div className="card">
            <span className="stat-label">PostgreSQL Database</span>
            <div className="stat-number" style={{ color: "var(--success)" }}>
              {result.components?.database?.status || "Connected"}
            </div>
          </div>
          <div className="card">
            <span className="stat-label">Mosquitto MQTT</span>
            <div className="stat-number" style={{ color: "var(--success)" }}>
              {result.components?.mqtt?.status || "Connected"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
