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
        db: Session,
        session_id: int,
        class_id: Optional[int] = None,
        delay_reason: Optional[str] = None,
        open_time: Optional[datetime] = None,
    ) -> AttendanceSession:
        """Open a session: changes status to OPEN, calculates delay (PO-04), initializes ALFA records."""
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

        # Calculate scheduled_start_at and delay (PO-04)
        course_class = session.course_class or AcademicRepository.get_class_by_id(db, session.class_id)
        actual_start = open_time or datetime.now(timezone.utc)
        if actual_start.tzinfo is None:
            actual_start = actual_start.replace(tzinfo=timezone.utc)

        if session.scheduled_start_at:
            scheduled_start = session.scheduled_start_at
        elif (
            course_class
            and course_class.jam_mulai
            and (
                getattr(course_class, "day_of_week", None) is None
                or course_class.day_of_week == session.tanggal.isoweekday()
            )
        ):
            scheduled_start = datetime.combine(session.tanggal, course_class.jam_mulai).replace(tzinfo=timezone.utc)
        else:
            scheduled_start = actual_start

        if scheduled_start.tzinfo is None:
            scheduled_start = scheduled_start.replace(tzinfo=timezone.utc)

        delay_minutes = 0
        if actual_start > scheduled_start:
            delay_sec = (actual_start - scheduled_start).total_seconds()
            delay_minutes = max(0, int(delay_sec // 60))

        if delay_minutes > 10:
            if not delay_reason or not delay_reason.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Dosen membuka sesi terlambat {delay_minutes} menit (> 10 menit). Alasan keterlambatan wajib diisi.",
                )

        # Open session with timing
        opened = AttendanceRepository.open_session(
            db,
            session_id,
            opened_at=actual_start,
            scheduled_start_at=scheduled_start,
            delay_minutes=delay_minutes,
            delay_reason=delay_reason.strip() if delay_reason else None,
        )

        # Initialize ALFA records for all enrolled students
        enrollments = AcademicRepository.get_enrollments(db, session.class_id)
        student_ids = [e.student_id for e in enrollments]
        count = AttendanceRepository.bulk_initialize_records(
            db, session_id, student_ids
        )
        logger.info(
            "Session %d opened (delay=%d min) — %d ALFA records initialized for %d students",
            session_id,
            delay_minutes,
            count,
            len(student_ids),
        )

        return opened

    @staticmethod
    def close_session(db: Session, session_id: int) -> AttendanceSession:
        """Close a session: changes status to CLOSED.

        Per BR-ATT-007: any enrolled student without a record at close time
        is automatically assigned ALFA status.
        """
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

        # BR-ATT-007: backfill ALFA for enrolled students without a record
        enrollments = AcademicRepository.get_enrollments(db, session.class_id)
        student_ids = [e.student_id for e in enrollments]
        alfa_count = AttendanceRepository.bulk_initialize_records(
            db, session_id, student_ids
        )
        if alfa_count > 0:
            logger.info(
                "Session %d close — %d late-enrolled students backfilled with ALFA",
                session_id,
                alfa_count,
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
        fingerprint_template_id: Optional[int] = None,
        confidence: int = 100,
        event_timestamp: Optional[datetime] = None,
        session_id: Optional[int] = None,
    ) -> AttendanceRecord:
        """
        Core IoT attendance pipeline:
        1. Look up student by RFID UID
        2. Verify fingerprint_template_id matches student record (if provided / 2FA)
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

        # 2. Verify fingerprint (if 2FA mode)
        if fingerprint_template_id is not None:
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
                    ClassEnrollment.status.in_([EnrollmentStatus.AKTIF, "AKTIF"]),
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

        # 4. Determine HADIR vs TERLAMBAT per PO-04
        now = event_timestamp or datetime.now(timezone.utc)
        opened_at = session.opened_at or session.dibuka_pada
        scheduled_start = session.scheduled_start_at

        if opened_at is not None and opened_at.tzinfo is None:
            opened_at = opened_at.replace(tzinfo=timezone.utc)
        if scheduled_start is not None and scheduled_start.tzinfo is None:
            scheduled_start = scheduled_start.replace(tzinfo=timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        # PO-04: Acuan awal presensi menggunakan waktu yang lebih akhir antara jadwal resmi dan waktu aktual sesi dibuka
        if scheduled_start and opened_at:
            effective_start = max(scheduled_start, opened_at)
        else:
            effective_start = opened_at or scheduled_start or now

        course_class = session.course_class or AcademicRepository.get_class_by_id(db, session.class_id)
        grace_minutes = course_class.batas_terlambat_menit if course_class else LATE_THRESHOLD_MINUTES
        late_cutoff = effective_start + timedelta(minutes=grace_minutes)
        att_status = AttendanceStatus.HADIR if now <= late_cutoff else AttendanceStatus.TERLAMBAT

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

    @staticmethod
    def calculate_student_attendance_summary(
        db: Session, student_id: int, class_id: int
    ) -> dict:
        """
        Calculate attendance percentage and UAS eligibility soft warning (PO-01).
        Ensures soft warning is computed against configurable threshold without hard-blocking.
        """
        from app.core.config import settings

        records = (
            db.query(AttendanceRecord)
            .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
            .filter(
                AttendanceSession.class_id == class_id,
                AttendanceRecord.student_id == student_id,
            )
            .all()
        )
        total_sessions = len(records)
        if total_sessions == 0:
            percentage = 100.0
            hadir_count = 0
            terlambat_count = 0
        else:
            hadir_count = sum(1 for r in records if r.status == AttendanceStatus.HADIR)
            terlambat_count = sum(1 for r in records if r.status == AttendanceStatus.TERLAMBAT)
            percentage = round(((hadir_count + terlambat_count) / total_sessions) * 100, 2)

        threshold = getattr(settings, "MIN_ATTENDANCE_PERCENTAGE_FOR_UAS", 75.0)
        is_warning = percentage < threshold
        warning_msg = (
            f"Peringatan: Kehadiran Anda {percentage}% berada di bawah ambang batas {threshold}%. "
            f"Pertahankan kehadiran untuk memenuhi syarat evaluasi akhir."
            if is_warning else None
        )

        return {
            "total_sessions": total_sessions,
            "hadir_count": hadir_count,
            "terlambat_count": terlambat_count,
            "attendance_percentage": percentage,
            "threshold": threshold,
            "has_uas_warning": is_warning,
            "warning_message": warning_msg,
            "hard_blocked": False,  # PO-01: Soft warning only, no hard block
        }
