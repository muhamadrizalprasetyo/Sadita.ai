# Product Requirements Document (PRD)
# SADITA.ai — Sistem Akademik Terintegrasi

> **Status dokumen:** Draft hidup (*living document*)  
> **Versi:** 0.1  
> **Tanggal:** 9 Oktober 2026  
> **Status produk saat dokumen dibuat:** Local Runnable Prototype  
> **Target awal:** Program Studi Teknologi Informasi, Universitas Insan Pembangunan Indonesia (UNIPI)

---

## 1. Ringkasan Produk

**SADITA.ai** adalah sistem akademik terintegrasi yang dirancang untuk menghubungkan pengelolaan kegiatan akademik, pembelajaran melalui Learning Management System (LMS), presensi berbasis Internet of Things (IoT), dan AI Assistant bernama **SI KOBAR** dalam satu ekosistem.

SADITA.ai bukan sekadar LMS dan bukan sekadar aplikasi presensi. Sistem ini dirancang agar aktivitas akademik saling terhubung: mata kuliah memiliki kelas dan pertemuan; pertemuan dapat berisi materi, tugas, kuis, dan sesi presensi; data yang dihasilkan dapat ditampilkan kepada pengguna sesuai peran dan kewenangannya.

SI KOBAR ditujukan menjadi asisten terintegrasi yang membantu pengguna **Chat → Understand → Analyze → Navigate → Assist**. Dalam prototype saat ini, SI KOBAR masih berupa asisten berbasis aturan/keyword dan belum merupakan agent berbasis LLM yang terintegrasi penuh.

### 1.1 Pernyataan Produk

> Satu lingkungan sistem untuk mengelola, menjalankan, dan memantau aktivitas akademik—dengan pembelajaran, presensi IoT, dan bantuan informasi yang terhubung serta dikendalikan oleh hak akses pengguna.

### 1.2 Masalah yang Ingin Diselesaikan

1. Aktivitas akademik dapat tersebar di sejumlah media atau sistem yang berbeda.
2. Materi, tugas, kuis, presensi, dan nilai tidak selalu terhubung dengan konteks mata kuliah serta pertemuan yang sama.
3. Pencatatan presensi memerlukan alur yang menghubungkan identitas mahasiswa, sesi perkuliahan, perangkat, dan catatan akademik.
4. Pengguna membutuhkan cara praktis untuk menemukan informasi akademik yang menjadi hak aksesnya.
5. Data akademik berpotensi belum dimanfaatkan secara optimal untuk pemantauan aktivitas pembelajaran.

Pernyataan masalah di atas merupakan dasar kebutuhan produk, bukan klaim bahwa semua kondisi tersebut telah dibuktikan pada seluruh proses UNIPI.

### 1.3 Tujuan Produk

- Mengintegrasikan pengelolaan akademik dan aktivitas pembelajaran dalam satu aplikasi.
- Mengaitkan materi, tugas, kuis, presensi, dan hasil pembelajaran dengan kelas serta pertemuan yang relevan.
- Menyediakan presensi berbasis RFID/IoT yang berkomunikasi melalui MQTT.
- Menyediakan akses berbeda untuk Admin, Kaprodi, Dosen, Ketua Kelas, dan Mahasiswa.
- Mengembangkan SI KOBAR sebagai lapisan bantuan informasi dan interaksi yang mematuhi otorisasi sistem.
- Menyediakan fondasi yang dapat diuji dan dikembangkan bertahap dari prototype lokal menuju pilot program studi.

### 1.4 Bukan Tujuan pada Tahap Ini

- Menggantikan seluruh sistem informasi akademik resmi kampus tanpa proses integrasi dan persetujuan institusi.
- Menjadi sistem siap produksi atau siap dipakai seluruh kampus pada versi prototype.
- Membiarkan AI menetapkan keputusan akademik, nilai final, atau kehadiran tanpa aturan backend dan kewenangan manusia.
- Menjamin kompatibilitas dengan seluruh perangkat IoT atau seluruh proses akademik kampus.
- Membangun fitur pembayaran, marketplace, atau checkout.

---

## 2. Pengguna dan Peran

Sistem wajib menerapkan **role-based access control (RBAC)** dan membatasi data berdasarkan lingkup akses. Memiliki suatu role tidak otomatis memberi akses ke seluruh data pada semua program studi atau kelas.

### 2.1 Admin

**Tujuan:** menjaga operasional dan konfigurasi sistem.

Kebutuhan utama:
- Mengelola akun dan peran pengguna.
- Mengelola data akademik dasar sesuai kewenangan.
- Mengelola atau memantau perangkat IoT.
- Memantau status sistem dan catatan operasional.
- Menangani konfigurasi yang memang menjadi kewenangan administrator.

### 2.2 Kaprodi

**Tujuan:** memantau aktivitas akademik di lingkup program studi.

Kebutuhan utama:
- Melihat data dosen dan mahasiswa pada lingkup prodi.
- Melihat struktur kurikulum dan informasi mata kuliah yang menjadi kewenangannya.
- Memantau ringkasan kegiatan akademik dan presensi.
- Tidak otomatis memiliki kewenangan superadmin, konfigurasi teknis, atau akses lintas-prodi.

### 2.3 Dosen

**Tujuan:** menjalankan dan mengevaluasi kegiatan pembelajaran.

Kebutuhan utama:
- Melihat kelas dan mata kuliah yang diampu.
- Mengelola pertemuan, materi, tugas, dan kuis.
- Membuka dan memantau sesi presensi.
- Memeriksa pengumpulan tugas dan mengelola penilaian sesuai aturan.
- Melihat ringkasan aktivitas pembelajaran pada kelas yang diampu.

### 2.4 Mahasiswa

**Tujuan:** mengikuti kegiatan pembelajaran dan melihat informasi akademiknya sendiri.

Kebutuhan utama:
- Melihat mata kuliah dan jadwal yang diikuti.
- Mengakses materi dan aktivitas pembelajaran.
- Melihat serta mengumpulkan tugas.
- Mengerjakan kuis yang tersedia.
- Melihat riwayat presensi dan nilai miliknya sendiri.
- Menggunakan SI KOBAR untuk mencari dan memahami informasi yang boleh diakses.

### 2.5 Ketua Kelas

**Tujuan:** membantu operasional kelas dalam ruang lingkup yang diberikan.

Kebutuhan utama:
- Melihat jadwal dan daftar rekan satu kelas.
- Membantu pemantauan informasi presensi sesuai kewenangan.
- Melaksanakan fungsi operasional kelas yang ditugaskan.

Ketua kelas merupakan **penugasan pada kelas tertentu**, bukan peran yang memberi akses global. Ketua kelas tidak boleh otomatis mengubah nilai, mengubah data presensi final, atau mengakses data privat mahasiswa di luar kebutuhan dan izin yang ditetapkan.

---

## 3. Ruang Lingkup Produk

### 3.1 Termasuk dalam Ruang Lingkup

1. Autentikasi dan pengelolaan sesi pengguna.
2. Pembatasan akses berdasarkan role dan lingkup sumber daya.
3. Data akademik dasar: program studi, tahun akademik, semester, mata kuliah, kelas, dosen, mahasiswa, dan penugasan kelas.
4. Struktur pembelajaran: pertemuan, materi, tugas, submission, kuis, pertanyaan, pilihan jawaban, dan penilaian.
5. Presensi melalui web serta integrasi perangkat IoT berbasis RFID.
6. Komunikasi IoT melalui MQTT, termasuk status perangkat dan peristiwa presensi.
7. Riwayat dan monitoring presensi sesuai hak akses.
8. Dashboard berbeda sesuai role.
9. SI KOBAR sebagai bantuan informasi, analisis, dan navigasi secara bertahap.
10. Audit event untuk aktivitas penting serta kegagalan/penolakan yang perlu ditelusuri.

