# SADITA.ai — P0 Requirements Traceability Matrix (RTM)

**Versi:** 2.0 (Post-Stabilization Sprint)  
**Tanggal:** 30 Oktober 2026  
**Tujuan:** Pelacakan komprehensif antara spesifikasi bisnis, implementasi kode aktual, bukti pengujian, serta verifikasi kelayakan transisi ke Phase P1.

---

## Taksonomi Status Audit
- **IMPLEMENTED**: Kode telah ditulis sesuai spesifikasi.
- **UNIT VERIFIED**: Lolos pengujian unit test terisolasi.
- **INTEGRATION VERIFIED**: Lolos pengujian integrasi database & API endpoint.
- **E2E VERIFIED**: Lolos pengujian simulasi alur lengkap dari hulu ke hilir.
- **HARDWARE VERIFIED**: Teruji dan tervalidasi menggunakan hardware fisik (ESP32-S3, RC522).
- **NOT VERIFIED**: Belum terdapat bukti pengujian yang memadai.
- **FAILED**: Gagal memenuhi kriteria penerimaan, mengandung cacat logika, atau membahayakan integritas sistem.

---

## Matriks Pelacakan Kebutuhan P0

### P0-01: Proteksi Endpoint Registrasi
- **Requirement ID:** REQ-P0-01 (Proteksi Endpoint Register)
- **Referensi Bisnis:** BR-ROLE-001 (Pendaftaran akun hanya dapat dilakukan oleh Administrator berwenang).
- **File & Fungsi Terkait:**
  - [auth.py](../../backend/app/api/v1/endpoints/auth.py): `register(req: RegisterRequest, db: DBSession, admin: RequireAdmin)`
  - [deps.py](../../backend/app/core/deps.py): `RequireAdmin` dependency
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_phase2_auth_and_models.py`
  - Akses publik `POST /api/v1/auth/register` tanpa token Bearer mengembalikan `401 Unauthorized`.
  - Akses dengan token non-Admin mengembalikan `403 Forbidden`.
- **Hasil Verifikasi:** Lolos penuh.

---

### P0-02: Refactor KETUA_KELAS dari UserRole Enum
- **Requirement ID:** REQ-P0-02 (Peran Dinamis Ketua Kelas)
- **Referensi Bisnis:** [AGENTS.md](../../.agents/AGENTS.md) ("Ketua Kelas bukan role baru, melainkan privilege penugasan per-kelas").
- **File & Fungsi Terkait:**
  - [user.py](../../backend/app/models/user.py): `UserRole` enum (`ADMIN`, `KAPRODI`, `DOSEN`, `MAHASISWA`)
  - [workflow.py](../../backend/app/models/workflow.py): `ClassLeaderAssignment`
  - [auth.py](../../backend/app/api/v1/endpoints/auth.py): `get_me` (mengembalikan flag `is_class_leader`)
  - [role-shell.tsx](../../frontend/components/role-shell.tsx): Menampilkan menu verifikasi secara kondisional
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_class_leader_workflow.py` [PASSED]
  - `tests/test_p0_stabilization.py::test_po03_alternative_attendance_workflow_and_audit` [PASSED]
  - `frontend/` (`npx tsc --noEmit`) [0 ERRORS]
- **Hasil Verifikasi:** Diselaraskan penuh antara backend relasional dan frontend UI navigation shell.

---

### P0-03: Scope Check Dosen (Hanya Kelas Ampuan)
- **Requirement ID:** REQ-P0-03 (Isolasi Hak Akses Dosen)
- **Referensi Bisnis:** BR-ROLE-008 (Resource milik entitas lain mengembalikan 404 Not Found).
- **File & Fungsi Terkait:**
  - [deps.py](../../backend/app/core/deps.py): `require_class_access`
  - [attendance.py](../../backend/app/api/v1/endpoints/attendance.py): `open_session`, `close_session`, `manual_update`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_phase3_attendance.py`
- **Hasil Verifikasi:** Dosen mengakses kelas lain ditolak HTTP 404.

---

### P0-04: Scope Check Mahasiswa (Hanya Data Sendiri)
- **Requirement ID:** REQ-P0-04 (Isolasi Data Mahasiswa)
- **Referensi Bisnis:** BR-ROLE-008.
- **File & Fungsi Terkait:**
  - [deps.py](../../backend/app/core/deps.py): `require_own_student_data`
  - [students.py](../../backend/app/api/v1/endpoints/students.py): `get_student_by_id`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_phase2_auth_and_models.py`
- **Hasil Verifikasi:** Mahasiswa mengakses profil mahasiswa lain ditolak HTTP 404.

---

