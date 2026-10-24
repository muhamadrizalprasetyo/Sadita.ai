"""
SADITA — Academic Schemas
"""
from __future__ import annotations

from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import LecturerProfileResponse, StudentProfileResponse


# ---------------------------------------------------------------------------
# Academic Term
# ---------------------------------------------------------------------------
class AcademicTermBase(BaseModel):
    name: str = Field(..., max_length=100)
    is_active: bool = True
    start_date: date
    end_date: date


class AcademicTermCreate(AcademicTermBase):
    pass


class AcademicTermResponse(AcademicTermBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------
class CourseBase(BaseModel):
    code: str = Field(..., max_length=30)
    name: str = Field(..., max_length=200)
    credits: int = Field(default=3, ge=1, le=6)
    description: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Class Room
# ---------------------------------------------------------------------------
class ClassRoomBase(BaseModel):
    name: str = Field(..., max_length=100)
    capacity: int = Field(default=40, ge=1)
    code: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None


class ClassRoomCreate(ClassRoomBase):
    pass


class ClassRoomResponse(ClassRoomBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Course Class
# ---------------------------------------------------------------------------
class CourseClassBase(BaseModel):
    name: str = Field(..., max_length=100)
    course_id: int
    term_id: int
    lecturer_id: int
    room_id: Optional[int] = None
    day_of_week: int = Field(default=1, ge=1, le=7)
    start_time: time
    end_time: time
    is_active: bool = True
    class_type: Optional[str] = "REGULER_PAGI"


class CourseClassCreate(CourseClassBase):
    pass


class CourseClassUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    course_id: Optional[int] = None
    term_id: Optional[int] = None
    lecturer_id: Optional[int] = None
    room_id: Optional[int] = None
    day_of_week: Optional[int] = Field(None, ge=1, le=7)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_active: Optional[bool] = None


class CourseClassResponse(CourseClassBase):
    id: int
    created_at: datetime
    course: Optional[CourseResponse] = None
    term: Optional[AcademicTermResponse] = None
    lecturer: Optional[LecturerProfileResponse] = None
    room: Optional[ClassRoomResponse] = None

    model_config = ConfigDict(from_attributes=True)


from app.models.academic import EnrollmentType, KrsRequestStatus, KrsRequestType


# ---------------------------------------------------------------------------
# Class Enrollment
# ---------------------------------------------------------------------------
class ClassEnrollmentCreate(BaseModel):
    class_id: int
    student_id: int
    enrollment_type: Optional[EnrollmentType] = EnrollmentType.REGULER


class ClassEnrollmentResponse(BaseModel):
    id: int
    class_id: int
    student_id: int
    status: str
    enrollment_type: Optional[str] = "REGULER"
    enrolled_at: datetime
    student: Optional[StudentProfileResponse] = None
    course_class: Optional[CourseClassResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# KRS Requests (Tambah SKS / Mengulang Mata Kuliah)
# ---------------------------------------------------------------------------
class KrsRequestCreate(BaseModel):
    class_id: int
    request_type: KrsRequestType
    alasan: Optional[str] = Field(None, max_length=500)


class KrsRequestReview(BaseModel):
    action: str = Field(..., description="'APPROVE' atau 'REJECT'")
    notes: Optional[str] = Field(None, max_length=500)


class KrsRequestResponse(BaseModel):
    id: int
    student_id: int
    class_id: int
    request_type: KrsRequestType
    status: KrsRequestStatus
    alasan: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    reviewer_notes: Optional[str] = None
    enrollment_id: Optional[int] = None
    student: Optional[StudentProfileResponse] = None
    course_class: Optional[CourseClassResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ActiveSessionInfo(BaseModel):
    id: int
    class_id: int
    class_name: str
    course_name: str
    lecturer_name: str
    room_name: Optional[str] = None
    session_number: int
    topic: Optional[str] = None
    opened_at: Optional[datetime] = None
    present_count: int = 0
    model_config = ConfigDict(from_attributes=True)


class RecentActivityItem(BaseModel):
    id: int
    action: str
    description: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AdminDashboardResponse(BaseModel):
    total_students: int = 0
    total_lecturers: int = 0
    total_classes: int = 0
    total_courses: int = 0
    open_sessions: int = 0
    devices_offline: int = 0
    pending_approvals: int = 0
    today_attendance: int = 0
    generated_at: datetime
    active_session: Optional[ActiveSessionInfo] = None
    recent_activities: List[RecentActivityItem] = []

    model_config = ConfigDict(from_attributes=True)

