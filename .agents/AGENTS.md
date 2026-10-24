# AGENTS.md

## Konteks proyek

SADITA adalah sistem nyata, bukan prototype atau dashboard demo. Target utamanya adalah:

SADITA = Sistem Absensi Digital Terintegrasi Akademik & LMS

Alur utama:

Administrasi akademik → KRS → Kelas → Presensi → LMS → Tugas → Nilai → Analisis

Hardware ESP32-S3 hanya berperan sebagai alat autentikasi presensi. Hardware bukan produk utama, bukan dashboard utama, dan bukan halaman yang harus dibuat dulu sebelum backend dan domain sistem selesai.

## Prinsip utama

- Fokus pada sistem nyata dan operasional.
- Database PostgreSQL adalah sumber kebenaran utama.
- FastAPI adalah backend utama.
- MQTT Mosquitto adalah komunikasi backend ↔ ESP32-S3.
- Semua fitur harus didukung oleh data, role, dan alur bisnis yang masuk akal.
- Jangan membuat dashboard generik, monitoring kosong, atau halaman showcase yang tidak merepresentasikan domain SADITA.
- Jangan membangun UI demo/simulasi yang tidak mencerminkan user flow dunia nyata.

## Role utama

### ADMIN
Pengelola sistem dan data akademik.

Menu utama:
- Dashboard
- Akademik
  - Program Studi
  - Tahun Akademik
  - Kelas
  - Mata Kuliah
  - Dosen
  - Mahasiswa
- KRS & Enrollment
- Perangkat SADITA
- Presensi
- LMS
- Approval
- Pengguna & Hak Akses
- Audit Log
- Pengaturan

### DOSEN
Mengelola kelas, materi, tugas, presensi, dan nilai.

Menu utama:
- Dashboard
- Kelas Saya
- Presensi
- Materi
- Tugas
- Nilai
- Laporan
- Profil

### MAHASISWA
Portal mahasiswa untuk jadwal, presensi, materi, tugas, nilai, dan kartu identitas.

Menu utama:
- Dashboard
- Jadwal
- Presensi
- Kelas Saya
- Materi
- Tugas
- Nilai
- Kartu SADITA
- Profil

### KETUA KELAS
Bukan role baru. Ini adalah akun mahasiswa dengan privilege tambahan pada kelas tertentu.

Tambahan menu pada portal mahasiswa:
- Ketua Kelas
  - Anggota Kelas
  - Monitoring Presensi
  - Verifikasi Sesi Pengganti

## Aturan RBAC

- RBAC harus dipakai, bukan hanya role check sederhana.
- Admin bisa punya permission tertentu untuk approval, kontrol kelas, dan audit.
- Authorized staff bukan harus akun baru, tapi permission yang bisa ditambahkan ke akun admin atau user tertentu.
- Ketua kelas tidak boleh langsung mengubah status presensi secara bebas.
- Ketua kelas hanya memverifikasi kejadian/pelaksanaan sesi pengganti, bukan mengubah data secara arbitrer.

## Arsitektur domain

### 1. Akademik
- Program Studi
- Tahun Akademik
- Mata Kuliah
- Kelas
- Dosen
- Mahasiswa
- KRS / Enrollment

### 2. Presensi
- Sesi pertemuan
- Status hadir, terlambat, izin, sakit, alpha
- Metode: RFID, fingerprint, online, manual
- Validasi KRS dan kelas
- Data harus bisa dibuka oleh dosen, admin, dan ketua kelas sesuai hak akses

### 3. Hardware / Device
- ESP32-S3
- RFID RC522
- Fingerprint
- RTC
- LCD
- LED dan buzzer
- MQTT broker
- Device status online/offline
- Device assignment ke ruang atau kelas

### 4. LMS
- Materi per kelas / pertemuan
- Tugas per kelas / pertemuan
- Submission mahasiswa
- Nilai tugas
- Feedback
- Komponen LMS harus terikat ke kelas, bukan berdiri sendiri

## Struktur halaman final

