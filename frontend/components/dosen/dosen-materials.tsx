"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useInitialClassId } from "@/components/dosen/use-class-query";
import { Plus, Trash2, FileText, Upload } from "lucide-react";
import { lmsApi, uploadApi, getFileUrl, type CourseMaterial, type MaterialType } from "@/lib/api";
import { ClassToolbar } from "@/components/dosen/class-toolbar";
import { useLecturerClasses } from "@/components/dosen/use-lecturer-classes";
import { EmptyState, LoadingSpinner, Modal } from "@/components/ui";

export function DosenMaterialsPage() {
  const { classes, loading: classesLoading, error: classesError, reload } = useLecturerClasses();
  const [classId, setClassId] = useInitialClassId(classes);
  const [items, setItems] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    material_type: "LINK" as MaterialType,
    resource_url: "",
    content: "",
  });

  const loadMaterials = useCallback(async (id: number) => {
    setLoading(true);
    setError(undefined);
    const res = await lmsApi.getMaterials(id);
    if (res.error) {
      setError(res.error);
      setItems([]);
    } else {
      setItems(res.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (classId) void loadMaterials(classId);
  }, [classId, loadMaterials]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!classId) return;

    let resourceUrl = form.resource_url || undefined;

    // If FILE type, upload the file first
    if (form.material_type === "DOCUMENT") {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        alert("Silakan pilih berkas dokumen/slide materi yang ingin diunggah!");
        return;
      }
      setUploading(true);
      const uploadRes = await uploadApi.upload(file);
      setUploading(false);
      if (uploadRes.error || !uploadRes.data) {
        alert(uploadRes.error || "Upload gagal");
        return;
      }
      resourceUrl = uploadRes.data.file_url;
    }

    const res = await lmsApi.createMaterial({
      class_id: classId,
      title: form.title,
      material_type: form.material_type,
      description: form.description || undefined,
      resource_url: resourceUrl,
      content: form.material_type === "TEXT" ? form.content : undefined,
    });
    if (res.error) {
      alert(res.error);
      return;
    }
    setModalOpen(false);
    setForm({ title: "", description: "", material_type: "LINK", resource_url: "", content: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    void loadMaterials(classId);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus materi ini?")) return;
    const res = await lmsApi.deleteMaterial(id);
    if (res.error) alert(res.error);
    else if (classId) void loadMaterials(classId);
  };

  if (classesLoading) return <LoadingSpinner text="Memuat kelas…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Materi Kuliah</h1>
          <p className="page-subtitle">Kelola dokumen, tautan, atau teks materi untuk kelas yang Anda ampu.</p>
        </div>
        <button type="button" className="btn btn-primary" disabled={!classId} onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Tambah materi
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

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <LoadingSpinner text="Memuat materi…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada materi"
          description="Tambahkan materi untuk kelas yang dipilih."
          action={
            classId ? (
              <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
                Tambah materi
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Jenis</th>
                <th>Diperbarui</th>
                <th>Akses</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.title}</div>
                    {m.description && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                        {m.description}
                      </div>
                    )}
                  </td>
                  <td>{m.material_type}</td>
                  <td>{new Date(m.created_at).toLocaleDateString("id-ID")}</td>
                  <td>
                    {m.resource_url ? (
                      <a href={getFileUrl(m.resource_url)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                        Buka
                      </a>
                    ) : m.content ? (
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Teks inline</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => void handleDelete(m.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah materi">
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Judul</label>
            <input required className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea className="form-textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Jenis materi</label>
            <select
              className="form-select"
              value={form.material_type}
              onChange={(e) => setForm({ ...form, material_type: e.target.value as MaterialType })}
            >
              <option value="LINK">Tautan (URL)</option>
              <option value="DOCUMENT">Unggah File (PDF, PPT, DOCX)</option>
              <option value="VIDEO">Video (URL)</option>
              <option value="TEXT">Teks</option>
            </select>
          </div>
          {form.material_type === "DOCUMENT" && (
            <div className="form-group">
              <label className="form-label">Pilih file</label>
              <input
                ref={fileInputRef}
                type="file"
                className="form-input"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv,.png,.jpg,.jpeg"
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Format yang didukung: PDF, PPT, DOCX, XLS, ZIP, RAR, TXT, CSV, Gambar. Maks 25MB.
              </p>
            </div>
          )}
          {(form.material_type === "LINK" || form.material_type === "VIDEO") && (
            <div className="form-group">
              <label className="form-label">URL sumber</label>
              <input
                required
                type="url"
                className="form-input"
                placeholder="https://…"
                value={form.resource_url}
                onChange={(e) => setForm({ ...form, resource_url: e.target.value })}
              />
            </div>
          )}
          {form.material_type === "TEXT" && (
            <div className="form-group">
              <label className="form-label">Isi teks</label>
              <textarea required className="form-textarea" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? (
              <><Upload size={14} className="spin" /> Mengunggah…</>
            ) : (
              "Simpan"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
