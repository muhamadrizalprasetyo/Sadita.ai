// ============================================================
// SADITA — ESP32-S3 Firmware Main
// Sistem Absensi 2FA: RFID (RC522) + Fingerprint (AS608)
// Komunikasi: MQTT over WiFi ke Backend FastAPI
// ============================================================

#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Adafruit_Fingerprint.h>
#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

#include "config.h"

// ============================================================
// GLOBAL OBJECTS
// ============================================================

// RFID
MFRC522 rfid(RC522_SS_PIN, RC522_RST_PIN);

// Fingerprint — menggunakan Serial1 di ESP32-S3
HardwareSerial fpSerial(1);
Adafruit_Fingerprint finger(&fpSerial);

// LCD I2C
LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);

// MQTT
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// ============================================================
// STATE MACHINE
// ============================================================
enum DeviceState {
    STATE_IDLE,               // Menunggu tap RFID
    STATE_WAITING_FINGERPRINT, // RFID valid, menunggu sidik jari
    STATE_PROCESSING,          // Sedang memproses (kirim ke backend)
    STATE_DISPLAY_RESULT       // Menampilkan hasil di LCD
};

DeviceState currentState = STATE_IDLE;
unsigned long lastHeartbeat = 0;
unsigned long lastRfidTap = 0;
unsigned long fpWaitStart = 0;
unsigned long displayStart = 0;
String pendingRfidUid = "";
String lastStudentName = "";
int pendingFpSlot = -1;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

String getTimestampISO() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 500)) {
        return String(millis() / 1000);
    }
    char buf[30];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buf);
}

void lcdPrint(const char* line1, const char* line2 = "") {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    if (strlen(line2) > 0) {
        lcd.setCursor(0, 1);
        lcd.print(line2);
    }
}

void setLed(const char* color) {
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(LED_YELLOW_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);

    if (strcmp(color, "GREEN") == 0)       digitalWrite(LED_GREEN_PIN, HIGH);
    else if (strcmp(color, "YELLOW") == 0) digitalWrite(LED_YELLOW_PIN, HIGH);
    else if (strcmp(color, "RED") == 0)    digitalWrite(LED_RED_PIN, HIGH);
}

void buzzerBeep(const char* pattern) {
    if (strcmp(pattern, "SUCCESS") == 0) {
        // 2x beep pendek
        tone(BUZZER_PIN, 2000, 100); delay(150);
        tone(BUZZER_PIN, 2500, 100);
    } else if (strcmp(pattern, "BEEP_SHORT") == 0) {
        tone(BUZZER_PIN, 1800, 80);
    } else if (strcmp(pattern, "ERROR") == 0) {
        // 1x beep panjang nada rendah
        tone(BUZZER_PIN, 800, 500);
    }
}

// ============================================================
// WiFi CONNECTION
// ============================================================
void connectWiFi() {
    Serial.printf("Connecting to WiFi '%s'", WIFI_SSID);
    lcdPrint("Connecting WiFi", WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 40) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\nWiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
        lcdPrint("WiFi OK!", WiFi.localIP().toString().c_str());
        delay(1000);
    } else {
        Serial.println("\nWiFi FAILED!");
        lcdPrint("WiFi GAGAL!", "Cek SSID/Pass");
        delay(3000);
    }

    // Sync NTP time
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET, NTP_SERVER);
}

