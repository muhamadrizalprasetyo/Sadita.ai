# SADITA.ai — Requirements Traceability Matrix

**Versi:** 1.0  
**Tanggal:** 2026-10-30

---

## Cara Membaca

Setiap baris menghubungkan: **Requirement → Business Rule → Modul/Model → API Endpoint → Test** dengan status implementasi.

---

## P0 — Fondasi dan Alur Inti

### FR-AUTH: Autentikasi

| Req ID | Deskripsi | Business Rule | Model/Tabel | API Endpoint | Test | Status |
|---|---|---|---|---|---|---|
| FR-AUTH-001 | Login via email/NIM + password | BR-AUTH-001 | User, StudentProfile | POST /auth/login | test_phase2 | `PARTIALLY_CONNECTED` |
| FR-AUTH-002 | Pembuatan akun hanya oleh Admin | BR-AUTH-002 | User | POST /auth/register | ❌ Belum ada protection | `API_ONLY` — **RISIKO** |
| FR-AUTH-003 | Token JWT access + refresh | BR-AUTH-001 | — | POST /auth/login, /auth/refresh | test_phase2 | `PARTIALLY_CONNECTED` |
| FR-AUTH-004 | Ubah password | BR-AUTH-008 | User | POST /auth/change-password | test_phase2 | `PARTIALLY_CONNECTED` |
| FR-AUTH-005 | Profil user yang login | — | User + profiles | GET /auth/me | test_phase2 | `PARTIALLY_CONNECTED` |

### FR-ROLE: RBAC + Scope

| Req ID | Deskripsi | Business Rule | Model/Tabel | API Endpoint | Test | Status |
|---|---|---|---|---|---|---|
| FR-ROLE-001 | Role check per endpoint | BR-ROLE-001 | UserRole enum | require_roles deps | test_phase2 | `PARTIALLY_CONNECTED` |
| FR-ROLE-002 | Scope check: dosen hanya kelas sendiri | BR-ROLE-003 | CourseClass.lecturer_id | — | ❌ | `NOT_FOUND` |
| FR-ROLE-003 | Scope check: mahasiswa hanya data sendiri | BR-ROLE-004 | ClassEnrollment.student_id | — | ❌ | `NOT_FOUND` |
| FR-ROLE-004 | Scope check: kaprodi hanya prodi sendiri | BR-ROLE-005 | ProgramStudi.id | — | ❌ | `NOT_FOUND` |
| FR-ROLE-005 | Ketua Kelas sebagai assignment | BR-ROLE-002 | ClassLeaderAssignment | POST /workflow/class-leader | test_class_leader | `PARTIALLY_CONNECTED` |

### FR-AKAD: Master Akademik

| Req ID | Deskripsi | Business Rule | Model/Tabel | API Endpoint | Test | Status |
|---|---|---|---|---|---|---|
| FR-AKAD-001 | CRUD Program Studi | BR-AKAD-001 | ProgramStudi | /academic/prodi | test_academic | `PARTIALLY_CONNECTED` |
| FR-AKAD-002 | CRUD Semester | BR-AKAD-006 | AcademicTerm | /academic/terms | test_academic | `PARTIALLY_CONNECTED` |
| FR-AKAD-003 | CRUD Mata Kuliah | BR-AKAD-001 | Course | /academic/courses | test_academic | `PARTIALLY_CONNECTED` |
| FR-AKAD-004 | CRUD Kelas + tipe + jadwal | BR-AKAD-002 | CourseClass | /academic/classes | test_academic | `PARTIALLY_CONNECTED` |
| FR-AKAD-005 | CRUD Ruangan | — | ClassRoom | /academic/rooms | ❌ | `API_ONLY` |
| FR-AKAD-006 | 16 pertemuan per kelas | BR-AKAD-003 | AttendanceSession | seed_schedule | ✅ seed | `DB_ONLY` |

### FR-ENR: Enrollment dan KRS

