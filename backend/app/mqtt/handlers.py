"""
SADITA — MQTT Event Handlers (Real Hardware Protocol)
Processes IoT device events from ESP32-S3:
- RFID scan
- Fingerprint verification
- Direct fingerprint (for students with BELUM_MEMILIKI_KTM)
- Heartbeat / status
- Device ACK
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from app.mqtt.client import mqtt_client

logger = logging.getLogger(__name__)


def _log_attendance_event(
    db,
    *,
    device_id: str,
    event_type,
    student_id: Optional[int] = None,
    session_id: Optional[int] = None,
    rfid_uid: Optional[str] = None,
    fingerprint_slot: Optional[int] = None,
    fingerprint_confidence: Optional[float] = None,
    berhasil: bool = False,
    pesan: Optional[str] = None,
    device_timestamp: Optional[datetime] = None,
):
    """Helper to write raw event audit log to PostgreSQL attendance_events table."""
    try:
        from app.models.attendance import AttendanceEvent

        event = AttendanceEvent(
            device_id=device_id,
            event_type=event_type,
            student_id=student_id,
            session_id=session_id,
            rfid_uid=rfid_uid,
            fingerprint_slot=fingerprint_slot,
            fingerprint_confidence=fingerprint_confidence,
            berhasil=berhasil,
            pesan=pesan,
            device_timestamp=device_timestamp,
        )
        db.add(event)
        db.commit()
    except Exception as e:
        logger.warning("Failed to record attendance_event log: %s", e)


def handle_status(device_id: str, payload: dict) -> None:
    """Handle device heartbeat/status events."""
    uptime = payload.get("uptime_seconds", "?")
    fw = payload.get("firmware_version", "?")
    rssi = payload.get("wifi_rssi", "?")
    logger.info(
        "Device heartbeat: id=%s uptime=%ss fw=%s rssi=%sdBm",
        device_id,
        uptime,
        fw,
        rssi,
    )
    try:
        from app.db.session import SessionLocal
        from app.models.device import SaditaDevice, DeviceStatus

        db = SessionLocal()
        try:
            device = db.query(SaditaDevice).filter(SaditaDevice.device_id == device_id).first()
            if device:
                device.last_seen_at = datetime.now(timezone.utc)
                device.status = DeviceStatus.ACTIVE
                if fw and fw != "?":
                    device.firmware_version = fw
                db.commit()
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Error updating device heartbeat: %s", exc)


def handle_rfid(device_id: str, payload: dict) -> None:
    """
    Handle RFID scan events from SADITA ESP32-S3.
    Flow:
      Mahasiswa tap KTM
      -> ESP32 membaca UID RFID
      -> MQTT -> Backend
      -> Backend mencari mahasiswa berdasarkan RFID UID
      Jika valid:
        -> LCD: 'RFID BERHASIL'
        -> LED kuning ON
        -> ESP32 meminta fingerprint
      Jika tidak dikenal:
        -> LED merah ON
        -> LCD: 'KARTU TIDAK TERDAFTAR'
        -> Buzzer error
    """
    uid = payload.get("uid", "").strip().upper()
    if not uid:
        logger.warning("RFID event from %s missing 'uid'", device_id)
        return

    logger.info("RFID scan: device=%s uid=%s", device_id, uid)

    try:
        from app.db.session import SessionLocal
        from app.models.attendance import AttendanceEventType
        from app.repositories.user_repo import StudentRepository

        db = SessionLocal()
        try:
            student = StudentRepository.get_by_rfid(db, uid)
            if student:
                # Log audit event
                _log_attendance_event(
                    db,
                    device_id=device_id,
                    event_type=AttendanceEventType.RFID_SCAN,
                    student_id=student.id,
                    rfid_uid=uid,
                    berhasil=True,
                    pesan=f"RFID valid: {student.nim} ({student.user.full_name if student.user else ''})",
                )

                # Send command to device: prompt fingerprint scan
                fp_slot = student.fingerprint_template_id
                mqtt_client.publish_command(device_id, {
                    "action": "prompt_fingerprint",
                    "status": "RFID_VALID",
                    "lcd_line1": "RFID BERHASIL",
                    "lcd_line2": f"{student.nim[:12]} - FP",
                    "led": "YELLOW",
                    "buzzer": "BEEP_SHORT",
                    "rfid_uid": uid,
                    "student_name": student.user.full_name if student.user else "Mahasiswa",
                    "nim": student.nim,
                    "fingerprint_slot": fp_slot,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                logger.info(
                    "RFID valid: NIM=%s, commanded device %s to prompt fingerprint (slot %s)",
                    student.nim,
                    device_id,
                    fp_slot,
                )
            else:
                # Unknown card — notify device to show rejection
                _log_attendance_event(
                    db,
                    device_id=device_id,
                    event_type=AttendanceEventType.RFID_UNKNOWN,
                    rfid_uid=uid,
                    berhasil=False,
                    pesan="Kartu RFID tidak terdaftar",
                )
                mqtt_client.publish_command(device_id, {
                    "action": "reject",
                    "status": "RFID_UNKNOWN",
                    "reason": "KARTU TIDAK TERDAFTAR",
                    "lcd_line1": "KARTU TIDAK",
                    "lcd_line2": "TERDAFTAR",
                    "led": "RED",
                    "buzzer": "ERROR",
                    "rfid_uid": uid,
                })
                logger.warning("Unknown RFID uid=%s on device=%s", uid, device_id)
        finally:
            db.close()
    except Exception as exc:
        logger.exception("Error in handle_rfid: %s", exc)


def handle_fingerprint(device_id: str, payload: dict) -> None:
    """
    Handle fingerprint verification result from ESP32-S3.
    Flow:
      Fingerprint cocok:
        -> MQTT -> Backend
        -> Backend validasi sesi kuliah
        -> Database menyimpan presensi
        -> MQTT -> ESP32: LCD 'ABSEN BERHASIL', LED hijau, buzzer
      Fingerprint salah / gagal:
        -> MQTT -> Backend
        -> MQTT -> ESP32: LCD 'SIDIK JARI SALAH', LED merah, buzzer error

      Dukungan BELUM_MEMILIKI_KTM:
        Jika rfid_uid kosong / none, backend mencari mahasiswa berdasarkan template_id langsung!
    """
    result = payload.get("result", "")
    template_id = payload.get("template_id")
    confidence = payload.get("confidence", 85)
    rfid_uid = payload.get("rfid_uid", "")
    timestamp_str = payload.get("timestamp")

    check_in_time = None
    if timestamp_str:
        try:
            check_in_time = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        except ValueError:
            pass

    logger.info(
        "Fingerprint event: device=%s result=%s template=%s conf=%s rfid=%s",
        device_id,
        result,
        template_id,
        confidence,
        rfid_uid,
    )

    try:
        from app.db.session import SessionLocal
        from app.models.attendance import (
            AttendanceEventType,
            AttendanceMethod,
            AttendanceStatus,
            SessionStatus,
        )
        from app.models.student import KtmStatus
        from app.repositories.user_repo import StudentRepository
        from app.services.attendance_service import AttendanceService

        db = SessionLocal()
        try:
            # 1. Kasus GAGAL / NO-MATCH dari sensor
            if result != "match" or template_id is None:
                _log_attendance_event(
                    db,
                    device_id=device_id,
                    event_type=AttendanceEventType.FINGERPRINT_FAIL,
                    rfid_uid=rfid_uid,
                    fingerprint_slot=template_id,
                    fingerprint_confidence=confidence,
                    berhasil=False,
                    pesan="Sidik jari tidak cocok pada sensor",
                )
                mqtt_client.publish_command(device_id, {
                    "action": "reject",
                    "status": "FINGERPRINT_FAIL",
                    "reason": "SIDIK JARI SALAH",
                    "lcd_line1": "SIDIK JARI",
                    "lcd_line2": "SALAH",
                    "led": "RED",
                    "buzzer": "ERROR",
                    "rfid_uid": rfid_uid,
                })
                logger.warning("Fingerprint scan failed on device=%s", device_id)
                return

            # 2. Kasus MATCH — Cari mahasiswa
            student = None
            if rfid_uid:
                student = StudentRepository.get_by_rfid(db, rfid_uid)
            if not student and template_id is not None:
                # Coba cari via fingerprint slot (termasuk untuk BELUM_MEMILIKI_KTM)
                student = StudentRepository.get_by_fingerprint_id(db, template_id)

            if not student:
                _log_attendance_event(
                    db,
                    device_id=device_id,
                    event_type=AttendanceEventType.FINGERPRINT_FAIL,
                    rfid_uid=rfid_uid,
                    fingerprint_slot=template_id,
                    berhasil=False,
                    pesan="Data mahasiswa untuk sidik jari ini tidak ditemukan",
                )
                mqtt_client.publish_command(device_id, {
                    "action": "reject",
                    "status": "DATA_NOT_FOUND",
                    "reason": "DATA TIDAK ADA",
                    "lcd_line1": "DATA MAHASISWA",
                    "lcd_line2": "TIDAK DITEMUKAN",
                    "led": "RED",
                    "buzzer": "ERROR",
                })
                return

            # Validasi apakah sidik jari cocok dengan credential mahasiswa
            matching_fps = [
                fp for fp in student.fingerprint_credentials
                if fp.is_active and fp.template_slot == template_id
            ]
            if not matching_fps and student.fingerprint_template_id != template_id:
                _log_attendance_event(
                    db,
                    device_id=device_id,
                    event_type=AttendanceEventType.FINGERPRINT_FAIL,
                    student_id=student.id,
                    rfid_uid=rfid_uid,
                    fingerprint_slot=template_id,
                    berhasil=False,
                    pesan=f"Slot FP #{template_id} bukan milik NIM {student.nim}",
                )
                mqtt_client.publish_command(device_id, {
                    "action": "reject",
                    "status": "FINGERPRINT_FAIL",
                    "reason": "SIDIK JARI SALAH",
                    "lcd_line1": "SIDIK JARI",
                    "lcd_line2": "SALAH",
                    "led": "RED",
                    "buzzer": "ERROR",
                    "rfid_uid": rfid_uid,
                })
                return

            # Catat kehadiran melalui AttendanceService
            try:
                # Tentukan metode presensi
                if student.ktm_status == KtmStatus.BELUM_MEMILIKI_KTM or not rfid_uid:
                    method = AttendanceMethod.FINGERPRINT_ONLY
                else:
                    method = AttendanceMethod.RFID_FINGERPRINT

                # Record attendance
                record = AttendanceService.record_attendance_by_rfid_and_fingerprint(
                    db,
                    rfid_uid=student.rfid_uid or rfid_uid or f"TEMP-{student.nim}",
                    fingerprint_template_id=template_id,
                    confidence=confidence,
                    event_timestamp=check_in_time,
                )

                _log_attendance_event(
                    db,
                    device_id=device_id,
                    event_type=AttendanceEventType.ATTENDANCE_RECORDED,
                    student_id=student.id,
                    session_id=record.session_id,
                    rfid_uid=rfid_uid,
                    fingerprint_slot=template_id,
                    fingerprint_confidence=confidence,
                    berhasil=True,
                    pesan=f"Presensi berhasil dicatat: {student.nim} ({record.status.value})",
                )

                status_str = "HADIR" if record.status == AttendanceStatus.HADIR else "TERLAMBAT"
                name_short = (student.user.full_name if student.user else student.nim)[:16]

                mqtt_client.publish_command(device_id, {
                    "action": "success",
                    "status": "ABSEN_BERHASIL",
                    "attendance_status": record.status.value,
                    "lcd_line1": "ABSEN BERHASIL",
                    "lcd_line2": f"{name_short[:10]} {status_str}",
                    "led": "GREEN",
                    "buzzer": "SUCCESS",
                    "nim": student.nim,
                    "student_name": student.user.full_name if student.user else "",
                    "check_in_time": record.check_in_time.strftime("%H:%M:%S") if record.check_in_time else "",
                })
                logger.info("Attendance saved: NIM=%s status=%s on device=%s", student.nim, status_str, device_id)

            except Exception as service_err:
                logger.warning("Attendance service error: %s", service_err)
                err_msg = getattr(service_err, "detail", str(service_err))
                mqtt_client.publish_command(device_id, {
                    "action": "reject",
                    "status": "VALIDATION_FAILED",
                    "reason": err_msg[:30],
                    "lcd_line1": "PRESENSI GAGAL",
                    "lcd_line2": err_msg[:16],
                    "led": "RED",
                    "buzzer": "ERROR",
                })

        finally:
            db.close()
    except Exception as exc:
        logger.exception("Critical error in handle_fingerprint: %s", exc)


def handle_attendance(device_id: str, payload: dict) -> None:
    """Handle attendance event wrapper."""
    # Delegate to handle_fingerprint with result 'match'
    payload.setdefault("result", "match")
    payload.setdefault("template_id", payload.get("fingerprint_template_id"))
    handle_fingerprint(device_id, payload)


def handle_ack(device_id: str, payload: dict) -> None:
    """Handle command acknowledgements from device."""
    action = payload.get("action", "?")
    ack_status = payload.get("status", "?")
    logger.info("ACK from device=%s action=%s status=%s", device_id, action, ack_status)


def register_all_handlers() -> None:
    """Register all event handlers with the MQTT client."""
    mqtt_client.register_handler("status", handle_status)
    mqtt_client.register_handler("rfid", handle_rfid)
    mqtt_client.register_handler("fingerprint", handle_fingerprint)
    mqtt_client.register_handler("attendance", handle_attendance)
    mqtt_client.register_handler("ack", handle_ack)
    logger.info("All MQTT event handlers registered successfully")
