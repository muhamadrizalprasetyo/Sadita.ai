"""
SADITA — Authentication Schemas
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole
from app.schemas.user import UserResponse, StudentProfileCreate, LecturerProfileCreate


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = UserRole.MAHASISWA
    # Optional profile fields depending on role:
    student_profile: Optional[StudentProfileCreate] = None
    lecturer_profile: Optional[LecturerProfileCreate] = None
