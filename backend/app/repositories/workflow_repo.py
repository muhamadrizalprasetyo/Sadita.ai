"""
SADITA — Workflow Repository (OOP Clean Architecture)
Data access for class leader assignments and attendance approval requests.
"""
from __future__ import annotations

from typing import Any, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attendance import AttendanceSession
from app.models.workflow import AttendanceRequest, AttendanceRequestStatus, ClassLeaderAssignment
from app.repositories.base import BaseRepository


class WorkflowRepository(BaseRepository[AttendanceRequest, Any, Any]):
    def __init__(self):
        super().__init__(AttendanceRequest)

    # --- Class Leader Operations ---
    def get_active_leader(self, db: Session, class_id: int) -> Optional[ClassLeaderAssignment]:
        """Ambil penugasan ketua kelas aktif."""
        stmt = select(ClassLeaderAssignment).where(
            ClassLeaderAssignment.class_id == class_id,
            ClassLeaderAssignment.is_active.is_(True),
        )
        return db.scalar(stmt)

    def create_leader_assignment(
        self,
        db: Session,
        *,
        class_id: int,
        student_id: int,
        assigned_by: int,
    ) -> ClassLeaderAssignment:
        """Simpan penugasan ketua kelas baru."""
        assignment = ClassLeaderAssignment(
            class_id=class_id,
            student_id=student_id,
            assigned_by=assigned_by,
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    def deactivate_leader_assignment(
        self,
        db: Session,
        class_id: int,
    ) -> Optional[ClassLeaderAssignment]:
        """Nonaktifkan status ketua kelas aktif."""
        assignment = self.get_active_leader(db, class_id)
        if assignment:
            assignment.is_active = False
            db.commit()
        return assignment

    # --- Attendance Request Operations ---
    def get_attendance_request(self, db: Session, request_id: int) -> Optional[AttendanceRequest]:
        """Ambil pengajuan kehadiran berdasarkan primary key."""
        return db.get(AttendanceRequest, request_id)

    def get_active_student_request(
        self,
        db: Session,
        *,
        session_id: int,
        student_id: int,
    ) -> Optional[AttendanceRequest]:
        """Periksa apakah sudah ada pengajuan aktif (PENDING atau VERIFIED)."""
        stmt = select(AttendanceRequest).where(
            AttendanceRequest.session_id == session_id,
            AttendanceRequest.student_id == student_id,
            AttendanceRequest.status.in_([
                AttendanceRequestStatus.PENDING,
                AttendanceRequestStatus.VERIFIED,
            ]),
        )
        return db.scalar(stmt)

    def create_attendance_request(
        self,
        db: Session,
        *,
        session_id: int,
        student_id: int,
        reason: Optional[str] = None,
    ) -> AttendanceRequest:
        """Buat pengajuan kehadiran online baru."""
        reason_val = reason.strip() if reason and reason.strip() else "Presensi alternatif (KTM tidak dibawa/hilang)"
        request = AttendanceRequest(session_id=session_id, student_id=student_id, reason=reason_val)
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def list_by_student(
        self,
        db: Session,
        student_id: int,
    ) -> List[AttendanceRequest]:
        """Ambil seluruh riwayat pengajuan milik mahasiswa tertentu."""
        stmt = (
            select(AttendanceRequest)
            .where(AttendanceRequest.student_id == student_id)
            .order_by(AttendanceRequest.submitted_at.desc())
        )
        return list(db.scalars(stmt).all())

    def list_by_session(
        self,
        db: Session,
        session_id: int,
    ) -> List[AttendanceRequest]:
        """Ambil seluruh pengajuan untuk sesi tertentu."""
        stmt = (
            select(AttendanceRequest)
            .where(AttendanceRequest.session_id == session_id)
            .order_by(AttendanceRequest.submitted_at.asc())
        )
        return list(db.scalars(stmt).all())

    def list_pending_by_class(
        self,
        db: Session,
        class_id: int,
    ) -> List[AttendanceRequest]:
        """Ambil seluruh pengajuan PENDING untuk sesi perkuliahan pada kelas tertentu."""
        stmt = (
            select(AttendanceRequest)
            .join(AttendanceSession)
            .where(
                AttendanceSession.class_id == class_id,
                AttendanceRequest.status == AttendanceRequestStatus.PENDING,
            )
        )
        return list(db.scalars(stmt).all())

