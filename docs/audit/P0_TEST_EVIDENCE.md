# SADITA.ai — P0 Test Evidence & Verification Log

**Tanggal Audit:** 30 Oktober 2026  
**Auditor:** Senior Software Architect, Security Engineer, & QA Lead (Independent Audit)  
**Lingkungan Eksekusi:** Local Windows Workstation, Python 3.12 (`.venv`), PostgreSQL 16 (Port 5433), Node.js v20+ / TypeScript 5.7+  
**Target Verifikasi:** Seluruh Suite Pengujian Otomatis Backlog P0 & Static Analysis

---

## 1. Ringkasan Eksekutif Pengujian

| Metrik | Backend (Pytest) | Frontend (TypeScript/Next.js) | Hardware (ESP32-S3/RC522) |
|---|---|---|---|
| **Total Test Suite** | 10 Test Modules | 1 Typecheck Suite | N/A (Firmware Code Only) |
| **Total Test Case** | 89 Test Cases | 0 Type Errors (`npx tsc --noEmit`) | 0 Hardware Test Benches |
| **Status Kelulusan** | 89 PASSED (100%) | PASSED (Clean Compilation) | **NOT VERIFIED (No Physical HW)** |
| **Coverage Domain** | Akademik, KRS, Presensi, Auth, Role, LMS | Komponen UI, Type Definition, API Services | PlatformIO build belum terhubung ke test runner otomatis |
| **Tingkat Kepercayaan** | **Simulasi/Mock Tinggi, Hardware Kosong** | **Tinggi untuk Tipe, Rendah untuk E2E Browser** | **0% Verifikasi Fisik** |

---

## 2. Rincian Eksekusi Test Suite Backend (Pytest)

Pengujian dijalankan menggunakan PostgreSQL live pada port 5433 menggunakan isolating transaction fixture `db_session`.

### 2.1. Log Eksekusi Lengkap

```text
============================= test session starts =============================
platform win32 -- Python 3.12.6, pytest-8.3.4, pluggy-1.5.0
rootdir: C:\Users\Rizal\Documents\Project\Sadita.ai\backend
configfile: pytest.ini
plugins: anyio-4.8.0, asyncio-0.25.3
asyncio: mode=Mode.STRICT, default_loop_scope=function
collected 89 items

tests/test_academic_management.py ......................                 [ 24%]
tests/test_attendance_rfid_e2e.py ....                                   [ 29%]
tests/test_class_leader_workflow.py ...                                  [ 32%]
tests/test_devices_api.py ........                                       [ 41%]
tests/test_krs_request_flow.py ....                                      [ 46%]
tests/test_lms_endpoints.py ...............                              [ 62%]
tests/test_lms_workflow.py ....                                          [ 67%]
tests/test_models.py ..                                                  [ 69%]
tests/test_p0_business_rules.py .............                            [ 84%]
tests/test_security.py ..............                                    [100%]

============================= 89 passed in 47.82s =============================
```

---

## 3. Matriks Klasifikasi Pengujian (Unit vs Integration vs Hardware)

Sesuai aturan kerja audit: **"Jangan menganggap test mock sebagai pengujian hardware"** dan **"Gunakan taksonomi status yang eksplisit"**.

| Modul Test | File Test | Jumlah Test | Jenis Pengujian | Komponen yang Di-Mock | Status Audit |
|---|---|---|---|---|---|
| **Akademik & KRS** | [`tests/test_academic_management.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_academic_management.py) | 22 | Integrasi DB | Nilai SKS maksimum, Kuota kelas | `INTEGRATION VERIFIED` |
| **RFID Tap E2E** | [`tests/test_attendance_rfid_e2e.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_attendance_rfid_e2e.py) | 4 | Integrasi DB + Mock MQTT | Broker MQTT, RC522 Reader, LCD Hardware | `INTEGRATION VERIFIED` (Hardware: `NOT VERIFIED`) |
| **Alur Ketua Kelas** | [`tests/test_class_leader_workflow.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_class_leader_workflow.py) | 3 | Integrasi DB + Auth | Client HTTP, JWT Tokens | `INTEGRATION VERIFIED` |
| **Device CRUD & MQTT** | [`tests/test_devices_api.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_devices_api.py) | 8 | Integrasi DB + Mock Broker | Paho MQTT Client, ESP32 Ping Packet | `INTEGRATION VERIFIED` |
| **KRS State Machine** | [`tests/test_krs_request_flow.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_krs_request_flow.py) | 4 | Integrasi DB | Approval Flow Kaprodi | `INTEGRATION VERIFIED` |
| **LMS Endpoints** | [`tests/test_lms_endpoints.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_lms_endpoints.py) | 15 | Integrasi DB | Upload File Storage (Local/Mock) | `INTEGRATION VERIFIED` |
| **LMS Workflow** | [`tests/test_lms_workflow.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_lms_workflow.py) | 4 | Integrasi DB | Tugas, Nilai, Feedback Flow | `INTEGRATION VERIFIED` |
| **DB Model Constraint** | [`tests/test_models.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_models.py) | 2 | Unit / Integrasi DB | Uniqueness Constraints | `UNIT VERIFIED` |
| **Business Rules P0** | [`tests/test_p0_business_rules.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_p0_business_rules.py) | 13 | Integrasi DB | Jam perkuliahan, Grace period | `INTEGRATION VERIFIED` |
| **Security & RBAC** | [`tests/test_security.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_security.py) | 14 | Unit & Integrasi Auth | Passlib Hasher, JWT Handler | `INTEGRATION VERIFIED` |

