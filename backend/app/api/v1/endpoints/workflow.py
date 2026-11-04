"""Class-leader and alternative attendance approval workflow APIs."""
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DBSession, RequireAdmin
from app.models.academic import ClassEnrollment, EnrollmentStatus
from app.models.attendance import AttendanceSession, AttendanceStatus, SessionStatus
from app.models.user import UserRole
from app.models.workflow import AttendanceRequest, AttendanceRequestStatus, ClassLeaderAssignment
from app.repositories.user_repo import StudentRepository
from app.schemas.workflow import (
    AttendanceRequestCreate,
    AttendanceRequestResponse,
    LeaderCreate,
    LeaderResponse,
    RejectRequest,
)
from app.services.authorization_service import audit, require_class_access
from app.services.attendance_service import AttendanceService

router = APIRouter(tags=["Class leadership & attendance approval"])


@router.get("/academic/classes/{class_id}/leader", response_model=LeaderResponse | None)
def get_leader(class_id: int, current: CurrentUser, db: DBSession):
    require_class_access(db, current, class_id)
    return db.scalar(
        select(ClassLeaderAssignment).where(
            ClassLeaderAssignment.class_id == class_id,
            ClassLeaderAssignment.is_active.is_(True),
        )
    )


@router.post("/academic/classes/{class_id}/leader", response_model=LeaderResponse, status_code=201)
def assign_leader(class_id: int, body: LeaderCreate, current: RequireAdmin, db: DBSession, request: Request):
    require_class_access(db, current, class_id)
    enrolled = db.scalar(
        select(ClassEnrollment).where(
            ClassEnrollment.class_id == class_id,
            ClassEnrollment.student_id == body.student_id,
            ClassEnrollment.status == EnrollmentStatus.AKTIF,
        )
    )
    if not enrolled:
        raise HTTPException(400, "Mahasiswa harus terdaftar aktif di kelas")
    existing = db.scalar(
        select(ClassLeaderAssignment).where(
            ClassLeaderAssignment.class_id == class_id,
            ClassLeaderAssignment.is_active.is_(True),
        )
    )
    if existing:
        raise HTTPException(409, "Kelas sudah memiliki ketua aktif")
    assignment = ClassLeaderAssignment(class_id=class_id, student_id=body.student_id, assigned_by=current.id)
    db.add(assignment)
    audit(
        db,
        current.id,
        "ASSIGN_CLASS_LEADER",
        "class_leader_assignment",
        None,
        after={"class_id": class_id, "student_id": body.student_id},
        request=request,
    )
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/academic/classes/{class_id}/leader", status_code=204)
def remove_leader(class_id: int, current: RequireAdmin, db: DBSession, request: Request):
    assignment = db.scalar(
        select(ClassLeaderAssignment).where(
            ClassLeaderAssignment.class_id == class_id,
            ClassLeaderAssignment.is_active.is_(True),
        )
    )
    if not assignment:
        raise HTTPException(404, "Ketua kelas aktif tidak ditemukan")
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


@router.post("/attendance/sessions/{session_id}/requests", response_model=AttendanceRequestResponse, status_code=201)
def submit_online_attendance(
    session_id: int,
    current: CurrentUser,
    db: DBSession,
    request: Request,
    body: Optional[AttendanceRequestCreate] = None,
):
    if current.role != UserRole.MAHASISWA:
        raise HTTPException(403, "Hanya mahasiswa dapat mengajukan presensi alternatif")
    session = db.get(AttendanceSession, session_id)
    if not session or session.status != SessionStatus.OPEN:
        raise HTTPException(400, "Sesi tidak sedang dibuka")
    require_class_access(db, current, session.class_id)
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        raise HTTPException(404, "Data mahasiswa tidak ditemukan")

    existing = db.scalar(
        select(AttendanceRequest).where(
            AttendanceRequest.session_id == session_id,
            AttendanceRequest.student_id == student.id,
            AttendanceRequest.status.in_([AttendanceRequestStatus.PENDING, AttendanceRequestStatus.VERIFIED, AttendanceRequestStatus.APPROVED]),
        )
    )
    if existing:
        raise HTTPException(409, "Pengajuan presensi untuk sesi ini sudah ada atau sedang diproses")

    reason_val = body.reason.strip() if body and body.reason else "Presensi alternatif (KTM tidak dibawa/hilang)"
    att_req = AttendanceRequest(session_id=session_id, student_id=student.id, reason=reason_val)
    db.add(att_req)
    audit(
        db,
        current.id,
        "SUBMIT_ATTENDANCE",
        "attendance_request",
        None,
        after={"session_id": session_id, "student_id": student.id, "reason": reason_val},
        reason=reason_val,
        request=request,
    )
    db.commit()
    db.refresh(att_req)
    return att_req


