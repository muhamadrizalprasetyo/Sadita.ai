"""
SADITA — Attendance Service
Core business logic for session lifecycle and attendance recording.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.attendance import (
    AttendanceMethod,
    AttendanceRecord,
    AttendanceSession,
    AttendanceStatus,
    SessionStatus,
)
from app.repositories.academic_repo import AcademicRepository
from app.repositories.attendance_repo import AttendanceRepository
from app.repositories.user_repo import StudentRepository

logger = logging.getLogger(__name__)

LATE_THRESHOLD_MINUTES = 15  # Minutes after session open → TERLAMBAT


class AttendanceService:

    # ------------------------------------------------------------------
    # Session Management
    # ------------------------------------------------------------------

    @staticmethod
    def create_session(
        db: Session,
        class_id: int,
        session_number: int,
        date: date,
        topic: Optional[str] = None,
    ) -> AttendanceSession:
        """Create a new scheduled attendance session for a class."""
        course_class = AcademicRepository.get_class_by_id(db, class_id)
        if not course_class:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kelas ID {class_id} tidak ditemukan",
            )

        if session_number < 1 or session_number > 16:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Nomor sesi harus antara 1 sampai 16",
            )

        existing = AttendanceRepository.get_session_by_class_and_number(
            db, class_id, session_number
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sesi pertemuan ke-{session_number} sudah dibuat untuk kelas ini",
            )

        return AttendanceRepository.create_session(
            db,
            class_id=class_id,
            session_number=session_number,
            date=date,
            topic=topic,
        )

    @staticmethod
    def open_session(
        db: Session, session_id: int, class_id: Optional[int] = None
    ) -> AttendanceSession:
        """Open a session: changes status to OPEN, initializes ALFA records, notifies device."""
        session = AttendanceRepository.get_session_by_id(db, session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sesi ID {session_id} tidak ditemukan",
            )
        if session.status == SessionStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sesi sudah dalam keadaan OPEN",
            )
        if session.status == SessionStatus.CLOSED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sesi sudah CLOSED, tidak dapat dibuka kembali",
            )

        # Check no other session is currently OPEN for this class
        already_open = AttendanceRepository.get_open_session_for_class(
            db, session.class_id
        )
        if already_open and already_open.id != session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sesi pertemuan ke-{already_open.session_number} masih OPEN. Tutup dulu sebelum membuka sesi baru.",
            )

        # Open session
        opened = AttendanceRepository.open_session(db, session_id)

        # Initialize ALFA records for all enrolled students
        enrollments = AcademicRepository.get_enrollments(db, session.class_id)
        student_ids = [e.student_id for e in enrollments]
        count = AttendanceRepository.bulk_initialize_records(
            db, session_id, student_ids
        )
        logger.info(
            "Session %d opened — %d ALFA records initialized for %d students",
            session_id,
            count,
            len(student_ids),
        )

        return opened

    @staticmethod
    def close_session(db: Session, session_id: int) -> AttendanceSession:
        """Close a session: changes status to CLOSED."""
        session = AttendanceRepository.get_session_by_id(db, session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sesi ID {session_id} tidak ditemukan",
            )
        if session.status != SessionStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sesi tidak dalam keadaan OPEN (status saat ini: {session.status})",
            )

        closed = AttendanceRepository.close_session(db, session_id)
        logger.info("Session %d closed at %s", session_id, closed.closed_at)
        return closed

    # ------------------------------------------------------------------
    # Attendance Recording — IoT Pipeline
    # ------------------------------------------------------------------

    @staticmethod
    def record_attendance_by_rfid_and_fingerprint(
        db: Session,
        *,
        rfid_uid: str,
        fingerprint_template_id: int,
        confidence: int,
        event_timestamp: Optional[datetime] = None,
        session_id: Optional[int] = None,
    ) -> AttendanceRecord:
        """
        Core IoT attendance pipeline:
        1. Look up student by RFID UID
        2. Verify fingerprint_template_id matches student record
        3. Determine active session (either provided or auto-detected)
        4. Calculate HADIR vs TERLAMBAT based on session.opened_at + threshold
        5. Upsert attendance record (idempotent)
        """
        # 1. Lookup student by RFID
        student = StudentRepository.get_by_rfid(db, rfid_uid)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kartu RFID '{rfid_uid}' tidak terdaftar di sistem",
            )

        # 2. Verify fingerprint
        matching_fps = [
            fp for fp in student.fingerprint_credentials
            if fp.is_active and fp.template_slot == fingerprint_template_id
        ]
        if not matching_fps and student.fingerprint_template_id != fingerprint_template_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    f"Sidik jari tidak cocok dengan data NIM {student.nim}. "
                    f"Expected slot #{student.fingerprint_template_id}, got #{fingerprint_template_id}"
                ),
            )

        if confidence < 40:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Kepercayaan sidik jari terlalu rendah ({confidence}%). Minimum 40%.",
            )

        # 3. Determine session
        if session_id:
            session = AttendanceRepository.get_session_by_id(db, session_id)
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Sesi ID {session_id} tidak ditemukan",
                )
        else:
            # Auto-detect: find any OPEN session for a class this student is enrolled in
            from sqlalchemy import select
            from app.models.academic import ClassEnrollment, CourseClass, EnrollmentStatus
            from app.models.attendance import AttendanceSession

            sub = db.scalars(
                select(ClassEnrollment.class_id).where(
                    ClassEnrollment.student_id == student.id,
                    ClassEnrollment.status.in_([EnrollmentStatus.AKTIF, "AKTIF", "ACTIVE"]),
                )
            ).all()
            session = db.scalar(
                select(AttendanceSession)
                .where(
                    AttendanceSession.class_id.in_(sub),
                    AttendanceSession.status == SessionStatus.OPEN,
                )
            )
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Tidak ada sesi yang OPEN untuk mahasiswa NIM {student.nim}",
                )

        if session.status != SessionStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sesi pertemuan ke-{session.session_number} sudah ditutup atau belum dibuka",
            )

        # 4. Determine HADIR vs TERLAMBAT
        now = event_timestamp or datetime.now(timezone.utc)
        opened_at = session.opened_at
        if opened_at is not None:
            if opened_at.tzinfo is None and now.tzinfo is not None:
                opened_at = opened_at.replace(tzinfo=timezone.utc)
            elif opened_at.tzinfo is not None and now.tzinfo is None:
                now = now.replace(tzinfo=timezone.utc)
            late_cutoff = opened_at + timedelta(minutes=LATE_THRESHOLD_MINUTES)
            att_status = AttendanceStatus.HADIR if now <= late_cutoff else AttendanceStatus.TERLAMBAT
        else:
            att_status = AttendanceStatus.HADIR

        # 5. Upsert record
        record = AttendanceRepository.upsert_record(
            db,
            session_id=session.id,
            student_id=student.id,
            status=att_status,
            method=AttendanceMethod.RFID_FINGERPRINT,
            check_in_time=now,
        )

        logger.info(
            "Attendance recorded: NIM=%s session=%d status=%s method=RFID_FP",
            student.nim,
            session.id,
            att_status,
        )
        return record

    @staticmethod
    def manual_update(
        db: Session,
        session_id: int,
        student_id: int,
        new_status: AttendanceStatus,
        notes: Optional[str] = None,
    ) -> AttendanceRecord:
        """Dosen memperbarui status kehadiran mahasiswa secara manual."""
        session = AttendanceRepository.get_session_by_id(db, session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sesi ID {session_id} tidak ditemukan",
            )

        student = StudentRepository.get_by_id(db, student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mahasiswa ID {student_id} tidak ditemukan",
            )

        record = AttendanceRepository.upsert_record(
            db,
            session_id=session_id,
            student_id=student_id,
            status=new_status,
            method=AttendanceMethod.MANUAL_DOSEN,
            notes=notes,
        )
        logger.info(
            "Manual attendance update: student_id=%d session=%d status=%s by_lecturer",
            student_id,
            session_id,
            new_status,
        )
        return record

    @staticmethod
    def get_session_summary(
        db: Session, session_id: int
    ) -> dict:
        """Return session statistics: total enrolled, hadir, terlambat, izin, sakit, alfa."""
        records = AttendanceRepository.get_records_for_session(db, session_id)
        summary: dict[str, int] = {
            "total": len(records),
            "hadir": 0,
            "terlambat": 0,
            "izin": 0,
            "sakit": 0,
            "alfa": 0,
        }
        for r in records:
            key = r.status.value.lower()
            if key in summary:
                summary[key] += 1
        return summary
