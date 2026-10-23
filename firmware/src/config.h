// ============================================================
// SADITA — Configuration Header
// WiFi, MQTT, and pin definitions for ESP32-S3
// ============================================================
#ifndef SADITA_CONFIG_H
#define SADITA_CONFIG_H

// ============================================================
// DEVICE IDENTITY — Ubah per perangkat!
// ============================================================
#define DEVICE_ID         "SADITA-ESP32-LAB-01"
#define FIRMWARE_VERSION  "v1.0.0"

// ============================================================
// WiFi CREDENTIALS — Sesuaikan dengan jaringan kampus
// ============================================================
#define WIFI_SSID         "SADITA-LAB"
#define WIFI_PASSWORD     "sadita2026"

// ============================================================
// MQTT BROKER — Sesuaikan dengan IP server backend
// ============================================================
#define MQTT_BROKER       "192.168.1.7"      // IP komputer backend (Wi-Fi local IP saat ini)
#define MQTT_PORT         1883
#define MQTT_USERNAME     ""                  // Kosongkan jika Mosquitto tanpa auth
#define MQTT_PASSWORD     ""
#define MQTT_KEEPALIVE    60

// ============================================================
// NTP TIME SYNC
// ============================================================
#define NTP_SERVER        "pool.ntp.org"
#define GMT_OFFSET_SEC    25200               // WIB = UTC+7 = 7*3600
#define DAYLIGHT_OFFSET   0

// ============================================================
// PIN DEFINITIONS — ESP32-S3 DevKitC-1
// ============================================================

// --- RFID RC522 (SPI) ---
// MOSI = GPIO 11, MISO = GPIO 13, SCK = GPIO 12 (Default HSPI)
#define RC522_SS_PIN      10     // SDA/CS
#define RC522_RST_PIN     9      // RST

// --- Fingerprint AS608 (UART / Serial) ---
#define FP_RX_PIN         16     // ESP32 RX ← AS608 TX (kabel hijau)
#define FP_TX_PIN         17     // ESP32 TX → AS608 RX (kabel putih)
#define FP_BAUD_RATE      57600

// --- LCD I2C 16x2 ---
#define LCD_ADDR          0x27   // Alamat I2C (cek dulu pakai I2C Scanner!)
#define LCD_COLS          16
#define LCD_ROWS          2
#define I2C_SDA_PIN       8      // SDA
#define I2C_SCL_PIN       18     // SCL

// --- LED Indikator ---
#define LED_GREEN_PIN     4
#define LED_YELLOW_PIN    5
#define LED_RED_PIN       6

// --- Buzzer ---
#define BUZZER_PIN        7

// ============================================================
// MQTT TOPICS (auto-generated from DEVICE_ID)
// ============================================================
#define TOPIC_STATUS      "sadita/device/" DEVICE_ID "/status"
#define TOPIC_RFID        "sadita/device/" DEVICE_ID "/rfid"
#define TOPIC_FINGERPRINT "sadita/device/" DEVICE_ID "/fingerprint"
#define TOPIC_ATTENDANCE  "sadita/device/" DEVICE_ID "/attendance"
#define TOPIC_COMMAND     "sadita/device/" DEVICE_ID "/command"
#define TOPIC_ACK         "sadita/device/" DEVICE_ID "/ack"

// ============================================================
// TIMING CONSTANTS
// ============================================================
#define HEARTBEAT_INTERVAL_MS    30000    // 30 detik
#define FP_TIMEOUT_MS            10000    // 10 detik tunggu sidik jari
#define LCD_DISPLAY_DURATION_MS  3000     // 3 detik tampilkan pesan
#define DEBOUNCE_RFID_MS         2000     // 2 detik anti double-tap

#endif // SADITA_CONFIG_H
