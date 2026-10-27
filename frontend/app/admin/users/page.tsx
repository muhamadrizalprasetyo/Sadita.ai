"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { userApi, type UserItem } from "@/lib/api";
import {
  Modal,
  DataTable,
  useConfirm,
  type ColumnDef,
  FilamentBoolean,
  FilamentAction,
} from "@/components/ui";

export default function UserManagementPage() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);
  const [sortKey, setSortKey] = useState<string>("full_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewTarget, setViewTarget] = useState<UserItem | null>(null);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "DOSEN" as "ADMIN" | "DOSEN" | "MAHASISWA" | "KETUA_KELAS",
    nidn: "",
    nim: "",
    department: "Teknik Informatika",
    phone: "",
    rfid_uid: "",
    academic_cohort: 1,
    class_type: "REGULER_PAGI" as "REGULER_PAGI" | "REGULER_MALAM" | "REGULER_SHIFT",
  });

  // Edit modal state
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    role: "MAHASISWA",
    is_active: true,
    password: "",
  });

  const loadUsers = useCallback(async () => {
    const res = await userApi.list({ limit: 200 });
    if (res.data) setUsers(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    userApi.list({ limit: 200 }).then((res) => {
      if (!isMounted) return;
      if (res.data) setUsers(res.data);
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
            ? u.is_active === true
            : u.is_active === false;

      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.student_profile?.nim && u.student_profile.nim.toLowerCase().includes(q)) ||
        (u.lecturer_profile?.nidn && u.lecturer_profile.nidn.toLowerCase().includes(q));

      return matchRole && matchStatus && matchQuery;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA = "";
        let valB = "";
        if (sortKey === "full_name") {
          valA = a.full_name.toLowerCase();
          valB = b.full_name.toLowerCase();
        } else if (sortKey === "parent") {
          valA = (a.student_profile?.department || a.lecturer_profile?.department || "UNIPI").toLowerCase();
          valB = (b.student_profile?.department || b.lecturer_profile?.department || "UNIPI").toLowerCase();
        } else if (sortKey === "role") {
          valA = a.role;
          valB = b.role;
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
  }, [users, roleFilter, statusFilter, search, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredUsers.length / perPage) || 1;

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredUsers.slice(start, start + perPage);
  }, [filteredUsers, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const payload: Parameters<typeof userApi.create>[0] = {
      full_name: createForm.full_name,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role,
      is_active: true,
    };

    if (createForm.role === "DOSEN") {
      payload.lecturer_profile = {
        nidn: createForm.nidn || `00${Date.now().toString().slice(-6)}`,
        department: createForm.department,
        phone: createForm.phone,
      };
    } else if (createForm.role === "MAHASISWA" || createForm.role === "KETUA_KELAS") {
      payload.student_profile = {
        nim: createForm.nim || `2024${Date.now().toString().slice(-4)}`,
        department: createForm.department,
        phone: createForm.phone,
        rfid_uid: createForm.rfid_uid || undefined,
        academic_cohort: createForm.academic_cohort,
        class_type: createForm.class_type,
      };
    }

    const res = await userApi.create(payload);
    setCreating(false);
    if (res.data) {
      setCreateOpen(false);
      setCreateForm({
        full_name: "",
        email: "",
        password: "",
        role: "DOSEN",
        nidn: "",
        nim: "",
        department: "Teknik Informatika",
        phone: "",
        rfid_uid: "",
        academic_cohort: 1,
        class_type: "REGULER_PAGI",
      });
      await loadUsers();
    } else {
      await confirm.alert(res.error || "Gagal membuat user", "Gagal Menambah Pengguna", "danger");
    }
  };

  const openEdit = useCallback((u: UserItem) => {
    setEditTarget(u);
    setEditForm({
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
      password: "",
    });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setUpdating(true);
    const payload: Parameters<typeof userApi.update>[1] = {
      full_name: editForm.full_name,
      email: editForm.email,
      role: editForm.role,
      is_active: editForm.is_active,
    };
    if (editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }
    const res = await userApi.update(editTarget.id, payload);
    setUpdating(false);
    if (res.data) {
      setEditTarget(null);
      await loadUsers();
    } else {
      await confirm.alert(res.error || "Gagal memperbarui user", "Gagal Memperbarui", "danger");
    }
  };

  const handleDelete = useCallback(
    async (u: UserItem) => {
      if (u.email === "admin@unipi.ac.id") {
        await confirm.alert(
          "Akun Administrator Utama (admin@unipi.ac.id) dilindungi sistem dan tidak dapat dihapus.",
          "Aksi Dilindungi",
          "warning"
        );
        return;
      }
      const ok = await confirm({
        title: "Hapus Pengguna",
        message: `Apakah Anda yakin ingin menghapus akun ${u.full_name} (${u.email})? Tindakan ini bersifat permanen dan data profil terkait akan dihapus.`,
        variant: "danger",
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
      });
      if (!ok) return;
      const res = await userApi.delete(u.id);
      if (!res.error) {
        await loadUsers();
      } else {
        await confirm.alert(res.error || "Gagal menghapus user", "Gagal Menghapus", "danger");
      }
    },
    [confirm, loadUsers]
  );

  const handleBulkDelete = useCallback(
    async (keys: (string | number)[]) => {
      const targetKeys = keys.filter((key) => {
        const found = users.find((u) => u.id === Number(key));
        return found?.email !== "admin@unipi.ac.id";
      });
      if (targetKeys.length === 0) {
        await confirm.alert(
          "Tidak ada akun yang dapat dihapus. Akun Administrator Utama dilindungi sistem.",
          "Aksi Dilindungi",
          "warning"
        );
        return;
      }
      const ok = await confirm({
        title: "Hapus Masal Pengguna",
        message: `Apakah Anda yakin ingin menghapus ${targetKeys.length} akun pengguna terpilih secara bersamaan? Tindakan ini tidak dapat dibatalkan.`,
        variant: "danger",
        confirmText: `Hapus ${targetKeys.length} Pengguna`,
        cancelText: "Batal",
      });
      if (!ok) return;
      for (const key of targetKeys) {
        await userApi.delete(Number(key));
      }
      setSelectedKeys([]);
      await loadUsers();
    },
    [confirm, loadUsers, users]
  );

  // Filament v5 Column Definitions matching user screenshots
  const userColumns = useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        key: "full_name",
        header: "Name",
        sortable: true,
        toggleable: false, // Name is core, cannot be hidden
        render: (u) => (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 600, color: "#111827", fontSize: "12.5px" }}>{u.full_name}</span>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>{u.email}</span>
          </div>
        ),
      },
      {
        key: "parent",
        header: "Parent",
        sortable: true,
        toggleable: true,
        render: (u) => {
          const dept = u.student_profile?.department || u.lecturer_profile?.department;
          const idStr = u.student_profile?.nim
            ? `NIM: ${u.student_profile.nim}`
            : u.lecturer_profile?.nidn
              ? `NIDN: ${u.lecturer_profile.nidn}`
              : u.role === "ADMIN"
                ? "Administrator SADITA"
                : "";
          return (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#374151", fontSize: "12.5px" }}>{dept || "Universitas Insan Pembangunan"}</span>
              {idStr && <span style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "var(--font-mono)" }}>{idStr}</span>}
            </div>
          );
        },
      },
      {
        key: "role",
        header: "Role",
        sortable: true,
        toggleable: true,
        render: (u) => (
          <span
            className={`badge ${u.role === "ADMIN"
              ? "badge-error"
              : u.role === "DOSEN"
                ? "badge-success"
                : "badge-info"
              }`}
            style={{ fontSize: "11px", padding: "2px 8px", fontWeight: 600 }}
          >
            {u.role}
          </span>
        ),
      },
      {
        key: "is_active",
        header: "Visibility",
        align: "center",
        sortable: true,
        toggleable: true,
        render: (u) => <FilamentBoolean value={u.is_active} />,
      },
      {
        key: "actions",
        header: "",
        align: "right",
        sortable: false,
        toggleable: false,
        render: (u) => (
          <div
            style={{ display: "inline-flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}
            onClick={(e) => e.stopPropagation()}
          >
            <FilamentAction type="edit" label="Edit" onClick={() => openEdit(u)} />
            <FilamentAction type="delete" label="" onClick={() => handleDelete(u)} />
          </div>
        ),
      },
    ],
    [openEdit, handleDelete]
  );

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {/* Top Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Manajemen Pengguna</h1>
          <p className="page-subtitle">
            Kelola akun Administrator, Dosen Pengampu, dan Mahasiswa sistem SADITA
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> Tambah Pengguna Baru
        </button>
      </div>

      {/* Filament v5 DataTable with Filters Popover, Columns Popover & Bulk Actions */}
      <DataTable<UserItem>
        columns={userColumns}
        data={paginatedUsers}
        loading={loading}
        loadingText="Memuat data pengguna…"
        emptyMessage="Tidak ada pengguna yang cocok dengan filter atau pencarian."
        onRowClick={(u) => setViewTarget(u)}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        bulkActions={[
          {
            key: "delete",
            label: "Delete selected",
            icon: <Trash2 size={13} color="#dc2626" />,
            danger: true,
            onClick: handleBulkDelete,
          },
        ]}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchable
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search"
        showColumnToggle
        filters={[
          {
            key: "role",
            label: "Peran Pengguna (Role)",
            value: roleFilter,
            onChange: (val) => {
              setRoleFilter(val);
              setCurrentPage(1);
            },
            options: [
              { value: "ALL", label: "Semua Peran" },
              { value: "ADMIN", label: "Administrator" },
              { value: "DOSEN", label: "Dosen Pengampu" },
              { value: "MAHASISWA", label: "Mahasiswa" },
              { value: "KETUA_KELAS", label: "Ketua Kelas" },
            ],
          },
          {
            key: "status",
            label: "Status Akun",
            value: statusFilter,
            onChange: (val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            },
            options: [
              { value: "ALL", label: "Semua Status" },
              { value: "ACTIVE", label: "Aktif Saja" },
              { value: "INACTIVE", label: "Nonaktif / Terblokir" },
            ],
          },
        ]}
        onResetFilters={() => {
          setRoleFilter("ALL");
          setStatusFilter("ALL");
          setCurrentPage(1);
        }}
        pagination={{
          currentPage,
          totalPages,
          perPage,
          totalRecords: filteredUsers.length,
          onPageChange: setCurrentPage,
          onPerPageChange: (pp) => {
            setPerPage(pp);
            setCurrentPage(1);
          },
        }}
      />

      {/* Create Modal */}
      {createOpen && (
        <Modal isOpen onClose={() => setCreateOpen(false)} title="Tambah Pengguna Baru">
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Peran Pengguna (Role)</label>
              <select
                className="form-select"
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    role: e.target.value as "ADMIN" | "DOSEN" | "MAHASISWA" | "KETUA_KELAS",
                  })
                }
              >
                <option value="DOSEN">Dosen Pengampu</option>
                <option value="MAHASISWA">Mahasiswa</option>
                <option value="ADMIN">Administrator</option>
                <option value="KETUA_KELAS">Ketua Kelas</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Lengkap & Gelar</label>
              <input
                required
                className="form-input"
                placeholder="Contoh: Henry, M.Kom. atau Rizal Prasetyo"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Email Akun (Login)</label>
                <input
                  required
                  type="email"
                  className="form-input"
                  placeholder="nama@unipi.ac.id"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password Sementara</label>
                <input
                  required
                  type="password"
                  className="form-input"
                  placeholder="Min. 6 karakter"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>
            </div>

            {createForm.role === "DOSEN" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">NIDN (Nomor Induk Dosen)</label>
                  <input
                    required
                    className="form-input"
                    placeholder="Contoh: 0412058501"
                    value={createForm.nidn}
                    onChange={(e) => setCreateForm({ ...createForm, nidn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Program Studi</label>
                  <input
                    className="form-input"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  />
                </div>
              </div>
            )}

            {(createForm.role === "MAHASISWA" || createForm.role === "KETUA_KELAS") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">NPM / NIM Mahasiswa</label>
                  <input
                    required
                    className="form-input"
                    placeholder="Contoh: 202401001"
                    value={createForm.nim}
                    onChange={(e) => setCreateForm({ ...createForm, nim: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">RFID UID KTM (Opsional)</label>
                  <input
                    className="form-input"
                    placeholder="Contoh: 1A2B3C4D"
                    value={createForm.rfid_uid}
                    onChange={(e) => setCreateForm({ ...createForm, rfid_uid: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Menyimpan…" : "Simpan Pengguna"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal isOpen onClose={() => setEditTarget(null)} title={`Edit Pengguna — ${editTarget.full_name}`}>
          <form onSubmit={handleUpdate} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                required
                className="form-input"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Akun</label>
              <input
                required
                type="email"
                className="form-input"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Peran (Role)</label>
                <select
                  className="form-select"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="DOSEN">Dosen Pengampu</option>
                  <option value="MAHASISWA">Mahasiswa</option>
                  <option value="KETUA_KELAS">Ketua Kelas</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status Akun</label>
                <select
                  className="form-select"
                  value={editForm.is_active ? "true" : "false"}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === "true" })}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif / Terblokir</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reset Password Baru (Kosongkan bila tidak diubah)</label>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan password baru…"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="btn btn-outline" onClick={() => setEditTarget(null)}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={updating}>
                {updating ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail / View Modal (Triggered by clicking row background) */}
      {viewTarget && (
        <Modal
          isOpen
          onClose={() => setViewTarget(null)}
          title={`Detail Pengguna — ${viewTarget.full_name}`}
        >
          <div style={{ display: "grid", gap: "1.25rem" }}>
            {/* Header Profile Summary */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {viewTarget.full_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                    {viewTarget.full_name}
                  </h3>
                  <span
                    className={`badge ${viewTarget.role === "ADMIN"
                      ? "badge-error"
                      : viewTarget.role === "DOSEN"
                        ? "badge-success"
                        : "badge-info"
                      }`}
                    style={{ fontSize: "11px", padding: "2px 8px", fontWeight: 600 }}
                  >
                    {viewTarget.role}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: viewTarget.is_active ? "#16a34a" : "#dc2626",
                    }}
                  >
                    <FilamentBoolean value={viewTarget.is_active} />
                    <span>{viewTarget.is_active ? "Aktif" : "Nonaktif"}</span>
                  </span>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  {viewTarget.email}
                </p>
              </div>
            </div>

            {/* Information Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 0.6rem",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    color: "#64748b",
                    letterSpacing: "0.05em",
                  }}
                >
                  Informasi Akademik
                </h4>
                <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>Departemen / Prodi: </span>
                    <strong style={{ color: "#1e293b" }}>
                      {viewTarget.student_profile?.department ||
                        viewTarget.lecturer_profile?.department ||
                        (viewTarget.role === "ADMIN" ? "Administrator SADITA" : "Universitas Insan Pembangunan")}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Nomor Induk: </span>
                    <strong style={{ color: "#1e293b", fontFamily: "var(--font-mono)" }}>
                      {viewTarget.student_profile?.nim
                        ? `NIM ${viewTarget.student_profile.nim}`
                        : viewTarget.lecturer_profile?.nidn
                          ? `NIDN ${viewTarget.lecturer_profile.nidn}`
                          : "—"}
                    </strong>
                  </div>
                  {viewTarget.student_profile?.academic_cohort && (
                    <div>
                      <span style={{ color: "#64748b" }}>Angkatan: </span>
                      <strong style={{ color: "#1e293b" }}>
                        Tahun ke-{viewTarget.student_profile.academic_cohort}
                      </strong>
                    </div>
                  )}
                  {viewTarget.student_profile?.class_type && (
                    <div>
                      <span style={{ color: "#64748b" }}>Tipe Kelas: </span>
                      <strong style={{ color: "#1e293b" }}>
                        {viewTarget.student_profile.class_type.replace("_", " ")}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 0.6rem",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    color: "#64748b",
                    letterSpacing: "0.05em",
                  }}
                >
                  Akses Perangkat & Keamanan
                </h4>
                <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>RFID UID Kartu: </span>
                    <strong style={{ color: "#1e293b", fontFamily: "var(--font-mono)" }}>
                      {viewTarget.student_profile?.rfid_uid || "Belum Terdaftar"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>ID Sistem: </span>
                    <span style={{ color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      {viewTarget.id}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Terdaftar Pada: </span>
                    <span style={{ color: "#1e293b" }}>
                      {viewTarget.created_at
                        ? new Date(viewTarget.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setViewTarget(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = viewTarget;
                  setViewTarget(null);
                  openEdit(target);
                }}
              >
                <Pencil size={14} /> Edit Data Pengguna
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