### P0-05: Scope Check Kaprodi (Hanya Prodi Sendiri)
- **Requirement ID:** REQ-P0-05 (Isolasi Teritorial Kaprodi)
- **Referensi Bisnis:** BR-ROLE-008.
- **File & Fungsi Terkait:**
  - [academic.py](../../backend/app/api/v1/endpoints/academic.py): Evaluasi `course_class.course.prodi_id`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_academic_krs_and_auth.py`
- **Hasil Verifikasi:** Kaprodi dibatasi pada prodinya sendiri.

---

### P0-06: Export Model KrsRequest
- **Requirement ID:** REQ-P0-06 (Metadata Registrasi KrsRequest)
- **Referensi Bisnis:** Arsitektur Basis Data Akademik.
- **File & Fungsi Terkait:**
  - [models/\_\_init\_\_.py](../../backend/app/models/__init__.py): Export `KrsRequest`
- **Status Implementasi:** **UNIT VERIFIED**
- **Bukti Pengujian:**
  - Terdaftar di `Base.metadata` dan diekspor di `__all__`.

---

### P0-07: State Machine KRS Lengkap & Validasi Kuota
- **Requirement ID:** REQ-P0-07 (Siklus Pengajuan KRS)
- **Referensi Bisnis:** BR-KRS-001 s.d. BR-KRS-005.
- **File & Fungsi Terkait:**
  - [academic.py](../../backend/app/models/academic.py): `KrsRequestStatus`
  - [academic.py](../../backend/app/api/v1/endpoints/academic.py): `submit_krs_request`, `submit_draft_krs_request`, `review_krs_request`, `cancel_krs_request`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_p0_stabilization.py::test_po02_class_quota_validation_and_decoupling` [PASSED]
  - Endpoint `POST /krs/requests/{id}/submit` mengaktifkan transisi `DRAFT` -> `PENDING_APPROVAL`.
  - Persetujuan KRS memvalidasi kuota akademik melalui `AcademicRepository.enroll_student`.
- **Hasil Verifikasi:** Tidak ada celah over-enrollment.

---

### P0-08: Pelacakan Keterlambatan Dosen pada Sesi Presensi
- **Requirement ID:** REQ-P0-08 (Monitoring Keterlambatan Pembukaan Sesi)
- **Referensi Bisnis:** DEC-08, BR-ATT-003, PO-04.
- **File & Fungsi Terkait:**
  - [attendance.py](../../backend/app/models/attendance.py): `scheduled_start_at`, `delay_minutes`, `delay_reason`
  - [attendance_service.py](../../backend/app/services/attendance_service.py): `open_session`
  - [attendance.py](../../backend/app/schemas/attendance.py): `SessionOpenRequest`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_p0_stabilization.py::test_po04_lecturer_delay_rules_and_effective_start` [PASSED]
  - Sesi dibuka terlambat > 10 menit tanpa alasan ditolak HTTP 422.
  - Sesi dibuka dengan alasan mencatat `delay_minutes` dan alasan ke database.

---

### P0-09: Enterprise Metadata pada AuditLog
- **Requirement ID:** REQ-P0-09 (Metadata Forensik Audit Log)
- **Referensi Bisnis:** Zero-Trust Security Specification (Immutable Audit Logging).
- **File & Fungsi Terkait:**
  - [workflow.py](../../backend/app/models/workflow.py): Model `AuditLog`
- **Status Implementasi:** **UNIT VERIFIED**
- **Bukti Pengujian:**
  - Kolom `ip_address`, `user_agent`, `reason` aktif di basis data PostgreSQL.

---

### P0-10: Perekaman Audit Log pada Perubahan Kritis
- **Requirement ID:** REQ-P0-10 (Cakupan Audit Trail Zero-Trust)
- **Referensi Bisnis:** Audit Trail Compliance 2026.
- **File & Fungsi Terkait:**
  - [authorization_service.py](../../backend/app/services/authorization_service.py): `audit()`
  - [attendance.py](../../backend/app/api/v1/endpoints/attendance.py), [workflow.py](../../backend/app/api/v1/endpoints/workflow.py), [lms.py](../../backend/app/api/v1/endpoints/lms.py)
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_p0_stabilization.py::test_po03_alternative_attendance_workflow_and_audit` [PASSED]
  - Seluruh endpoint menginjeksi `Request` dan mencatat `ip_address` serta `user_agent`.

---

### P0-11: Alur Presensi IoT RFID End-to-End
- **Requirement ID:** REQ-P0-11 (IoT RFID Attendance Pipeline)
- **Referensi Bisnis:** BR-ATT-001, BR-ATT-002, BR-DEV-001.
- **File & Fungsi Terkait:**
  - [handlers.py](../../backend/app/mqtt/handlers.py): `handle_rfid`, `handle_fingerprint`
  - [test_rfid_attendance_e2e.py](../../backend/tests/test_rfid_attendance_e2e.py)
