# SADITA.ai — Product Scope

**Versi:** 1.0  
**Tanggal:** 2026-10-30

---

## 1. Visi Produk

SADITA.ai adalah **Sistem Absensi Digital Terintegrasi Akademik** yang menggabungkan pengelolaan data akademik, presensi berbasis IoT RFID, LMS (materi, tugas, kuis), penilaian, dashboard operasional, dan pelaporan untuk mendukung proses belajar-mengajar di lingkungan kampus.

---

## 2. Tujuan

1. **Menertibkan presensi** dengan mekanisme otomatis (RFID tap) yang tervalidasi backend, menghilangkan titip tanda tangan dan presensi fiktif.
2. **Menyediakan LMS terpadu** untuk distribusi materi, pengelolaan tugas/kuis, dan pengumpulan submission mahasiswa.
3. **Mengotomasi penilaian** dengan formula bobot yang transparan, komponen yang dapat dikonfigurasi, dan publikasi nilai terkontrol.
4. **Memberikan dashboard operasional** berbasis data aktual kepada Admin, Kaprodi, Dosen, dan Mahasiswa.
5. **Menghasilkan audit trail** lengkap untuk setiap perubahan data penting (presensi, nilai, enrollment, credential).
6. **Mendukung operasional kampus** dengan arsitektur yang aman, dapat ditelusuri, dan siap berkembang.

---

## 3. Ruang Lingkup Pilot

| Aspek | Cakupan |
|---|---|
| **Institusi** | Universitas Insan Pembangunan Indonesia (UNIPI) |
| **Prodi pilot** | S1 Teknologi Informasi |
| **Lingkungan** | Prototype lokal (laptop/PC developer) |
| **User pilot** | 1 Admin, 1 Kaprodi, 3–5 Dosen, 30–60 Mahasiswa |
| **Perangkat IoT** | 1–3 unit ESP32-S3 + RC522 RFID + LCD |
| **Periode** | 1 semester akademik (16 pertemuan per kelas) |
| **Konektivitas** | WiFi lokal kampus / lab |

---

## 4. Di Luar Cakupan (Out of Scope)

| # | Item | Alasan |
|---|---|---|
| 1 | Integrasi dengan SIAKAD resmi UNIPI | Belum ada API, data dimasukkan manual oleh Admin |
| 2 | Multi-kampus / multi-fakultas | Pilot hanya 1 prodi |
| 3 | Cloud deployment | Setelah prototype lolos pengujian E2E |
| 4 | Fingerprint authentication | Hardware belum tersedia; model siap tapi enforcement ditunda |
| 5 | WhatsApp/Telegram/email notification | Setelah alur inti stabil |
| 6 | SI KOBAR sebagai dependency inti | Hanya FAQ/navigasi; bukan blocking path |
| 7 | Mobile native app | Web responsive sudah cukup untuk pilot |
| 8 | Payment / SPP | Bukan domain SADITA |
| 9 | Proses pindah kelas di tengah semester | Skema tidak boleh merusak histori, tapi fitur belum aktif |
| 10 | Analitik prediktif / AI | Phase 2+ |

---

## 5. Aktor Utama

| Aktor | Deskripsi | Jumlah Pilot |
|---|---|---|
| **ADMIN** | Mengelola akun, role, master akademik, enrollment, perangkat IoT, pengaturan, audit | 1 |
| **KAPRODI** | Mengawasi kurikulum, rekap kehadiran/nilai prodi, persetujuan akademik | 1 |
| **DOSEN** | Mengelola kelas, pertemuan, sesi presensi, materi, tugas, kuis, penilaian | 3–5 |
| **MAHASISWA** | Mengakses jadwal, materi, tugas, kuis, presensi, nilai | 30–60 |
| **KETUA KELAS** | Mahasiswa + permission tambahan: roster, monitoring presensi, verifikasi bukti | 1 per kelas |
| **PERANGKAT IoT** | ESP32-S3 yang mengirim event RFID via MQTT | 1–3 unit |

---

## 6. Indikator Sukses Pilot

| # | Indikator | Kriteria Terukur |
|---|---|---|
| IS-1 | Presensi RFID end-to-end | Tap KTM → MQTT → validasi backend → record DB → UI dosen & mahasiswa → feedback perangkat |
| IS-2 | RBAC + scope enforcement | Setiap role hanya akses data yang berhak; unauthorized access ditolak dan tercatat |
| IS-3 | LMS operasional | Dosen upload materi, buat tugas/kuis → mahasiswa akses & submit → dosen nilai |
| IS-4 | Nilai terhitung benar | Formula bobot menghasilkan nilai akhir yang tepat; komponen kosong ditandai |
| IS-5 | Dashboard data aktual | Metrik dashboard berasal dari query database, bukan angka hardcoded |
| IS-6 | Skenario operasional | PO dan dosen pilot dapat menjalankan skenario presensi, LMS, dan nilai tanpa bantuan developer |
| IS-7 | Audit trail | Perubahan presensi, nilai, enrollment, dan credential tercatat di audit log |
| IS-8 | Test coverage | Skenario sukses dan gagal P0 memiliki test otomatis yang lulus |

---

## 7. Batasan dan Asumsi

### Batasan
- Koneksi WiFi tersedia di ruang kelas pilot
- PostgreSQL 18 dan Mosquitto MQTT broker tersedia di mesin developer
- Python 3.14+ dan Node.js 24+ tersedia
- ESP32-S3 + RC522 tersedia minimal 1 unit untuk pengujian

### Asumsi
- Data mahasiswa dan dosen pilot dimasukkan manual oleh Admin (tidak ada impor otomatis dari SIAKAD)
- Satu semester memiliki 16 pertemuan terjadwal per kelas
- Jadwal kelas sudah ditentukan sebelum semester dimulai
- KTM fisik (kartu RFID) tersedia untuk sebagian besar mahasiswa pilot
- Dosen pilot bersedia menggunakan sistem untuk minimal 1 mata kuliah

---

*Dokumen ini akan diperbarui setelah wawancara dosen dan konfirmasi Product Owner.*
