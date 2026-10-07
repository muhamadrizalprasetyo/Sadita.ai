"""Class-leader and online-attendance approval workflow APIs."""
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DBSession, RequireAdmin
from app.models.academic import ClassEnrollment, EnrollmentStatus
from app.models.attendance import AttendanceSession, AttendanceStatus, SessionStatus
from app.models.user import UserRole
from app.models.workflow import AttendanceRequest, AttendanceRequestStatus, ClassLeaderAssignment
from app.repositories.user_repo import StudentRepository
from app.schemas.workflow import AttendanceRequestResponse, LeaderCreate, LeaderResponse, RejectRequest
from app.services.authorization_service import audit, require_class_access
from app.services.attendance_service import AttendanceService

router = APIRouter(tags=["Class leadership & attendance approval"])

@router.get("/academic/classes/{class_id}/leader", response_model=LeaderResponse | None)
def get_leader(class_id: int, current: CurrentUser, db: DBSession):
    require_class_access(db, current, class_id)
    return db.scalar(select(ClassLeaderAssignment).where(ClassLeaderAssignment.class_id == class_id, ClassLeaderAssignment.is_active.is_(True)))

@router.post("/academic/classes/{class_id}/leader", response_model=LeaderResponse, status_code=201)
def assign_leader(class_id: int, body: LeaderCreate, current: RequireAdmin, db: DBSession):
    require_class_access(db, current, class_id)
    enrolled = db.scalar(select(ClassEnrollment).where(ClassEnrollment.class_id == class_id, ClassEnrollment.student_id == body.student_id, ClassEnrollment.status == EnrollmentStatus.AKTIF))
    if not enrolled: raise HTTPException(400, "Mahasiswa harus terdaftar aktif di kelas")
    existing = db.scalar(select(ClassLeaderAssignment).where(ClassLeaderAssignment.class_id == class_id, ClassLeaderAssignment.is_active.is_(True)))
    if existing: raise HTTPException(409, "Kelas sudah memiliki ketua aktif")
    assignment = ClassLeaderAssignment(class_id=class_id, student_id=body.student_id, assigned_by=current.id)
    db.add(assignment); audit(db, current.id, "ASSIGN_CLASS_LEADER", "class_leader_assignment", None, after={"class_id": class_id, "student_id": body.student_id}); db.commit(); db.refresh(assignment)
    return assignment

@router.delete("/academic/classes/{class_id}/leader", status_code=204)
def remove_leader(class_id: int, current: RequireAdmin, db: DBSession):
    assignment = db.scalar(select(ClassLeaderAssignment).where(ClassLeaderAssignment.class_id == class_id, ClassLeaderAssignment.is_active.is_(True)))
    if not assignment: raise HTTPException(404, "Ketua kelas aktif tidak ditemukan")
    assignment.is_active=False; audit(db, current.id, "REMOVE_CLASS_LEADER", "class_leader_assignment", assignment.id, before={"student_id": assignment.student_id}); db.commit()

@router.post("/attendance/sessions/{session_id}/requests", response_model=AttendanceRequestResponse, status_code=201)
def submit_online_attendance(session_id: int, current: CurrentUser, db: DBSession):
    if current.role != UserRole.MAHASISWA: raise HTTPException(403, "Hanya mahasiswa dapat mengajukan kehadiran online")
    session = db.get(AttendanceSession, session_id)
    if not session or session.status != SessionStatus.OPEN: raise HTTPException(400, "Sesi tidak sedang dibuka")
    require_class_access(db, current, session.class_id)
    student = StudentRepository.get_by_user_id(db, current.id)
    existing = db.scalar(select(AttendanceRequest).where(AttendanceRequest.session_id == session_id, AttendanceRequest.student_id == student.id, AttendanceRequest.status.in_([AttendanceRequestStatus.PENDING, AttendanceRequestStatus.VERIFIED])))
    if existing: raise HTTPException(409, "Pengajuan aktif sudah ada")
    request = AttendanceRequest(session_id=session_id, student_id=student.id); db.add(request); audit(db, current.id, "SUBMIT_ATTENDANCE", "attendance_request", None, after={"session_id": session_id}); db.commit(); db.refresh(request); return request

