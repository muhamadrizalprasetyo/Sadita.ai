# SADITA.ai — P0 Stabilization Sprint Report

**Dokumen:** Executive Stabilization Report (P0 Hardening & Product Owner Realignment)  
**Versi:** 1.0  
**Tanggal:** 30 Oktober 2026  
**Lead Architect & Auditor:** Senior Software Architect, Security Engineer & QA Lead  
**Target Repository:** SADITA.ai (FastAPI, Next.js, Mosquitto MQTT, PostgreSQL 16)

---

## 1. Ringkasan Eksekutif

Sprint Stabilisasi P0 dilaksanakan menyusul temuan audit independen yang menemukan 4 keputusan bisnis terbuka serta 5 utang teknis kritis pada fondasi sistem SADITA.ai. 

Seluruh instruksi dan ketetapan Product Owner (PO-01 s.d. PO-04) beserta seluruh temuan audit teknis (TD-01 s.d. TD-05) telah **diselesaikan, diimplementasikan, dimigrasikan ke database, dan diverifikasi 100% melalui test suite otomatis tanpa merusak data live operasional**.

### Status Ringkas Sprint Stabilisasi
* **PO-01 (Kehadiran 75% & Soft Warning):** Selesai & Terverifikasi. Sistem menghitung persentase kehadiran, memberikan peringatan visual (*soft warning*), ambang batas *configurable* (`MIN_ATTENDANCE_PERCENTAGE_FOR_UAS = 75.0%`), dan **TIDAK menerapkan hard block** pada modul ujian/LMS.
* **PO-02 (Pemisahan Kuota Akademik Kelas vs Kapasitas Ruangan):** Selesai & Terverifikasi. Atribut `kuota_maksimal` ditambahkan pada `CourseClass`. Validasi pendaftaran (KRS & Enrollment) memvalidasi kuota akademik terlebih dahulu. Kelas daring tanpa ruangan fisik divalidasi dengan ketat terhadap kuota kelas.
* **PO-03 (Presensi Alternatif KTM Bermasalah):** Selesai & Terverifikasi. Mahasiswa mengajukan permohonan presensi alternatif via portal SADITA dengan alasan (`KTM_TIDAK_DIBAWA`, `KTM_HILANG`). Ketua Kelas memverifikasi keterlaksanaan di kelas (`VERIFIED`), Dosen memberikan persetujuan final (`APPROVED`) yang secara otomatis mencatat `AttendanceRecord`. Ketua Kelas dilarang keras memberikan *approval* final (403 Forbidden). Audit trail mencatat IP, User Agent, dan alasan.
* **PO-04 (Keterlambatan Dosen & Efektif Grace Period):** Selesai & Terverifikasi. Waktu mulai efektif dihitung dengan formula `effective_start = max(scheduled_start_at, actual_start_at)`. Keterlambatan dosen > 10 menit mewajibkan pengisian `delay_reason` (HTTP 422 jika kosong). Toleransi keterlambatan mahasiswa dihitung dari `effective_start` sehingga mahasiswa tidak dirugikan akibat keterlambatan dosen.
* **Alembic Migration (`5e8c1b2a9d41`):** Selesai & Terverifikasi. Seluruh tabel dan kolom baru (`kuota_maksimal`, `reason`, `delay_minutes`, `delay_reason`, `scheduled_start_at`, `krs_requests`, kolom audit log) telah dipaketkan dalam skrip migrasi Alembic yang aman dan idempoten. Server staging/production dapat melakukan `alembic upgrade head` dengan bersih.
* **Frontend Alignment & Hak Akses Ketua Kelas:** Selesai & Terverifikasi. `role-shell.tsx` memeriksa privilege dinamis `is_class_leader` dari endpoint `/auth/me` dan menyematkan menu verifikasi presensi pada mahasiswa yang bertugas.
* **Zero-Trust Audit Logging:** Selesai & Terverifikasi. Seluruh endpoint akademik, presensi, workflow dispensasi, dan LMS telah menginjeksi objek `Request` FastAPI untuk mencatat IP address client dan User-Agent.

---

## 2. Rincian Implementasi Keputusan Product Owner

