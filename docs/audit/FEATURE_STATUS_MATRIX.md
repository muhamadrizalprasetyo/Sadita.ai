# SADITA.ai — Feature Status Matrix

**Tanggal:** 2026-10-30  
**Basis:** Audit repository commit `a7641e8`

---

## Legenda Status

| Status | Definisi |
|---|---|
| `DOCUMENTED` | Baru dijelaskan di dokumen, belum ada implementasi |
| `UI_ONLY` | Halaman/komponen tersedia, belum terbukti terhubung ke backend |
| `API_ONLY` | API/endpoint tersedia, belum ada UI atau flow lengkap |
| `DB_ONLY` | Tabel/model tersedia, belum ada alur API/UI lengkap |
| `PARTIALLY_CONNECTED` | Sebagian alur (UI→API atau API→DB) terhubung, tapi belum end-to-end |
| `END_TO_END_VERIFIED` | Alur UI→API→DB→respons terbukti berjalan lewat pengujian |
| `NOT_FOUND` | Tidak ditemukan di repository |
| `BLOCKED` | Tidak dapat diuji karena blocker |

---

## P0 — Fondasi dan Alur Inti

| # | Fitur | UI | API | DB | Status | Bukti / Catatan |
|---|---|---|---|---|---|---|
| P0-1 | Database PostgreSQL + migrasi | — | — | ✅ | `PARTIALLY_CONNECTED` | 6 migrasi Alembic + create_all bypass; belum dijalankan terpisah |
| P0-2 | Login / autentikasi JWT | ✅ Login page | ✅ /auth/login, /refresh, /me | ✅ User model | `PARTIALLY_CONNECTED` | Login flow berfungsi tapi scope check belum ada |
| P0-3 | Registrasi akun | — (via Admin) | ✅ /auth/register | ✅ User + Profile | `API_ONLY` | Register endpoint TERBUKA tanpa proteksi role |
| P0-4 | RBAC + role check | ✅ Navigation per role | ✅ require_roles deps | ✅ UserRole enum | `PARTIALLY_CONNECTED` | Role check ada, scope check BELUM ada |
| P0-5 | RBAC scope (dosen=kelas sendiri, mhs=data sendiri) | — | ❌ | — | `NOT_FOUND` | Hanya role check, scope assignment belum diimplementasi |
| P0-6 | Ketua Kelas assignment-based | — | ✅ /workflow/class-leader | ✅ ClassLeaderAssignment | `PARTIALLY_CONNECTED` | Model ada tapi UserRole masih punya KETUA_KELAS sebagai role global |
| P0-7 | Master Prodi | ✅ Admin → Akademik | ✅ CRUD | ✅ program_studi | `PARTIALLY_CONNECTED` | Seed ada, UI ada, API ada — belum diuji E2E |
| P0-8 | Master Semester/Tahun Akademik | ✅ Admin → Akademik | ✅ CRUD | ✅ academic_terms | `PARTIALLY_CONNECTED` | Same |
| P0-9 | Master Mata Kuliah | ✅ Admin → Akademik | ✅ CRUD | ✅ courses | `PARTIALLY_CONNECTED` | Same |
| P0-10 | Master Ruangan | — | ✅ CRUD | ✅ class_rooms | `API_ONLY` | Belum ada UI dedicated |
| P0-11 | Kelas (CourseClass) + jadwal + tipe | ✅ Admin → Akademik | ✅ CRUD | ✅ course_classes | `PARTIALLY_CONNECTED` | Support PAGI/MALAM/SHIFT, jadwal per kelas |
| P0-12 | Enrollment mahasiswa ke kelas | ✅ Admin → Akademik | ✅ CRUD | ✅ class_enrollments | `PARTIALLY_CONNECTED` | Unique constraint ada |
| P0-13 | KRS Request (tambah SKS/mengulang) | ✅ Mahasiswa → KRS | ✅ CRUD | ✅ krs_requests | `PARTIALLY_CONNECTED` | ⚠️ KrsRequest TIDAK diekspor di models/__init__.py |
| P0-14 | Profil mahasiswa (NIM, KTM status, angkatan) | ✅ Admin → Users | ✅ CRUD | ✅ student_profiles | `PARTIALLY_CONNECTED` | KTM status enum lengkap |
| P0-15 | Profil dosen (NIDN) | ✅ Admin → Users | ✅ CRUD | ✅ lecturer_profiles | `PARTIALLY_CONNECTED` | |
| P0-16 | RFID Credential | — | ✅ via student API | ✅ rfid_credentials | `API_ONLY` | Credential terpisah dari profile ✅ |
| P0-17 | Sesi presensi (create/open/close) | ✅ Admin → Presensi, Dosen → Presensi | ✅ CRUD + open/close | ✅ attendance_sessions | `PARTIALLY_CONNECTED` | Lifecycle SCHEDULED→OPEN→CLOSED ada |
| P0-18 | AttendanceRecord (status final) | ✅ | ✅ | ✅ | `PARTIALLY_CONNECTED` | Unique session+student constraint ✅ |
| P0-19 | AttendanceEvent (raw device event) | — | ✅ via MQTT handler | ✅ attendance_events | `PARTIALLY_CONNECTED` | event_uuid idempotency ✅ |
| P0-20 | RFID event via MQTT | — | ✅ Handler | ✅ | `PARTIALLY_CONNECTED` | Handler exists, belum diuji end-to-end |
| P0-21 | Device management | ✅ Admin → Perangkat | ✅ CRUD | ✅ sadita_devices | `PARTIALLY_CONNECTED` | |
| P0-22 | Seed data operasional | — | — | ✅ | `PARTIALLY_CONNECTED` | Seed komprehensif tapi label "demo" kurang jelas |
| P0-23 | Audit Log | — | ✅ GET /audit | ✅ audit_logs | `PARTIALLY_CONNECTED` | Model minim (no IP, no reason) |
| P0-24 | Pertemuan 1-16 per kelas | — | ✅ via seed_schedule | ✅ attendance_sessions | `DB_ONLY` | Seed schedule membuat 16 sesi per kelas |

