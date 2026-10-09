"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Users, 
  Clock, 
  CheckSquare, 
  Calendar, 
  Plus, 
  ArrowRight,
  HelpCircle,
  Award
} from "lucide-react";
import { academicApi, CourseClass, attendanceApi, lmsApi } from "@/lib/api";
import { StatCard, LoadingSpinner } from "@/components/ui";

export default function DosenDashboardPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [totalAssignments, setTotalAssignments] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const r = await academicApi.getClasses();
        const classList = r.data ?? [];
        setClasses(classList);

        if (classList.length > 0) {
          // Fetch student enrollments, sessions, and assignments across lecturer classes
          const studentPromises = classList.map(c => academicApi.getClassStudents(c.id));
          const sessionPromises = classList.map(c => attendanceApi.getSessions(c.id));
          const assignmentPromises = classList.map(c => lmsApi.getAssignments(c.id));

          const [studRes, sessRes, assignRes] = await Promise.all([
            Promise.all(studentPromises),
            Promise.all(sessionPromises),
            Promise.all(assignmentPromises),
          ]);

          // Unique students enrolled across lecturer classes
          const studentIds = new Set<number>();
          studRes.forEach(res => {
            res.data?.forEach(e => studentIds.add(e.student_id));
          });
          setTotalStudents(studentIds.size);

          const totalSess = sessRes.reduce((acc, curr) => acc + (curr.data?.length ?? 0), 0);
          setTotalSessions(totalSess);

          const totalAssign = assignRes.reduce((acc, curr) => acc + (curr.data?.length ?? 0), 0);
          setTotalAssignments(totalAssign);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (loading) return <LoadingSpinner text="Memuat dashboard pengajar..." />;

  const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Pengajar</h1>
          <p className="page-subtitle">Pusat kendali perkuliahan, materi, tugas, dan presensi IoT mahasiswa</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/dosen/presensi" className="btn btn-primary">
            <Clock size={16} /> Buka Presensi Baru
          </Link>
          <Link href="/dosen/tugas" className="btn btn-secondary">
            <Plus size={16} /> Tambah Tugas
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid">
        <StatCard
          label="Kelas Diampu"
          value={classes.length}
          icon={BookOpen}
          color="indigo"
          subtext="Semester aktif"
        />
        <StatCard
          label="Total Mahasiswa"
          value={`${totalStudents} Mahasiswa`}
          icon={Users}
          color="green"
          subtext="Peserta terdaftar"
        />
        <StatCard
          label="Sesi Presensi"
          value={`${totalSessions} Pertemuan`}
          icon={Clock}
          color="orange"
          subtext="Tercatat di sistem"
        />
        <StatCard
          label="Tugas Perkuliahan"
          value={`${totalAssignments} Tugas`}
          icon={CheckSquare}
          color="purple"
          subtext="Modul penugasan aktif"
        />
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", gap: "1.5rem" }}>
        {/* Classes Overview */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Kelas Perkuliahan Semester Ini</h2>
            <Link href="/dosen/kelas" className="btn btn-outline btn-sm">
              Kelola Kelas <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {classes.map(c => (
              <div
                key={c.id}
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius-lg)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{c.name}</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    {c.course?.name} ({c.course?.credits || 3} SKS)
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--primary-light)", marginTop: "0.2rem" }}>
                    <Calendar size={12} style={{ display: "inline", marginRight: "4px" }} />
                    {dayNames[c.day_of_week] || "Senin"}, {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)} WIB
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Link href={`/dosen/presensi`} className="btn btn-secondary btn-sm">
                    Presensi
                  </Link>
                  <Link href={`/dosen/materi`} className="btn btn-outline btn-sm">
                    Materi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operational Actions */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Aksi Cepat Pengajar</h2>
          
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <Link href="/dosen/presensi" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <Clock size={18} color="var(--primary-light)" />
              <div>
                <div style={{ fontWeight: 600 }}>Buka Sesi Presensi RFID</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Aktifkan mode scan kartu KTM pada ESP32 kelas</div>
              </div>
            </Link>

            <Link href="/dosen/materi" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <BookOpen size={18} color="#10B981" />
              <div>
                <div style={{ fontWeight: 600 }}>Unggah Modul Kuliah</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Upload dokumen materi atau link video YouTube</div>
              </div>
            </Link>

            <Link href="/dosen/kuis" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <HelpCircle size={18} color="#8B5CF6" />
              <div>
                <div style={{ fontWeight: 600 }}>Buat Kuis Online</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Soal pilihan ganda dengan penilaian otomatis</div>
              </div>
            </Link>

            <Link href="/dosen/nilai" className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "0.85rem 1rem" }}>
              <Award size={18} color="#F59E0B" />
              <div>
                <div style={{ fontWeight: 600 }}>Kalkulasi Nilai Akhir (KHS)</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Hitung bobot Absen, Tugas, Keaktifan, UTS & UAS</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