| Req ID | Deskripsi | Business Rule | Model/Tabel | API Endpoint | Test | Status |
|---|---|---|---|---|---|---|
| FR-ENR-001 | Enrollment mahasiswa ke kelas | BR-ENR-001 | ClassEnrollment | /academic/enrollments | test_academic | `PARTIALLY_CONNECTED` |
| FR-ENR-002 | Tolak enrollment ganda | BR-ENR-001 | uq_class_student_enrollment | — | test_academic | `PARTIALLY_CONNECTED` |
| FR-ENR-003 | KRS request flow | BR-ENR-004 | KrsRequest | /students/.../krs | test_academic_krs | `PARTIALLY_CONNECTED` — ⚠️ model belum diekspor di __init__ |
| FR-ENR-004 | KRS approval membuat enrollment | BR-ENR-005 | KrsRequest → ClassEnrollment | — | ❌ | `PARTIALLY_CONNECTED` |

### FR-ATT: Presensi

| Req ID | Deskripsi | Business Rule | Model/Tabel | API Endpoint | Test | Status |
|---|---|---|---|---|---|---|
| FR-ATT-001 | Sesi presensi lifecycle (SCHED→OPEN→CLOSED) | BR-ATT-001 | AttendanceSession | /attendance/sessions | test_phase3 | `PARTIALLY_CONNECTED` |
| FR-ATT-002 | Record presensi (unique per session+student) | BR-ATT-004 | AttendanceRecord | /attendance/records | test_phase3 | `PARTIALLY_CONNECTED` |
| FR-ATT-003 | RFID event ingestion via MQTT | BR-ATT-012 | AttendanceEvent | MQTT handler | test_phase3 | `PARTIALLY_CONNECTED` |
| FR-ATT-004 | Idempotency (event_uuid) | BR-ATT-006 | AttendanceEvent.event_uuid | MQTT handler | test_phase3 | `PARTIALLY_CONNECTED` |
| FR-ATT-005 | Auto-ALFA pada finalisasi | BR-ATT-007 | AttendanceRecord | /attendance/finalize | test_phase3 | `PARTIALLY_CONNECTED` |
| FR-ATT-006 | Toleransi keterlambatan configurable | BR-ATT-003 | CourseClass.batas_terlambat_menit | — | ❌ | `DB_ONLY` |
| FR-ATT-007 | Delay tracking (scheduled vs opened) | BR-ATT-008 | ❌ Kolom belum ada | — | ❌ | `NOT_FOUND` |
| FR-ATT-008 | Presensi alternatif (tanpa KTM) | BR-ATT-009 | AttendanceRequest | /workflow/attendance-requests | test_class_leader | `PARTIALLY_CONNECTED` |

### FR-DEVICE: Perangkat IoT

| Req ID | Deskripsi | Business Rule | Model/Tabel | API Endpoint | Test | Status |
|---|---|---|---|---|---|---|
| FR-DEVICE-001 | CRUD perangkat | BR-DEVICE-001 | SaditaDevice | /devices | test_devices | `PARTIALLY_CONNECTED` |
| FR-DEVICE-002 | Heartbeat/last_seen update | BR-DEVICE-001 | SaditaDevice.last_seen_at | MQTT status handler | ❌ | `PARTIALLY_CONNECTED` |
| FR-DEVICE-003 | Audit perubahan penempatan | BR-DEVICE-003 | AuditLog | — | ❌ | `NOT_FOUND` |

---

## P1 — LMS dan Evaluasi

