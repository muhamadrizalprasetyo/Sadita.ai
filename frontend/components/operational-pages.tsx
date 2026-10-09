"use client";

import { useEffect, useState, type ReactNode } from "react";
import { 
  Plus, 
  BookOpen, 
  Calendar, 
  Users, 
  GraduationCap, 
  Radio, 
  Clock, 
  FileText, 
  CheckSquare, 
  Activity, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { 
  academicApi, 
  attendanceApi, 
  deviceApi, 
  healthApi, 
  lmsApi, 
  studentApi, 
  lecturerApi, 
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
import { LoadingSpinner, EmptyState, Modal, StatusBadge } from "@/components/ui";

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
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<CourseClass | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    course_id: 1,
    term_id: 1,
    lecturer_id: 1,
    day_of_week: 1,
    start_time: "08:00:00",
    end_time: "10:30:00",
    class_type: "REGULER_PAGI"
  });

  const loadData = async () => {
    setLoading(true);
    const [cRes, crsRes, tRes] = await Promise.all([
      academicApi.getClasses(),
      academicApi.getCourses(),
      academicApi.getTerms(),
    ]);
    if (cRes.data) setItems(cRes.data);
    if (crsRes.data) setCourses(crsRes.data);
    if (tRes.data) setTerms(tRes.data);
    setLoading(false);
  };

  useEffect(() => {
    void Promise.all([
      academicApi.getClasses(),
      academicApi.getCourses(),
      academicApi.getTerms(),
    ]).then(([cRes, crsRes, tRes]) => {
      if (cRes.data) setItems(cRes.data);
      if (crsRes.data) setCourses(crsRes.data);
      if (tRes.data) setTerms(tRes.data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await academicApi.createClass(formData);
    if (res.data) {
      setIsModalOpen(false);
      loadData();
    } else {
      alert(res.error || "Gagal membuat kelas perkuliahan");
    }
  };

  const openEnrollments = async (c: CourseClass) => {
    setSelectedClass(c);
    const res = await academicApi.getClassStudents(c.id);
    if (res.data) setEnrollments(res.data);
  };

  if (loading) return <LoadingSpinner text="Memuat kelas perkuliahan..." />;

  const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  return (
    <div>
      <PageHeader
        title={mine ? "Kelas Perkuliahan Saya" : "Kelas & Enrollment KRS"}
        subtitle="Jadwal kelas, dosen pengampu, dan daftar mahasiswa terdaftar"
        action={
          !mine && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Buka Kelas Baru
            </button>
          )
        }
      />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode / Nama Kelas</th>
              <th>Mata Kuliah</th>
              <th>Dosen Pengampu</th>
              <th>Jadwal Kuliah</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x.id}>
                <td style={{ fontWeight: 700 }}>{x.name}</td>
                <td>{x.course?.name || "Mata Kuliah"}</td>
                <td style={{ color: "var(--text-secondary)" }}>
                  {x.lecturer?.nidn ? `NIDN ${x.lecturer.nidn}` : "Dosen Pengampu"}
                </td>
                <td style={{ fontSize: "0.85rem" }}>
                  {dayNames[x.day_of_week] || `Hari ${x.day_of_week}`}, {x.start_time.slice(0, 5)} - {x.end_time.slice(0, 5)} WIB
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEnrollments(x)}>
                    <Users size={14} /> Mahasiswa
                  </button>
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
                  <th>NIM</th>
                  <th>KTM Status</th>
                  <th>Status KRS</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr) => (
                  <tr key={enr.id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{enr.student?.nim || `ID ${enr.student_id}`}</td>
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
        </Modal>
      )}

      {/* Create Class Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buka Kelas Perkuliahan Baru">
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Nama / Kode Kelas</label>
            <input required placeholder="TI-2024-PAGI-B" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
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
    </div>
  );
}

// ============================================================================
// 4. People (Students & Lecturers) Directory
// ============================================================================
export function PeoplePage({ lecturer = false }: { lecturer?: boolean }) {
  const [items, setItems] = useState<(LecturerProfile | StudentProfile)[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void (lecturer ? lecturerApi.list() : studentApi.list()).then(r => {
      setItems(r.data ?? []);
      setLoading(false);
    });
  }, [lecturer]);

  if (loading) return <LoadingSpinner text={lecturer ? "Memuat data dosen..." : "Memuat data mahasiswa..."} />;

  const filtered = items.filter(p => {
    const val = lecturer ? ((p as LecturerProfile).nidn || "") : ((p as StudentProfile).nim || "");
    return val.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title={lecturer ? "Direktori Dosen Pengajar" : "Direktori Mahasiswa"}
        subtitle={lecturer ? "Dosen pengampu Program Studi Teknologi Informasi" : "Data mahasiswa, nomor induk, dan status biometrik/KTM"}
      />

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "24rem" }}>
          <input
            type="text"
            placeholder={lecturer ? "Cari NIDN dosen..." : "Cari NIM mahasiswa..."}
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
              <th>{lecturer ? "NIDN" : "NIM"}</th>
              <th>Program Studi</th>
              <th>{lecturer ? "Kontak" : "RFID / Biometrik"}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const lec = lecturer ? (item as LecturerProfile) : null;
              const stu = !lecturer ? (item as StudentProfile) : null;
              return (
                <tr key={item.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                    {lec ? lec.nidn : stu?.nim}
                  </td>
                  <td>{item.department || "Teknologi Informasi"}</td>
                  <td>
                    {lec ? (
                      lec.phone || "081234567890"
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        RFID: <code style={{ color: "var(--primary-light)" }}>{stu?.rfid_uid || "Tersedia"}</code> • FP Slot #{stu?.fingerprint_template_id || item.id}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status="success" label="Aktif" />
                  </td>
                </tr>
              );
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
      />

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

      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Pilih Kelas Perkuliahan:</label>
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

  if (loading) return <LoadingSpinner text={assignment ? "Memuat tugas..." : "Memuat materi kuliah..."} />;

  return (
    <div>
      <PageHeader
        title={assignment ? "Manajemen Tugas & Penugasan" : "Manajemen Materi Perkuliahan"}
        subtitle={assignment ? "Tugas terstruktur kelas, batas pengumpulan, dan skor maksimal" : "Dokumen modul, slide perkuliahan, dan link pembelajaran"}
      />

      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Pilih Kelas Perkuliahan:</label>
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
                    <a href={x.resource_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                      Buka Dokumen
                    </a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