@router.get("/academic/classes/{class_id}/leader/presence-pending", response_model=List[AttendanceRequestResponse])
def pending_presence(class_id: int, current: CurrentUser, db: DBSession):
    require_class_access(db, current, class_id, leader=current.role == UserRole.MAHASISWA)
    return list(db.scalars(select(AttendanceRequest).join(AttendanceSession).where(AttendanceSession.class_id == class_id, AttendanceRequest.status == AttendanceRequestStatus.PENDING)).all())

@router.post("/academic/classes/{class_id}/presence/{attendance_id}/verify", response_model=AttendanceRequestResponse)
def verify_presence(class_id: int, attendance_id: int, current: CurrentUser, db: DBSession):
    require_class_access(db, current, class_id, leader=True)
    request = db.get(AttendanceRequest, attendance_id)
    if not request or db.get(AttendanceSession, request.session_id).class_id != class_id: raise HTTPException(404, "Pengajuan tidak ditemukan")
    if request.status != AttendanceRequestStatus.PENDING: raise HTTPException(409, "Pengajuan bukan PENDING")
    student = StudentRepository.get_by_user_id(db, current.id)
    if student and request.student_id == student.id: raise HTTPException(403, "Tidak dapat memverifikasi pengajuan sendiri")
    request.status=AttendanceRequestStatus.VERIFIED; request.verified_by=current.id; request.verified_at=datetime.now(timezone.utc); audit(db,current.id,"VERIFY_ATTENDANCE","attendance_request",request.id,after={"status":"VERIFIED"});db.commit();db.refresh(request);return request

@router.post("/attendance/requests/{request_id}/approve", response_model=AttendanceRequestResponse)
def approve_presence(request_id: int, current: CurrentUser, db: DBSession):
    request=db.get(AttendanceRequest,request_id)
    if not request: raise HTTPException(404,"Pengajuan tidak ditemukan")
    session=db.get(AttendanceSession,request.session_id); require_class_access(db,current,session.class_id)
    if current.role == UserRole.MAHASISWA: raise HTTPException(403,"Ketua kelas tidak dapat approval final")
    if request.status not in (AttendanceRequestStatus.PENDING, AttendanceRequestStatus.VERIFIED): raise HTTPException(409,"Pengajuan tidak dapat disetujui")
    record=AttendanceService.manual_update(db,session.id,request.student_id,AttendanceStatus.HADIR,"Approved online attendance")
    request.status=AttendanceRequestStatus.APPROVED;request.approved_by=current.id;request.approved_at=datetime.now(timezone.utc);audit(db,current.id,"APPROVE_ATTENDANCE","attendance_request",request.id,after={"status":"APPROVED","record_id":record.id});db.commit();db.refresh(request);return request

@router.post("/attendance/requests/{request_id}/reject", response_model=AttendanceRequestResponse)
def reject_presence(request_id: int, body: RejectRequest, current: CurrentUser, db: DBSession):
    request=db.get(AttendanceRequest,request_id)
    if not request: raise HTTPException(404,"Pengajuan tidak ditemukan")
    session=db.get(AttendanceSession,request.session_id);require_class_access(db,current,session.class_id)
    if current.role == UserRole.MAHASISWA: raise HTTPException(403,"Mahasiswa tidak dapat menolak pengajuan")
    if request.status not in (AttendanceRequestStatus.PENDING,AttendanceRequestStatus.VERIFIED):raise HTTPException(409,"Pengajuan tidak dapat ditolak")
    request.status=AttendanceRequestStatus.REJECTED;request.approved_by=current.id;request.approved_at=datetime.now(timezone.utc);request.rejection_reason=body.reason;audit(db,current.id,"REJECT_ATTENDANCE","attendance_request",request.id,after={"status":"REJECTED"});db.commit();db.refresh(request);return request
