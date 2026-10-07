# SADITA — Phase 4: LMS Core (Materi, Tugas, Pengumpulan & Penilaian)

Dokumen implementasi teknis untuk **Phase 4: LMS Core** pada project SADITA (Sistem Absensi Digital Terintegrasi Akademik).

---

## 1. Ringkasan Implementasi

SADITA mengintegrasikan pencatatan kehadiran fisik di kelas dengan Learning Management System (LMS) modern. Setelah mahasiswa terotentikasi dan presensi dimulai, aktivitas akademik berlanjut langsung ke materi dan tugas:

1. **Course Materials (Materi Perkuliahan)**:
   - Dosen dapat mengunggah slide, modul dokumen (PDF/Word), link video/GitHub, atau teks/Markdown langsung.
   - Materi dapat dikaitkan dengan kelas umum atau sesi pertemuan tertentu (pertemuan 1 s.d. 16).
2. **Assignments (Penugasan)**:
   - Dosen menetapkan penugasan dengan batas waktu (*due date*), bobot nilai maksimum (*max score*), serta konfigurasi apakah menerima pengumpulan terlambat (*allow late*).
3. **Submissions (Pengumpulan Tugas)**:
   - Mahasiswa yang terdaftar aktif dapat mengunggah link repositori/file tugas dan catatan teks.
   - Evaluasi otomatis tenggat waktu: jika dikumpulkan sebelum *due date*, berstatus `SUBMITTED`; jika setelah *due date* dan diperbolehkan, berstatus `LATE`; jika tidak diperbolehkan, sistem menolak dengan HTTP 400.
4. **Grading & Feedback (Penilaian Dosen)**:
   - Dosen memberikan skor (0–100), catatan evaluasi (*feedback*), dengan pencatatan waktu dan identitas dosen penilai (*audit trail*).
5. **Analytics & Metrics**:
   - Penghitungan metrik otomatis: rasio pengumpulan (*submission rate*), rata-rata nilai kelas (*average score*), nilai tertinggi, dan nilai terendah.

---

## 2. Struktur Database (ORM Models)

| Model | Tabel | Deskripsi |
|---|---|---|
| `CourseMaterial` | `course_materials` | Materi perkuliahan (DOCUMENT, LINK, TEXT) terkait kelas & pertemuan |
| `Assignment` | `assignments` | Penugasan kuliah dengan tenggat waktu, bobot, dan izin keterlambatan |
| `AssignmentSubmission` | `assignment_submissions` | Pengumpulan tugas mahasiswa, file URL, status (SUBMITTED/LATE/GRADED), nilai & feedback |

---

## 3. Endpoints REST API (`/api/v1/lms`)

### Materi Perkuliahan
- `POST /api/v1/lms/materials` — Tambah materi baru (Role: DOSEN/ADMIN)
- `GET /api/v1/lms/materials?class_id={id}&session_id={num}` — Daftar materi kelas
- `GET /api/v1/lms/materials/{id}` — Detail materi
- `DELETE /api/v1/lms/materials/{id}` — Hapus materi (Role: DOSEN/ADMIN)

### Penugasan (Assignments)
- `POST /api/v1/lms/assignments` — Buat tugas baru (Role: DOSEN/ADMIN)
- `GET /api/v1/lms/assignments?class_id={id}` — Daftar tugas kelas
- `GET /api/v1/lms/assignments/{id}` — Detail tugas dan riwayat pengumpulan
- `GET /api/v1/lms/assignments/{id}/summary` — Analitik nilai dan tingkat pengumpulan
- `DELETE /api/v1/lms/assignments/{id}` — Hapus tugas (Role: DOSEN/ADMIN)

### Pengumpulan & Penilaian
- `POST /api/v1/lms/assignments/{id}/submissions` — Mahasiswa mengumpulkan tugas
- `GET /api/v1/lms/assignments/{id}/submissions` — Dosen melihat seluruh pengumpulan
- `GET /api/v1/lms/assignments/{id}/my-submission` — Mahasiswa memeriksa status pengumpulan sendiri
- `PUT /api/v1/lms/submissions/{id}/grade` — Dosen memberikan nilai dan umpan balik
- `GET /api/v1/lms/students/{id}/submissions` — Riwayat seluruh pengumpulan mahasiswa

---

## 4. Hasil Pengujian Otomatis

Seluruh modul telah diuji dengan **69 automated unit & integration tests** (`69 passed, 0 failed`):
- Phase 1: 3 tests (Infrastruktur & Broker MQTT)
- Phase 2: 30 tests (Auth, JWT, RBAC, Hardware RFID & Fingerprint mapping, Academic entities)
- Phase 3: 23 tests (Session lifecycle, IoT pipeline, toleransi keterlambatan, MQTT handlers)
- Phase 4: 13 tests (Materi perkuliahan, validasi tenggat tugas, submission on-time vs late, grading, dan analitik)