---

## P1 — LMS dan Evaluasi

| # | Fitur | UI | API | DB | Status | Bukti / Catatan |
|---|---|---|---|---|---|---|
| P1-1 | Materi per Chapter/Lesson | ✅ Dosen/Mhs → Materi | ✅ CRUD | ✅ chapters, lessons, materials | `PARTIALLY_CONNECTED` | Model Frappe LMS pattern (chapter-based, bukan pertemuan-based) |
| P1-2 | Tugas + submission | ✅ Dosen → Tugas, Mhs → Tugas | ✅ CRUD + submit | ✅ assignments, submissions | `PARTIALLY_CONNECTED` | Support individu; kelompok belum ada |
| P1-3 | Kuis + soal + jawaban | ✅ Dosen → Kuis, Mhs → Kuis | ✅ CRUD | ✅ quizzes, questions, options, submissions, answers | `PARTIALLY_CONNECTED` | Tipe soal: SINGLE/MULTI/TEXT ✅ |
| P1-4 | Lesson Progress + Course Progress | — | ✅ API | ✅ | `API_ONLY` | |
| P1-5 | Student Grade (nilai akhir) | ✅ Dosen → Nilai | ✅ API | ✅ student_grades | `PARTIALLY_CONNECTED` | |
| P1-6 | Grade Scale (A-E) | — | — | ✅ GradeScale enum | `DB_ONLY` | Belum ada konversi A-E configurable |
| P1-7 | Formula nilai (UTS 30%, UAS 35%, dst) | — | ✅ grading_service | — | `API_ONLY` | Logic di service, belum configurable per matkul |
| P1-8 | Nilai aktivitas default 80 | — | — | — | `NOT_FOUND` | Belum diimplementasi |
| P1-9 | Late submission configurable | — | ✅ Partial | ✅ SubmissionStatus.LATE | `API_ONLY` | Status ada, konfigurasi per-tugas belum |
| P1-10 | Dashboard Dosen (data aktual) | ✅ Page ada | ❌ | — | `UI_ONLY` | Halaman ada tapi belum terbukti memakai data API aktual |
| P1-11 | Dashboard Mahasiswa (data aktual) | ✅ Page ada | ❌ | — | `UI_ONLY` | Same |
| P1-12 | Dashboard Admin (data aktual) | ✅ Page ada | ✅ Health + aggregations | — | `PARTIALLY_CONNECTED` | Admin dashboard paling lengkap tapi perlu verifikasi metrik |
| P1-13 | Dashboard Kaprodi | ✅ Page ada | ❌ | — | `UI_ONLY` | |
| P1-14 | Ekspor CSV/Excel/PDF | — | — | — | `NOT_FOUND` | |
| P1-15 | Autosave kuis | — | — | — | `NOT_FOUND` | |
| P1-16 | Timer kuis (backend-enforced) | — | ✅ Partial | ✅ quiz.duration_minutes | `PARTIALLY_CONNECTED` | Field ada, enforcement backend TBD |