### 3.2 Di Luar Ruang Lingkup Prototype

- Integrasi otomatis dengan seluruh sistem resmi kampus.
- Aplikasi native Android/iOS.
- Integrasi fingerprint yang dinyatakan siap operasional sebelum perangkat dan alurnya benar-benar tersedia serta diuji.
- AI agent yang melakukan tindakan berdampak tanpa konfirmasi.
- Analitik prediktif yang menjanjikan akurasi tertentu tanpa evaluasi data.
- Deployment produksi, high availability, disaster recovery, dan pemenuhan regulasi institusi secara penuh.

---

## 4. Struktur Akademik dan Model Konseptual

Relasi konseptual utama:

```text
Program Studi
└── Tahun Akademik
    └── Semester
        └── Mata Kuliah
            └── Kelas
                ├── Dosen Pengampu
                ├── Mahasiswa Terdaftar
                └── Pertemuan
                    ├── Materi / Video
                    ├── Tugas
                    │   └── Submission
                    ├── Kuis
                    │   ├── Pertanyaan
                    │   └── Pengerjaan Kuis
                    ├── Presensi
                    │   ├── Sesi Presensi
                    │   └── Catatan Presensi
                    └── Aktivitas Pembelajaran
```

### Aturan Domain

- Presensi harus terkait dengan sesi dan kelas/pertemuan yang benar, bukan sekadar menjadi catatan global tanpa konteks.
- Materi, tugas, dan kuis harus mempunyai relasi yang jelas ke mata kuliah, kelas, atau pertemuan sesuai rancangan domain.
- Dosen hanya mengelola kelas yang ditugaskan kepadanya.
- Mahasiswa hanya melihat data pribadinya dan materi/aktivitas kelas yang diikuti.
- Ketua kelas hanya memperoleh fungsi tambahan pada kelas yang ditugaskan.
- Kaprodi dibatasi pada lingkup program studi yang menjadi tanggung jawabnya.

---

## 5. Kebutuhan Fungsional

Prioritas menggunakan definisi:
- **P0 — Wajib untuk prototype lokal:** diperlukan agar alur dasar dapat dicoba.
- **P1 — Penting untuk prototype terintegrasi:** perlu diselesaikan sebelum pilot terbatas.
- **P2 — Pengembangan lanjutan:** dapat dilakukan setelah alur inti stabil.

Status pada tabel menunjukkan kondisi berdasarkan laporan lokal tertanggal 7 Oktober 2026 dan **bukan verifikasi ulang atas source code saat ini**.

### 5.1 Autentikasi dan Akses

| ID | Prioritas | Kebutuhan | Kriteria penerimaan | Status yang dilaporkan |
|---|---|---|---|---|
| FR-AUTH-01 | P0 | Pengguna login dengan email dan password | Kredensial valid menghasilkan sesi/token; kredensial invalid ditolak | API login dilaporkan berhasil untuk 5 role |
| FR-AUTH-02 | P0 | Pengguna diarahkan ke area sesuai role | Role tidak mendapatkan dashboard role lain melalui manipulasi URL saja | Route tiap role tersedia; seluruh skenario akses UI belum diverifikasi ulang |
| FR-AUTH-03 | P0 | Endpoint backend memeriksa otorisasi | Permintaan tanpa autentikasi/izin ditolak oleh backend | RBAC dilaporkan memiliki pengujian positif/negatif |
| FR-AUTH-04 | P1 | Lingkup akses dibatasi berdasarkan kelas/prodi | Pengguna tidak dapat membaca atau mengubah data di luar lingkupnya | Aturan sebagian dilaporkan diuji |
| FR-AUTH-05 | P1 | Aktivitas penting dapat diaudit | Login/penolakan/perubahan penting tercatat sesuai kebijakan | Audit service tersedia menurut laporan |

### 5.2 Pengelolaan Akademik

| ID | Prioritas | Kebutuhan | Kriteria penerimaan | Status yang dilaporkan |
|---|---|---|---|---|
| FR-ACAD-01 | P0 | Mengelola program studi, tahun akademik, dan semester | Data dapat dibuat/dilihat/diubah oleh role berwenang | API/model tersedia; cakupan UI perlu diperiksa |
| FR-ACAD-02 | P0 | Mengelola mata kuliah dan kelas | Mata kuliah dapat dikaitkan dengan semester dan kelas | API/model tersedia |
| FR-ACAD-03 | P0 | Mengaitkan dosen ke kelas | Dosen hanya mengelola kelas yang ditugaskan | API/model tersedia |
| FR-ACAD-04 | P0 | Mengaitkan mahasiswa ke kelas melalui enrollment | Mahasiswa terdaftar dapat mengakses kelas terkait; yang tidak terdaftar ditolak | Enrollment ada; bug enum tertentu dilaporkan telah diperbaiki |
| FR-ACAD-05 | P1 | Mengelola jadwal dan pertemuan | Pertemuan tampil sesuai kelas/mata kuliah dan jadwal | Sebagian UI tersedia; verifikasi manual dibutuhkan |
| FR-ACAD-06 | P1 | Penugasan Ketua Kelas per kelas | Ketua kelas hanya mendapat kewenangan pada kelas yang ditugaskan | Akun seed dilaporkan ditambahkan; cakupan assignment perlu dicek |

### 5.3 Learning Management System (LMS)

| ID | Prioritas | Kebutuhan | Kriteria penerimaan | Status yang dilaporkan |
|---|---|---|---|---|
| FR-LMS-01 | P0 | Dosen mengelola materi | Materi dapat dibuat, dibaca, dan dikaitkan dengan kelas/pertemuan | Alur materi dilaporkan berhasil pada audit sebelumnya |
| FR-LMS-02 | P0 | Dosen membuat tugas | Tugas menampilkan instruksi dan tenggat yang konsisten | Pembuatan tugas dilaporkan berhasil |
| FR-LMS-03 | P0 | Mahasiswa melihat tugas miliknya | Daftar dibatasi pada kelas yang diikuti | UI tersedia; perlu manual test |
| FR-LMS-04 | P0 | Mahasiswa mengumpulkan tugas | Submission tersimpan dan dapat diakses dosen yang berwenang | Pernah gagal karena enum status enrollment; fix telah dilaporkan, perlu dicoba langsung |
| FR-LMS-05 | P1 | Dosen menilai submission | Nilai/feedback tersimpan dan terlihat sesuai izin | Backend grading dilaporkan ada; E2E perlu diuji |
| FR-LMS-06 | P0 | Dosen membuat kuis | Kuis dapat dikonfigurasi dan dipublikasikan | Endpoint/UI tersedia; flow belum diverifikasi penuh |
| FR-LMS-07 | P0 | Dosen membuat pertanyaan kuis | Pertanyaan dapat ditambahkan ke kuis terkait | Schema `quiz_id` dilaporkan telah diubah agar opsional pada body bila path sudah menyediakan ID |
| FR-LMS-08 | P0 | Mahasiswa mengerjakan kuis | Hanya mahasiswa terdaftar dan kuis yang aktif/published yang dapat dikerjakan | Sebagian validasi dilaporkan ada; E2E belum penuh |
| FR-LMS-09 | P1 | Sistem menilai kuis di backend | Jawaban dinilai oleh backend; kunci jawaban tidak terkirim ke client | Backend grading dan proteksi kunci dilaporkan tersedia |
| FR-LMS-10 | P1 | Batas percobaan dan waktu kuis divalidasi | Percobaan ganda ditangani; batas waktu penting divalidasi server-side | Max attempts dilaporkan ada; timer server-side masih menjadi gap |
| FR-LMS-11 | P1 | Mahasiswa melihat nilai/KHS | Data berasal dari API nilai, bukan angka contoh | Halaman KHS dilaporkan ada; integrasi grading belum selesai |

