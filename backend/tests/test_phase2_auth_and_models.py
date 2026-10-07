"""
SADITA — Phase 2 Automated Tests
Tests Authentication, RBAC, Student Hardware Mapping, and Academic Endpoints.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestAuthEndpoints:
    def test_admin_login_success(self):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@unipi.ac.id", "password": "admin123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "admin@unipi.ac.id"
        assert data["user"]["role"] == "ADMIN"

    def test_dosen_login_success(self):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "dosen@unipi.ac.id", "password": "dosen123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["role"] == "DOSEN"
        assert data["user"]["lecturer_profile"] is not None
        assert data["user"]["lecturer_profile"]["nidn"] == "0412058501"

    def test_student_login_success(self):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "rizal@mhs.unipi.ac.id", "password": "mhs123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["role"] == "MAHASISWA"
        assert data["user"]["student_profile"] is not None
        assert data["user"]["student_profile"]["nim"] == "202401001"
        assert data["user"]["student_profile"]["rfid_uid"] == "A1B2C3D4"

    def test_wrong_password_fails(self):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@unipi.ac.id", "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    def test_token_refresh(self):
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@unipi.ac.id", "password": "admin123"},
        )
        refresh_token = login_resp.json()["refresh_token"]

        ref_resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert ref_resp.status_code == 200
        assert "access_token" in ref_resp.json()

    def test_get_me_endpoint(self):
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "dosen@unipi.ac.id", "password": "dosen123"},
        )
        token = login_resp.json()["access_token"]

        me_resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_resp.status_code == 200
        data = me_resp.json()
        assert data["email"] == "dosen@unipi.ac.id"
        assert data["role"] == "DOSEN"


class TestRBACPermissions:
    def test_student_forbidden_from_admin_user_list(self):
        # Student login
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "rizal@mhs.unipi.ac.id", "password": "mhs123"},
        )
        student_token = login_resp.json()["access_token"]

        # Attempt to access admin users endpoint
        resp = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 403

    def test_admin_can_access_user_list(self):
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@unipi.ac.id", "password": "admin123"},
        )
        admin_token = login_resp.json()["access_token"]

        resp = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        users = resp.json()
        assert len(users) >= 4  # admin + dosen + 3 students

    def test_unauthenticated_request_rejected(self):
        resp = client.get("/api/v1/users")
        assert resp.status_code in (401, 403)


class TestStudentHardware:
    def test_lookup_by_rfid_success(self):
        resp = client.get("/api/v1/students/by-rfid/A1B2C3D4")
        assert resp.status_code == 200
        data = resp.json()
        assert data["nim"] == "202401001"
        assert data["rfid_uid"] == "A1B2C3D4"
        assert data["fingerprint_template_id"] == 1

    def test_lookup_unknown_rfid_fails(self):
        resp = client.get("/api/v1/students/by-rfid/UNKNOWN99")
        assert resp.status_code == 404

    def test_assign_hardware_by_lecturer(self):
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "dosen@unipi.ac.id", "password": "dosen123"},
        )
        lecturer_token = login_resp.json()["access_token"]

        # Update student 1 hardware
        resp = client.put(
            "/api/v1/students/1/hardware",
            headers={"Authorization": f"Bearer {lecturer_token}"},
            json={"rfid_uid": "A1B2C3D4", "fingerprint_template_id": 10},
        )
        assert resp.status_code == 200
        assert resp.json()["fingerprint_template_id"] == 10

        # Restore
        client.put(
            "/api/v1/students/1/hardware",
            headers={"Authorization": f"Bearer {lecturer_token}"},
            json={"rfid_uid": "A1B2C3D4", "fingerprint_template_id": 1},
        )


class TestAcademicEntities:
    def test_list_terms(self):
        resp = client.get("/api/v1/academic/terms")
        assert resp.status_code == 200
        terms = resp.json()
        assert len(terms) >= 1
        assert any(t["name"] == "Ganjil 2026/2027" for t in terms)

    def test_list_courses(self):
        resp = client.get("/api/v1/academic/courses")
        assert resp.status_code == 200
        courses = resp.json()
        assert any(c["code"] == "IF201" for c in courses)

    def test_list_classes(self):
        resp = client.get("/api/v1/academic/classes")
        assert resp.status_code == 200
        classes = resp.json()
        assert len(classes) >= 1
        assert classes[0]["name"] == "TI-2024-Pagi-A"

    def test_class_students_enrolled(self):
        resp = client.get("/api/v1/academic/classes/1/students")
        assert resp.status_code == 200
        students = resp.json()
        assert len(students) == 3

    def test_admin_dashboard_summary(self):
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@unipi.ac.id", "password": "admin123"},
        )
        token = login_resp.json()["access_token"]

        resp = client.get(
            "/api/v1/academic/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_students"] >= 1
        assert data["total_lecturers"] >= 1
        assert data["total_classes"] >= 1
        assert data["total_courses"] >= 1
        assert "devices_offline" in data
        assert "open_sessions" in data
