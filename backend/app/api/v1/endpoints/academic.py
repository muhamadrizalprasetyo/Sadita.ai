"""
SADITA — Academic Management Endpoints
/api/v1/academic
"""
from datetime import date, datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.deps import CurrentUser, DBSession, RequireAdmin, RequireLecturer, get_current_user_optional
from app.models.academic import ClassEnrollment, Course, CourseClass, EnrollmentStatus
from app.models.attendance import AttendanceRecord, AttendanceSession, SessionStatus
from app.models.device import DeviceStatus, SaditaDevice
from app.models.lecturer import LecturerProfile
from app.models.student import StudentProfile
from app.repositories.academic_repo import AcademicRepository
from app.repositories.user_repo import StudentRepository
from app.repositories.user_repo import LecturerRepository
from app.models.user import User, UserRole
from app.services.authorization_service import require_class_access
from app.schemas.academic import (
    AcademicTermCreate,
    AcademicTermResponse,
    AdminDashboardResponse,
    ClassEnrollmentCreate,
    ClassEnrollmentResponse,
    ClassRoomCreate,
    ClassRoomResponse,
    CourseClassCreate,
    CourseClassResponse,
    CourseCreate,
    CourseResponse,
)

router = APIRouter(prefix="/academic", tags=["Academic"])


@router.get("/dashboard", response_model=AdminDashboardResponse, summary="Ringkasan operasional admin")
def admin_dashboard(_: RequireAdmin, db: DBSession) -> AdminDashboardResponse:
    today = date.today()

    total_students = db.scalar(select(func.count(StudentProfile.id))) or 0
    total_lecturers = db.scalar(select(func.count(LecturerProfile.id))) or 0
    total_classes = db.scalar(select(func.count(CourseClass.id))) or 0
    total_courses = db.scalar(select(func.count(Course.id))) or 0
    open_sessions = (
        db.scalar(
            select(func.count(AttendanceSession.id)).where(
                AttendanceSession.status == SessionStatus.OPEN
            )
        )
        or 0
    )
    devices_offline = (
        db.scalar(
            select(func.count(SaditaDevice.id)).where(
                SaditaDevice.status == DeviceStatus.OFFLINE
            )
        )
        or 0
    )
    pending_approvals = (
        db.scalar(
            select(func.count(ClassEnrollment.id)).where(
                ClassEnrollment.status != EnrollmentStatus.AKTIF
            )
        )
        or 0
    )
    today_attendance = (
        db.scalar(
            select(func.count(AttendanceRecord.id)).where(
                AttendanceRecord.check_in_time >= datetime.combine(today, datetime.min.time())
            )
        )
        or 0
    )

    return AdminDashboardResponse(
        total_students=total_students,
        total_lecturers=total_lecturers,
        total_classes=total_classes,
        total_courses=total_courses,
        open_sessions=open_sessions,
        devices_offline=devices_offline,
        pending_approvals=pending_approvals,
        today_attendance=today_attendance,
        generated_at=datetime.now(timezone.utc),
    )


# --- Terms ---
@router.get("/terms", response_model=List[AcademicTermResponse], summary="Daftar semester / tahun akademik")
def list_terms(db: DBSession) -> List[AcademicTermResponse]:
    return [AcademicTermResponse.model_validate(t) for t in AcademicRepository.list_terms(db)]


@router.post("/terms", response_model=AcademicTermResponse, status_code=status.HTTP_201_CREATED, summary="Tambah semester")
def create_term(req: AcademicTermCreate, _: RequireAdmin, db: DBSession) -> AcademicTermResponse:
    term = AcademicRepository.create_term(
        db, name=req.name, start_date=req.start_date, end_date=req.end_date, is_active=req.is_active
    )
    return AcademicTermResponse.model_validate(term)


# --- Courses ---
@router.get("/courses", response_model=List[CourseResponse], summary="Daftar mata kuliah")
def list_courses(db: DBSession) -> List[CourseResponse]:
    return [CourseResponse.model_validate(c) for c in AcademicRepository.list_courses(db)]


@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED, summary="Tambah mata kuliah")
def create_course(req: CourseCreate, _: RequireAdmin, db: DBSession) -> CourseResponse:
    if AcademicRepository.get_course_by_code(db, req.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mata kuliah dengan kode '{req.code}' sudah terdaftar",
        )
    course = AcademicRepository.create_course(
        db, code=req.code, name=req.name, credits=req.credits, description=req.description
    )
    return CourseResponse.model_validate(course)


# --- Rooms ---
@router.get("/rooms", response_model=List[ClassRoomResponse], summary="Daftar ruangan kelas / lab")
def list_rooms(db: DBSession) -> List[ClassRoomResponse]:
    return [ClassRoomResponse.model_validate(r) for r in AcademicRepository.list_rooms(db)]


