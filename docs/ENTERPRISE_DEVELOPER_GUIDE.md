# Buku Panduan Developer & Operasional Enterprise SADITA.ai

Buku panduan ini merupakan acuan operasional dan pemeliharaan teknis komprehensif bagi seluruh *software engineer*, arsitek sistem, dan DevOps engineer yang bekerja pada ekosistem **SADITA.ai (Sistem Absensi Digital Terintegrasi Akademik & LMS)**.

---

## 0. Aturan Emas Pengembangan (The Golden Developer Protocol)

> ⚠️ **PERINGATAN PENTING BAGI DEVELOPER & AGEN AI:**
>
> 1. **BACA DOKUMENTASI DAHULU SEBELUM CODING (Read First, Code Later):**
>    Jika Anda developer baru atau belum memahami proyek SADITA.ai secara mendalam, **WAJIB membaca dan memahami seluruh berkas dokumentasi `.md` di repositori ini secara menyeluruh sebelum mulai menulis atau mengubah kode**. Dilarang keras melakukan modifikasi atau membuat asumsi sendiri tanpa menguasai alur domain, relasi data akademik, standar keamanan zero-trust, serta aturan UI anti-slop yang telah ditetapkan.
>
> 2. **WAJIB SINKRONISASI DOKUMENTASI SETIAP PERUBAHAN KODE (Mandatory Documentation Sync):**
>    Setiap kali Anda melakukan perubahan kode—baik penambahan fitur baru, perbaikan bug (*bugfix*), refactoring, migrasi skema database, penambahan endpoint API, maupun pembaruan UI—Anda **WAJIB memperbarui berkas dokumentasi `.md` terkait**. Seluruh berkas `.md` adalah dokumen hidup (*living documentation*). Membiarkan dokumentasi usang setelah mengubah kode adalah pelanggaran standar rekayasa enterprise SADITA.ai.

---

## 1. Peta Jalan & Dokumen Rujukan Inti

Seluruh arsitektur sistem, aturan pengkodean, standar visual, dan keamanan dijabarkan secara rinci dalam dokumen panduan khusus berikut:

1. **Aturan Dasar & Konteks Proyek**:
   [`/.agents/AGENTS.md`](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/AGENTS.md) — Dokumen aturan master yang tidak boleh dimodifikasi pada baris 1-417.
2. **Arsitektur OOP & Struktur Folder**:
   [`/.agents/sadita/OOP_ARCHITECTURE_AND_FOLDER_STRUCTURE.md`](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/sadita/OOP_ARCHITECTURE_AND_FOLDER_STRUCTURE.md) — Pola SOLID, Clean Architecture 4-Tier, Generic BaseRepository, BaseService, dan struktur folder teratur.
3. **Standar Rekayasa Reusable & Prinsip DRY**:
   [`/.agents/sadita/REUSABLE_ENGINEERING_AND_DRY_STANDARDS.md`](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/sadita/REUSABLE_ENGINEERING_AND_DRY_STANDARDS.md) — Envelope response standar `ApiResponse[T]`, universal data table, modal primitives, dan custom hooks.
4. **Spesifikasi Keamanan Zero-Trust**:
   [`/.agents/sadita/ZERO_TRUST_SECURITY_SPECIFICATION.md`](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/sadita/ZERO_TRUST_SECURITY_SPECIFICATION.md) — Mitigasi OWASP Top 10 (2021-2026), anti-replay attack RFID/MQTT, mTLS, JWT refresh token rotation, dan audit logging.
5. **Panduan Desain Human-Crafted Anti-AI Slop**:
   [`/.agents/anti-slop/ANTI_SLOP_DESIGN_GUIDELINES.md`](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/anti-slop/ANTI_SLOP_DESIGN_GUIDELINES.md) — Penolakan estetika slop (purple blobs, glassmorphism liar, robot 3D), palet institusional UNIPI, dan kepadatan data enterprise.
6. **Sistem Desain Responsif & Dukungan Apple iPhone**:
   [`/.agents/dealtech-ui/DESIGN_SYSTEM_AND_RESPONSIVE_SPEC.md`](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/dealtech-ui/DESIGN_SYSTEM_AND_RESPONSIVE_SPEC.md) — Breakpoint 6-tingkat, safe-area insets Dynamic Island/Notch, touch-target 44px, dan aturan font 16px pencegah auto-zoom di iOS Safari.
7. **Komponen Reusable, Performa & SEO 100%**:
   [`/.agents/dealtech-ui-for-public-component/REUSABLE_COMPONENTS_AND_SEO_SPEC.md`](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/dealtech-ui-for-public-component/REUSABLE_COMPONENTS_AND_SEO_SPEC.md) — Optimasi TTFB < 100ms, LCP < 1.2s, sitemap.xml dinamis, robots.txt, dan Schema.org JSON-LD.
