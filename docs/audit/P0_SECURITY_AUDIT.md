# SADITA.ai — P0 Security & Cyber Protection Audit Report

**Versi:** 1.0  
**Tanggal:** 2026-10-30  
**Tujuan:** Audit menyeluruh terhadap postur keamanan siber, otorisasi RBAC/ABAC, perlindungan data akademik, dan kepatuhan Zero-Trust pada fase P0.  
**Standar Evaluasi:** OWASP Top 10:2021, Zero-Trust Architecture, dan Enterprise Security Guidelines SADITA.ai.

---

## 1. Ringkasan Tingkat Risiko Keamanan (Risk Posture)

| Tingkat Risiko | Jumlah Temuan | Area Terdampak |
|---|---|---|
| 🔴 **CRITICAL** | 2 | Jalur Komunikasi MQTT Tanpa Enkripsi & Replay Attack; Skema Migrasi Produksi Hilang |
| 🟠 **HIGH** | 2 | Data Forensik Audit Log Kosong (IP/UA Missing); Potensi Downgrade Presensi Double-Tap |
| 🟡 **MEDIUM** | 3 | Conflation Kuota Kelas vs Kapasitas Ruangan; Paparan UID RFID Lengkap pada Respon API; Tidak Ada Rate Limiting pada Login |
| 🟢 **LOW / INFO** | 2 | Refresh Token Revocation Blacklist di Memory/DB; CORS Wildcard pada Lingkungan Dev |

---

## 2. Temuan Keamanan Mendalam & Analisis Celah

### SEC-01 [CRITICAL]: Jalur Komunikasi MQTT Tidak Terenkripsi dan Rentan Anti-Replay Attack
- **Lokasi:** `backend/.env` (baris 19-25), [handlers.py](../../backend/app/mqtt/handlers.py) (baris 88-160)
- **Kondisi:**
  Pada berkas konfigurasi `.env`, MQTT dikonfigurasi pada port standar `1883` tanpa TLS (`MQTT_TLS_ENABLED=false`) dan tanpa otentikasi kredensial (`MQTT_USERNAME=`, `MQTT_PASSWORD=`).
  Payload MQTT yang dikirimkan oleh simulator maupun ESP32-S3 hanya berupa JSON polos:
  ```json
  {"uid": "A1B2C3D4", "mode": "rfid_only", "timestamp": 1793366000}
  ```
- **Analisis Dampak:**
  1. **Man-In-The-Middle (MITM):** Siapa pun yang berada pada jaringan kampus yang sama dapat menyadap (*sniff*) lalu lintas komunikasi presensi.
  2. **Replay Attack:** Penyerang dapat merekam paket MQTT tap RFID mahasiswa yang valid, lalu memancarkannya kembali (*replay*) setiap hari untuk memalsukan presensi tanpa perlu kehadiran fisik mahasiswa maupun kartu KTM.
- **Standar Kepatuhan:** Melanggar ketentuan *Spesifikasi Keamanan Zero-Trust 2026* baris 32-35 (wajib mTLS port 8883, UUIDv4 nonce, dan verifikasi tanda tangan HMAC-SHA256).
- **Rekomendasi:**
  1. Aktifkan TLS pada broker Mosquitto (Port 8883).
  2. Tambahkan verifikasi HMAC-SHA256 pada header/payload MQTT dengan secret key unik per perangkat (`device_secret`).
  3. Implementasikan cache `nonce` jangka pendek (5 detik) di Redis/memori untuk menolak paket duplikat.

---

### SEC-02 [CRITICAL]: Risiko Crash Total Deployment Produksi (Missing Alembic Migrations)
- **Lokasi:** `backend/alembic/versions/`, [main.py](../../backend/app/main.py) baris 37-38
- **Kondisi:**
  Pada implementasi P0-15, `Base.metadata.create_all(bind=engine)` dinonaktifkan jika `APP_ENV=production`. Namun, tim pengembangan sebelumnya **tidak pernah membuat berkas migrasi Alembic** untuk tabel dan kolom yang ditambahkan pada P0:
  - Tabel `krs_requests`
  - Kolom `scheduled_start_at`, `delay_minutes`, `delay_reason` pada `attendance_sessions`
  - Kolom `ip_address`, `user_agent`, `reason` pada `audit_logs`
