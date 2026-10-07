"""
SADITA — Attendance Repository
Data access for AttendanceSession and AttendanceRecord.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.attendance import (
    AttendanceMethod,
    AttendanceRecord,
    AttendanceSession,
    AttendanceStatus,
    SessionStatus,
)


class AttendanceRepository:
    # ------------------------------------------------------------------
    # AttendanceSession
    # ------------------------------------------------------------------

    @staticmethod
    def get_session_by_id(db: Session, session_id: int) -> Optional[AttendanceSession]:
        return db.scalar(
            select(AttendanceSession)
            .options(joinedload(AttendanceSession.records))
            .where(AttendanceSession.id == session_id)
        )

    @staticmethod
    def get_session_by_class_and_number(
        db: Session, class_id: int, session_number: int
    ) -> Optional[AttendanceSession]:
        return db.scalar(
            select(AttendanceSession)
            .where(
                AttendanceSession.class_id == class_id,
                AttendanceSession.pertemuan_ke == session_number,
            )
        )

    @staticmethod
    def get_open_session_for_class(
        db: Session, class_id: int
    ) -> Optional[AttendanceSession]:
        """Return the currently OPEN session for a class, if any."""
        return db.scalar(
            select(AttendanceSession)
            .where(
                AttendanceSession.class_id == class_id,
                AttendanceSession.status == SessionStatus.OPEN,
            )
        )

    @staticmethod
    def list_sessions_for_class(
        db: Session, class_id: int
    ) -> List[AttendanceSession]:
        return list(
            db.scalars(
                select(AttendanceSession)
                .where(AttendanceSession.class_id == class_id)
                .order_by(AttendanceSession.pertemuan_ke)
            ).all()
        )

    @staticmethod
    def create_session(
        db: Session,
        *,
        class_id: int,
        session_number: int,
        date: date,
        topic: Optional[str] = None,
    ) -> AttendanceSession:
        session = AttendanceSession(
            class_id=class_id,
            pertemuan_ke=session_number,
            tanggal=date,
            topik=topic,
            status=SessionStatus.SCHEDULED,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def open_session(db: Session, session_id: int) -> Optional[AttendanceSession]:
        session = db.get(AttendanceSession, session_id)
        if not session:
            return None
        session.status = SessionStatus.OPEN
        session.dibuka_pada = datetime.now(timezone.utc)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def close_session(db: Session, session_id: int) -> Optional[AttendanceSession]:
        session = db.get(AttendanceSession, session_id)
        if not session:
            return None
        session.status = SessionStatus.CLOSED
        session.ditutup_pada = datetime.now(timezone.utc)
        db.commit()
        db.refresh(session)
        return session

    # ------------------------------------------------------------------
    # AttendanceRecord
    # ------------------------------------------------------------------

    @staticmethod
    def get_record(
        db: Session, session_id: int, student_id: int
    ) -> Optional[AttendanceRecord]:
        return db.scalar(
            select(AttendanceRecord)
            .where(
                AttendanceRecord.session_id == session_id,
                AttendanceRecord.student_id == student_id,
            )
        )

    @staticmethod
    def get_records_for_session(
        db: Session, session_id: int
    ) -> List[AttendanceRecord]:
        return list(
            db.scalars(
                select(AttendanceRecord)
                .options(joinedload(AttendanceRecord.student))
                .where(AttendanceRecord.session_id == session_id)
                .order_by(AttendanceRecord.check_in_time)
            ).unique().all()
        )

    @staticmethod
    def get_records_for_student(
        db: Session, student_id: int, class_id: Optional[int] = None
    ) -> List[AttendanceRecord]:
        stmt = (
            select(AttendanceRecord)
            .options(joinedload(AttendanceRecord.session))
            .where(AttendanceRecord.student_id == student_id)
            .order_by(AttendanceRecord.id.desc())
        )
        if class_id:
            stmt = stmt.join(AttendanceSession).where(
                AttendanceSession.class_id == class_id
            )
        return list(db.scalars(stmt).unique().all())

    @staticmethod
    def upsert_record(
        db: Session,
        *,
        session_id: int,
        student_id: int,
        status: AttendanceStatus,
        method: Optional[AttendanceMethod] = None,
        check_in_time: Optional[datetime] = None,
        notes: Optional[str] = None,
    ) -> AttendanceRecord:
        """Create or update a student attendance record for a session (idempotent)."""
        record = db.scalar(
            select(AttendanceRecord).where(
                AttendanceRecord.session_id == session_id,
                AttendanceRecord.student_id == student_id,
            )
        )
        if record:
            record.status = status
            if method is not None:
                record.method = method
            if check_in_time is not None:
                record.check_in_time = check_in_time
            if notes is not None:
                record.notes = notes
        else:
            record = AttendanceRecord(
                session_id=session_id,
                student_id=student_id,
                status=status,
                method=method,
                check_in_time=check_in_time or datetime.now(timezone.utc),
                notes=notes,
            )
            db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def bulk_initialize_records(
        db: Session, session_id: int, student_ids: List[int]
    ) -> int:
        """Initialize ALFA records for all enrolled students (when session is opened)."""
        existing = {
            r.student_id
            for r in db.scalars(
                select(AttendanceRecord).where(
                    AttendanceRecord.session_id == session_id
                )
            ).all()
        }
        new_records = []
        for sid in student_ids:
            if sid not in existing:
                new_records.append(
                    AttendanceRecord(
                        session_id=session_id,
                        student_id=sid,
                        status=AttendanceStatus.ALFA,
                    )
                )
        if new_records:
            db.add_all(new_records)
            db.commit()
        return len(new_records)