### ADMIN
- Dashboard
- Program Studi
- Tahun Akademik
- Mahasiswa
- Dosen
- Mata Kuliah
- Kelas
- KRS / Enrollment
- Perangkat SADITA
- Presensi
- Approval
- LMS
- Pengguna & Hak Akses
- Audit Log
- Pengaturan

### DOSEN
- Dashboard
- Kelas Saya
- Presensi
- Materi
- Tugas
- Nilai
- Laporan
- Profil

### MAHASISWA
- Dashboard
- Jadwal
- Presensi
- Kelas Saya
- Materi
- Tugas
- Nilai
- Kartu SADITA
- Profil

### KETUA KELAS
- Semua menu mahasiswa
- Ketua Kelas
  - Anggota Kelas
  - Monitoring Presensi
  - Verifikasi Sesi Pengganti

## Halaman inti yang harus dibangun

### 1. Login
- Login dengan username/NIM/email dan password
- JWT/session auth
- Redirect sesuai role
- Logout
- Jangan membuat landing page yang tidak diperlukan

### 2. Admin — Dashboard
Menampilkan data operasional yang berguna:
- total mahasiswa
- total dosen
- total kelas
- total mata kuliah
- presensi hari ini
- kebutuhan perhatian
- approval pending
- device offline
- aktivitas terbaru

### 3. Admin — Mahasiswa
Data utama:
- NIM
- Nama
- Prodi
- Angkatan
- Status mahasiswa
- Email
- HP
- Status KTM
- UID RFID
- Fingerprint slot
- Kelas

Status KTM harus memakai enum yang jelas:
- BELUM_MEMILIKI_KTM
- KTM_TERDAFTAR
- KTM_TIDAK_DIBAWA
- KTM_HILANG

### 4. Admin — Kelas
Kelas harus mendukung:
- Prodi
- Tahun Akademik
- Mata Kuliah
- Dosen
- Mode kuliah
  - REGULER PAGI
  - REGULER MALAM
  - SHIFT

Harus bisa menangani:
- kelas pagi dan malam dengan dosen berbeda
- mahasiswa tertentu masuk ke sesi tertentu
- satu mata kuliah tidak otomatis dipahami sebagai satu dosen/satu sesi saja

### 5. Admin — KRS / Enrollment
Menentukan siapa yang ditugaskan resmi ke kelas.
- tambah enrollment
- hapus enrollment
- import KRS
- validasi
- status

### 6. Admin — Perangkat SADITA
- device ID
- nama device
- IP address
- status online/offline
- last seen
- firmware version
- sensor status
- MQTT status
- assignment ke ruangan/kelas

### 7. Dosen — Presensi
- buka sesi
- live attendance
- koreksi manual dengan alasan
- status presensi
- validasi dengan device
- riwayat pertemuan

### 8. Mahasiswa — Presensi dan Kartu SADITA
- histori presensi
- persentase kehadiran
- status kartu
- fingerprint dan RFID status
- tidak menampilkan UID RFID secara penuh jika tidak diperlukan

### 9. Ketua Kelas — Verifikasi Pengganti
- melihat pengajuan presensi pengganti
- memverifikasi bahwa pelaksanaan benar-benar terjadi
- bukan mengubah data presensi sesuka hati
- data lalu masuk ke admin / authorized staff approval

## Flow absensi real end-to-end

1. Mahasiswa datang
2. Tap KTM via RFID
3. Backend menerima UID dari MQTT
4. Backend mencari mahasiswa berdasarkan RFID
5. Backend validasi KRS / kelas / sesi aktif
6. Backend meminta fingerprint jika valid
7. Backend mencocokkan fingerprint
8. Backend simpan presensi
9. Backend kirim status ke device
10. Dosen melihat live attendance
11. Ketua kelas memverifikasi jika diperlukan
12. Admin/authorized staff approve jika pengganti/incremental case

## Flow offline / pengganti

