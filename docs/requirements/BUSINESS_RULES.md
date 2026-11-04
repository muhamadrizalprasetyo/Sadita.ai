# SADITA.ai — Business Rules

**Versi:** 1.0  
**Tanggal:** 2026-10-30

Setiap aturan bisnis memiliki ID unik, prioritas, dan acceptance criteria yang dapat diuji.

---

## BR-AUTH — Autentikasi dan Akun

| ID | Aturan | Prioritas | Acceptance Criteria |
|---|---|---|---|
| BR-AUTH-001 | Login menggunakan email atau NIM + password | P0 | Input email valid → token; Input NIM valid → lookup StudentProfile → token |
| BR-AUTH-002 | Akun hanya dapat dibuat oleh Admin | P0 | Register endpoint hanya bisa diakses role ADMIN; unauthorized → 403 |
| BR-AUTH-003 | Satu email hanya untuk satu akun | P0 | Duplikat email → 400 |
| BR-AUTH-004 | Satu NIM hanya untuk satu mahasiswa | P0 | Duplikat NIM → 400 |
| BR-AUTH-005 | Satu NIDN hanya untuk satu dosen | P0 | Duplikat NIDN → 400 |
| BR-AUTH-006 | Akun nonaktif tidak dapat login | P0 | is_active=false → 403 |
| BR-AUTH-007 | Password minimal 6 karakter | P0 | Input <6 → 400 |
| BR-AUTH-008 | Ubah password memerlukan verifikasi password lama | P0 | Password lama salah → 400 |

---

## BR-ROLE — Role dan Akses

| ID | Aturan | Prioritas | Acceptance Criteria |
|---|---|---|---|
| BR-ROLE-001 | Setiap akun memiliki tepat satu role dasar | P0 | Role wajib diisi; enum: ADMIN, KAPRODI, DOSEN, MAHASISWA |
| BR-ROLE-002 | Ketua Kelas adalah mahasiswa + assignment, bukan role terpisah | P0 | Mahasiswa mendapat ClassLeaderAssignment; bukan UserRole baru |
| BR-ROLE-003 | Dosen hanya mengakses kelas yang ditugaskan kepadanya | P0 | Akses kelas lain → 404 |
| BR-ROLE-004 | Mahasiswa hanya mengakses data pribadi dan kelas yang diikuti | P0 | Akses data mahasiswa lain → 404 |
| BR-ROLE-005 | Kaprodi hanya mengakses prodi yang menjadi tanggung jawabnya | P0 | Akses prodi lain → 404 |
| BR-ROLE-006 | Ketua Kelas hanya memiliki permission pada kelas dan periode penugasan aktif | P0 | Akses kelas lain → 404 |
| BR-ROLE-007 | Ketua Kelas tidak boleh menyetujui permohonannya sendiri | P0 | Self-approval → 403 |
| BR-ROLE-008 | Resource yang tidak berhak diakses mengembalikan 404, bukan 403 | P0 | Menyembunyikan keberadaan data |

---

## BR-AKAD — Akademik

| ID | Aturan | Prioritas | Acceptance Criteria |
|---|---|---|---|
| BR-AKAD-001 | Satu mata kuliah (Course) bisa memiliki banyak kelas (CourseClass) dalam semester yang sama | P0 | Kelas pagi dan malam untuk matkul yang sama → valid |
| BR-AKAD-002 | Setiap kelas memiliki tipe: REGULER_PAGI, REGULER_MALAM, atau SHIFT | P0 | Enum tersimpan benar di DB |
| BR-AKAD-003 | Satu kelas memiliki 16 pertemuan terjadwal | P0 | Seed schedule membuat 16 sesi per kelas |
| BR-AKAD-004 | Pertemuan ke-8 = UTS, pertemuan ke-16 = UAS | P0 | Sesi 8 dan 16 ditandai sebagai UTS/UAS |
| BR-AKAD-005 | Penugasan dosen ke kelas harus eksplisit dan memiliki periode berlaku | P0 | CourseClass.lecturer_id wajib diisi |
| BR-AKAD-006 | Hanya satu semester yang boleh aktif pada satu waktu | P0 | Constraint is_active=true hanya 1 AcademicTerm |
| BR-AKAD-007 | Histori akademik tetap disimpan setelah semester selesai | P0 | Tidak ada hard-delete; data historis tetap ada |