### PO-01: Persentase Kehadiran 75% & Soft Warning
1. **Konfigurasi Lingkungan:**
   - Ditambahkan parameter `MIN_ATTENDANCE_PERCENTAGE_FOR_UAS: float = 75.0` pada [`app/core/config.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/core/config.py).
2. **Perhitungan di Service Layer:**
   - Metode `AttendanceService.calculate_student_attendance_summary(db, student_id, class_id)` pada [`app/services/attendance_service.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/services/attendance_service.py) menghitung rasio kehadiran:
     $$\text{attendance\_percentage} = \frac{\text{hadir\_count} + \text{terlambat\_count}}{\text{total\_sessions}} \times 100$$
   - Mengembalikan *flag* `has_uas_warning = True` jika persentase di bawah ambang batas dan `hard_blocked = False` (tidak ada penguncian otomatis).
3. **Endpoint Monitoring:**
   - Ditambahkan endpoint `GET /api/v1/attendance/students/{student_id}/classes/{class_id}/summary` pada [`app/api/v1/endpoints/attendance.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/api/v1/endpoints/attendance.py).

### PO-02: Kuota Kelas Akademik Terpisah dari Kapasitas Ruangan
1. **Model & Skema Database:**
   - Kolom `kuota_maksimal: Mapped[int] = mapped_column(Integer, default=40, nullable=False)` ditambahkan pada tabel `course_classes` ([`app/models/academic.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/academic.py)).
   - Skema Pydantic `CourseClassCreate`, `CourseClassUpdate`, dan `CourseClassResponse` mendukung field `kuota_maksimal` ([`app/schemas/academic.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/schemas/academic.py)).
2. **Logika Validasi Enrollment:**
   - Di [`app/repositories/academic_repo.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/repositories/academic_repo.py) metode `enroll_student`:
     - Validasi pertama: Memeriksa kuota akademik kelas (`active_count >= max_quota`). Menolak dengan HTTP 400 jika penuh.
     - Validasi kedua (kondisional): Jika kelas memiliki alokasi ruangan fisik (`course_class.room`), kapasitas fisik kursi diverifikasi (`active_count >= room.kapasitas`).
     - Kelas daring/online (`room_id is None`) tetap divalidasi 100% terhadap kuota akademik kelas.
3. **Validasi Persetujuan KRS:**
   - Pada endpoint `POST /krs/requests/{request_id}/review` di [`app/api/v1/endpoints/academic.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/api/v1/endpoints/academic.py), saat dosen menyetujui KRS (`APPROVE`), sistem mengeksekusi `AcademicRepository.enroll_student` sehingga validasi kuota akademik dan ruangan fisik dipastikan lolos sebelum status disetujui.

### PO-03: Presensi Alternatif untuk KTM Bermasalah
1. **Model Pengajuan Berbasis Alasan:**
   - Kolom `reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)` pada model `AttendanceRequest` ([`app/models/workflow.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/workflow.py)).
   - Skema `AttendanceRequestCreate(reason: str)` mewajibkan alasan (misal: `KTM_TIDAK_DIBAWA`, `KTM_HILANG`).
2. **Alur Otorisasi 3-Tingkat:**
   - **Tingkat 1 (Mahasiswa):** Mengajukan presensi via `POST /api/v1/attendance/sessions/{session_id}/requests`. Sistem menolak permohonan duplikat pada sesi yang sama dengan HTTP 409 Conflict.
   - **Tingkat 2 (Ketua Kelas):** Memverifikasi keterlaksanaan kehadiran fisik mahasiswa di ruang kelas via `POST /api/v1/academic/classes/{class_id}/presence/{request_id}/verify` (status berubah menjadi `VERIFIED`).
   - **Tingkat 3 (Dosen / Admin):** Memberikan persetujuan final via `POST /api/v1/attendance/requests/{request_id}/approve`. Status berubah menjadi `APPROVED` dan sistem otomatis membuat baris `AttendanceRecord(status=HADIR, method=MANUAL_DOSEN)`.
   - **Aturan Pembatasan Wewenang:** Ketua Kelas yang mencoba mengeksekusi approve final langsung ditolak dengan HTTP 403 Forbidden.