- Dosen atau admin membuat sesi pengganti
- Mahasiswa menerima notifikasi
- Mahasiswa membuka SADITA dan melakukan kehadiran online
- Ketua kelas verifikasi
- Admin / Authorized Staff approve
- Data presensi disimpan ke database

## Flow LMS

LMS harus terkait dengan kelas dan pertemuan:
- Program Studi
- Mata Kuliah
- Kelas
- Pertemuan
  - Presensi
  - Materi
  - Tugas

## Urutan pembangunan yang benar

### PHASE 1 — DATABASE
- Mahasiswa
- Dosen
- Prodi
- Mata Kuliah
- Kelas
- KRS
- Device
- RFID
- Fingerprint
- Sesi
- Presensi

### PHASE 2 — AUTHENTICATION
- Login
- RBAC
- Admin
- Dosen
- Mahasiswa
- Ketua Kelas

### PHASE 3 — HARDWARE
- ESP32-S3
- RC522
- Fingerprint
- RTC
- LCD
- LED
- Buzzer
- MQTT

### PHASE 4 — ABSENSI END-TO-END
- RFID
- Fingerprint
- Validasi backend
- Validasi KRS
- Validasi sesi
- Database

### PHASE 5 — DOSEN
- Buka sesi
- Live attendance
- Koreksi
- Laporan

### PHASE 6 — MAHASISWA
- Presensi
- Jadwal
- Materi
- Tugas
- Nilai

### PHASE 7 — LMS

### PHASE 8 — OFFLINE / PENGGANTI
- Ketua kelas
- Admin approval

### PHASE 9 — WHATSAPP NOTIFICATION
Hanya sebagai notification channel, bukan sumber data.

### PHASE 10 — UI / DESIGN / POLISH
Setelah semua fungsi dan alur bisnis siap.

## Larangan jelas

- Jangan bikin dashboard generik yang tidak mencerminkan role dan domain.
- Jangan bikin halaman monitoring yang terasa seperti dashboard IoT saja.
- Jangan turunkan relevansi sistem hanya jadi tombol fake atau demo.
- Jangan menempatkan hardware sebagai “main page” dari aplikasi.
- Jangan membuat UI yang tidak mewakili alur akademik dan LMS.
- Jangan mempercepat polish UI sebelum domain, role, dan arsitektur terselesaikan.

## Ketentuan untuk Codex / AI

Saat diminta membangun fitur atau halaman, selalu jawab dengan:
1. role yang relevan
2. halaman yang sesuai
3. fungsi yang jelas
4. data/domain yang dibutuhkan
5. alur bisnis end-to-end
6. prioritas pembangunan

Jika belum ada blueprint jelas, jangan menghasilkan dashboard umum. Pastikan fitur yang dibuat sesuai dengan struktur sistem SADITA yang benar.

## Output yang diharapkan

Setiap fitur yang dibuat harus memiliki:
- role pemilik fitur
- halaman target
- data yang dipakai
- aksi yang bisa dilakukan
- status / approval flow jika ada
- backend contract yang jelas

## Kesimpulan

SADITA bukan sistem absensi semata. SADITA adalah ekosistem mengelola:
- Akademik
- Kelas
- Presensi
- Hardware
- LMS
- Nilai
- Approval
- Audit

Semua itu harus dibangun dengan struktur yang jelas, bukan dashboard yang kelihatan bagus tetapi tidak mewakili sistem nyata.

---

## Ekstensi Spesifikasi Enterprise & Indeks Panduan Lengkap

> **Catatan Integritas:** Seluruh ketentuan pada baris 1 s.d. 417 di atas merupakan fondasi utama proyek SADITA.ai dan dijaga keasliannya 100%. Bagian di bawah ini memperjelas dan mengoperasionalkan standar teknis enterprise yang wajib dipatuhi oleh seluruh developer dan agen AI.

