"""
SADITA — Phase 3 Attendance Engine Tests
Tests for: session lifecycle, attendance recording (IoT pipeline), manual override.
"""
from __future__ import annotations

import pytest
from datetime import date, datetime, time, timedelta, timezone
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event as sa_event
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base
from app.core.deps import get_db
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.models.lecturer import LecturerProfile
from app.models.academic import AcademicTerm, CourseClass, ClassEnrollment, Course
from app.models.attendance import (
    AttendanceSession,
    AttendanceRecord,
    AttendanceStatus,
    AttendanceMethod,
    SessionStatus,
)

# ---------------------------------------------------------------------------
# In-memory SQLite test database with StaticPool
# ---------------------------------------------------------------------------
from sqlalchemy.pool import StaticPool
from app.db.session import get_db as session_get_db

SQLITE_URL = "sqlite://"  # in-memory

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)

# Enable FK enforcement for SQLite
@sa_event.listens_for(engine, "connect")
def enable_fk(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    from app.models.program_studi import ProgramStudi

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[session_get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    with TestingSession() as s:
        s.add(ProgramStudi(id=1, kode="TI", nama="Teknik Informatika", jenjang="S1"))
        s.commit()
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def db():
    db = TestingSession()
    yield db
    db.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def lecturer_user(db):
    user = User(
        email="dosen@unipi.ac.id",
        password_hash="hashed",
        full_name="Dr. Hendra",
        role=UserRole.DOSEN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    profile = LecturerProfile(user_id=user.id, nidn="1234567890", department="TI")
    db.add(profile)
    db.commit()
    db.refresh(profile)
    user.lecturer_profile = profile
    return user


@pytest.fixture
def student_user(db):
    user = User(
        email="mhs@student.unipi.ac.id",
        password_hash="hashed",
        full_name="Budi Santoso",
        role=UserRole.MAHASISWA,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    profile = StudentProfile(
        user_id=user.id,
        nim="22.11.0001",
        department="TI",
        batch_year=2022,
        rfid_uid="AABBCCDD",
        fingerprint_template_id=1,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return user


@pytest.fixture
def course(db):
    c = Course(code="TI601", name="Pemrograman Web", credits=3)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@pytest.fixture
def term(db):
    t = AcademicTerm(
        name="Ganjil 2026/2027",
        start_date=date(2026, 9, 1),
        end_date=date(2027, 1, 31),
        is_active=True,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@pytest.fixture
def course_class(db, course, lecturer_user, term):
    cc = CourseClass(
        course_id=course.id,
        term_id=term.id,
        lecturer_id=lecturer_user.lecturer_profile.id,
        name="Pemweb A Pagi",
        day_of_week=1,
        start_time=time(8, 0),
        end_time=time(10, 30),
        is_active=True,
    )
    db.add(cc)
    db.commit()
    db.refresh(cc)
    return cc


@pytest.fixture
def enrollment(db, course_class, student_user):
    e = ClassEnrollment(
        class_id=course_class.id,
        student_id=student_user.student_profile.id,
        status="ACTIVE",
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@pytest.fixture
def session_obj(db, course_class):
    s = AttendanceSession(
        class_id=course_class.id,
        session_number=1,
        date=date.today(),
        topic="Pengenalan Framework",
        status=SessionStatus.SCHEDULED,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@pytest.fixture
def open_session(db, session_obj):
    session_obj.status = SessionStatus.OPEN
    session_obj.opened_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session_obj)
    return session_obj


def _bearer(user: User) -> dict:
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


# ===========================================================================
# Unit Tests — AttendanceService
# ===========================================================================

class TestAttendanceServiceCreateSession:
    def test_create_valid_session(self, db, course_class):
        from app.services.attendance_service import AttendanceService

        s = AttendanceService.create_session(
            db, class_id=course_class.id, session_number=1, date=date.today(), topic="Intro"
        )
        assert s.id is not None
        assert s.status == SessionStatus.SCHEDULED
        assert s.session_number == 1
        assert s.topic == "Intro"

    def test_create_duplicate_session_raises(self, db, course_class, session_obj):
        from app.services.attendance_service import AttendanceService
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            AttendanceService.create_session(
                db, class_id=course_class.id, session_number=1, date=date.today()
            )
        assert exc_info.value.status_code == 400

    def test_invalid_session_number_raises(self, db, course_class):
        from app.services.attendance_service import AttendanceService
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            AttendanceService.create_session(
                db, class_id=course_class.id, session_number=17, date=date.today()
            )
        assert exc_info.value.status_code == 422

    def test_nonexistent_class_raises(self, db):
        from app.services.attendance_service import AttendanceService
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            AttendanceService.create_session(
                db, class_id=9999, session_number=1, date=date.today()
            )
        assert exc_info.value.status_code == 404


class TestAttendanceServiceOpenClose:
    def test_open_session_creates_alfa_records(self, db, enrollment, session_obj, student_user):
        from app.services.attendance_service import AttendanceService

        opened = AttendanceService.open_session(db, session_obj.id)
        assert opened.status == SessionStatus.OPEN
        assert opened.opened_at is not None

        # Check ALFA record created for enrolled student
        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == opened.id,
            AttendanceRecord.student_id == student_user.student_profile.id,
        ).first()
        assert record is not None
        assert record.status == AttendanceStatus.ALFA

    def test_cannot_open_already_open_session(self, db, open_session, enrollment):
        from app.services.attendance_service import AttendanceService
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            AttendanceService.open_session(db, open_session.id)
        assert exc_info.value.status_code == 400

    def test_close_open_session(self, db, open_session):
        from app.services.attendance_service import AttendanceService

        closed = AttendanceService.close_session(db, open_session.id)
        assert closed.status == SessionStatus.CLOSED
        assert closed.closed_at is not None

    def test_cannot_close_already_closed_session(self, db, session_obj):
        from app.services.attendance_service import AttendanceService
        from fastapi import HTTPException

        session_obj.status = SessionStatus.CLOSED
        db.commit()
        with pytest.raises(HTTPException) as exc_info:
            AttendanceService.close_session(db, session_obj.id)
        assert exc_info.value.status_code == 400


class TestAttendanceIoTPipeline:
    def test_hadir_within_threshold(self, db, open_session, enrollment, student_user):
        from app.services.attendance_service import AttendanceService

        # Check-in exactly at session open time (within threshold)
        check_in = open_session.opened_at + timedelta(minutes=10)
        record = AttendanceService.record_attendance_by_rfid_and_fingerprint(
            db,
            rfid_uid="AABBCCDD",
            fingerprint_template_id=1,
            confidence=85,
            event_timestamp=check_in,
            session_id=open_session.id,
        )
        assert record.status == AttendanceStatus.HADIR
        assert record.method == AttendanceMethod.RFID_FINGERPRINT

    def test_terlambat_after_threshold(self, db, open_session, enrollment, student_user):
        from app.services.attendance_service import AttendanceService

        # Check-in 20 minutes after open (threshold is 15)
        check_in = open_session.opened_at + timedelta(minutes=20)
        record = AttendanceService.record_attendance_by_rfid_and_fingerprint(
            db,
            rfid_uid="AABBCCDD",
            fingerprint_template_id=1,
            confidence=80,
            event_timestamp=check_in,
            session_id=open_session.id,
        )
        assert record.status == AttendanceStatus.TERLAMBAT

    def test_unknown_rfid_raises(self, db, open_session):
        from app.services.attendance_service import AttendanceService
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            AttendanceService.record_attendance_by_rfid_and_fingerprint(
                db,
                rfid_uid="UNKNOWN00",
                fingerprint_template_id=1,
                confidence=90,
                session_id=open_session.id,
            )
        assert exc_info.value.status_code == 404

    def test_wrong_fingerprint_slot_raises(self, db, open_session, enrollment, student_user):
        from app.services.attendance_service import AttendanceService
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            AttendanceService.record_attendance_by_rfid_and_fingerprint(
                db,
                rfid_uid="AABBCCDD",
                fingerprint_template_id=99,  # wrong slot
                confidence=90,
                session_id=open_session.id,
            )
        assert exc_info.value.status_code == 401

    def test_low_confidence_raises(self, db, open_session, enrollment, student_user):
        from app.services.attendance_service import AttendanceService
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            AttendanceService.record_attendance_by_rfid_and_fingerprint(
                db,
                rfid_uid="AABBCCDD",
                fingerprint_template_id=1,
                confidence=30,  # below 40% minimum
                session_id=open_session.id,
            )
        assert exc_info.value.status_code == 422

    def test_idempotent_second_scan(self, db, open_session, enrollment, student_user):
        """Scanning twice should NOT duplicate the record."""
        from app.services.attendance_service import AttendanceService

        AttendanceService.record_attendance_by_rfid_and_fingerprint(
            db,
            rfid_uid="AABBCCDD",
            fingerprint_template_id=1,
            confidence=85,
            session_id=open_session.id,
        )
        # Second scan
        AttendanceService.record_attendance_by_rfid_and_fingerprint(
            db,
            rfid_uid="AABBCCDD",
            fingerprint_template_id=1,
            confidence=88,
            session_id=open_session.id,
        )
        count = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == open_session.id,
            AttendanceRecord.student_id == student_user.student_profile.id,
        ).count()
        assert count == 1

    def test_closed_session_raises(self, db, session_obj, enrollment, student_user):
        from app.services.attendance_service import AttendanceService
        from fastapi import HTTPException

        session_obj.status = SessionStatus.CLOSED
        session_obj.opened_at = datetime.now(timezone.utc) - timedelta(hours=2)
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            AttendanceService.record_attendance_by_rfid_and_fingerprint(
                db,
                rfid_uid="AABBCCDD",
                fingerprint_template_id=1,
                confidence=85,
                session_id=session_obj.id,
            )
        assert exc_info.value.status_code == 400


class TestManualOverride:
    def test_manual_update_to_izin(self, db, open_session, enrollment, student_user):
        from app.services.attendance_service import AttendanceService

        record = AttendanceService.manual_update(
            db,
            session_id=open_session.id,
            student_id=student_user.student_profile.id,
            new_status=AttendanceStatus.IZIN,
            notes="Izin pulang kampung",
        )
        assert record.status == AttendanceStatus.IZIN
        assert record.method == AttendanceMethod.MANUAL_DOSEN
        assert record.notes == "Izin pulang kampung"


class TestSessionSummary:
    def test_summary_counts(self, db, open_session, enrollment, student_user):
        from app.services.attendance_service import AttendanceService

        # Init ALFA records
        from app.repositories.attendance_repo import AttendanceRepository
        AttendanceRepository.bulk_initialize_records(
            db, open_session.id, [student_user.student_profile.id]
        )

        summary = AttendanceService.get_session_summary(db, open_session.id)
        assert summary["total"] == 1
        assert summary["alfa"] == 1
        assert summary["hadir"] == 0


# ===========================================================================
# API Integration Tests
# ===========================================================================

class TestAttendanceAPI:
    @patch("app.mqtt.client.mqtt_client.publish")
    def test_create_session_api(self, mock_mqtt, client, lecturer_user, course_class):
        headers = _bearer(lecturer_user)
        resp = client.post(
            "/api/v1/attendance/sessions",
            json={
                "class_id": course_class.id,
                "session_number": 1,
                "date": str(date.today()),
                "topic": "HTTP & REST",
            },
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "SCHEDULED"
        assert data["session_number"] == 1

    @patch("app.mqtt.client.mqtt_client.publish")
    def test_open_and_close_session_api(self, mock_mqtt, client, lecturer_user, session_obj, enrollment):
        headers = _bearer(lecturer_user)

        # Open
        resp = client.post(
            f"/api/v1/attendance/sessions/{session_obj.id}/open",
            json={"topic": "Intro REST"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "OPEN"

        # Close
        resp = client.post(
            f"/api/v1/attendance/sessions/{session_obj.id}/close",
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "CLOSED"

    def test_get_session_records(self, client, open_session, enrollment, student_user):
        # Seed a record
        db = TestingSession()
        try:
            db.add(AttendanceRecord(
                session_id=open_session.id,
                student_id=student_user.student_profile.id,
                status=AttendanceStatus.HADIR,
                method=AttendanceMethod.RFID_FINGERPRINT,
                check_in_time=datetime.now(timezone.utc),
            ))
            db.commit()
        finally:
            db.close()

        resp = client.get(f"/api/v1/attendance/sessions/{open_session.id}/records")
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]["status"] == "HADIR"

    @patch("app.mqtt.client.mqtt_client.publish")
    def test_manual_update_api(self, mock_mqtt, client, lecturer_user, open_session, enrollment, student_user):
        headers = _bearer(lecturer_user)

        # Seed ALFA record
        db = TestingSession()
        try:
            db.add(AttendanceRecord(
                session_id=open_session.id,
                student_id=student_user.student_profile.id,
                status=AttendanceStatus.ALFA,
            ))
            db.commit()
        finally:
            db.close()

        resp = client.put(
            f"/api/v1/attendance/sessions/{open_session.id}/manual",
            json={
                "student_id": student_user.student_profile.id,
                "status": "SAKIT",
                "notes": "Rawat inap",
            },
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "SAKIT"

    def test_iot_rest_fallback(self, client, open_session, enrollment, student_user):
        resp = client.post(
            "/api/v1/attendance/iot/record",
            params={
                "rfid_uid": "AABBCCDD",
                "fingerprint_template_id": 1,
                "confidence": 85,
                "session_id": open_session.id,
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] in ("HADIR", "TERLAMBAT")

    def test_student_history(self, client, open_session, enrollment, student_user):
        db = TestingSession()
        try:
            db.add(AttendanceRecord(
                session_id=open_session.id,
                student_id=student_user.student_profile.id,
                status=AttendanceStatus.HADIR,
                method=AttendanceMethod.RFID_FINGERPRINT,
                check_in_time=datetime.now(timezone.utc),
            ))
            db.commit()
        finally:
            db.close()

        resp = client.get(f"/api/v1/attendance/students/{student_user.student_profile.id}/history")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
