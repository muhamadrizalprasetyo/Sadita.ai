"""
SADITA — User & Profile Schemas
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.academic import ClassType
from app.models.user import UserRole


# ---------------------------------------------------------------------------
# Student Profile Schemas
# ---------------------------------------------------------------------------
class StudentProfileBase(BaseModel):
    nim: str = Field(..., max_length=30, description="Nomor Induk Mahasiswa")
    department: str = Field(default="Teknik Informatika", max_length=100)
    batch_year: int = Field(default=2024, ge=2000, le=2100)
    academic_cohort: int = Field(default=1, ge=1, le=8, description="Tingkat TEKFO 1 s.d. 8")
    class_type: ClassType = Field(default=ClassType.REGULER_PAGI, description="Jenis kelas reguler")
    phone: Optional[str] = Field(default=None, max_length=30)
    rfid_uid: Optional[str] = Field(default=None, max_length=64, description="RFID UID dari KTM")
    fingerprint_template_id: Optional[int] = Field(default=None, description="ID template di sensor jari")
    ktm_status: Optional[str] = Field(default=None, description="Status kepemilikan/ketersediaan KTM")


class StudentProfileCreate(StudentProfileBase):
    pass


class StudentProfileUpdate(BaseModel):
    department: Optional[str] = None
    batch_year: Optional[int] = None
    academic_cohort: Optional[int] = Field(None, ge=1, le=8)
    class_type: Optional[ClassType] = None
    phone: Optional[str] = None
    rfid_uid: Optional[str] = None
    fingerprint_template_id: Optional[int] = None


class HardwareAssignRequest(BaseModel):
    rfid_uid: Optional[str] = Field(None, description="RFID UID dari KTM (hex string)")
    fingerprint_template_id: Optional[int] = Field(None, description="ID index sidik jari di sensor")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Kata sandi saat ini")
    new_password: str = Field(..., min_length=6, max_length=128, description="Kata sandi baru")
    confirm_password: str = Field(..., min_length=6, max_length=128, description="Konfirmasi kata sandi baru")


class StudentProfileResponse(StudentProfileBase):
    id: int
    user_id: int
    full_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Lecturer Profile Schemas
# ---------------------------------------------------------------------------
class LecturerProfileBase(BaseModel):
    nidn: str = Field(..., max_length=30, description="Nomor Induk Dosen Nasional")
    department: str = Field(default="Teknik Informatika", max_length=100)
    phone: Optional[str] = Field(default=None, max_length=30)


class LecturerProfileCreate(LecturerProfileBase):
    pass


class LecturerProfileUpdate(BaseModel):
    department: Optional[str] = None
    phone: Optional[str] = None


class LecturerProfileResponse(LecturerProfileBase):
    id: int
    user_id: int
    full_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# User Schemas
# ---------------------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = UserRole.MAHASISWA
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)
    student_profile: Optional[StudentProfileCreate] = None
    lecturer_profile: Optional[LecturerProfileCreate] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    student_profile: Optional[StudentProfileResponse] = None
    lecturer_profile: Optional[LecturerProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)
