# SADITA.ai — Open Decisions Log

**Versi:** 1.0  
**Tanggal dibuat:** 2026-10-30  
**Status:** Semua keputusan berstatus `PROVISIONAL` sampai dikonfirmasi Product Owner.

---

## Cara Membaca Dokumen Ini

Setiap keputusan memiliki:
- **ID** — pengenal unik
- **Konflik / Hal Belum Pasti** — deskripsi masalah
- **Default Implementasi** — keputusan sementara yang aman untuk implementasi
- **Status** — `PROVISIONAL` (belum dikonfirmasi), `CONFIRMED` (disetujui PO), `REVISED` (diubah PO)
- **Pihak Konfirmasi** — siapa yang perlu mengambil keputusan final
- **Dampak Jika Diubah** — risiko dan effort jika keputusan berubah

---

## Daftar Keputusan

### DEC-01: Materi Wajib vs Opsional per Pertemuan

| Aspek | Detail |
|---|---|
| **Konflik** | B05 menyebut semua pertemuan memiliki modul/materi, sedangkan B06 menyatakan materi tidak wajib pada semua 16 pertemuan. |
| **Default** | Materi per pertemuan bersifat **opsional**; sistem menyediakan slot setiap meeting. Dosen tidak wajib mengisi materi setiap pertemuan. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner + Dosen pilot |
| **Dampak jika diubah** | Jika materi menjadi wajib: perlu validasi finalisasi sesi, notifikasi dosen pengingat, dan enforcement di backend. Effort: S. |

---

### DEC-02: Akses Materi Setelah Semester Berakhir

| Aspek | Detail |
|---|---|
| **Konflik** | B08 menyatakan setelah semester mahasiswa hanya melihat rekap nilai; G03 menyatakan materi historis tetap dapat diakses. |
| **Default** | Tampilan mahasiswa setelah semester berakhir: **ringkasan nilai saja**. Arsip materi tetap disimpan di server. Akses materi historis dikontrol oleh konfigurasi `post_term_access_policy` yang belum diimplementasikan. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner + Kaprodi |
| **Dampak jika diubah** | Jika materi tetap terbuka: perlu endpoint/permission untuk akses arsip mahasiswa. Effort: S. |

---

### DEC-03: Revisi/Resubmission Tugas

| Aspek | Detail |
|---|---|
| **Konflik** | G04 menyebut revisi/pengumpulan ulang, tetapi G06 menyatakan submission tidak dapat diganti. |
| **Default** | **Satu submission final**, tidak dapat diganti setelah dikirim. Resubmission hanya diaktifkan jika PO menyetujui dan dosen mengkonfigurasi per tugas. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner + Dosen pilot |
| **Dampak jika diubah** | Jika resubmission diizinkan: perlu versioning submission, field `max_revisions`, dan logic penghapusan/penggantian. Effort: M. |

---

### DEC-04: Model Ketua Kelas

| Aspek | Detail |
|---|---|
| **Konflik** | C01 menolak multi-role, sementara C02 menjadikan Ketua Kelas sebagai mahasiswa dengan izin tambahan. Repository aktual memiliki `KETUA_KELAS` sebagai role global di `UserRole` enum. |
| **Default** | Satu role dasar `MAHASISWA` + **assignment permission** Ketua Kelas yang scoped pada kelas tertentu dan memiliki masa berlaku via `ClassLeaderAssignment`. Role `KETUA_KELAS` di enum perlu di-refactor menjadi hanya assignment. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner |
| **Dampak jika diubah** | Refactor `UserRole` enum memerlukan migration, update seed, update RBAC deps, dan update frontend role routing. Effort: M. |
| **Implementasi saat ini** | `ClassLeaderAssignment` model sudah ada, tapi `UserRole.KETUA_KELAS` juga masih ada sebagai role di enum. |

---

### DEC-05: Alur Persetujuan KRS

