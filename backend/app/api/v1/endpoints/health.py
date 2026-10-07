"""
SADITA — Health Check Endpoints
GET /health            → overall system health
GET /health/db         → PostgreSQL connectivity
GET /health/mqtt       → MQTT broker connectivity
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app.db.session import check_db_connection
from app.mqtt.client import mqtt_client

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def health_root() -> dict:
    """Overall service health — always returns quickly."""
    db_status = check_db_connection()
    mqtt_status = mqtt_client.health()

    all_ok = db_status["status"] == "ok" and mqtt_status["status"] == "ok"

    return {
        "service": "SADITA Backend",
        "status": "ok" if all_ok else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "database": db_status,
            "mqtt": mqtt_status,
        },
    }


@router.get("/db")
def health_db() -> dict:
    """PostgreSQL connectivity check."""
    return check_db_connection()


@router.get("/mqtt")
def health_mqtt() -> dict:
    """MQTT broker connectivity check."""
    return mqtt_client.health()