@router.get("/attendance/requests/my-requests", response_model=List[AttendanceRequestResponse])
def get_my_attendance_requests(current: CurrentUser, db: DBSession):
    if current.role != UserRole.MAHASISWA:
        raise HTTPException(403, "Hanya mahasiswa dapat melihat riwayat pengajuan mandiri")
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        return []
    requests = db.scalars(
        select(AttendanceRequest)
        .where(AttendanceRequest.student_id == student.id)
        .order_by(AttendanceRequest.submitted_at.desc())
    ).all()
    return list(requests)


@router.get("/attendance/sessions/{session_id}/requests", response_model=List[AttendanceRequestResponse])
def list_session_requests(session_id: int, current: CurrentUser, db: DBSession):
    session = db.get(AttendanceSession, session_id)
    if not session:
        raise HTTPException(404, "Sesi tidak ditemukan")
    require_class_access(db, current, session.class_id)
    requests = db.scalars(
        select(AttendanceRequest)
        .where(AttendanceRequest.session_id == session_id)
        .order_by(AttendanceRequest.submitted_at.asc())
    ).all()
    return list(requests)


@router.get("/academic/classes/{class_id}/leader/presence-pending", response_model=List[AttendanceRequestResponse])
def pending_presence(class_id: int, current: CurrentUser, db: DBSession):
    require_class_access(db, current, class_id, leader=current.role == UserRole.MAHASISWA)
    return list(
        db.scalars(
            select(AttendanceRequest)
            .join(AttendanceSession)
            .where(
                AttendanceSession.class_id == class_id,
                AttendanceRequest.status == AttendanceRequestStatus.PENDING,
            )
        ).all()
    )


@router.post("/academic/classes/{class_id}/presence/{attendance_id}/verify", response_model=AttendanceRequestResponse)
def verify_presence(class_id: int, attendance_id: int, current: CurrentUser, db: DBSession, request: Request):
    require_class_access(db, current, class_id, leader=True)
    att_req = db.get(AttendanceRequest, attendance_id)
    if not att_req or db.get(AttendanceSession, att_req.session_id).class_id != class_id:
        raise HTTPException(404, "Pengajuan tidak ditemukan")
    if att_req.status != AttendanceRequestStatus.PENDING:
        raise HTTPException(409, "Pengajuan bukan PENDING")
    student = StudentRepository.get_by_user_id(db, current.id)
    if student and att_req.student_id == student.id:
        raise HTTPException(403, "Tidak dapat memverifikasi pengajuan sendiri")
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


@router.post("/attendance/requests/{request_id}/approve", response_model=AttendanceRequestResponse)
def approve_presence(request_id: int, current: CurrentUser, db: DBSession, request: Request):
    att_req = db.get(AttendanceRequest, request_id)
    if not att_req:
        raise HTTPException(404, "Pengajuan tidak ditemukan")
    session = db.get(AttendanceSession, att_req.session_id)
    require_class_access(db, current, session.class_id)
    if current.role == UserRole.MAHASISWA:
        raise HTTPException(403, "Ketua kelas tidak dapat approval final. Wewenang keputusan akhir ada pada Dosen.")
    if att_req.status not in (AttendanceRequestStatus.PENDING, AttendanceRequestStatus.VERIFIED):
        raise HTTPException(409, "Pengajuan tidak dapat disetujui karena status tidak valid")
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


@router.post("/attendance/requests/{request_id}/reject", response_model=AttendanceRequestResponse)
def reject_presence(request_id: int, body: RejectRequest, current: CurrentUser, db: DBSession, request: Request):
    att_req = db.get(AttendanceRequest, request_id)
    if not att_req:
        raise HTTPException(404, "Pengajuan tidak ditemukan")
    session = db.get(AttendanceSession, att_req.session_id)
    require_class_access(db, current, session.class_id)
    if current.role == UserRole.MAHASISWA:
        raise HTTPException(403, "Mahasiswa tidak dapat menolak pengajuan")
    if att_req.status not in (AttendanceRequestStatus.PENDING, AttendanceRequestStatus.VERIFIED):
        raise HTTPException(409, "Pengajuan tidak dapat ditolak karena status tidak valid")
    att_req.status = AttendanceRequestStatus.REJECTED
    att_req.approved_by = current.id
    att_req.approved_at = datetime.now(timezone.utc)
    att_req.rejection_reason = body.reason
    audit(
        db,
        current.id,
        "REJECT_ATTENDANCE",
        "attendance_request",
        att_req.id,
        after={"status": "REJECTED", "rejection_reason": body.reason},
        reason=body.reason,
        request=request,
    )
    db.commit()
    db.refresh(att_req)
    return att_req
