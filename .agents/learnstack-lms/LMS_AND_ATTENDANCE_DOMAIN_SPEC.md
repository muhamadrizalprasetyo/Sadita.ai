# Spesifikasi Domain LMS, Akademik & Mesin Presensi IoT SADITA.ai

Dokumen ini mendefinisikan logika bisnis mendalam (*domain-driven business logic*), skema data, dan aturan alur kerja (*workflows*) untuk ekosistem **Akademik, Presensi IoT Terintegrasi, dan Learning Management System (LMS)** pada SADITA.ai.

---

## 1. Rantai Nilai & Alur Inti Sistem (The Golden Pipeline)

SADITA.ai beroperasi pada alur bisnis sekuensial yang ketat:

```
+-----------------------------------------------------------------------------------------+
| Administrasi Akademik (Prodi, Semester, Matkul, Dosen, Mahasiswa)                       |
|   ↓                                                                                     |
| Rencana Studi (KRS & Enrollment Kelas Mahasiswa)                                        |
|   ↓                                                                                     |
| Struktur Kelas Perkuliahan (Reguler Pagi, Reguler Malam, Shift)                         |
|   ↓                                                                                     |
| Pertemuan Mingguan (Sesi 1 s.d. 16 per Semester)                                        |
|   ├── Presensi IoT (RFID Tap + Biometrik Sidik Jari via ESP32-S3)                       |
|   ├── Pembelajaran LMS (Distribusi Materi Kuliah & Diskusi)                             |
|   └── Evaluasi Tugas (Pengumpulan Tugas, Rubrik, & Feedback)                            |
|   ↓                                                                                     |
| Mesin Penilaian Terpadu (Grading Engine: Presensi 15% + Tugas 25% + UTS 25% + UAS 35%)  |
|   ↓                                                                                     |
| Analitik Akademik & Pelaporan Kemajuan Belajar                                          |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Domain 1: Administrasi Akademik & Pengelolaan Kelas

### 2.1 Manajemen Mode Perkuliahan
Sistem mendukung fleksibilitas operasional perguruan tinggi modern dengan membagi kelas berdasarkan mode kuliah:
1. **REGULER PAGI**: Sesi perkuliahan standar jam kerja (07:30 - 17:00).
2. **REGULER MALAM**: Sesi perkuliahan untuk mahasiswa kelas karyawan (17:30 - 22:00).
3. **SHIFT**: Fleksibilitas rotasi kehadiran bagi mahasiswa pekerja dengan jadwal shift pabrik/kantor.

*Aturan Bisnis:*
- Satu mata kuliah dapat memiliki beberapa rombongan belajar (kelas) dengan dosen pengampu berbeda dan jadwal berbeda.
- Mahasiswa hanya dianggap sah berada di dalam kelas jika telah terdaftar pada Kartu Rencana Studi (**KRS**) yang telah disetujui (*Approved*) oleh Dosen Penasihat Akademik (PA) / Kaprodi.

### 2.2 Status Kepemilikan KTM (Kartu Tanda Mahasiswa)
Setiap mahasiswa memiliki status identitas fisik yang dipetakan menggunakan Enum tegas:
- `BELUM_MEMILIKI_KTM`: Mahasiswa baru atau belum melakukan pencetakan fisik kartu RFID.
- `KTM_TERDAFTAR`: Kartu aktif dan UID RFID terikat sah ke database mahasiswa.
- `KTM_TIDAK_DIBAWA`: Mahasiswa memiliki kartu aktif, namun lupa membawa saat sesi berlangsung (membutuhkan presensi manual dosen atau kode darurat).
- `KTM_HILANG`: Kartu dilaporkan hilang; UID RFID lama otomatis dinonaktifkan di sistem untuk mencegah penyalahgunaan.

---

## 3. Domain 2: Mesin Presensi IoT & Alur Kerja Terintegrasi

Perangkat keras ESP32-S3 dengan modul RFID RC522 dan sensor sidik jari optik bertindak sebagai stasiun autentikasi presensi fisik di pintu atau meja dosen.

### 3.1 Alur Presensi Fisik Real-Time (End-to-End)
1. **Mahasiswa Melakukan Tap Kartu**: Mahasiswa menempelkan kartu KTM RFID ke modul RC522 pada ESP32.
2. **Publikasi MQTT**: ESP32 membaca UID kartu dan mengirim payload terenkripsi ke MQTT Broker Mosquitto pada topik:
   `sadita/devices/{device_id}/attendance/tap`
3. **Penerimaan & Validasi Backend**:
   - Backend memverifikasi tanda tangan HMAC-SHA256 dan mencegah replay attack.
   - Backend mencari profil mahasiswa berdasarkan UID kartu.
   - Backend memeriksa penugasan ruangan perangkat (`device_assignment`) terhadap jadwal sesi perkuliahan aktif pada jam tersebut.
   - Backend memverifikasi apakah mahasiswa telah terdaftar pada KRS kelas yang bersangkutan.
4. **Verifikasi Sidik Jari (Two-Factor Biometric)**:
   - Jika verifikasi kartu valid, backend mengirim sinyal ke ESP32 untuk meminta tempel sidik jari.
   - Mahasiswa menempelkan jari ke sensor sidik jari optik.
   - ESP32 mencocokkan template lokal / slot ID sidik jari dan mengirim konfirmasi kecocokan ke backend.
5. **Pencatatan Presensi & Logika Keterlambatan**:
   - Jika waktu tap <= `start_time + tolerance_minutes` (default: 15 menit), status dicatat sebagai **`HADIR`**.
   - Jika waktu tap > `start_time + tolerance_minutes`, status dicatat sebagai **`TERLAMBAT`**.
6. **Umpan Balik Hardware**: Backend membalas via MQTT ke ESP32 untuk menampilkan nama mahasiswa dan status pada LCD 20x4 serta membunyikan nada buzzer sukses (2 bip pendek).
7. **Pembaruan Live Monitor Dosen**: Web browser dosen yang membuka halaman presensi menerima event WebSocket/SSE dan memperbarui daftar hadir secara instan tanpa reload halaman.

### 3.2 Alur Presensi Sesi Pengganti & Perkuliahan Daring
Jika dosen menyelenggarakan sesi kuliah pengganti di luar jadwal rutin atau secara daring:
1. Dosen / Admin membuat jadwal sesi pengganti di sistem dengan status `PENDING_VERIFIKASI`.
2. Mahasiswa menghadiri perkuliahan dan mencatatkan kehadiran melalui portal web SADITA.
3. **Peran Ketua Kelas**:
   - Ketua kelas melihat daftar pengajuan kehadiran sesi pengganti pada menu khusus `Ketua Kelas → Verifikasi Sesi Pengganti`.
   - Ketua kelas memvalidasi bahwa sesi pengganti benar-benar terlaksana dan mahasiswa yang bersangkutan memang hadir.
   - Ketua kelas menandatangani approval verifikasi kejadian (*event occurrence confirmation*). **Ketua kelas dilarang mengubah status presensi secara arbitrer**.
4. **Final Approval oleh Admin / Staff Resmi**:
   - Data yang telah diverifikasi ketua kelas masuk ke antrean persetujuan Admin/Kaprodi.
   - Setelah disetujui (*Approved*), status presensi resmi terkunci di basis data.

---

## 4. Domain 3: Learning Management System (LMS)

LMS pada SADITA.ai terstruktur secara ketat berdasarkan konteks akademik:

```
Mata Kuliah
└── Rombongan Belajar / Kelas
    └── Sesi Pertemuan (1 s.d. 16)
        ├── Status Presensi Pertemuan
        ├── Distribusi Materi Kuliah (PDF, Dokumen, Video Link, Slide)
        └── Penugasan / Tugas Kuliah
            └── Submission Berkas Mahasiswa (Status, Nilai, Catatan Dosen)