### 5.4 Presensi Berbasis IoT

| ID | Prioritas | Kebutuhan | Kriteria penerimaan | Status yang dilaporkan |
|---|---|---|---|---|
| FR-ATT-01 | P0 | Dosen membuka sesi presensi | Sesi terkait kelas/pertemuan yang benar dan memiliki status yang jelas | Pembukaan sesi dilaporkan berhasil diuji |
| FR-ATT-02 | P0 | Mahasiswa diidentifikasi melalui RFID | UID dipetakan ke identitas yang terdaftar; UID tidak dikenal ditolak | Lookup dan penolakan UID tak dikenal dilaporkan berhasil di simulasi |
| FR-ATT-03 | P0 | Backend memvalidasi sesi dan status sesi | Sesi tertutup/tidak aktif tidak menerima presensi | Validasi dilaporkan tersedia |
| FR-ATT-04 | P0 | Presensi tidak tercatat ganda akibat tap berulang | Permintaan berulang untuk kondisi sama idempotent/ditangani dengan aturan jelas | Idempotency dilaporkan lulus pada audit |
| FR-ATT-05 | P0 | Catatan presensi disimpan ke database | Presensi berhasil tersimpan dengan mahasiswa, sesi, waktu, dan sumber yang benar | Pernah terhalang bug enum; fix telah dilaporkan, perlu dicoba lokal |
| FR-ATT-06 | P1 | Riwayat presensi tampil untuk mahasiswa | Mahasiswa melihat status kehadirannya sendiri per sesi/pertemuan | Halaman status ada, tetapi status individual dilaporkan belum lengkap |
| FR-ATT-07 | P1 | Dosen memantau presensi kelas | Dosen melihat peserta dan status sesi untuk kelas yang diampu | Endpoint/UI sebagian tersedia |
| FR-ATT-08 | P1 | Ketua kelas membantu monitoring | Fitur terbatas pada kelas penugasannya dan tidak mengubah catatan final tanpa izin | Perlu verifikasi aturan bisnis dan UI |

### 5.5 IoT dan MQTT

| ID | Prioritas | Kebutuhan | Kriteria penerimaan | Status yang dilaporkan |
|---|---|---|---|---|
| FR-IOT-01 | P0 | Perangkat dapat mengirim status/heartbeat melalui MQTT | Backend mengenali device ID dan memperbarui status yang diterima | Simulasi heartbeat dilaporkan berhasil |
| FR-IOT-02 | P0 | Peristiwa tap RFID diterima backend | Pesan dapat diproses dan hasilnya diaudit | MQTT simulasi dilaporkan menerima pesan |
| FR-IOT-03 | P0 | Sistem memberi umpan balik ke perangkat | Pesan valid/invalid menghasilkan respons sesuai protokol perangkat | Perintah reject/fingerprint prompt dilaporkan di simulasi |
| FR-IOT-04 | P1 | Perangkat diidentifikasi dan diotorisasi | Pesan dari perangkat tidak dikenal tidak boleh mengubah presensi | Perlu konfirmasi konfigurasi autentikasi broker dan validasi device |
| FR-IOT-05 | P1 | Payload MQTT divalidasi | Payload malformed, duplikat, dan timestamp tidak valid ditangani aman | Sebagian perilaku diuji; seluruh kasus belum dibuktikan |
| FR-IOT-06 | P1 | Alur dari ESP32 fisik sampai database berfungsi | Tap pada hardware tercermin sebagai catatan presensi yang benar di UI/API | Hardware nyata belum diuji menurut laporan |

Contoh topik MQTT yang menjadi konvensi rancangan dan harus diselaraskan dengan implementasi aktual:

```text
sadita/device/{deviceId}/status
sadita/device/{deviceId}/attendance/tap
sadita/device/{deviceId}/command
sadita/device/{deviceId}/feedback
```

### 5.6 SI KOBAR — AI Assistant

SI KOBAR dikembangkan bertahap. Prototype rule-based tidak boleh dipresentasikan sebagai LLM agent yang sudah aktif.

| ID | Prioritas | Kebutuhan | Kriteria penerimaan | Status yang dilaporkan |
|---|---|---|---|---|
| FR-KOBAR-01 | P0 | Pengguna membuka UI KOBAR | Komponen chat dapat digunakan dalam lingkup aplikasi | UI dilaporkan tersedia |
| FR-KOBAR-02 | P0 | Jawaban prototype menunjukkan batas kemampuannya | Respons tidak mengklaim menjalankan tindakan/API yang tidak dilakukan | Saat ini rule-based; perlu penyajian yang transparan |
| FR-KOBAR-03 | P1 | KOBAR memahami konteks pengguna dan role | Konteks role/kelas diberikan ke tool secara aman; tidak mempercayai role dari prompt pengguna | Belum tersedia sebagai agent terintegrasi penuh |
| FR-KOBAR-04 | P1 | KOBAR menggunakan tool/API resmi SADITA | Tool memanggil service/API berotorisasi, bukan query database secara langsung | Tool registry/API KOBAR dilaporkan belum ada |
| FR-KOBAR-05 | P1 | KOBAR menjawab data akademik pengguna | Contoh: tugas belum selesai, riwayat presensi, jadwal, atau nilai milik pengguna | Belum terintegrasi penuh |
| FR-KOBAR-06 | P1 | KOBAR membantu navigasi | Perintah navigasi membuka rute yang benar setelah validasi | Navigasi otomatis dilaporkan belum ada |
| FR-KOBAR-07 | P1 | Tindakan yang berdampak memerlukan konfirmasi | KOBAR meminta konfirmasi sebelum mengirim submission atau melakukan perubahan penting | Workflow assist belum ada |
| FR-KOBAR-08 | P1 | Otorisasi backend selalu berlaku | KOBAR tidak dapat melewati RBAC atau membuka data role lain | Harus menjadi aturan desain wajib |
| FR-KOBAR-09 | P2 | Integrasi LLM/provider | Provider dapat dikonfigurasi melalui environment dan kegagalannya ditangani dengan aman | Belum terintegrasi menurut laporan |
| FR-KOBAR-10 | P2 | Bantuan berdasarkan materi pembelajaran | Jawaban terkait materi merujuk konten yang tersedia dan menyatakan ketidakpastian bila sumber tidak ada | Belum dibuktikan |

Arsitektur target:

```text
Pengguna
   ↓
SI KOBAR (intent + konteks)
   ↓
Tool/API yang diizinkan
   ↓
Autentikasi dan RBAC SADITA
   ↓
Service domain SADITA
   ↓
Data yang diizinkan
   ↓
Respons / navigasi / tindakan dengan konfirmasi
```

**Aturan wajib:** KOBAR tidak diberi akses langsung ke database/SQL/ORM untuk mengakali otorisasi. Semua pengambilan atau perubahan data harus melewati service/API dan pemeriksaan izin SADITA.

---

## 6. Navigasi dan Inventaris Route

Laporan lokal sebelumnya menyatakan build menghasilkan 45 route, tetapi daftar lengkap route aktual belum disertakan dalam laporan. Karena itu, jumlah 45 harus diverifikasi dari direktori `frontend/app` dan hasil build aktual.

Route berikut **disebut secara eksplisit** dalam laporan lokal yang tersedia:

