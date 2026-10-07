"""Coverage for the admin device inventory API."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _admin_headers() -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@unipi.ac.id", "password": "admin123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_admin_can_read_device_inventory_and_events() -> None:
    headers = _admin_headers()
    devices = client.get("/api/v1/devices", headers=headers)
    assert devices.status_code == 200
    assert devices.json()[0]["device_id"] == "SADITA-ESP32-LAB-01"

    events = client.get("/api/v1/devices/SADITA-ESP32-LAB-01/events", headers=headers)
    assert events.status_code == 200
    assert isinstance(events.json(), list)


def test_student_cannot_read_device_inventory() -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "rizal@mhs.unipi.ac.id", "password": "mhs123"},
    )
    result = client.get(
        "/api/v1/devices",
        headers={"Authorization": f"Bearer {response.json()['access_token']}"},
    )
    assert result.status_code == 403
