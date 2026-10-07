"""
SADITA — User & Hardware Management Service
"""
from __future__ import annotations

from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.student import StudentProfile
from app.models.user import User, UserRole
from app.repositories.user_repo import StudentRepository, UserRepository


class UserService:
    @staticmethod
    def get_current_user(db: Session, user_id: int) -> User:
        user = UserRepository.get_by_id(db, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )
        return user

    @staticmethod
    def list_users(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        role: Optional[UserRole] = None,
    ) -> List[User]:
        return UserRepository.list(db, skip=skip, limit=limit, role=role)

    @staticmethod
    def assign_hardware(
        db: Session,
        student_id: int,
        rfid_uid: Optional[str] = None,
        fingerprint_template_id: Optional[int] = None,
    ) -> StudentProfile:
        student = StudentRepository.get_by_id(db, student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mahasiswa dengan ID {student_id} tidak ditemukan",
            )

        # Check RFID collision if provided
        if rfid_uid:
            existing = StudentRepository.get_by_rfid(db, rfid_uid)
            if existing and existing.id != student_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Kartu RFID '{rfid_uid}' sudah digunakan oleh mahasiswa NIM {existing.nim}",
                )

        # Check Fingerprint template collision
        if fingerprint_template_id is not None:
            existing_fp = StudentRepository.get_by_fingerprint_id(db, fingerprint_template_id)
            if existing_fp and existing_fp.id != student_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Slot sidik jari #{fingerprint_template_id} sudah digunakan oleh NIM {existing_fp.nim}",
                )

        updated = StudentRepository.update_hardware(
            db,
            student_id,
            rfid_uid=rfid_uid,
            fingerprint_template_id=fingerprint_template_id,
        )
        return updated

    @staticmethod
    def get_student_by_rfid(db: Session, rfid_uid: str) -> StudentProfile:
        student = StudentRepository.get_by_rfid(db, rfid_uid)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kartu RFID '{rfid_uid}' tidak terdaftar pada sistem",
            )
        return student
