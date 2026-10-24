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