### 0. Protokol Mutlak Pengembang (Developer Onboarding & Maintenance Protocol)
- **Wajib Membaca Seluruh Dokumentasi Sebelum Menulis Kode (Read First, Code Later)**:
  Bagi developer maupun agen AI yang belum memahami konteks dan arsitektur proyek SADITA.ai secara mendalam, **WAJIB membaca dan memahami seluruh dokumentasi `.md` secara komprehensif** sebelum memulai pekerjaan apa pun. Dilarang keras langsung menulis/mengubah kode atau membuat asumsi sendiri tanpa memahami alur domain akademik, relasi basis data, otorisasi RBAC, alur presensi IoT, dan arsitektur OOP yang telah ditetapkan.
- **Wajib Sinkronisasi Dokumentasi Setiap Perubahan Kode (Mandatory Documentation Sync)**:
  Setiap kali melakukan perubahan kode—baik itu penambahan fitur baru, perbaikan bug (*bugfix*), refactoring, pembaruan skema database, penambahan endpoint API, maupun perubahan antarmuka UI/UX—developer **WAJIB memperbarui berkas dokumentasi `.md` yang relevan**. Dokumentasi SADITA.ai adalah dokumen hidup (*living documentation*). Mengubah kode tanpa memperbarui dokumen `.md` adalah pelanggaran standar rekayasa enterprise yang akan merugikan pemeliharaan sistem di masa mendatang.

### 1. Prinsip Berorientasi Objek (OOP) & Struktur Direktori Bersih
- **Backend (FastAPI + SQLAlchemy 2.0 + Pydantic v2)**: Wajib menerapkan *4-Tier Clean Architecture* (Router → Service → Repository → Model). Dilarang menulis query database langsung di dalam Router. Akses data dienkapsulasi menggunakan pola `BaseRepository[ModelType, CreateSchemaType, UpdateSchemaType]`.
- **Frontend (Next.js 16 + React 19 + TypeScript)**: Seluruh komunikasi API dibungkus dalam kelas `BaseApiService` berorientasi objek yang menangani token JWT, interseptor error, dan serialisasi tipe.
- **Standar Struktur File**: Penamaan direktori dan file wajib konsisten (`kebab-case` untuk frontend, `snake_case` untuk backend Python, `PascalCase` untuk kelas/komponen).
- 📖 *Panduan Lengkap:* [OOP_ARCHITECTURE_AND_FOLDER_STRUCTURE.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/sadita/OOP_ARCHITECTURE_AND_FOLDER_STRUCTURE.md)

### 2. Standar Rekayasa Reusable & Prinsip DRY (Don't Repeat Yourself)
- **Kontrak Respon Terpadu**: Semua endpoint wajib mengembalikan envelope `ApiResponse[T]` dengan metadata paginasi otomatis (`page`, `limit`, `total_records`, `total_pages`).
- **Komponen UI Universal**: Penggunaan tabel serbaguna `DataTable<T>`, sistem modal terpusat `Modal`, dan kartu statistik `StatCard` untuk mengeliminasi duplikasi kode pada seluruh dashboard peran (Admin, Dosen, Mahasiswa, Kaprodi).
- **Custom Hooks**: Reusable hooks `useTableData`, `useAuth`, dan `useResponsive` untuk menyatukan manajemen state dan data fetching.
- 📖 *Panduan Lengkap:* [REUSABLE_ENGINEERING_AND_DRY_STANDARDS.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/sadita/REUSABLE_ENGINEERING_AND_DRY_STANDARDS.md)

### 3. Spesifikasi Keamanan Zero-Trust & Perlindungan Siber 2026
- **Prinsip "Never Trust, Always Verify"**: Otorisasi diverifikasi di tingkat service dan repository (ABAC/RBAC). Dilarang mengandalkan validasi sisi client.
- **Mitigasi OWASP Top 10 Menyeluruh**:
  - *Anti-Injection*: 100% Parameterized queries via SQLAlchemy 2.0; tidak ada string formatting mentah.
  - *Anti-IDOR*: Verifikasi kepemilikan objek (mahasiswa hanya dapat mengakses tugas/presensi miliknya sendiri).
  - *Hardened Auth*: JWT Access Token berumur 15 menit + Refresh Token Rotation (RTR) dengan cookie HTTP-Only SameSite=Strict serta deteksi penggunaan ulang token (automatic revocation).
  - *Security Headers*: HSTS 2 tahun, CSP ketat, X-Frame-Options: DENY, X-Content-Type-Options: nosniff.