| Role | Route yang disebut | Tujuan |
|---|---|---|
| Umum | `/login` | Login |
| Admin | `/admin/dashboard` | Dashboard admin |
| Admin | `/admin/akademik` | Pengelolaan akademik |
| Admin | `/admin/presensi` | Monitoring presensi |
| Admin | `/admin/lms` | Pengelolaan/monitoring LMS |
| Admin | `/admin/perangkat` | Manajemen perangkat IoT |
| Kaprodi | `/kaprodi/dashboard` | Dashboard prodi |
| Kaprodi | `/kaprodi/dosen` | Data dosen |
| Kaprodi | `/kaprodi/mahasiswa` | Data mahasiswa |
| Kaprodi | `/kaprodi/kurikulum` | Kurikulum |
| Kaprodi | `/kaprodi/presensi` | Monitoring presensi prodi |
| Dosen | `/dosen/dashboard` | Dashboard dosen |
| Dosen | `/dosen/kelas` | Kelas yang diampu |
| Dosen | `/dosen/presensi` | Presensi kelas |
| Dosen | `/dosen/materi` | Materi |
| Dosen | `/dosen/tugas` | Tugas |
| Dosen | `/dosen/kuis` | Kuis |
| Dosen | `/dosen/nilai` | Nilai |
| Ketua Kelas | `/ketua-kelas/dashboard` | Dashboard ketua kelas |
| Ketua Kelas | `/ketua-kelas/presensi` | Presensi |
| Ketua Kelas | `/ketua-kelas/rekan` | Rekan kelas |
| Ketua Kelas | `/ketua-kelas/jadwal` | Jadwal |
| Mahasiswa | `/mahasiswa/dashboard` | Dashboard mahasiswa |
| Mahasiswa | `/mahasiswa/kuis` | Kuis mahasiswa |
| Mahasiswa | `/mahasiswa/mata-kuliah` | Daftar mata kuliah |
| Mahasiswa | `/mahasiswa/tugas` | Tugas mahasiswa |
| Mahasiswa | `/mahasiswa/presensi` | Presensi mahasiswa |
| Mahasiswa | `/mahasiswa/nilai` | Nilai/KHS |
| Mahasiswa | `/mahasiswa/jadwal` | Jadwal mahasiswa |
| Mahasiswa | `/mahasiswa/presensi/verifikasi` | Tampilan status/riwayat presensi |

Daftar di atas adalah route yang dapat dilacak dari laporan, bukan jaminan seluruh route yang ada. **Jangan menambahkan route yang diperkirakan ke inventaris faktual tanpa memeriksa source code.** Route detail materi, detail tugas, profil, dan route lainnya hanya boleh dicantumkan setelah keberadaannya terverifikasi.

---

## 7. Kebutuhan Nonfungsional

| ID | Area | Persyaratan |
|---|---|---|
| NFR-01 | Keamanan | Semua endpoint privat memerlukan autentikasi dan pemeriksaan izin di backend. |
| NFR-02 | Privasi | Pengguna hanya dapat melihat data pribadi atau data dalam lingkup kewenangannya. |
| NFR-03 | Integritas data | Nilai, enrollment, dan presensi divalidasi di server; frontend bukan sumber kebenaran. |
| NFR-04 | Keandalan | Error koneksi database, MQTT, atau provider AI ditangani dengan pesan yang jelas dan tidak membocorkan rahasia. |
| NFR-05 | Auditabilitas | Perubahan penting dan kejadian perangkat yang relevan dapat ditelusuri. |
| NFR-06 | Konfigurasi | Rahasia seperti password database, JWT secret, dan API key disimpan melalui environment/config secret, bukan source code. |
| NFR-07 | Pemeliharaan | Perubahan skema database harus memiliki strategi migrasi yang dapat direproduksi. |
| NFR-08 | Konsistensi UI | Placeholder tidak boleh disajikan sebagai data nyata. Data kosong harus dibedakan dari error dan dari angka nol. |
| NFR-09 | Aksesibilitas dasar | Form memiliki label, validasi yang jelas, status loading, dan pesan error yang dapat dipahami. |
| NFR-10 | Skalabilitas | Domain, role, dan device dirancang agar dapat diperluas bertahap tanpa melemahkan otorisasi. |
| NFR-11 | Observabilitas | Kegagalan penting dapat ditemukan melalui log yang cukup tanpa mencatat password, token, atau data sensitif yang tidak diperlukan. |
| NFR-12 | Kompatibilitas tahap awal | Prototype dapat dijalankan di lingkungan pengembangan Windows yang digunakan tim. |

Belum ditetapkan SLA, target throughput, target latensi numerik, backup schedule, dan target pemulihan. Nilai tersebut perlu disepakati sebelum pilot/produksi.

---

## 8. Prinsip Keamanan dan Aturan Bisnis

1. **Server is authoritative.** Nilai, batas percobaan, status presensi, hak akses, dan validitas sesi harus diperiksa di backend.
2. **Least privilege.** Beri pengguna izin minimum yang diperlukan untuk tugasnya.
3. **Role bukan satu-satunya scope.** Akses tetap dibatasi berdasarkan prodi, kelas, enrollment, kepemilikan submission, dan penugasan Ketua Kelas.
4. **Tidak mempercayai input client.** Role, student ID, class ID, nilai, status presensi, dan kepemilikan data harus divalidasi oleh backend.
5. **Idempotency presensi.** Tap berulang tidak boleh menciptakan catatan hadir ganda yang tidak sesuai aturan.
6. **Validasi waktu/sesi.** Presensi harus terkait sesi yang valid; kebijakan toleransi waktu harus ditentukan dan diterapkan konsisten.
7. **Keamanan MQTT.** Device ID, autentikasi/otorisasi broker, validasi payload, dan penanganan perangkat tidak dikenal harus dipertimbangkan sebelum penggunaan nyata.
8. **KOBAR mengikuti RBAC.** AI tidak dapat memperluas hak akses melalui instruksi percakapan.
9. **Konfirmasi tindakan.** Perubahan berdampak—misalnya mengirim sesuatu atau mengubah data—memerlukan konfirmasi yang sesuai.
10. **Jangan masukkan rahasia ke repository.** Gunakan `.env` lokal yang tidak di-commit dan siapkan contoh konfigurasi tanpa nilai rahasia.

---

## 9. Status Produk Saat Ini

Ringkasan ini diambil dari laporan **SADITA.ai — LOCAL RUNNABLE Status Report bertanggal 7 Oktober 2026** yang diberikan dalam percakapan. Kondisi dapat berubah setelah perbaikan lokal.

### 9.1 Dilaporkan Berjalan

- Frontend Next.js di `http://localhost:3000`.
- Backend FastAPI di `http://127.0.0.1:8000`.
- Dokumentasi API di `http://127.0.0.1:8000/docs`.
- PostgreSQL di `localhost:5433/sadita_db`.
- Mosquitto/MQTT tersedia di `localhost:1883`.
- Endpoint login dilaporkan berhasil untuk lima role: ADMIN, KAPRODI, DOSEN, KETUA_KELAS, dan MAHASISWA.
- Build frontend dilaporkan berhasil dan menghasilkan 45 route.
- Test suite sebelumnya melaporkan 75 test lulus, tetapi ini tidak sama dengan bukti seluruh alur E2E berjalan.

### 9.2 Perbaikan yang Dilaporkan

- Menghapus nilai enum `ACTIVE` yang tidak cocok dengan enum status enrollment PostgreSQL dan menggantinya dengan nilai yang sesuai.
- Mengubah schema pertanyaan kuis agar `quiz_id` dapat diisi dari path endpoint.
- Mengganti halaman Mahasiswa Nilai, Jadwal, dan Verifikasi Presensi yang sebelumnya menggunakan tampilan yang tidak sesuai.
- Mengubah sebagian metrik dashboard hardcoded menjadi placeholder yang menunjukkan data belum tersedia.
- Menambahkan akun Ketua Kelas ke proses seed.

### 9.3 Gap yang Masih Diketahui