8. **Spesifikasi Domain LMS & Presensi IoT**:
   [`/.agents/learnstack-lms/LMS_AND_ATTENDANCE_DOMAIN_SPEC.md`](file:///home/whoami/Documents/Projects/Sadita.ai/.agents/learnstack-lms/LMS_AND_ATTENDANCE_DOMAIN_SPEC.md) — Alur presensi IoT real-time, verifikasi sesi pengganti oleh ketua kelas, pembagian kelas (Pagi/Malam/Shift), dan grading engine.

---

## 2. Petunjuk Instalasi Lingkungan Pengembangan (Local Setup)

### 2.1 Prasyarat Perangkat Lunak
- **Python**: Versi 3.12 atau 3.14 (dengan `venv`)
- **Node.js**: Versi 20 LTS atau 24 LTS (dengan `npm`)
- **Database**: PostgreSQL 16+ (default port: `5433` atau `5432`)
- **Message Broker**: Eclipse Mosquitto MQTT Broker (port default: `1883` tanpa TLS untuk dev lokal, `8883` mTLS untuk staging/prod)

### 2.2 Langkah Menjalankan Backend (FastAPI)
```bash
# 1. Masuk ke direktori backend
cd backend

# 2. Buat virtual environment dan aktifkan
python3 -m venv .venv
source .venv/bin/activate    # Linux / macOS
# atau .venv\Scripts\activate pada Windows

# 3. Pasang dependensi
pip install -r requirements.txt

# 4. Salin konfigurasi environment
cp .env.example .env
# Edit berkas .env: sesuaikan DATABASE_URL dan JWT_SECRET_KEY

# 5. Jalankan migrasi database
alembic upgrade head

# 6. Jalankan server backend uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Dokumentasi OpenAPI interaktif tersedia di:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 2.3 Langkah Menjalankan Frontend (Next.js 16)
```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Pasang dependensi
npm install

# 3. Konfigurasi environment
cp .env.local.example .env.local
# Pastikan NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# 4. Jalankan development server
npm run dev
```
Akses portal melalui browser di `http://localhost:3000`.

---

## 3. Alur Verifikasi & Pengujian Otomatis (Testing & Quality Gate)

Kualitas perangkat lunak dijamin melalui pengujian otomatis berlapis sebelum commit atau deployment:

### 3.1 Menjalankan Test Suite Backend
```bash
cd backend
pytest -v
```
Seluruh pengujian unit dan integrasi wajib **100% Passed**.

### 3.2 Menjalankan Linting Frontend
```bash
cd frontend
npm run lint
```
Pastikan tidak ada peringatan atau error sintaks ESLint dan TypeScript compiler.

---

## 4. Panduan Deployment Produksi (Production Hardening)

1. **Docker Containerization**:
   - Backend dijalankan menggunakan multi-worker Uvicorn di belakang Gunicorn dengan user non-root.
   - Frontend di-build menggunakan mode `output: 'standalone'` pada Next.js.
2. **Reverse Proxy & SSL**:
   - Nginx atau Caddy bertindak sebagai reverse proxy dengan sertifikat Let's Encrypt TLS 1.3 otomatis.
   - Buffer request dan gzip/brotli compression diaktifkan untuk respon statis.
3. **Database Indexing & Maintenance**:
   - PostgreSQL wajib memiliki index B-tree pada seluruh foreign key: `student_id`, `session_id`, `class_id`, `course_id`.
   - Index unik pada `rfid_uid` dan `nim` mahasiswa.
4. **Keamanan MQTT di Produksi**:
   - Nonaktifkan `allow_anonymous true` di `mosquitto.conf`.
   - Wajibkan sertifikat klien (mTLS) atau username/password hash untuk ESP32.

---

## 5. Standar Git, Alur Branching & Pedoman Kontributor GitHub (Git Workflow)

Bagi seluruh developer dan agen AI yang melakukan pekerjaan pada repositori ini, wajib mengikuti alur kerja Git berikut agar riwayat commit tertata rapi dan kontributor tercatat dengan benar:

### 5.1 Remote Repositori Resmi
- **URL Remote:** `git@github.com:muhamadrizalprasetyo/Sadita.ai.git`
- **Default Branch:** `main`

### 5.2 Standar Penamaan Branch Enterprise
Dilarang membuat branch dengan nama sembarangan atau langsung push ke `main` tanpa koordinasi. Gunakan format awalan (*prefix*) terstruktur:
- `feat/<fitur-singkat>` : Untuk pengembangan fitur baru (contoh: `feat/lms-attendance-integration`).
- `fix/<bug-singkat>` : Untuk perbaikan bug atau logic error (contoh: `fix/grading-subquery-score`).
- `docs/<topik-singkat>` : Untuk pembaruan atau pembuatan dokumentasi (contoh: `docs/enterprise-architecture-and-standards`).
- `refactor/<modul>` : Untuk restrukturisasi kode tanpa mengubah fungsionalitas.

### 5.3 Prosedur Push & Pull Request (End-to-End Workflow)
```bash
# 1. Pastikan repositori lokal terhubung dengan origin
git remote -v

# 2. Ambil perubahan terbaru dari server
git fetch origin

# 3. Buat branch baru dari branch utama
git checkout -b <tipe>/<nama-branch> origin/main

# 4. Lakukan staging dan commit dengan Conventional Commits
git add <berkas-yang-diubah>
git commit -m "type: deskripsi ringkas perubahan" -m "- Rincian perubahan poin 1
- Rincian perubahan poin 2"

# 5. Push branch ke GitHub
git push -u origin <tipe>/<nama-branch>

# 6. Buka Pull Request (PR)
# Terminal akan menampilkan tautan otomatis, buka URL tersebut di browser untuk membuat PR ke 'main'.
```

### 5.4 Mengapa Nama Kontributor Belum Muncul di Halaman Utama Repositori? (PENTING)
Banyak developer atau AI bingung ketika sudah push tetapi profilnya belum muncul di daftar **"Contributors"** di sidebar kanan repositori GitHub:
1. **Aturan Default Branch GitHub**: GitHub **HANYA** menghitung dan menampilkan kontributor jika commit tersebut telah **di-merge ke branch utama (`main`)**. Selama commit masih berada di branch terpisah (misal `feat/*` atau `docs/*`), commit tersebut belum dihitung ke dalam widget *Contributors*.
2. **Kesesuaian Email Git**: Pastikan email pada konfigurasi git lokal (`git config user.email`) sudah **terdaftar dan terverifikasi** di akun GitHub pengembang pada menu **Settings → Emails**. Jika email tidak cocok, GitHub tidak dapat menautkan profil akun ke commit tersebut meskipun branch sudah di-merge ke `main`.

---

## 6. Standar Antarmuka Admin & Resolusi Masalah UI/UX (Admin Dashboard Fix)

### 6.1 Sensitivitas Huruf Berkas Aset pada Linux (Linux Case-Sensitivity)
- **Gejala Bug:** Logo SADITA rusak (*broken image icon*) pada browser Linux karena berkas fisik tersimpan sebagai `public/logo.PNG` (huruf kapital) sementara kode memanggil `/logo.png`.
- **Solusi Standar:** Seluruh aset di `frontend/public/` wajib berformat huruf kecil (*kebab-case* / *lowercase*). Telah dibuat salinan `frontend/public/logo.png` serta pembungkus tautan dengan fallback graceful `onError` pada komponen `RoleShell`.

### 6.2 Eliminasi Desain AI-Slop Menjadi Tata Letak Eksekutif
- **Masalah Sebelumnya:** 8 kartu gradien warna-warni neon jenuh yang mengesankan dashboard demo mainan / template AI generik.
- **Standar Baru SADITA:** 
  1. **4 Kartu KPI Eksekutif Utama:** Total Mahasiswa (zamrud), Dosen Pengampu (safir), Kelas Perkuliahan (indigo), dan Mata Kuliah (slate) dengan latar belakang putih elegan, tipografi tegas, dan ikon beraksen halus (*subtle tinted icons*).
  2. **4 Indikator Operasional Ringkas:** Sesi Presensi Aktif (LIVE badge), Perangkat Offline (peringatan perangkat), Persetujuan Pending (pengajuan KRS/pengganti), dan Presensi Hari Ini (tap RFID & bio).

### 6.3 Standardisasi Tabel Kelas Perkuliahan Terjadwal
- **Pemformatan Hari & Waktu:** Angka `day_of_week` (1-7) diterjemahkan otomatis ke nama hari Bahasa Indonesia (`Senin` s.d. `Minggu`) dan format jam 24 jam dengan zona waktu WIB (`08:00 - 10:30 WIB`).
- **Parsing Rombel Bersih:** Nama kelas dari seeder yang berformat `TEKFO. 1 - Matematika 1` dipisahkan secara cerdas menjadi chip kode rombel `TEKFO. 1` dan sub-label mode kuliah `reguler pagi`, sementara nama mata kuliah dan ruangan (`R. FB303`) diletakkan pada kolom mata kuliah agar tidak terjadi pemotongan teks (*line wrapping*) yang canggung.

### 6.4 Tata Letak Layar Penuh (*Full-Viewport App Shell*)
- `.app-shell` menggunakan lebar 100% dengan `grid-template-columns: 260px 1fr`, tanpa padding luar `24px` yang sebelumnya menyebabkan tampilan terpotong saat scroll (*clipping / nested double scrollbar*).
- Avatar dan metadata admin pada sidebar diperlebar dan diatur agar tidak terpotong canggung (`text-overflow: ellipsis; max-width: 150px`).

