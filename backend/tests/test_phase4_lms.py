"""
SADITA — Phase 4 LMS Core Tests
Tests for: Course Materials, Assignments, Submissions (on-time & late), Grading, and Analytics.
"""
from __future__ import annotations

import pytest
from datetime import date, datetime, time, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event as sa_event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db as session_get_db
from app.core.deps import get_db
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.models.lecturer import LecturerProfile
from app.models.academic import AcademicTerm, CourseClass, ClassEnrollment, Course
from app.models.attendance import AttendanceSession, SessionStatus
from app.models.lms import (
    Assignment,
    AssignmentSubmission,
    CourseMaterial,
    MaterialType,
    SubmissionStatus,
)

# ---------------------------------------------------------------------------
# In-memory SQLite with StaticPool
# ---------------------------------------------------------------------------
SQLITE_URL = "sqlite://"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)

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
    profile = LecturerProfile(user_id=user.id, nidn="0412058501", department="TI")
    db.add(profile)
    db.commit()
    db.refresh(profile)
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
        topic="Pengenalan FastAPI & Vue",
        status=SessionStatus.SCHEDULED,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def _bearer(user: User) -> dict:
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


# ===========================================================================
# Unit Tests — LMSService
# ===========================================================================

class TestMaterialManagement:
    def test_create_valid_material(self, db, course_class, session_obj):
        from app.services.lms_service import LMSService

        m = LMSService.create_material(
            db,
            class_id=course_class.id,
            session_id=session_obj.id,
            title="Slide Pertemuan 1 - Arsitektur Web",
            material_type=MaterialType.DOCUMENT,
            resource_url="https://cloud.unipi.ac.id/materials/ti601-01.pdf",
            description="Pengantar arsitektur backend FastAPI dan IoT",
        )
        assert m.id is not None
        assert m.title == "Slide Pertemuan 1 - Arsitektur Web"
        assert m.material_type == MaterialType.DOCUMENT

    def test_create_material_invalid_class_raises(self, db):
        from app.services.lms_service import LMSService
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            LMSService.create_material(db, class_id=9999, title="Invalid")
        assert exc_info.value.status_code == 404

    def test_create_material_wrong_session_raises(self, db, course_class):
        from app.services.lms_service import LMSService
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            LMSService.create_material(
                db, class_id=course_class.id, session_id=9999, title="Wrong session"
            )
        assert exc_info.value.status_code == 400


class TestAssignmentManagement:
    def test_create_valid_assignment(self, db, course_class, session_obj):
        from app.services.lms_service import LMSService

        due = datetime.now(timezone.utc) + timedelta(days=7)
        a = LMSService.create_assignment(
            db,
            class_id=course_class.id,
            session_id=session_obj.id,
            title="Tugas 1: REST API FastAPI",
            due_date=due,
            description="Buat CRUD mahasiswa dengan SQLite dan FastAPI",
            max_score=100.0,
            allow_late=True,
        )
        assert a.id is not None
        assert a.title == "Tugas 1: REST API FastAPI"
        assert a.max_score == 100.0
        assert a.allow_late is True


class TestSubmissionAndGrading:
    @pytest.fixture
    def assignment(self, db, course_class):
        from app.services.lms_service import LMSService

        due = datetime.now(timezone.utc) + timedelta(days=3)
        return LMSService.create_assignment(
            db,
            class_id=course_class.id,
            title="Tugas Praktikum 1",
            due_date=due,
            allow_late=True,
        )

    def test_on_time_submission(self, db, assignment, enrollment, student_user):
        from app.services.lms_service import LMSService

        # Submitted before due date
        submit_time = assignment.due_date - timedelta(hours=5)
        sub = LMSService.submit_assignment(
            db,
            assignment_id=assignment.id,
            user_id=student_user.id,
            file_url="https://github.com/budi/sadita-api",
            content="Berikut repository tugas praktikum saya",
            submitted_at=submit_time,
        )
        assert sub.status == SubmissionStatus.SUBMITTED
        assert sub.file_url == "https://github.com/budi/sadita-api"

    def test_late_submission_allowed(self, db, assignment, enrollment, student_user):
        from app.services.lms_service import LMSService

        # Submitted after due date
        submit_time = assignment.due_date + timedelta(hours=2)
        sub = LMSService.submit_assignment(
            db,
            assignment_id=assignment.id,
            user_id=student_user.id,
            file_url="https://github.com/budi/sadita-api",
            submitted_at=submit_time,
        )
        assert sub.status == SubmissionStatus.LATE

    def test_late_submission_rejected_when_not_allowed(self, db, course_class, enrollment, student_user):
        from app.services.lms_service import LMSService
        from fastapi import HTTPException

        due = datetime.now(timezone.utc) - timedelta(hours=1)
        strict_assign = LMSService.create_assignment(
            db,
            class_id=course_class.id,
            title="Strict Assignment",
            due_date=due,
            allow_late=False,
        )

        with pytest.raises(HTTPException) as exc_info:
            LMSService.submit_assignment(
                db,
                assignment_id=strict_assign.id,
                user_id=student_user.id,
                file_url="https://example.com/late",
            )
        assert exc_info.value.status_code == 400

    def test_unenrolled_student_cannot_submit(self, db, assignment):
        from app.services.lms_service import LMSService
        from fastapi import HTTPException

        # Create another student not enrolled
        user2 = User(
            email="other@student.unipi.ac.id",
            password_hash="hash",
            full_name="Other Student",
            role=UserRole.MAHASISWA,
        )
        db.add(user2)
        db.commit()
        db.refresh(user2)
        p2 = StudentProfile(user_id=user2.id, nim="22.11.0002", department="TI")
        db.add(p2)
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            LMSService.submit_assignment(
                db, assignment_id=assignment.id, user_id=user2.id
            )
        assert exc_info.value.status_code == 403

    def test_grade_submission_success(self, db, assignment, enrollment, student_user, lecturer_user):
        from app.services.lms_service import LMSService

        sub = LMSService.submit_assignment(
            db,
            assignment_id=assignment.id,
            user_id=student_user.id,
            file_url="https://github.com/budi/sadita-api",
        )

        graded = LMSService.grade_submission(
            db,
            submission_id=sub.id,
            score=95.0,
            feedback="Implementasi sangat rapi dan dokumentasi lengkap.",
            grader_user_id=lecturer_user.id,
        )
        assert graded.status == SubmissionStatus.GRADED
        assert graded.score == 95.0
        assert graded.feedback == "Implementasi sangat rapi dan dokumentasi lengkap."
        assert graded.graded_at is not None

    def test_assignment_summary_metrics(self, db, assignment, enrollment, student_user, lecturer_user):
        from app.services.lms_service import LMSService

        sub = LMSService.submit_assignment(
            db, assignment_id=assignment.id, user_id=student_user.id
        )
        LMSService.grade_submission(
            db,
            submission_id=sub.id,
            score=90.0,
            grader_user_id=lecturer_user.id,
        )

        summary = LMSService.get_assignment_summary(db, assignment.id)
        assert summary["total_enrolled"] == 1
        assert summary["total_submitted"] == 1
        assert summary["total_graded"] == 1
        assert summary["submission_rate_percent"] == 100.0
        assert summary["average_score"] == 90.0


