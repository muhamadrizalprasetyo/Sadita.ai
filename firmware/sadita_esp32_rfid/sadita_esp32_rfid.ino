// ==============================================================================
//  SADITA — Sistem Absensi Digital Terintegrasi Akademik
//  Firmware ESP32-S3 (Mode 1FA: RFID RC522 Only)
//  Dioptimalkan untuk: Arduino IDE
//  Board: ESP32-S3 Dev Module / ESP32-S3 DevKitC-1
// ==============================================================================
//  Komponen Terpasang:
//  1. ESP32-S3 DevKitC-1 (N16R8 / N8R2 / Standar)
//  2. RFID Reader MFRC522 (SPI)
//  3. LCD 16x2 I2C (PCF8574)
//  4. LED Hijau (Status OK / Standby)
//  5. LED Merah (Status Reject / Error)
//  6. Buzzer Aktif (Nada notifikasi)
//
//  * Catatan: Sensor Fingerprint AS608 & LED Kuning dinonaktifkan sementara.
// ==============================================================================

#include <WiFi.h>
#include <Wire.h>
#include <SPI.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ==============================================================================
// 1. PENGATURAN KONEKSI & PERANGKAT (SESUAIKAN DI SINI)
// ==============================================================================
#define DEVICE_ID         "SADITA-ESP32-LAB-01"  // ID unik perangkat di database
#define FIRMWARE_VERSION  "v1.1.0-rfid-only"

// WiFi Kampus / Lab / Hotspot HP
const char* WIFI_SSID     = "Pak Muono WiFi";        // Ganti dengan SSID WiFi Anda
const char* WIFI_PASSWORD = "rizalprasetyo";        // Ganti dengan Password WiFi Anda

// MQTT Broker (IP Komputer Backend yang menjalankan Mosquitto)
const char* MQTT_BROKER   = "192.168.1.8";       // IP lokal Wi-Fi komputer backend
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "";                  // Kosongkan jika tanpa username
const char* MQTT_PASS     = "";                  // Kosongkan jika tanpa password

// ==============================================================================
// 2. PIN MAPPING ESP32-S3
// ==============================================================================
// --- RFID RC522 (SPI Bus) ---
// ESP32-S3 Default SPI: SCK=GPIO 12, MISO=GPIO 13, MOSI=GPIO 11
#define RC522_SS_PIN      10    // Pin SDA / CS pada modul RC522
#define RC522_RST_PIN     9     // Pin RST pada modul RC522

// --- LCD 16x2 I2C ---
#define LCD_I2C_ADDR      0x27  // Alamat umum: 0x27 atau 0x3F
#define LCD_COLS          16
#define LCD_ROWS          2
#define PIN_I2C_SDA       8     // SDA I2C
#define PIN_I2C_SCL       18    // SCL I2C

// --- Indikator LED & Buzzer ---
#define PIN_LED_GREEN     4     // LED Hijau (Absen Sukses / Standby)
#define PIN_LED_RED       6     // LED Merah (Ditolak / Error)
#define PIN_BUZZER        7     // Buzzer Aktif

// ==============================================================================
// 3. TOPIK MQTT (Otomatis berdasarkan DEVICE_ID)
// ==============================================================================
#define TOPIC_STATUS      "sadita/device/" DEVICE_ID "/status"
#define TOPIC_RFID        "sadita/device/" DEVICE_ID "/rfid"
#define TOPIC_COMMAND     "sadita/device/" DEVICE_ID "/command"
#define TOPIC_ACK         "sadita/device/" DEVICE_ID "/ack"

// Konstanta Waktu
#define HEARTBEAT_INTERVAL_MS   30000   // Kirim status tiap 30 detik
#define LCD_RESULT_DURATION_MS  3500    // Tampilkan hasil selama 3.5 detik
#define DEBOUNCE_RFID_MS        2500    // Cegah double tap kartu yang sama

// ==============================================================================
// 4. OBJEK & VARIABEL GLOBAL
// ==============================================================================
MFRC522 rfid(RC522_SS_PIN, RC522_RST_PIN);
LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

enum SystemState {
    STATE_IDLE,          // Standby menunggu tap kartu
    STATE_PROCESSING,    // Sedang kirim data & menunggu balasan backend
    STATE_SHOW_RESULT    // Menampilkan pesan sukses / gagal di LCD
};

SystemState currentState = STATE_IDLE;
unsigned long lastHeartbeat = 0;
unsigned long lastRfidScan = 0;
unsigned long resultShowStart = 0;

// ==============================================================================
// 5. FUNGSI OUTPUT (LCD, LED, BUZZER)
// ==============================================================================
void setLeds(bool greenOn, bool redOn) {
    digitalWrite(PIN_LED_GREEN, greenOn ? HIGH : LOW);
    digitalWrite(PIN_LED_RED, redOn ? HIGH : LOW);
}

void lcdDisplay(const char* line1, const char* line2 = "") {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    if (line2 && strlen(line2) > 0) {
        lcd.setCursor(0, 1);
        lcd.print(line2);
    }
}

