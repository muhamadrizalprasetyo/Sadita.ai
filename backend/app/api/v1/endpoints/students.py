"""
SADITA — Student & Hardware Management Endpoints
/api/v1/students
"""
from typing import List
from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentUser, DBSession, RequireAdmin, RequireLecturer
from app.repositories.user_repo import StudentRepository
from app.schemas.user import HardwareAssignRequest, StudentProfileResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/students", tags=["Students"])


@router.get(
    "",
    response_model=List[StudentProfileResponse],
    summary="Daftar profil mahasiswa",
)
def list_students(
    _: RequireLecturer,
    db: DBSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
) -> List[StudentProfileResponse]:
    students = StudentRepository.list(db, skip=skip, limit=limit)
    return [StudentProfileResponse.model_validate(s) for s in students]


@router.get(
    "/{student_id}",
    response_model=StudentProfileResponse,
    summary="Detail mahasiswa",
)
def get_student_by_id(
    student_id: int,
    _: CurrentUser,
    db: DBSession,
) -> StudentProfileResponse:
    student = StudentRepository.get_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mahasiswa dengan ID {student_id} tidak ditemukan",
        )
    return StudentProfileResponse.model_validate(student)


@router.put(
    "/{student_id}/hardware",
    response_model=StudentProfileResponse,
    summary="Daftarkan kartu RFID & Sidik Jari ke Mahasiswa",
    description="Mengaitkan RFID UID (dari KTM) dan Slot ID sensor sidik jari ke data mahasiswa.",
)
def assign_hardware(
    student_id: int,
    req: HardwareAssignRequest,
    _: RequireLecturer,
    db: DBSession,
) -> StudentProfileResponse:
    updated = UserService.assign_hardware(
        db,
        student_id,
        rfid_uid=req.rfid_uid,
        fingerprint_template_id=req.fingerprint_template_id,
    )
    return StudentProfileResponse.model_validate(updated)


@router.get(
    "/by-rfid/{rfid_uid}",
    response_model=StudentProfileResponse,
    summary="Lookup mahasiswa berdasarkan RFID UID",
    description="Digunakan oleh backend/worker IoT ketika kartu RFID ditap pada perangkat SADITA.",
)
def lookup_by_rfid(
    rfid_uid: str,
    db: DBSession,
) -> StudentProfileResponse:
    student = UserService.get_student_by_rfid(db, rfid_uid)
    return StudentProfileResponse.model_validate(student)