// ============================================================
// MQTT CALLBACKS & CONNECTION
// ============================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    // Parse JSON payload
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload, length);
    if (err) {
        Serial.printf("JSON parse error: %s\n", err.c_str());
        return;
    }

    const char* action = doc["action"] | "";
    Serial.printf("[MQTT] Received command: action='%s'\n", action);

    // Handle command from backend
    if (strcmp(action, "prompt_fingerprint") == 0) {
        // Backend confirmed RFID valid — prompt fingerprint
        const char* lcd1 = doc["lcd_line1"] | "RFID BERHASIL";
        const char* lcd2 = doc["lcd_line2"] | "Tempelkan Jari";
        const char* led = doc["led"] | "YELLOW";
        const char* buzz = doc["buzzer"] | "BEEP_SHORT";
        pendingFpSlot = doc["fingerprint_slot"] | -1;
        lastStudentName = doc["student_name"] | "Mahasiswa";

        lcdPrint(lcd1, lcd2);
        setLed(led);
        buzzerBeep(buzz);

        currentState = STATE_WAITING_FINGERPRINT;
        fpWaitStart = millis();
        Serial.printf("Waiting fingerprint for slot #%d (%s)\n", pendingFpSlot, lastStudentName.c_str());

    } else if (strcmp(action, "success") == 0) {
        // Attendance recorded successfully
        const char* lcd1 = doc["lcd_line1"] | "ABSEN BERHASIL";
        const char* lcd2 = doc["lcd_line2"] | "";
        const char* led = doc["led"] | "GREEN";
        const char* buzz = doc["buzzer"] | "SUCCESS";

        lcdPrint(lcd1, lcd2);
        setLed(led);
        buzzerBeep(buzz);

        currentState = STATE_DISPLAY_RESULT;
        displayStart = millis();
        pendingRfidUid = "";
        pendingFpSlot = -1;
        Serial.println("Attendance SUCCESS!");

    } else if (strcmp(action, "reject") == 0) {
        // Rejected by backend
        const char* lcd1 = doc["lcd_line1"] | "DITOLAK";
        const char* lcd2 = doc["lcd_line2"] | "";
        const char* led = doc["led"] | "RED";
        const char* buzz = doc["buzzer"] | "ERROR";

        lcdPrint(lcd1, lcd2);
        setLed(led);
        buzzerBeep(buzz);

        currentState = STATE_DISPLAY_RESULT;
        displayStart = millis();
        pendingRfidUid = "";
        pendingFpSlot = -1;
        Serial.printf("REJECTED: %s\n", doc["reason"] | "");

    } else if (strcmp(action, "session_open") == 0) {
        const char* className = doc["class_name"] | "Kelas";
        lcdPrint("SESI DIBUKA", className);
        setLed("GREEN");
        buzzerBeep("SUCCESS");
        delay(2000);
        currentState = STATE_IDLE;
        lcdPrint("SADITA Ready", "Tap KTM Anda...");
        setLed("GREEN");

    } else if (strcmp(action, "session_close") == 0) {
        lcdPrint("SESI DITUTUP", "Terima Kasih");
        setLed("RED");
        buzzerBeep("ERROR");
        delay(2000);
        currentState = STATE_IDLE;
        lcdPrint("SADITA Standby", "Sesi Ditutup");
    }

    // Send ACK back to backend
    JsonDocument ackDoc;
    ackDoc["action"] = action;
    ackDoc["status"] = "received";
    ackDoc["timestamp"] = getTimestampISO();
    char ackBuf[256];
    serializeJson(ackDoc, ackBuf);
    mqtt.publish(TOPIC_ACK, ackBuf);
}

void connectMQTT() {
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
    mqtt.setKeepAlive(MQTT_KEEPALIVE);
    mqtt.setBufferSize(1024);

    String clientId = String(DEVICE_ID) + "-" + String(millis());

    Serial.printf("Connecting to MQTT broker %s:%d ...\n", MQTT_BROKER, MQTT_PORT);
    lcdPrint("MQTT Connecting", MQTT_BROKER);

    int attempts = 0;
    while (!mqtt.connected() && attempts < 5) {
        bool connected;
        if (strlen(MQTT_USERNAME) > 0) {
            connected = mqtt.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD);
        } else {
            connected = mqtt.connect(clientId.c_str());
        }

        if (connected) {
            Serial.println("MQTT connected!");
            lcdPrint("MQTT OK!", "Subscribing...");
            // Subscribe to command topic from backend
            mqtt.subscribe(TOPIC_COMMAND, 1);
            Serial.printf("Subscribed to: %s\n", TOPIC_COMMAND);
            delay(500);
            return;
        }

        Serial.printf("MQTT connect failed (rc=%d), retrying...\n", mqtt.state());
        attempts++;
        delay(2000);
    }

    Serial.println("MQTT connection FAILED after retries!");
    lcdPrint("MQTT GAGAL!", "Cek Broker");
    delay(2000);
}