void buzzerBeepSuccess() {
    // 2x bip ceria bernada tinggi
    tone(PIN_BUZZER, 2000, 100);
    delay(140);
    tone(PIN_BUZZER, 2600, 120);
}

void buzzerBeepShort() {
    tone(PIN_BUZZER, 1800, 70);
}

void buzzerBeepError() {
    // 1x bip panjang bernada rendah
    tone(PIN_BUZZER, 800, 500);
}

String getTimestampISO() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 300)) {
        return String(millis() / 1000);
    }
    char buf[30];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buf);
}

void enterIdleState() {
    currentState = STATE_IDLE;
    setLeds(true, false); // Hijau menyala standby
    lcdDisplay("SADITA Ready", "Tap KTM Anda...");
}

// ==============================================================================
// 6. KONEKSI WIFI & MQTT
// ==============================================================================
void connectWiFi() {
    Serial.printf("\n[WiFi] Menghubungkan ke '%s' ...\n", WIFI_SSID);
    lcdDisplay("Menghubungkan", "WiFi...");
    setLeds(false, true);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] Terhubung! IP: %s\n", WiFi.localIP().toString().c_str());
        lcdDisplay("WiFi Terhubung!", WiFi.localIP().toString().c_str());
        // Sinkronisasi Waktu NTP (WIB = UTC+7 -> 25200 detik)
        configTime(25200, 0, "pool.ntp.org", "time.google.com");
        delay(1200);
    } else {
        Serial.println("\n[WiFi] GAGAL terhubung! Cek SSID/Password.");
        lcdDisplay("WiFi GAGAL!", "Cek SSID/Pass");
        delay(2500);
    }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload, length);
    if (err) {
        Serial.printf("[MQTT] Error parse JSON: %s\n", err.c_str());
        return;
    }

    const char* action = doc["action"] | "";
    Serial.printf("[MQTT] Perintah diterima: action='%s'\n", action);

    if (strcmp(action, "success") == 0) {
        // Backend mengonfirmasi presensi berhasil dicatat!
        const char* l1 = doc["lcd_line1"] | "ABSEN BERHASIL";
        const char* l2 = doc["lcd_line2"] | "";
        
        lcdDisplay(l1, l2);
        setLeds(true, false);
        buzzerBeepSuccess();

        currentState = STATE_SHOW_RESULT;
        resultShowStart = millis();
        Serial.printf("[PRESENSI] SUKSES: %s | %s\n", l1, l2);

    } else if (strcmp(action, "reject") == 0) {
        // Backend menolak (kartu tidak terdaftar, sesi ditutup, dsb)
        const char* l1 = doc["lcd_line1"] | "DITOLAK";
        const char* l2 = doc["lcd_line2"] | doc["reason"] | "Kartu Salah";

        lcdDisplay(l1, l2);
        setLeds(false, true);
        buzzerBeepError();

        currentState = STATE_SHOW_RESULT;
        resultShowStart = millis();
        Serial.printf("[PRESENSI] DITOLAK: %s | %s\n", l1, l2);

    } else if (strcmp(action, "session_open") == 0) {
        const char* className = doc["class_name"] | "Kelas";
        lcdDisplay("SESI DIBUKA", className);
        setLeds(true, false);
        buzzerBeepSuccess();
        delay(2000);
        enterIdleState();

    } else if (strcmp(action, "session_close") == 0) {
        lcdDisplay("SESI DITUTUP", "Terima Kasih");
        setLeds(false, true);
        buzzerBeepError();
        delay(2000);
        enterIdleState();
    }

    // Kirim konfirmasi penerimaan perintah (ACK) ke backend
    JsonDocument ackDoc;
    ackDoc["action"] = action;
    ackDoc["status"] = "received";
    ackDoc["device_id"] = DEVICE_ID;
    ackDoc["timestamp"] = getTimestampISO();
    char ackBuf[192];
    serializeJson(ackDoc, ackBuf);
    mqtt.publish(TOPIC_ACK, ackBuf);
}

void connectMQTT() {
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
    mqtt.setKeepAlive(60);
    mqtt.setBufferSize(1024);

    String clientId = String(DEVICE_ID) + "-" + String(millis());
    Serial.printf("[MQTT] Menghubungkan ke broker %s:%d ...\n", MQTT_BROKER, MQTT_PORT);
    lcdDisplay("Konek Broker...", MQTT_BROKER);

    int attempts = 0;
    while (!mqtt.connected() && attempts < 4) {
        bool ok = false;
        if (strlen(MQTT_USER) > 0) {
            ok = mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
        } else {
            ok = mqtt.connect(clientId.c_str());
        }

        if (ok) {
            Serial.println("[MQTT] Terhubung ke Broker!");
            mqtt.subscribe(TOPIC_COMMAND, 1);
            Serial.printf("[MQTT] Subscribed topik: %s\n", TOPIC_COMMAND);
            return;
        }

        Serial.printf("[MQTT] Gagal (rc=%d), mencoba lagi...\n", mqtt.state());
        attempts++;
        delay(1500);
    }

    Serial.println("[MQTT] Gagal terhubung ke broker! Cek IP host dan firewall.");
    lcdDisplay("MQTT GAGAL!", "Cek IP Server");
    delay(2000);
}

