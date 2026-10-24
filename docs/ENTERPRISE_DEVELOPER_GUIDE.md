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

## 6. Standar Antarmuka Admin & Resolusi Masalah UI/UX (Admin Dashboard Resolution)

### 6.1 Sensitivitas Huruf Berkas Aset pada Linux & Optimasi Next.js Image
- **Gejala Bug:** Logo SADITA rusak (*broken image icon*) pada browser Linux karena berkas fisik tersimpan sebagai `public/logo.PNG` (huruf kapital) sementara kode memanggil `/logo.png`. Selain itu, penggunaan tag mentah `<img>` memicu peringatan LCP dan bandwidth pada Next.js.
- **Solusi Standar:** Seluruh aset di `frontend/public/` wajib berformat huruf kecil (*kebab-case* / *lowercase*). Telah dibuat `frontend/public/logo.png` dan digantikan menggunakan komponen resmi `<Image priority width={155} height={40} />` dari `next/image` di `RoleShell`.

### 6.2 Konsistensi Rounded-LG & Spasi Komponen Rapat Kompak (Tight & Compact Spacing)
- **Standar Sudut Rounded-LG:** Seluruh kartu (`.card`, `.stat`), wadah tabel (`.table-container`), bilah atas (`.topbar`), dan tombol aksi konsisten menggunakan standar `border-radius: var(--radius-card)` yaitu **8px - 12px** (`rounded-lg`).
- **Spasi Komponen Rapat & Berdensitas Tinggi:** Jarak antar komponen dibuat padat dan proporsional untuk memaksimalkan *high data density* enterprise:
  - Grid metrik (`.stats`): `gap: 8px`, tinggi kartu ramping (`min-height: 72px`), padding `8px 10px 7px`, angka `18px`, label `10px`.
  - Grid konten utama: `gap: 10px` antara tabel perkuliahan dan status IoT.
  - Padding area kerja (`.content-area`): `12px 18px 24px`.
- **Struktur 8 Stat Card Terintegrasi:** Mempertahankan 8 kartu metrik utama (Total Mahasiswa, Dosen Pengampu, Kelas Perkuliahan, Mata Kuliah, Sesi Presensi Aktif, Perangkat Offline, Pending Approval, Presensi Hari Ini) dengan perataan tipografi tajam, batas kontras halus, dan penempatan ikon yang presisi.

### 6.3 Standardisasi Tabel Kelas Perkuliahan Terjadwal
- **Pemformatan Hari & Waktu:** Angka `day_of_week` (1-7) diterjemahkan otomatis ke nama hari Bahasa Indonesia (`Senin` s.d. `Minggu`) dan format jam 24 jam dengan zona waktu WIB (`08:00 - 10:30 WIB`).
- **Parsing Rombel Bersih Tanpa Terpotong:** Nama kelas dari seeder dipisahkan secara cerdas menjadi chip kode rombel `TI-2024-Pagi-A`, `TEKFO. 1`, `TEKFO. 2`, dll., sehingga mengeliminasi terlipatnya teks nama mata kuliah menjadi 4 baris sempit.

### 6.4 Tata Letak Layar Penuh (*Full-Viewport App Shell*)
- `.app-shell` menggunakan lebar 100% dengan `grid-template-columns: 215px 1fr`, tanpa padding luar `24px` yang sebelumnya menyebabkan tampilan terpotong saat scroll (*clipping / nested double scrollbar*).
- Avatar dan metadata admin pada sidebar diperlebar dan diatur agar tidak terpotong canggung (`text-overflow: ellipsis; max-width: 140px`).

### 6.5 Resolusi Linting React 19 & Next.js 16 (Cascading Renders Fix)
- **Larangan Pemanggilan `setState` Sinkron di `useEffect`:** Inisialisasi awal `loading` diatur langsung pada nilai `true` (`useState(true)`). Pemanggilan `setLoading(true)` dilarang diletakkan secara sinkron di dalam badan `useEffect` untuk mencegah *cascading renders*.
- Pembersihan menyeluruh seluruh import tak terpakai (`Sparkles`, `Radio`, `Activity`).

### 6.6 Standar Skala Desktop Proporsional & Nyaman (*Calibrated Desktop Scaling*)
Sesuai arahan kalibrasi antarmuka desktop agar tidak kebesaran (*bulky*) dan tidak kekecilan (*too tiny*), tercapai standar emas enterprise yang nyaman dibaca pada layar laptop/desktop:
1. **Root Font Scaling Global:**
   - `html { font-size: 14.5px; }` dan `body { font-size: 13px; line-height: 1.5; }`. Seluruh turunan REM dan EM otomatis terskala proporsional, nyaman dibaca, dan tajam.
