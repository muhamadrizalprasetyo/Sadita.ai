"""
SADITA — Audit Service (OOP Clean Architecture)
Business logic for immutable audit logging.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.repositories.audit_repo import AuditRepository
from app.schemas.audit import AuditLogPage, AuditLogResponse
from app.services.base import BaseService


class AuditService(BaseService[AuditRepository]):
    def __init__(self, repository: AuditRepository | None = None):
        super().__init__(repository or AuditRepository())

    def get_audit_page(
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
    ) -> AuditLogPage:
        """Ambil halaman log audit dengan validasi skema."""
        items, total = self._repo.list_audit_logs(
            db,
            offset=offset,
            limit=limit,
            actor_id=actor_id,
            action=action,
            entity=entity,
            since=since,
            until=until,
        )
        return AuditLogPage(
            items=[AuditLogResponse.model_validate(item) for item in items],
            total=total,
            offset=offset,
            limit=limit,
        )

