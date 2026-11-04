# SPESIFIKASI LENGKAP SISTEM, ARSITEKTUR DOMAIN, DAN INVENTARIS FITUR HALAMAN SADITA.AI
## Sistem Absensi Digital Terintegrasi Akademik & Learning Management System (LMS)

> **Dokumen Resmi:** Spesifikasi Lengkap Sistem SADITA.ai  
> **Target Implementasi:** Program Studi Teknologi Informasi, Universitas Insan Pembangunan Indonesia (UNIPI)  
> **Status Dokumen:** Living Specification (Fase Desain, Basis Data, Operasional, & Antarmuka)  
> **Rantai Nilai Inti:** Administrasi Akademik → KRS → Kelas → Presensi IoT (ESP32-S3) → LMS → Evaluasi Tugas & Kuis → Nilai Terpadu → SI KOBAR AI

---

# DAFTAR ISI

- [BAGIAN 1: SPESIFIKASI SISTEM, ARSITEKTUR, DAN ATURAN BISNIS (A – M)](#bagian-1-spesifikasi-sistem-arsitektur-dan-aturan-bisnis-a--m)
  - [A. Tujuan Produk, Target Pengguna, Ruang Lingkup dan Prioritas MVP](#a-tujuan-produk-target-pengguna-ruang-lingkup-dan-prioritas-mvp)
  - [B. Struktur Akademik, Semester, Kelas, Jadwal, dan Pertemuan](#b-struktur-akademik-semester-kelas-jadwal-dan-pertemuan)
  - [C. Role, Hak Akses, Kewenangan, serta Cakupan Setiap Pengguna](#c-role-hak-akses-kewenangan-serta-cakupan-setiap-pengguna)
  - [D. KRS, Persetujuan, Enrollment, dan Perpindahan Kelas](#d-krs-persetujuan-enrollment-dan-perpindahan-kelas)
  - [E. Seluruh Aturan Bisnis Absensi dan Proses Koreksi](#e-seluruh-aturan-bisnis-absensi-dan-proses-koreksi)
  - [F. RFID, Fingerprint, MQTT, Perangkat IoT, dan Kondisi Offline](#f-rfid-fingerprint-mqtt-perangkat-iot-dan-kondisi-offline)
  - [G. Materi, Tugas, Submission, Kuis, Tenggat, dan Percobaan](#g-materi-tugas-submission-kuis-tenggat-dan-percobaan)
  - [H. Formula Nilai, Bobot, Nilai A–E, Publikasi, dan Koreksi](#h-formula-nilai-bobot-nilai-ae-publikasi-dan-koreksi)
  - [I. Dashboard, Laporan, Definisi Metrik, dan Notifikasi](#i-dashboard-laporan-definisi-metrik-dan-notifikasi)
  - [J. SI KOBAR, AI, Sumber Jawaban, Otorisasi, serta Konfirmasi Aksi](#j-si-kobar-ai-sumber-jawaban-otorisasi-serta-konfirmasi-aksi)
  - [K. Keamanan, Privasi, Audit, Retensi, dan Tata Kelola Data](#k-keamanan-privasi-audit-retensi-dan-tata-kelola-data)
  - [L. Arsitektur, Backend, Database, Integrasi, serta Deployment](#l-arsitektur-backend-database-integrasi-serta-deployment)
  - [M. Prioritas, Kriteria Penerimaan, dan Keputusan yang Masih Terbuka](#m-prioritas-kriteria-penerimaan-dan-keputusan-yang-masih-terbuka)
- [BAGIAN 2: INVENTARIS LENGKAP HALAMAN, CRUD, FORM INPUT, DAN AKSI 5 STAKEHOLDER](#bagian-2-inventaris-lengkap-halaman-crud-form-input-dan-aksi-5-stakeholder)
  - [1. STAKEHOLDER: DOSEN](#1-stakeholder-dosen)
  - [2. STAKEHOLDER: MAHASISWA](#2-stakeholder-mahasiswa)
  - [3. STAKEHOLDER: KETUA KELAS](#3-stakeholder-ketua-kelas)
  - [4. STAKEHOLDER: KETUA PROGRAM STUDI (KAPRODI)](#4-stakeholder-ketua-program-studi-kaprodi)
  - [5. STAKEHOLDER: ADMINISTRATOR (ADMIN)](#5-stakeholder-administrator-admin)
- [MATRIKS HAK AKSES DAN MATRIKS NAVIGASI ANTAR PERAN](#matriks-hak-akses-dan-matriks-navigasi-antar-peran)

---

# BAGIAN 1: SPESIFIKASI SISTEM, ARSITEKTUR, DAN ATURAN BISNIS (A – M)

---

## A. Tujuan Produk, Target Pengguna, Ruang Lingkup dan Prioritas MVP

### 1. Tujuan Produk
SADITA.ai (*Sistem Absensi Digital Terintegrasi Akademik & LMS*) adalah ekosistem terpadu (*unified ecosystem*) yang menyatukan empat pilar utama ke dalam satu alur bisnis tanpa celah:
1. **Administrasi Akademik**: Pengelolaan program studi, kurikulum, semester/tahun akademik, rombongan belajar (kelas), dan penugasan resmi mahasiswa serta dosen.
2. **Mesin Presensi IoT Fisik & Biometrik 2FA**: Autentikasi kehadiran di ruang perkuliahan menggunakan mikrokontroler ESP32-S3 (RFID RC522 + Sensor Sidik Jari Optik) berbasis protokol MQTT broker.
3. **Learning Management System (LMS)**: Distribusi bahan ajar digital, pengumpulan tugas berbatas waktu (*deadline*), dan evaluasi kuis terintegrasi konteks pertemuan (Sesi 1 s.d. 16).
4. **AI Assistant "SI KOBAR"**: Asisten interaktif berdasar metodologi *Chat → Understand → Analyze → Navigate → Assist* yang terikat ketat pada otorisasi RBAC (*Role-Based Access Control*).

### 2. Target Pengguna
- **Institusi**: Program Studi Teknologi Informasi, Universitas Insan Pembangunan Indonesia (UNIPI).
- **Pengguna Akhir (5 Stakeholder)**:
  1. *Administrator Akademik & Sistem (Admin)*: Pengelola data master, infrastruktur, akun, dan approval final.
  2. *Ketua Program Studi (Kaprodi)*: Pengawas mutu kurikulum, performa perkuliahan, dan ketercapaian akademik prodi.
  3. *Dosen Pengampu*: Pengelola aktivitas pembelajaran, sesi presensi, evaluasi tugas, kuis, dan penetapan nilai.
  4. *Mahasiswa*: Pelaku studi aktif untuk akses jadwal, presensi fisik/online, materi, submission tugas, dan KHS.
  5. *Ketua Kelas*: Mahasiswa terpilih dengan mandat khusus verifikasi keterlaksanaan sesi kuliah pengganti/daring.

### 3. Ruang Lingkup Produk
- **Dalam Lingkup (In-Scope)**:
  - Otentikasi JWT Hardened dengan Refresh Token Rotation (RTR).
  - Manajemen data master akademik (Prodi, Semester, Matkul, Kelas, Ruangan).
  - Pengisian KRS, persetujuan Penasihat Akademik (PA), dan enrollment kelas.
  - Sesi presensi fisik real-time dengan verifikasi 2-faktor (RFID + Fingerprint).
  - Alur presensi sesi pengganti / daring berjenjang: Pengajuan Mahasiswa → Verifikasi Ketua Kelas → Approval Admin.
  - Distribusi materi kuliah multi-format (`DOCUMENT`, `LINK`, `TEXT`, `VIDEO`).
  - Pengumpulan tugas berbatas waktu dengan deteksi keterlambatan detik (`LATE`).
  - Mesin kuis interaktif dengan auto-grading di backend (kunci jawaban terlindungi).
  - Kalkulasi otomatis nilai akhir (UTS 30%, UAS 35%, Tugas 15%, Presensi 10%, Keaktifan 10%) dan konversi huruf mutu (A s.d. E).
  - Audit trail imutabel pada tabel `audit_logs`.
- **Luar Lingkup (Out-of-Scope Fase Ini)**:
  - Sistem pembayaran uang kuliah (SPP/BPP), marketplace, atau integrasi payment gateway.
  - Aplikasi native iOS/Android (responsivitas diakomodasi via Mobile-First Web PWA-ready).
  - AI yang dapat menetapkan nilai akhir secara otonom tanpa verifikasi dosen pengampu.

### 4. Prioritas MVP (P0 / P1 / P2)
- **P0 (Must-Have Baseline)**:
  - Otentikasi 5 role pengguna.
  - Master data akademik dan rombel kelas perkuliahan.
  - Pembukaan sesi presensi oleh dosen.
  - Penerimaan tap RFID via MQTT dengan validasi KRS server-side.
  - Upload materi dan submission tugas mahasiswa.
  - Penilaian kuis otomatis backend.
- **P1 (Should-Have Integrated Prototype)**:
  - Verifikasi biometrik sidik jari pada ESP32-S3.
  - Alur approval sesi pengganti oleh Ketua Kelas dan Admin.
  - Grading engine otomatis dengan perhitungan bobot final.
  - SI KOBAR AI assistant berbasis tool-calling terotorisasi.
  - Audit logging seluruh perubahan data penting.
- **P2 (Nice-to-Have Expansion)**:
  - Integrasi LLM eksternal provider dengan RAG berkas silabus PDF.
  - Gateway notifikasi WhatsApp pengingat perkuliahan dan presensi.
  - Analitik performa mahasiswa dan deteksi dini risiko putus studi.

---

## B. Struktur Akademik, Semester, Kelas, Jadwal, dan Pertemuan

### 1. Hirarki Relasi Data Konseptual
```text
Program Studi (prodi_id)
 └── Tahun Akademik & Semester (AcademicTerm: Ganjil / Genap)
      └── Mata Kuliah (Course: Kode, Nama, SKS, Prasyarat)
           └── Kelas Perkuliahan (CourseClass: Rombel A, B, Malam, Shift)
                ├── Dosen Pengampu Utama & Anggota (LecturerProfile)
                ├── Mahasiswa Terdaftar (ClassEnrollment via Approved KRS)
                ├── Mandat Ketua Kelas (ClassLeaderAssignment)
                └── Pertemuan Perkuliahan (CourseLesson / AttendanceSession: Sesi 1 s.d. 16)
                     ├── Jendela Sesi Presensi Aktif (RFID/Biometrik)
                     ├── Distribusi Materi Kuliah (CourseMaterial)
                     ├── Penugasan Terstruktur (Assignment)
                     └── Evaluasi Kuis Terjadwal (Quiz)
```

### 2. Fleksibilitas Mode Perkuliahan UNIPI
Sistem mengimplementasikan Enum `ClassType` pada database PostgreSQL:
1. **REGULER_PAGI**: Perkuliahan hari kerja standar jam kerja (07:30 – 17:00 WIB).
2. **REGULER_MALAM**: Perkuliahan untuk kelas karyawan (17:30 – 22:00 WIB).
3. **SHIFT**: Mahasiswa pekerja pabrik/industri dengan jadwal kerja bergilir. Rombongan belajar kelas SHIFT memiliki fleksibilitas sesi perkuliahan pagi atau malam, dengan dosen pengampu yang dapat berbeda namun tetap terikat pada silabus mata kuliah yang sama.

### 3. Struktur Pertemuan Semesteran (Sesi 1 s.d. 16)
Setiap mata kuliah semester berjalan terbagi menjadi 16 sesi terstruktur:
- **Sesi 1 s.d. 7**: Penyampaian Fondasi Keilmuan, Materi Kuliah Bagian I, Tugas Mandiri/Kelompok.
- **Sesi 8**: Evaluasi Ujian Tengah Semester (UTS).
- **Sesi 9 s.d. 15**: Pendalaman Praktikum, Studi Kasus, Materi Lanjutan Bagian II, Tugas Proyek.
- **Sesi 16**: Evaluasi Ujian Akhir Semester (UAS).

---

## C. Role, Hak Akses, Kewenangan, serta Cakupan Setiap Pengguna

Sistem menerapkan prinsip **Least Privilege** dan kombinasi **RBAC (Role-Based Access Control)** dengan **ABAC (Attribute-Based Access Control / Resource Scoping)**:

| Peran (Role) | Lingkup Data (Scope) | Hak Akses & Kewenangan Utama | Batasan Mutlak |
|---|---|---|---|
| **ADMIN** | Sistem-Wide (Seluruh Institusi) | Mengelola master akademik, konfigurasi akun pengguna, pendaftaran perangkat ESP32, final approval sesi pengganti, pemantauan audit log, setting sistem. | Tidak boleh mengubah nilai ujian tanpa rekam audit berita acara resmi. |
| **KAPRODI** | Program Studi Naungan | Memantau kurikulum prodi, beban SKS dosen, daftar mahasiswa prodi, rekap kehadiran perkuliahan prodi, status akreditasi. | Bersifat Read-Only / Oversight; tidak mengelola perangkat IoT fisik atau konfigurasi server. |
| **DOSEN** | Kelas & Mata Kuliah yang Ditugaskan | Membuka/menutup sesi presensi, koreksi manual presensi, upload materi, membuat tugas & kuis, mengevaluasi submission, mengunci nilai akhir. | Dilarang mengakses atau memodifikasi kelas yang diampu oleh dosen lain. |
| **MAHASISWA** | Data Pribadi & Kelas Terdaftar di KRS | Mengisi KRS, melihat jadwal, melakukan presensi IoT / web, mengunduh materi, mengumpulkan tugas, mengerjakan kuis, melihat KHS, lapor kartu hilang. | Dilarang melihat submission mahasiswa lain, dilarang mengakses kunci jawaban kuis. |
| **KETUA KELAS** | Kelas Tertentu Sesuai Mandat | Memiliki semua hak mahasiswa + **Melihat rekap presensi rekan sekelas** dan **Memverifikasi keterlaksanaan kuliah sesi pengganti**. | **Dilarang keras mengubah status presensi mahasiswa secara bebas**. Mandat hanya verifikasi saksi kejadian. |

---

## D. KRS, Persetujuan, Enrollment, dan Perpindahan Kelas

### 1. Siklus Rencana Studi (KRS)
1. **Pengisian KRS**: Mahasiswa memilih mata kuliah dan kelas yang ditawarkan pada semester aktif sesuai kuota SKS (berdasarkan IPK semester sebelumnya: maksimal 24 SKS).
2. **Status Pengajuan KRS (`KrsRequestStatus`)**:
   - `PENDING_APPROVAL`: Pengajuan baru masuk antrean Dosen Penasihat Akademik (PA) / Kaprodi.
   - `APPROVED`: Disetujui Dosen PA; mahasiswa otomatis terdaftar pada `ClassEnrollment` dengan status `AKTIF`.
   - `REJECTED`: Ditolak (misal: SKS melebihi jatah atau jadwal bentrok); mahasiswa wajib merevisi rencana studi.
   - `CANCELLED`: Dibatalkan sendiri oleh mahasiswa sebelum masa penutupan KRS.

### 2. Tipe Pendaftaran Kelas (`EnrollmentType`)
- `REGULER`: Pengambilan paket mata kuliah sesuai semester berjalan mahasiswa.
- `TAMBAH_SKS`: Pengambilan mata kuliah akselerasi semester atas bagi mahasiswa berprestasi (IPK $\ge 3.00$).
- `MENGULANG`: Pengambilan kembali mata kuliah untuk perbaikan nilai (grade C, D, atau E).

### 3. Perpindahan Rombongan Belajar (Kelas)
- Mahasiswa hanya diizinkan mengajukan perpindahan kelas (misal dari Reguler Pagi ke Shift) pada masa revisi KRS (maksimal Minggu ke-2 perkuliahan).
- Syarat mutlak: Kuota kelas sasaran masih tersedia dan memperoleh rekomendasi Kaprodi. Backend mengubah referensi `class_id` dan mencatat mutasi pada `audit_logs`.

---

## E. Seluruh Aturan Bisnis Absensi dan Proses Koreksi

### 1. Status Kehadiran (`AttendanceStatus`)
- **`HADIR`**: Tap kartu RFID atau verifikasi biometrik berhasil dilakukan tepat waktu (rentang 0 s.d. toleransi $T$ menit, default: 15 menit dari jam mulai sesi).
- **`TERLAMBAT`**: Verifikasi berhasil, namun waktu tap berada pada interval $> T$ menit hingga sesi ditutup.
- **`IZIN`**: Mahasiswa tidak hadir dengan melampirkan permohonan tertulis resmi (surat tugas instansi, keperluan mendesak keluarga) yang disetujui dosen.
- **`SAKIT`**: Mahasiswa tidak hadir disertai surat keterangan dokter resmi yang diunggah ke sistem.
- **`ALFA`**: Mahasiswa tidak melakukan presensi tanpa keterangan sah hingga batas akhir penutupan sesi.

### 2. Aturan Pembukaan dan Penutupan Sesi Presensi
- Sesi presensi hanya dapat dibuka (`OPEN`) oleh dosen pada hari perkuliahan yang terjadwal atau saat sesi kuliah pengganti resmi diselenggarakan.
- Saat sesi ditutup (`CLOSED`), mesin IoT ESP32 menolak semua transaksi tap kartu untuk sesi tersebut. Sisa mahasiswa yang belum tap otomatis berstatus `ALFA`.

### 3. Logika Koreksi Manual oleh Dosen (Dispute Resolution)
Dosen pengampu berwenang melakukan koreksi status presensi mahasiswa di kelas (misal: kartu tertinggal di rumah atau sensor biometrik kotor):
- Dosen wajib mengisi formulir **Alasan Koreksi (Berita Acara)**, misalnya: *"Mahasiswa KTM_TIDAK_DIBAWA, diverifikasi secara fisik di meja dosen"*.
- Metode kehadiran dicatat sebagai `MANUAL_DOSEN`.
- Riwayat perubahan tersimpan permanen pada `audit_logs` (mencatat aktor, status sebelum, status sesudah, dan stempel waktu).

### 4. Ambang Batas Kehadiran Minimum 75%
$$\text{Persentase Kehadiran} = \frac{\sum (\text{HADIR} + \text{TERLAMBAT})}{\text{Total Pertemuan Terlaksana}} \times 100\%$$
Jika pada akhir pertemuan ke-15 persentase kehadiran $< 75\%$, sistem secara otomatis menerbitkan status **`CEKAL_UAS`**. Mahasiswa tidak berhak mengikuti UAS dan nilai akhir otomatis terkunci pada batas maksimal grade D/E.

---

## F. RFID, Fingerprint, MQTT, Perangkat IoT, dan Kondisi Offline

### 1. Struktur Topik MQTT Mosquitto
- `sadita/device/{deviceId}/status`: Heartbeat status perangkat (online/offline, IP, firmware version, heap memory).
- `sadita/device/{deviceId}/attendance/tap`: Pengiriman payload hasil pembacaan kartu RFID mahasiswa.
- `sadita/device/{deviceId}/attendance/fingerprint`: Konfirmasi pencocokan biometrik sidik jari.
- `sadita/device/{deviceId}/command`: Perintah dari server ke perangkat (misal: buka prompt sidik jari, kendalikan relay).
- `sadita/device/{deviceId}/feedback`: Umpan balik tampilan LCD 20x4 dan pola bunyi buzzer.

### 2. Alur Transaksi Presensi Fisik 2-Faktor (2FA) Real-Time
1. **Tap Kartu RFID**: Mahasiswa menempelkan kartu KTM pada sensor RC522. ESP32 membaca UID dan mem-publish payload JSON terenkripsi HMAC-SHA256 ke broker MQTT.
2. **Validasi Server (Anti-Replay & Authorization)**:
   - Backend memverifikasi `nonce` dan timestamp ($\le 5$ detik).
   - Backend mencari profil mahasiswa via `RfidCredential`.
   - Backend memverifikasi penugasan ruangan perangkat (`device_assignment`) terhadap jadwal sesi kelas aktif.
   - Backend memastikan mahasiswa terdaftar dalam KRS kelas tersebut.
3. **Trigger Biometrik**: Jika kartu valid, server membalas via MQTT memerintahkan ESP32: `COMMAND: PROMPT_FINGERPRINT`. Layar LCD menampilkan: *"Halo [Nama], Silakan Tempelkan Jari"*.
4. **Pencocokan Sidik Jari**: Mahasiswa menempelkan jari pada sensor optik. Sensor mencocokkan template lokal (Slot ID yang terdaftar pada profil mahasiswa). ESP32 mengirim konfirmasi match ke server.
5. **Konfirmasi Final**: Backend mencatat status kehadiran (`HADIR` atau `TERLAMBAT`), membunyikan nada buzzer sukses 2 bip pendek, dan mengirim sinyal SSE/WebSocket ke layar monitor dosen.

### 3. Penanganan Status Kepemilikan KTM (`KtmStatus`)
- `BELUM_MEMILIKI_KTM`: Mahasiswa baru dapat menggunakan metode presensi `FINGERPRINT_ONLY` di mesin hingga kartu fisik dicetak.
- `KTM_TERDAFTAR`: Alur standar autentikasi 2FA (RFID + Sidik Jari).
- `KTM_TIDAK_DIBAWA`: Mahasiswa melapor kepada dosen di kelas untuk dicatat manual (`MANUAL_DOSEN`).
- `KTM_HILANG`: UID lama otomatis dinonaktifkan di sistem. Jika kartu lama ditempelkan, mesin membunyikan alarm buzzer panjang dan menolak transaksi dengan log `RFID_REVOKED`.

### 4. Penanganan Kondisi Jaringan Terputus (Offline Resilience)
Jika koneksi internet kampus atau broker MQTT terputus:
- ESP32-S3 menyimpan catatan tap sementara di memori non-volatile (Flash SPIFFS / EEPROM ring-buffer) hingga kapasitas 500 transaksi lokal, dilengkapi stempel waktu Real-Time Clock (RTC DS3231).
- Saat koneksi online pulih (*reconnected*), ESP32 melakukan flush sinkronisasi batch ke topik `sadita/device/{deviceId}/sync`.
- Backend memproses batch secara idempotent (mencegah duplikasi data) dan mencatat flag `SYNCED_OFFLINE`.

---

## G. Materi, Tugas, Submission, Kuis, Tenggat, dan Percobaan

### 1. Distribusi Materi Kuliah (`CourseMaterial`)
Materi terikat pada rombongan belajar kelas dan sesi pertemuan (`lesson_id`). Tipe materi yang didukung:
- `DOCUMENT`: Berkas slide presentasi, diktat, modul praktikum (PDF/DOCX/PPTX, maksimal 10 MB, divalidasi MIME Magic Bytes).
- `LINK`: URL eksternal ke repositori GitHub, dokumentasi API, atau referensi jurnal terakreditasi.
- `TEXT`: Catatan ringkasan perkuliahan atau sintaks kode terformat Markdown.
- `VIDEO`: Tautan embed video pembelajaran (YouTube/Vimeo/Google Drive).

### 2. Pengelolaan Tugas & Submission Berkas
- Dosen menetapkan: Judul, Petunjuk Teknis, Berkas Lampiran Soal, Batas Waktu (*Due Date*), dan Skor Maksimal (0–100).
- Mahasiswa mengunggah submission berupa berkas (PDF/ZIP) dan catatan penjelasan.
- **Validasi Keterlambatan**:
  - Dikumpulkan sebelum batas waktu $\rightarrow$ `SUBMITTED`.
  - Dikumpulkan melewati batas waktu $\rightarrow$ Diberi label mencolok `LATE` (Terlambat) disertai pencatatan selisih waktu (jam/menit) dan pemotongan penalti nilai otomatis sesuai kebijakan dosen.

### 3. Mesin Kuis Interaktif (Quiz Engine)
- **Tipe Butir Soal (`QuizQuestionType`)**:
  - `SINGLE_CHOICE`: Pilihan ganda dengan 1 jawaban benar.
  - `MULTIPLE_CHOICE`: Pilihan ganda dengan beberapa jawaban benar.
  - `TEXT`: Isian singkat / esai analitis.
- **Proteksi Integritas Nilai**: Kunci jawaban (`is_correct`) disimpan aman di database dan **dilarang keras dikirim ke browser mahasiswa**.
- **Batas Percobaan (*Max Attempts*) & Durasi**:
  - Setiap pengerjaan dicatat dalam `QuizSubmission`.
  - Jika `attempt_number >= max_attempts`, tombol pengerjaan terkunci permanen.
  - Timer kuis divalidasi ganda: hitung mundur antarmuka browser dan verifikasi stempel waktu server saat payload jawaban diterima.

---

## H. Formula Nilai, Bobot, Nilai A–E, Publikasi, dan Koreksi

### 1. Pembobotan Nilai Standar SADITA.ai
Nilai akhir mahasiswa dikalkulasi secara otomatis oleh backend menggunakan formula resmi:

$$\text{Nilai Akhir} = (0.30 \times \text{UTS}) + (0.35 \times \text{UAS}) + (0.15 \times \text{Tugas}) + (0.10 \times \text{Presensi}) + (0.10 \times \text{Keaktifan})$$

- $\text{UTS}$ ($30\%$): Ujian Tengah Semester.
- $\text{UAS}$ ($35\%$): Ujian Akhir Semester.
- $\text{Tugas}$ ($15\%$): Rata-rata seluruh penugasan dan kuis LMS.
- $\text{Presensi}$ ($10\%$): Persentase kehadiran perkuliahan ($100 \times \frac{\text{Hadir}}{\text{Pertemuan}}$).
- $\text{Keaktifan}$ ($10\%$): Partisipasi diskusi kelas dan keaktifan mahasiswa.

### 2. Skala Konversi Nilai Huruf & Bobot Indeks Prestasi (IP)
| Rentang Skor Akhir | Huruf Mutu | Bobot Angka (IP) | Kategori Predikat Akademik |
|---|---|---|---|
| $\ge 85.0$ | **A** | 4.00 | Sangat Memuaskan / Istimewa |
| $75.0 - 84.9$ | **B** | 3.00 | Memuaskan / Baik |
| $65.0 - 74.9$ | **C** | 2.00 | Cukup |
| $55.0 - 64.9$ | **D** | 1.00 | Kurang (Batas Bawah Kelulusan) |
| $< 55.0$ | **E** | 0.00 | Gagal / Tidak Lulus (Wajib Mengulang) |

### 3. Prosedur Publikasi & Penguncian Nilai (*Grade Lock*)
1. Dosen memasukkan nilai komponen secara bertahap pada halaman penilaian.
2. Dosen menekan tombol **"Hitung Nilai Akhir Otomatis"**. Sistem menghitung skor akhir dan menentukan huruf mutu.
3. Dosen mengklik **"Publikasikan Nilai ke KHS"**. Status nilai berubah menjadi `LOCKED`.
4. Setelah berstatus `LOCKED`, nilai tampil secara instan di portal KHS Mahasiswa dan tidak dapat diubah oleh dosen tanpa persetujuan pembukaan kunci (*Unlock Request*) oleh Kaprodi/Admin.

---

## I. Dashboard, Laporan, Definisi Metrik, dan Notifikasi

### 1. Definisi Metrik Operasional Utama
- **Tingkat Kehadiran Kampus / Kelas**: Persentase mahasiswa hadir terhadap total mahasiswa terdaftar pada seluruh sesi aktif hari ini.
- **Ketersediaan Perangkat (*Device Availability*)**: $\frac{\text{Perangkat Online}}{\text{Total Perangkat Terdaftar}} \times 100\%$.
- **Pending Approvals**: Jumlah pengajuan kehadiran sesi pengganti dan pengajuan KRS yang membutuhkan tindakan verifikasi.
- **Tugas Menunggu Dinilai (*Ungraded Submissions*)**: Jumlah submission mahasiswa yang belum diberi skor oleh dosen.

### 2. Kanal Notifikasi
- **In-App Toast & Badge**: Indikator lonceng notifikasi pada bilah navigasi atas untuk tugas baru, sesi presensi dibuka, atau nilai diumumkan.
- **WhatsApp Gateway (Ekstensi)**: Pengiriman ringkasan rekap kehadiran mingguan kepada mahasiswa dan pengingat batas waktu tugas H-1 penutupan.

---

## J. SI KOBAR, AI, Sumber Jawaban, Otorisasi, serta Konfirmasi Aksi

### 1. Arsitektur Komunikasi SI KOBAR
```text
Pengguna (Chat Interface Widget)
       │
       ▼
SI KOBAR Orchestrator (Intent Parser + Context Resolver)
       │
       ▼
Registry Tool Terotorisasi (getMySchedule, getMyAttendance, getDeviceHealth)
       │
       ▼
Backend Service & RBAC SADITA (Token JWT Terverifikasi)
       │
       ▼
Database PostgreSQL / Broker MQTT
       │
       ▼
Respons Terformat Markdown + Konfirmasi Aksi (jika ada mutasi data)
```

### 2. Aturan Ketat Keamanan AI (Zero-Trust Prompting)
- **Larangan SQL Direct Access**: SI KOBAR sama sekali tidak memiliki akses langsung mengeksekusi raw query SQL ke basis data.
- **Pemeriksaan Hak Akses Server-Side**: Konteks identitas (NIM/NIDN, Role, ClassID) diekstrak secara aman dari JWT pengguna aktif, bukan dari teks prompt percakapan pengguna.
- **Konfirmasi Bertingkat (*Human-in-the-Loop Confirmation*)**: Untuk tindakan berdampak (misal: membatalkan submission atau mengajukan presensi pengganti), SI KOBAR wajib menampilkan modal konfirmasi eksplisit (*"Apakah Anda yakin ingin melakukan tindakan ini?"*) sebelum mengeksekusi API mutasi data.

---

## K. Keamanan, Privasi, Audit, Retensi, dan Tata Kelola Data

### 1. Keamanan Otentikasi & Sesi
- **JWT Hardening**: Access Token (RS256/HS256) berumur singkat (15 menit) + Refresh Token Rotation (RTR) dengan cookie HTTP-Only, SameSite=Strict, dan Secure Flag.
- **Hashing Password**: Kriptografi menggunakan algoritma **Argon2id** atau **Bcrypt** dengan cost factor adaptif.

### 2. Buku Log Audit Imutabel (`audit_logs`)
Setiap mutasi data penting dicatat pada tabel `audit_logs` yang bersifat append-only:
- `actor_id`: ID pengguna pelaku.
- `action`: String operasi (`LOGIN_SUCCESS`, `ATTENDANCE_OVERRIDE`, `GRADE_UPDATED`, `KRS_APPROVED`).
- `entity` & `entity_id`: Objek target yang dimodifikasi.
- `before` & `after`: Snapshot delta data format JSONB.
- `created_at`: Waktu pencatatan UTC presisi mikrodetik.

### 3. Retensi & Tata Kelola Privasi Data
- Data presensi dan log audit disimpan minimal 5 tahun buku akademik untuk keperluan audit akreditasi BAN-PT / LAM-INFOKOM.
- Data biometrik sidik jari disimpan dalam bentuk ekstraksi template matematis (minutiae point), bukan citra gambar sidik jari mentah, guna mematuhi UU Perlindungan Data Pribadi (UU PDP).

---

## L. Arsitektur, Backend, Database, Integrasi, serta Deployment

### 1. Arsitektur 4-Tier Backend FastAPI
Sistem backend menerapkan pemisahan tanggung jawab tegas (*Clean Architecture*):
1. **Router Layer (`app/api/`)**: Menangani request HTTP, validasi skema Pydantic v2, otentikasi dependency injection (`get_current_user`).
2. **Service Layer (`app/services/`)**: Menjalankan logika bisnis murni, kalkulasi bobot, transaksi database atomic, dan publish event MQTT.
3. **Repository Layer (`app/repositories/`)**: Abstraksi data akses menggunakan SQLAlchemy 2.0 ORM dengan parameterized queries (bebas SQL Injection).
4. **Model Layer (`app/models/`)**: Definisi skema tabel persisten PostgreSQL.

### 2. Port & Lingkungan Deployment
- **Frontend App**: Next.js 16 (React 19, TypeScript) di port `3000`.
- **Backend API**: Python FastAPI (Uvicorn ASGI) di port `8000`.
- **Database**: PostgreSQL 18.x di port `5433` (development) / `5432` (staging/production).
- **Message Broker**: Eclipse Mosquitto MQTT di port `1883` (plain) dan `8883` (mTLS terenkripsi).
- **File Storage**: Local Secure Upload Directory `/uploads` dengan validasi mime-type & batas 10 MB per berkas.

---

## M. Prioritas, Kriteria Penerimaan, dan Keputusan yang Masih Terbuka

### 1. Kriteria Penerimaan Selesai (*Definition of Done*)
1. Setiap formulir input dilengkapi validasi tipe data, status loading, dan pesan umpan balik ramah pengguna.
2. Endpoint backend menolak setiap request tanpa header Authorization valid atau tanpa izin scope kelas/prodi (HTTP 401 & 403).
3. Transaksi tap RFID tidak boleh menghasilkan data ganda (*idempotent verification*).
4. Tidak ada data placeholder atau metrik palsu (data kosong wajib menampilkan kartu *"Belum ada data tersedia"*).

### 2. Keputusan Terbuka (*Open Decisions*)
- Standarisasi toleransi menit keterlambatan presensi: apakah diseragamkan universitas (15 menit) atau dapat diatur fleksibel per dosen pengampu.
- Kebijakan penalti nilai keterlambatan tugas: apakah sistem auto-cut 10% per 24 jam atau diserahkan sepenuhnya ke diskresi dosen saat menilai.
- Batas waktu retake pengerjaan kuis jika terjadi kendala listrik/jaringan pada laptop mahasiswa.

---

# BAGIAN 2: INVENTARIS LENGKAP HALAMAN, CRUD, FORM INPUT, DAN AKSI 5 STAKEHOLDER

Berikut adalah rincian seluruh halaman operasional, formulir CRUD, struktur input field, dan tombol aksi interaktif untuk **Dosen**, **Mahasiswa**, **Ketua Kelas**, **Kaprodi**, dan **Admin**.

---

## 1. STAKEHOLDER: DOSEN

### Halaman 1.1: Kelas Saya (`/dosen/kelas`)
- **Fungsi Utama**: Menampilkan seluruh rombongan belajar kelas perkuliahan yang ditugaskan kepada dosen pada semester aktif.
- **Komponen & Tampilan**:
  - Filter Semester Aktif (Dropdown).
  - Kartu Rombel Kelas: Kode Matkul, Nama Matkul, Ruangan, Jadwal Hari & Jam, Mode Kelas (Badge: Reguler Pagi / Malam / Shift), Kuota Mahasiswa Terdaftar.
- **Formulir & CRUD**:
  - **Edit Informasi Silabus Kelas** (Modal Form):
    - *Deskripsi Kelas*: Textarea
    - *Tautan Grup Diskusi WhatsApp / Telegram*: URL Input
    - *Deskripsi Kontrak Kuliah*: Textarea
- **Tombol & Aksi Interaktif**:
  - `Buka Ruang Kelas`: Navigasi langsung ke workspace detail kelas.
  - `Lihat Mahasiswa Terdaftar`: Modal tabel daftar nama, NIM, status KRS, dan status KTM mahasiswa di kelas.
  - `Simpan Kontrak Kuliah`: Tombol aksi menyimpan perubahan deskripsi kelas.

---

### Halaman 1.2: Materi Kuliah (`/dosen/materi`)
- **Fungsi Utama**: Manajemen dokumen, modul bahan ajar, teks panduan, dan tautan referensi perkuliahan per kelas.
- **Komponen & Tampilan**:
  - Toolbar Pemilih Kelas (`ClassToolbar`).
  - Daftar Kartu Materi: Judul Materi, Badge Jenis Materi (`DOCUMENT`, `LINK`, `TEXT`, `VIDEO`), Deskripsi Singkat, Tanggal Publikasi.
- **Formulir & CRUD**:
  - **Tambah Materi Kuliah** (Modal Form):
    - *Kelas Sasaran*: Dropdown pilihan kelas dosen
    - *Judul Materi*: Text input (Wajib, maksimal 200 karakter)
    - *Jenis Materi*: Dropdown pilihan (`DOCUMENT`, `LINK`, `TEXT`, `VIDEO`)
    - *Deskripsi Singkat*: Textarea ringkasan pengantar materi
    - *File Berkas Materi*: File uploader (Muncul jika jenis `DOCUMENT`, menerima PDF/DOCX/PPTX, batas 10 MB)
    - *Tautan (URL) / URL Sumber*: URL input (Muncul jika jenis `LINK` atau `VIDEO`, format https://)
    - *Isi Konten Catatan*: Rich-text / Markdown editor (Muncul jika jenis `TEXT`)
- **Tombol & Aksi Interaktif**:
  - `Tambah Materi`: Membuka modal tambah materi.
  - `Buka / Unduh Berkas Materi`: Membuka tab baru untuk melihat dokumen PDF atau mengunjungi URL sumber eksternal.
  - `Hapus Materi`: Konfirmasi alert hapus materi (menghapus record di database dan berkas di server).

---

### Halaman 1.3: Presensi Kuliah & Live Monitor (`/dosen/presensi`)
- **Fungsi Utama**: Membuka sesi kehadiran fisik/online kelas, memantau live feed tap kartu mahasiswa di mesin ESP32, dan melakukan koreksi manual.
- **Komponen & Tampilan**:
  - Panel Kontrol Sesi Aktif: Status Sesi (`SCHEDULED`, `OPEN`, `CLOSED`), Jam Buka, Jam Berakhir, Toleransi Menit.
  - Widget Statistik Live Presensi: Mahasiswa Hadir, Terlambat, Izin/Sakit, Alfa, Total Mahasiswa di Kelas.
  - Tabel Live Monitor Kehadiran: Foto Profil, NIM, Nama Lengkap, Jam Tap Kartu, Status (`HADIR`, `TERLAMBAT`, `ALFA`), Metode Presensi (RFID+Fingerprint / Manual).
- **Formulir & CRUD**:
  - **Buka Sesi Presensi Baru** (Modal Form):
    - *Pilih Kelas & Pertemuan*: Dropdown (Pertemuan 1 s.d. 16)
    - *Pilihan Ruangan / Perangkat SADITA*: Dropdown perangkat IoT terpasang
    - *Toleransi Keterlambatan*: Number input (Default: 15 menit)
    - *Topik Pembahasan Hari Ini*: Text input
  - **Koreksi Manual Status Kehadiran** (Modal Form):
    - *Nama & NIM Mahasiswa*: Read-only info
    - *Ubah Status Menjadi*: Dropdown (`HADIR`, `TERLAMBAT`, `IZIN`, `SAKIT`, `ALFA`)
    - *Alasan Koreksi (Berita Acara)*: Textarea (Wajib diisi sebagai syarat audit log)
- **Tombol & Aksi Interaktif**:
  - `Buka Sesi Presensi`: Mengaktifkan sesi presensi dan mengizinkan mesin IoT menerima tap RFID.
  - `Tutup Sesi Presensi`: Mengunci sesi; sisa mahasiswa yang belum tap otomatis berstatus `ALFA`.
  - `Koreksi Status`: Membuka modal koreksi per baris mahasiswa.
  - `Ekspor Berita Acara Presensi`: Mengunduh lembar presensi format Excel / PDF.

---

### Halaman 1.4: Tugas Kuliah & Evaluasi Submission (`/dosen/tugas`)
- **Fungsi Utama**: Menerbitkan penugasan akademik, menentukan tenggat waktu, dan memeriksa serta menilai berkas submission mahasiswa.
- **Komponen & Tampilan**:
  - Toolbar Pemilih Kelas.
  - Daftar Tugas: Judul Tugas, Sesi Pertemuan, Batas Waktu (*Deadline*), Jumlah Berkas Terkumpul, Skor Maksimal.
  - Panel Review Submission Mahasiswa: Daftar nama mahasiswa pengumpul, stempel waktu upload, status keterlambatan (Badge: `Tepat Waktu` / `Terlambat`), Tautan Unduh Berkas Mahasiswa, Input Nilai, dan Kolom Catatan Feedback Dosen.
- **Formulir & CRUD**:
  - **Buat Tugas Baru** (Modal Form):
    - *Kelas*: Dropdown kelas
    - *Judul Tugas*: Text input
    - *Pertemuan Terkait*: Dropdown pertemuan
    - *Instruksi Tugas*: Textarea instruksi pengerjaan
    - *Batas Waktu (Due Date & Time)*: Datetime picker
    - *Nilai Maksimal*: Number input (Default: 100)
    - *Lampiran Berkas Soal*: File uploader opsional (PDF)
  - **Form Input Nilai & Feedback Submission** (Form Inline/Modal):
    - *Nilai (Score)*: Number input (Rentang 0 s.d. 100)
    - *Catatan Evaluasi / Feedback*: Textarea masukan perbaikan dosen
- **Tombol & Aksi Interaktif**:
  - `Buat Tugas`: Membuka modal penerbitan tugas.
  - `Lihat Pengumpulan`: Menampilkan panel rekap pengumpulan mahasiswa.
  - `Unduh Berkas Mahasiswa`: Mengunduh berkas jawaban tugas mahasiswa.
  - `Simpan Nilai & Feedback`: Menyimpan evaluasi dan menerbitkan status `GRADED`.
  - `Hapus Tugas`: Menghapus penugasan jika belum ada mahasiswa yang mengumpulkan.

---

### Halaman 1.5: Kuis Interaktif (`/dosen/kuis`)
- **Fungsi Utama**: Mengelola kuis online, menyusun butir soal pertanyaan, kunci jawaban, dan memantau skor pengerjaan kuis.
- **Komponen & Tampilan**:
  - Daftar Kuis: Judul Kuis, Kelas, Durasi (Menit), Batas Percobaan (*Max Attempts*), Status Publikasi (Draft / Published).
  - Manajemen Butir Soal Kuis: Daftar nomor soal, teks pertanyaan, pilihan opsi A, B, C, D, dan indikator kunci jawaban.
- **Formulir & CRUD**:
  - **Buat Kuis Baru** (Modal Form):
    - *Judul Kuis*: Text input
    - *Deskripsi*: Textarea
    - *Durasi Pengerjaan*: Number input (menit)
    - *Batas Percobaan*: Number input (default: 1 kali)
    - *Passing Grade*: Number input (skor kelulusan, misal: 70)
  - **Tambah Soal Kuis** (Modal Form):
    - *Teks Pertanyaan*: Textarea soal
    - *Tipe Pertanyaan*: Dropdown (`Pilihan Tunggal`, `Pilihan Ganda`, `Esai`)
    - *Opsi Pilihan Jawaban*: Input teks untuk Opsi A, B, C, D
    - *Kunci Jawaban Benar*: Radio button pemilih opsi yang benar
    - *Bobot Poin Soal*: Number input (misal: 10 poin)
- **Tombol & Aksi Interaktif**:
  - `Buat Kuis Baru`: Membuka formulir master kuis.
  - `Kelola Butir Soal`: Membuka antarmuka penyusunan soal pertanyaan.
  - `Publikasikan Kuis`: Mengubah status draft menjadi published agar dapat dikerjakan mahasiswa.
  - `Lihat Hasil Kuis Mahasiswa`: Rekap daftar nilai perolehan seluruh mahasiswa.

---

### Halaman 1.6: Penilaian & Rekap Nilai Akhir (`/dosen/nilai`)
- **Fungsi Utama**: Mengelola skor komponen (UTS 30%, UAS 35%, Tugas 15%, Presensi 10%, Keaktifan 10%), menghitung nilai akhir otomatis, dan mempublikasikan KHS.
- **Komponen & Tampilan**:
  - Tabel Matriks Nilai: NIM, Nama Mahasiswa, Skor Kehadiran (Auto), Skor Rata-rata Tugas (Auto), Input Nilai Keaktifan, Input Nilai UTS, Input Nilai UAS, Skor Akhir Angka, Huruf Mutu (A–E), Status Kunci (`DRAFT` / `LOCKED`).
- **Formulir & CRUD**:
  - **Input / Update Nilai Komponen** (Inline Grid Editing):
    - *Skor UTS*: Number input (0–100)
    - *Skor UAS*: Number input (0–100)
    - *Skor Keaktifan*: Number input (0–100)
    - *Catatan Khusus*: Text input
- **Tombol & Aksi Interaktif**:
  - `Hitung Nilai Akhir Otomatis`: Menjalankan kalkulasi pembobotan backend secara serentak untuk seluruh kelas.
  - `Simpan Draft Nilai`: Menyimpan angka komponen tanpa mempublikasikan ke mahasiswa.
  - `Publikasikan Nilai ke KHS`: Mengunci nilai (`LOCKED`) dan menerbitkan data ke portal mahasiswa.
  - `Ekspor Lembar Nilai`: Download rekap format Excel resmi akademik.

---

### Halaman 1.7: Dashboard Dosen (`/dosen/dashboard`)
- **Fungsi Utama**: Pusat komando aktivitas harian dosen.
- **Komponen & Tampilan**:
  - Kartu Ringkasan: Total Kelas Diampu, Total Mahasiswa Terbimbing, Sesi Perkuliahan Hari Ini, Tugas Menunggu Penilaian.
  - Jadwal Mengajar Hari Ini: Kartu mata kuliah, jam mulai, ruang kelas, tombol pintas buka presensi.
  - Antarmuka SI KOBAR Floating Widget: Akses cepat asisten AI operasional dosen.

---

## 2. STAKEHOLDER: MAHASISWA

### Halaman 2.1: Dashboard Mahasiswa (`/mahasiswa/dashboard`)
- **Fungsi Utama**: Ikhtisar status akademik pribadi mahasiswa.
- **Komponen & Tampilan**:
  - Kartu Profil Mahasiswa: Nama, NIM, Program Studi, Semester Aktif, Status Registrasi KTM.
  - Kartu Statistik: Rata-rata Kehadiran Kumulatif (%), Jumlah Tugas Aktif Belum Dikumpulkan, SKS Berjalan.
  - Jadwal Kuliah Hari Ini: Nama mata kuliah, jam mulai, nama dosen pengampu, status sesi perkuliahan (Belum Dimulai / Sedang Berlangsung).
  - Floating Widget SI KOBAR Assistant.

---

### Halaman 2.2: Jadwal Kuliah (`/mahasiswa/jadwal`)
- **Fungsi Utama**: Kalender jadwal perkuliahan mingguan mahasiswa berdasarkan kelas yang telah disetujui di KRS.
- **Komponen & Tampilan**:
  - Filter Hari (Senin s.d. Sabtu).
  - Daftar Kartu Jadwal: Jam Perkuliahan, Kode & Nama Mata Kuliah, Jumlah SKS, Ruang Kelas, Nama Dosen, Mode Kuliah (Pagi/Malam/Shift).
- **Tombol & Aksi Interaktif**:
  - `Masuk ke Kelas`: Pintasan menuju halaman materi/tugas mata kuliah terkait.

---

### Halaman 2.3: Kartu Rencana Studi / KRS (`/mahasiswa/krs`)
- **Fungsi Utama**: Pengisian rencana studi semester baru dan pemantauan status persetujuan Dosen PA / Kaprodi.
- **Komponen & Tampilan**:
  - Status KRS Semester Ini (Badge: `Belum Mengisi`, `Menunggu Persetujuan`, `Disetujui`, `Ditolak`).
  - Ringkasan Beban: Kuota SKS Maksimal, Total SKS Dipilih.
  - Daftar Mata Kuliah Terpilih.
- **Formulir & CRUD**:
  - **Pilih Mata Kuliah & Kelas Baru** (Form Interaktif):
    - *Pilihan Mata Kuliah*: Checkbox daftar matkul yang ditawarkan semester ini
    - *Pilihan Rombel Kelas*: Dropdown kelas (A, B, Malam, Shift) beserta kuota tersisa
    - *Tipe Pengambilan*: Radio button (`Reguler`, `Tambah SKS`, `Mengulang`)
- **Tombol & Aksi Interaktif**:
  - `Ajukan KRS`: Mengirimkan rencana studi ke sistem dengan status `PENDING_APPROVAL`.
  - `Cetak Lembar KRS`: Mencetak dokumen PDF KRS resmi ber-barcode verifikasi.
  - `Batalkan Pengajuan`: Menarik kembali pengajuan sebelum disetujui untuk revisi mata kuliah.

---

### Halaman 2.4: Presensi & Riwayat Kehadiran (`/mahasiswa/presensi`)
- **Fungsi Utama**: Memantau persentase kehadiran per mata kuliah dan mengecek riwayat transaksi tap kartu fisik/online.
- **Komponen & Tampilan**:
  - Kartu Ringkasan Tiap Mata Kuliah: Nama Matkul, Total Pertemuan, Jumlah Hadir, Terlambat, Izin/Sakit, Alfa, Indikator Progress Bar Kehadiran (Merah jika $< 75\%$, Hijau jika $\ge 75\%$).
  - Tabel Riwayat Transaksi Presensi: Tanggal & Waktu, Nama Mata Kuliah, Pertemuan Ke-, Status (`HADIR`, `TERLAMBAT`, `IZIN`, `SAKIT`), Metode Verifikasi (RFID+Fingerprint / Manual).
- **Formulir & CRUD**:
  - **Form Pengajuan Presensi Sesi Pengganti / Daring** (Modal Form):
    - *Pilih Sesi Pengganti Aktif*: Dropdown sesi kuliah pengganti yang dibuka dosen
    - *Catatan / Alasan Kehadiran*: Text input
    - *Lampiran Bukti (opsional)*: Upload berkas pendukung
- **Tombol & Aksi Interaktif**:
  - `Ajukan Kehadiran Pengganti`: Mengirim pengajuan presensi ke antrean verifikasi Ketua Kelas.
  - `Unduh Rekap Presensi Mandiri`: Ekspor riwayat kehadiran pribadi.

---

### Halaman 2.5: Materi Pembelajaran (`/mahasiswa/materi`)
- **Fungsi Utama**: Mengakses bahan ajar, modul digital, slide kuliah, dan tautan referensi yang dibagikan dosen.
- **Komponen & Tampilan**:
  - Pemilih Mata Kuliah.
  - Timeline Pertemuan 1 s.d. 16: Tiap pertemuan memuat kartu materi yang diunggah dosen.
- **Tombol & Aksi Interaktif**:
  - `Baca / Buka Dokumen`: Menampilkan viewer PDF interaktif di dalam portal.
  - `Unduh Berkas`: Mengunduh file dokumen slide materi.
  - `Buka Tautan Luar`: Membuka tab baru menuju URL video kuliah atau repositori materi.

---

### Halaman 2.6: Tugas Kuliah (`/mahasiswa/tugas`)
- **Fungsi Utama**: Melihat daftar instruksi tugas dan mengumpulkan berkas tugas sebelum batas waktu.
- **Komponen & Tampilan**:
  - Filter Status Tugas: Semua, Belum Dikumpulkan, Menunggu Dinilai, Sudah Dinilai.
  - Kartu Tugas: Judul Tugas, Mata Kuliah, Batas Waktu (*Due Date*), Sisa Waktu Hitung Mundur, Nilai Diperoleh, Catatan Feedback Dosen.
- **Formulir & CRUD**:
  - **Pengumpulan Tugas / Submission** (Modal Form):
    - *Unggah Berkas Tugas*: File input (Menerima PDF/ZIP/DOCX, batas 10 MB)
    - *Catatan Mahasiswa*: Textarea (opsional untuk catatan kepada dosen)
- **Tombol & Aksi Interaktif**:
  - `Kumpulkan Tugas`: Mengunggah berkas jawaban tugas ke server.
  - `Ganti Berkas Pengumpulan (Edit Submission)`: Mengunggah ulang berkas revisi selama batas waktu belum terlewati.
  - `Unduh Berkas Submission Saya`: Mengunduh kembali berkas yang telah dikumpulkan untuk pengecekan.

---

### Halaman 2.7: Kuis Kuliah (`/mahasiswa/kuis`)
- **Fungsi Utama**: Mengakses dan mengerjakan evaluasi kuis online berbatas waktu.
- **Komponen & Tampilan**:
  - Daftar Kuis: Judul, Mata Kuliah, Durasi Waktu, Skor Kelulusan, Jumlah Percobaan Dilakukan / Maksimal.
  - Antarmuka Pengerjaan Kuis: Timer hitung mundur melayang (*floating countdown*), nomor navigasi soal, teks pertanyaan, pilihan opsi jawaban radio button.
- **Formulir & Aksi**:
  - Memilih Opsi Jawaban: Radio button interaktif tersimpan otomatis di state lokal.
  - Tombol `Ragu-Ragu`: Menandai nomor soal warna kuning untuk ditinjau ulang.
  - Tombol `Kirim Jawaban Final`: Dialog konfirmasi pengiriman jawaban kuis ke backend untuk auto-grading.
  - Panel Hasil Kuis: Menampilkan skor perolehan instan, status Lulus/Gagal, dan ringkasan jumlah jawaban benar.

---

### Halaman 2.8: Nilai & KHS Mahasiswa (`/mahasiswa/nilai`)
- **Fungsi Utama**: Melihat Kartu Hasil Studi (KHS) semester aktif dan riwayat transkrip nilai akademik.
- **Komponen & Tampilan**:
  - Filter Semester Perkuliahan.
  - Kartu Prestasi: Indeks Prestasi Semester (IPS), Indeks Prestasi Kumulatif (IPK), Total SKS Lulus.
  - Tabel Rincian Nilai: Kode Matkul, Nama Matkul, SKS, Nilai Tugas, Nilai Presensi, Nilai Keaktifan, Nilai UTS, Nilai UAS, Nilai Akhir Angka, Nilai Huruf Mutu (A, B, C, D, E), Bobot Angka.
- **Tombol & Aksi Interaktif**:
  - `Cetak Kartu Hasil Studi (KHS)`: Mengunduh lembar KHS resmi format PDF bertanda tangan digital institusi.

---

### Halaman 2.9: Kartu SADITA & Pengaturan Profil (`/mahasiswa/pengaturan`)
- **Fungsi Utama**: Manajemen identitas fisik kartu RFID KTM dan keamanan akun.
- **Komponen & Tampilan**:
  - Visual Kartu KTM Digital: Desain kartu berlogo UNIPI, Nama, NIM, Program Studi, Status Kartu (Badge: `KTM_TERDAFTAR`, `KTM_HILANG`, dll).
  - Status Biometrik: Indikator Pendaftaran Sidik Jari (Terdaftar di Slot #X / Belum Terdaftar).
- **Formulir & CRUD**:
  - **Ubah Kata Sandi**:
    - *Kata Sandi Lama*: Password input
    - *Kata Sandi Baru*: Password input (Min 8 karakter, kombinasi huruf & angka)
    - *Konfirmasi Kata Sandi Baru*: Password input
  - **Lapor KTM Hilang**:
    - *Alasan Kehilangan*: Textarea
    - Tombol Konfirmasi `Blokir Kartu RFID Saya`: Otomatis menonaktifkan UID kartu di sistem agar tidak disalahgunakan.

---

## 3. STAKEHOLDER: KETUA KELAS

> **Catatan:** Ketua Kelas memiliki seluruh halaman portal mahasiswa di atas ditambah menu privilege operasional kelas berikut:

### Halaman 3.1: Dashboard Ketua Kelas (`/ketua-kelas/dashboard`)
- **Fungsi Utama**: Ringkasan tanggung jawab operasional rombongan belajar kelas yang dipimpinnya.
- **Komponen & Tampilan**:
  - Informasi Penugasan: Nama Rombel Kelas, Mata Kuliah, Dosen Pengampu, Ruang Perkuliahan.
  - Statistik Kelas: Jumlah Anggota Kelas, Kehadiran Rekan pada Sesi Terakhir (%), Pengajuan Presensi Sesi Pengganti yang Membutuhkan Verifikasi.

---

### Halaman 3.2: Rekan Satu Kelas (`/ketua-kelas/rekan`)
- **Fungsi Utama**: Memantau daftar anggota rombel kelas untuk koordinasi perkuliahan.
- **Komponen & Tampilan**:
  - Kotak Pencarian Rekan (Filter berdasarkan Nama / NIM).
  - Tabel Anggota Kelas: Foto, NIM, Nama Lengkap, Status KTM, Kontak WhatsApp / Email (untuk koordinasi kelas).
- **Aksi Interaktif**:
  - `Kirim Pesan Koordinasi`: Tautan langsung membuka chat WhatsApp grup kelas atau email.

---

### Halaman 3.3: Monitoring Presensi Kelas (`/ketua-kelas/presensi`)
- **Fungsi Utama**: Memantau rekapitulasi kehadiran rekan sekelas secara transparan guna mencegah ketidakhadiran berulang.
- **Komponen & Tampilan**:
  - Tabel Presensi Rekan Sesi Aktif: Daftar nama rekan sekelas, stempel waktu kehadiran fisik, status hadir/alfa.
  - *Catatan Kewenangan*: **Ketua Kelas hanya memiliki hak Read/View pada halaman ini dan dilarang mengubah status presensi rekan secara langsung**.

---

### Halaman 3.4: Verifikasi Sesi Pengganti (`/ketua-kelas/verifikasi`)
- **Fungsi Utama**: Melakukan verifikasi kejadian (*occurrence confirmation*) bahwa kuliah pengganti / daring benar-benar telah dilaksanakan oleh dosen dan dihadiri rekan kelas.
- **Komponen & Tampilan**:
  - Antrean Pengajuan Kehadiran Pengganti: Nama Mahasiswa Pemohon, NIM, Mata Kuliah, Tanggal Sesi Pengganti, Jam Pelaksanaan, Catatan Mahasiswa.
- **Formulir & CRUD**:
  - **Form Verifikasi Kejadian** (Modal Form):
    - *Konfirmasi Fakta Perkuliahan*: Checkbox pernyataan *"Saya memverifikasi bahwa perkuliahan pengganti ini benar-benar diselenggarakan dan mahasiswa bersangkutan hadir mengikuti sesi"*.
    - *Catatan Verifikator*: Textarea (opsional)
- **Tombol & Aksi Interaktif**:
  - `Verifikasi Kehadiran`: Mengubah status permohonan dari `PENDING` menjadi `VERIFIED`. Berkas otomatis diteruskan ke meja Admin untuk final approval.
  - `Tolak Verifikasi (Invalid)`: Menolak pengajuan jika mahasiswa tidak hadir pada sesi pengganti tersebut (wajib menyertakan alasan penolakan).

---

## 4. STAKEHOLDER: KETUA PROGRAM STUDI (KAPRODI)

### Halaman 4.1: Dashboard Program Studi (`/kaprodi/dashboard`)
- **Fungsi Utama**: Pemantauan kinerja dan kesehatan akademik di lingkup program studi yang dipimpin.
- **Komponen & Tampilan**:
  - Kartu Metrik Prodi: Total Mahasiswa Aktif Prodi, Total Dosen Pengampu Prodi, Total Kelas Berjalan, Rata-rata Kehadiran Kuliah Prodi Hari Ini (%).
  - Grafik Distribusi Kehadiran Kelas Prodi: Visualisasi grafik kelas dengan kehadiran tinggi vs kelas yang membutuhkan perhatian.
  - Widget SI KOBAR Assistant.

---

### Halaman 4.2: Kurikulum & Mata Kuliah Prodi (`/kaprodi/kurikulum`)
- **Fungsi Utama**: Pengawasan struktur kurikulum program studi dan penawaran mata kuliah per semester.
- **Komponen & Tampilan**:
  - Filter Semester Paket (Semester 1 s.d. 8).
  - Tabel Kurikulum: Kode Mata Kuliah, Nama Mata Kuliah, Jumlah SKS (Teori / Praktikum), Sifat (Wajib / Pilihan), Prasyarat Mata Kuliah.
- **Formulir & CRUD**:
  - **Tambah Mata Kuliah Baru ke Kurikulum** (Modal Form):
    - *Kode Mata Kuliah*: Text input (misal: `TI301`)
    - *Nama Mata Kuliah*: Text input
    - *Bobot SKS*: Number input (1 s.d. 6 SKS)
    - *Semester Penawaran*: Dropdown (Semester 1 s.d. 8)
    - *Deskripsi / Silabus Ringkas*: Textarea
- **Tombol & Aksi Interaktif**:
  - `Tambah Matkul`: Membuka modal penambahan mata kuliah prodi.
  - `Detail Silabus`: Menampilkan rincian capaian pembelajaran mata kuliah (CPMK).
  - `Ekspor Struktur Kurikulum`: Unduh dokumen PDF kurikulum.

---

### Halaman 4.3: Data Dosen Program Studi (`/kaprodi/dosen`)
- **Fungsi Utama**: Pemantauan beban mengajar dan riwayat penugasan dosen homebase prodi.
- **Komponen & Tampilan**:
  - Tabel Dosen: NIDN/NIP, Nama Lengkap & Gelar, Status Dosen (Tetap / Luar Biasa), Total SKS Diampu Semester Ini, Daftar Kelas yang Diajar.
- **Tombol & Aksi Interaktif**:
  - `Lihat Beban Mengajar (BKD)`: Rekapitulasi jam mengajar dosen untuk verifikasi beban kerja dosen.

---

### Halaman 4.4: Data Mahasiswa Program Studi (`/kaprodi/mahasiswa`)
- **Fungsi Utama**: Pengawasan progress studi seluruh mahasiswa dalam naungan program studi.
- **Komponen & Tampilan**:
  - Filter Angkatan Mahasiswa (Tahun Masuk) & Filter Status (Aktif, Cuti, Drop Out).
  - Tabel Mahasiswa: NIM, Nama Mahasiswa, Angkatan, Kelas Rombel, Dosen Penasihat Akademik (PA), IPK Terkini, Status Kepemilikan KTM.
- **Tombol & Aksi Interaktif**:
  - `Lihat Transkrip Nilai`: Menampilkan histori nilai kumulatif mahasiswa.
  - `Evaluasi Mahasiswa Bermasalah`: Filter instan menampilkan mahasiswa dengan kehadiran $< 75\%$ atau IPK $< 2.00$ untuk sesi konseling PA.

---

### Halaman 4.5: Monitoring Presensi & Kinerja Perkuliahan (`/kaprodi/presensi`)
- **Fungsi Utama**: Oversight keterlaksanaan perkuliahan harian seluruh dosen di program studi.
- **Komponen & Tampilan**:
  - Log Perkuliahan Real-Time: Mata Kuliah, Nama Dosen, Jam Buka Sesi, Realisasi Jam Masuk, Ruang Kelas, Persentase Kehadiran Mahasiswa.
  - Indikator Anomali: Tanda bahaya (*alert banner*) jika terdapat kelas yang tidak kunjung dibuka oleh dosen melewati 30 menit dari jadwal resmi.
- **Tombol & Aksi Interaktif**:
  - `Ekspor Laporan Bulanan Presensi Prodi`: Unduh rekapitulasi kehadiran untuk laporan dekanat/institusi.

---

## 5. STAKEHOLDER: ADMINISTRATOR (ADMIN)

### Halaman 5.1: Admin Dashboard (`/admin/dashboard`)
- **Fungsi Utama**: Pusat kendali infrastruktur, operasional data kampus, dan status ekosistem SADITA.ai.
- **Komponen & Tampilan**:
  - Widget Metrik Kampus: Total Pengguna, Mahasiswa Aktif, Dosen, Kelas Aktif, Sesi Terbuka Saat Ini, Perangkat IoT Offline.
  - Status Ekosistem Sistem: Indikator Kesehatan Database PostgreSQL, Broker MQTT Mosquitto, API Gateway FastAPI, Server Storage.
  - Log Aktivitas Terbaru: Feed event audit trail (Login, Mutasi KRS, Pendaftaran Hardware).
  - SI KOBAR System Admin Assistant.

---

### Halaman 5.2: Pengelolaan Data Akademik (`/admin/akademik`)
- **Fungsi Utama**: CRUD menyeluruh master data institusi (Tahun Akademik/Semester, Program Studi, Mata Kuliah, dan Kelas Perkuliahan).
- **Tab 1: Tahun Akademik & Semester**:
  - Formulir Tambah Semester: Nama Semester (Text), Tanggal Mulai (Date), Tanggal Berakhir (Date), Status Aktif (Toggle).
  - Aksi: `Set Aktif`, `Edit`, `Hapus`.
- **Tab 2: Program Studi**:
  - Formulir Tambah Prodi: Kode Prodi (Text), Nama Prodi (Text), Jenjang (Dropdown: S1, D3, S2), Nama Kaprodi (Dropdown Dosen).
  - Aksi: `Edit`, `Hapus`.
- **Tab 3: Kelas Perkuliahan (Rombel)**:
  - Formulir Tambah Kelas:
    - *Pilih Mata Kuliah & Semester*: Dropdown
    - *Nama Rombel*: Text input (misal: `TI-4A`)
    - *Tipe Kelas*: Dropdown (`REGULER_PAGI`, `REGULER_MALAM`, `SHIFT`)
    - *Dosen Pengampu Utama*: Dropdown Dosen
    - *Kapasitas Kuota Kelas*: Number input (misal: 40 kursi)
    - *Ruangan & Jadwal*: Dropdown Ruang, Hari, Jam Mulai, Jam Selesai
  - Aksi: `Edit Jadwal`, `Hapus Kelas`, `Tugaskan Ketua Kelas`.

---

### Halaman 5.3: KRS & Enrollment Mahasiswa (`/admin/akademik` sub-modul)
- **Fungsi Utama**: Administrasi pendaftaran mahasiswa ke dalam rombongan belajar kelas dan penetapan status KRS.
- **Komponen & Tampilan**:
  - Tabel Enrollment: Nama Mahasiswa, NIM, Rombel Kelas, Mata Kuliah, Status Enrollment (`AKTIF`, `DROP`, `CUTI`), Status KRS (`APPROVED`, `PENDING_APPROVAL`).
- **Formulir & CRUD**:
  - **Enroll Mahasiswa ke Kelas Manual** (Modal Form):
    - *Pilih Mahasiswa*: Searchable dropdown NIM/Nama
    - *Pilih Kelas Sasaran*: Dropdown kelas aktif
    - *Tipe Enrollment*: Dropdown (`REGULER`, `TAMBAH_SKS`, `MENGULANG`)
- **Tombol & Aksi Interaktif**:
  - `Tambah Enrollment`: Membuka modal pendaftaran manual mahasiswa.
  - `Import KRS Massal`: Upload file Excel / CSV data KRS mahasiswa.
  - `Pindah Kelas`: Memindahkan mahasiswa antar rombel dengan pembaruan otomatis.
  - `Hapus / Drop Enrollment`: Membatalkan keikutsertaan mahasiswa di kelas.

---

### Halaman 5.4: Manajemen Perangkat SADITA IoT (`/admin/perangkat`)
- **Fungsi Utama**: Konfigurasi stasiun presensi fisik ESP32-S3, pemetaan ke ruangan kuliah, dan monitoring status koneksi MQTT.
- **Komponen & Tampilan**:
  - Tabel Daftar Perangkat: Device ID (String unik), Nama Perangkat, Alamat IP Lokal, Penugasan Ruangan (Room Assignment), Status Koneksi (Badge: `ONLINE` hijau / `OFFLINE` abu-abu), Versi Firmware, Timestamp Heartbeat Terakhir.
- **Formulir & CRUD**:
  - **Daftarkan Perangkat Baru** (Modal Form):
    - *Device ID*: Text input unik (misal: `ESP32-R301-LAB`)
    - *Nama Perangkat*: Text input (misal: `Stasiun Presensi Lab Komputer 1`)
    - *Penugasan Ruangan*: Dropdown Ruang Kuliah (misal: `Lab 301`)
    - *MAC Address*: Text input perangkat
  - **Edit Perangkat**: Mengubah penugasan ruangan atau nama stasiun.
- **Tombol & Aksi Interaktif**:
  - `Daftarkan Perangkat`: Simpan perangkat ke basis data.
  - `Kirim Perintah Ping (Healthcheck)`: Mem-publish MQTT command tes ping ke ESP32.
  - `Kirim Perintah Restart Device`: Me-reboot perangkat ESP32 secara remote via MQTT.
  - `Hapus Perangkat`: Mencabut registrasi perangkat.

---

### Halaman 5.5: Manajemen Pengguna & Hak Akses (`/admin/users`)
- **Fungsi Utama**: Mengelola akun seluruh civitas akademika, role sistem, reset password, dan registrasi kredensial hardware (RFID / Fingerprint).
- **Komponen & Tampilan**:
  - Filter Role (Admin, Kaprodi, Dosen, Mahasiswa, Ketua Kelas).
  - Tabel Pengguna: Foto, Username/NIM/NIDN, Nama Lengkap, Email Institusi, Role Pengguna, Status Akun (Aktif/Suspended), Status Kredensial RFID & Fingerprint.
- **Formulir & CRUD**:
  - **Tambah Pengguna Baru** (Modal Form):
    - *Nama Lengkap*: Text input
    - *Email*: Email input institusi (@unipi.ac.id / @mhs.unipi.ac.id)
    - *Role*: Dropdown (`ADMIN`, `KAPRODI`, `DOSEN`, `MAHASISWA`)
    - *Password Awal*: Password input (otomatis di-hash Argon2/Bcrypt)
    - *Data Tambahan*: Input NIM & Prodi (jika Mahasiswa) atau NIDN (jika Dosen)
  - **Registrasi / Binding Kartu RFID KTM** (Modal Form):
    - *Pilih Mahasiswa*: Read-only info
    - *UID Kartu RFID*: Scan langsung dari reader atau input heksadesimal UID
    - *Status KTM*: Dropdown (`KTM_TERDAFTAR`, `KTM_HILANG`, dll)
  - **Daftarkan Slot Sidik Jari**: Mengaitkan Slot ID sensor biometrik optik ke mahasiswa.
- **Tombol & Aksi Interaktif**:
  - `Tambah Pengguna`: Membuka modal user baru.
  - `Reset Password`: Menghasilkan link token reset kata sandi baru.
  - `Suspend / Aktifkan Akun`: Mengunci hak login pengguna secara instan.
  - `Hapus Akun`: Menghapus profil pengguna dengan proteksi cascade constraints.

---

### Halaman 5.6: Approval Sesi Pengganti & Presensi (`/admin/presensi`)
- **Fungsi Utama**: Meja persetujuan final (*final approval authority*) untuk permohonan kehadiran pengganti yang telah divalidasi oleh Ketua Kelas.
- **Komponen & Tampilan**:
  - Daftar Antrean Approval: Tanggal, Nama Mahasiswa, NIM, Rombel Kelas, Tanggal Kuliah Pengganti, Verifikator Ketua Kelas (Nama & Stempel Waktu Verifikasi), Bukti Pendukung.
- **Tombol & Aksi Interaktif**:
  - `Approve (Setujui Presensi)`: Mengesahkan kehadiran mahasiswa di database. Catatan kehadiran resmi berubah menjadi `HADIR` dan stempel waktu dicatat di audit log.
  - `Reject (Tolak)`: Menolak pengajuan dengan input alasan resmi (misal: *"Verifikasi ketua kelas tidak didukung absensi fisik manual"*).

---

### Halaman 5.7: Oversight Monitoring LMS (`/admin/lms`)
- **Fungsi Utama**: Pengawasan global aktivitas pembelajaran digital di seluruh fakultas/prodi.
- **Komponen & Tampilan**:
  - Ringkasan Statistik: Total Materi Diunggah, Total Tugas Diterbitkan, Total Submission Berkas, Total Kuis Terselenggara.
  - Log Penyimpanan Berkas: Total kapasitas hard disk terpakai untuk berkas tugas/materi (GB).
  - Daftar Pelanggaran / Anomali: Deteksi submission tugas melewati batas kuota atau berkas mencurigakan.

---

### Halaman 5.8: Audit Log Sistem (`/admin/audit`)
- **Fungsi Utama**: Penelusuran jejak rekam digital imutabel (*forensic audit trail*) untuk keamanan, integritas data, dan akreditasi.
- **Komponen & Tampilan**:
  - Filter Rentang Tanggal, Filter Aksi (`LOGIN`, `GRADE_EDIT`, `ATTENDANCE_OVERRIDE`, `DEVICE_OFFLINE`), Filter Aktor Pengguna.
  - Tabel Audit Trail: Stempel Waktu (UTC/WIB), Nama & ID Pengguna, Alamat IP & User-Agent, Jenis Operasi, Entitas Target, Snapshot Perubahan Data (*Diff JSON Before vs After*).
- **Tombol & Aksi Interaktif**:
  - `Lihat Snapshot Data`: Modal detail menampilkan perbandingan objek JSON sebelum dan sesudah perubahan.
  - `Ekspor Audit Trail`: Unduh dokumen audit resmi format CSV / PDF untuk keperluan kepatuhan regulasi.

---

# MATRIKS HAK AKSES DAN MATRIKS NAVIGASI ANTAR PERAN

| Modul Halaman | Admin | Kaprodi | Dosen | Mahasiswa | Ketua Kelas |
|---|:---:|:---:|:---:|:---:|:---:|
| **Dashboard** | Full Metrics | Prodi Metrics | Dosen Metrics | Mhs Metrics | Mhs + Class Metrics |
| **Master Akademik & Kelas** | CRUD Global | View Prodi | CRUD Kelas Diampu | View Kelas Diambil | View Rekan Kelas |
| **KRS & Enrollment** | Full Approval | Monitoring | - | Isi / Ajukan KRS | - |
| **Presensi & Live IoT** | Oversight & Final Approve | Oversight Prodi | Buka Sesi & Koreksi | Presensi & History | **Verifikasi Kejadian** |
| **Perangkat IoT SADITA** | Full Config & Reboot | - | - | - | - |
| **Materi Kuliah (LMS)** | Global Oversight | View Prodi | CRUD Materi | Read & Unduh | Read & Unduh |
| **Tugas & Submission** | Global Oversight | View Prodi | CRUD & Beri Nilai | Upload Submission | Upload Submission |
| **Kuis Interaktif** | Global Oversight | View Prodi | Buat Soal & Kuis | Kerjakan Kuis | Kerjakan Kuis |
| **Penilaian & KHS** | Audit & Lock | View Transkrip | Hitung & Publikasi | View KHS Pribadi | View KHS Pribadi |
| **Audit Logs & Security** | Full Audit Trail | - | - | - | - |
| **SI KOBAR Assistant** | Admin Tools | Prodi Tools | Teaching Tools | Learning Tools | Class Leader Tools |
