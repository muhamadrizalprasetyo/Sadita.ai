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