| Req ID | Deskripsi | Business Rule | Model/Tabel | API Endpoint | Test | Status |
|---|---|---|---|---|---|---|
| FR-LMS-001 | Materi per pertemuan | BR-LMS-001 | CourseMaterial, CourseLesson | /lms/materials | test_phase4 | `PARTIALLY_CONNECTED` |
| FR-LMS-002 | Tugas + submission | BR-LMS-004 | Assignment, AssignmentSubmission | /lms/assignments | test_phase4 | `PARTIALLY_CONNECTED` |
| FR-LMS-003 | Kuis + soal + jawaban | BR-LMS-007 | Quiz, QuizQuestion, QuizSubmission | /lms/quizzes | test_phase4 | `PARTIALLY_CONNECTED` |
| FR-LMS-004 | Tugas kelompok | BR-LMS-006 | ❌ | — | ❌ | `NOT_FOUND` |
| FR-LMS-005 | Autosave kuis | BR-LMS-008 | ❌ | — | ❌ | `NOT_FOUND` |
| FR-GRADE-001 | Formula nilai + bobot | BR-GRADE-001 | StudentGrade | grading_service | ❌ | `API_ONLY` |
| FR-GRADE-002 | Nilai aktivitas default 80 | BR-GRADE-002 | ❌ | — | ❌ | `NOT_FOUND` |
| FR-GRADE-003 | Publikasi nilai | BR-GRADE-004 | StudentGrade.is_published? | — | ❌ | `NOT_FOUND` |
| FR-GRADE-004 | Ekspor laporan | BR-LMS-001 | ❌ | — | ❌ | `NOT_FOUND` |
| FR-DASH-001 | Dashboard data aktual | — | Query aggregation | Various | ❌ | `UI_ONLY` |

---

## P2 — Lanjutan

| Req ID | Deskripsi | Business Rule | Model/Tabel | API Endpoint | Test | Status |
|---|---|---|---|---|---|---|
| FR-KOBAR-001 | SI KOBAR FAQ/navigasi | — | — | — | ❌ | `UI_ONLY` |
| FR-NOTIF-001 | Notifikasi multi-channel | — | ❌ | — | ❌ | `NOT_FOUND` |
| FR-FP-001 | Fingerprint authentication | — | FingerprintCredential | MQTT handler | ❌ | `PARTIALLY_CONNECTED` |

---

## Non-Functional Requirements

| Req ID | Deskripsi | Business Rule | Implementasi | Test | Status |
|---|---|---|---|---|---|
| NFR-SEC-001 | Backend scope enforcement | BR-ROLE-003..006 | ❌ | ❌ | `NOT_FOUND` — **KRITIS** |
| NFR-SEC-002 | Audit log lengkap (IP, UA, reason) | BR-AUDIT-003 | Partial (no IP/UA) | ❌ | `PARTIALLY_CONNECTED` |
| NFR-SEC-003 | Register endpoint protection | BR-AUTH-002 | ❌ Endpoint terbuka | ❌ | `NOT_FOUND` — **KRITIS** |
| NFR-SEC-004 | Rate limiting | — | ❌ | ❌ | `NOT_FOUND` |
| NFR-SEC-005 | MQTT TLS + auth | — | ❌ | ❌ | `NOT_FOUND` |
| NFR-PERF-001 | Pagination server-side | — | Partial | ❌ | `PARTIALLY_CONNECTED` |
| NFR-PERF-002 | Timezone UTC + Asia/Jakarta display | BR-ATT-011 | Partial (UTC stored, no WIB conversion) | ❌ | `PARTIALLY_CONNECTED` |

---

## Ringkasan Gap

| Kategori | Total Requirements | Implemented (E2E) | Partially Connected | Not Found |
|---|---|---|---|---|
| P0 Auth | 5 | 0 | 4 | 1 |
| P0 RBAC + Scope | 5 | 0 | 2 | 3 |
| P0 Akademik | 6 | 0 | 4 | 0 |
| P0 Enrollment | 4 | 0 | 3 | 0 |
| P0 Presensi | 8 | 0 | 5 | 2 |
| P0 Device | 3 | 0 | 2 | 1 |
| P1 LMS/Grade | 10 | 0 | 3 | 5 |
| P2 | 3 | 0 | 1 | 2 |
| NFR | 7 | 0 | 2 | 4 |
| **TOTAL** | **51** | **0** | **26** | **18** |

> **Tidak ada fitur yang berstatus END_TO_END_VERIFIED.** Semua fitur memerlukan pengujian end-to-end yang terbukti.

---

*Matrix ini diperbarui setiap kali ada perubahan implementasi atau test baru yang lulus.*
