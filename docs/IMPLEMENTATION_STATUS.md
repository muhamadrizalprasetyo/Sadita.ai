# SADITA.ai — Implementation Status & Backlog

**Versi:** 2.0 (Post-Stabilization Sprint)  
**Tanggal:** 2026-10-30  
**Status Keseluruhan P0:** 🟢 **100% COMPLETE & VERIFIED**

---

## Backlog P0 — Fondasi dan Alur Inti (Stabilized & Verified)

| # | Task | Effort | Depends On | Status | Acceptance Criteria / Bukti |
|---|---|---|---|---|---|
| P0-01 | **Proteksi endpoint register** — hanya ADMIN yang boleh membuat akun | S | — | 🟢 DONE | POST /auth/register tanpa token → 401; non-ADMIN → 403 (Verified) |
| P0-02 | **Refactor KETUA_KELAS dari UserRole enum** — role dinamis via ClassLeaderAssignment | M | — | 🟢 DONE | Role dinamis via assignment; UI diselaraskan via `is_class_leader` |
| P0-03 | **Scope check: dosen hanya kelas sendiri** — filter terpusat di require_class_access | M | — | 🟢 DONE | Dosen akses kelas lain → 404 (BR-ROLE-008); test passing |
| P0-04 | **Scope check: mahasiswa hanya data sendiri** — require_own_student_data | M | P0-03 | 🟢 DONE | Mahasiswa akses data mahasiswa lain → 404 (BR-ROLE-008) |
| P0-05 | **Scope check: kaprodi hanya prodi sendiri** | S | P0-03 | 🟢 DONE | Kaprodi akses prodi lain → 404 (BR-ROLE-008) |
| P0-06 | **KrsRequest export di models/__init__.py** — model terdaftar di Base.metadata | S | — | 🟢 DONE | KrsRequest tabel & enum ter-export di Base.metadata |
| P0-07 | **KRS status flow lengkap & validasi kuota** — tambah DRAFT state & submit endpoint | S | P0-06 | 🟢 DONE | Endpoint `/krs/requests/{id}/submit` & validasi kuota saat review approve |
| P0-08 | **Pelacakan keterlambatan dosen** — scheduled_start_at, delay_minutes, delay_reason | S | — | 🟢 DONE | Delay >10m mewajibkan `delay_reason` (HTTP 422 jika kosong) |
| P0-09 | **Audit log enhancement** — tambah ip_address, user_agent, reason | S | — | 🟢 DONE | AuditLog model & helper menyimpan IP, UA, reason |
| P0-10 | **Audit log pada perubahan penting** — nilai, presensi, enrollment, device | M | P0-09 | 🟢 DONE | Injeksi Request FastAPI pada seluruh router; IP/UA tercatat 100% |
| P0-11 | **Presensi RFID end-to-end test** — MQTT → validate → record → response | L | P0-03, P0-08 | 🟢 DONE | 3 tests passing di test_rfid_attendance_e2e.py (Software integration) |
| P0-12 | **Auto-ALFA pada finalisasi sesi** — mahasiswa enrolled tanpa record → ALFA | S | — | 🟢 DONE | close_session backfill ALFA otomatis (BR-ATT-007) |
| P0-13 | **Device audit log** — perubahan penempatan device tercatat | S | P0-09 | 🟢 DONE | PUT /devices/{device_id} dengan audit log tervalidasi via test |
| P0-14 | **Pemisahan kuota kelas vs kapasitas ruangan (PO-02)** | S | — | 🟢 DONE | `kuota_maksimal` independen dari ruangan; kelas daring tervalidasi |
| P0-15 | **Standardisasi migrasi Alembic database (TD-01)** | S | — | 🟢 DONE | Migrasi resmi `5e8c1b2a9d41` dibuat & diaplikasikan sukses |
| P0-16 | **Evaluasi kehadiran 75% & Soft Warning (PO-01)** | S | P0-11 | 🟢 DONE | Configurable threshold, soft warning visual, `hard_blocked=False` |
| P0-17 | **Presensi alternatif KTM bermasalah (PO-03)** | M | P0-02 | 🟢 DONE | Alur Mahasiswa → Verifikasi Ketua Kelas → Persetujuan Dosen |
| P0-18 | **Jendela toleransi berkeadilan (PO-04)** | S | P0-08 | 🟢 DONE | Formula `effective_start = max(jadwal, buka)`; mahasiswa tidak dirugikan |