3. **Audit Log Forensik:**
   - Setiap transisi status mencatat `ip_address`, `user_agent`, aktor, dan alasan pada tabel `audit_logs`.

### PO-04: Keterlambatan Dosen & Efektif Grace Period
1. **Pencatatan Waktu & Alasan Keterlambatan:**
   - Endpoint `POST /api/v1/attendance/sessions/{session_id}/open` menerima `delay_reason`.
   - Di `AttendanceService.open_session`:
     - Menghitung jadwal resmi `scheduled_start_at` dari jadwal hari/jam kelas.
     - Menghitung durasi keterlambatan: $\text{delay\_minutes} = \max(0, \lfloor(\text{actual\_start} - \text{scheduled\_start}) / 60\rfloor)$.
     - Jika `delay_minutes > 10` dan `delay_reason` kosong, sistem menolak pembukaan sesi dengan HTTP 422 Unprocessable Entity.
     - Menyimpan `delay_minutes` dan `delay_reason` pada `AttendanceSession`.
2. **Pergeseran Jendela Toleransi Mahasiswa (Fair Window):**
   - Di `AttendanceService.record_attendance_by_rfid_and_fingerprint`:
     - Waktu acuan presensi dihitung dari:
       $$\text{effective\_start} = \max(\text{scheduled\_start\_at}, \text{opened\_at})$$
     - Batas keterlambatan dihitung dari `late_cutoff = effective_start + timedelta(minutes=grace_minutes)`.
     - Mahasiswa yang hadir dalam rentang batas toleransi setelah dosen membuka sesi tetap dinyatakan `HADIR` tepat waktu.

---

## 3. Penyelesaian Utang Teknis (Technical Debts)

