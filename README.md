# SADITA.ai

**Sistem Absensi Digital Terintegrasi Akademik**  
Universitas Insan Pembangunan Indonesia (UNIPI)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + TypeScript |
| Backend | FastAPI + Python 3.14 |
| Database | PostgreSQL 18 |
| ORM | SQLAlchemy 2 |
| Migration | Alembic |
| MQTT | Mosquitto 2.1.2 + paho-mqtt |
| Auth | JWT (access + refresh token) |

## Structure

```
sadita.ai/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # Routers
│   │   ├── core/     # Config, security, deps
│   │   ├── db/       # Database session, base
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   ├── repositories/ # Data access
│   │   └── mqtt/     # MQTT client & handlers
│   ├── alembic/      # DB migrations
│   ├── tests/        # Pytest test suite
│   └── requirements.txt
├── frontend/         # Next.js application
├── docs/             # Architecture & API docs
└── scripts/          # Dev & deployment scripts
```

## Quick Start

### Prerequisites
- Python 3.14+
- Node.js 24+
- PostgreSQL 18 (running on port 5433)
- Mosquitto MQTT Broker

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env        # edit accordingly
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.local.example`.

## API Docs

Once backend is running:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Phase Progress

- [x] Phase 1 — Infrastructure
- [ ] Phase 2 — Database + Auth
- [ ] Phase 3 — Academic
- [ ] Phase 4 — Attendance + MQTT
- [ ] Phase 5 — LMS + Grade
- [ ] Phase 6 — Analytics
- [ ] Phase 7 — UI/UX Final
# Sadita.ai