- **Keamanan Khusus IoT & ESP32-S3**:
  - Jalur MQTT terenkripsi TLS (Port 8883) dengan mTLS sertifikat unik per perangkat.
  - Perlindungan Anti-Replay Attack menggunakan kombinasi `nonce` UUIDv4 di Redis, jendela waktu maksimal 5 detik, dan verifikasi tanda tangan HMAC-SHA256 pada setiap tap RFID.
- **Audit Logging Imutabel**: Tabel `audit_logs` bersifat append-only, merekam IP, User Agent, aksi, serta snapshot sebelum dan sesudah perubahan data.
- 📖 *Panduan Lengkap:* [ZERO_TRUST_SECURITY_SPECIFICATION.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/sadita/ZERO_TRUST_SECURITY_SPECIFICATION.md)

### 4. Standar Desain Human-Crafted & Anti-AI Slop
- **Penolakan Mutlak AI Slop**: Dilarang menggunakan gelembung gradien neon ungu-cyan, glassmorphism buram berlebihan, ilustrasi robot 3D plastik tanpa fungsi, kartu statistik palsu, dan animasi lambat yang memantul.
- **Estetika Institusional UNIPI**: Menampilkan kredibilitas enterprise dengan palet Slate 50-900, aksen hijau zamrud UNIPI (`#059669`), dan biru safir akademik (`#1d4ed8`).
- **Kepadatan Data Tinggi (Data Density)**: Tabel operasional yang kompak (baris 44-48px), perataan kolom angka monospace, dan badge status presensi yang tegas (`HADIR`, `TERLAMBAT`, `IZIN`, `SAKIT`, `ALPHA`).
- 📖 *Panduan Lengkap:* [ANTI_SLOP_DESIGN_GUIDELINES.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/anti-slop/ANTI_SLOP_DESIGN_GUIDELINES.md)

### 5. Sistem Desain Responsif & Kepatuhan Penuh Apple iPhone
- **Breakpoint 6-Tingkat**: Mendukung sempurna layar dari iPhone SE (320px) hingga layar UltraWide (1536px+).
- **Dukungan Apple iPhone 100%**:
  - Akomodasi Notch dan Dynamic Island menggunakan `env(safe-area-inset-top)` dan `env(safe-area-inset-bottom)`.
  - Target sentuh minimum 44 × 44 pixel sesuai Apple Human Interface Guidelines.
  - Aturan font input minimum 16px (`1rem`) untuk mencegah auto-zoom liar pada iOS Safari.
  - Bilah navigasi bawah ergonomis (*Thumb Zone*) untuk kemudahan penggunaan satu tangan di ponsel.
- 📖 *Panduan Lengkap:* [DESIGN_SYSTEM_AND_RESPONSIVE_SPEC.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/dealtech-ui/DESIGN_SYSTEM_AND_RESPONSIVE_SPEC.md)

### 6. Optimasi Performa Enterprise & Kepatuhan SEO 100%
- **Target Kecepatan Enterprise**: TTFB < 100ms, LCP < 1.2s, INP < 50ms, dan CLS < 0.05 dengan skor Core Web Vitals 95-100 di Google Lighthouse.
- **100% SEO & Google Search Console Ready**:
  - Satu tag `<h1>` semantik per halaman dengan hirarki heading terstruktur (`<h2>`, `<h3>`).
  - Metadata Open Graph dan Twitter Card lengkap dengan gambar pratinjau resmi.
  - Schema.org JSON-LD structured data (`EducationalOrganization`, `Course`, `BreadcrumbList`).
  - Generator otomatis `sitemap.xml` dinamis dan `robots.txt` terkonfigurasi.
