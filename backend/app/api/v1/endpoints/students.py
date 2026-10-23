"""
SADITA — Student & Hardware Management Endpoints
/api/v1/students
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.core.deps import CurrentUser, DBSession, RequireAdmin, RequireLecturer, RequireAcademicStaff
from app.models.academic import ClassEnrollment, ClassType
from app.models.student import StudentProfile
from app.models.user import User, UserRole
from app.models.workflow import ClassLeaderAssignment
from app.repositories.user_repo import StudentRepository
from app.schemas.user import HardwareAssignRequest, StudentProfileResponse, StudentProfileUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/students", tags=["Students"])


@router.get(
    "",
    response_model=List[StudentProfileResponse],
    summary="Daftar profil mahasiswa",
)
def list_students(
    current: RequireAcademicStaff,
    db: DBSession,
    class_id: Optional[int] = Query(None, description="Filter mahasiswa berdasarkan ID kelas"),
    cohort: Optional[int] = Query(None, description="Filter cohort TEKFO (1-8)"),
    class_type: Optional[ClassType] = Query(None, description="Filter jenis kelas reguler"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
) -> List[StudentProfileResponse]:
    if class_id:
        enrollments = db.scalars(
            select(ClassEnrollment)
            .where(ClassEnrollment.class_id == class_id)
            .options(joinedload(ClassEnrollment.student).joinedload(StudentProfile.user))
            .offset(skip)
            .limit(limit)
        ).all()
        students = [e.student for e in enrollments if e.student]
        if cohort is not None:
            students = [s for s in students if s.academic_cohort == cohort]
        if class_type is not None:
            students = [s for s in students if s.class_type == class_type]
    elif current.role == UserRole.KETUA_KELAS:
        student = StudentRepository.get_by_user_id(db, current.id)
        if not student:
            return []
        assignments = db.scalars(
            select(ClassLeaderAssignment.class_id)
            .where(ClassLeaderAssignment.student_id == student.id, ClassLeaderAssignment.is_active.is_(True))
        ).all()
        target_class_ids = set(assignments)
        if not target_class_ids:
            enrolled = db.scalars(
                select(ClassEnrollment.class_id).where(ClassEnrollment.student_id == student.id)
            ).all()
            target_class_ids = set(enrolled)

        if not target_class_ids:
            return []

        student_ids = db.scalars(
            select(ClassEnrollment.student_id)
            .where(ClassEnrollment.class_id.in_(target_class_ids))
        ).all()
        q = (
            select(StudentProfile)
            .where(StudentProfile.id.in_(student_ids))
            .options(joinedload(StudentProfile.user))
            .order_by(StudentProfile.nim)
        )
        if cohort is not None:
            q = q.where(StudentProfile.academic_cohort == cohort)
        if class_type is not None:
            q = q.where(StudentProfile.class_type == class_type)
        students = db.scalars(q.offset(skip).limit(limit)).unique().all()
    else:
        students = StudentRepository.list(db, skip=skip, limit=limit, cohort=cohort, class_type=class_type)

    return [StudentProfileResponse.model_validate(s) for s in students]


@router.get(
    "/me",
    response_model=StudentProfileResponse,
    summary="Profil mahasiswa yang sedang login",
)
def get_my_student_profile(
    current: CurrentUser,
    db: DBSession,
) -> StudentProfileResponse:
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil mahasiswa tidak ditemukan untuk akun ini",
        )
    return StudentProfileResponse.model_validate(student)


@router.get(
    "/latest-scanned-card",
    summary="Ambil kartu RFID terakhir yang di-tap pada reader",
    description="Memudahkan mahasiswa/admin mendaftarkan KTM tanpa perlu mengetik UID manual.",
)
def get_latest_scanned_card(
    _: CurrentUser,
    db: DBSession,
) -> dict:
    from datetime import datetime, timedelta, timezone
    from app.models.attendance import AttendanceEvent, AttendanceEventType
    from app.repositories.user_repo import StudentRepository

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=60)
    event = (
        db.query(AttendanceEvent)
        .filter(
            AttendanceEvent.event_type.in_([AttendanceEventType.RFID_UNKNOWN, AttendanceEventType.RFID_SCAN]),
            AttendanceEvent.received_at >= cutoff,
            AttendanceEvent.rfid_uid.isnot(None),
        )
        .order_by(AttendanceEvent.id.desc())
        .first()
    )

    if not event or not event.rfid_uid:
        return {"found": False, "message": "Belum ada kartu yang di-tap ke reader dalam 60 menit terakhir"}

    existing = StudentRepository.get_by_rfid(db, event.rfid_uid)
    return {
        "found": True,
        "rfid_uid": event.rfid_uid,
        "device_id": event.device_id,
        "scanned_at": event.received_at.isoformat() if event.received_at else None,
        "is_registered": existing is not None,
        "registered_to_nim": existing.nim if existing else None,
        "registered_to_name": existing.user.full_name if existing and existing.user else None,
    }


@router.post(
    "/register-ktm",
    response_model=StudentProfileResponse,
    summary="Mahasiswa mandiri mendaftarkan kartu KTM",
    description="Mahasiswa mengaitkan kartu RFID fisiknya ke akun profil mereka.",
)
def register_my_ktm(
    req: HardwareAssignRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> StudentProfileResponse:
    if not req.rfid_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nomor RFID UID kartu KTM wajib diisi",
        )

    student = current_user.student_profile
    if not student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Akun ini tidak memiliki profil mahasiswa",
        )

    updated = UserService.assign_hardware(
        db,
        student.id,
        rfid_uid=req.rfid_uid,
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


@router.patch(
    "/{student_id}",
    response_model=StudentProfileResponse,
    summary="Perbarui data profil mahasiswa (Admin only)",
)
def update_student_profile(
    student_id: int,
    req: StudentProfileUpdate,
    _: RequireAdmin,
    db: DBSession,
) -> StudentProfileResponse:
    student = StudentRepository.get_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mahasiswa dengan ID {student_id} tidak ditemukan",
        )
    updated = StudentRepository.update_profile(
        db,
        student_id=student_id,
        academic_cohort=req.academic_cohort,
        class_type=req.class_type,
        phone=req.phone,
        batch_year=req.batch_year,
    )
    return StudentProfileResponse.model_validate(updated)

