# SADITA.ai

**Sistem Absensi Digital Terintegrasi Akademik & LMS**  
*Universitas Insan Pembangunan Indonesia (UNIPI)*

[![Enterprise Standard](https://img.shields.io/badge/Standard-Enterprise%202026-059669.svg?style=flat-square)](docs/ENTERPRISE_DEVELOPER_GUIDE.md)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4%20(Turbopack)-black.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.14%20%7C%203.12-3776AB.svg?style=flat-square&logo=python)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18%20%7C%2016-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![MQTT](https://img.shields.io/badge/MQTT-Mosquitto%202.1-660066.svg?style=flat-square&logo=eclipsemosquitto)](https://mosquitto.org/)
[![Zero-Trust Security](https://img.shields.io/badge/Security-Zero--Trust%20OWASP-red.svg?style=flat-square)](.agents/sadita/ZERO_TRUST_SECURITY_SPECIFICATION.md)

---

## 1. Tentang SADITA.ai

**SADITA.ai** adalah platform sistem informasi akademik dan presensi cerdas tingkat *enterprise* yang dirancang khusus untuk operasional nyata perguruan tinggi. SADITA.ai mengintegrasikan seluruh siklus hidup akademik:

```
Administrasi Akademik ➔ KRS & Enrollment ➔ Penjadwalan Kelas ➔ Presensi Cerdas IoT ➔ LMS & Materi ➔ Tugas & Kuis ➔ Kalkulasi Nilai Otomatis ➔ Audit & Analisis
```

Perangkat keras (*hardware*) mikrokontroler **ESP32-S3** (RFID RC522 + Fingerprint AS608) berfungsi sebagai alat autentikasi presensi fisik di ruang kelas yang terhubung secara asinkron ke backend melalui broker MQTT. Basis data **PostgreSQL** berperan sebagai *Single Source of Truth* untuk seluruh transaksi data institusi.

---

## 2. Tumpukan Teknologi (Technology Stack)

| Layer | Teknologi Utama | Deskripsi Implementasi |
|---|---|---|
| **Frontend** | Next.js 16.4 (Turbopack) + React 19 | App Router, Server & Client Components, TypeScript 5 |
| **UI & Styling** | Eduka Design System (Vanilla CSS) | Token CSS institusional UNIPI (Emerald `#059669` & Sapphire `#1d4ed8`), tanpa AI-slop |
| **UI Primitives** | Universal DataTable (Filament 5 Style) | Filter inline, modal detail baris, dropdown aksi, dan tombol BackToTop ergonomis |
| **Mobile & iOS** | Apple Human Interface Guidelines | 100% kepatuhan iPhone, Safe Area Dynamic Island/Notch, touch-target 44px, aturan font 16px |
| **AI Assistant** | SI KOBAR (Asisten Pintar SADITA) | Widget AI melayang (*floating widget*) terkoordinasi dengan hirarki kontrol BackToTop |
| **Backend** | FastAPI 0.115 + Python 3.14/3.12 | 4-Tier Clean Architecture (Router ➔ Service ➔ Repository ➔ Model) |
| **ORM & Database** | SQLAlchemy 2.0 + PostgreSQL 18/16 | Pola generic `BaseRepository`, migrasi skema terstruktur via Alembic |
| **IoT & Broker** | Mosquitto MQTT 2.1 + paho-mqtt | Komunikasi mTLS/TLS QoS 1, verifikasi status heartbeat perangkat online/offline |
| **Keamanan Siber** | Zero-Trust & Anti-Replay RFID | Nonce UUIDv4 di Redis, HMAC-SHA256 signature, window waktu 5 detik, JWT RTR |

---

## 3. Arsitektur Struktur Direktori

SADITA.ai menerapkan pemisahan tanggung jawab yang ketat (*Separation of Concerns*):

```
Sadita.ai/
├── backend/                  # REST API & MQTT Worker (FastAPI)
│   ├── alembic/              # Berkas migrasi database
│   ├── app/
│   │   ├── api/v1/           # Router & controller API versi 1
│   │   │   └── endpoints/    # Handler spesifik (academic, attendance, lms, auth, devices, etc.)
│   │   ├── core/             # Konfigurasi aplikasi, keamanan JWT, dependencies
│   │   ├── db/               # Inisialisasi engine SQLAlchemy, session maker, base model
│   │   ├── models/           # Definisi skema tabel database (SQLAlchemy ORM)
│   │   ├── mqtt/             # MQTT client subscriber, publisher, dan message dispatcher
│   │   ├── repositories/     # Data Access Layer (pola BaseRepository)
│   │   ├── schemas/          # Kontrak validasi input/output (Pydantic v2 schemas)
│   │   └── services/         # Business logic layer terenkapsulasi
│   ├── tests/                # Test suite Pytest (unit & integration tests)
│   └── requirements.txt      # Dependensi Python backend
│
├── frontend/                 # Web Portal Enterprise (Next.js 16 + React 19)
│   ├── app/                  # Next.js App Router
│   │   ├── admin/            # Portal Administrator (Akademik, LMS, Users, IoT, Presensi)
│   │   ├── dosen/            # Portal Dosen (Kelas, Presensi Live, Materi, Tugas, Nilai)
│   │   ├── kaprodi/          # Portal Kaprodi (Kurikulum, Dosen, Monitoring Presensi)
│   │   ├── ketua-kelas/      # Portal Ketua Kelas (Verifikasi Pengganti, Anggota Kelas)
│   │   ├── mahasiswa/        # Portal Mahasiswa (Jadwal, Presensi, LMS, Nilai, Registrasi KTM)
│   │   ├── login/            # Halaman autentikasi terpadu berbasis JWT
│   │   └── globals.css       # Token CSS Eduka, reset typography, modal overlay tanpa blur
│   ├── components/           # Komponen UI Reusable (DataTable, Modal, StatCard, BackToTop, SI KOBAR)
│   ├── lib/                  # Klien API terpusat, BaseApiService, hooks kustom
│   └── package.json          # Dependensi Next.js & React
│
├── docs/                     # Dokumentasi Arsitektur, Analisis Sistem, & Panduan Developer
├── .agents/                  # Living Documentation, Aturan Master, & Spesifikasi Enterprise
└── start.sh                  # Runner terpadu untuk menjalankan ekosistem lokal (Linux)
```

---

## 4. Peran Pengguna & Modul Utama (RBAC)

Sistem menggunakan kontrol akses berbasis peran (*Role-Based Access Control*) yang ketat:

### 4.1 Administrator (`ADMIN`)
- **Dashboard Operasional**: Ringkasan real-time mahasiswa aktif, dosen, kelas berjalan, presensi hari ini, status perangkat IoT, dan antrean persetujuan.
- **Manajemen Akademik**: Pengelolaan Program Studi, Tahun Akademik aktif, Mata Kuliah, Dosen Pengampu, dan Mahasiswa.
- **Kelas & Mode Perkuliahan**: Mendukung kelas Reguler Pagi, Reguler Malam, dan Shift dengan dosen atau mahasiswa lintas sesi yang tervalidasi via KRS.
- **KRS & Enrollment**: Pengaturan penugasan resmi mahasiswa ke kelas perkuliahan.
- **Perangkat SADITA IoT**: Monitoring status perangkat ESP32-S3 (IP address, online/offline, heartbeat, assignment ruangan/kelas).
- **Approval & Audit Log**: Persetujuan sesi pengganti dan peninjauan riwayat perubahan data imutabel (*append-only audit trail*).

### 4.2 Dosen (`DOSEN`)
- **Kelas Saya**: Manajemen kelas yang diampu pada semester aktif.
- **Live Attendance**: Pembukaan sesi presensi berbatas waktu, pemantauan kehadiran tap RFID secara *real-time*, dan koreksi presensi manual berdasar alasan resmi.
- **LMS Terpadu**: Unggah modul/materi per pertemuan (PDF, video, dokumen).
- **Tugas & Penilaian**: Pembuatan tugas terstruktur, pemeriksaan berkas submission mahasiswa, dan penilaian berbobot.
- **Rekapitulasi Nilai**: Perhitungan otomatis nilai akhir (Presensi, Tugas, UTS, UAS) dengan batas kehadiran minimal 75% untuk kelayakan UAS.

### 4.3 Mahasiswa (`MAHASISWA`)
- **Dashboard & Jadwal Kuliah**: Kalender perkuliahan mingguan, agenda kelas hari ini, dan rekap persentase kehadiran.
- **Kartu Identitas SADITA**: Status registrasi kartu mahasiswa (KTM RFID UID & sidik jari/fingerprint slot).
- **Presensi Mandiri / IoT**: Verifikasi kehadiran menggunakan tap kartu fisik pada perangkat ruang kelas atau presensi sesi online resmi.
- **LMS Mahasiswa**: Akses materi perkuliahan, pengumpulan berkas tugas sebelum tenggat waktu, dan pengerjaan kuis interaktif.
- **Asisten Pintar SI KOBAR**: Konsultasi jadwal, status presensi, dan informasi akademik secara interaktif melalui AI floating widget.

### 4.4 Ketua Kelas (`KETUA KELAS`)
- Bukan role terpisah, melainkan akun mahasiswa dengan *privilege* tambahan pada kelas tertentu.
- **Monitoring Anggota Kelas**: Pemantauan kehadiran rekan kelas secara transparan.
- **Verifikasi Sesi Pengganti**: Memverifikasi bahwa sesi perkuliahan pengganti benar-benar telah terlaksana di lapangan sebelum diteruskan ke Admin untuk persetujuan akhir (*approval*).

### 4.5 Kaprodi (`KAPRODI`)
- **Evaluasi Kurikulum**: Monitoring kurikulum prodi, sebaran SKS, dan mata kuliah.
- **Pengawasan Akademik**: Peninjauan tingkat kehadiran mahasiswa dan kepatuhan jam mengajar dosen di tingkat program studi.

---

## 5. Alur Presensi IoT End-to-End

```
1. Mahasiswa melakukan tap kartu KTM pada sensor RFID RC522 di perangkat ESP32-S3
                                  │
                                  ▼
2. ESP32-S3 memvalidasi kartu dan mengirimkan payload terenkripsi via MQTT (Topic: sadita/device/{id}/tap)
   Payload dilengkapi nonce UUIDv4 dan timestamp window (Anti-Replay Protection)
                                  │
                                  ▼
3. Backend FastAPI menerima pesan MQTT, mengecek duplikasi nonce di Redis, dan memverifikasi signature
                                  │
                                  ▼
4. Backend mencari identitas mahasiswa berdasarkan UID RFID dan memvalidasi KRS serta sesi kelas yang aktif
                                  │
                                  ▼
5. Backend menyimpan catatan presensi ke PostgreSQL (HADIR / TERLAMBAT sesuai batas toleransi)
                                  │
                                  ▼
6. Backend mempublikasikan balasan ke MQTT (Topic: sadita/device/{id}/response)
                                  │
                                  ▼
7. Perangkat ESP32-S3 menampilkan nama mahasiswa & status di LCD 16x2 serta menyalakan LED hijau & buzzer
                                  │
                                  ▼
8. Portal Dosen memperbarui tabel Live Attendance secara real-time tanpa refresh halaman
```

---

## 6. Panduan Menjalankan Sistem (Quick Start)

### 6.1 Prasyarat Perangkat Lunak
- **Linux / macOS / Windows** (WSL2 direkomendasikan pada Windows)
- **Python**: Versi 3.12 atau 3.14
- **Node.js**: Versi 20 LTS atau 24 LTS
- **PostgreSQL**: Versi 16 atau 18 (berjalan di port `5433` atau `5432`)
- **Mosquitto MQTT Broker**: Berjalan di port default `1883`

---

### 6.2 Menjalankan Sekaligus (Unified One-Command Runner — Linux)

Di sistem Linux / Ubuntu, Anda dapat langsung menjalankan script terpadu [`start.sh`](file:///home/whoami/Documents/Projects/Sadita.ai/start.sh):

```bash
chmod +x start.sh
./start.sh
```

Script ini secara otomatis memeriksa layanan PostgreSQL, membersihkan port instance lama, menjalankan backend FastAPI pada port `8000`, dan menjalankan frontend Next.js pada port `3000`.

---

### 6.3 Menjalankan Secara Manual

#### A. Backend (FastAPI)
```bash
# 1. Masuk ke direktori backend
cd backend

# 2. Buat virtual environment dan aktifkan
python3 -m venv .venv
source .venv/bin/activate       # Linux / macOS
# atau: .venv\Scripts\activate  # Windows PowerShell

# 3. Pasang seluruh dependensi Python
pip install -r requirements.txt

# 4. Konfigurasi berkas environment
cp .env.example .env
# Sesuaikan kredensial DATABASE_URL dan MQTT_BROKER pada .env

# 5. Jalankan migrasi basis data
alembic upgrade head

# 6. Jalankan server backend FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Dokumentasi API interaktif dapat diakses pada:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

#### B. Frontend (Next.js 16)
```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Pasang dependensi Node.js
npm install

# 3. Konfigurasi berkas environment lokal
cp .env.local.example .env.local

# 4. Jalankan development server
npm run dev
```

Portal antarmuka dapat diakses pada:
- **Web Portal SADITA.ai**: [http://localhost:3000](http://localhost:3000)

---

## 7. Status & Tahapan Proyek (Phase Progress)

- [x] **Phase 1 — Fondasi Infrastruktur & Database Engine**: PostgreSQL 18, SQLAlchemy 2.0 ORM, Alembic migrations, Redis caching.
- [x] **Phase 2 — Autentikasi Zero-Trust & RBAC**: JWT Access Token (15m) + RTR, RBAC multi-role (Admin, Dosen, Mahasiswa, Ketua Kelas, Kaprodi).
- [x] **Phase 3 — Administrasi Akademik**: Prodi, Tahun Akademik, Mata Kuliah, Mahasiswa, Dosen, Mode Perkuliahan (Pagi/Malam/Shift), KRS.
- [x] **Phase 4 — Mesin Presensi IoT & MQTT**: ESP32-S3 integration, RFID RC522, Fingerprint AS608, Anti-Replay nonce, Live Attendance real-time.
- [x] **Phase 5 — Portal Dosen & Evaluasi Sesi**: Buka sesi presensi, koreksi kehadiran manual, upload materi, manajemen tugas dan penilaian.
- [x] **Phase 6 — Portal Mahasiswa & Kartu Identitas**: Registrasi KTM RFID, jadwal kuliah, riwayat presensi, pengumpulan tugas LMS, SI KOBAR AI Assistant.
- [x] **Phase 7 — LMS Terpadu & Grading Engine**: Pertemuan perkuliahan, modul materi, tugas berbatas waktu, kalkulasi bobot nilai otomatis.
- [x] **Phase 8 — Workflow Sesi Pengganti**: Verifikasi keterlaksanaan oleh Ketua Kelas, final approval oleh Administrator.
- [x] **Phase 9 — UI Enterprise & Standar Anti-AI Slop**: Reusable DataTable Filament 5 style, modal tanpa blur, tombol BackToTop ergonomis, kepatuhan 100% Apple iPhone.

---

## 8. Indeks Panduan & Dokumentasi Arsitektur

Untuk informasi teknis mendalam, pengembang **wajib** merujuk pada berkas dokumentasi resmi berikut:

| Dokumen Rujukan | Lokasi Berkas | Pokok Bahasan Utama |
|---|---|---|
| **Buku Panduan Developer** | [`docs/ENTERPRISE_DEVELOPER_GUIDE.md`](docs/ENTERPRISE_DEVELOPER_GUIDE.md) | Panduan instalasi lokal, pengujian unit, dan operasional produksi |
| **Aturan Master Sistem** | [`.agents/AGENTS.md`](.agents/AGENTS.md) | Konteks proyek, hirarki role, dan protokol pengembang SADITA |
| **Arsitektur OOP & Struktur Bersih** | [`.agents/sadita/OOP_ARCHITECTURE_AND_FOLDER_STRUCTURE.md`](.agents/sadita/OOP_ARCHITECTURE_AND_FOLDER_STRUCTURE.md) | Pola SOLID, Clean Architecture 4-Tier, generic BaseRepository |
| **Rekayasa Reusable & Prinsip DRY** | [`.agents/sadita/REUSABLE_ENGINEERING_AND_DRY_STANDARDS.md`](.agents/sadita/REUSABLE_ENGINEERING_AND_DRY_STANDARDS.md) | Envelope `ApiResponse[T]`, universal DataTable, modal, hooks |
| **Spesifikasi Keamanan Zero-Trust** | [`.agents/sadita/ZERO_TRUST_SECURITY_SPECIFICATION.md`](.agents/sadita/ZERO_TRUST_SECURITY_SPECIFICATION.md) | Mitigasi OWASP Top 10, anti-replay MQTT/RFID, audit logs |
| **Desain Anti-AI Slop & Palet UNIPI** | [`.agents/anti-slop/ANTI_SLOP_DESIGN_GUIDELINES.md`](.agents/anti-slop/ANTI_SLOP_DESIGN_GUIDELINES.md) | Penolakan slop estetika, palet institusional, kepadatan data |
| **Sistem Desain Responsif & iPhone** | [`.agents/dealtech-ui/DESIGN_SYSTEM_AND_RESPONSIVE_SPEC.md`](.agents/dealtech-ui/DESIGN_SYSTEM_AND_RESPONSIVE_SPEC.md) | Breakpoint, safe area Dynamic Island, touch target 44px, floating hierarchy |
| **Spesifikasi Domain Presensi & LMS** | [`.agents/learnstack-lms/LMS_AND_ATTENDANCE_DOMAIN_SPEC.md`](.agents/learnstack-lms/LMS_AND_ATTENDANCE_DOMAIN_SPEC.md) | Alur presensi IoT, grading engine, verifikasi sesi pengganti |

---

## 9. Lisensi & Hak Cipta

Hak Cipta © 2026 **Universitas Insan Pembangunan Indonesia (UNIPI)**.  
Dikembangkan oleh Tim Riset & Rekayasa Perangkat Lunak SADITA.ai.
