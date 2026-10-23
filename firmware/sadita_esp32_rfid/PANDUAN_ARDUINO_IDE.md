# 🚀 PANDUAN UPLOAD ARDUINO IDE — SADITA ESP32-S3 (RFID Only)

> **Mode:** 1FA (RFID RC522 Only)  
> **Komponen:** ESP32-S3 DevKitC-1 + RC522 + LCD I2C 16x2 + 2 LED (Hijau & Merah) + Buzzer  
> **Fingerprint AS608 & LED Kuning:** Dinonaktifkan sementara.

---

## 1. Skema Pengkabelan (Wiring Sederhana)

| Komponen | Pin Modul | Pin ESP32-S3 | Catatan Penting |
|---|---|---|---|
| **RFID RC522** | **3.3V** | **3V3** | ⚠️ **Wajib 3.3V** (Jangan 5V!) |
| | GND | GND | Ground |
| | RST | **GPIO 9** | Reset pin |
| | MISO | **GPIO 13** | HSPI MISO |
| | MOSI | **GPIO 11** | HSPI MOSI |
| | SCK | **GPIO 12** | HSPI SCK |
| | SDA (SS) | **GPIO 10** | Chip Select |
| **LCD 16x2 I2C** | VCC | **5V (VIN)** | 5V untuk lampu latar LCD terang |
| | GND | GND | Ground |
| | SDA | **GPIO 8** | I2C Data |
| | SCL | **GPIO 18** | I2C Clock |
| **LED Hijau** | Kaki (+) Panjang | **GPIO 4** | Pasang seri resistor 220Ω ke GND |
| **LED Merah** | Kaki (+) Panjang | **GPIO 6** | Pasang seri resistor 220Ω ke GND |
| **Buzzer Aktif** | Kaki (+) | **GPIO 7** | Kaki (-) ke GND |

*Semua kaki Ground (GND) dari modul, LED, dan buzzer dihubungkan bersama ke pin **GND** ESP32.*

---

## 2. Persiapan di Arduino IDE

### A. Install Board ESP32 (Jika belum ada)
1. Buka Arduino IDE -> **File** -> **Preferences**.
2. Pada kolom **Additional boards manager URLs**, masukkan URL:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Buka **Tools** -> **Board** -> **Boards Manager...**, cari `esp32` oleh **Espressif Systems** dan klik **Install**.

### B. Install 4 Library Wajib
Buka **Tools** -> **Manage Libraries...** (`Ctrl + Shift + I`), cari dan install masing-masing:
1. `MFRC522` (oleh *GithubCommunity / miguelbalboa*)
2. `LiquidCrystal I2C` (oleh *Frank de Brabander* atau *Marco Schwartz*)
3. `PubSubClient` (oleh *Nick O'Leary*)
4. `ArduinoJson` (oleh *Benoit Blanchon* — pilih versi 7.x)

---

## 3. Pengaturan Board di Tools Menu

Pilih menu **Tools** pada Arduino IDE dengan konfigurasi berikut:
- **Board:** `ESP32S3 Dev Module`
- **USB CDC On Boot:** `Enabled`  *(PENTING: Agar output Serial Monitor muncul)*
- **Upload Speed:** `921600`
- **Flash Size:** `8MB` atau `16MB`
- **Port:** Pilih COM Port ESP32 Anda (misal `COM3` / `COM5`)

---

## 4. Buka & Sesuaikan File Sketch

1. Buka file:
   📂 `firmware/sadita_esp32_rfid/sadita_esp32_rfid.ino`
2. Pada baris 37-43, sesuaikan SSID dan Password WiFi:
   ```cpp
   const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
   const char* WIFI_PASSWORD = "PASSWORD_WIFI";
   const char* MQTT_BROKER   = "192.168.1.7";  // IP PC backend saat ini
   ```
3. Klik tombol **Verify** (Centang) untuk memeriksa kompilasi.
4. Klik tombol **Upload** (Panah kanan).
5. Buka **Serial Monitor** pada baud rate `115200`.

---

## 5. Cara Pengujian Langsung (Live Test)

1. Pastikan backend SADITA sedang berjalan (jalankan `start.bat` di root project jika belum).
2. Nyalakan ESP32, tunggu hingga LCD bertuliskan:
   ```text
   SADITA Ready
   Tap KTM Anda...
   ```
   dan LED Hijau menyala.
3. Tap kartu RFID yang sudah terdaftar di database:
   - **Mochamad Rizal (NIM 202401001):** UID `A1B2C3D4`
   - **Siti Nurhaliza (NIM 202401003):** UID `E5F60718`
   - **Ahmad Dani (NIM 202401004):** UID `11223344`
   - *(Atau tap kartu fisik Anda, lalu catat UID yang muncul di Serial Monitor untuk didaftarkan ke mahasiswa)*.
4. LCD akan langsung menampilkan:
   ```text
   ABSEN BERHASIL
   Mochamad R HADIR
   ```
   diiringi 2x bip buzzer dan LED Hijau. Data presensi langsung masuk ke database backend!
