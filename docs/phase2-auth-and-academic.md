# SADITA — Phase 2: Database Schema & Authentication / RBAC

Dokumen implementasi resmi untuk **Phase 2: Database Schema & Authentication / RBAC** pada proyek **SADITA** (Sistem Absensi Digital Terintegrasi Akademik).

---

## 1. Ringkasan Implementasi Phase 2

Phase 2 memperluas baseline infrastruktur Phase 1 dengan:
1. **10 Domain Models PostgreSQL** menggunakan SQLAlchemy 2.0 (Declarative Base & Mapped Columns).
2. **Alembic Initial Migration** (`create_initial_schema`) yang terapkan DDL secara terstruktur.
3. **Sistem Otentikasi JWT**:
   - Access Token (masa aktif 60 menit).
   - Refresh Token (masa aktif 7 hari).
   - Password hashing menggunakan bcrypt native.
4. **Role-Based Access Control (RBAC)**:
   - `ADMIN`: Akses penuh ke seluruh sistem dan manajemen pengguna.
   - `DOSEN`: Mengelola kelas, melihat mahasiswa, menetapkan kredensial hardware, dan absensi.
   - `MAHASISWA`: Mengakses data kehadiran pribadi dan kelas yang diambil.
5. **Hardware Credential Mapping**:
   - Pemetaan Kartu KTM (RFID UID hex string).
   - Pemetaan Slot Index Sidik Jari pada sensor optical FPM10A/AS608.
   - Endpoint khusus lookup cepat untuk modul IoT ESP32 (`/api/v1/students/by-rfid/{rfid_uid}`).
6. **Entitas Akademik Baseline** (Fokus: Satu mata kuliah, satu dosen, satu kelas pagi di UNIPI):
   - Semester: `Ganjil 2026/2027`
   - Mata Kuliah: `IF201 - Pemrograman Internet & Mobile (3 SKS)`
   - Ruangan: `Lab IoT & Mobile (R301)`
   - Kelas: `TI-2024-Pagi-A (Senin 08:00 - 10:30)`
   - Peserta Kelas (KRS): 3 mahasiswa terdaftar beserta kredensial hardware.

---

## 2. Struktur Tabel Database (`sadita_db`)

| Nama Tabel | Deskripsi | Relasi Kunci |
|---|---|---|
| `users` | Akun pengguna utama, email, password hash, role | 1-to-1 ke `student_profiles` atau `lecturer_profiles` |
| `student_profiles` | Data mahasiswa, NIM, RFID UID, slot sidik jari | FK `users.id`, 1-to-many `class_enrollments` |
| `lecturer_profiles` | Data dosen, NIDN, departemen | FK `users.id`, 1-to-many `course_classes` |
| `academic_terms` | Semester dan periode akademik | 1-to-many `course_classes` |
| `courses` | Katalog mata kuliah, kode, nama, SKS | 1-to-many `course_classes` |
| `class_rooms` | Ruangan kelas atau lab | 1-to-many `course_classes` |
| `course_classes` | Kelas perkuliahan yang dibuka | FK ke `courses`, `academic_terms`, `lecturer_profiles` |
| `class_enrollments` | Peserta kelas (KRS mahasiswa) | FK `course_classes.id`, FK `student_profiles.id` (Unique) |
| `attendance_sessions` | Pertemuan sesi kuliah (1 s.d. 16) | FK `course_classes.id` (Unique class + session_number) |
| `attendance_records` | Rekap kehadiran mahasiswa per sesi | FK `attendance_sessions.id`, FK `student_profiles.id` |

---

## 3. Akun Bawaan & Kredensial Pengujian (Seeded)

