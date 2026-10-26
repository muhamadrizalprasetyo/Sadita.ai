"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  academicApi,
  attendanceApi,
  authApi,
  workflowApi,
  type AttendanceRequest,
  type AttendanceSession,
  type CourseClass,
  type User,
} from "@/lib/api";
import {
  LoadingSpinner,
  StatusBadge,
  DataTable,
  type ColumnDef,
  type TableFilterDef,
} from "@/components/ui";
import { Plus, CheckCircle, ShieldCheck } from "lucide-react";

export function AttendanceWorkspace() {
  const [user, setUser] = useState<User>();
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [classId, setClassId] = useState<number>();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  // DataTable State for Sessions
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<string>("session_number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // DataTable State for Requests
  const [reqSearch, setReqSearch] = useState("");

  const active = useMemo(() => sessions.find((item) => item.status === "OPEN"), [sessions]);

  async function loadClass(id: number, current = user) {
    const sessionResult = await attendanceApi.getSessions(id);
    if (!sessionResult.data) {
      setError(sessionResult.error);
      return;
    }
    setSessions(sessionResult.data);
    if (current?.role === "MAHASISWA" || current?.role === "KETUA_KELAS") {
      const pending = await workflowApi.pendingPresence(id);
      setRequests(pending.data ?? []);
    }
  }

  async function load() {
    setLoading(true);
    setError(undefined);
    const [me, classResult] = await Promise.all([authApi.getMe(), academicApi.getClasses()]);
    if (!me.data || !classResult.data) {
      setError(me.error ?? classResult.error ?? "Data tidak dapat dimuat.");
      setLoading(false);
      return;
    }
    setUser(me.data);
    setClasses(classResult.data);
    const chosen = classId ?? classResult.data[0]?.id;
    setClassId(chosen);
    if (chosen) await loadClass(chosen, me.data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function mutate(action: () => Promise<{ error?: string }>) {
    setMessage(undefined);
    setError(undefined);
    const result = await action();
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("Perubahan berhasil tersimpan.");
      if (classId) await loadClass(classId);
    }
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await mutate(() =>
      attendanceApi.createSession({
        class_id: classId!,
        session_number: Number(fd.get("number")),
        date: String(fd.get("date")),
        topic: String(fd.get("topic") || ""),
      })
    );
    e.currentTarget.reset();
  }

  const filteredAndSortedSessions = useMemo(() => {
    let result = sessions.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          (s.topic && s.topic.toLowerCase().includes(q)) ||
          s.date.includes(q) ||
          `pertemuan ${s.session_number}`.includes(q);
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

  const totalPages = Math.ceil(filteredAndSortedSessions.length / perPage) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSortedSessions.slice(start, start + perPage);
  }, [filteredAndSortedSessions, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sessionColumns = useMemo<ColumnDef<AttendanceSession>[]>(
    () => [
      {
        key: "session_number",
        header: "Pertemuan",
        sortable: true,
        toggleable: false,
        width: "140px",
        render: (item) => <span style={{ fontWeight: 600 }}>Pertemuan {item.session_number}</span>,
      },
      {
        key: "date",
        header: "Tanggal",
        sortable: true,
        width: "130px",
        render: (item) => <span style={{ fontSize: "12.5px", fontFamily: "var(--font-mono)" }}>{item.date}</span>,
      },
      {
        key: "topic",
        header: "Topik Perkuliahan",
        sortable: true,
        render: (item) => (
          <span style={{ color: item.topic ? "var(--text)" : "var(--muted)", fontWeight: 500 }}>
            {item.topic ?? "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        sortable: true,
        width: "140px",
        render: (item) => (
          <StatusBadge
            status={item.status === "OPEN" ? "warning" : item.status === "CLOSED" ? "success" : "neutral"}
            label={item.status}
          />
        ),
      },
      {
        key: "actions",
        header: "Aksi",
        align: "right",
        sortable: false,
        toggleable: false,
        render: (item) => (
          <div style={{ display: "inline-flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
            {(user?.role === "ADMIN" || user?.role === "DOSEN") && item.status === "SCHEDULED" && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => void mutate(() => attendanceApi.openSession(item.id))}
              >
                Buka Sesi
              </button>
            )}
            {(user?.role === "ADMIN" || user?.role === "DOSEN") && item.status === "OPEN" && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => void mutate(() => attendanceApi.closeSession(item.id))}
              >
                Tutup Sesi
              </button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );

  const sessionFilters: TableFilterDef[] = useMemo(
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

  // Requests DataTable Columns & Data
  const requestColumns = useMemo<ColumnDef<AttendanceRequest>[]>(
    () => [
      {
        key: "id",
        header: "ID Pengajuan",
        sortable: true,
        toggleable: false,
        render: (req) => (
          <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>#{req.id}</span>
        ),
      },
      {
        key: "session_id",
        header: "Sesi Perkuliahan",
        sortable: true,
        render: (req) => <span>Sesi Pertemuan {req.session_id}</span>,
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (req) => <StatusBadge status="warning" label={req.status} />,
      },
      {
        key: "actions",
        header: "Aksi",
        align: "right",
        sortable: false,
        render: (req) => (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => classId && void mutate(() => workflowApi.verifyPresence(classId, req.id))}
          >
            Verifikasi
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classId]
  );

  const filteredRequests = useMemo(() => {
    if (!reqSearch.trim()) return requests;
    const q = reqSearch.toLowerCase();
    return requests.filter(
      (r) => String(r.id).includes(q) || String(r.session_id).includes(q) || r.status.toLowerCase().includes(q)
    );
  }, [requests, reqSearch]);

  if (loading) return <LoadingSpinner text="Memuat workspace presensi…" />;

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Top Controls Card */}
      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "240px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Pilih Kelas:</span>
            <select
              className="form-select"
              style={{ width: "auto", minWidth: "200px" }}
              value={classId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setClassId(id);
                void loadClass(id);
              }}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {active && (user?.role === "MAHASISWA" || user?.role === "KETUA_KELAS") && (
            <button
              className="btn btn-primary"
              onClick={() => void mutate(() => workflowApi.submitAttendance(active.id))}
            >
              <CheckCircle size={16} /> Saya Hadir — Pertemuan {active.session_number}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-search)",
            background: "var(--error-bg)",
            border: "1px solid var(--error-border)",
            color: "var(--error)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-search)",
            background: "var(--success-bg)",
            border: "1px solid var(--success-border)",
            color: "var(--success)",
            fontSize: "13px",
          }}
        >
          {message}
        </div>
      )}

      {/* Sesi Presensi Creator for Admin/Dosen */}
      {(user?.role === "ADMIN" || user?.role === "DOSEN") && classId && (
        <div className="card">
          <div className="card-head">
            <h3>Buat Sesi Presensi Baru</h3>
          </div>
          <form onSubmit={create} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "12px" }}>
            <div className="form-group" style={{ marginBottom: 0, width: "120px" }}>
              <label className="form-label">Pertemuan Ke</label>
              <input required name="number" type="number" min="1" max="16" placeholder="1-16" className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: "160px" }}>
              <label className="form-label">Tanggal</label>
              <input required name="date" type="date" className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "180px" }}>
              <label className="form-label">Topik Pembahasan</label>
              <input name="topic" placeholder="Topik materi pertemuan..." className="form-input" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: "42px" }}>
              <Plus size={16} /> Buat Sesi
            </button>
          </form>
        </div>
      )}

      {/* Sessions DataTable */}
      <div style={{ display: "grid", gap: "12px" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Daftar Sesi Presensi Perkuliahan</h3>
        <DataTable<AttendanceSession>
          columns={sessionColumns}
          data={paginatedSessions}
          loading={loading}
          loadingText="Memuat data sesi presensi…"
          emptyMessage="Belum ada sesi presensi untuk kelas ini."
          searchable
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setCurrentPage(1);
          }}
          searchPlaceholder="Cari topik atau tanggal pertemuan..."
          filters={sessionFilters}
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
            totalRecords: filteredAndSortedSessions.length,
          }}
        />
      </div>

      {/* Requests Pending Verification for Ketua Kelas / Mahasiswa */}
      {requests.length > 0 && (
        <div style={{ display: "grid", gap: "12px", marginTop: "12px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", fontWeight: 700, margin: 0 }}>
            <ShieldCheck size={18} color="var(--green)" /> Pengajuan Presensi Menunggu Verifikasi
          </h3>
          <DataTable<AttendanceRequest>
            columns={requestColumns}
            data={filteredRequests}
            loading={false}
            emptyMessage="Tidak ada pengajuan presensi yang menunggu verifikasi."
            searchable
            searchQuery={reqSearch}
            onSearchChange={setReqSearch}
            searchPlaceholder="Cari ID request atau sesi..."
          />
        </div>
      )}
    </div>
  );
}