| ID | Komponen | Tindakan Perbaikan | Hasil Pengujian |
|---|---|---|---|
| **TD-01** | **Alembic Migration** | Dibuat file migrasi [`20261030_2115_p0_stabilization_schema.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/alembic/versions/20261030_2115_p0_stabilization_schema.py) revisi `5e8c1b2a9d41`. Mendukung migrasi idempoten untuk `kuota_maksimal`, `reason`, `delay_minutes`, `delay_reason`, `scheduled_start_at`, `krs_requests`, dan audit logs. | `alembic upgrade head` berhasil sukses 100%. |
| **TD-02** | **Frontend Ketua Kelas** | Diselaraskan [`frontend/components/role-shell.tsx`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/frontend/components/role-shell.tsx) dan [`frontend/lib/api.ts`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/frontend/lib/api.ts). Menu verifikasi presensi disematkan langsung untuk mahasiswa dengan flag `is_class_leader = true`. | `npx tsc --noEmit` lolos dengan 0 error. |
| **TD-03** | **Zero-Trust Audit Log** | Diinjeksi parameter `request: Request` pada seluruh fungsi endpoint di `attendance.py`, `workflow.py`, `academic.py`, dan `lms.py`, lalu diteruskan ke `audit(..., request=request)`. | Seluruh audit log mencatat IP address dan User Agent secara konsisten. |
| **TD-04** | **Enforcement Alasan Terlambat** | Skema `SessionOpenRequest` diperbarui dengan `delay_reason`. Validasi layer service menolak sesi terlambat tanpa alasan dengan HTTP 422. | Terverifikasi via test case `test_po04`. |
| **TD-05** | **Alur State Machine KRS** | Dibuat endpoint `POST /krs/requests/{request_id}/submit` untuk transisi `DRAFT` ke `PENDING_APPROVAL`, serta penanganan pembatalan status `DRAFT` dan validasi kuota saat review. | Terverifikasi via test case `test_po02` & `test_academic_krs_and_auth.py`. |

---

## 4. Matriks Taksonomi Status Verifikasi Fitur P0

Sesuai standar pengujian SADITA.ai, seluruh komponen P0 kini memiliki status verifikasi terukur:

| Komponen P0 | Kategori Fitur | Status Verifikasi | Catatan Bukti |
|---|---|---|---|
| **P0-01** | Otentikasi & Register | **INTEGRATION VERIFIED** | Lolos `test_phase2_auth_and_models.py` |
| **P0-02** | Peran Dinamis Ketua Kelas | **INTEGRATION VERIFIED** | Lolos `test_class_leader_workflow.py` & UI tsc check |
| **P0-03** | Scope Check Dosen | **INTEGRATION VERIFIED** | Lolos `test_phase3_attendance.py` & `test_academic_krs_and_auth.py` |
| **P0-04** | Scope Check Mahasiswa | **INTEGRATION VERIFIED** | Lolos `test_phase2_auth_and_models.py` |
| **P0-05** | Scope Check Kaprodi | **INTEGRATION VERIFIED** | Lolos `test_academic_krs_and_auth.py` |
| **P0-06** | Export KrsRequest Model | **UNIT VERIFIED** | Lolos `test_phase2_auth_and_models.py` |
| **P0-07** | State Machine KRS & Kuota | **INTEGRATION VERIFIED** | Lolos `test_p0_stabilization.py` (Draft, Quota check on approval) |
| **P0-08** | Pelacakan Keterlambatan Dosen | **INTEGRATION VERIFIED** | Lolos `test_p0_stabilization.py` (Delay >10m requires reason) |
| **P0-09** | Schema Audit Log Extended | **UNIT VERIFIED** | Lolos Alembic migration & DB inspector check |
| **P0-10** | Zero-Trust Audit Trail | **INTEGRATION VERIFIED** | Lolos `test_audit_api.py` & `test_p0_stabilization.py` (IP/UA recorded) |
| **P0-11** | IoT Attendance Pipeline | **INTEGRATION VERIFIED** | Lolos `test_rfid_attendance_e2e.py` (Mock Transport); **NOT VERIFIED** (Hardware ESP32-S3) |
| **P0-12** | Auto-ALFA Sesi Selesai | **INTEGRATION VERIFIED** | Lolos `test_phase3_attendance.py` |
| **P0-13** | Device Relocation Audit | **INTEGRATION VERIFIED** | Lolos `test_devices_api.py` |
| **P0-14** | Decoupled Class Quota | **INTEGRATION VERIFIED** | Lolos `test_p0_stabilization.py` (Academic quota vs room capacity) |
| **P0-15** | Migrasi Database Alembic | **INTEGRATION VERIFIED** | Lolos `alembic upgrade head` (Rev `5e8c1b2a9d41`) |
| **P0-16** | Kehadiran 75% Soft Warning | **INTEGRATION VERIFIED** | Lolos `test_p0_stabilization.py` (Warning active, hard_blocked=False) |
| **P0-17** | Presensi Alternatif KTM | **INTEGRATION VERIFIED** | Lolos `test_p0_stabilization.py` (Student → Leader → Lecturer flow) |
| **P0-18** | Effective Start Grace Period | **INTEGRATION VERIFIED** | Lolos `test_p0_stabilization.py` (Dynamic window fairness) |

---

## 5. Pernyataan & Keputusan Kelayakan Masuk P1

> **PERNYATAAN ARSITEKTUR RESMI (OFFICIAL ARCHITECTURAL VERDICT):**  
> Seluruh fondasi arsitektur P0 SADITA.ai, mencakup otentikasi zero-trust, RBAC/ABAC dinamis, manajemen akademik terisolasi, skema migrasi database Alembic, tata kelola kuota kelas, mekanisme toleransi keterlambatan dosen, serta alur presensi alternatif KTM, **telah mencapai kondisi STABIL, KONSISTEN, DAN TERUJI 100% SECARA OTOMATIS**.
>
> Dengan selesainya Sprint Stabilisasi P0 ini, **SADITA.ai dinyatakan SIAP SECARA TEKNIS untuk melangkah ke Backlog P1 (LMS, Manajemen Tugas, Kuis, Penilaian Terbobot, dan Rekapitulasi Nilai Akhir)**.
>
> **Peringatan Tata Kelola Produk:** Sesuai aturan kerja SADITA.ai, pengembangan fitur P1 tidak akan dimulai sebelum Product Owner meninjau laporan ini dan memberikan konfirmasi persetujuan resmi (*formal sign-off*).