// ============================================================
// SEND HEARTBEAT / STATUS
// ============================================================
void sendHeartbeat() {
    JsonDocument doc;
    doc["uptime_seconds"] = millis() / 1000;
    doc["firmware_version"] = FIRMWARE_VERSION;
    doc["wifi_rssi"] = WiFi.RSSI();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["session_open"] = (currentState != STATE_IDLE);
    doc["timestamp"] = getTimestampISO();

    char buf[512];
    serializeJson(doc, buf);
    mqtt.publish(TOPIC_STATUS, buf);
    Serial.println("[Heartbeat] Status sent");
}

// ============================================================
// RFID SCAN — Step 1 of 2FA
// ============================================================
void handleRFID() {
    // Check debounce
    if (millis() - lastRfidTap < DEBOUNCE_RFID_MS) return;

    // Check for new card
    if (!rfid.PICC_IsNewCardPresent()) return;
    if (!rfid.PICC_ReadCardSerial()) return;

    // Extract UID as hex string
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
        if (rfid.uid.uidByte[i] < 0x10) uid += "0";
        uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    Serial.printf("[RFID] Card detected: UID = %s\n", uid.c_str());

    // Visual feedback — card detected
    lcdPrint("Kartu Terdeteksi", uid.c_str());
    setLed("YELLOW");
    buzzerBeep("BEEP_SHORT");

    // Save state
    pendingRfidUid = uid;
    lastRfidTap = millis();
    currentState = STATE_PROCESSING;

    // Publish RFID event to backend via MQTT
    JsonDocument doc;
    doc["uid"] = uid;
    doc["device_id"] = DEVICE_ID;
    doc["timestamp"] = getTimestampISO();

    char buf[256];
    serializeJson(doc, buf);
    mqtt.publish(TOPIC_RFID, buf, true);
    Serial.printf("[MQTT] Published RFID to %s\n", TOPIC_RFID);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
}

// ============================================================
// FINGERPRINT SCAN — Step 2 of 2FA
// ============================================================
int getFingerprintID() {
    uint8_t p = finger.getImage();
    if (p != FINGERPRINT_OK) return -1;

    p = finger.image2Tz();
    if (p != FINGERPRINT_OK) return -2;

    p = finger.fingerFastSearch();
    if (p != FINGERPRINT_OK) return -3;

    // Match found!
    Serial.printf("[FP] Match found! ID: %d, Confidence: %d\n", finger.fingerID, finger.confidence);
    return finger.fingerID;
}

void handleFingerprint() {
    if (currentState != STATE_WAITING_FINGERPRINT) return;

    // Check timeout
    if (millis() - fpWaitStart > FP_TIMEOUT_MS) {
        Serial.println("[FP] Timeout — sidik jari tidak terdeteksi");
        lcdPrint("TIMEOUT!", "Tap KTM Ulang");
        setLed("RED");
        buzzerBeep("ERROR");
        currentState = STATE_DISPLAY_RESULT;
        displayStart = millis();
        pendingRfidUid = "";
        return;
    }

    int result = getFingerprintID();
    if (result < 0) return;  // No finger placed yet or error

    int templateId = finger.fingerID;
    int confidence = finger.confidence;

    Serial.printf("[FP] Verified: slot=%d confidence=%d%%\n", templateId, confidence);

    // Visual feedback
    lcdPrint("Verifikasi...", "Mengirim data");
    setLed("YELLOW");

    currentState = STATE_PROCESSING;

    // Publish fingerprint result to backend
    JsonDocument doc;
    doc["result"] = "match";
    doc["template_id"] = templateId;
    doc["confidence"] = confidence;
    doc["rfid_uid"] = pendingRfidUid;
    doc["device_id"] = DEVICE_ID;
    doc["timestamp"] = getTimestampISO();

    char buf[512];
    serializeJson(doc, buf);
    mqtt.publish(TOPIC_FINGERPRINT, buf);
    Serial.printf("[MQTT] Published fingerprint to %s\n", TOPIC_FINGERPRINT);
}