- Alembic migration chain dilaporkan gagal pada database baru; database lokal yang dipakai dibuat menggunakan `create_all()`. Jangan menjalankan migrasi pada database kosong tanpa memperbaiki serta memverifikasi urutan migration.
- Sebagian metrik dashboard belum mengambil data real dari backend.
- UID RFID pada salah satu tampilan dilaporkan masih hardcoded.
- Halaman nilai/KHS belum sepenuhnya terhubung ke backend grading.
- Status presensi individual pada tampilan mahasiswa belum lengkap.
- Alur kuis end-to-end belum diverifikasi penuh; validasi batas waktu server-side masih menjadi gap.
- Alur submission tugas dan penyimpanan presensi sebelumnya pernah gagal karena enum status enrollment; perbaikan telah dilaporkan tetapi harus dicoba ulang pada browser.
- SI KOBAR belum terhubung ke LLM/provider dan belum memiliki tool registry/API yang lengkap.
- MQTT baru diuji melalui simulasi; perangkat ESP32 fisik belum dibuktikan terintegrasi dari tap hingga record di database.
- `npm run lint` dilaporkan masih memiliki error/warning; build yang berhasil tidak otomatis berarti lint bersih.

### 9.4 Makna Status Local Runnable

Local Runnable berarti layanan dapat dijalankan di lingkungan pengembangan dan alur tertentu bisa dicoba. Status ini **tidak** berarti semua fitur sudah lengkap, aman untuk data nyata, siap kampus, atau siap produksi.

---

## 10. Kriteria Penerimaan Produk

### 10.1 Kriteria Prototype Lokal

Prototype lokal dapat dinyatakan memenuhi baseline jika:

1. Frontend dapat dibuka dan halaman login ditampilkan.
2. Backend dapat dijalankan dan health endpoint memberi respons sehat.
3. Koneksi backend ke PostgreSQL aktif.
4. Akun uji untuk tiap role dapat digunakan untuk login.
5. Pengguna diarahkan ke dashboard sesuai role.
6. Halaman inti tidak menampilkan error runtime yang mencegah interaksi utama.
7. API menolak permintaan yang tidak terautentikasi atau tidak diizinkan untuk operasi terlindungi.
8. Data placeholder ditandai sebagai data belum tersedia, bukan ditampilkan sebagai data nyata.
9. Fitur yang belum tersedia diberi status/batasan yang transparan.

### 10.2 Kriteria Prototype Terintegrasi

Sebelum prototype dianggap terintegrasi, minimal:

1. Admin dapat mengelola data pengguna dan data akademik inti.
2. Dosen dapat membuka kelas/pertemuan, menerbitkan materi, membuat tugas dan kuis.
3. Mahasiswa terdaftar dapat melihat konten kelas yang benar dan mengumpulkan tugas.
4. Dosen dapat mengakses submission dan menyimpan penilaian; mahasiswa hanya dapat melihat nilai miliknya.
5. Presensi web dan/atau IoT menghasilkan catatan yang terhubung ke kelas, sesi, mahasiswa, dan waktu.
6. Tap RFID ganda tidak menyebabkan presensi ganda yang tidak sesuai aturan.
7. Perangkat yang tidak dikenal atau sesi tidak valid tidak dapat menulis presensi.
8. Ketua Kelas dan Kaprodi tidak dapat melewati batas kewenangan.
9. Halaman dashboard menunjukkan data real atau label data kosong dengan benar.
10. Alur utama telah dicoba dari browser/API hingga database, bukan hanya unit test.

### 10.3 Kriteria SI KOBAR Tahap Terintegrasi

1. Setiap tool melakukan permintaan melalui API/service yang menerapkan izin.
2. KOBAR tidak dapat memperoleh data pengguna lain dengan mengubah prompt.
3. Tool yang tidak diizinkan ditolak oleh backend.
4. Tindakan penting memerlukan konfirmasi pengguna.
5. Kegagalan provider atau tool ditangani tanpa mengarang hasil.
6. UI membedakan jawaban generatif, hasil tool/data aktual, dan tindakan yang benar-benar berhasil dilakukan.

---

## 11. Tahapan Pengembangan

Tahap-tahap berikut merupakan urutan yang disarankan, bukan pernyataan bahwa pekerjaan tersebut sudah selesai.

### Tahap 0 — Local Runnable

- Jalankan frontend, backend, dan database lokal.
- Pastikan semua akun uji dapat login.
- Perbaiki blocker runtime yang ditemukan melalui pemakaian manual.
- Pertahankan database development yang sedang dipakai; hindari reset/destructive migration tanpa backup.

**Exit criteria:** aplikasi dapat dijelajahi berdasarkan role dan bug runtime yang menghalangi alur dasar ditangani.

### Tahap 1 — Stabilitas Akademik dan LMS

- Pastikan model dan relasi akademik konsisten.
- Sambungkan halaman ke API yang tepat.
- Selesaikan alur materi, tugas, submission, kuis, dan nilai.
- Perbaiki halaman yang salah konteks serta metrik hardcoded.
- Tentukan alur migrasi database yang dapat direproduksi sebelum membuat database baru.

**Exit criteria:** satu skenario perkuliahan dapat dijalankan dari pembuatan kelas/pertemuan hingga tugas dan penilaian.

### Tahap 2 — Stabilitas Presensi IoT

- Selesaikan validasi sesi, mahasiswa, UID, status enrollment, duplikasi, timestamp, dan device.
- Pastikan status MQTT dan feedback perangkat konsisten.
- Uji simulasi MQTT, lalu lanjutkan ke ESP32 dan RFID fisik.
- Catat dengan jelas bagian yang tetap berfungsi saat broker/jaringan terputus.

**Exit criteria:** satu tap RFID fisik dapat ditelusuri dari perangkat hingga hasil presensi di aplikasi/database.

### Tahap 3 — Role dan Dashboard

- Hubungkan ringkasan dashboard dengan endpoint nyata.
- Pastikan tampilan kosong, loading, error, dan data terisi dibedakan.
- Selesaikan pengalaman pengguna masing-masing role.
- Verifikasi pembatasan data lintas kelas/prodi.

**Exit criteria:** data yang tampak pada tiap role relevan dengan ruang lingkup izin pengguna.

### Tahap 4 — SI KOBAR

- Bangun kontrak API/tool dan registry yang jelas.
- Mulai dari tool read-only berisiko rendah, seperti jadwal dan daftar tugas pengguna.
- Terapkan konteks pengguna dari sesi tepercaya, validasi RBAC, batas penggunaan, logging, dan respons kegagalan.
- Baru setelah itu evaluasi integrasi LLM/provider.
- Tambahkan tindakan dengan konfirmasi setelah read-only tools stabil.

**Exit criteria:** setiap jawaban berbasis data dapat ditelusuri ke tool/API dan tidak melewati otorisasi.

### Tahap 5 — Pilot Terbatas

- Sepakati pemilik data, pengguna, perangkat, dan dukungan operasional.
- Tetapkan prosedur backup/restore, pemantauan error, pengelolaan kredensial, dan pemulihan ketika jaringan atau perangkat gagal.
- Uji dengan data dan peserta yang disetujui, bukan langsung seluruh program studi.
- Dokumentasikan temuan dan persetujuan pihak kampus sebelum memperluas penggunaan.

---

## 12. Entitas Data Inti (Konseptual)

Nama dan detail kolom final harus mengikuti model aktual pada repository. Daftar ini merupakan panduan domain, bukan instruksi untuk membuat tabel duplikat.

