# SADITA — Phase 3: Attendance Engine & IoT Communication Protocol

Dokumen implementasi teknis untuk **Phase 3: Attendance Engine & IoT Communication Protocol** pada project SADITA (Sistem Absensi Digital Terintegrasi Akademik).

---

## 1. Ringkasan Implementasi

Phase 3 mengimplementasikan logika inti absensi SADITA yang menghubungkan perangkat IoT fisik (ESP32 + RC522 RFID + AS608 Fingerprint) dengan backend FastAPI melalui protokol ganda: **MQTT (Real-time broker)** dan **REST API (Fallback)**.

Seluruh 56 pengujian otomatis (*unit & integration tests*) telah berhasil dijalankan (`56 passed, 0 failed`).

---

## 2. Arsitektur Komunikasi IoT & State Machine

### 2.1 Alur Autentikasi 2-Faktor (KTM RFID + Sidik Jari)

```
[ Mahasiswa ]
      │  Tap KTM (RFID)
      ▼
[ ESP32 SADITA ] ────── MQTT: sadita/device/{id}/rfid ──────► [ Backend FastAPI ]
      ▲                                                              │
      │ ◄─── MQTT: sadita/device/{id}/command (prompt_fingerprint) ─┘
      │
[ Layar OLED: "Silakan Tempel Sidik Jari" ]
      │  Scan Sidik Jari
      ▼
[ Sensor AS608 ] ── Validasi Slot Index Lokal ──► [ ESP32 ]
                                                      │
      ┌───────────────────────────────────────────────┘
      ▼ MQTT: sadita/device/{id}/attendance
[ Backend FastAPI ]
      │ 1. Lookup Mahasiswa via RFID UID
      │ 2. Verifikasi slot sidik jari cocok dengan DB
      │ 3. Periksa sesi perkuliahan aktif (status: OPEN)
      │ 4. Hitung toleransi keterlambatan (15 menit)
      │ 5. Upsert AttendanceRecord (Idempoten)
      │
      ▼ MQTT: sadita/device/{id}/command (attendance_ok / attendance_error)
[ ESP32 SADITA ] ── Buzzer Beep 2x + OLED: "Hadir: Budi Santoso"
```

---

## 3. Schema & Topik MQTT

| Topik MQTT | Arah | Fungsi / Payload |
|---|---|---|
| `sadita/device/{device_id}/status` | Device → Backend | Heartbeat, uptime, RSSI WiFi, heap memory |
| `sadita/device/{device_id}/rfid` | Device → Backend | Event scan RFID: `{ "uid": "A1B2C3D4" }` |
| `sadita/device/{device_id}/fingerprint` | Device → Backend | Hasil verifikasi FP: `{ "result": "match", "template_id": 1, "confidence": 85 }` |
| `sadita/device/{device_id}/attendance` | Device → Backend | Bundle absensi lengkap post-auth (idempotency key: `event_id`) |
| `sadita/device/{device_id}/command` | Backend → Device | Perintah kontrol: `prompt_fingerprint`, `reject`, `attendance_ok` |
| `sadita/class/{class_id}/command` | Backend → Broadcast | Perintah kelas: `session_open`, `session_close` |
| `sadita/device/{device_id}/ack` | Device → Backend | Konfirmasi eksekusi perintah |

---

## 4. Siklus Sesi Absensi (Session Lifecycle)

```
[ SCHEDULED ] ──(Dosen klik "Buka Presensi")──► [ OPEN ] ──(Dosen klik "Tutup Presensi")──► [ CLOSED ]
                                                   │
                                                   ├── Otomatis inisialisasi ALFA untuk seluruh mahasiswa
                                                   ├── Broadcast MQTT session_open ke device kelas
                                                   └── Hitung toleransi waktu:
                                                         • check_in <= opened_at + 15m => HADIR
                                                         • check_in >  opened_at + 15m => TERLAMBAT
```

1. **SCHEDULED**: Sesi pertemuan (1 s.d. 16) dibuat dengan tanggal dan topik rencana.
2. **OPEN**:
   - Dosen membuka absensi di kelas.
   - Sistem secara otomatis mencatat seluruh mahasiswa yang terdaftar dengan status default **ALFA**.
   - Perangkat IoT menerima sinyal `session_open` dan siap memproses tap kartu.
3. **CLOSED**:
   - Dosen menutup sesi absensi.
   - Mahasiswa yang tidak melakukan check-in tetap berstatus **ALFA**.
   - Tidak ada lagi check-in IoT yang diterima untuk sesi ini.

---

## 5. Komponen Kode yang Dibangun

1. **Repository Layer** ([`app/repositories/attendance_repo.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/repositories/attendance_repo.py)):
   - `get_session_by_id`, `get_open_session_for_class`, `list_sessions_for_class`
   - `create_session`, `open_session`, `close_session`
   - `upsert_record` (idempoten berdasarkan `session_id` + `student_id`)
   - `bulk_initialize_records` (inisialisasi ALFA instan)
   - `get_records_for_session`, `get_records_for_student`

2. **Service Layer** ([`app/services/attendance_service.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/services/attendance_service.py)):
   - Validasi siklus sesi (mencegah pembukaan sesi ganda simultan dalam satu kelas)
   - Toleransi keterlambatan (`LATE_THRESHOLD_MINUTES = 15`) dengan penanganan timezone yang aman
   - Verifikasi 2-faktor (pencocokan RFID UID ke Mahasiswa, validasi template slot sidik jari & confidence threshold >= 40%)
   - Override manual oleh Dosen (IZIN, SAKIT, DISPENSASI)
   - Rekap statistik sesi (`hadir`, `terlambat`, `izin`, `sakit`, `alfa`, `total`)

3. **API Endpoints** ([`app/api/v1/endpoints/attendance.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/api/v1/endpoints/attendance.py)):
   - `POST /api/v1/attendance/sessions` — Buat sesi
   - `POST /api/v1/attendance/sessions/{id}/open` — Buka sesi + trigger MQTT
   - `POST /api/v1/attendance/sessions/{id}/close` — Tutup sesi + trigger MQTT
   - `GET /api/v1/attendance/sessions/{id}/records` — Rekap kehadiran sesi
   - `GET /api/v1/attendance/sessions/{id}/summary` — Statistik kehadiran sesi
   - `PUT /api/v1/attendance/sessions/{id}/manual` — Edit status manual oleh Dosen
   - `GET /api/v1/attendance/students/{id}/history` — Riwayat absensi mahasiswa
   - `POST /api/v1/attendance/iot/record` — REST fallback jika MQTT broker offline

4. **MQTT Pipeline** ([`app/mqtt/handlers.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/app/mqtt/handlers.py)):
   - Handler terdaftar untuk event `status`, `rfid`, `fingerprint`, `attendance`, `ack`
   - Terkoneksi ke Mosquitto broker port 1883

5. **Test Suite** ([`backend/tests/test_phase3_attendance.py`](file:///c:/Users/Rizal/Documents/Project/Sadita.ai/backend/tests/test_phase3_attendance.py)):
   - 23 test komprehensif mencakup unit testing logic, REST API, MQTT mocking, dan idempotency