- 📖 *Panduan Lengkap:* [REUSABLE_COMPONENTS_AND_SEO_SPEC.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/dealtech-ui-for-public-component/REUSABLE_COMPONENTS_AND_SEO_SPEC.md)

### 7. Spesifikasi Domain Akademik, Presensi IoT & LMS
- **Mode Perkuliahan**: Dukungan penuh kelas Reguler Pagi, Reguler Malam, dan Shift dengan dosen atau mahasiswa lintas sesi yang tervalidasi via KRS.
- **Status KTM**: Enum ketat `BELUM_MEMILIKI_KTM`, `KTM_TERDAFTAR`, `KTM_TIDAK_DIBAWA`, dan `KTM_HILANG`.
- **Alur Presensi Sesi Pengganti**: Mahasiswa mengajukan → Ketua Kelas memverifikasi keterlaksanaan kejadian → Admin / Staff resmi memberikan persetujuan final (*approval*).
- **Grading Engine**: Kalkulasi otomatis nilai akhir berbobot (Presensi, Tugas, UTS, UAS) dengan batas kehadiran minimum 75% untuk kelayakan mengikuti UAS.
- 📖 *Panduan Lengkap:* [LMS_AND_ATTENDANCE_DOMAIN_SPEC.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/learnstack-lms/LMS_AND_ATTENDANCE_DOMAIN_SPEC.md)

---

## 8. Panduan Indeks Berkas Dokumentasi SADITA.ai

| Modul Panduan | Lokasi File | Fokus Utama |
|---|---|---|
| **Master Rules** | [AGENTS.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/AGENTS.md) | Aturan operasional dasar, peran, dan hirarki sistem |
| **Arsitektur OOP & Struktur Direktori** | [OOP_ARCHITECTURE_AND_FOLDER_STRUCTURE.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/sadita/OOP_ARCHITECTURE_AND_FOLDER_STRUCTURE.md) | Pola SOLID, Clean Architecture 4-Tier, dan struktur direktori |
| **Rekayasa Reusable & DRY** | [REUSABLE_ENGINEERING_AND_DRY_STANDARDS.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/sadita/REUSABLE_ENGINEERING_AND_DRY_STANDARDS.md) | Standard envelope API, universal data table, modal, dan hooks |
| **Keamanan Siber Zero-Trust** | [ZERO_TRUST_SECURITY_SPECIFICATION.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/sadita/ZERO_TRUST_SECURITY_SPECIFICATION.md) | OWASP Top 10, anti-replay MQTT/RFID, mTLS, dan JWT rotation |
| **Desain Anti-AI Slop** | [ANTI_SLOP_DESIGN_GUIDELINES.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/anti-slop/ANTI_SLOP_DESIGN_GUIDELINES.md) | Penolakan slop, palet warna UNIPI, dan kepadatan data enterprise |
| **Desain Responsif & iPhone** | [DESIGN_SYSTEM_AND_RESPONSIVE_SPEC.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/dealtech-ui/DESIGN_SYSTEM_AND_RESPONSIVE_SPEC.md) | Breakpoint, safe area Dynamic Island, touch target 44px, iOS |
| **Reusable UI & SEO 100%** | [REUSABLE_COMPONENTS_AND_SEO_SPEC.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/dealtech-ui-for-public-component/REUSABLE_COMPONENTS_AND_SEO_SPEC.md) | Core Web Vitals, JSON-LD, sitemap, robots, dan atomic UI |
| **Domain LMS & Presensi IoT** | [LMS_AND_ATTENDANCE_DOMAIN_SPEC.md](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/learnstack-lms/LMS_AND_ATTENDANCE_DOMAIN_SPEC.md) | Alur presensi IoT, verifikasi sesi pengganti, dan grading engine |
| **Buku Panduan Developer** | [ENTERPRISE_DEVELOPER_GUIDE.md](file:///home/whoami/Documents/Projects/Sadita.ai/docs/ENTERPRISE_DEVELOPER_GUIDE.md) | Panduan instalasi lokal, testing suite, dan deployment produksi |