| Entitas | Tujuan | Catatan relasi/aturan |
|---|---|---|
| `User` | Identitas akun dan autentikasi | Terhubung ke role serta profil domain yang relevan |
| `Role` / permission | Mewakili kemampuan pengguna | Role perlu dipadukan dengan scope prodi/kelas/resource |
| `ProgramStudi` | Lingkup akademik prodi | Lingkup utama pemantauan Kaprodi |
| `TahunAkademik` | Periode akademik | Dapat memiliki semester |
| `Semester` | Periode semester | Mengelompokkan penawaran mata kuliah sesuai desain domain |
| `Mahasiswa` | Profil mahasiswa | Memiliki NPM/identitas akademik dan hubungan kelas |
| `Dosen` | Profil dosen | Dapat ditugaskan ke satu atau beberapa kelas/mata kuliah |
| `MataKuliah` | Definisi mata kuliah | Bagian dari struktur akademik |
| `Kelas` / `CourseClass` | Penawaran kelas mata kuliah | Menghubungkan dosen, mahasiswa, semester, dan pertemuan |
| `Enrollment` / keanggotaan kelas | Pendaftaran mahasiswa | Status harus memakai enum domain yang konsisten |
| `ClassLeader` | Penugasan Ketua Kelas | Dibatasi pada kelas tertentu |
| `Pertemuan` | Satu sesi pembelajaran terjadwal | Konteks materi, tugas, kuis, dan presensi |
| `Materi` | Konten pembelajaran | Memiliki kelas/pertemuan pemilik yang jelas |
| `Tugas` | Definisi tugas | Memiliki tenggat, instruksi, dan relasi kelas/pertemuan |
| `Submission` | Jawaban/pengumpulan tugas | Dimiliki mahasiswa dan dinilai dosen berwenang |
| `Quiz` | Definisi kuis | Memiliki status publikasi, aturan attempt, dan jadwal jika dibutuhkan |
| `QuizQuestion` / `QuizOption` | Struktur pertanyaan kuis | Kunci jawaban tidak boleh bocor dalam payload mahasiswa |
| `QuizSubmission` | Percobaan/jawaban kuis | Dinilai oleh backend dan mengikuti batas percobaan |
| `Nilai` / grade record | Hasil penilaian | Sumber nilai final dan aturan pembobotan perlu ditetapkan |
| `AttendanceSession` | Sesi presensi untuk pertemuan | Status dan waktu validasi harus jelas |
| `Presensi` / `AttendanceRecord` | Catatan kehadiran | Unik/idempotent sesuai aturan sesi dan mahasiswa |
| `RFIDCard` / credential | Pemetaan credential ke mahasiswa | UID tidak boleh menjadi satu-satunya bukti otorisasi di luar validasi sistem |
| `IoTDevice` | Identitas perangkat | Memiliki status, identitas device, dan metadata operasional |
| `AttendanceEvent` / audit event | Peristiwa komunikasi/validasi | Membantu menelusuri tap valid, invalid, duplikat, dan error |

### 12.1 Prinsip Sumber Kebenaran

- PostgreSQL merupakan sumber data persisten utama sesuai arsitektur saat ini.
- Backend yang berwenang menjadi penentu hasil validasi dan perubahan data.
- Frontend menampilkan hasil backend, bukan menyimpulkan bahwa perubahan berhasil hanya karena tombol ditekan.
- KOBAR mengakses informasi melalui API/service berotorisasi.
- Pesan MQTT adalah input/peristiwa yang perlu divalidasi, bukan bukti yang langsung dipercaya.

---

## 13. Integrasi dan Antarmuka Sistem

### 13.1 Frontend

- Framework yang dilaporkan: Next.js App Router, TypeScript, Tailwind CSS, dan komponen UI berbasis shadcn/ui.
- Berfungsi sebagai antarmuka web per role.
- Bertanggung jawab atas navigasi, form, validasi UX, loading/error state, dan menampilkan hasil API.
- Tidak menjadi satu-satunya tempat penegakan hak akses atau validasi aturan bisnis.

### 13.2 Backend

- Backend yang ada menggunakan FastAPI/Python dan menyediakan API untuk fungsi yang dilaporkan, termasuk autentikasi, akademik, LMS, presensi, perangkat, pengguna, serta workflow.
- Backend/service bertanggung jawab untuk validasi domain, RBAC, integritas data, pemrosesan presensi, dan operasi yang dibutuhkan frontend.
- Kontrak request/response perlu menjadi sumber acuan untuk integrasi UI.

### 13.3 PostgreSQL

- Menyimpan data akademik, LMS, credential, presensi, dan perangkat sesuai model yang digunakan.
- Pengembangan skema harus dapat direproduksi dari migration chain yang valid.
- Karena migration chain dilaporkan bermasalah, jangan menjadikan `create_all()` ditambah `alembic stamp head` sebagai solusi migrasi permanen. Perbaiki dan validasi sejarah migrasi sebelum menyiapkan database baru atau pilot.

### 13.4 MQTT dan Perangkat

Alur konsep:

```text
KTM/RFID
   ↓
RC522 + ESP32
   ↓ MQTT
Broker Mosquitto
   ↓
MQTT handler / backend
   ↓
Validasi device + sesi + mahasiswa + enrollment + duplikasi
   ↓
Presensi dan audit event di PostgreSQL
   ↓
Status/feedback untuk aplikasi dan perangkat
```

Sistem perlu memisahkan:
- **status perangkat** (online/offline/heartbeat),
- **peristiwa tap** (credential dan waktu yang dikirim),
- **hasil validasi** (diterima/ditolak beserta alasan yang aman), dan
- **catatan presensi resmi** (hasil yang lolos aturan backend).

### 13.5 SI KOBAR

KOBAR harus memakai API/tool kontrak yang eksplisit, misalnya:

- `getMyPendingAssignments`
- `getMyAttendance`
- `getMyGrades`
- `getCourseMaterials`
- `getClassSchedule`
- `getClassAttendanceSummary`
- `getDeviceStatus`

Nama di atas contoh kontrak konseptual. Nama aktual wajib diselaraskan dengan API dan implementasi repository. Setiap tool harus mendefinisikan role yang boleh menggunakannya, input tervalidasi, scope data, output yang aman, dan perilaku error.

---

## 14. UX, Data Kosong, dan Penanganan Error

Semua halaman inti harus membedakan setidaknya kondisi berikut:

1. **Loading:** sistem sedang mengambil data.
2. **Data tersedia:** data berhasil didapat dan dapat ditampilkan.
3. **Data kosong:** permintaan berhasil tetapi belum ada data untuk ditampilkan.
4. **Tidak berwenang:** pengguna tidak memiliki hak akses.
5. **Sesi tidak valid:** pengguna harus login ulang atau memperbarui sesi.
6. **Gagal memuat:** terjadi masalah jaringan/API/server.
7. **Fitur belum tersedia:** fungsi masih dalam pengembangan dan belum dijanjikan berfungsi.

Aturan tampilan:

- Jangan memakai nilai seperti `100%`, jumlah tugas, NIM, UID RFID, alamat IP perangkat, firmware, atau nilai akademik hardcoded seolah-olah data real.
- Jika nilai belum bisa diperoleh, tampilkan pesan seperti “Data belum tersedia” atau “Belum terhubung”, sesuai konteks.
- Jangan menyamakan data kosong dengan angka nol. “Belum ada data” dapat berbeda makna dari “0 tugas”.
- Pesan error bagi pengguna harus menjelaskan tindakan berikutnya tanpa membocorkan stack trace, secret, query SQL, atau token.
- Tombol submit harus menampilkan state proses dan hasil yang dilaporkan server.
- Form harus mempertahankan input yang aman ketika validasi gagal jika memungkinkan.

---

