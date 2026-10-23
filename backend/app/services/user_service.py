"""
SADITA — User & Hardware Management Service
"""
from __future__ import annotations

from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.student import StudentProfile
from app.models.user import User, UserRole
from app.repositories.user_repo import LecturerRepository, StudentRepository, UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password


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

    @staticmethod
    def create_user(db: Session, req: UserCreate) -> User:
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
            is_active=req.is_active,
        )
        if req.role == UserRole.DOSEN:
            nidn = req.lecturer_profile.nidn if req.lecturer_profile and req.lecturer_profile.nidn else f"00{user.id:06d}"
            dept = req.lecturer_profile.department if req.lecturer_profile and req.lecturer_profile.department else "Teknik Informatika"
            phone = req.lecturer_profile.phone if req.lecturer_profile else None
            LecturerRepository.create(
                db,
                user_id=user.id,
                nidn=nidn,
                department=dept,
                phone=phone,
            )
        elif req.role == UserRole.MAHASISWA:
            nim = req.student_profile.nim if req.student_profile and req.student_profile.nim else f"2024{user.id:04d}"
            dept = req.student_profile.department if req.student_profile and req.student_profile.department else "Teknik Informatika"
            batch = req.student_profile.batch_year if req.student_profile and req.student_profile.batch_year else 2024
            cohort = req.student_profile.academic_cohort if req.student_profile and req.student_profile.academic_cohort else 1
            ctype = req.student_profile.class_type if req.student_profile and req.student_profile.class_type else None
            phone = req.student_profile.phone if req.student_profile else None
            rfid = req.student_profile.rfid_uid if req.student_profile else None
            fp = req.student_profile.fingerprint_template_id if req.student_profile else None
            StudentRepository.create(
                db,
                user_id=user.id,
                nim=nim,
                department=dept,
                batch_year=batch,
                academic_cohort=cohort,
                class_type=ctype,
                phone=phone,
                rfid_uid=rfid,
                fingerprint_template_id=fp,
            )
        user_fresh = UserRepository.get_by_id(db, user.id)
        return user_fresh or user

    @staticmethod
    def update_user(db: Session, user_id: int, req: UserUpdate) -> User:
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User ID {user_id} tidak ditemukan",
            )
        if req.email and req.email.lower() != user.email.lower():
            dup = UserRepository.get_by_email(db, req.email)
            if dup and dup.id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{req.email}' sudah dipakai pengguna lain",
                )
        pwd_hash = hash_password(req.password) if req.password else None
        updated = UserRepository.update(
            db,
            user_id=user_id,
            full_name=req.full_name,
            email=req.email,
            role=req.role,
            is_active=req.is_active,
            password_hash=pwd_hash,
        )
        return updated or user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User ID {user_id} tidak ditemukan",
            )
        return UserRepository.delete(db, user_id)
