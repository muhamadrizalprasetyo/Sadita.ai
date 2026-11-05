"""Class-leader and online/alternative attendance approval workflow APIs (Clean Architecture)."""
from typing import List, Optional
from fastapi import APIRouter, Request

from app.core.deps import CurrentUser, DBSession, RequireAdmin
from app.schemas.workflow import (
    AttendanceRequestCreate,
    AttendanceRequestResponse,
    LeaderCreate,
    LeaderResponse,
    RejectRequest,
)
from app.services.workflow_service import WorkflowService

router = APIRouter(tags=["Class leadership & attendance approval"])
workflow_service = WorkflowService()


@router.get("/academic/classes/{class_id}/leader", response_model=LeaderResponse | None)
def get_leader(class_id: int, current: CurrentUser, db: DBSession):
    return workflow_service.get_leader(db, class_id=class_id, current=current)


@router.post("/academic/classes/{class_id}/leader", response_model=LeaderResponse, status_code=201)
def assign_leader(
    class_id: int,
    body: LeaderCreate,
    current: RequireAdmin,
    db: DBSession,
    request: Request,
):
    return workflow_service.assign_leader(
        db, class_id=class_id, student_id=body.student_id, current=current, request=request
    )


@router.delete("/academic/classes/{class_id}/leader", status_code=204)
def remove_leader(
    class_id: int,
    current: RequireAdmin,
    db: DBSession,
    request: Request,
):
    workflow_service.remove_leader(db, class_id=class_id, current=current, request=request)


@router.post("/attendance/sessions/{session_id}/requests", response_model=AttendanceRequestResponse, status_code=201)
def submit_online_attendance(
    session_id: int,
    current: CurrentUser,
    db: DBSession,
    request: Request,
    body: Optional[AttendanceRequestCreate] = None,
):
    reason = body.reason if body else None
    return workflow_service.submit_online_attendance(
        db, session_id=session_id, current=current, reason=reason, request=request
    )


@router.get("/attendance/requests/my-requests", response_model=List[AttendanceRequestResponse])
def get_my_attendance_requests(current: CurrentUser, db: DBSession):
    return workflow_service.get_my_attendance_requests(db, current=current)


@router.get("/attendance/sessions/{session_id}/requests", response_model=List[AttendanceRequestResponse])
def list_session_requests(session_id: int, current: CurrentUser, db: DBSession):
    return workflow_service.list_session_requests(db, session_id=session_id, current=current)


@router.get("/academic/classes/{class_id}/leader/presence-pending", response_model=List[AttendanceRequestResponse])
def pending_presence(class_id: int, current: CurrentUser, db: DBSession):
    return workflow_service.list_pending_presence(db, class_id=class_id, current=current)


@router.post("/academic/classes/{class_id}/presence/{attendance_id}/verify", response_model=AttendanceRequestResponse)
def verify_presence(
    class_id: int,
    attendance_id: int,
    current: CurrentUser,
    db: DBSession,
    request: Request,
):
    return workflow_service.verify_presence(
        db, class_id=class_id, attendance_id=attendance_id, current=current, request=request
    )


@router.post("/attendance/requests/{request_id}/approve", response_model=AttendanceRequestResponse)
def approve_presence(
    request_id: int,
    current: CurrentUser,
    db: DBSession,
    request: Request,
):
    return workflow_service.approve_presence(db, request_id=request_id, current=current, request=request)


@router.post("/attendance/requests/{request_id}/reject", response_model=AttendanceRequestResponse)
def reject_presence(
    request_id: int,
    body: RejectRequest,
    current: CurrentUser,
    db: DBSession,
    request: Request,
):
    return workflow_service.reject_presence(
        db, request_id=request_id, reason=body.reason, current=current, request=request
    )