## 15. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi yang disarankan |
|---|---|---|
| Migration chain tidak valid | Database baru tidak dapat dibuat secara konsisten | Audit urutan migration; uji dari database kosong terpisah sebelum mengganti database development |
| Database lokal hanya cocok dengan `create_all()` | Perbedaan skema antar mesin/lingkungan | Tetapkan prosedur migration resmi dan dokumentasikan seed yang dapat diulang |
| UI terhubung ke endpoint yang salah atau belum tersedia | Halaman tampil tetapi tidak bekerja | Inventaris route/API; periksa network request dan kontrak response |
| Enum/status berbeda antara ORM, database, dan service | Error 500 saat alur bisnis berjalan | Gunakan enum domain terpusat dan validasi konsistensi skema |
| Dashboard memakai data hardcoded | Pengguna mengambil keputusan berdasarkan data palsu | Hapus angka contoh atau labeli secara transparan; sambungkan ke endpoint yang benar |
| Otorisasi hanya ditegakkan di frontend | Data dapat diakses lewat request langsung | Enforce RBAC, ownership, dan scope pada backend |
| Perangkat MQTT palsu/tidak dikenal mengirim pesan | Presensi tidak sah atau data rusak | Autentikasi broker, allowlist device, validasi payload, rate limit, dan audit |
| RFID UID diduplikasi atau dipetakan salah | Presensi salah orang | Validasi credential aktif, proses registrasi yang berwenang, serta penanganan penggantian kartu |
| Jaringan atau broker terputus | Presensi tidak masuk atau feedback terlambat | Tentukan kebijakan offline, retry, idempotency, dan sinkronisasi sebelum pilot |
| Timer kuis hanya berjalan di browser | Batas waktu bisa dilewati melalui API | Validasi deadline di server untuk submission/attempt |
| SI KOBAR mengarang jawaban atau akses data | Informasi keliru atau pelanggaran privasi | Batasi jawaban berbasis tool, cek otorisasi, bedakan fakta API dari generasi, dan log hasil tool |
| Secret masuk ke repository | Kebocoran akses database/API | `.env` tidak di-commit, rotasi secret jika bocor, dan gunakan secret manager di lingkungan produksi |
| Klaim prototype terlalu luas | Pengguna menganggap sistem siap kampus | Gunakan label status fitur dan catat bukti pengujian dengan jelas |

---

## 16. Metrik Keberhasilan

Metrik produk belum memiliki baseline numerik yang disepakati. Berikut metrik yang dapat mulai dicatat pada tahap prototype/pilot:

- **Keberhasilan alur inti:** persentase skenario pengujian manual yang selesai tanpa error penghambat.
- **Integritas presensi:** jumlah catatan ganda atau presensi salah yang terdeteksi pada skenario uji.
- **Keberhasilan submission:** submission yang tersimpan dan dapat ditemukan oleh dosen yang benar.
- **Integritas nilai:** nilai yang tersimpan dan tampil konsisten bagi dosen serta mahasiswa yang berwenang.
- **Pembatasan akses:** jumlah kasus akses lintas role/scope yang berhasil ditolak dalam pengujian keamanan.
- **Keandalan IoT:** persentase event uji yang diproses dengan status yang benar, dengan kondisi jaringan dicatat.
- **Kelengkapan data UI:** jumlah metrik/halaman yang masih menggunakan data hardcoded atau placeholder.
- **Kualitas KOBAR:** tingkat keberhasilan tool sesuai skenario, persentase jawaban yang didukung data aktual, dan kegagalan otorisasi yang berhasil dicegah.
- **Waktu penyelesaian tugas pengguna:** waktu yang dibutuhkan pengguna untuk menyelesaikan aktivitas seperti menemukan tugas, mengirim submission, atau memeriksa presensi.

Target angka harus ditentukan setelah data baseline tersedia. Jangan menyebut sistem “akurat”, “lebih cepat”, atau “efisien” dalam angka tertentu sebelum pengukuran dilakukan.

---

## 17. Rencana Verifikasi Manual

Verifikasi ini disusun untuk membantu pemilik produk mencoba aplikasi lokal. Jalankan setelah layanan hidup dan gunakan akun development, bukan akun kampus/data nyata.

### 17.1 Login dan Role

- [ ] Login berhasil untuk Admin, Kaprodi, Dosen, Ketua Kelas, dan Mahasiswa.
- [ ] Login dengan password salah ditolak.
- [ ] Logout mengakhiri sesi secara benar.
- [ ] Membuka URL role lain tidak memberikan akses terhadap data terlarang.
- [ ] Request API langsung juga menerapkan izin, bukan hanya menyembunyikan menu.

### 17.2 Akademik dan LMS

- [ ] Admin dapat melihat/mengelola data akademik yang menjadi kewenangannya.
- [ ] Dosen melihat hanya kelas yang ditugaskan.
- [ ] Dosen membuka atau memilih kelas dan pertemuan yang benar.
- [ ] Dosen membuat materi dan materi tampil bagi mahasiswa terdaftar.
- [ ] Dosen membuat tugas dengan tenggat.
- [ ] Mahasiswa melihat tugas yang tepat dan mengirim submission.
- [ ] Dosen melihat submission dan menyimpan nilai/feedback.
- [ ] Mahasiswa tidak dapat membaca submission/nilai mahasiswa lain.
- [ ] Dosen membuat kuis, menambah soal, memublikasikan kuis, dan mahasiswa mengerjakannya.
- [ ] Jawaban/kunci yang benar tidak bocor pada payload yang dikirim ke browser.
- [ ] Jadwal dan nilai di halaman Mahasiswa bukan tampilan modul yang salah atau data contoh.

### 17.3 Presensi dan MQTT

- [ ] Dosen membuka sesi presensi yang terkait pertemuan yang benar.
- [ ] Tap RFID terdaftar saat sesi valid diproses sesuai aturan.
- [ ] UID tak terdaftar ditolak dan dapat ditelusuri.
- [ ] Tap berulang tidak menghasilkan catatan ganda yang tidak diinginkan.
- [ ] Sesi tertutup/tidak aktif menolak tap.
- [ ] Status presensi tampil konsisten pada tampilan dosen dan mahasiswa sesuai izin.
- [ ] Pesan MQTT dari device tidak dikenal tidak dapat menulis catatan presensi.
- [ ] Jika menggunakan hardware, satu tap fisik dapat ditelusuri sampai hasil di database/UI.

### 17.4 SI KOBAR

- [ ] UI jelas menyatakan kemampuan prototype yang tersedia.
- [ ] KOBAR tidak mengaku melakukan operasi yang gagal atau tidak dijalankan.
- [ ] KOBAR tidak dapat membaca data pengguna lain melalui pertanyaan yang dimanipulasi.
- [ ] Perintah navigasi hanya mengarah ke route yang diizinkan.
- [ ] Error API/provider menghasilkan respons aman dan jelas.

Checklist di atas adalah usulan prosedur manual, bukan pernyataan bahwa seluruh poin telah lulus.

---

## 18. Lingkungan Pengembangan yang Dilaporkan

| Komponen | Nilai pada laporan lokal | Catatan |
|---|---|---|
| Frontend | Next.js 16.x, TypeScript | Versi tepat dapat berubah; cek `package.json` aktual |
| Backend | Python 3.14.x, FastAPI | Cek dependency lock/requirements aktual |
| Database | PostgreSQL 18.6 | Development lokal dilaporkan memakai port 5433 |
| MQTT broker | Mosquitto, port 1883 | Konfigurasi keamanan broker perlu ditinjau sebelum penggunaan nonlokal |
| Frontend URL | `http://localhost:3000` | Alamat development |
| Backend URL | `http://127.0.0.1:8000` | Alamat development |
| API docs | `http://127.0.0.1:8000/docs` | Jangan biarkan dokumentasi/debug endpoint terbuka sembarangan di produksi |
| Database | `sadita_db` pada `localhost:5433` | Jangan menyimpan kredensial database di dokumen ini |

### Akun Uji yang Dilaporkan