---

## 4. Evaluasi Bukti E2E RFID & Hardware IoT

### 4.1. Analisis Test `test_attendance_rfid_e2e.py`
Pengujian ini menguji handler pesan MQTT pada backend:
1. `test_valid_rfid_tap_records_attendance`: Mensimulasikan payload JSON MQTT `{"rfid_uid": "A1B2C3D4", "timestamp": "...", "room_id": "ROOM-01"}`.
   - **Hasil Aktual:** Record presensi berhasil dibuat di database dengan status `HADIR`.
   - **Limitasi:** Menggunakan objek `MQTTHandler` langsung di dalam Python process, **bukan paket TCP nyata dari ESP32-S3 melalui kabel Wi-Fi/Ethernet**.
2. `test_unknown_rfid_tap_is_rejected`: Kartu tidak terdaftar memicu response LCD `"KARTU TIDAK TERDAFTAR"`.
   - **Hasil Aktual:** Response dictionary terbentuk dengan tepat.
   - **Limitasi:** Respon ditangkap di memori Python; tidak ada LCD fisik 16x2 / 20x4 I2C yang menampilkan karakter tersebut.
3. `test_rfid_tap_student_not_enrolled_in_class_rejected`: Mahasiswa terdaftar tapi tidak ada di KRS kelas.
   - **Hasil Aktual:** Backend menolak dengan status `"BUKAN PESERTA KELAS"`.
4. `test_rfid_tap_outside_active_session_rejected`: Tap dilakukan pada ruangan tanpa sesi aktif.
   - **Hasil Aktual:** Ditolak dengan status `"SESI TIDAK AKTIF"`.

### 4.2. Status Hardware ESP32-S3 & RC522: `HARDWARE VERIFIED = TIDAK`
- Tidak ada telemetry paket mTLS, sertifikat X.509 pada perangkat, atau buffer offline hardware yang diuji dalam test bench otomatis.
- Firmware di direktori [`firmware/`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/firmware) memiliki logika PlatformIO C++ namun belum di-flash ke unit fisik pada saat audit ini dilakukan.

---

## 5. Bukti Static Analysis & Frontend Compilation

### 5.1. TypeScript Compiler (`npx tsc --noEmit`)
Dijalankan pada direktori `frontend/`:
```text
C:\Users\Rizal\Documents\Project\Sadita.ai\frontend> npx tsc --noEmit
Exit code: 0
Output: (clean, 0 error)
```
- Seluruh tipe TypeScript pada `src/types/`, `src/services/`, dan `src/app/` konsisten secara sintaksis dan kontrak interface.
- Namun ditemukan ketidaksesuaian runtime pada routing: Menu Ketua Kelas di [`src/components/layout/role-shell.tsx`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/frontend/src/components/layout/role-shell.tsx) memeriksa `user.role === 'KETUA_KELAS'`, padahal role di database adalah `MAHASISWA` dengan relasi `class_leader_assignments`.

---

## 6. Kesimpulan Bukti Pengujian

1. **Integritas Logika Backend:** Valid dan terbukti secara integrasi software (89/89 test passed). Aturan KRS, role check (ABAC), dan presensi database berjalan dengan handal di memori lokal.
2. **Ketiadaan Validasi Fisik:** Klaim bahwa sistem RFID terintegrasi secara fisik tidak memiliki bukti uji otomatis (*no hardware test harness*). Klaim harus diturunkan dari `E2E VERIFIED` menjadi `INTEGRATION VERIFIED (MOCK MQTT)`.
3. **Ketahanan Data Operasional:** Database live lokal tidak terganggu selama pengujian berkat penggunaan rollbacks/isolated session pada test harness.
