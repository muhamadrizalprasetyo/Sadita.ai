"""
SADITA — Audit Repository (OOP Clean Architecture)
Data access layer for immutable audit trail and activity logging.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.workflow import AuditLog
from app.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog, Any, Any]):
    def __init__(self):
        super().__init__(AuditLog)

    def list_audit_logs(
        self,
        db: Session,
        *,
        offset: int = 0,
        limit: int = 50,
        actor_id: Optional[int] = None,
        action: Optional[str] = None,
        entity: Optional[str] = None,
        since: Optional[datetime] = None,
        until: Optional[datetime] = None,
    ) -> Tuple[List[AuditLog], int]:
        """Ambil log audit terfilter beserta total hitungan record."""
        statement = select(AuditLog).order_by(AuditLog.created_at.desc())
        count_statement = select(func.count(AuditLog.id))
        filters = []

        if actor_id is not None:
            filters.append(AuditLog.actor_id == actor_id)
        if action:
            filters.append(AuditLog.action == action)
        if entity:
            filters.append(AuditLog.entity == entity)
        if since:
            filters.append(AuditLog.created_at >= since)
        if until:
            filters.append(AuditLog.created_at <= until)

        if filters:
            statement = statement.where(*filters)
            count_statement = count_statement.where(*filters)

        total = db.scalar(count_statement) or 0
        items = list(db.scalars(statement.offset(offset).limit(limit)).all())
        return items, total

    def get_recent_activities(self, db: Session, limit: int = 5) -> List[AuditLog]:
        """Ambil aktivitas audit terbaru untuk ringkasan operasional."""
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        return list(db.scalars(stmt).all())

