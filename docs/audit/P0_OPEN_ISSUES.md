# SADITA.ai — P0 Open Architectural Decisions & Technical Issues

**Dokumen:** Status Resolusi Isu Arsitektur & Utang Teknis P0  
**Versi:** 2.0 (Post-Stabilization Sprint)  
**Tanggal:** 30 Oktober 2026  
**Status:** 🟢 **ALL P0 ISSUES RESOLVED (0 OPEN ISSUES ON P0)**  

---

## 1. Status Resolusi Keputusan Product Owner (PO Decisions)

Keempat keputusan bisnis fundamental telah ditetapkan resmi oleh Product Owner dan diimplementasikan secara penuh pada sprint stabilisasi:

### PO-01: Kebijakan Batas Minimal 75% Kehadiran untuk Syarat UAS
* **Keputusan PO:** **Opsi B (Soft Warning / Non-Hard Blocking)**.
* **Status:** 🟢 **RESOLVED & INTEGRATION VERIFIED**.
* **Implementasi:**
  - Ambang batas configurable via `MIN_ATTENDANCE_PERCENTAGE_FOR_UAS = 75.0%` di [`app/core/config.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/core/config.py).
  - Service `calculate_student_attendance_summary` mengembalikan flag `has_uas_warning = True` saat kehadiran < 75% dan `hard_blocked = False`.
  - Akses ujian atau portal mahasiswa tidak di-hard block (menunggu kebijakan resmi pimpinan kampus).
  - Terverifikasi pada [`test_po01_attendance_percentage_soft_warning`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_p0_stabilization.py).

---

### PO-02: Pemisahan Kuota Akademik Kelas vs Kapasitas Fisik Ruangan
* **Keputusan PO:** **Opsi A (Decoupled Capacity)**.
* **Status:** 🟢 **RESOLVED & INTEGRATION VERIFIED**.
* **Implementasi:**
  - Kolom `kuota_maksimal: int` (default 40) ditambahkan pada model `CourseClass` dan skema Pydantic.
  - `AcademicRepository.enroll_student` memvalidasi kuota akademik terlebih dahulu. Menolak dengan HTTP 400 jika `active_count >= max_quota`.
  - Kapasitas fisik ruangan (`room.kapasitas`) menjadi validasi lapis kedua jika ruangan fisik terdefinisi.
  - Kelas daring/online tanpa ruangan (`room_id is None`) tervalidasi 100% terhadap kuota kelas.
  - Persetujuan KRS memvalidasi kuota sebelum mengaktifkan enrollment.
  - Terverifikasi pada [`test_po02_class_quota_validation_and_decoupling`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_p0_stabilization.py).

---

### PO-03: Alur Presensi Alternatif untuk KTM Bermasalah (`KTM_HILANG` / `KTM_TIDAK_DIBAWA`)
* **Keputusan PO:** **Opsi A (Self-Service Mahasiswa + Verifikasi Ketua Kelas + Persetujuan Dosen)**.
* **Status:** 🟢 **RESOLVED & INTEGRATION VERIFIED**.
* **Implementasi:**
  - Mahasiswa mengajukan presensi via `POST /api/v1/attendance/sessions/{id}/requests` dengan alasan wajib (`reason`).
  - Sistem menolak pengajuan duplikat pada sesi yang sama (HTTP 409 Conflict).
  - Ketua Kelas yang ditugaskan memverifikasi kehadiran fisik di kelas via `POST /api/v1/academic/classes/{id}/presence/{req_id}/verify` (status `VERIFIED`).
  - Dosen memberikan persetujuan akhir via `POST /api/v1/attendance/requests/{req_id}/approve` (status `APPROVED`) yang otomatis membuat record presensi (`HADIR`, `MANUAL_DOSEN`).
  - Ketua Kelas diblokir dari melakukan approve final (HTTP 403 Forbidden).
  - Audit trail mencatat IP, User Agent, aktor, dan alasan.
  - Terverifikasi pada [`test_po03_alternative_attendance_workflow_and_audit`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_p0_stabilization.py).

---

### PO-04: Kebijakan Perhitungan Keterlambatan Mahasiswa jika Dosen Terlambat Membuka Sesi
* **Keputusan PO:** **Opsi B (Dynamic Session Window - Fair to Student)**.
* **Status:** 🟢 **RESOLVED & INTEGRATION VERIFIED**.
* **Implementasi:**
  - Dosen yang membuka sesi terlambat > 10 menit wajib menyertakan `delay_reason` (HTTP 422 jika kosong).
  - Sistem mencatat `delay_minutes` dan `delay_reason` pada `AttendanceSession`.
  - Waktu mulai efektif dihitung: $\text{effective\_start} = \max(\text{scheduled\_start\_at}, \text{actual\_start\_at})$.
  - Toleransi keterlambatan mahasiswa dihitung dari `effective_start + grace_period` sehingga mahasiswa tidak dirugikan akibat keterlambatan dosen.
  - Terverifikasi pada [`test_po04_lecturer_delay_rules_and_effective_start`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_p0_stabilization.py).

---

## 2. Status Resolusi Utang Teknis (Technical Debts)

| No | Komponen | File Terkait | Masalah Sebelumnya | Status Resolusi |
|---|---|---|---|---|
| **TD-01** | **Alembic Migrations** | [`backend/alembic/versions/`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/alembic/versions) | Tidak ada migration script untuk tabel `krs_requests`, `class_leader_assignments`, dan kolom `delay_minutes` / `delay_reason`. | 🟢 **RESOLVED**. File migrasi [`20261030_2115_p0_stabilization_schema.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/alembic/versions/20261030_2115_p0_stabilization_schema.py) dibuat dan diaplikasikan ke database (`alembic current = 5e8c1b2a9d41`). |
| **TD-02** | **Frontend Ketua Kelas** | [`frontend/components/role-shell.tsx`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/frontend/components/role-shell.tsx) | Menu navigasi memeriksa `user.role === 'KETUA_KELAS'`. | 🟢 **RESOLVED**. Diselaraskan memeriksa privilege dinamis `user.is_class_leader` dari endpoint `/auth/me`. Menu verifikasi disematkan secara otomatis. |
| **TD-03** | **Audit Trail Logging** | [`backend/app/api/v1/endpoints/`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/api/v1/endpoints) | Fungsi `audit()` dipanggil tanpa menyertakan objek `Request`, sehingga IP dan UA bernilai `NULL`. | 🟢 **RESOLVED**. Parameter `request: Request` diinjeksi ke seluruh endpoint akademik, presensi, workflow, dan LMS serta diteruskan ke `audit(..., request=request)`. |
| **TD-04** | **Enforcement Alasan Terlambat** | [`backend/app/services/attendance_service.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/services/attendance_service.py) | Skema `SessionOpenRequest` belum memiliki field `delay_reason` wajib ketika sesi dibuka melewati jadwal. | 🟢 **RESOLVED**. Skema dan service mewajibkan `delay_reason` jika keterlambatan > 10 menit (menolak dengan HTTP 422 jika kosong). |
| **TD-05** | **Alur State Machine KRS** | [`backend/app/api/v1/endpoints/academic.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/api/v1/endpoints/academic.py) | Status `DRAFT` tidak memiliki endpoint transisi, persetujuan KRS melewati validasi kapasitas. | 🟢 **RESOLVED**. Dibuat endpoint `POST /krs/requests/{id}/submit` untuk transisi draft ke pending approval, serta pemanggilan `AcademicRepository.enroll_student` saat review approve. |

---

## 3. Kesimpulan

**Tidak ada isu terbuka yang tersisa pada Backlog P0.** Seluruh fondasi akademik, otentikasi, alur presensi, dan audit trail telah distabilkan dan diverifikasi secara komprehensif. Sistem siap melangkah ke Backlog P1 setelah konfirmasi Product Owner.
