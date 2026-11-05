"""Read-only, administrator-scoped audit trail (Clean Architecture)."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Query

from app.core.deps import DBSession, RequireAdmin
from app.schemas.audit import AuditLogPage
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["Audit logs"])
audit_service = AuditService()


@router.get("", response_model=AuditLogPage)
def list_audit_logs(
    _: RequireAdmin,
    db: DBSession,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    actor_id: Optional[int] = None,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
) -> AuditLogPage:
    return audit_service.get_audit_page(
        db,
        offset=offset,
        limit=limit,
        actor_id=actor_id,
        action=action,
        entity=entity,
        since=since,
        until=until,
    )
