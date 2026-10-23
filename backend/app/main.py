"""
SADITA Backend — FastAPI Application Entry Point
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.core.config import settings
from app.db.seed import seed_database
from app.db.seed_schedule import seed_schedule
from app.db.session import Base, engine
from app.mqtt.client import mqtt_client
from app.mqtt.handlers import register_all_handlers

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG if settings.APP_DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def ensure_database_ready() -> None:
    """Ensure schema and seed data exist before serving requests.

    This is intentionally defensive: some direct app usage patterns (for example
    TestClient(app) without an explicit context manager) skip the ASGI lifespan,
    so a startup-only bootstrap would otherwise be missed.
    """
    Base.metadata.create_all(bind=engine)
    seed_database()
    try:
        seed_schedule()
    except Exception as exc:
        logger.warning("seed_schedule error/warning: %s", exc)


# ---------------------------------------------------------------------------
# Lifespan — startup and shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- Startup ----
    logger.info("Starting %s backend (env=%s)", settings.APP_NAME, settings.APP_ENV)

    try:
        ensure_database_ready()
        logger.info("Database bootstrap completed successfully")
    except Exception as exc:
        logger.exception("Database bootstrap failed during startup: %s", exc)
        raise

    # Register MQTT event handlers and connect to broker
    register_all_handlers()
    mqtt_client.setup()

    logger.info("%s backend started", settings.APP_NAME)
    yield

    # ---- Shutdown ----
    logger.info("Shutting down %s backend", settings.APP_NAME)
    mqtt_client.teardown()


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description=(
        "Sistem Absensi Digital Terintegrasi Akademik — UNIPI\n\n"
        "REST API for attendance, LMS, academic management, and IoT integration."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_v1_router)


# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------
@app.get("/", tags=["Root"])
def root() -> dict:
    return {
        "service": settings.APP_NAME,
        "description": "Sistem Absensi Digital Terintegrasi Akademik",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
