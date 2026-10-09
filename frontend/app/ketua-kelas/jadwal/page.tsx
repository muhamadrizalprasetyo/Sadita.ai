"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { academicApi, CourseClass } from "@/lib/api";
import { LoadingSpinner, StatusBadge } from "@/components/ui";

export default function KetuaKelasJadwalPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void academicApi.getClasses().then(r => {
      setClasses(r.data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner text="Memuat jadwal kuliah..." />;

  const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  // Group by day
  const grouped = classes.reduce<Record<number, CourseClass[]>>((acc, c) => {
    (acc[c.day_of_week] = acc[c.day_of_week] || []).push(c);
    return acc;
  }, {});

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal & Ruang Kuliah</h1>
          <p className="page-subtitle">Jadwal mingguan perkuliahan dan informasi ruangan kelas</p>
        </div>
      </div>

      {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([day, items]) => (
        <div key={day} className="card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={18} color="var(--primary-light)" />
            {dayNames[Number(day)] || `Hari ${day}`}
          </h2>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {items.map(c => (
              <div
                key={c.id}
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-lg)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h4 style={{ fontWeight: 700 }}>{c.course?.name || c.name}</h4>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    {c.name} • {c.course?.credits || 3} SKS
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "var(--primary-light)" }}>
                    <Clock size={14} />
                    {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)} WIB
                  </div>
                  <StatusBadge status="success" label="Aktif" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {classes.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Calendar size={40} color="var(--text-muted)" style={{ margin: "0 auto 1rem" }} />
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Belum Ada Jadwal</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Jadwal kuliah akan muncul setelah Anda terdaftar di kelas perkuliahan semester ini.
          </p>
        </div>
      )}
    </div>
  );
}
