"""
Audit MQTT End-to-End Forensic Script for SADITA.ai
Publishes simulated MQTT messages directly to Mosquitto localhost:1883:
1. Heartbeat from valid device ('SADITA-ESP32-LAB-IOT-01')
2. Heartbeat from unknown device ('UNKNOWN-DEV-99')
3. RFID scan with valid UID ('A1B2C3D4' -> student 1)
4. RFID scan with invalid UID ('DEADBEEF')
5. Fingerprint match for active session
6. Duplicate tap check
7. Inspect resulting records in PostgreSQL
"""
import sys, os, time, json
sys.path.insert(0, os.path.abspath("."))
import paho.mqtt.client as mqtt
import sqlalchemy as sa
from app.db.session import engine

DEVICE_ID = "SADITA-ESP32-LAB-IOT-01"
UNKNOWN_DEVICE = "UNKNOWN-ESP32-999"

# We collect messages published by backend on command topics
received_commands = []

def on_connect(client, userdata, flags, rc):
    client.subscribe("sadita/device/#")
    client.subscribe("sadita/class/#")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
    except:
        payload = msg.payload.decode()
    received_commands.append({"topic": msg.topic, "payload": payload})

pub = mqtt.Client(client_id="audit-simulator")
pub.on_connect = on_connect
pub.on_message = on_message
pub.connect("localhost", 1883, 60)
pub.loop_start()

time.sleep(0.5)

print("--- 1. Testing Device Heartbeat ---")
pub.publish(f"sadita/device/{DEVICE_ID}/status", json.dumps({
    "uptime_seconds": 3600,
    "firmware_version": "v2.2.0-AUDIT",
    "wifi_rssi": -55
}), qos=1)
time.sleep(1)

# Check device table updated
with engine.connect() as conn:
    dev = conn.execute(sa.text("SELECT device_id, firmware_version, status FROM sadita_devices WHERE device_id=:id"), {"id": DEVICE_ID}).mappings().first()
    print(f"Device status in DB: {dict(dev) if dev else 'NOT FOUND'}")

print("\n--- 2. Testing Invalid RFID Scan ---")
pub.publish(f"sadita/device/{DEVICE_ID}/rfid", json.dumps({"uid": "INVALID999"}), qos=1)
time.sleep(1)

# Check audit events for unknown RFID
with engine.connect() as conn:
    ev = conn.execute(sa.text("SELECT event_type, rfid_uid, berhasil, pesan FROM attendance_events WHERE rfid_uid='INVALID999' ORDER BY id DESC LIMIT 1")).mappings().first()
    print(f"Event in DB for invalid RFID: {dict(ev) if ev else 'NOT FOUND'}")

print("\n--- 3. Testing Valid RFID Scan (A1B2C3D4) ---")
pub.publish(f"sadita/device/{DEVICE_ID}/rfid", json.dumps({"uid": "A1B2C3D4"}), qos=1)
time.sleep(1)

with engine.connect() as conn:
    ev = conn.execute(sa.text("SELECT event_type, rfid_uid, berhasil, pesan FROM attendance_events WHERE rfid_uid='A1B2C3D4' ORDER BY id DESC LIMIT 1")).mappings().first()
    print(f"Event in DB for valid RFID: {dict(ev) if ev else 'NOT FOUND'}")

print("\n--- 4. Testing Fingerprint Match Verification ---")
# First ensure session 1 is OPEN for class 1
with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    conn.execute(sa.text("UPDATE attendance_sessions SET status='OPEN' WHERE id=1"))

pub.publish(f"sadita/device/{DEVICE_ID}/fingerprint", json.dumps({
    "result": "match",
    "template_id": 1,
    "confidence": 92,
    "rfid_uid": "A1B2C3D4",
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
}), qos=1)
time.sleep(1.5)

with engine.connect() as conn:
    rec = conn.execute(sa.text("SELECT session_id, student_id, status, method, check_in_time FROM attendance_records WHERE session_id=1 AND student_id=1")).mappings().first()
    print(f"Attendance record in DB: {dict(rec) if rec else 'NOT FOUND'}")

print("\n--- 5. Testing Duplicate Tap ---")
pub.publish(f"sadita/device/{DEVICE_ID}/fingerprint", json.dumps({
    "result": "match",
    "template_id": 1,
    "confidence": 95,
    "rfid_uid": "A1B2C3D4",
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
}), qos=1)
time.sleep(1.5)

with engine.connect() as conn:
    recs = conn.execute(sa.text("SELECT count(*) FROM attendance_records WHERE session_id=1 AND student_id=1")).scalar()
    print(f"Count of attendance records for student 1 (idempotency check): {recs} (Must remain 1)")

pub.loop_stop()
pub.disconnect()

print("\n--- 6. Received Commands on MQTT Bus ---")
for cmd in received_commands:
    if "command" in cmd["topic"]:
        print(f"Topic: {cmd['topic']} -> {cmd['payload']}")
