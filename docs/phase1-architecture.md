# SADITA — Phase 1 Architecture Notes

## Environment Summary

| Component | Version | Port | Status |
|---|---|---|---|
| Python | 3.12.14 (uv) | — | ✅ Active in .venv |
| Node.js | 24.16.0 | — | ✅ |
| PostgreSQL | 18 | **5433** | ✅ Running |
| Mosquitto | 2.1.2 | 1883 | ✅ Running |
| FastAPI | 0.115.14 | 8000 | ✅ 17/17 tests passing |
| Next.js | 16.3.7 | 3000 | ✅ Production build verified |

> **Note:** PostgreSQL runs on port **5433**, not the default 5432. All DATABASE_URL configs reflect this.

## Project Structure

```
sadita.ai/
├── backend/
│   ├── .venv/                    # Python virtual environment
│   ├── app/
│   │   ├── main.py               # FastAPI application entry point
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py     # Aggregates all v1 routers
│   │   │       └── endpoints/
│   │   │           └── health.py # /api/v1/health endpoints
│   │   ├── core/
│   │   │   ├── config.py         # pydantic-settings — all env vars
│   │   │   ├── security.py       # bcrypt + JWT helpers
│   │   │   └── deps.py           # FastAPI dependency injectors
│   │   ├── db/
│   │   │   └── session.py        # SQLAlchemy engine + get_db()
│   │   ├── models/               # SQLAlchemy models (Phase 2+)
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # Business logic layer
│   │   ├── repositories/         # Data access layer
│   │   └── mqtt/
│   │       ├── client.py         # SADITAMQTTClient singleton
│   │       └── handlers.py       # Event handler registration
│   ├── alembic/
│   │   ├── env.py                # Reads DATABASE_URL from app settings
│   │   ├── script.py.mako        # Migration template
│   │   └── versions/             # Migration files (Phase 2+)
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_phase1_infrastructure.py
│   ├── .env                      # Local dev env vars
│   ├── .env.example
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Health dashboard home page
│   │   └── globals.css
│   ├── lib/
│   │   └── api.ts                # API client
│   ├── .env.local
│   └── .env.local.example
├── scripts/
│   ├── start-dev.ps1             # Start all services
│   ├── setup-db.ps1              # Create DB + run migrations
│   └── run-tests.ps1             # Run pytest
├── docs/
│   └── phase1-architecture.md   # This file
├── .gitignore
└── README.md
```

## Layer Separation

```
HTTP Request
    ↓
Router (app/api/v1/endpoints/)
    ↓
Service (app/services/) — business logic, validation
    ↓
Repository (app/repositories/) — data access only
    ↓
Model (app/models/) — SQLAlchemy ORM
    ↓
PostgreSQL
```

## MQTT Architecture

```
ESP32-S3 Device
    ↓ publish
MQTT Broker (Mosquitto :1883)
    ↓ subscribe wildcard: sadita/device/+/#
SADITAMQTTClient (app/mqtt/client.py)
    ↓ dispatch by event_type
Handler (app/mqtt/handlers.py)
    ↓
Service layer (Phase 4)
```

**Topics:**
- `sadita/device/{id}/status` — Device heartbeat
- `sadita/device/{id}/rfid` — RFID scan event
- `sadita/device/{id}/fingerprint` — Fingerprint result
- `sadita/device/{id}/attendance` — Full attendance bundle
- `sadita/device/{id}/command` — Backend → device
- `sadita/device/{id}/ack` — Device command ack

## Security Design

- Passwords: bcrypt hashed via passlib, never stored plaintext
- Auth: JWT access token (60 min) + refresh token (7 days)
- RBAC: enforced at endpoint level via FastAPI dependencies
- RFID UID: identifier only, not the sole credential — always paired with fingerprint
- Fingerprint templates: stored by device reference ID only

## How to Start (Manual)

```powershell
# 1. Start Mosquitto
Start-Service mosquitto

# 2. Start Backend
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# 3. Start Frontend (new terminal)
cd frontend
npm run dev

# Or use the script:
.\scripts\start-dev.ps1
```

## API Endpoints (Phase 1)

| Method | Path | Description |
|---|---|---|
| GET | `/` | Service info |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |
| GET | `/api/v1/health` | Overall health (DB + MQTT) |
| GET | `/api/v1/health/db` | PostgreSQL health |
| GET | `/api/v1/health/mqtt` | MQTT broker health |
