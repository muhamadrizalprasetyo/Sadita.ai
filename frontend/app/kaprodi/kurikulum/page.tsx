"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, ArrowRight, Plus } from "lucide-react";
import { academicApi, CourseClass, Course, AcademicTerm } from "@/lib/api";
import { StatCard, LoadingSpinner } from "@/components/ui";
import { CoursesPage, ClassesPage, TermsPage } from "@/components/operational-pages";

type Tab = "kelas" | "matakuliah" | "semester";

export default function KaprodiKurikulumPage() {
  const [tab, setTab] = useState<Tab>("kelas");

  const tabs: { key: Tab; label: string }[] = [
    { key: "kelas", label: "Kelas Perkuliahan" },
    { key: "matakuliah", label: "Katalog Mata Kuliah" },
    { key: "semester", label: "Tahun Akademik" },
  ];

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kurikulum & Evaluasi</h1>
          <p className="page-subtitle">Manajemen kurikulum, distribusi kelas, dan evaluasi program studi</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.65rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? "var(--primary-light)" : "var(--text-secondary)",
              background: tab === t.key ? "rgba(56, 189, 248, 0.08)" : "transparent",
              border: "none",
              borderBottom: tab === t.key ? "2px solid var(--primary)" : "2px solid transparent",
              borderRadius: "var(--radius-md) var(--radius-md) 0 0",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "kelas" && <ClassesPage />}
      {tab === "matakuliah" && <CoursesPage />}
      {tab === "semester" && <TermsPage />}
    </div>
  );
}
