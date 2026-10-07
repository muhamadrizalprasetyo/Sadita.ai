"""
SADITA — Pytest conftest
Shared fixtures for all test modules.
"""
from __future__ import annotations

import os

import pytest

from app.db.seed import seed_database
from app.db.session import Base, engine

# Point tests at the backend directory so .env and imports work correctly
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(backend_dir)


@pytest.fixture(autouse=True)
def reset_database():
    """Keep every test isolated from previous runs by reseeding a fresh database."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    Base.metadata.drop_all(bind=engine)