---

## BR-ENR — Enrollment dan KRS

| ID | Aturan | Prioritas | Acceptance Criteria |
|---|---|---|---|
| BR-ENR-001 | Enrollment ganda (mahasiswa + kelas yang sama) ditolak | P0 | Unique constraint class_id + student_id → 400 |
| BR-ENR-002 | Pendaftaran ke kelas penuh ditolak | P0 | Jumlah enrollment >= kapasitas ruangan → 400 |
| BR-ENR-003 | KRS digunakan untuk permohonan pengecualian (tambah SKS, mengulang) | P0 | KRS ≠ pembuatan akun |
| BR-ENR-004 | Status KRS: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / CANCELLED | P0 | State machine dipatuhi |
| BR-ENR-005 | KRS yang disetujui membuat enrollment satu kali saja | P0 | Double-approve tidak menggandakan enrollment |
| BR-ENR-006 | KRS ditolak/dibatalkan tidak menghapus submission, nilai, atau presensi historis | P0 | Data transaksional tetap ada |
| BR-ENR-007 | Penolakan/pembatalan enrollment memerlukan persetujuan dan audit | P0 | Audit log tercatat |

---

## BR-ATT — Presensi

| ID | Aturan | Prioritas | Acceptance Criteria |
|---|---|---|---|
| BR-ATT-001 | Hanya Dosen pengampu yang dapat membuka sesi presensi | P0 | Dosen lain → 403 |
| BR-ATT-002 | Status kehadiran: HADIR, TERLAMBAT, IZIN, SAKIT, ALFA | P0 | Enum di DB |
| BR-ATT-003 | Acuan status hadir/terlambat adalah waktu sesi dibuka + toleransi configurable | P0 | check_in ≤ opened_at + tolerance → HADIR; > → TERLAMBAT |
| BR-ATT-004 | Satu mahasiswa hanya boleh memiliki satu record resmi per sesi | P0 | Unique session_id + student_id |
| BR-ATT-005 | Tap kedua tidak menggandakan record resmi | P0 | Duplicate event disimpan di log, record tidak berubah |
| BR-ATT-006 | Proses harus idempotent — retry MQTT tidak menggandakan presensi | P0 | event_uuid unique check |
| BR-ATT-007 | Saat sesi difinalisasi, mahasiswa terdaftar tanpa record → status ALFA | P0 | Auto-fill ALFA pada close session |
| BR-ATT-008 | Sesi dibuka >10 menit terlambat: alasan wajib + masuk laporan | P0 | delay_minutes > 10 → delay_reason required |
| BR-ATT-009 | Mahasiswa tanpa KTM dapat mengajukan presensi → persetujuan Dosen | P0 | AttendanceRequest flow |
| BR-ATT-010 | KTM hilang vs KTM tidak dibawa vs belum memiliki KTM → prosedur berbeda | P0 | KtmStatus enum menentukan alur |
| BR-ATT-011 | Waktu UTC di backend; tampilan Asia/Jakarta | P0 | Timestamp DB = UTC; frontend = WIB |
| BR-ATT-012 | Perangkat menangkap event; backend otoritas validasi | P0 | AttendanceEvent ≠ AttendanceRecord |
| BR-ATT-013 | Koreksi setelah finalisasi memerlukan pengajuan Dosen + approval Admin | P1 | Correction request flow |
| BR-ATT-014 | Perubahan record final harus memiliki before/after + alasan di audit log | P0 | AuditLog entry |

---

## BR-LMS — Materi, Tugas, Kuis

