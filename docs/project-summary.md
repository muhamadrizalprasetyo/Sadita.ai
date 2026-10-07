# SADITA — Project Status & Complete Implementation Report

**SADITA (Sistem Absensi Digital Terintegrasi Akademik)**  
Universitas Pramita Indonesia (UNIPI)  
Versi: 1.0 — Baseline Prototype Implementation  
Status: **All Phases (1–5) Fully Implemented & Tested**

---

## 1. Arsitektur Keseluruhan Sistem

SADITA mengintegrasikan perangkat fisik IoT di meja dosen dengan sistem akademik dan LMS modern:

```
┌─────────────────────────────────┐       MQTT (TCP :1883)       ┌───────────────────────────────┐
│     SADITA IoT Device (ESP32)   │ ◄──────────────────────────► │       FastAPI Backend         │
│  - RC522 RFID Reader (KTM)      │                              │  - Session Lifecycle Engine   │
│  - AS608 Optical Fingerprint    │       REST Fallback (:8000)  │  - 2FA Verification Logic     │
│  - 0.96" I2C OLED & Buzzer      │ ───────────────────────────► │  - RBAC (Admin, Dosen, Mhs)   │
└─────────────────────────────────┘                              │  - LMS (Materi, Tugas, Nilai) │
                                                                 └──────────────┬────────────────┘
                                                                                │
                                                                 ┌──────────────┴────────────────┐
                                                                 │ PostgreSQL 18 DB (Port 5433)  │
                                                                 └───────────────────────────────┘
                                                                                │
                                                                 ┌──────────────┴────────────────┐
                                                                 │ Next.js 16 Web Dashboard (:3000)│
                                                                 └───────────────────────────────┘
```

---

## 2. Rincian Fase Implementasi

| Fase | Cakupan | Komponen Utama | Status |
|---|---|---|:---:|
| **Phase 1** | **Infrastruktur & Broker** | PostgreSQL 18 (:5433), Mosquitto MQTT (:1883), FastAPI setup, uv package manager | **SELESAI (100%)** |
| **Phase 2** | **Auth, RBAC & Akademik** | JWT access/refresh token, Password bcrypt, User Role (Admin, Dosen, Mahasiswa), Academic Term, Course, Class, Enrollment, RFID & Fingerprint slot mapping | **SELESAI (100%)** |
| **Phase 3** | **Attendance Engine & IoT** | Session lifecycle (`SCHEDULED` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED`), IoT MQTT topic schema, 2FA validation, Late threshold (15 menit), Manual override, Idempotent check-ins | **SELESAI (100%)** |
| **Phase 4** | **LMS Core** | Course materials (Document, Link, Text), Assignments (due date, allow late, max score), Submissions, Lecturer grading & feedback, Class analytics | **SELESAI (100%)** |
| **Phase 5** | **IoT Simulator & Frontend Web** | Python CLI Hardware Simulator (`scripts/iot_simulator.py`), Next.js Web App (`frontend/app/page.tsx`), Quick Tap Testing UI | **SELESAI (100%)** |

---

## 3. Hasil Pengujian Otomatis (*Test Suite*)

Semua **69 unit and integration tests** telah dieksekusi dan **100% lulus**:

```
======================= 69 passed, 1 warning in 13.97s ========================
- test_phase1_infrastructure.py   :  3 passed
- test_phase2_auth_and_models.py  : 30 passed
- test_phase3_attendance.py       : 23 passed
- test_phase4_lms.py              : 13 passed
```

---

## 4. Kredensial Akun Pengujian

Database `sadita_db` di PostgreSQL telah diisi (*seeded*) dengan akun berikut:

| Peran | Email | Password | Keterangan |
|---|---|---|---|
| **Admin** | `admin@unipi.ac.id` | `admin123` | Akses penuh manajemen user dan sistem |
| **Dosen** | `dosen@unipi.ac.id` | `dosen123` | Dr. Ahmad Fauzi, M.Kom. (NIDN: 0412058501) |
| **Mahasiswa** | `rizal@mhs.unipi.ac.id` | `mhs123` | Mochamad Rizal (NIM: 22.11.0001, RFID: `AABBCCDD`, FP: #1) |

---

## 5. Cara Menjalankan Project

### A. Menjalankan Backend (FastAPI)
```powershell
cd c:\Users\Rizal\Documents\Project\Sadita.ai\backend
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### B. Menjalankan Frontend (Next.js)
```powershell
cd c:\Users\Rizal\Documents\Project\Sadita.ai\frontend
npm run dev
```
Dashboard: [http://localhost:3000](http://localhost:3000)

### C. Menjalankan IoT Simulator (ESP32)
```powershell
cd c:\Users\Rizal\Documents\Project\Sadita.ai
backend\.venv\Scripts\python scripts\iot_simulator.py --interactive
```
Atau gunakan tombol **Quick Hardware Simulator** langsung di tampilan web dashboard.