@router.post("/rooms", response_model=ClassRoomResponse, status_code=status.HTTP_201_CREATED, summary="Tambah ruangan")
def create_room(req: ClassRoomCreate, _: RequireAdmin, db: DBSession) -> ClassRoomResponse:
    room = AcademicRepository.create_room(db, name=req.name, capacity=req.capacity)
    return ClassRoomResponse.model_validate(room)


# --- Classes ---
@router.get("/classes", response_model=List[CourseClassResponse], summary="Daftar kelas perkuliahan")
def list_classes(
    db: DBSession,
    current: Annotated[User | None, Depends(get_current_user_optional)] = None,
    term_id: Optional[int] = None,
    lecturer_id: Optional[int] = None,
) -> List[CourseClassResponse]:
    classes = AcademicRepository.list_classes(db, term_id=term_id, lecturer_id=lecturer_id)
    if current is not None:
        if current.role == UserRole.DOSEN:
            lecturer = LecturerRepository.get_by_user_id(db, current.id)
            classes = [item for item in classes if lecturer and item.lecturer_id == lecturer.id]
        elif current.role == UserRole.MAHASISWA:
            student = StudentRepository.get_by_user_id(db, current.id)
            enrolled_ids = {item.class_id for item in db.scalars(select(ClassEnrollment).where(ClassEnrollment.student_id == student.id, ClassEnrollment.status == EnrollmentStatus.AKTIF)).all()} if student else set()
            classes = [item for item in classes if item.id in enrolled_ids]
    return [CourseClassResponse.model_validate(c) for c in classes]


@router.get("/classes/{class_id}", response_model=CourseClassResponse, summary="Detail kelas perkuliahan")
def get_class_by_id(
    class_id: int,
    db: DBSession,
    current: Annotated[User | None, Depends(get_current_user_optional)] = None,
) -> CourseClassResponse:
    course_class = AcademicRepository.get_class_by_id(db, class_id)
    if not course_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kelas tidak ditemukan")
    if current is not None:
        require_class_access(db, current, class_id)
    return CourseClassResponse.model_validate(course_class)


@router.post("/classes", response_model=CourseClassResponse, status_code=status.HTTP_201_CREATED, summary="Buka kelas baru")
def create_class(req: CourseClassCreate, _: RequireAdmin, db: DBSession) -> CourseClassResponse:
    course_class = AcademicRepository.create_class(
        db,
        name=req.name,
        course_id=req.course_id,
        term_id=req.term_id,
        lecturer_id=req.lecturer_id,
        room_id=req.room_id,
        day_of_week=req.day_of_week,
        start_time=req.start_time,
        end_time=req.end_time,
        is_active=req.is_active,
    )
    # Reload with relationships
    return CourseClassResponse.model_validate(AcademicRepository.get_class_by_id(db, course_class.id))


# --- Enrollments ---
@router.post("/classes/{class_id}/enroll", response_model=ClassEnrollmentResponse, summary="Daftarkan mahasiswa ke kelas (KRS)")
def enroll_student(
    class_id: int,
    student_id: int,
    current: RequireLecturer,
    db: DBSession,
) -> ClassEnrollmentResponse:
    require_class_access(db, current, class_id)
    # Check student
    student = StudentRepository.get_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mahasiswa tidak ditemukan")
    
    # Check class
    c = AcademicRepository.get_class_by_id(db, class_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kelas tidak ditemukan")

    try:
        enrollment = AcademicRepository.enroll_student(db, class_id=class_id, student_id=student_id)
        return ClassEnrollmentResponse(
            id=enrollment.id,
            class_id=enrollment.class_id,
            student_id=enrollment.student_id,
            status=enrollment.status,
            enrolled_at=enrollment.enrolled_at,
            student=student,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mahasiswa sudah terdaftar di kelas ini")


@router.get("/classes/{class_id}/students", response_model=List[ClassEnrollmentResponse], summary="Daftar peserta kelas")
def get_class_students(
    class_id: int,
    db: DBSession,
    current: Annotated[User | None, Depends(get_current_user_optional)] = None,
) -> List[ClassEnrollmentResponse]:
    if current is not None:
        require_class_access(db, current, class_id)
    enrollments = AcademicRepository.get_enrollments(db, class_id)
    return [
        ClassEnrollmentResponse(
            id=e.id,
            class_id=e.class_id,
            student_id=e.student_id,
            status=e.status,
            enrolled_at=e.enrolled_at,
            student=e.student,
        )
        for e in enrollments
    ]
