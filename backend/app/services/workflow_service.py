"""
SADITA — Workflow Service (OOP Clean Architecture)
Business logic and authorization for class leadership and attendance approval.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.academic import ClassEnrollment, EnrollmentStatus
from app.models.attendance import AttendanceSession, AttendanceStatus, SessionStatus
from app.models.user import User, UserRole
from app.models.workflow import AttendanceRequest, AttendanceRequestStatus, ClassLeaderAssignment
from app.repositories.workflow_repo import WorkflowRepository
from app.repositories.user_repo import StudentRepository
from app.services.base import BaseService
from app.services.authorization_service import audit, require_class_access
from app.services.attendance_service import AttendanceService


class WorkflowService(BaseService[WorkflowRepository]):
    def __init__(self, repository: WorkflowRepository | None = None):
        super().__init__(repository or WorkflowRepository())

    def get_leader(self, db: Session, class_id: int, current: User) -> Optional[ClassLeaderAssignment]:
        """Ambil ketua kelas aktif setelah validasi hak akses."""
        require_class_access(db, current, class_id)
        return self._repo.get_active_leader(db, class_id)

    def assign_leader(
        self,
        db: Session,
        class_id: int,
        student_id: int,
        current: User,
        request: Optional[Request] = None,
    ) -> ClassLeaderAssignment:
        """Tugaskan mahasiswa sebagai ketua kelas baru."""
        require_class_access(db, current, class_id)

        enrolled = db.scalar(
            select(ClassEnrollment).where(
                ClassEnrollment.class_id == class_id,
                ClassEnrollment.student_id == student_id,
                ClassEnrollment.status == EnrollmentStatus.AKTIF,
            )
        )
        if not enrolled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mahasiswa harus terdaftar aktif di kelas",
            )

        existing = self._repo.get_active_leader(db, class_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Kelas sudah memiliki ketua aktif",
            )

        assignment = self._repo.create_leader_assignment(
            db,
            class_id=class_id,
            student_id=student_id,
            assigned_by=current.id,
        )
        audit(
            db,
            current.id,
            "ASSIGN_CLASS_LEADER",
            "class_leader_assignment",
            assignment.id,
            after={"class_id": class_id, "student_id": student_id},
            request=request,
        )
        db.commit()
        return assignment

    def remove_leader(
        self,
        db: Session,
        class_id: int,
        current: User,
        request: Optional[Request] = None,
    ) -> None:
        """Cabut penugasan ketua kelas."""
        assignment = self._repo.get_active_leader(db, class_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ketua kelas aktif tidak ditemukan",
            )

        assignment.is_active = False
        audit(
            db,
            current.id,
            "REMOVE_CLASS_LEADER",
            "class_leader_assignment",
            assignment.id,
            before={"student_id": assignment.student_id},
            request=request,
        )
        db.commit()

    def submit_online_attendance(
        self,
        db: Session,
        session_id: int,
        current: User,
        reason: Optional[str] = None,
        request: Optional[Request] = None,
    ) -> AttendanceRequest:
        """Ajukan presensi online mandiri untuk mahasiswa."""
        if current.role != UserRole.MAHASISWA:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hanya mahasiswa dapat mengajukan presensi alternatif",
            )

        session = db.get(AttendanceSession, session_id)
        if not session or session.status != SessionStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sesi tidak sedang dibuka",
            )

        require_class_access(db, current, session.class_id)
        student = StudentRepository.get_by_user_id(db, current.id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data mahasiswa tidak ditemukan",
            )

        existing = self._repo.get_active_student_request(
            db, session_id=session_id, student_id=student.id
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Pengajuan presensi untuk sesi ini sudah ada atau sedang diproses",
            )

        reason_val = reason.strip() if reason and reason.strip() else "Presensi alternatif (KTM tidak dibawa/hilang)"
        att_req = self._repo.create_attendance_request(
            db, session_id=session_id, student_id=student.id, reason=reason_val
        )
        audit(
            db,
            current.id,
            "SUBMIT_ATTENDANCE",
            "attendance_request",
            att_req.id,
            after={"session_id": session_id, "student_id": student.id, "reason": reason_val},
            reason=reason_val,
            request=request,
        )
        return att_req

    def get_my_attendance_requests(
        self,
        db: Session,
        current: User,
    ) -> List[AttendanceRequest]:
        """Ambil riwayat pengajuan mandiri mahasiswa."""
        if current.role != UserRole.MAHASISWA:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hanya mahasiswa dapat melihat riwayat pengajuan mandiri",
            )
        student = StudentRepository.get_by_user_id(db, current.id)
        if not student:
            return []
        return self._repo.list_by_student(db, student.id)

    def list_session_requests(
        self,
        db: Session,
        session_id: int,
        current: User,
    ) -> List[AttendanceRequest]:
        """Ambil seluruh pengajuan presensi alternatif untuk sesi tertentu."""
        session = db.get(AttendanceSession, session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesi tidak ditemukan",
            )
        require_class_access(db, current, session.class_id)
        return self._repo.list_by_session(db, session_id)

    def list_pending_presence(
        self,
        db: Session,
        class_id: int,
        current: User,
    ) -> List[AttendanceRequest]:
        """Daftar antrean verifikasi presensi untuk ketua kelas / dosen."""
        require_class_access(
            db,
            current,
            class_id,
            leader=(current.role == UserRole.MAHASISWA),
        )
        return self._repo.list_pending_by_class(db, class_id)

    def verify_presence(
        self,
        db: Session,
        class_id: int,
        attendance_id: int,
        current: User,
        request: Optional[Request] = None,
    ) -> AttendanceRequest:
        """Verifikasi keterlaksanaan sesi oleh Ketua Kelas."""
        require_class_access(db, current, class_id, leader=True)
        att_req = self._repo.get_attendance_request(db, attendance_id)
        if not att_req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pengajuan tidak ditemukan",
            )

        session = db.get(AttendanceSession, att_req.session_id)
        if not session or session.class_id != class_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pengajuan tidak ditemukan pada kelas ini",
            )

        if att_req.status != AttendanceRequestStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Pengajuan bukan PENDING",
            )

        student = StudentRepository.get_by_user_id(db, current.id)
        if student and att_req.student_id == student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tidak dapat memverifikasi pengajuan sendiri",
            )

        att_req.status = AttendanceRequestStatus.VERIFIED
        att_req.verified_by = current.id
        att_req.verified_at = datetime.now(timezone.utc)
        audit(
            db,
            current.id,
            "VERIFY_ATTENDANCE",
            "attendance_request",
            att_req.id,
            after={"status": "VERIFIED"},
            request=request,
        )
        db.commit()
        db.refresh(att_req)
        return att_req

    def approve_presence(
        self,
        db: Session,
        request_id: int,
        current: User,
        request: Optional[Request] = None,
    ) -> AttendanceRequest:
        """Persetujuan final presensi pengganti/online oleh Dosen / Admin."""
        att_req = self._repo.get_attendance_request(db, request_id)
        if not att_req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pengajuan tidak ditemukan",
            )

        session = db.get(AttendanceSession, att_req.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesi absensi tidak ditemukan",
            )

        require_class_access(db, current, session.class_id)
        if current.role == UserRole.MAHASISWA:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ketua kelas tidak dapat approval final. Wewenang keputusan akhir ada pada Dosen.",
            )

        if att_req.status not in (AttendanceRequestStatus.PENDING, AttendanceRequestStatus.VERIFIED):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Pengajuan tidak dapat disetujui karena status tidak valid",
            )

        record = AttendanceService.manual_update(
            db,
            session.id,
            att_req.student_id,
            AttendanceStatus.HADIR,
            f"Approved alternative attendance: {att_req.reason or 'Disetujui Dosen'}",
        )
        att_req.status = AttendanceRequestStatus.APPROVED
        att_req.approved_by = current.id
        att_req.approved_at = datetime.now(timezone.utc)
        audit(
            db,
            current.id,
            "APPROVE_ATTENDANCE",
            "attendance_request",
            att_req.id,
            after={"status": "APPROVED", "record_id": record.id},
            reason=att_req.reason,
            request=request,
        )
        db.commit()
        db.refresh(att_req)
        return att_req

    def reject_presence(
        self,
        db: Session,
        request_id: int,
        reason: str,
        current: User,
        request: Optional[Request] = None,
    ) -> AttendanceRequest:
        """Penolakan presensi online pengganti."""
        att_req = self._repo.get_attendance_request(db, request_id)
        if not att_req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pengajuan tidak ditemukan",
            )

        session = db.get(AttendanceSession, att_req.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesi absensi tidak ditemukan",
            )

        require_class_access(db, current, session.class_id)
        if current.role == UserRole.MAHASISWA:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Mahasiswa tidak dapat menolak pengajuan",
            )

        if att_req.status not in (AttendanceRequestStatus.PENDING, AttendanceRequestStatus.VERIFIED):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Pengajuan tidak dapat ditolak karena status tidak valid",
            )

        att_req.status = AttendanceRequestStatus.REJECTED
        att_req.approved_by = current.id
        att_req.approved_at = datetime.now(timezone.utc)
        att_req.rejection_reason = reason
        audit(
            db,
            current.id,
            "REJECT_ATTENDANCE",
            "attendance_request",
            att_req.id,
            after={"status": "REJECTED", "rejection_reason": reason},
            reason=reason,
            request=request,
        )
        db.commit()
        db.refresh(att_req)
        return att_req

