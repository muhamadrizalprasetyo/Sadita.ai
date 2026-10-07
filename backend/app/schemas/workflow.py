from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.workflow import AttendanceRequestStatus

class LeaderResponse(BaseModel):
    id: int; class_id: int; student_id: int; assigned_at: datetime; assigned_by: int; is_active: bool
    model_config = ConfigDict(from_attributes=True)
class LeaderCreate(BaseModel): student_id: int
class AttendanceRequestResponse(BaseModel):
    id: int; session_id: int; student_id: int; status: AttendanceRequestStatus; submitted_at: datetime; verified_by: Optional[int]; verified_at: Optional[datetime]; approved_by: Optional[int]; approved_at: Optional[datetime]; rejection_reason: Optional[str]
    model_config = ConfigDict(from_attributes=True)
class RejectRequest(BaseModel): reason: str = Field(min_length=2, max_length=500)