| ID | Aturan | Prioritas | Acceptance Criteria |
|---|---|---|---|
| BR-LMS-001 | Materi terkait pertemuan, bersifat opsional | P1 | Dosen tidak wajib upload materi setiap pertemuan |
| BR-LMS-002 | Materi hanya dapat diakses mahasiswa setelah dipublikasikan dan waktu akses tercapai | P1 | Unpublished material → 404 untuk mahasiswa |
| BR-LMS-003 | Mahasiswa hanya mengakses materi kelas yang diikuti | P1 | Kelas lain → 404 |
| BR-LMS-004 | Tugas memiliki tenggat; late submission diberi tanda jika diizinkan | P1 | SubmissionStatus LATE vs SUBMITTED |
| BR-LMS-005 | Default: satu submission final, tidak dapat diganti | P1 | Re-submission → 400 kecuali konfigurasi per-tugas mengizinkan |
| BR-LMS-006 | Tugas mendukung individu dan kelompok | P1 | Tipe assignment: INDIVIDUAL / GROUP |
| BR-LMS-007 | Kuis memiliki durasi, jumlah percobaan, dan validasi di backend | P1 | Timer expired → auto-submit; attempts > max → 400 |
| BR-LMS-008 | Jawaban kuis disimpan berkala (autosave) | P1 | Koneksi putus → jawaban terakhir tersimpan |
| BR-LMS-009 | Jawaban benar/pembahasan tidak ditampilkan kepada mahasiswa pada default | P1 | Config flag show_answers |

---

## BR-GRADE — Penilaian

| ID | Aturan | Prioritas | Acceptance Criteria |
|---|---|---|---|
| BR-GRADE-001 | Bobot default: UTS 30%, UAS 35%, Aktivitas 10%, Tugas 15%, Presensi 10% | P1 | Configurable per mata kuliah; default as stated |
| BR-GRADE-002 | Nilai aktivitas default = 80 (label: SYSTEM_DEFAULT) | P1 | Jika dosen belum input → 80 dengan label |
| BR-GRADE-003 | Komponen belum dinilai = NOT_GRADED; nilai akhir belum final | P1 | UI menampilkan "Belum Lengkap" |
| BR-GRADE-004 | Mahasiswa melihat nilai setelah Dosen mempublikasikan | P1 | Unpublished grades → tidak tampil di portal mahasiswa |
| BR-GRADE-005 | Perubahan nilai setelah publikasi: Dosen ajukan + alasan → Admin approve | P1 | Correction flow + audit |
| BR-GRADE-006 | Skala huruf A–E dari konfigurasi global kampus | P1 | GradeScale configurable |
| BR-GRADE-007 | Batas kehadiran minimum 75% untuk UAS | P1 | Presensi < 75% → tidak eligible UAS |

---

## BR-DEVICE — Perangkat IoT

| ID | Aturan | Prioritas | Acceptance Criteria |
|---|---|---|---|
| BR-DEVICE-001 | Setiap perangkat terdaftar dengan device_id unik | P0 | Unique constraint |
| BR-DEVICE-002 | Perangkat terikat ke ruangan/kelas | P0 | room_id FK |
| BR-DEVICE-003 | Perubahan penempatan harus tercatat di audit log | P0 | AuditLog entry |
| BR-DEVICE-004 | Perangkat yang credential-nya dicabut tidak dapat mengirim event sah | P0 | Validasi device_id di handler |
| BR-DEVICE-005 | Perangkat menampilkan hasil presensi (berhasil/terlambat/gagal/duplikat) | P0 | MQTT response ke device |
| BR-DEVICE-006 | Perangkat tidak memberi status "berhasil" jika backend belum mengonfirmasi | P0 | Wait for ACK |

---

## BR-AUDIT — Audit dan Keamanan

| ID | Aturan | Prioritas | Acceptance Criteria |
|---|---|---|---|
| BR-AUDIT-001 | Perubahan nilai, presensi, enrollment, credential, dan akses ditolak tercatat | P0 | AuditLog entries |
| BR-AUDIT-002 | Audit log bersifat append-only | P0 | Tidak ada UPDATE/DELETE pada audit_logs |
| BR-AUDIT-003 | Audit mencatat aktor, waktu, objek, nilai sebelum/sesudah | P0 | JSON before/after |
| BR-AUDIT-004 | File lampiran hanya diakses pemilik + dosen berwenang + pemeriksa | P1 | Access control pada upload |
| BR-AUDIT-005 | Data akademik historis tidak di-hard-delete | P0 | Soft-delete / arsip |

---

*Setiap aturan bisnis di atas harus memiliki minimal satu test case yang membuktikan enforcement-nya.*