Kredensial berikut berasal dari laporan development dan hanya untuk lingkungan lokal. Pastikan password tidak dipakai ulang di sistem nyata.

| Role | Email | Password development |
|---|---|---|
| ADMIN | `admin@unipi.ac.id` | `admin123` |
| KAPRODI | `kaprodi@unipi.ac.id` | `kaprodi123` |
| DOSEN | `dosen@unipi.ac.id` | `dosen123` |
| KETUA_KELAS | `ketua@mhs.unipi.ac.id` | `ketua123` |
| MAHASISWA | `rizal@mhs.unipi.ac.id` | `mhs123` |

> **Keamanan:** akun di atas adalah kredensial development yang diketahui. Jangan gunakan untuk deployment publik atau data riil. Ubah password dan buat akun terpisah sebelum demo nonlokal.

---

## 19. Keputusan yang Masih Harus Ditetapkan

Keputusan berikut sengaja dibiarkan terbuka karena belum ada ketetapan final yang didukung oleh informasi saat ini.

1. **Aturan presensi:** kapan sesi dibuka/ditutup, toleransi terlambat, batas waktu check-in, dan mekanisme koreksi resmi.
2. **Kebijakan offline IoT:** apakah perangkat menyimpan event lokal saat jaringan/broker putus, berapa lama, dan bagaimana mencegah replay saat sinkronisasi.
3. **Identitas mahasiswa:** bagaimana alur registrasi, penggantian, kehilangan, dan pencabutan KTM/RFID.
4. **Metode presensi alternatif:** prosedur resmi jika KTM tidak tersedia atau perangkat rusak.
5. **Kebijakan nilai:** komponen/bobot nilai, pembulatan, skala A–E, status remedial, dan siapa yang dapat mengunci nilai final.
6. **Aturan kuis:** apakah deadline server-side, durasi, randomisasi soal, jumlah percobaan, dan mekanisme retake diperlukan pada tahap pertama.
7. **Kewenangan Ketua Kelas:** operasi apa saja yang boleh dilakukan, apakah sebatas verifikasi operasional atau termasuk workflow pengajuan koreksi.
8. **Kewenangan Kaprodi:** data apa yang dapat dilihat dan tindakan apa yang boleh dilakukan dalam lingkup prodi.
9. **Provider SI KOBAR:** pilihan LLM/provider, kebutuhan mode lokal/offline, anggaran, serta retensi percakapan.
10. **Privasi dan retensi data:** periode penyimpanan presensi, submission, percakapan KOBAR, audit log, serta mekanisme ekspor/penghapusan sesuai kebijakan kampus.
11. **Kepemilikan dan otorisasi data:** pihak kampus yang akan menyetujui penggunaan data mahasiswa dan dosen pada pilot.
12. **Rumus nilai final:** sumber data dan aturan yang dipakai untuk menghasilkan KHS.
13. **Target pengguna pilot:** kelas, dosen, mata kuliah, perangkat, serta periode uji yang benar-benar disetujui.
14. **Database migration:** strategi untuk merekonsiliasi migration chain lama dengan skema development tanpa kehilangan data.

Keputusan ini sebaiknya dicatat dalam *decision log* sebelum pengembangan yang bergantung padanya dimulai.

---

## 20. Panduan untuk Coding Agent

Dokumen PRD ini menjadi acuan tujuan dan perilaku produk; source code serta migration yang ada tetap harus diperiksa sebelum melakukan perubahan. Gunakan aturan berikut ketika mengerjakan SADITA.ai:

1. **Jangan mengasumsikan route atau fitur ada.** Periksa `frontend/app`, router FastAPI, service, model, schema, dan migration aktual.
2. **Jangan menulis ulang proyek dari nol.** Pertahankan modul yang masih berguna dan lakukan perubahan kecil yang terarah.
3. **Jangan menyamakan build sukses dengan fitur selesai.** Untuk setiap fitur, identifikasi UI, API, service, database, authorization, serta error/loading/empty state.
4. **Jangan membuat data palsu terlihat real.** Seed hanya untuk environment development; beri label yang jelas jika tampilan menggunakan contoh.
5. **Jangan melakukan reset/drop database secara otomatis.** Backup terlebih dahulu dan minta persetujuan sebelum tindakan destruktif.
6. **Jangan menggunakan `alembic stamp head` untuk menyembunyikan migration yang belum dijalankan.** Audit migration chain dan uji strategi migration pada database terpisah.
7. **Jangan menambahkan library atau infrastruktur baru tanpa kebutuhan jelas.** Utamakan stack yang sudah digunakan.
8. **Pertahankan batas backend.** RBAC, ownership, status akademik, waktu kuis, dan presensi harus divalidasi server-side.
9. **KOBAR wajib memanggil API/tool yang terotorisasi.** Jangan beri model akses SQL/ORM langsung atau kepercayaan pada role yang ditulis user dalam prompt.
10. **Jangan membuat klaim selesai tanpa bukti.** Laporkan perubahan file, cara menjalankan, langkah manual untuk memverifikasi, hasil yang benar-benar diamati, dan gap yang tersisa.
11. **Jaga fokus.** Saat pemilik produk sedang melakukan manual testing, perbaiki blocker yang dilaporkan satu per satu tanpa memulai refactor besar yang tidak diperlukan.
12. **Dokumentasikan status secara eksplisit.** Gunakan label `Implemented`, `Partially Implemented`, `Prototype`, `Not Implemented`, atau `Needs Verification`.

### Format Laporan untuk Setiap Perubahan

```text
Tujuan perubahan:
Akar masalah:
File yang diubah:
Perubahan yang dilakukan:
Cara menjalankan:
Cara verifikasi manual:
Hasil yang benar-benar diverifikasi:
Risiko/regresi yang perlu diperhatikan:
Yang masih belum selesai:
```

---

## 21. Glossary

| Istilah | Arti dalam PRD ini |
|---|---|
| SADITA.ai | Sistem Akademik Terintegrasi yang menghubungkan fungsi akademik, LMS, presensi IoT, dan SI KOBAR |
| SI KOBAR | AI Assistant yang direncanakan mendukung chat, pemahaman, analisis, navigasi, dan bantuan |
| LMS | Modul pembelajaran untuk materi, tugas, kuis, pengumpulan, dan penilaian |
| IoT | Perangkat fisik yang mengirim/menerima data melalui jaringan |
| RFID | Teknologi identifikasi kartu/tag; pada prototype digunakan untuk membaca KTM/credential |
| MQTT | Protokol pesan yang digunakan dalam komunikasi perangkat dan backend |
| RBAC | Kontrol akses berbasis peran; dalam SADITA juga harus memperhatikan lingkup kelas/prodi dan kepemilikan data |
| Scope | Lingkup resource yang boleh dilihat/diubah pengguna, misalnya kelas yang diampu atau prodi yang dikelola |
| E2E | Pengujian dari awal hingga akhir, misalnya aksi di UI sampai hasil tersimpan pada database dan terlihat kembali |
| Local Runnable | Bisa dijalankan di lingkungan development lokal, tetapi belum otomatis siap produksi/pilot |
| MVP | Versi minimal yang memenuhi alur prioritas dan kriteria penerimaan yang telah disepakati |

---

## 22. Riwayat Perubahan Dokumen

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1 | 9 Oktober 2026 | Draft awal PRD berdasarkan konsep SADITA.ai dan laporan status local runnable tanggal 7 Oktober 2026 |

---

## 23. Prinsip Penutup

SADITA.ai dikembangkan bertahap. Setiap fitur harus memiliki tujuan pengguna, aturan bisnis, kewenangan akses, kriteria penerimaan, serta bukti implementasi yang dapat diverifikasi. Dokumen ini harus diperbarui ketika keputusan produk berubah atau ketika gap prototype telah diselesaikan.