void sendHeartbeat() {
    if (!mqtt.connected()) return;

    JsonDocument doc;
    doc["device_id"] = DEVICE_ID;
    doc["mode"] = "rfid_only";
    doc["uptime_sec"] = millis() / 1000;
    doc["wifi_rssi"] = WiFi.RSSI();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["firmware"] = FIRMWARE_VERSION;
    doc["timestamp"] = getTimestampISO();

    char buf[384];
    serializeJson(doc, buf);
    mqtt.publish(TOPIC_STATUS, buf);
    Serial.println("[Status] Heartbeat terkirim ke backend");
}

// ==============================================================================
// 7. PEMBACAAN RFID RC522 (Mode 1FA)
// ==============================================================================
void handleRFID() {
    // Debounce agar kartu yang sama tidak terbaca berulang seketika
    if (millis() - lastRfidScan < DEBOUNCE_RFID_MS) return;

    // Cek ada kartu baru yang mendekat
    if (!rfid.PICC_IsNewCardPresent()) return;
    if (!rfid.PICC_ReadCardSerial()) return;

    // Baca UID kartu dalam format HEX (contoh: A1B2C3D4)
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
        if (rfid.uid.uidByte[i] < 0x10) uid += "0";
        uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    lastRfidScan = millis();
    Serial.printf("\n[RFID] Kartu terdeteksi: UID = %s\n", uid.c_str());

    // Indikasi saat kartu terbaca
    lcdDisplay("Kartu Terbaca", uid.c_str());
    buzzerBeepShort();
    setLeds(true, true); // Hijau & Merah kedip sesaat tanda memproses
    currentState = STATE_PROCESSING;

    // Publikasikan event tap RFID dengan mode "rfid_only"
    // Backend akan memproses presensi langsung tanpa meminta scan sidik jari!
    JsonDocument doc;
    doc["uid"] = uid;
    doc["device_id"] = DEVICE_ID;
    doc["mode"] = "rfid_only";
    doc["timestamp"] = getTimestampISO();

    char buf[256];
    serializeJson(doc, buf);
    mqtt.publish(TOPIC_RFID, buf, false);
    Serial.printf("[MQTT] Dikirim ke topik '%s' (mode: rfid_only)\n", TOPIC_RFID);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
}

// ==============================================================================
// 8. SETUP UTAMA
// ==============================================================================
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n\n========================================");
    Serial.println("  SADITA ESP32-S3 Firmware (RFID Only)");
    Serial.printf("  Device ID: %s\n", DEVICE_ID);
    Serial.printf("  Firmware:  %s\n", FIRMWARE_VERSION);
    Serial.println("========================================");

    // Inisialisasi Pin LED & Buzzer
    pinMode(PIN_LED_GREEN, OUTPUT);
    pinMode(PIN_LED_RED, OUTPUT);
    pinMode(PIN_BUZZER, OUTPUT);
    setLeds(false, true); // Merah menyala saat booting

    // Inisialisasi LCD 16x2 I2C
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    lcd.init();
    lcd.backlight();
    lcdDisplay("SADITA v1.1", "Booting...");
    delay(600);

    // Inisialisasi RFID RC522 via SPI (SCK=12, MISO=13, MOSI=11, SS=10)
    SPI.begin(12, 13, 11, RC522_SS_PIN);
    rfid.PCD_Init();
    delay(100);
    Serial.println("[Hardware] RFID RC522 diinisialisasi.");

    // Koneksi WiFi & MQTT
    connectWiFi();
    connectMQTT();

    // Siap beroperasi
    enterIdleState();
    sendHeartbeat();
    Serial.println("=== SADITA ESP32-S3 Siap Digunakan! ===\n");
}

// ==============================================================================
// 9. LOOP UTAMA
// ==============================================================================
void loop() {
    // Jaga koneksi MQTT
    if (!mqtt.connected()) {
        connectMQTT();
    }
    mqtt.loop();

    // Jaga koneksi WiFi
    if (WiFi.status() != WL_CONNECTED) {
        connectWiFi();
    }

    // Heartbeat berkala
    if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
        sendHeartbeat();
        lastHeartbeat = millis();
    }

    // Mesin Status (FSM)
    switch (currentState) {
        case STATE_IDLE:
            handleRFID();
            break;

        case STATE_PROCESSING:
            // Sedang menunggu balasan MQTT dari backend...
            // Jika dalam 5 detik tidak ada balasan dari backend:
            if (millis() - lastRfidScan > 5000) {
                lcdDisplay("TIMEOUT SERVER", "Coba Lagi");
                setLeds(false, true);
                buzzerBeepError();
                currentState = STATE_SHOW_RESULT;
                resultShowStart = millis();
            }
            break;

        case STATE_SHOW_RESULT:
            // Tampilkan hasil sukses / gagal selama LCD_RESULT_DURATION_MS
            if (millis() - resultShowStart > LCD_RESULT_DURATION_MS) {
                enterIdleState();
            }
            break;
    }

    delay(20);
}