---

## P2 — Lanjutan

| # | Fitur | UI | API | DB | Status | Bukti / Catatan |
|---|---|---|---|---|---|---|
| P2-1 | SI KOBAR (FAQ/navigasi) | ✅ kobar-assistant.tsx | — | — | `UI_ONLY` | UI chatbot ada, belum terhubung LLM/backend |
| P2-2 | Notifikasi email/WhatsApp/Telegram | — | — | — | `NOT_FOUND` | |
| P2-3 | Fingerprint authentication | ✅ Firmware support | ✅ MQTT handler | ✅ fingerprint_credentials | `PARTIALLY_CONNECTED` | Model + handler ada, hardware belum tersedia |
| P2-4 | Analitik/prediksi lanjutan | — | — | — | `NOT_FOUND` | |
| P2-5 | Cloud deployment | — | — | — | `DOCUMENTED` | Hanya di docs, belum ada infra |
| P2-6 | Koreksi presensi dengan approval | — | ✅ /workflow/attendance-requests | ✅ attendance_requests | `API_ONLY` | Alur PENDING→VERIFIED→APPROVED |

---

## Cross-Cutting Concerns

| # | Concern | Status | Catatan |
|---|---|---|---|
| CC-1 | Scope-based authorization (dosen=kelas sendiri) | `NOT_FOUND` | **PALING KRITIS** — belum ada di backend |
| CC-2 | Rate limiting | `NOT_FOUND` | Tidak ada di app maupun middleware |
| CC-3 | Input validation backend | `PARTIALLY_CONNECTED` | Pydantic schema ada, tapi validasi bisnis bervariasi |
| CC-4 | CORS | ✅ Configured | `allow_origins` dari env |
| CC-5 | Timezone consistency | `PARTIALLY_CONNECTED` | UTC timestamps di model, tapi konversi Asia/Jakarta belum ada |
| CC-6 | .env.example | ✅ | Ada untuk backend dan frontend |
| CC-7 | Error handling konsisten | `PARTIALLY_CONNECTED` | HTTPException dipakai tapi tidak ada global error envelope |
| CC-8 | Pagination/filter server-side | `PARTIALLY_CONNECTED` | Beberapa endpoint ada, belum konsisten |
| CC-9 | File storage abstraction | `PARTIALLY_CONNECTED` | Upload endpoint ada, tapi langsung disk tanpa access control |
| CC-10 | HTTPS/TLS | `NOT_FOUND` | Development mode HTTP |

---

*Matrix ini akan diperbarui setiap kali ada perubahan implementasi.*