| Aspek | Detail |
|---|---|
| **Konflik** | D03 menyisakan Dosen dan Admin sebagai penyetuju KRS, tidak jelas urutan. |
| **Default** | **Dosen memberi pertimbangan akademik** (opsional), **Admin memvalidasi/finalisasi** administratif. Alur dapat dikonfigurasi. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner + Admin akademik |
| **Dampak jika diubah** | Jika hanya Admin: simplifikasi alur. Jika multi-level: perlu state machine DRAFT→SUBMITTED→DOSEN_REVIEW→ADMIN_REVIEW→APPROVED. Effort: M. |
| **Implementasi saat ini** | `KrsRequestStatus` hanya punya PENDING_APPROVAL→APPROVED/REJECTED/CANCELLED; belum ada DRAFT dan UNDER_REVIEW. |

---

### DEC-06: Self-Approval

| Aspek | Detail |
|---|---|
| **Konflik** | E11 menyisakan kemungkinan self-approval untuk status tertentu, tetapi status mana belum ditentukan. |
| **Default** | **Tidak ada self-approval pada MVP.** Semua permohonan ditinjau pihak berwenang lain. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner |
| **Dampak jika diubah** | Jika self-approval diizinkan untuk kasus tertentu: perlu konfigurasi per-jenis dan validasi backend. Effort: S. |

---

### DEC-07: Perubahan Record Final

| Aspek | Detail |
|---|---|
| **Konflik** | E15 menyebut Dosen dapat mengubah record final, sedangkan C08 mensyaratkan Dosen mengajukan dan Admin menyetujui. |
| **Default** | **Request correction** oleh Dosen dengan alasan → approval Admin untuk record final. Seluruh perubahan diaudit dengan before/after. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner + Admin |
| **Dampak jika diubah** | Jika Dosen bisa langsung ubah: kurangi enforcement tapi tetap audit. Effort: S. |

---

### DEC-08: Sesi Terlambat Dibuka

| Aspek | Detail |
|---|---|
| **Konflik** | E14 sesi yang terlambat dibuka menggeser waktu mulai, dengan toleransi laporan 10 menit. |
| **Default** | Simpan jadwal resmi (`scheduled_start_at` ← dari jam_mulai kelas) dan waktu aktual (`dibuka_pada`). Perhitungan check-in memakai `dibuka_pada`. Keterlambatan pembukaan >10 menit harus memiliki alasan (`delay_reason`) dan masuk laporan keterlambatan Dosen. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner |
| **Dampak jika diubah** | Jika waktu jadwal resmi menjadi acuan check-in: logic kalkulasi status berubah. Effort: S. |
| **Implementasi saat ini** | `AttendanceSession` belum memiliki kolom `scheduled_start_at` dan `delay_minutes` — perlu migration. |

---

### DEC-09: Otoritas Perangkat vs Backend

| Aspek | Detail |
|---|---|
| **Konflik** | F02 menyebut perangkat IoT sebagai penentu sah, tetapi validasi enrollment/sesi/credential harus terpusat. |
| **Default** | **Perangkat menangkap event; backend adalah otoritas validasi** dan pembuat AttendanceRecord resmi. Perangkat hanya melaporkan raw event; status "sah" hanya ditentukan backend. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner |
| **Dampak jika diubah** | Minimal — ini sudah sesuai arsitektur yang ada. |

---

### DEC-10: Penyimpanan Lokal ESP32

| Aspek | Detail |
|---|---|
| **Konflik** | F07 menyebut penyimpanan lokal ESP32 dan ada kemungkinan media penyimpanan tambahan (SD card, SPIFFS, dll). |
| **Default** | Rancang **persistent queue abstraction** dan uji restart/power loss. Pilihan media final mengikuti hasil uji kapasitas/ketahanan. |
| **Status** | `PROVISIONAL` |
| **Pihak** | IoT Engineer + Product Owner |
| **Dampak jika diubah** | Perubahan pada firmware offline queue storage. Effort: M. |