- **Analisis Dampak:**
  Saat aplikasi dideploy ke server produksi dan menjalankan instruksi standar `alembic upgrade head`, tabel dan kolom tersebut **tidak akan pernah terbentuk**. Saat aplikasi dijalankan, seluruh request yang menyentuh tabel presensi, audit log, atau KRS akan mengalami fatal database error `relation does not exist` / `column does not exist`.
- **Rekomendasi:**
  Segera jalankan generasi migrasi resmi:
  `alembic revision --autogenerate -m "p0_core_schema_and_audit_fields"` lalu periksa berkas migrasi yang dihasilkan sebelum dirilis ke staging/production.

---

### SEC-03 [HIGH]: Kehilangan Jejak Forensik Audit Log (IP Address & User-Agent Bernilai NULL)
- **Lokasi:** [authorization_service.py](../../backend/app/services/authorization_service.py) baris 110-144, [lms.py](../../backend/app/api/v1/endpoints/lms.py), [attendance.py](../../backend/app/api/v1/endpoints/attendance.py)
- **Kondisi:**
  Fungsi `audit()` telah mendukung ekstraksi `ip_address` dan `user_agent` jika parameter `request: Request` disuplai. Namun pada implementasi aktual:
  - Di `lms.py` (penilaian nilai mahasiswa, penghapusan materi, pembuatan kuis): `audit()` dipanggil tanpa `request=request`.
  - Di `attendance.py` (koreksi manual kehadiran oleh dosen): `audit()` dipanggil tanpa `request=request`.
  - Di `workflow.py` (persetujuan izin online, penugasan ketua kelas): `audit()` dipanggil tanpa `request=request`.
- **Analisis Dampak:**
  Tabel `audit_logs` merekam aktor dan aksi, namun kolom `ip_address` dan `user_agent` tersimpan sebagai `NULL`. Jika terjadi perubahan nilai ilegal atau koreksi presensi yang mencurigakan, tim investigasi forensik kampus tidak dapat melacak alamat IP asal atau perangkat yang digunakan pelaku.
- **Rekomendasi:**
  Perbarui semua endpoint mutasi data untuk menginjeksi `request: Request` dari FastAPI dan menyuplaikannya ke panggilan `audit(...)`.

---

### SEC-04 [HIGH]: Celah Integritas Presensi (Status Downgrade via Double-Tap)
- **Lokasi:** [attendance_repo.py](../../backend/app/repositories/attendance_repo.py) baris 181-188, [attendance_service.py](../../backend/app/services/attendance_service.py) baris 252-272
- **Kondisi:**
  Pada saat mahasiswa men-tap kartu RFID, method `upsert_record` menimpa record yang sudah ada:
  ```python
  if record:
      record.status = status
      record.check_in_time = check_in_time
  ```
  Jika mahasiswa A hadir tepat waktu pada pukul 08:05 (`status = HADIR`), kemudian secara tidak sengaja atau sengaja men-tap kembali kartunya pada pukul 08:35 (melewati batas toleransi keterlambatan 15 menit), sistem akan menghitung ulang statusnya menjadi `TERLAMBAT` dan mengganti waktu kehadiran menjadi 08:35.
- **Analisis Dampak:**
  Hak mahasiswa yang sudah sah berstatus `HADIR` dapat hilang atau ter-downgrade secara tidak adil hanya karena melakukan tap kedua.
- **Rekomendasi:**
  Tambahkan guard pada `record_attendance_by_rfid_and_fingerprint` atau `upsert_record`:
  ```python
  if record and record.status in (AttendanceStatus.HADIR, AttendanceStatus.TERLAMBAT):
      # Mahasiswa sudah tercatat hadir; abaikan tap susulan dan kembalikan status saat ini
      return record
  ```

---

### SEC-05 [MEDIUM]: Paparan UID RFID Lengkap pada Respon API Publik / Mahasiswa
- **Lokasi:** `backend/app/schemas/user.py`, `backend/app/api/v1/endpoints/students.py`
- **Kondisi:**
  Skema `StudentProfileResponse` mengekspos field `rfid_uid` secara utuh (misal: `"A1B2C3D4"`).
  Berdasarkan aturan privasi pada [AGENTS.md](../../.agents/AGENTS.md) ("Mahasiswa: tidak menampilkan UID RFID secara penuh jika tidak diperlukan"), UID RFID adalah kredensial fisik yang setara dengan token autentikasi.
