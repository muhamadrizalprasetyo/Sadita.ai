# LAPORAN AUDIT SISTEM BACKEND — SADITA.AI

> **Tanggal Audit:** 15 Oktober 2026  
> **Auditor:** Antigravity AI Code Auditor  
> **Komponen Diperiksa:** Arsitektur, Skema Database, Keamanan (RBAC & Auth), Integritas Bisnis (LMS, Presensi IoT, Grading), MQTT Edge Pipeline, dan Test Suite Coverage.  
> **Status Test Suite Saat Ini:** **75 / 75 Tests PASSED (100% Pass Rate)**  

---

## 1. Executive Summary

Audit teknis komprehensif telah dilakukan terhadap seluruh basis kode backend **SADITA.ai** (`backend/app`). Secara keseluruhan, backend memiliki kualitas kode yang **sangat baik**, modular, terstruktur rapi dengan pola *Repository & Service Layer*, serta menerapkan SQLAlchemy 2.0 dan Pydantic v2.

Test suite mencakup seluruh fase (Infrastruktur, Auth & Model, Attendance Engine, LMS Frappe-adapted, dan Workflow) dan **seluruh 75 pengujian berhasil lulus (100% Pass)**.

Namun demikian, audit menemukan beberapa temuan penting (temuan kritis, menengah, dan rekomendasi optimasi) yang perlu segera ditindaklanjuti untuk memastikan kehandalan, keamanan, dan skalabilitas di lingkungan produksi (*production readiness*).

### Ringkasan Tingkat Temuan:
- 🔴 **Kritis (High Severity):** 1 Temuan (Logic Bug pada Sub-query Skor Presensi di Grading Engine)
- 🟡 **Menengah (Medium Severity):** 4 Temuan (Default JWT Secret Fallback, Ketiadaan Unique Constraint pada Fingerprint Slot, Eksekusi Handler MQTT di Network Thread, Ketiadaan Endpoint Direct File Upload)
- 🟢 **Rendah / Best Practice (Low Severity):** 3 Temuan (CORS Wildcard Headers, Index Partial SQLite vs Postgres, Unbounded Query Pagination)

---

## 2. Temuan Audit Rinci Berdasarkan Kategori

### 2.1 [HIGH] Logic Bug pada Kalkulasi Nilai Presensi (`GradingService`)

