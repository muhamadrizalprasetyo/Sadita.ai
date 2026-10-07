"""
SADITA Backend — Database Session
Provides SQLAlchemy engine, session factory, and dependency.
"""
from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,          # verify connection before use
    pool_size=10,
    max_overflow=20,
    echo=settings.APP_DEBUG,     # log SQL in dev
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ---------------------------------------------------------------------------
# Declarative base — all models inherit from this
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency — yields a DB session and closes it after each request
# ---------------------------------------------------------------------------
def get_db() -> Session:  # type: ignore[return]
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Health-check helper
# ---------------------------------------------------------------------------
def check_db_connection() -> dict:
    """Return database connectivity status."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
        return {"status": "ok", "version": version}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