2. **Sidebar Proporsional (228px):**
   - Lebar sidebar diatur ke **228px**.
   - Logo SADITA berukuran lebar 126px.
   - Profil pengguna (di footer): avatar 30px, nama 12px, badge peran 10px.
   - Menu navigasi: padding `7px 9px`, ukuran font `12.5px`, ikon 16px, dengan `gap: 6px`.
3. **Topbar Seimbang:**
   - Tinggi dan padding dirampingkan ke `padding: 7px 15px`.
   - Input pencarian berlebar `240px`, font `12px`, padding `5px 11px`.
   - Avatar profil 28px, greeting 13px.
4. **Data Table Operasional Berdensitas Tinggi:**
   - Padding sel tabel th `7px 11px` (font `10.5px`), td `7.5px 11px` (font `12px`).
   - Badge status: padding `3px 8px`, font `10.5px`.
   - Tombol aksi tabel: padding `3.5px 9px`, font `11px`.
   - Mampu menampilkan 20-30 baris data sekaligus pada satu layar laptop/desktop tanpa membebani mata.
5. **Kartu Statistik & Modul Akademik:**
   - **8 Stat Cards:** Angka metrik berukuran `22px` (tegas dan jelas), label `11px`, subtext `10.5px`, padding `10px 12px 8px`, min-height `80px`.
   - **Manajemen Pengguna:** Toolbar pencarian & filter padat (`padding: 0.55rem 0.75rem`, `gap: 0.5rem`), tombol filter peran ringkas (`padding: 3px 10px`).
   - **Master Akademik:** Grid modul ringkas (`gap: 0.85rem`, kartu berpadding `12px 14px`, ikon `18px`, judul `0.96rem`).
   - **Monitoring Presensi & Materi LMS:** Toolbar pemilihan kelas perkuliahan padat (`padding: 0.65rem 0.85rem`, dropdown `max-width: 20rem`), badge status dan tombol aksi berukuran pas dan elegan.

### 6.7 Rekonfigurasi Sidebar Footer Interaktif & Pembersihan Linting Menyeluruh
1. **Modern User Trigger & Popover Menu (Desain Foto 1 & 2):**
   - Menggantikan kartu statis dan tombol logout mentah dengan menu footer interaktif berstandar enterprise:
     - **Item Notifikasi:** Menu `Notifications` dengan ikon lonceng dan badge pill counter `6` bertema biru lembut (`.sidebar-badge-pill`).
     - **User Trigger:** Tombol pemicu profil (`.sidebar-user-trigger`) berisi avatar inisial bulat (`AS`), nama pengguna (`Administrator SADITA`), dan ikon chevron `^` yang berotasi otomatis saat menu dibuka/tutup.
     - **Floating Popover Menu:** Menu mengambang di atas trigger (`.sidebar-user-popover`) dengan bayangan halus (*box-shadow*), menampilkan:
       1. Info Pengguna: Ikon User dan nama lengkap.
       2. Pengalih Tema (*Theme Switcher*): 3 tombol ikon (Terang/Sun, Gelap/Moon, Sistem/Monitor) yang fungsional mengubah mode tampilan.
       3. Tombol Keluar (*Sign out*): Tombol sign out dengan ikon `LogOut` yang membersihkan token dan mengarahkan ke halaman login.
     - **Deteksi Klik Luar (*Click-Outside Detection*):** Popover otomatis menutup saat pengguna mengeklik area luar layar.
2. **Resolusi 100% Linter & Bebas Cascading Renders (`@[current_problems]`):**
   - Mengeliminasi seluruh import ikon tidak terpakai (`UserCheck`, `UserX`, `Shield`, `GraduationCap`, `BookOpen`, `Key`, `Calendar`, `Clock`, `FileText`, `CheckSquare`, `Activity`, `Filter`, `AlertCircle`, `EmptyState`).
   - Menerapkan pola `isMounted` Promise pada `app/admin/users/page.tsx` untuk mencegah `react-hooks/set-state-in-effect`.
   - Mengintegrasikan variabel `error` pada `CoursesPage` dan `DevicesPage`, serta menyambungkan fungsi `loadData` sebagai aksi tombol penyegaran manual (*refresh*) pada halaman monitoring IoT.