```

### 4.1 Aturan Pengumpulan Tugas (Assignment Submission)
1. **Batas Waktu (*Deadline*)**: Setiap tugas memiliki tanggal dan jam penutupan yang jelas.
2. **Keterlambatan Pengumpulan**:
   - Sistem mencatat waktu pengumpulan dengan presisi detik.
   - Jika dikumpulkan melewati batas waktu, submission diberi label mencolok `TERLAMBAT (Late Submission)` beserta durasi keterlambatan.
   - Dosen dapat mengonfigurasi persentase penalti nilai otomatis untuk pengumpulan terlambat.
3. **Format Berkas & Batasan Ukuran**:
   - Sistem memvalidasi ekstensi berkas yang diizinkan (misal: PDF, ZIP, DOCX) dan membatasi ukuran maksimal (default: 10 MB).
   - Seluruh berkas diunggah melalui endpoint aman dengan verifikasi MIME-type asli (*magic bytes*), bukan sekadar memeriksa ekstensi nama file.

---

## 5. Domain 4: Mesin Penilaian Terpadu (Grading Engine)

Skor akhir mahasiswa dihitung secara otomatis berdasarkan bobot komponen yang dikonfigurasi per mata kuliah:

$$\text{Nilai Akhir} = (W_{\text{absensi}} \times S_{\text{absensi}}) + (W_{\text{tugas}} \times S_{\text{tugas}}) + (W_{\text{uts}} \times S_{\text{uts}}) + (W_{\text{uas}} \times S_{\text{uas}})$$

### 5.1 Skala Konversi Nilai Huruf & Bobot Indeks Prestasi (IP)
Konversi mengacu pada standar akademik nasional:
- `A`  : Skor $\ge 85.0$ (Bobot: 4.00) — Sangat Memuaskan
- `A-` : Skor $80.0 - 84.9$ (Bobot: 3.70)
- `B+` : Skor $75.0 - 79.9$ (Bobot: 3.30)
- `B`  : Skor $70.0 - 74.9$ (Bobot: 3.00) — Memuaskan
- `B-` : Skor $65.0 - 69.9$ (Bobot: 2.70)
- `C+` : Skor $60.0 - 64.9$ (Bobot: 2.30)
- `C`  : Skor $55.0 - 59.9$ (Bobot: 2.00) — Cukup
- `D`  : Skor $45.0 - 54.9$ (Bobot: 1.00) — Kurang
- `E`  : Skor $< 45.0$ (Bobot: 0.00) — Tidak Lulus (Wajib Mengulang)

*Syarat Kelulusan Presensi:*
Mahasiswa wajib memiliki persentase kehadiran minimal **75%** dari total pertemuan yang terlaksana agar berhak mengikuti Ujian Akhir Semester (UAS) dan memperoleh nilai akhir.
