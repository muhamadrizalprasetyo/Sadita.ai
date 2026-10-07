"""Read-only, administrator-scoped audit trail."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.core.deps import DBSession, RequireAdmin
from app.models.workflow import AuditLog
from app.schemas.audit import AuditLogPage, AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit logs"])

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
    statement = select(AuditLog).order_by(AuditLog.created_at.desc())
    count_statement = select(func.count(AuditLog.id))
    filters = []
    if actor_id is not None: filters.append(AuditLog.actor_id == actor_id)
    if action: filters.append(AuditLog.action == action)
    if entity: filters.append(AuditLog.entity == entity)
    if since: filters.append(AuditLog.created_at >= since)
    if until: filters.append(AuditLog.created_at <= until)
    if filters: statement = statement.where(*filters); count_statement = count_statement.where(*filters)
    total = db.scalar(count_statement) or 0
    items = db.scalars(statement.offset(offset).limit(limit)).all()
    return AuditLogPage(items=[AuditLogResponse.model_validate(item) for item in items], total=total, offset=offset, limit=limit)