# ===========================================================================
# API Integration Tests
# ===========================================================================

class TestLMSAPI:
    def test_create_and_list_materials_api(self, client, lecturer_user, course_class):
        headers = _bearer(lecturer_user)
        # Create
        resp = client.post(
            "/api/v1/lms/materials",
            json={
                "class_id": course_class.id,
                "title": "Modul Praktikum 1",
                "material_type": "DOCUMENT",
                "resource_url": "https://unipi.ac.id/modul1.pdf",
            },
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Modul Praktikum 1"

        # List
        resp2 = client.get(f"/api/v1/lms/materials?class_id={course_class.id}", headers=headers)
        assert resp2.status_code == 200
        assert len(resp2.json()) >= 1

    def test_create_and_list_assignments_api(self, client, lecturer_user, course_class):
        headers = _bearer(lecturer_user)
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        resp = client.post(
            "/api/v1/lms/assignments",
            json={
                "class_id": course_class.id,
                "title": "Tugas API",
                "due_date": due,
                "max_score": 100.0,
                "allow_late": True,
            },
            headers=headers,
        )
        assert resp.status_code == 201
        assign_id = resp.json()["id"]

        # List
        resp2 = client.get(f"/api/v1/lms/assignments?class_id={course_class.id}", headers=headers)
        assert resp2.status_code == 200
        assert len(resp2.json()) >= 1

        # Summary
        resp3 = client.get(f"/api/v1/lms/assignments/{assign_id}/summary", headers=headers)
        assert resp3.status_code == 200
        assert resp3.json()["total_submitted"] == 0

    def test_student_submit_and_lecturer_grade_api(
        self, client, lecturer_user, student_user, course_class, enrollment
    ):
        # Lecturer creates assignment
        lec_headers = _bearer(lecturer_user)
        due = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
        resp = client.post(
            "/api/v1/lms/assignments",
            json={
                "class_id": course_class.id,
                "title": "Tugas 2",
                "due_date": due,
            },
            headers=lec_headers,
        )
        assign_id = resp.json()["id"]

        # Student submits assignment
        mhs_headers = _bearer(student_user)
        resp_sub = client.post(
            f"/api/v1/lms/assignments/{assign_id}/submissions",
            json={
                "file_url": "https://github.com/budi/tugas-2",
                "content": "Pekerjaan tugas 2 telah selesai.",
            },
            headers=mhs_headers,
        )
        assert resp_sub.status_code == 201
        sub_id = resp_sub.json()["id"]
        assert resp_sub.json()["status"] == "SUBMITTED"

        # Student checks my-submission
        resp_my = client.get(
            f"/api/v1/lms/assignments/{assign_id}/my-submission",
            headers=mhs_headers,
        )
        assert resp_my.status_code == 200
        assert resp_my.json()["file_url"] == "https://github.com/budi/tugas-2"

        # Lecturer grades assignment
        resp_grade = client.put(
            f"/api/v1/lms/submissions/{sub_id}/grade",
            json={
                "score": 92.5,
                "feedback": "Bagus sekali, kodenya bersih.",
            },
            headers=lec_headers,
        )
        assert resp_grade.status_code == 200
        assert resp_grade.json()["status"] == "GRADED"
        assert resp_grade.json()["score"] == 92.5
