"""
SADITA — End-to-End IoT RFID Attendance Pipeline Tests (P0-11)
Tests: MQTT RFID Event -> Student Validation -> Session Matching -> Attendance Record -> MQTT Command Output
"""
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.attendance import (
    AttendanceEvent,
    AttendanceEventType,
    AttendanceRecord,
    AttendanceSession,
    AttendanceStatus,
    SessionStatus,
)
from app.models.student import KtmStatus, StudentProfile
from app.mqtt.handlers import handle_fingerprint, handle_rfid


DEVICE_ID = "SADITA-ESP32-LAB-01"


def test_valid_rfid_tap_records_attendance_and_publishes_success():
    """BR-ATT-001/BR-ATT-002: Enrolled student with valid RFID tap is marked HADIR."""
    db = SessionLocal()
    try:
        from app.repositories.user_repo import StudentRepository

        # Student 1 is Rizal (A1B2C3D4), enrolled in class 1, which has an OPEN session 1
        student = StudentRepository.get_by_rfid(db, "A1B2C3D4")
        assert student is not None, "Student with RFID A1B2C3D4 must exist in seed"

        session = db.get(AttendanceSession, 1)
        assert session is not None and session.status == SessionStatus.OPEN

        published_commands = []

        with patch("app.mqtt.handlers.mqtt_client") as mock_mqtt:
            mock_mqtt.publish_command.side_effect = lambda dev_id, cmd: published_commands.append((dev_id, cmd))

            # Simulate incoming MQTT message from ESP32-S3 terminal
            payload = {
                "uid": "A1B2C3D4",
                "mode": "rfid_only",
                "timestamp": int(datetime.now(timezone.utc).timestamp()),
            }
            handle_rfid(DEVICE_ID, payload)

            # Assert MQTT command was dispatched to device
            assert len(published_commands) == 1
            dev, cmd = published_commands[0]
            assert dev == DEVICE_ID
            assert cmd["action"] == "success"
            assert cmd["status"] == "ABSEN_BERHASIL"

        # Assert attendance record in PostgreSQL was created/updated to HADIR
        record = db.scalar(
            select(AttendanceRecord).where(
                AttendanceRecord.session_id == 1,
                AttendanceRecord.student_id == student.id,
            )
        )
        assert record is not None
        assert record.status in (AttendanceStatus.HADIR, AttendanceStatus.TERLAMBAT)
        assert record.check_in_time is not None

        # Assert raw hardware audit event was recorded in attendance_events table
        event = db.scalar(
            select(AttendanceEvent)
            .where(
                AttendanceEvent.device_id == DEVICE_ID,
                AttendanceEvent.rfid_uid == "A1B2C3D4",
                AttendanceEvent.event_type == AttendanceEventType.ATTENDANCE_RECORDED,
            )
            .order_by(AttendanceEvent.received_at.desc())
        )
        assert event is not None
        assert event.berhasil is True
    finally:
        db.close()


def test_unknown_rfid_tap_is_rejected_and_publishes_rejection():
    """Unregistered RFID card must trigger error buzzer/LED and rejection payload."""
    db = SessionLocal()
    try:
        published_commands = []

        with patch("app.mqtt.handlers.mqtt_client") as mock_mqtt:
            mock_mqtt.publish_command.side_effect = lambda dev_id, cmd: published_commands.append((dev_id, cmd))

            payload = {
                "uid": "DEADBEEF99",
                "mode": "rfid_only",
            }
            handle_rfid(DEVICE_ID, payload)

            # Device command must indicate rejection
            assert len(published_commands) == 1
            dev, cmd = published_commands[0]
            assert dev == DEVICE_ID
            assert cmd["action"] == "reject"
            assert cmd.get("reason") == "KARTU TIDAK TERDAFTAR" or "KARTU TIDAK" in cmd.get("lcd_line1", "")

        # Hardware event log must log failure
        event = db.scalar(
            select(AttendanceEvent)
            .where(
                AttendanceEvent.device_id == DEVICE_ID,
                AttendanceEvent.rfid_uid == "DEADBEEF99",
            )
            .order_by(AttendanceEvent.received_at.desc())
        )
        assert event is not None
        assert event.berhasil is False
    finally:
        db.close()


def test_lost_ktm_student_rfid_is_blocked():
    """Student with KTM_HILANG status must have RFID tap rejected per BR-STU-002."""
    db = SessionLocal()
    try:
        # Dani (Student 3) has KTM_HILANG
        student = db.scalar(select(StudentProfile).where(StudentProfile.ktm_status == KtmStatus.KTM_HILANG))
        if not student:
            pytest.skip("No KTM_HILANG student in seed")

        published_commands = []
        with patch("app.mqtt.handlers.mqtt_client") as mock_mqtt:
            mock_mqtt.publish_command.side_effect = lambda dev_id, cmd: published_commands.append((dev_id, cmd))

            payload = {
                "uid": student.rfid_uid or "C3D4E5F6",
                "mode": "rfid_only",
            }
            handle_rfid(DEVICE_ID, payload)

            assert len(published_commands) == 1
            dev, cmd = published_commands[0]
            assert cmd["action"] == "reject"
    finally:
        db.close()