---

## Backlog P1 — LMS dan Evaluasi (Siap Memulai Pasca-Konfirmasi PO)

| # | Task | Effort | Depends On | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| P1-01 | **Materi per pertemuan** — refactor dari Chapter/Lesson ke Meeting-based | M | P0-* | 🟡 READY | Materi terkait AttendanceSession pertemuan_ke |
| P1-02 | **Tugas kelompok** — tambah assignment_type INDIVIDUAL/GROUP + group model | M | P0-* | 🟡 READY | Tugas kelompok bisa dibuat dan dikumpulkan |
| P1-03 | **Late submission configurable per tugas** — flag allow_late + grace_period | S | P0-* | 🟡 READY | Late submission tercatat tapi diterima jika diizinkan |
| P1-04 | **Autosave kuis** — endpoint save partial answers | M | P0-* | 🟡 READY | Jawaban tersimpan secara berkala |
| P1-05 | **Timer kuis enforcement backend** — validasi durasi di server | S | P0-* | 🟡 READY | Timer expired → auto-submit |
| P1-06 | **Formula nilai dengan bobot configurable per matkul** | M | P0-* | 🟡 READY | Bobot configurable, default sesuai spec |
| P1-07 | **Nilai aktivitas default 80 dengan label** | S | P1-06 | 🟡 READY | source: SYSTEM_DEFAULT vs DOSEN_INPUT |
| P1-08 | **Publikasi nilai** — toggle is_published; mahasiswa hanya lihat published | S | P1-06 | 🟡 READY | Unpublished → 404 untuk mahasiswa |
| P1-09 | **Koreksi nilai post-publish** — Dosen ajukan + Admin approve | M | P1-08 | 🟡 READY | Correction request flow + audit |
| P1-10 | **Dashboard data aktual** — semua metrik dari query DB, bukan hardcoded | L | P0-* | 🟡 READY | Dashboard API endpoints + frontend integration |
| P1-11 | **Skala A-E configurable** — konfigurasi global kampus | S | P1-06 | 🟡 READY | Admin bisa set range angka → huruf |
| P1-12 | **Ekspor CSV/PDF** | M | P1-10 | 🟡 READY | Download file dari dashboard |

---

## Backlog P2 — Lanjutan

| # | Task | Effort | Depends On | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| P2-01 | SI KOBAR FAQ/navigasi berbasis data terotorisasi | M | P1-* | 🔴 TODO | Chatbot menjawab dari data API, bukan fabrication |
| P2-02 | Notifikasi email/WhatsApp/Telegram | M | P1-* | 🔴 TODO | Notifikasi terkirim untuk event penting |
| P2-03 | Fingerprint authentication hardware | L | Hardware | 🔴 BLOCKED | Hardware fisik belum tersedia di lab |
| P2-04 | Analitik prediktif kelulusan | L | P1-* | 🔴 TODO | Prediksi kelulusan berbasis data LMS & Presensi |
| P2-05 | Cloud deployment production | M | P1-* | 🔴 TODO | Deploy ke cloud dengan CI/CD terotomasi |

---

## Ringkasan Effort

| Phase | S | M | L | Total Tasks | Status |
|---|---|---|---|---|---|
| **P0 (Fondasi)** | 11 | 5 | 2 | 18 | 🟢 **100% COMPLETE & VERIFIED** |
| **P1 (LMS & Penilaian)** | 5 | 5 | 2 | 12 | 🟡 **READY TO START** |
| **P2 (Lanjutan & AI)** | 0 | 3 | 2 | 5 | 🔴 **BACKLOG** |
| **Total** | **16** | **13** | **6** | **35** | |
