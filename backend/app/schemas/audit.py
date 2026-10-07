from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int]
    action: str
    entity: str
    entity_id: Optional[int]
    before: Optional[dict]
    after: Optional[dict]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuditLogPage(BaseModel):
    items: list[AuditLogResponse]
    total: int
    offset: int
    limit: int
