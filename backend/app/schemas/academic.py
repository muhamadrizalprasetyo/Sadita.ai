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


class CourseClassCreate(CourseClassBase):
    pass


class CourseClassResponse(CourseClassBase):
    id: int
    created_at: datetime
    course: Optional[CourseResponse] = None
    term: Optional[AcademicTermResponse] = None
    lecturer: Optional[LecturerProfileResponse] = None
    room: Optional[ClassRoomResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Class Enrollment
# ---------------------------------------------------------------------------
class ClassEnrollmentCreate(BaseModel):
    class_id: int
    student_id: int


class ClassEnrollmentResponse(BaseModel):
    id: int
    class_id: int
    student_id: int
    status: str
    enrolled_at: datetime
    student: Optional[StudentProfileResponse] = None

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

    model_config = ConfigDict(from_attributes=True)
