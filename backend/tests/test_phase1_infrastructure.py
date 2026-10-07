"""
SADITA — Phase 1 Infrastructure Tests
Tests: DB connection, MQTT connection, API health endpoints, config loading.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.db.session import check_db_connection

# ---------------------------------------------------------------------------
# Test client
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Config tests
# ---------------------------------------------------------------------------
class TestConfig:
    def test_app_name(self):
        assert settings.APP_NAME == "SADITA"

    def test_database_url_assembled(self):
        """DATABASE_URL should contain host and DB name."""
        assert settings.POSTGRES_HOST in settings.DATABASE_URL
        assert settings.POSTGRES_DB in settings.DATABASE_URL

    def test_jwt_algorithm(self):
        assert settings.JWT_ALGORITHM == "HS256"

    def test_mqtt_defaults(self):
        assert settings.MQTT_BROKER_HOST == "localhost"
        assert settings.MQTT_BROKER_PORT == 1883


# ---------------------------------------------------------------------------
# Database tests
# ---------------------------------------------------------------------------
class TestDatabase:
    def test_db_connection(self):
        """PostgreSQL should be reachable."""
        result = check_db_connection()
        assert result["status"] == "ok", f"DB error: {result.get('detail')}"

    def test_db_version_is_pg18(self):
        result = check_db_connection()
        assert result["status"] == "ok"
        assert "PostgreSQL" in result.get("version", "")
        assert "18" in result.get("version", "")


# ---------------------------------------------------------------------------
# API root tests
# ---------------------------------------------------------------------------
class TestRoot:
    def test_root_endpoint(self, client: TestClient):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "SADITA"
        assert "docs" in data

    def test_docs_accessible(self, client: TestClient):
        response = client.get("/docs")
        assert response.status_code == 200

    def test_openapi_json(self, client: TestClient):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert schema["info"]["title"] == "SADITA API"


# ---------------------------------------------------------------------------
# Health endpoint tests
# ---------------------------------------------------------------------------
class TestHealthEndpoints:
    def test_health_root(self, client: TestClient):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "components" in data
        assert "database" in data["components"]
        assert "mqtt" in data["components"]

    def test_health_db(self, client: TestClient):
        response = client.get("/api/v1/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_health_mqtt(self, client: TestClient):
        """
        MQTT status can be 'ok' or 'disconnected' in CI environments.
        The endpoint itself must always return 200.
        """
        response = client.get("/api/v1/health/mqtt")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("ok", "disconnected")
        assert "broker_host" in data


# ---------------------------------------------------------------------------
# Security tests
# ---------------------------------------------------------------------------
class TestSecurity:
    def test_password_hash_and_verify(self):
        from app.core.security import hash_password, verify_password
        plain = "TestPassword123!"
        hashed = hash_password(plain)
        assert hashed != plain
        assert verify_password(plain, hashed)

    def test_wrong_password_fails(self):
        from app.core.security import hash_password, verify_password
        hashed = hash_password("correct")
        assert not verify_password("wrong", hashed)

    def test_create_and_decode_access_token(self):
        from app.core.security import create_access_token, decode_token
        token = create_access_token(subject=42)
        payload = decode_token(token)
        assert payload["sub"] == "42"
        assert payload["type"] == "access"

    def test_create_and_decode_refresh_token(self):
        from app.core.security import create_refresh_token, decode_token
        token = create_refresh_token(subject=42)
        payload = decode_token(token)
        assert payload["sub"] == "42"
        assert payload["type"] == "refresh"

    def test_invalid_token_raises(self):
        from jose import JWTError
        from app.core.security import decode_token
        with pytest.raises(JWTError):
            decode_token("this.is.not.valid")
