from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.services.authorization_service import audit

client = TestClient(app)

def _headers(email: str, password: str) -> dict[str, str]:
    result = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {result.json()['access_token']}"}

def test_admin_can_filter_paginated_audit_log_and_student_is_forbidden() -> None:
    db = SessionLocal()
    try:
        audit(db, 1, "TEST_AUDIT", "test_entity", 99, after={"safe": True})
        db.commit()
    finally:
        db.close()
    admin = client.get("/api/v1/audit-logs?action=TEST_AUDIT&limit=1", headers=_headers("admin@unipi.ac.id", "admin123"))
    assert admin.status_code == 200
    assert admin.json()["total"] == 1
    assert admin.json()["items"][0]["entity_id"] == 99
    student = client.get("/api/v1/audit-logs", headers=_headers("rizal@mhs.unipi.ac.id", "mhs123"))
    assert student.status_code == 403