- **Status Implementasi:** **INTEGRATION VERIFIED** (Belum Hardware Verified)
- **Bukti Pengujian:**
  - `tests/test_rfid_attendance_e2e.py` [3/3 PASSED]

---

### P0-12: Auto-ALFA saat Finalisasi Sesi
- **Requirement ID:** REQ-P0-12 (Otomasi Status Kehadiran ALFA)
- **Referensi Bisnis:** BR-ATT-007.
- **File & Fungsi Terkait:**
  - [attendance_service.py](../../backend/app/services/attendance_service.py): `close_session`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_phase3_attendance.py` [PASSED]

---

### P0-13: Audit Log Relokasi Perangkat IoT
- **Requirement ID:** REQ-P0-13 (Inventaris & Pemindahan Perangkat)
- **Referensi Bisnis:** BR-DEV-003.
- **File & Fungsi Terkait:**
  - [devices.py](../../backend/app/api/v1/endpoints/devices.py): `PUT /devices/{device_id}`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_devices_api.py` [PASSED]

---

### P0-14: Pemisahan Kuota Kelas Akademik vs Kapasitas Ruangan
- **Requirement ID:** REQ-P0-14 (Kapasitas & Kuota Kelas Terpisah)
- **Referensi Bisnis:** BR-ACA-004, PO-02.
- **File & Fungsi Terkait:**
  - [academic.py](../../backend/app/models/academic.py): `CourseClass.kuota_maksimal`
  - [academic_repo.py](../../backend/app/repositories/academic_repo.py): `enroll_student`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_p0_stabilization.py::test_po02_class_quota_validation_and_decoupling` [PASSED]
  - Pendaftaran kelas daring tanpa ruangan fisik divalidasi ketat terhadap kuota kelas.

---

### P0-15: Standardisasi Migrasi Alembic Database
- **Requirement ID:** REQ-P0-15 (Standardisasi Migrasi Alembic)
- **Referensi Bisnis:** Enterprise Architecture & Database Standards.
- **File & Fungsi Terkait:**
  - [20261030_2115_p0_stabilization_schema.py](../../backend/alembic/versions/20261030_2115_p0_stabilization_schema.py) (Rev `5e8c1b2a9d41`)
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `alembic upgrade head` dieksekusi sukses dan `alembic current` tersinkronisasi pada head `5e8c1b2a9d41`.

---

### P0-16: Persentase Kehadiran 75% & Soft Warning
- **Requirement ID:** REQ-P0-16 (Evaluasi Kehadiran & Soft Warning)
- **Referensi Bisnis:** PO-01, BR-ATT-009.
- **File & Fungsi Terkait:**
  - [config.py](../../backend/app/core/config.py): `MIN_ATTENDANCE_PERCENTAGE_FOR_UAS = 75.0`
  - [attendance_service.py](../../backend/app/services/attendance_service.py): `calculate_student_attendance_summary`
  - [attendance.py](../../backend/app/api/v1/endpoints/attendance.py): `GET /students/{id}/classes/{id}/summary`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_p0_stabilization.py::test_po01_attendance_percentage_soft_warning` [PASSED]
  - Menghasilkan soft warning tanpa menerapkan hard block otomatis pada ujian.

---

### P0-17: Presensi Alternatif untuk KTM Bermasalah
- **Requirement ID:** REQ-P0-17 (Alur Presensi Alternatif)
- **Referensi Bisnis:** PO-03.
- **File & Fungsi Terkait:**
  - [workflow.py](../../backend/app/models/workflow.py): `AttendanceRequest.reason`
  - [workflow.py](../../backend/app/api/v1/endpoints/workflow.py): submit, verify, approve
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_p0_stabilization.py::test_po03_alternative_attendance_workflow_and_audit` [PASSED]
  - Mahasiswa submit alasan -> Ketua Kelas verify (VERIFIED) -> Dosen approve (APPROVED + AttendanceRecord HADIR).

---

### P0-18: Jendela Waktu Presensi Berkeadilan
- **Requirement ID:** REQ-P0-18 (Effective Start Time Tolerance)
- **Referensi Bisnis:** PO-04.
- **File & Fungsi Terkait:**
  - [attendance_service.py](../../backend/app/services/attendance_service.py): `record_attendance_by_rfid_and_fingerprint`
- **Status Implementasi:** **INTEGRATION VERIFIED**
- **Bukti Pengujian:**
  - `tests/test_p0_stabilization.py::test_po04_lecturer_delay_rules_and_effective_start` [PASSED]
  - Formula `effective_start = max(scheduled, actual)`. Mahasiswa tidak dirugikan keterlambatan dosen.