| Role | Nama | Email | Password | Identitas Akademik / Hardware |
|---|---|---|---|---|
| **ADMIN** | Administrator SADITA | `admin@unipi.ac.id` | `admin123` | Akses penuh sistem |
| **DOSEN** | Dr. Ahmad Fauzi, M.Kom. | `dosen@unipi.ac.id` | `dosen123` | NIDN: `0412058501` |
| **MAHASISWA** | Muhammad Rizal | `rizal@mhs.unipi.ac.id` | `mhs123` | NIM: `202401001` • RFID: `A1B2C3D4` • Sidik Jari: `#1` |
| **MAHASISWA** | Budi Santoso | `budi@mhs.unipi.ac.id` | `mhs123` | NIM: `202401002` • RFID: `E5F60718` • Sidik Jari: `#2` |
| **MAHASISWA** | Siti Nurhaliza | `siti@mhs.unipi.ac.id` | `mhs123` | NIM: `202401003` • RFID: `11223344` • Sidik Jari: `#3` |

---

## 4. Katalog Endpoint API (v1)

### Otentikasi & Akun (`/api/v1/auth`)
- `POST /api/v1/auth/login` — Autentikasi dengan email & password, mengembalikan access token & refresh token.
- `POST /api/v1/auth/register` — Mendaftarkan pengguna baru beserta profil peran (Dosen/Mahasiswa).
- `POST /api/v1/auth/refresh` — Memperbarui access token dengan refresh token.
- `GET /api/v1/auth/me` — Mengambil data pengguna login saat ini beserta profil detail.

### Manajemen Pengguna & RBAC (`/api/v1/users`)
- `GET /api/v1/users` — Daftar seluruh pengguna sistem (Hanya Admin).
- `GET /api/v1/users/{id}` — Detail pengguna berdasarkan ID (Hanya Admin).

### Mahasiswa & Kredensial Hardware (`/api/v1/students`)
- `GET /api/v1/students` — Daftar mahasiswa (Dosen & Admin).
- `GET /api/v1/students/{id}` — Detail profil mahasiswa.
- `PUT /api/v1/students/{id}/hardware` — Mendaftarkan kartu RFID UID & Slot Sidik Jari.
- `GET /api/v1/students/by-rfid/{rfid_uid}` — Endpoint lookup instan saat kartu ditap di perangkat IoT.

### Dosen (`/api/v1/lecturers`)
- `GET /api/v1/lecturers` — Daftar dosen aktif.
- `GET /api/v1/lecturers/{id}` — Detail profil dosen.

### Akademik & Kelas (`/api/v1/academic`)
- `GET /api/v1/academic/terms` — Daftar semester.
- `POST /api/v1/academic/terms` — Tambah semester baru (Admin).
- `GET /api/v1/academic/courses` — Daftar mata kuliah.
- `POST /api/v1/academic/courses` — Tambah mata kuliah (Admin).
- `GET /api/v1/academic/rooms` — Daftar ruangan kelas.
- `GET /api/v1/academic/classes` — Daftar kelas kuliah yang aktif.
- `POST /api/v1/academic/classes` — Buka kelas kuliah baru (Dosen/Admin).
- `POST /api/v1/academic/classes/{id}/enroll` — Daftarkan mahasiswa ke kelas (KRS).
- `GET /api/v1/academic/classes/{id}/students` — Daftar mahasiswa peserta kelas beserta status KRS.

---

## 5. Hasil Pengujian Otomatis

Seluruh pengujian dijalankan dengan `pytest`:
```bash
backend\.venv\Scripts\pytest.exe -v
```

Hasil:
```
======================= 33 passed, 2 warnings in 5.42s ========================
```
- **17 Tests Phase 1**: Konfigurasi, Koneksi DB PG18, MQTT Lifespan, Health Endpoints, Root Endpoints.
- **16 Tests Phase 2**: Otentikasi Login (Admin, Dosen, Mahasiswa), Refresh Token, Verifikasi Token, RBAC Guard (Mahasiswa dibatasi dari menu Admin), Hardware RFID lookup, Hardware Assignment update, Academic Classes listing & KRS Enrollments.
