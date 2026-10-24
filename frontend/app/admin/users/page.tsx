"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { userApi, type UserItem } from "@/lib/api";
import { LoadingSpinner, Modal, StatusBadge } from "@/components/ui";

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Create modal
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

  // Edit modal
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    role: "MAHASISWA",
    is_active: true,
    password: "",
  });

  const loadUsers = async () => {
    const res = await userApi.list({ limit: 200 });
    if (res.data) setUsers(res.data);
    setLoading(false);
  };

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
    return users.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchQuery =
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.student_profile?.nim && u.student_profile.nim.toLowerCase().includes(q)) ||
        (u.lecturer_profile?.nidn && u.lecturer_profile.nidn.toLowerCase().includes(q));
      return matchRole && matchQuery;
    });
  }, [users, roleFilter, search]);

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
      alert(res.error || "Gagal membuat user");
    }
  };

  const openEdit = (u: UserItem) => {
    setEditTarget(u);
    setEditForm({
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
      password: "",
    });
  };

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
      alert(res.error || "Gagal memperbarui user");
    }
  };

  const handleDelete = async (u: UserItem) => {
    if (!confirm(`Hapus pengguna ${u.full_name} (${u.email})? Tindakan ini tidak dapat dibatalkan.`)) return;
    const res = await userApi.delete(u.id);
    if (!res.error) {
      await loadUsers();
    } else {
      alert(res.error || "Gagal menghapus user");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Pengguna</h1>
          <p className="page-subtitle">
            Kelola akun Admin, Dosen Pengampu, dan Mahasiswa sistem SADITA
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Tambah Pengguna Baru
        </button>
      </div>

      {/* Toolbar Search & Filter */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: "0.6rem",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
          padding: "0.55rem 0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "14rem" }}>
          <Search size={16} style={{ color: "var(--text-secondary)" }} />
          <input
            type="text"
            className="form-input"
            placeholder="Cari nama, email, NIM, atau NIDN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Filter Peran:</span>
          {["ALL", "ADMIN", "DOSEN", "MAHASISWA"].map((r) => (
            <button
              key={r}
              className={`btn btn-sm ${roleFilter === r ? "btn-primary" : "btn-outline"}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === "ALL" ? "Semua Peran" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Memuat daftar pengguna…" />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>Email Akun</th>
                <th>Peran (Role)</th>
                <th>NIM / NIDN</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{u.email}</td>
                    <td>
                      <span
                        className={`badge ${u.role === "ADMIN"
                          ? "badge-error"
                          : u.role === "DOSEN"
                            ? "badge-success"
                            : "badge-info"
                          }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                      {u.lecturer_profile?.nidn
                        ? `NIDN: ${u.lecturer_profile.nidn}`
                        : u.student_profile?.nim
                          ? `NPM: ${u.student_profile.nim}`
                          : "—"}
                    </td>
                    <td>
                      {u.is_active ? (
                        <StatusBadge status="success" label="Aktif" />
                      ) : (
                        <StatusBadge status="error" label="Nonaktif" />
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => openEdit(u)}
                          title="Edit Pengguna"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(u)}
                          title="Hapus Pengguna"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
}
