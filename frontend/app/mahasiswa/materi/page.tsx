"use client";

import { useEffect, useState } from "react";
import { academicApi, lmsApi, getFileUrl, type CourseMaterial, type CourseClass } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui";
import { FileText, Link2, BookOpen, Video, ExternalLink } from "lucide-react";

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const TYPE_ICON: Record<string, React.ReactNode> = {
  DOCUMENT: <FileText size={15} />,
  LINK: <Link2 size={15} />,
  TEXT: <BookOpen size={15} />,
  VIDEO: <Video size={15} />,
  SCORM: <BookOpen size={15} />,
};

const TYPE_COLOR: Record<string, string> = {
  DOCUMENT: "#60A5FA",
  LINK: "#34D399",
  TEXT: "#A78BFA",
  VIDEO: "#F97316",
  SCORM: "#F59E0B",
};

export default function MahasiswaMateriPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number>();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [matLoading, setMatLoading] = useState(false);

  useEffect(() => {
    void academicApi.getClasses().then((r) => {
      const list = r.data ?? [];
      setClasses(list);
      if (list.length > 0) setSelectedClass(list[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setMatLoading(true);
    void lmsApi.getMaterials(selectedClass).then((r) => {
      setMaterials(r.data ?? []);
      setMatLoading(false);
    });
  }, [selectedClass]);

  if (loading) return <LoadingSpinner text="Memuat materi kuliah..." />;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Materi Kuliah</h1>
          <p className="page-subtitle">Modul, dokumen, dan tautan pembelajaran dari dosen pengampu</p>
        </div>
      </div>

      {/* Class Selector */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap" }}>Pilih Mata Kuliah:</label>
        <select
          className="form-select"
          style={{ maxWidth: "24rem", flex: 1 }}
          value={selectedClass ?? ""}
          onChange={(e) => setSelectedClass(Number(e.target.value))}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.course?.name ?? c.name}
              {c.course?.credits ? ` (${c.course.credits} SKS)` : ""} — {DAY_NAMES[c.day_of_week]}{" "}
              {c.start_time?.slice(0, 5)}
            </option>
          ))}
        </select>
      </div>

      {/* Materials */}
      {matLoading ? (
        <LoadingSpinner text="Memuat materi..." />
      ) : materials.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
          <BookOpen size={40} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
          <p>Belum ada materi yang diunggah dosen untuk mata kuliah ini.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {materials.map((m) => (
            <div
              key={m.id}
              className="card"
              style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.1rem 1.25rem" }}
            >
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "0.6rem",
                  background: `${TYPE_COLOR[m.material_type] ?? "#60A5FA"}22`,
                  color: TYPE_COLOR[m.material_type] ?? "#60A5FA",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {TYPE_ICON[m.material_type] ?? <FileText size={15} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.2rem" }}>{m.title}</h4>
                {m.description && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>{m.description}</p>
                )}
                {m.content && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{m.content}</p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                  <span className="badge badge-info" style={{ fontSize: "0.72rem" }}>{m.material_type}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {new Date(m.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
              {m.resource_url && (
                <a
                  href={getFileUrl(m.resource_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <ExternalLink size={13} /> Buka
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