- **Analisis Dampak:**
  Jika UID RFID terekspos ke sisi client browser mahasiswa, pihak yang tidak berwenang dapat membaca UID tersebut dan mengkloning kartu menggunakan alat seperti Proxmark atau RFID writer murah (Mifare Classic 1K).
- **Rekomendasi:**
  Masking UID RFID pada tampilan publik/mahasiswa (contoh: `A1****D4`), dan hanya izinkan administrator melihat UID utuh untuk keperluan pendaftaran kartu baru.

---

### SEC-06 [MEDIUM]: Kerentanan Brute-Force pada Endpoint Login
- **Lokasi:** [auth.py](../../backend/app/api/v1/endpoints/auth.py) `POST /auth/login`
- **Kondisi:**
  Tidak ada implementasi rate-limiting (misal via `slowapi` atau Redis token bucket) pada endpoint otentikasi.
- **Analisis Dampak:**
  Penyerang dapat melancarkan serangan credential stuffing atau dictionary attack terhadap akun dosen atau mahasiswa.
- **Rekomendasi:**
  Terapkan rate limit ketat pada `POST /auth/login` (maksimal 5 percobaan gagal per menit per IP).

---

## 3. Matriks Kepatuhan OWASP Top 10:2021

| Kategori OWASP | Status Kepatuhan | Evaluasi Teknis |
|---|---|---|
| **A01: Broken Access Control** | 🟡 ACCEPTABLE WITH FINDINGS | Scope check dosen, mahasiswa, dan kaprodi telah diimplementasikan dengan pengembalian `404 Not Found` per BR-ROLE-008. Namun approval KRS membypass kapasitas kelas. |
| **A02: Cryptographic Failures** | 🔴 NEEDS ATTENTION | Password disimpan menggunakan bcrypt (`passlib`). Namun komunikasi MQTT menggunakan plaintext tanpa TLS. |
| **A03: Injection** | 🟢 COMPLIANT | 100% query database menggunakan SQLAlchemy 2.0 ORM / parameterized statements. Tidak ditemukan string concatenation raw SQL. |
| **A04: Insecure Design** | 🟡 ACCEPTABLE WITH FINDINGS | Alur approval sesi pengganti berjenjang (Ketua Kelas -> Dosen/Admin) telah dirancang dengan baik, namun logika double-tap presensi belum diisolasi dari status downgrade. |
| **A05: Security Misconfiguration** | 🟡 ACCEPTABLE WITH FINDINGS | CORS origins terkonfigurasi di `.env`. Perlu dipastikan `APP_DEBUG=false` saat masuk produksi. |
| **A06: Vulnerable Components** | 🟢 COMPLIANT | Dependensi FastAPI, Pydantic v2, dan SQLAlchemy 2.0 menggunakan versi stabil modern. |
| **A07: Identification & Auth** | 🟢 COMPLIANT | JWT Access Token (HS256) berumur 60 menit dengan Refresh Token rotatif. Password hash terverifikasi aman. |
| **A08: Software & Data Integrity** | 🔴 NEEDS ATTENTION | MQTT payload tidak memiliki digital signature (HMAC); berkas migrasi Alembic P0 belum dibuat. |
| **A09: Security Logging & Monitoring** | 🟡 ACCEPTABLE WITH FINDINGS | Tabel `audit_logs` append-only tersedia, namun sebagian besar mutasi data kehilangan metadata IP Address & User-Agent. |
| **A10: Server-Side Request Forgery** | 🟢 NOT APPLICABLE | Backend tidak melakukan outbound HTTP request ke URL dari input pengguna pada fase P0. |

---

## 4. Kesimpulan Keamanan

Arsitektur otorisasi inti (RBAC) pada backend telah mengalami peningkatan signifikan dengan isolasi scope Dosen dan Mahasiswa yang mencegah celah IDOR. Namun demikian, sistem **belum memenuhi kualifikasi enterprise production-ready** sebelum celah komunikasi IoT tanpa enkripsi (SEC-01), hilangnya berkas migrasi resmi (SEC-02), dan kelengkapan jejak forensik audit log (SEC-03) diperbaiki.
