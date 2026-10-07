from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def headers(email: str, password: str) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}

def test_admin_assigns_only_enrolled_student_as_class_leader() -> None:
    admin = headers("admin@unipi.ac.id", "admin123")
    assigned = client.post("/api/v1/academic/classes/1/leader", json={"student_id": 1}, headers=admin)
    assert assigned.status_code == 201
    duplicate = client.post("/api/v1/academic/classes/1/leader", json={"student_id": 2}, headers=admin)
    assert duplicate.status_code == 409
    not_enrolled = client.post("/api/v1/academic/classes/1/leader", json={"student_id": 4}, headers=admin)
    assert not_enrolled.status_code == 400

def test_online_attendance_requires_leader_verify_then_lecturer_approve() -> None:
    admin = headers("admin@unipi.ac.id", "admin123")
    student = headers("rizal@mhs.unipi.ac.id", "mhs123")
    lecturer = headers("dosen@unipi.ac.id", "dosen123")
    assert client.post("/api/v1/academic/classes/1/leader", json={"student_id": 2}, headers=admin).status_code == 201
    request = client.post("/api/v1/attendance/sessions/1/requests", headers=student)
    assert request.status_code == 201
    request_id = request.json()["id"]
    assert client.post(f"/api/v1/academic/classes/1/presence/{request_id}/verify", headers=student).status_code == 403
    leader = headers("budi@mhs.unipi.ac.id", "mhs123")
    assert client.post(f"/api/v1/academic/classes/1/presence/{request_id}/verify", headers=leader).status_code == 200
    assert client.post(f"/api/v1/attendance/requests/{request_id}/approve", headers=leader).status_code == 403
    approved = client.post(f"/api/v1/attendance/requests/{request_id}/approve", headers=lecturer)
    assert approved.status_code == 200
    assert approved.json()["status"] == "APPROVED"
