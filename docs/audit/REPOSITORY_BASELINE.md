# SADITA.ai — Repository Baseline Audit

**Tanggal audit:** 2026-10-30  
**Auditor:** Antigravity (automated technical audit)  
**Commit terakhir:** `a7641e8` (Merge PR #5 — docs/enterprise-architecture-and-standards)  
**Total commits:** 27  
**Branch aktif:** `main`

---

## 1. Teknologi dan Runtime

| Layer | Teknologi | Versi (dari repo) | Bukti |
|---|---|---|---|
| **Frontend** | Next.js + TypeScript + React | Next 16.3.7 / React 19.2.8 | [package.json](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/frontend/package.json) |
| **Backend** | FastAPI + Python | FastAPI 0.115.14 | [requirements.txt](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/requirements.txt) |
| **ORM** | SQLAlchemy 2.0 | 2.0.41 | [requirements.txt](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/requirements.txt) |
| **Migrasi DB** | Alembic | 1.15.2 | [alembic.ini](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/alembic.ini) |
| **Database** | PostgreSQL | 18 (README), port 5433 | [.env.example](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/.env.example) |
| **Auth** | JWT (python-jose + bcrypt) | python-jose 3.5.0 | [security.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/core/security.py) |
| **MQTT** | paho-mqtt | 2.1.0 | [requirements.txt](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/requirements.txt) |
| **Firmware** | PlatformIO / ESP32-S3 | Config v1.0.0 | [platformio.ini](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/firmware/platformio.ini) |
| **CSS** | Vanilla CSS (no framework) | — | [globals.css](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/frontend/app/globals.css) |
| **Icons** | lucide-react | ^1.52.0 | [package.json](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/frontend/package.json) |

### Temuan stack:
- **README** menyebut Python 3.14, Node.js 24, PostgreSQL 18 — versi yang sangat baru. Belum diverifikasi apakah tersedia di mesin pengembang.
- Tidak ada Docker/Compose di repository.
- Tidak ada `asyncpg` yang dipakai sebagai engine async; engine SQLAlchemy synchronous (`create_engine`).
- `structlog` terdaftar di requirements tetapi belum digunakan — logging masih `logging.basicConfig`.

---

## 2. Struktur Direktori

```
sadita.ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  — 13 endpoint files
│   │   ├── core/              — config, deps, security
│   │   ├── db/                — session, seed, seed_schedule
│   │   ├── models/            — 11 model files
│   │   ├── mqtt/              — client, handlers
│   │   ├── repositories/      — 4 repo files
│   │   ├── schemas/           — 9 schema files
│   │   └── services/          — 6 service files
│   ├── alembic/versions/      — 6 migration files
│   ├── tests/                 — 10 test files
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── login/             — Login page
│   │   ├── admin/             — 6 subdirs (dashboard, akademik, lms, perangkat, presensi, users)
│   │   ├── dosen/             — 7 subdirs (dashboard, kelas, kuis, materi, nilai, presensi, tugas)
│   │   ├── mahasiswa/         — 10 subdirs (dashboard, jadwal, krs, kuis, mata-kuliah, materi, nilai, pengaturan, presensi, tugas)
│   │   ├── kaprodi/           — 5 subdirs (dashboard, dosen, kurikulum, mahasiswa, presensi)
│   │   └── ketua-kelas/       — subdirs TBD
│   ├── components/            — role-shell, kobar-assistant, operational-pages, attendance-workspace, ui/
│   └── lib/api.ts             — Centralized API client (863 lines)
├── firmware/
│   ├── src/main.cpp + config.h — ESP32-S3 + RC522 + LCD + Buzzer + FP
│   └── platformio.ini
├── docs/                       — phase docs, audit, specs, proposal, diagrams
├── scripts/                    — init_db, iot_simulator, PowerShell scripts
└── .agents/                    — skill/rule bundles (anti-slop, dealtech-ui, learnstack-lms, sadita)
```

---

## 3. Database Schema (Models)

### Tabel yang terdefinisi (SQLAlchemy ORM)

| Model | Tabel | File | Status Migrasi |
|---|---|---|---|
| `User` | `users` | [user.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/user.py) | ✅ Migrated |
| `ProgramStudi` | `program_studi` | [program_studi.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/program_studi.py) | ✅ Migrated |
| `LecturerProfile` | `lecturer_profiles` | [lecturer.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/lecturer.py) | ✅ Migrated |
| `StudentProfile` | `student_profiles` | [student.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/student.py) | ✅ Migrated |
| `RfidCredential` | `rfid_credentials` | [credential.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/credential.py) | ✅ Migrated |
| `FingerprintCredential` | `fingerprint_credentials` | [credential.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/credential.py) | ✅ Migrated |
| `AcademicTerm` | `academic_terms` | [academic.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/academic.py) | ✅ Migrated |
| `Course` | `courses` | [academic.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/academic.py) | ✅ Migrated |
| `ClassRoom` | `class_rooms` | [academic.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/academic.py) | ✅ Migrated |
| `CourseClass` | `course_classes` | [academic.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/academic.py) | ✅ Migrated |
| `ClassEnrollment` | `class_enrollments` | [academic.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/academic.py) | ✅ Migrated |
| `KrsRequest` | `krs_requests` | [academic.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/academic.py) | ⚠️ Model defined, not listed in __init__ exports |
| `SaditaDevice` | `sadita_devices` | [device.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/device.py) | ✅ Migrated |
| `AttendanceSession` | `attendance_sessions` | [attendance.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/attendance.py) | ✅ Migrated |
| `AttendanceRecord` | `attendance_records` | [attendance.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/attendance.py) | ✅ Migrated |
| `AttendanceEvent` | `attendance_events` | [attendance.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/attendance.py) | ✅ Migrated |
| `CourseChapter` | `course_chapters` | [lms.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/lms.py) | ✅ Migrated |
| `CourseLesson` | `course_lessons` | [lms.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/lms.py) | ✅ Migrated |
| `CourseMaterial` | `course_materials` | [lms.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/lms.py) | ✅ Migrated |
| `Assignment` | `assignments` | [lms.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/lms.py) | ✅ Migrated |
| `AssignmentSubmission` | `assignment_submissions` | [lms.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/lms.py) | ✅ Migrated |
| `Quiz` / `QuizQuestion` / `QuizOption` / `QuizSubmission` / `QuizAnswer` | `quizzes`, `quiz_questions`, etc. | [lms.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/lms.py) | ✅ Migrated |
| `LessonProgress` / `CourseProgress` | `lesson_progress`, `course_progress` | [lms.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/lms.py) | ✅ Migrated |
| `StudentGrade` | `student_grades` | [lms.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/lms.py) | ✅ Migrated |
| `AuditLog` | `audit_logs` | [workflow.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/workflow.py) | ✅ Migrated |
| `AttendanceRequest` | `attendance_requests` | [workflow.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/workflow.py) | ✅ Migrated |
| `ClassLeaderAssignment` | `class_leader_assignments` | [workflow.py](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/workflow.py) | ✅ Migrated |

### Temuan schema:
- Unique constraint `uq_class_student_enrollment` ada ✅
- Unique constraint `uq_session_student_attendance` ada ✅
- Unique constraint `uq_class_session_number` ada ✅
- Event idempotency key (`event_uuid` unique) ada ✅
- `KrsRequest` model terdefinisi di `academic.py` tapi **TIDAK diekspor** di `__init__.py` — kemungkinan tidak masuk `create_all` jika hanya import dari `__init__` (perlu verifikasi).
- `UserRole` punya `KETUA_KELAS` sebagai role global — berbeda dari spesifikasi master prompt yang menginginkan Ketua Kelas sebagai assignment/permission, bukan role terpisah.
- `AttendanceSession` belum memiliki kolom `scheduled_start_at` dan `delay_minutes` — hanya ada `dibuka_pada` dan `ditutup_pada`.
- `AuditLog` tidak menyimpan `ip_address`, `user_agent`, atau `reason` — hanya `actor_id`, `action`, `entity`, `before`, `after`.

---

## 4. Alembic Migrations

| # | File | Deskripsi |
|---|---|---|
| 1 | `20260930_1755_create_initial_schema.py` | Skema awal semua tabel inti |
| 2 | `20261001_2133_v2_rebuild_real_schema.py` | Rebuild dengan skema v2 yang real |
| 3 | `20261003_1000_class_leader_workflow.py` | Tabel ClassLeaderAssignment + AttendanceRequest + AuditLog |
| 4 | `20261003_1646_add_enhanced_lms_models_chapters_.py` | LMS Chapter/Lesson/Quiz enhanced |
| 5 | `20261003_1650_add_attendance_lesson_relationship.py` | FK lesson → session |
| 6 | `20261003_1716_add_studentgrade_model_with_sadita_.py` | StudentGrade model |

**Catatan:** `main.py` menggunakan `Base.metadata.create_all()` yang bypass Alembic — ini berarti tabel dibuat langsung dari models tanpa migration. Migration bisa tidak sinkron dengan model aktual.

---

## 5. API Endpoints

API terorganisasi di `api/v1/endpoints/`:

| File | Prefix | Routes | Cakupan |
|---|---|---|---|
| `health.py` | `/health` | GET | Status backend + DB + MQTT |
| `auth.py` | `/auth` | POST /login, /register, /refresh, /change-password; GET /me | Auth lengkap |
| `users.py` | `/users` | GET / {id} | List + detail users |
| `students.py` | `/students` | CRUD + enrollment management | Mahasiswa + KRS |
| `lecturers.py` | `/lecturers` | GET / | List dosen |
| `academic.py` | `/academic` | CRUD terms, courses, classes, rooms, enrollments | Master akademik |
| `attendance.py` | `/attendance` | Sessions, records, stats, open/close | Sesi presensi |
| `devices.py` | `/devices` | CRUD perangkat IoT | Device management |
| `workflow.py` | `/workflow` | Class leader + attendance requests + audit | Alur ketua kelas |
| `audit.py` | `/audit` | GET logs | Read audit log |
| `lms.py` | `/lms` | Chapters, lessons, materials, assignments, quizzes, submissions, grades | LMS lengkap |
| `uploads.py` | `/uploads` | POST file upload, GET serve file | File management |

---

## 6. Autentikasi dan Otorisasi

### Mekanisme:
- JWT access + refresh token via `python-jose` + `bcrypt`
- Token di-store di `localStorage` (frontend)
- `HTTPBearer` dependency pada FastAPI

### RBAC:
- Role: `ADMIN`, `KAPRODI`, `DOSEN`, `KETUA_KELAS`, `MAHASISWA`
- Dependency helpers: `RequireAdmin`, `RequireLecturer`, `RequireStudent`, etc.
- **KRITIS:** RBAC hanya cek **role**, bukan **scope/assignment**. Dosen bisa mengakses kelas manapun, mahasiswa bisa melihat data mahasiswa lain jika ID diketahui — bergantung pada implementasi per-endpoint.

### Temuan keamanan:
1. `KETUA_KELAS` adalah role global, bukan assignment — melanggar spesifikasi bahwa ketua kelas harusnya mahasiswa + assignment permission.
2. Belum ada scope-check (dosen hanya kelas yang ditugaskan, mahasiswa hanya data sendiri) — perlu audit per-endpoint.
3. Token disimpan di localStorage, rentan XSS. Spesifikasi mensyaratkan httpOnly cookie + SameSite.
4. `register` endpoint terbuka tanpa rate limiting — siapa pun bisa mendaftar akun.
5. Tidak ada IP/user-agent tracking pada audit log.
6. Refresh token tidak menggunakan rotation — token yang sama bisa dipakai berulang.

---

## 7. MQTT dan IoT

### Backend MQTT:
- `mqtt/client.py` — MQTTv5 client via paho-mqtt 2.1.0 dengan reconnect otomatis
- `mqtt/handlers.py` — Handler untuk topik: status, rfid, fingerprint, direct-fingerprint
- Topik: `sadita/device/{device_id}/rfid`, `/fingerprint`, `/status`, `/command`, `/ack`
- Handler **menulis langsung ke database** dari thread MQTT (bukan async, memakai `SessionLocal()`)

### Firmware:
- [main.cpp](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/firmware/src/main.cpp) — 15KB, ESP32-S3 + RC522 + LCD I2C + AS608 Fingerprint + LED + Buzzer
- [config.h](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/firmware/src/config.h) — WiFi credentials, MQTT broker IP, pin definitions

### Temuan IoT:
1. Firmware memakai LCD I2C 16x2, bukan TFT SPI 3,5 inci (spec menyebut TFT SPI).
2. MQTT tanpa TLS (port 1883), tanpa autentikasi (username/password kosong).
3. Credential WiFi hardcoded di config.h.
4. MQTT handler menulis ke DB di thread terpisah tanpa session management yang aman — potensi race condition.
5. IoT simulator tersedia di `scripts/iot_simulator.py` — berguna untuk pengujian.

---

## 8. Frontend

### Halaman per Role:

**Admin:** dashboard, users, akademik, presensi, lms, perangkat  
**Dosen:** dashboard, kelas, kuis, materi, nilai, presensi, tugas  
**Mahasiswa:** dashboard, jadwal, krs, kuis, mata-kuliah, materi, nilai, pengaturan, presensi, tugas  
**Kaprodi:** dashboard, dosen, kurikulum, mahasiswa, presensi  
**Ketua Kelas:** subdirectory ada tapi konten TBD

### Temuan frontend:
1. Login page bekerja — memanggil API `/auth/login` dan menyimpan token.
2. Demo accounts di-hardcode pada login page (admin/kaprodi/dosen/ketua kelas/mahasiswa).
3. `operational-pages.tsx` (64KB) — satu file monolitik berisi banyak komponen operasional. Perlu dipecah.
4. `lib/api.ts` (29KB, 863 baris) — semua API calls dalam satu file; cukup lengkap tapi sulit di-maintain.
5. `role-shell.tsx` — shell layout + navigation per role; termasuk sidebar, theme switcher, user popover.
6. `kobar-assistant.tsx` — SI KOBAR chatbot component, sudah ada UI.
7. Tidak ada middleware Next.js untuk proteksi route server-side — hanya client-side redirect.

---

## 9. Seed Data

- `seed.py` (22KB) — Seeds: ProgramStudi, Users (admin, kaprodi, dosen, mahasiswa), Students dengan RFID/FP credentials, Devices, Rooms, Classes, Enrollments, Sessions, Chapters, Lessons, Materials, Assignments, Quizzes.
- `seed_schedule.py` (19KB) — Seeds attendance sessions 1-16 per class.
- **Seed dipanggil otomatis pada startup** di `ensure_database_ready()` — ini berarti setiap restart menjalankan seeder.
- Seed menggunakan `create_all()` yang bypass Alembic.

---

## 10. Tests

| File | LOC | Cakupan |
|---|---|---|
| `test_phase1_infrastructure.py` | 5,374 | Health, config, DB conn |
| `test_phase2_auth_and_models.py` | 7,097 | Login, register, user CRUD |
| `test_phase3_attendance.py` | 19,506 | Session lifecycle, RFID, records |
| `test_phase4_lms.py` | 16,166 | Chapters, lessons, materials, quizzes |
| `test_academic_krs_and_auth.py` | 15,304 | Academic CRUD, KRS, enrollment |
| `test_class_leader_workflow.py` | 2,002 | Ketua kelas assignment, attendance requests |
| `test_devices_api.py` | 1,193 | Device CRUD |
| `test_audit_api.py` | 1,043 | Audit log read |
| `test_uploads_api.py` | 1,747 | File upload |

**Status:** Belum dijalankan pada sesi audit ini karena membutuhkan database PostgreSQL aktif. File `pytest_result.txt` (2.2MB) dan `pytest_full.txt` (9.5MB) menunjukkan test pernah dijalankan sebelumnya.

---

## 11. Dokumentasi

| Dokumen | Lokasi | Deskripsi |
|---|---|---|
| README.md | root | Quick start, stack, structure |
| PRD.md | root | Product Requirements Document (51KB) |
| design.md | root | Design notes |
| ENTERPRISE_DEVELOPER_GUIDE.md | docs/ | Developer panduan lengkap |
| SPESIFIKASI_LENGKAP_SISTEM.md | docs/ | Spesifikasi sistem (56KB) |
| ANALISIS_BACKEND_DAN_ARSITEKTUR.md | docs/ | Analisis arsitektur backend |
| AUDIT_BACKEND_REPORT.md | docs/ | Audit backend sebelumnya |
| phase1-4 docs | docs/ | Phase planning docs |
| AGENTS.md | .agents/ | Aturan AI dan spesifikasi sistem |

### Agents/Skills yang terpasang:
- `anti-slop` — design rules untuk anti-AI slop
- `dealtech-ui` — design system dan responsive spec
- `dealtech-ui-for-public-component` — SEO dan reusable components
- `learnstack-lms` — LMS dan attendance domain spec (ada kode Prisma/Next.js yang berbeda stack!)
- `sadita` — OOP architecture, reusable engineering, security spec

---

## 12. Risiko Utama

| # | Risiko | Severity | Dampak |
|---|---|---|---|
| R1 | `KETUA_KELAS` sebagai role global, bukan assignment-based | HIGH | Tidak sesuai spesifikasi, satu mahasiswa hanya bisa ketua kelas di semua kelas atau bukan sama sekali |
| R2 | Scope-check backend belum ada (dosen akses semua kelas, mhs akses data mhs lain) | CRITICAL | Kebocoran data antar-user |
| R3 | `create_all()` bypass Alembic di startup — migration bisa tidak sinkron | MEDIUM | Schema drift, migrasi produksi gagal |
| R4 | Token di localStorage tanpa httpOnly cookie | HIGH | Kerentanan XSS |
| R5 | Register endpoint terbuka tanpa role check/admin permission | HIGH | Siapa saja bisa membuat akun admin/dosen |
| R6 | MQTT tanpa TLS/auth, WiFi credentials hardcoded | HIGH | Presensi bisa dipalsukan |
| R7 | LMS model "Frappe LMS-inspired" — Chapter/Lesson model vs spesifikasi per-pertemuan | MEDIUM | Mismatch struktur materi |
| R8 | Firmware LCD I2C 16x2 vs spec TFT SPI 3,5 inci | LOW (hardware dependent) | Tampilan device berbeda dari rencana |
| R9 | Audit log minim (no IP, no user-agent, no reason) | MEDIUM | Investigasi insiden sulit |
| R10 | `KrsRequest` model terdefinisi tapi mungkin belum ter-create di DB via `__init__` | MEDIUM | KRS workflow gagal |
| R11 | `.agents/learnstack-lms/` berisi Prisma/Next.js project yang berbeda stack | LOW | Bloat repository, confusing |
| R12 | `AttendanceSession` tidak menyimpan `scheduled_start_at` | MEDIUM | Tidak bisa mendeteksi keterlambatan pembukaan sesi |

---

## 13. Mismatch Dokumentasi vs Implementasi

| Area | Dokumentasi/Spec | Implementasi Aktual | Gap |
|---|---|---|---|
| Ketua Kelas | Assignment-based permission | Role enum `KETUA_KELAS` di User | ❌ Beda model |
| KRS Status Flow | DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / CANCELLED | PENDING_APPROVAL → APPROVED / REJECTED / CANCELLED | ⚠️ Tidak ada DRAFT dan UNDER_REVIEW |
| Materi per pertemuan | Materi terkait pertemuan | Materi terkait Chapter/Lesson (Frappe LMS pattern) | ⚠️ Berbeda paradigma |
| TFT SPI 3,5" | Perangkat dengan TFT SPI | LCD I2C 16x2 | ⚠️ Hardware berbeda |
| Scope check | Validasi scope per request/object | Hanya role check | ❌ Belum ada |
| Audit detail | IP, user-agent, reason, before/after | Hanya actor, action, entity, before/after | ⚠️ Partial |
| Session start tracking | scheduled_start_at + opened_at + delay_minutes | Hanya dibuka_pada | ⚠️ Incomplete |
| Token storage | httpOnly cookie + SameSite | localStorage | ❌ Beda mekanisme |
| Post-term access policy | Configurable | Belum ada | ❌ Missing |

---

## 14. Hal yang Benar dan Perlu Dipertahankan

1. ✅ **Clean Architecture 4-tier:** Router → Service → Repository → Model sudah ada.
2. ✅ **SQLAlchemy 2.0 Mapped columns** — modern, typed.
3. ✅ **Unique constraints** pada enrollment (class+student), attendance (session+student), session (class+meeting_number).
4. ✅ **Event-Record separation:** `AttendanceEvent` (raw) vs `AttendanceRecord` (official) — sesuai spesifikasi.
5. ✅ **Idempotency key** (`event_uuid`) pada AttendanceEvent.
6. ✅ **RFID/Fingerprint credential** terpisah dari StudentProfile — proper credential model.
7. ✅ **KtmStatus enum** sesuai spesifikasi (BELUM_MEMILIKI_KTM, KTM_TERDAFTAR, KTM_HILANG, KTM_TIDAK_DIBAWA).
8. ✅ **Pydantic v2** schemas dengan `model_validate`.
9. ✅ **MQTT topic naming convention** terstruktur: `sadita/device/{id}/{type}`.
10. ✅ **Dual timestamp** (device_timestamp + received_at) pada AttendanceEvent.
11. ✅ **ClassType enum** mendukung REGULER_PAGI, REGULER_MALAM, SHIFT.
12. ✅ **Seed data** cukup komprehensif untuk pengujian.

---

*Dokumen ini bersifat faktual berdasarkan state repository pada saat audit. Tidak ada perubahan kode yang dilakukan selama audit.*