---

### DEC-11: Nilai Aktivitas Default 80

| Aspek | Detail |
|---|---|
| **Konflik** | H05 memberi nilai aktivitas default 80, sementara komponen lain yang kosong tidak boleh dianggap sudah dinilai. |
| **Default** | Tandai nilai aktivitas 80 sebagai **default sistem** (`source: "SYSTEM_DEFAULT"`). Komponen lain tetap `NOT_GRADED`. Nilai akhir mengikuti aturan kelengkapan komponen wajib — belum final jika komponen wajib belum lengkap. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner + Dosen pilot |
| **Dampak jika diubah** | Jika default berbeda: update constant. Jika tanpa default: mahasiswa lihat kosong sampai dosen input. Effort: S. |

---

### DEC-12: Granularitas Status Fitur

| Aspek | Detail |
|---|---|
| **Konflik** | A08 meminta status UI/API/DB/E2E terpisah, sedangkan L08 menyebut cukup selesai/belum selesai. |
| **Default** | Gunakan **status granular** (DOCUMENTED, UI_ONLY, API_ONLY, DB_ONLY, PARTIALLY_CONNECTED, END_TO_END_VERIFIED, NOT_FOUND, BLOCKED). Ringkasan boleh menampilkan selesai/belum selesai tapi bukti granular tetap tersedia. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner |
| **Dampak jika diubah** | Hanya format reporting. Effort: S. |

---

### DEC-13: Data Nyata vs Sintetis untuk Development

| Aspek | Detail |
|---|---|
| **Konflik** | K06 mengizinkan data nyata langsung untuk pengembangan, tetapi ada risiko privasi. |
| **Default** | Gunakan **data sintetis/anonymized** untuk development. Data nyata hanya setelah otorisasi yang sah dari PO, dengan pembatasan akses dan tidak disimpan di repository. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner |
| **Dampak jika diubah** | Jika data nyata dipakai: perlu prosedur handling, NDA, dan pembatasan akses. Effort: M. |

---

### DEC-14: Prioritas Top 3

| Aspek | Detail |
|---|---|
| **Konflik** | M01 belum menetapkan top 3 secara tegas. |
| **Default** | Urutan: (1) Keamanan/role + scope, (2) Struktur akademik + enrollment, (3) RFID presensi end-to-end. LMS/nilai sebagai P1. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner |
| **Dampak jika diubah** | Reordering backlog. Effort: S. |

---

### DEC-15: Retensi Data

| Aspek | Detail |
|---|---|
| **Konflik** | K02 retensi data belum diputuskan dan kebijakan kampus belum tersedia. |
| **Default** | Jangan hard-delete transaksi; **arsipkan** (soft-delete + is_active/is_archived flag). Definisikan retensi per kategori sebagai konfigurasi/proposal, menunggu kebijakan resmi kampus. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner + Bagian akademik kampus |
| **Dampak jika diubah** | Jika hard-delete diizinkan: perlu prosedur, approval chain, dan audit. Effort: M. |

---

### DEC-16: Wawancara Dosen

| Aspek | Detail |
|---|---|
| **Konflik** | M06 menyebut wawancara dosen perlu dilakukan untuk menemukan kebutuhan penting yang belum terdokumentasi. |
| **Default** | Siapkan panduan wawancara dosen (`INTERVIEW_GUIDE_DOSEN.md`) dan daftar pertanyaan terbuka. Jangan mengarang kebutuhan dosen yang belum diwawancarai. Gunakan asumsi default yang aman sampai wawancara dilakukan. |
| **Status** | `PROVISIONAL` |
| **Pihak** | Product Owner + Dosen pilot |
| **Dampak jika diubah** | Wawancara dapat menghasilkan requirement baru yang mengubah alur atau prioritas. |

---

*Dokumen ini harus diperbarui setiap kali keputusan dikonfirmasi, direvisi, atau keputusan baru muncul.*
