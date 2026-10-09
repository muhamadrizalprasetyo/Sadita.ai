"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckSquare, 
  HelpCircle, 
  Award, 
  ArrowRight,
  Radio,
  FileText
} from "lucide-react";
import { academicApi, attendanceApi, lmsApi, CourseClass, authApi, User, AttendanceRecord, Assignment, Quiz } from "@/lib/api";
import { StatCard, LoadingSpinner, StatusBadge } from "@/components/ui";

export default function MahasiswaDashboardPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [attendancePercent, setAttendancePercent] = useState<string>("100%");
  const [attendanceSubtext, setAttendanceSubtext] = useState<string>("Semester aktif");
  const [totalAssignments, setTotalAssignments] = useState<number>(0);
  const [totalQuizzes, setTotalQuizzes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [cRes, uRes] = await Promise.all([
          academicApi.getClasses(),
          authApi.getMe(),
        ]);
        
        const classList = cRes.data ?? [];
        setClasses(classList);
        if (uRes.data) setUser(uRes.data);

        const studentId = uRes.data?.student_profile?.id;
        if (studentId) {
          const attRes = await attendanceApi.getStudentHistory(studentId);
          if (attRes.data && attRes.data.length > 0) {
            const records = attRes.data;
            const attended = records.filter((r: AttendanceRecord) => r.status === "HADIR" || r.status === "TERLAMBAT").length;
            const pct = Math.round((attended / records.length) * 100);
            setAttendancePercent(`${pct}%`);
            setAttendanceSubtext(`${attended} dari ${records.length} pertemuan`);
          } else {
            setAttendancePercent("100%");
            setAttendanceSubtext("Presensi optimal");
          }
        }

        // Fetch assignments & quizzes across student classes
        if (classList.length > 0) {
          const assignmentPromises = classList.map(c => lmsApi.getAssignments(c.id));
          const quizPromises = classList.map(c => lmsApi.getQuizzes(c.id));
          const [assignResults, quizResults] = await Promise.all([
            Promise.all(assignmentPromises),
            Promise.all(quizPromises),
          ]);
          
          const totalA = assignResults.reduce((acc: number, curr: { data?: Assignment[] }) => acc + (curr.data?.length ?? 0), 0);
          const totalQ = quizResults.reduce((acc: number, curr: { data?: Quiz[] }) => acc + (curr.data?.length ?? 0), 0);
          setTotalAssignments(totalA);
          setTotalQuizzes(totalQ);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (loading) return <LoadingSpinner text="Memuat portal belajar mahasiswa..." />;

  const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Selamat Datang, {user?.full_name}</h1>
          <p className="page-subtitle">Portal Akademik Mahasiswa S1 Teknologi Informasi • Tahun 2026/2027</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/mahasiswa/presensi" className="btn btn-secondary">
            <Clock size={16} /> Riwayat Presensi
          </Link>
          <Link href="/mahasiswa/kuis" className="btn btn-primary">
            <HelpCircle size={16} /> Kuis Aktif
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="stat-grid">
        <StatCard
          label="Mata Kuliah Diambil"
          value={classes.length}
          icon={BookOpen}
          color="blue"
          subtext={`Total ${classes.reduce((sum, c) => sum + (c.course?.credits || 3), 0)} SKS`}
        />
        <StatCard
          label="Persentase Kehadiran"
          value={attendancePercent}
          icon={Clock}
          color="green"
          subtext={attendanceSubtext}
        />
        <StatCard
          label="Tugas Terdaftar"
          value={`${totalAssignments} Tugas`}
          icon={CheckSquare}
          color="orange"
          subtext="LMS Perkuliahan"
        />
        <StatCard
          label="Kuis Online"
          value={`${totalQuizzes} Kuis`}
          icon={HelpCircle}
          color="purple"
          subtext="Kuis Interaktif"
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", gap: "1.5rem" }}>
        {/* Classes List */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Mata Kuliah Semester Ini</h2>
            <Link href="/mahasiswa/mata-kuliah" className="btn btn-outline btn-sm">
              Semua Modul <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: "grid", gap: "0.85rem" }}>
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
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{c.course?.name || c.name}</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                    Kode: {c.name} • {c.course?.credits || 3} SKS
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--primary-light)", marginTop: "0.2rem" }}>
                    <Calendar size={12} style={{ display: "inline", marginRight: "4px" }} />
                    {dayNames[c.day_of_week] || "Senin"}, {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)} WIB
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Link href="/mahasiswa/mata-kuliah" className="btn btn-secondary btn-sm">
                    Materi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KTM & Hardware Status Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Identitas Presensi IoT Kampus</h2>

          <div style={{ padding: "1.25rem", borderRadius: "var(--radius-xl)", background: "linear-gradient(135deg, #1E293B, #0F172A)", border: "1px solid rgba(56, 189, 248, 0.3)", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--primary-light)" }}>KARTU TANDA MAHASISWA</span>
              <Radio size={18} color="var(--primary-light)" />
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{user?.full_name}</h3>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              NIM: {user?.student_profile?.nim || "202401001"}
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>UID RFID: <code style={{ color: "var(--primary-light)" }}>{user?.student_profile?.rfid_uid || "E2000019"}</code></span>
              <StatusBadge status="success" label="KTM Aktif" />
            </div>
          </div>

          <div style={{ display: "grid", gap: "0.6rem" }}>
            <Link href="/mahasiswa/tugas" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              <CheckSquare size={16} color="var(--primary-light)" />
              <span>Cek Tugas & Pengumpulan Berkas</span>
            </Link>
            <Link href="/mahasiswa/kuis" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              <HelpCircle size={16} color="#8B5CF6" />
              <span>Kerjakan Kuis Online</span>
            </Link>
            <Link href="/mahasiswa/nilai" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              <Award size={16} color="#F59E0B" />
              <span>Lihat Transkrip & KHS Semester</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