// ============================================================
// SETUP
// ============================================================
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n\n=== SADITA ESP32-S3 Starting ===");
    Serial.printf("Device ID: %s\n", DEVICE_ID);
    Serial.printf("Firmware:  %s\n", FIRMWARE_VERSION);

    // --- Initialize GPIO ---
    pinMode(LED_GREEN_PIN, OUTPUT);
    pinMode(LED_YELLOW_PIN, OUTPUT);
    pinMode(LED_RED_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    setLed("RED");  // Red during boot

    // --- Initialize LCD ---
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    lcd.init();
    lcd.backlight();
    lcdPrint("SADITA v1.0", "Booting...");
    delay(500);

    // --- Initialize RFID RC522 ---
    SPI.begin(12, 13, 11, RC522_SS_PIN);  // SCK, MISO, MOSI, SS
    rfid.PCD_Init();
    delay(100);
    if (rfid.PCD_PerformSelfTest()) {
        Serial.println("[RFID] RC522 initialized OK");
        lcdPrint("RFID: OK", "");
    } else {
        Serial.println("[RFID] RC522 FAILED! Check wiring.");
        lcdPrint("RFID: GAGAL!", "Cek Kabel SPI");
    }
    rfid.PCD_Init();  // Re-init after self-test
    delay(300);

    // --- Initialize Fingerprint AS608 ---
    fpSerial.begin(FP_BAUD_RATE, SERIAL_8N1, FP_RX_PIN, FP_TX_PIN);
    finger.begin(FP_BAUD_RATE);
    if (finger.verifyPassword()) {
        Serial.printf("[FP] AS608 found! Templates stored: %d\n", finger.templateCount);
        lcdPrint("Fingerprint: OK", "");
    } else {
        Serial.println("[FP] AS608 NOT FOUND! Check wiring (RX/TX).");
        lcdPrint("FP: GAGAL!", "Cek Kabel UART");
    }
    delay(300);

    // --- WiFi ---
    connectWiFi();

    // --- MQTT ---
    connectMQTT();

    // --- Ready! ---
    setLed("GREEN");
    lcdPrint("SADITA Ready", "Tap KTM Anda...");
    sendHeartbeat();

    Serial.println("=== SADITA ESP32-S3 Ready! ===\n");
}

// ============================================================
// MAIN LOOP
// ============================================================
void loop() {
    // Maintain MQTT connection
    if (!mqtt.connected()) {
        Serial.println("MQTT disconnected, reconnecting...");
        connectMQTT();
    }
    mqtt.loop();

    // Maintain WiFi
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi lost, reconnecting...");
        connectWiFi();
    }

    // Periodic heartbeat
    if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
        sendHeartbeat();
        lastHeartbeat = millis();
    }

    // State machine
    switch (currentState) {
        case STATE_IDLE:
            handleRFID();
            break;

        case STATE_WAITING_FINGERPRINT:
            handleFingerprint();
            break;

        case STATE_PROCESSING:
            // Waiting for backend response via MQTT callback
            break;

        case STATE_DISPLAY_RESULT:
            // Show result for LCD_DISPLAY_DURATION_MS then return to IDLE
            if (millis() - displayStart > LCD_DISPLAY_DURATION_MS) {
                currentState = STATE_IDLE;
                lcdPrint("SADITA Ready", "Tap KTM Anda...");
                setLed("GREEN");
            }
            break;
    }

    delay(50);  // Prevent CPU overload
}
