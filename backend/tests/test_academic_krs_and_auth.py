"""
SADITA — Test Suite: Academic Cohort Isolation, KRS Requests & Security / Auth
Verifies:
1. Login via Email OR NPM/NIM with generic error messages.
2. Change password endpoint with validation.
3. Strict academic cohort isolation and KRS available-classes listing.
4. KRS request workflow (Tambah SKS / Mengulang) with schedule conflict checks.
5. Lecturer review and approval workflow creating active class enrollment.
6. Admin student directory cohort & class type filtering.
"""
from datetime import time
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.academic import (
    AcademicTerm,
    ClassEnrollment,
    ClassRoom,
    ClassType,
    Course,
    CourseClass,
    EnrollmentStatus,
    EnrollmentType,
    KrsRequest,
    KrsRequestStatus,
    KrsRequestType,
)
from app.models.student import StudentProfile
from app.models.user import User, UserRole

client = TestClient(app)


def get_token(identifier: str, password: str = "mhs123") -> str:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": identifier, "password": password},
    )
    assert resp.status_code == 200, f"Login failed for {identifier}: {resp.text}"
    return resp.json()["access_token"]


class TestAuthAndSecurity:
    def test_login_by_email_success(self):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "rizal@mhs.unipi.ac.id", "password": "mhs123"},
        )
        assert resp.status_code == 200
        assert resp.json()["user"]["email"] == "rizal@mhs.unipi.ac.id"

    def test_login_by_npm_success(self):
        # Rizal's NIM is 202401001
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "202401001", "password": "mhs123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["email"] == "rizal@mhs.unipi.ac.id"
        assert data["user"]["student_profile"]["nim"] == "202401001"

    def test_login_invalid_credentials_generic_error(self):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "wrong_npm_or_email", "password": "wrongpassword"},
        )
        assert resp.status_code == 401
        assert "Email/NPM atau kata sandi tidak valid" in resp.json()["detail"]

    def test_change_password_validation_and_success(self):
        token = get_token("rizal@mhs.unipi.ac.id", "mhs123")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Wrong old password
        r = client.post(
            "/api/v1/auth/change-password",
            headers=headers,
            json={
                "current_password": "incorrect_old_pwd",
                "new_password": "newpassword123",
                "confirm_password": "newpassword123",
            },
        )
        assert r.status_code == 400
        assert "Kata sandi saat ini salah" in r.json()["detail"]

        # 2. Confirmation mismatch
        r = client.post(
            "/api/v1/auth/change-password",
            headers=headers,
            json={
                "current_password": "mhs123",
                "new_password": "newpassword123",
                "confirm_password": "differentpassword",
            },
        )
        assert r.status_code == 400
        assert "tidak cocok" in r.json()["detail"].lower()

        # 3. New password same as current
        r = client.post(
            "/api/v1/auth/change-password",
            headers=headers,
            json={
                "current_password": "mhs123",
                "new_password": "mhs123",
                "confirm_password": "mhs123",
            },
        )
        assert r.status_code == 400
        assert "tidak boleh sama" in r.json()["detail"]

        # 4. Successful change
        r = client.post(
            "/api/v1/auth/change-password",
            headers=headers,
            json={
                "current_password": "mhs123",
                "new_password": "brandnewpassword123",
                "confirm_password": "brandnewpassword123",
            },
        )
        assert r.status_code == 200
        assert "berhasil diperbarui" in r.json()["message"]

        # 5. Old password no longer works
        r_old = client.post(
            "/api/v1/auth/login",
            json={"email": "202401001", "password": "mhs123"},
        )
        assert r_old.status_code == 401

        # 6. New password works
        r_new = client.post(
            "/api/v1/auth/login",
            json={"email": "202401001", "password": "brandnewpassword123"},
        )
        assert r_new.status_code == 200
        new_token = r_new.json()["access_token"]

        # 7. Reset password back to mhs123 so other tests don't fail
        client.post(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {new_token}"},
            json={
                "current_password": "brandnewpassword123",
                "new_password": "mhs123",
                "confirm_password": "mhs123",
            },
        )

        # Restore original password for subsequent tests
        token_new = r_new.json()["access_token"]
        client.post(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {token_new}"},
            json={
                "current_password": "brandnewpassword123",
                "new_password": "mhs123",
                "confirm_password": "mhs123",
            },
        )


