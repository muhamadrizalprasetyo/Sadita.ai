"""
SADITA — Authentication Service
Handles login, token issuance, token refreshing, and registration logic.
"""
from __future__ import annotations

from typing import Optional
from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.repositories.user_repo import LecturerRepository, StudentRepository, UserRepository
from app.schemas.auth import RegisterRequest, TokenResponse
from app.schemas.user import UserResponse


class AuthService:
    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> User:
        ident = email.strip()
        user = UserRepository.get_by_email(db, ident.lower())
        if not user:
            student = StudentRepository.get_by_nim(db, ident)
            if student and student.user:
                user = student.user
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email/NPM atau kata sandi tidak valid",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akun pengguna dinonaktifkan",
            )
        return user

    @staticmethod
    def create_token_response(user: User) -> TokenResponse:
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    def refresh(db: Session, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token type",
                )
            user_id = int(payload["sub"])
        except (JWTError, KeyError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token refresh tidak valid atau kedaluwarsa",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = UserRepository.get_by_id(db, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Pengguna tidak ditemukan atau tidak aktif",
            )
        return AuthService.create_token_response(user)

    @staticmethod
    def register(db: Session, req: RegisterRequest) -> User:
        existing = UserRepository.get_by_email(db, req.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{req.email}' sudah terdaftar",
            )

        pwd_hash = hash_password(req.password)
        user = UserRepository.create(
            db,
            email=req.email,
            password_hash=pwd_hash,
            full_name=req.full_name,
            role=req.role,
        )

        # Create profile based on role
        if req.role == UserRole.MAHASISWA and req.student_profile:
            # Check NIM uniqueness
            if StudentRepository.get_by_nim(db, req.student_profile.nim):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"NIM '{req.student_profile.nim}' sudah terdaftar",
                )
            StudentRepository.create(
                db,
                user_id=user.id,
                nim=req.student_profile.nim,
                department=req.student_profile.department,
                batch_year=req.student_profile.batch_year,
                phone=req.student_profile.phone,
                rfid_uid=req.student_profile.rfid_uid,
                fingerprint_template_id=req.student_profile.fingerprint_template_id,
            )
        elif req.role == UserRole.DOSEN and req.lecturer_profile:
            # Check NIDN uniqueness
            if LecturerRepository.get_by_nidn(db, req.lecturer_profile.nidn):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"NIDN '{req.lecturer_profile.nidn}' sudah terdaftar",
                )
            LecturerRepository.create(
                db,
                user_id=user.id,
                nidn=req.lecturer_profile.nidn,
                department=req.lecturer_profile.department,
                phone=req.lecturer_profile.phone,
            )

        # Reload with relationships
        return UserRepository.get_by_id(db, user.id)
