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
  FileText,
  CreditCard,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { academicApi, attendanceApi, lmsApi, studentApi, CourseClass, authApi, User, AttendanceRecord, Assignment, Quiz, ScannedCardResult } from "@/lib/api";
import { StatCard, LoadingSpinner, StatusBadge } from "@/components/ui";

export default function MahasiswaDashboardPage() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [attendancePercent, setAttendancePercent] = useState<string>("100%");
  const [attendanceSubtext, setAttendanceSubtext] = useState<string>("Semester aktif");
  const [totalAssignments, setTotalAssignments] = useState<number>(0);
  const [totalQuizzes, setTotalQuizzes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // KTM Registration State
  const [showKtmModal, setShowKtmModal] = useState(false);
  const [rfidInput, setRfidInput] = useState("");
  const [latestScanned, setLatestScanned] = useState<ScannedCardResult | null>(null);
  const [isCheckingCard, setIsCheckingCard] = useState(false);
  const [isSavingKtm, setIsSavingKtm] = useState(false);
  const [ktmSuccessMsg, setKtmSuccessMsg] = useState<string | null>(null);
  const [ktmErrorMsg, setKtmErrorMsg] = useState<string | null>(null);

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

  const fetchLatestCard = async () => {
    setIsCheckingCard(true);
    setKtmErrorMsg(null);
    try {
      const res = await studentApi.getLatestScannedCard();
      if (res.data) {
        setLatestScanned(res.data);
        if (res.data.found && res.data.rfid_uid) {
          setRfidInput(res.data.rfid_uid);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsCheckingCard(false);
    }
  };

  const handleOpenKtmModal = () => {
    setShowKtmModal(true);
    setKtmSuccessMsg(null);
    setKtmErrorMsg(null);
    if (user?.student_profile?.rfid_uid) {
      setRfidInput(user.student_profile.rfid_uid);
    }
    void fetchLatestCard();
  };

  const handleRegisterKtm = async (targetUid?: string) => {
    const uidToSave = (targetUid || rfidInput).trim().toUpperCase();
    if (!uidToSave) {
      setKtmErrorMsg("Masukkan atau deteksi UID kartu KTM Anda terlebih dahulu.");
      return;
    }
    setIsSavingKtm(true);
    setKtmErrorMsg(null);
    setKtmSuccessMsg(null);
    try {
      const res = await studentApi.registerMyKtm(uidToSave);
      if (res.error) {
        setKtmErrorMsg(res.error);
      } else {
        setKtmSuccessMsg(`KTM berhasil didaftarkan dengan UID ${uidToSave}!`);
        const meRes = await authApi.getMe();
        if (meRes.data) setUser(meRes.data);
        setTimeout(() => {
          setShowKtmModal(false);
          setKtmSuccessMsg(null);
        }, 1500);
      }
    } catch (e: any) {
      setKtmErrorMsg(e?.message || "Gagal mendaftarkan kartu KTM");
    } finally {
      setIsSavingKtm(false);
    }
  };

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
      <div className="stats">
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
                  padding: "14px 16px",
                  borderRadius: "var(--radius-search)",
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{c.course?.name || c.name}</h4>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                    Kode: {c.name} • {c.course?.credits || 3} SKS
                  </p>
                  <p style={{ fontSize: "11.5px", color: "var(--green)", marginTop: "4px" }}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Identitas Presensi IoT Kampus</h2>
            <button 
              type="button" 
              onClick={handleOpenKtmModal}
              className="btn btn-primary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <CreditCard size={14} />
              <span>{user?.student_profile?.rfid_uid ? "Ganti KTM" : "Daftarkan KTM"}</span>
            </button>
          </div>

          <div style={{ padding: "18px 20px", borderRadius: "var(--radius-card)", background: "linear-gradient(135deg, #1f2430, #2b3345)", color: "#fff", border: "1px solid #3a4256", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--green-accent)" }}>KARTU TANDA MAHASISWA</span>
              <Radio size={18} color="var(--green-accent)" />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{user?.full_name}</h3>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", marginTop: "3px" }}>
              NIM: {user?.student_profile?.nim || "202401001"}
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.15)" }}>
              <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.65)" }}>
                UID RFID: <code style={{ color: "var(--green-accent)", fontWeight: 700 }}>{user?.student_profile?.rfid_uid || "BELUM TERDAFTAR"}</code>
              </span>
              <StatusBadge 
                status={user?.student_profile?.rfid_uid ? "success" : "warning"} 
                label={user?.student_profile?.rfid_uid ? "KTM Terhubung" : "Belum Ada KTM"} 
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: "0.6rem" }}>
            <button 
              type="button" 
              onClick={handleOpenKtmModal}
              className="btn btn-secondary" 
              style={{ justifyContent: "flex-start", background: "rgba(56, 189, 248, 0.08)", borderColor: "rgba(56, 189, 248, 0.25)" }}
            >
              <CreditCard size={16} color="var(--primary-light)" />
              <span>Tautkan Kartu KTM RFID Anda</span>
            </button>
            <Link href="/mahasiswa/presensi" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              <Clock size={16} color="#10B981" />
              <span>Cek Rekap Kehadiran Perkuliahan</span>
            </Link>
            <Link href="/mahasiswa/tugas" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              <CheckSquare size={16} color="var(--primary-light)" />
              <span>Cek Tugas & Pengumpulan Berkas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Pendaftaran KTM */}
      {showKtmModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "grid",
          placeItems: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "32rem", width: "100%", padding: "1.75rem", position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowKtmModal(false)}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "rgba(56, 189, 248, 0.15)", display: "grid", placeItems: "center", color: "var(--primary-light)" }}>
                <CreditCard size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Pendaftaran Kartu KTM (RFID)</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Tautkan kartu fisik Anda untuk absensi otomatis di ruang kelas</p>
              </div>
            </div>

            {ktmSuccessMsg && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10B981", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle size={16} />
                <span>{ktmSuccessMsg}</span>
              </div>
            )}

            {ktmErrorMsg && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#EF4444", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} />
                <span>{ktmErrorMsg}</span>
              </div>
            )}

            {/* Auto Detect dari Reader ESP32 */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--radius-card)", padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Deteksi Otomatis dari Alat ESP32</span>
                <button
                  type="button"
                  onClick={fetchLatestCard}
                  disabled={isCheckingCard}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                >
                  <RefreshCw size={12} className={isCheckingCard ? "spin" : ""} />
                  <span>{isCheckingCard ? "Mengecek..." : "Cek Ulang"}</span>
                </button>
              </div>

              {latestScanned?.found && latestScanned.rfid_uid ? (
                <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Kartu Terakhir di Reader ({latestScanned.device_id || "ESP32"}):</div>
                    <code style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary-light)", letterSpacing: "0.05em" }}>
                      {latestScanned.rfid_uid}
                    </code>
                    {latestScanned.is_registered && (
                      <div style={{ fontSize: "0.7rem", color: "#F59E0B", marginTop: "0.2rem" }}>
                        Sudah terdaftar ke: {latestScanned.registered_to_name} ({latestScanned.registered_to_nim})
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRegisterKtm(latestScanned.rfid_uid)}
                    disabled={isSavingKtm}
                    className="btn btn-primary btn-sm"
                  >
                    Gunakan Kartu Ini
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                  💡 <strong>Cara Cepat:</strong> Dekatkan kartu KTM Anda ke modul RFID reader sekarang, lalu klik tombol <em>Cek Ulang</em>.
                </p>
              )}
            </div>

            {/* Input Manual */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Atau Ketik UID Kartu (Hex):</label>
              <input
                type="text"
                value={rfidInput}
                onChange={(e) => setRfidInput(e.target.value.toUpperCase())}
                placeholder="Contoh: D4CAEAD3"
                className="form-input"
                style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", letterSpacing: "0.05em" }}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                UID kartu dapat dilihat di Serial Monitor Arduino IDE saat kartu di-tap.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowKtmModal(false)}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleRegisterKtm()}
                disabled={isSavingKtm || !rfidInput.trim()}
                className="btn btn-primary"
              >
                {isSavingKtm ? "Menyimpan..." : "Simpan & Aktifkan KTM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