class TestAcademicCohortAndKrs:
    @pytest.fixture(autouse=True)
    def setup_cohort_schedule(self):
        from app.db.seed_schedule import seed_schedule
        seed_schedule()

    def test_student_cohort_isolation(self):
        db = SessionLocal()
        rizal = db.query(StudentProfile).filter(StudentProfile.nim == "202401001").first()
        assert rizal is not None
        assert rizal.academic_cohort == 1
        assert rizal.class_type == ClassType.REGULER_PAGI

        # Ensure Rizal's enrolled classes only contain TEKFO 1
        enrs = db.query(ClassEnrollment).filter(ClassEnrollment.student_id == rizal.id).all()
        for e in enrs:
            c = e.course_class
            c_name = c.kode_kelas or c.name or ""
            assert "TEKFO. 1" in c_name or "TEKFO 1" in c_name or "TI-2024-PAGI-A" in c_name, (
                f"Unexpected non-cohort class enrolled: {c_name}"
            )
        db.close()

    def test_krs_available_classes_endpoint(self):
        token = get_token("rizal@mhs.unipi.ac.id", "mhs123")
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/v1/academic/krs/available-classes", headers=headers)
        assert resp.status_code == 200
        available = resp.json()
        assert isinstance(available, list)

        # None of the returned classes should already be in Rizal's active enrollments
        db = SessionLocal()
        rizal = db.query(StudentProfile).filter(StudentProfile.nim == "202401001").first()
        enrolled_class_ids = {
            e.class_id
            for e in db.query(ClassEnrollment)
            .filter(ClassEnrollment.student_id == rizal.id, ClassEnrollment.status == EnrollmentStatus.AKTIF)
            .all()
        }
        db.close()

        for c in available:
            assert c["id"] not in enrolled_class_ids

    def test_krs_request_schedule_collision_detection(self):
        db = SessionLocal()
        rizal = db.query(StudentProfile).filter(StudentProfile.nim == "202401001").first()
        active_enrs = (
            db.query(ClassEnrollment)
            .filter(ClassEnrollment.student_id == rizal.id, ClassEnrollment.status == EnrollmentStatus.AKTIF)
            .all()
        )
        assert len(active_enrs) > 0
        first_class = active_enrs[0].course_class

        # Create a test class at the EXACT same day and overlapping time
        term = db.query(AcademicTerm).filter(AcademicTerm.is_active == True).first()
        room = db.query(ClassRoom).first()
        lecturer = first_class.lecturer_id

        colliding_course = Course(
            prodi_id=1,
            kode="COLLIDE101",
            nama="Matakuliah Bentrok",
            sks=3,
        )
        db.add(colliding_course)
        db.flush()

        colliding_class = CourseClass(
            name="TEKFO. 3 - Matakuliah Bentrok",
            kode_kelas="TEKFO. 3 - Matakuliah Bentrok",
            course_id=colliding_course.id,
            term_id=term.id,
            lecturer_id=lecturer,
            room_id=room.id if room else None,
            hari=first_class.hari,
            jam_mulai=first_class.jam_mulai,
            jam_selesai=first_class.jam_selesai,
            is_active=True,
        )
        db.add(colliding_class)
        db.commit()
        db.refresh(colliding_class)
        colliding_class_id = colliding_class.id
        db.close()

        # Try to submit KRS request for this colliding class
        token = get_token("rizal@mhs.unipi.ac.id", "mhs123")
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.post(
            "/api/v1/academic/krs/request",
            headers=headers,
            json={
                "class_id": colliding_class_id,
                "request_type": "TAMBAH_SKS",
                "alasan": "Ingin menambah SKS",
            },
        )
        assert resp.status_code == 400
        assert "bentrok" in resp.json()["detail"].lower()

    def test_krs_full_workflow_request_and_lecturer_approval(self):
        # 1. Setup a non-conflicting target class taught by a known lecturer (e.g., ferdi)
        db = SessionLocal()
        rizal = db.query(StudentProfile).filter(StudentProfile.nim == "202401001").first()
        term = db.query(AcademicTerm).filter(AcademicTerm.is_active == True).first()
        user_ferdi = db.query(User).filter(User.email == "ferdi@unipi.ac.id").first()
        lecturer_ferdi = user_ferdi.lecturer_profile

        # Create a non-conflicting class on Sunday (day 7)
        free_course = Course(
            prodi_id=1,
            kode="KRS_TEST_01",
            nama="Pemrograman Lanjut KRS",
            sks=3,
        )
        db.add(free_course)
        db.flush()

        target_class = CourseClass(
            name="TEKFO. 5 - Pemrograman Lanjut KRS",
            kode_kelas="TEKFO. 5 - Pemrograman Lanjut KRS",
            course_id=free_course.id,
            term_id=term.id,
            lecturer_id=lecturer_ferdi.id,
            hari=7,  # Sunday
            jam_mulai=time(14, 0),
            jam_selesai=time(16, 0),
            is_active=True,
        )
        db.add(target_class)
        db.commit()
        db.refresh(target_class)
        target_class_id = target_class.id
        db.close()

        # 2. Student submits KRS request (Tambah SKS)
        student_token = get_token("rizal@mhs.unipi.ac.id", "mhs123")
        student_headers = {"Authorization": f"Bearer {student_token}"}

        req_resp = client.post(
            "/api/v1/academic/krs/request",
            headers=student_headers,
            json={
                "class_id": target_class_id,
                "request_type": "TAMBAH_SKS",
                "alasan": "Mengambil mata kuliah peminatan semester atas",
            },
        )
        assert req_resp.status_code == 201
        krs_data = req_resp.json()
        request_id = krs_data["id"]
        assert krs_data["status"] == "PENDING_APPROVAL"
        assert krs_data["request_type"] == "TAMBAH_SKS"

        # 3. Check student's own requests list
        my_requests = client.get("/api/v1/academic/krs/my-requests", headers=student_headers).json()
        assert any(r["id"] == request_id for r in my_requests)

        # 4. Another lecturer (e.g. nurul) attempts to review -> 403 Forbidden
        nurul_token = client.post(
            "/api/v1/auth/login",
            json={"email": "nurul@unipi.ac.id", "password": "dosen123"},
        ).json()["access_token"]
        nurul_headers = {"Authorization": f"Bearer {nurul_token}"}

        forbidden_resp = client.post(
            f"/api/v1/academic/krs/requests/{request_id}/review",
            headers=nurul_headers,
            json={"action": "APPROVE", "notes": "Approved by non-lecturer"},
        )
        assert forbidden_resp.status_code == 403
        assert "Anda bukan dosen pengampu" in forbidden_resp.json()["detail"]

        # 5. Course lecturer (ferdi) reviews & APPROVES
        ferdi_token = client.post(
            "/api/v1/auth/login",
            json={"email": "ferdi@unipi.ac.id", "password": "dosen123"},
        ).json()["access_token"]
        ferdi_headers = {"Authorization": f"Bearer {ferdi_token}"}

        # Lecturer sees the pending request
        lecturer_requests = client.get(
            "/api/v1/academic/krs/lecturer-requests?status=PENDING_APPROVAL",
            headers=ferdi_headers,
        ).json()
        assert any(r["id"] == request_id for r in lecturer_requests)

        # Approve
        review_resp = client.post(
            f"/api/v1/academic/krs/requests/{request_id}/review",
            headers=ferdi_headers,
            json={"action": "APPROVE", "notes": "Disetujui untuk menambah SKS"},
        )
        assert review_resp.status_code == 200
        review_data = review_resp.json()
        assert review_data["status"] == "APPROVED"
        assert review_data["enrollment_id"] is not None

        # 6. Verify student is now actively enrolled with enrollment_type == TAMBAH_SKS
        db = SessionLocal()
        enr = db.query(ClassEnrollment).filter(ClassEnrollment.id == review_data["enrollment_id"]).first()
        assert enr is not None
        assert enr.status == EnrollmentStatus.AKTIF
        assert enr.enrollment_type == EnrollmentType.TAMBAH_SKS
        db.close()

        # 7. Verify the class now appears in student's class list
        student_classes = client.get("/api/v1/academic/classes", headers=student_headers).json()
        assert any(c["id"] == target_class_id for c in student_classes)


class TestAdminStudentDirectoryFilters:
    @pytest.fixture(autouse=True)
    def setup_cohort_schedule(self):
        from app.db.seed_schedule import seed_schedule
        seed_schedule()

    def test_filter_students_by_cohort_and_class_type(self):
        admin_token = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@unipi.ac.id", "password": "admin123"},
        ).json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Filter cohort 1
        r_c1 = client.get("/api/v1/students?cohort=1", headers=admin_headers)
        assert r_c1.status_code == 200
        for s in r_c1.json():
            assert s["academic_cohort"] == 1

        # Filter cohort 5
        r_c5 = client.get("/api/v1/students?cohort=5", headers=admin_headers)
        assert r_c5.status_code == 200
        for s in r_c5.json():
            assert s["academic_cohort"] == 5

        # Filter class_type REGULER_MALAM
        r_malam = client.get("/api/v1/students?class_type=REGULER_MALAM", headers=admin_headers)
        assert r_malam.status_code == 200
        for s in r_malam.json():
            assert s["class_type"] == "REGULER_MALAM"