* **Lokasi Berkas:** [`backend/app/services/grading_service.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/services/grading_service.py#L59-L72)
* **Deskripsi Masalah:**
  Pada fungsi `GradingService.calculate_attendance_score`, terdapat kesalahan perbandingan ID pada subquery bersarang:
  ```python
  # KODE SAAT INI:
  sessions = db.query(AttendanceRecord).filter(
      AttendanceRecord.session_id.in_(
          db.query(AttendanceRecord.session_id).filter(
              AttendanceRecord.session_id.in_(
                  db.query(AttendanceRecord.id).join(  # <-- BUG DI SINI! Mengambil AttendanceRecord.id
                      AttendanceRecord.session
                  ).filter(
                      AttendanceRecord.session.has(class_id=class_id)
                  )
              )
          )
      ),
      AttendanceRecord.student_id == student_id
  ).all()
  ```
* **Dampak:**
  `db.query(AttendanceRecord.id)` mengambil Primary Key dari record presensi, bukan `session_id`. Ketika jumlah data bertambah dan nilai `AttendanceRecord.id` berbeda dengan `AttendanceSession.id`, perbandingan `session_id.in_(record.id)` akan gagal mencocokkan data. Akibatnya, nilai absensi mahasiswa akan terhitung **0.0** padahal mahasiswa hadir.
* **Rekomendasi Perbaikan:**
  Gunakan join langsung yang efisien dan bersih:
  ```python
  sessions = (
      db.query(AttendanceRecord)
      .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
      .filter(
          AttendanceSession.class_id == class_id,
          AttendanceRecord.student_id == student_id,
      )
      .all()
  )
  ```

---

### 2.2 [MEDIUM] Fallback Secret Key Hardcoded pada Konfigurasi Produksi

* **Lokasi Berkas:** [`backend/app/core/config.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/core/config.py#L26-L58)
* **Deskripsi Masalah:**
  Konfigurasi menyediakan nilai bawaan untuk kunci enkripsi:
  ```python
  SECRET_KEY: str = "change-me"
  JWT_SECRET_KEY: str = "change-me-jwt"
  ```
  Jika berkas `.env` tidak terkonfigurasi dengan benar pada server produksi (atau terlupa diatur oleh DevOps), aplikasi tetap berjalan dengan kunci default tersebut tanpa melempar error startup.
* **Dampak:**
  Penyerang (*attacker*) yang mengetahui kode sumber dapat memalsukan token JWT (`HS256`) dengan peran `ADMIN` dan mengambil alih seluruh sistem kampus.
* **Rekomendasi Perbaikan:**
  Tambahkan validator atau pemeriksaan di `lifespan`: jika `APP_ENV == "production"`, wajibkan `SECRET_KEY` dan `JWT_SECRET_KEY` bukan nilai default dan memiliki panjang minimum 32 karakter acak (misal via `secrets.token_hex(32)`).

---

### 2.3 [MEDIUM] Ketiadaan Constraint Integritas pada Slot Sidik Jari (`FingerprintCredential`)

* **Lokasi Berkas:** [`backend/app/models/credential.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/credential.py#L68-L95)
* **Deskripsi Masalah:**
  Sensor biometrik AS608/R307 memiliki memori internal terbatas (slot nomor 0 s.d. 127). Tabel `fingerprint_credentials` mencatat `device_id` dan `template_slot`. Namun, **tidak ada composite unique constraint** pada kombinasi `(device_id, template_slot, is_active=True)`.
* **Dampak:**
  Dua mahasiswa berbeda dapat secara tidak sengaja didaftarkan ke slot template yang sama pada satu perangkat jika terjadi *race condition* atau kesalahan input operator pendaftaran KTM. Ini berisiko salah identifikasi presensi (*cross-student false positive*).
* **Rekomendasi Perbaikan:**
  Tambahkan unique constraint atau index parsial pada skema database:
  ```python
  __table_args__ = (
      UniqueConstraint("device_id", "template_slot", name="uq_device_active_fingerprint_slot"),
  )
  ```

---

### 2.4 [MEDIUM] Eksekusi Database Synchronous di Thread Jaringan MQTT

* **Lokasi Berkas:** [`backend/app/mqtt/client.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/mqtt/client.py#L122-L151) & [`handlers.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/mqtt/handlers.py)
* **Deskripsi Masalah:**
  Metode `_on_message` pada `paho-mqtt` dipanggil langsung dari network loop internal client MQTT. Di dalam handler (`handle_rfid`, `handle_status`), terdapat query database sinkron (`SessionLocal()`, `db.commit()`).
* **Dampak:**
  Jika puluhan mahasiswa melakukan tap kartu secara serentak di berbagai ruangan kelas, waktu tunggu transaksi database dapat memblokir thread loop MQTT, menyebabkan *packet drop*, keterlambatan pengiriman respons balik ke LCD ESP32, atau *broker disconnect* akibat keterlambatan ping heartbeat.
* **Rekomendasi Perbaikan:**
  Serahkan eksekusi handler ke ThreadPool / Worker Queue:
  ```python
  from concurrent.futures import ThreadPoolExecutor
  mqtt_executor = ThreadPoolExecutor(max_workers=8, thread_name_prefix="mqtt_worker")
  # di _on_message:
  mqtt_executor.submit(handler, device_id, payload)
  ```

---

### 2.5 [MEDIUM] Ketiadaan Endpoint Direct File Upload untuk Submission & Materi

* **Lokasi Berkas:** [`backend/app/api/v1/endpoints/lms.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/api/v1/endpoints/lms.py)
* **Deskripsi Masalah:**
  Pengumpulan tugas (`assignment_submissions`) dan modul (`course_materials`) hanya menerima string `file_url`. Backend belum menyediakan rute `POST /uploads` dengan `UploadFile` (multipart/form-data) untuk menyimpan file PDF/dokumen ke folder `uploads` lokal atau object storage (S3/MinIO).
* **Dampak:**
  Frontend Next.js saat ini harus mengandalkan URL eksternal atau penyimpanan pihak ketiga tanpa validasi ukuran berkas, pembatasan ekstensi berbahaya (misal eksekusi script `.php` / `.exe`), atau pemindaian keamanan berkas di sisi backend kampus.
* **Rekomendasi Perbaikan:**
  Implementasikan endpoint upload aman dengan validasi tipe konten MIME (whitelist: `.pdf`, `.docx`, `.zip`, `.png`, `.jpg`), pembatasan ukuran (`MAX_UPLOAD_SIZE_MB = 10`), serta sanitasi nama berkas (UUID v4).

---

### 2.6 [LOW] Parameter Paginasi Tidak Terbatas (*Unbounded Query*)

* **Lokasi Berkas:** Endpoint listing di [`backend/app/api/v1/endpoints/lms.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/api/v1/endpoints/lms.py) dan [`attendance.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/api/v1/endpoints/attendance.py)
* **Deskripsi Masalah:**
  Beberapa endpoint seperti `GET /lms/chapters`, `GET /lms/lessons`, dan `GET /attendance/sessions` mengeksekusi `.all()` tanpa parameter `limit` dan `offset` / `skip`.
* **Dampak:**
  Ketika riwayat perkuliahan telah berjalan beberapa semester dan menghasilkan ribuan record, pemanggilan endpoint tanpa batasan paginasi akan membebani memori server (*high memory consumption*).
* **Rekomendasi Perbaikan:**
  Terapkan standar paginasi bawaan FastAPI:
  ```python
  skip: int = Query(0, ge=0),
  limit: int = Query(50, ge=1, le=100)
  ```

---

### 2.7 [LOW] Kompatibilitas Index Parsial SQLite pada Uji Coba

* **Lokasi Berkas:** [`backend/app/models/workflow.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/models/workflow.py#L24)
* **Deskripsi Masalah:**
  Tabel `class_leader_assignments` menggunakan `postgresql_where="is_active"`. Pada database PostgreSQL di produksi hal ini berjalan sempurna, namun jika dijalankan pada SQLite lokal tertentu tanpa ekstensi parsial yang sesuai, klausul tersebut bisa diabaikan atau menimbulkan peringatan dialect.
* **Rekomendasi Perbaikan:**
  Tambahkan guard dialect atau gunakan migration Alembic untuk indeks spesifik DBMS PostgreSQL.

---

## 3. Hasil Pengujian Unit & Integrasi (Pytest Verification)

Pengujian menyeluruh dijalankan menggunakan environment virtual `.venv` pada root direktori backend:
```bash
pytest -q
```

### Hasil Eksekusi:
```text
........................................................................ [ 96%]
...                                                                      [100%]
============================== 75 passed in 140.18s ==============================
```

### Rincian Modul yang Diuji:
1. **`test_phase1_infrastructure.py` (Passed):** Validasi koneksi DB session, konfigurasi environment, JWT creation/verification, MQTT client mock & callbacks.
2. **`test_phase2_auth_and_models.py` (Passed):** Validasi model User, Student, Lecturer, Academic, password hashing (bcrypt), RBAC dependency guard.
3. **`test_phase3_attendance.py` (Passed):** Validasi pembuatan sesi (1..16), pembukaan sesi, inisialisasi status ALFA otomatis, presensi 2FA IoT (RFID + Fingerprint), toleransi keterlambatan (15 menit), manual override, serta raw audit event logging.
4. **`test_phase4_lms.py` (Passed):** Validasi Chapter, Lesson, Material, Assignment, Kuis, auto-grading, progress mahasiswa, serta pembobotan nilai akhir.
5. **`test_class_leader_workflow.py` (Passed):** Validasi alur persetujuan kehadiran daring berjenjang: Pengajuan mahasiswa (`PENDING`) -> Verifikasi Ketua Kelas (`VERIFIED`) -> Approval final Dosen (`APPROVED`) & pembuatan record hadir otomatis.
6. **`test_devices_api.py` & `test_audit_api.py` (Passed):** Validasi registrasi perangkat keras ESP32 dan pembacaan log jejak audit.

---

## 4. Rencana Aksi Perbaikan (Action Plan)

| Prioritas | Item Perbaikan | Estimasi Upaya | Dampak |
|:---:|---|:---:|---|
| **P1** | Perbaiki subquery pada `GradingService.calculate_attendance_score` agar menggunakan join langsung | 10 Menit | Menghilangkan risiko nilai absensi mahasiswa salah hitung |
| **P2** | Tambahkan validasi kunci rahasia (`JWT_SECRET_KEY`) saat boot aplikasi di mode produksi | 15 Menit | Mencegah celah pemalsuan token akses admin |
| **P3** | Bungkus handler pesan MQTT dengan `ThreadPoolExecutor` | 20 Menit | Mencegah bottleneck thread jaringan saat beban tap RFID tinggi |
| **P4** | Tambahkan endpoint `POST /api/v1/uploads` dengan MIME & size validation | 45 Menit | Memungkinkan upload berkas tugas dan materi secara aman |
| **P5** | Tambahkan paginasi default (`limit=50`, `offset=0`) pada endpoint list | 30 Menit | Mengoptimalkan konsumsi memori dan query time DB |

---

## 5. Kesimpulan Auditor

Sistem backend **SADITA.ai** berada dalam kondisi struktural yang **sangat solid dan matang**. Fondasi arsitektural yang dirancang telah mencerminkan kebutuhan nyata perguruan tinggi (model shift pagi/malam, alur delegasi ketua kelas, integrasi hardware IoT dua faktor, serta struktur LMS modern).

Dengan menerapkan perbaikan pada **Temuan 2.1 (Grading Query)** dan rekomendasi pengamanan **Temuan 2.2 & 2.4**, sistem ini sepenuhnya siap untuk melangkah ke tahap pengujian pilot (*pilot launch*) di Program Studi Teknologi Informasi UNIPI.
