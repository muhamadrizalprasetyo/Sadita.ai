"use client";

import type { CourseClass } from "@/lib/api";

export function ClassToolbar({
  classes,
  selectedId,
  onChange,
  label = "Kelas",
}: {
  classes: CourseClass[];
  selectedId?: number;
  onChange: (classId: number) => void;
  label?: string;
}) {
  if (classes.length === 0) {
    return (
      <div className="toolbar-row">
        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Tidak ada kelas yang ditugaskan kepada Anda pada semester ini.
        </span>
      </div>
    );
  }

  return (
    <div className="toolbar-row">
      <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
        {label}
      </label>
      <select
        className="form-select"
        style={{ maxWidth: "22rem", minWidth: "12rem" }}
        value={selectedId ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.course ? ` — ${c.course.code} ${c.course.name}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
