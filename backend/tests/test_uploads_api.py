"""
Coverage for Secure Upload API (/api/v1/uploads).
"""
import io
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _student_headers() -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "rizal@mhs.unipi.ac.id", "password": "mhs123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_upload_file_unauthenticated():
    file_content = b"%PDF-1.4 test file"
    response = client.post(
        "/api/v1/uploads",
        files={"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")},
    )
    assert response.status_code in (401, 403)


def test_upload_invalid_extension():
    headers = _student_headers()
    file_content = b"#!/bin/bash\necho hacked"
    response = client.post(
        "/api/v1/uploads",
        files={"file": ("malicious.sh", io.BytesIO(file_content), "text/x-sh")},
        headers=headers,
    )
    assert response.status_code == 400
    assert "tidak diizinkan" in response.json()["detail"]


def test_upload_and_retrieve_success():
    headers = _student_headers()
    file_content = b"Sample assignment text content"
    response = client.post(
        "/api/v1/uploads",
        files={"file": ("tugas1.txt", io.BytesIO(file_content), "text/plain")},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert "file_url" in data
    assert data["original_filename"] == "tugas1.txt"
    assert data["file_size_bytes"] == len(file_content)

    # Retrieve file via GET
    file_url = data["file_url"]
    get_res = client.get(file_url)
    assert get_res.status_code == 200
    assert get_res.content == file_content
