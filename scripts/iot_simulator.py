"""
SADITA — IoT Hardware Simulator (ESP32 + RC522 + AS608)
Emulates the physical SADITA device on the lecturer's desk.
Supports both MQTT (real-time broker) and REST API (fallback).

Usage:
  python scripts/iot_simulator.py --interactive
  python scripts/iot_simulator.py --auto
  python scripts/iot_simulator.py --device-id SADITA-DEV-01 --rfid A1B2C3D4 --slot 1
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("paho-mqtt not found. Run: uv pip install paho-mqtt")
    sys.exit(1)

try:
    import requests
except ImportError:
    import urllib.request as requests_fallback

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [SADITA-DEVICE] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("SADITADevice")

# Sample student test database for simulation
SAMPLE_STUDENTS = [
    {"nim": "22.11.0001", "name": "Budi Santoso", "rfid": "AABBCCDD", "slot": 1},
    {"nim": "22.11.0002", "name": "Siti Rahmawati", "rfid": "BBCCDDEE", "slot": 2},
    {"nim": "22.11.0003", "name": "Ahmad Fauzi", "rfid": "CCDDEEFF", "slot": 3},
    {"nim": "22.11.0004", "name": "Dewi Lestari", "rfid": "DDEEFF00", "slot": 4},
]


class SADITAESP32Simulator:
    def __init__(
        self,
        device_id: str = "SADITA-ESP32-01",
        broker_host: str = "localhost",
        broker_port: int = 1883,
        backend_url: str = "http://localhost:8000",
    ) -> None:
        self.device_id = device_id
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.backend_url = backend_url

        self.client: Optional[mqtt.Client] = None
        self.connected = False
        self.current_session_id: Optional[int] = None
        self.waiting_for_fingerprint = False
        self.pending_rfid: Optional[str] = None

    # ------------------------------------------------------------------
    # MQTT Lifecycle
    # ------------------------------------------------------------------
    def connect_mqtt(self) -> bool:
        client_id = f"sim-{self.device_id}-{int(time.time())}"
        self.client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2,
            client_id=client_id,
            protocol=mqtt.MQTTv5,
        )
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()
            logger.info("Connecting to MQTT broker %s:%d ...", self.broker_host, self.broker_port)
            time.sleep(1)  # wait for CONNACK
            return self.connected
        except Exception as exc:
            logger.warning("Failed to connect to MQTT broker: %s", exc)
            return False

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            self.connected = True
            logger.info("Connected to broker! Subscribing to device command topic...")
            cmd_topic = f"sadita/device/{self.device_id}/command"
            broadcast_topic = "sadita/class/+/command"
            client.subscribe([(cmd_topic, 1), (broadcast_topic, 1)])
            logger.info("Subscribed to: %s & %s", cmd_topic, broadcast_topic)
            self.send_heartbeat()
        else:
            logger.error("Broker connection rejected, reason=%s", reason_code)

    def _on_disconnect(self, client, userdata, flags, reason_code, properties):
        self.connected = False
        logger.warning("Disconnected from MQTT broker (reason: %s)", reason_code)

    def _on_message(self, client, userdata, message):
        topic = message.topic
        try:
            payload = json.loads(message.payload.decode("utf-8"))
        except Exception as e:
            logger.warning("Invalid JSON received: %s", e)
            return

        action = payload.get("action")
        logger.info("[OLED DISPLAY] Received backend command '%s' on %s", action, topic)

        if action == "session_open":
            self.current_session_id = payload.get("session_id")
            class_name = payload.get("class_name", "")
            logger.info(
                ">>> [OLED] SESI DIBUKA! Kelas: %s | Sesi ID: %s. Silakan Tap KTM.",
                class_name,
                self.current_session_id,
            )

        elif action == "session_close":
            logger.info(">>> [OLED] SESI DITUTUP oleh Dosen. Presensi berakhir.")
            self.current_session_id = None

        elif action == "prompt_fingerprint":
            self.waiting_for_fingerprint = True
            self.pending_rfid = payload.get("rfid_uid")
            name = payload.get("student_name", "Mahasiswa")
            slot = payload.get("fingerprint_slot", "?")
            logger.info(
                ">>> [OLED] KARTU TERDETEKSI: %s. Tempelkan jari pada sensor (Slot #%s)...",
                name,
                slot,
            )

        elif action == "attendance_ok":
            self.waiting_for_fingerprint = False
            self.pending_rfid = None
            status = payload.get("status", "HADIR")
            logger.info(">>> [OLED + BUZZER BEEP 2X] SUKSES! Status kehadiran: %s", status)

        elif action == "reject":
            self.waiting_for_fingerprint = False
            reason = payload.get("reason", "Ditolak")
            logger.warning(">>> [OLED + BUZZER LONG BEEP] DITOLAK: %s", reason)

    # ------------------------------------------------------------------
    # Simulation Actions
    # ------------------------------------------------------------------
    def send_heartbeat(self):
        topic = f"sadita/device/{self.device_id}/status"
        payload = {
            "uptime_seconds": 120,
            "firmware_version": "v1.0.4-esp32",
            "wifi_rssi": -55,
            "free_heap": 182400,
            "session_open": self.current_session_id is not None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if self.connected and self.client:
            self.client.publish(topic, json.dumps(payload), qos=1)
            logger.info("Sent heartbeat to %s", topic)

    def tap_rfid(self, uid: str):
        """Simulate tapping an RFID card on the RC522 reader."""
        logger.info("[HARDWARE] RC522: RFID Card tapped with UID: %s", uid)
        topic = f"sadita/device/{self.device_id}/rfid"
        payload = {
            "uid": uid,
            "device_id": self.device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if self.connected and self.client:
            self.client.publish(topic, json.dumps(payload), qos=1)
            logger.info("Published RFID scan event to %s", topic)
        else:
            logger.warning("MQTT not connected, skipping RFID event.")

    def scan_fingerprint(self, slot_id: int, confidence: int = 85, rfid_uid: Optional[str] = None):
        """Simulate placing a finger on the AS608 optical sensor."""
        rfid = rfid_uid or self.pending_rfid or "AABBCCDD"
        logger.info("[HARDWARE] AS608: Fingerprint detected! Matched slot #%d (confidence: %d%%)", slot_id, confidence)

        # 1. Send fingerprint result
        fp_topic = f"sadita/device/{self.device_id}/fingerprint"
        fp_payload = {
            "result": "match" if confidence >= 40 else "no_match",
            "template_id": slot_id,
            "confidence": confidence,
            "rfid_uid": rfid,
            "device_id": self.device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if self.connected and self.client:
            self.client.publish(fp_topic, json.dumps(fp_payload), qos=1)

        # 2. Send complete attendance bundle
        att_topic = f"sadita/device/{self.device_id}/attendance"
        att_payload = {
            "event_id": str(uuid.uuid4()),
            "rfid_uid": rfid,
            "fingerprint_template_id": slot_id,
            "confidence": confidence,
            "session_id": self.current_session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "device_id": self.device_id,
        }
        if self.connected and self.client:
            self.client.publish(att_topic, json.dumps(att_payload), qos=1)
            logger.info("Published full attendance bundle to %s", att_topic)
        else:
            logger.info("MQTT offline — attempting REST fallback to %s...", self.backend_url)
            self._rest_fallback(rfid, slot_id, confidence)

    def _rest_fallback(self, rfid: str, slot_id: int, confidence: int):
        import urllib.request
        import urllib.parse
        url = f"{self.backend_url}/api/v1/attendance/iot/record?rfid_uid={rfid}&fingerprint_template_id={slot_id}&confidence={confidence}"
        if self.current_session_id:
            url += f"&session_id={self.current_session_id}"
        req = urllib.request.Request(url, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                logger.info("REST Fallback SUCCESS: status=%s student_id=%s", data.get("status"), data.get("student_id"))
        except Exception as exc:
            logger.error("REST Fallback failed: %s", exc)

    def simulate_student_checkin(self, student_info: dict, delay_seconds: float = 1.0):
        """Simulate complete 2FA check-in sequence for a student."""
        logger.info("=== Simulating Check-in: %s (NIM: %s) ===", student_info["name"], student_info["nim"])
        self.tap_rfid(student_info["rfid"])
        time.sleep(delay_seconds)
        self.scan_fingerprint(student_info["slot"], confidence=90, rfid_uid=student_info["rfid"])
        time.sleep(0.5)


# ---------------------------------------------------------------------------
# CLI & Interactive Mode
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="SADITA ESP32 IoT Device Simulator")
    parser.add_argument("--device-id", default="SADITA-ESP32-01", help="Device ID")
    parser.add_argument("--host", default="localhost", help="MQTT Broker host")
    parser.add_argument("--port", type=int, default=1883, help="MQTT Broker port")
    parser.add_argument("--auto", action="store_true", help="Run automated test check-ins")
    parser.add_argument("--interactive", action="store_true", help="Interactive terminal mode")
    parser.add_argument("--rfid", help="Single RFID UID to tap")
    parser.add_argument("--slot", type=int, default=1, help="Fingerprint slot index")
    args = parser.parse_args()

    sim = SADITAESP32Simulator(
        device_id=args.device_id,
        broker_host=args.host,
        broker_port=args.port,
    )

    connected = sim.connect_mqtt()
    if not connected:
        logger.warning("Running simulator in REST-only fallback mode.")

    if args.rfid:
        sim.tap_rfid(args.rfid)
        time.sleep(1)
        sim.scan_fingerprint(args.slot, confidence=88, rfid_uid=args.rfid)
        time.sleep(1)
        return

    if args.auto:
        logger.info("Running automated simulation of %d students...", len(SAMPLE_STUDENTS))
        for student in SAMPLE_STUDENTS:
            sim.simulate_student_checkin(student, delay_seconds=1.5)
            time.sleep(1)
        logger.info("Automated simulation finished.")
        return

    # Interactive mode default
    print("\n" + "=" * 60)
    print(f" SADITA ESP32 Hardware Simulator [{args.device_id}]")
    print(f" Broker: {args.host}:{args.port} | Connected: {sim.connected}")
    print("=" * 60)
    print("Pilihan:")
    for idx, s in enumerate(SAMPLE_STUDENTS, 1):
        print(f"  [{idx}] Check-in {s['name']} (NIM: {s['nim']} | RFID: {s['rfid']} | FP #{s['slot']})")
    print("  [5] Tap Kartu Tidak Terdaftar (Simulasi Penolakan)")
    print("  [6] Scan Sidik Jari Salah (Mismatch Slot)")
    print("  [7] Kirim Status Heartbeat")
    print("  [q] Keluar")
    print("=" * 60)

    try:
        while True:
            choice = input("\nPilih aksi (1-7 / q): ").strip()
            if choice == "q":
                break
            elif choice in ("1", "2", "3", "4"):
                idx = int(choice) - 1
                sim.simulate_student_checkin(SAMPLE_STUDENTS[idx])
            elif choice == "5":
                logger.info("Simulasi kartu asing/tidak terdaftar...")
                sim.tap_rfid("UNKNOWN99")
            elif choice == "6":
                logger.info("Simulasi sidik jari salah...")
                sim.scan_fingerprint(slot_id=99, confidence=20, rfid_uid="AABBCCDD")
            elif choice == "7":
                sim.send_heartbeat()
            else:
                print("Pilihan tidak valid.")
    except KeyboardInterrupt:
        pass
    finally:
        if sim.client:
            sim.client.loop_stop()
            sim.client.disconnect()
        logger.info("Simulator dihentikan.")


if __name__ == "__main__":
    main()
