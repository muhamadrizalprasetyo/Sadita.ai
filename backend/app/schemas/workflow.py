from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.workflow import AttendanceRequestStatus

class LeaderResponse(BaseModel):
    id: int; class_id: int; student_id: int; assigned_at: datetime; assigned_by: int; is_active: bool
    model_config = ConfigDict(from_attributes=True)
class LeaderCreate(BaseModel): student_id: int
class AttendanceRequestCreate(BaseModel):
    reason: str = Field(..., min_length=2, max_length=500, description="Alasan permohonan (misal: KTM tertinggal, KTM hilang)")

class AttendanceRequestResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    status: AttendanceRequestStatus
    reason: Optional[str] = None
    submitted_at: datetime
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
class RejectRequest(BaseModel): reason: str = Field(min_length=2, max_length=500)
