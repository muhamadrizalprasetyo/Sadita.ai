"""
SADITA — Academic Management Endpoints
/api/v1/academic
"""
from datetime import date, datetime, timedelta, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.deps import CurrentUser, DBSession, RequireAdmin, RequireLecturer, get_current_user_optional
from app.models.academic import (
    ClassEnrollment,
    Course,
    CourseClass,
    EnrollmentStatus,
    EnrollmentType,
    KrsRequest,
    KrsRequestStatus,
    KrsRequestType,
)
from app.models.attendance import AttendanceRecord, AttendanceSession, SessionStatus
from app.models.device import DeviceStatus, SaditaDevice
from app.models.lecturer import LecturerProfile
from app.models.student import StudentProfile
from app.models.workflow import AuditLog
from app.repositories.academic_repo import AcademicRepository
from app.repositories.user_repo import LecturerRepository, StudentRepository
from app.models.user import User, UserRole
from app.services.authorization_service import require_class_access
from app.schemas.academic import (
    AcademicTermCreate,
    AcademicTermResponse,
    ActiveSessionInfo,
    AdminDashboardResponse,
    RecentActivityItem,
    ClassEnrollmentCreate,
    ClassEnrollmentResponse,
    ClassRoomCreate,
    ClassRoomResponse,
    CourseClassCreate,
    CourseClassUpdate,
    CourseClassResponse,
    CourseCreate,
    CourseResponse,
    KrsRequestCreate,
    KrsRequestReview,
    KrsRequestResponse,
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
    # Check device liveness (offline if last_seen_at exceeded 5 min or None)
    devices = db.scalars(select(SaditaDevice)).all()
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    devices_offline = 0
    for d in devices:
        if d.status != DeviceStatus.ACTIVE:
            devices_offline += 1
        elif not d.last_seen_at or (d.last_seen_at.tzinfo is None and d.last_seen_at.replace(tzinfo=timezone.utc) < cutoff) or (d.last_seen_at.tzinfo and d.last_seen_at < cutoff):
            d.status = DeviceStatus.OFFLINE
            devices_offline += 1
    db.commit()
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

    # Active session details (if any open session exists)
    active_session_info: Optional[ActiveSessionInfo] = None
    open_sess = db.scalars(
        select(AttendanceSession)
        .where(AttendanceSession.status == SessionStatus.OPEN)
        .order_by(AttendanceSession.id.desc())
    ).first()
    if open_sess:
        cls = db.scalar(select(CourseClass).where(CourseClass.id == open_sess.class_id))
        present_count = (
            db.scalar(
                select(func.count(AttendanceRecord.id)).where(
                    AttendanceRecord.session_id == open_sess.id
                )
            )
            or 0
        )
        active_session_info = ActiveSessionInfo(
            id=open_sess.id,
            class_id=open_sess.class_id,
            class_name=cls.name if cls else f"Kelas #{open_sess.class_id}",
            course_name=cls.course.name if cls and cls.course else "Mata Kuliah",
            lecturer_name=(
                cls.lecturer.user.full_name
                if cls and cls.lecturer and cls.lecturer.user
                else "Dosen Pengampu"
            ),
            room_name=cls.room.name if cls and cls.room else "Ruang Kelas",
            session_number=open_sess.session_number,
            topic=open_sess.topic or "Sesi Perkuliahan Berlangsung",
            opened_at=open_sess.opened_at,
            present_count=present_count,
        )

    # Recent activities (from audit trail or recent attendance taps)
    recent_activities: List[RecentActivityItem] = []
    audits = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(5)).all()
    for a in audits:
        recent_activities.append(
            RecentActivityItem(
                id=a.id,
                action=a.action,
                description=f"{a.action} pada {a.entity} #{a.entity_id or ''}",
                created_at=a.created_at,
            )
        )
    if not recent_activities:
        recent_recs = db.scalars(
            select(AttendanceRecord).order_by(AttendanceRecord.id.desc()).limit(5)
        ).all()
        for r in recent_recs:
            student_name = (
                r.student.user.full_name
                if r.student and r.student.user
                else f"Mahasiswa #{r.student_id}"
            )
            method_str = r.method.value if r.method else "RFID"
            recent_activities.append(
                RecentActivityItem(
                    id=r.id,
                    action=f"PRESENSI_{r.status.value}",
                    description=f"{student_name} ({method_str.upper()}) - {r.status.value}",
                    created_at=r.check_in_time or datetime.now(timezone.utc),
                )
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
        active_session=active_session_info,
        recent_activities=recent_activities,
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
        elif current.role in (UserRole.MAHASISWA, UserRole.KETUA_KELAS):
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


@router.patch("/classes/{class_id}", response_model=CourseClassResponse, summary="Perbarui kelas perkuliahan (ganti dosen, jadwal, dll)")
def update_class(
    class_id: int,
    req: CourseClassUpdate,
    _: RequireAdmin,
    db: DBSession,
) -> CourseClassResponse:
    updated = AcademicRepository.update_class(
        db,
        class_id=class_id,
        **req.model_dump(exclude_unset=True),
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kelas tidak ditemukan")
    return CourseClassResponse.model_validate(updated)


# --- Enrollments ---
@router.post("/classes/{class_id}/enroll", response_model=ClassEnrollmentResponse, summary="Daftarkan mahasiswa ke kelas (KRS)")
def enroll_student(
    class_id: int,
    req: ClassEnrollmentCreate,
    current: RequireLecturer,
    db: DBSession,
) -> ClassEnrollmentResponse:
    student_id = req.student_id
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
            status=e.status.value if hasattr(e.status, "value") else str(e.status),
            enrollment_type=e.enrollment_type.value if hasattr(e.enrollment_type, "value") else str(e.enrollment_type),
            enrolled_at=e.enrolled_at,
            student=e.student,
        )
        for e in enrollments
    ]


# ---------------------------------------------------------------------------
# KRS Management (Tambah SKS & Mengulang Mata Kuliah)
# ---------------------------------------------------------------------------
@router.get(
    "/krs/available-classes",
    response_model=List[CourseClassResponse],
    summary="Daftar kelas yang tersedia untuk diambil melalui KRS Tambah SKS / Mengulang",
)
def list_available_classes_for_krs(
    current: CurrentUser,
    db: DBSession,
    cohort: Optional[int] = Query(None, description="Filter cohort TEKFO (1-8)"),
    search: Optional[str] = Query(None, description="Cari nama atau kode mata kuliah"),
) -> List[CourseClassResponse]:
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya akun mahasiswa yang dapat mengakses katalog KRS",
        )

    # Get active term classes
    active_term = AcademicRepository.get_active_term(db)
    classes = AcademicRepository.list_classes(db, term_id=active_term.id if active_term else None)

    # Exclude classes where student is currently enrolled with AKTIF status
    enrolled_class_ids = set(
        db.scalars(
            select(ClassEnrollment.class_id).where(
                ClassEnrollment.student_id == student.id,
                ClassEnrollment.status == EnrollmentStatus.AKTIF,
            )
        ).all()
    )

    # Exclude classes where student has pending KRS request
    pending_class_ids = set(
        db.scalars(
            select(KrsRequest.class_id).where(
                KrsRequest.student_id == student.id,
                KrsRequest.status == KrsRequestStatus.PENDING_APPROVAL,
            )
        ).all()
    )

    result = []
    for c in classes:
        if c.id in enrolled_class_ids or c.id in pending_class_ids:
            continue
        c_name = c.kode_kelas or c.name or ""
        if cohort is not None:
            if f"TEKFO. {cohort}" not in c_name and f"TEKFO {cohort}" not in c_name:
                continue
        if search:
            q = search.lower().strip()
            course_name = (c.course.name if c.course else "").lower()
            course_code = (c.course.code if c.course else "").lower()
            if q not in course_name and q not in course_code and q not in c_name.lower():
                continue
        result.append(CourseClassResponse.model_validate(c))

    return result


@router.post(
    "/krs/request",
    response_model=KrsRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ajukan permohonan KRS Tambah SKS atau Mengulang Mata Kuliah",
)
def submit_krs_request(
    req: KrsRequestCreate,
    current: CurrentUser,
    db: DBSession,
) -> KrsRequestResponse:
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya mahasiswa yang dapat mengajukan KRS",
        )

    target_class = AcademicRepository.get_class_by_id(db, req.class_id)
    if not target_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kelas tidak ditemukan")

    # Check already enrolled
    existing_enr = db.scalar(
        select(ClassEnrollment).where(
            ClassEnrollment.class_id == req.class_id,
            ClassEnrollment.student_id == student.id,
            ClassEnrollment.status == EnrollmentStatus.AKTIF,
        )
    )
    if existing_enr:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda sudah terdaftar aktif di kelas ini",
        )

    # Check pending request
    pending_req = db.scalar(
        select(KrsRequest).where(
            KrsRequest.class_id == req.class_id,
            KrsRequest.student_id == student.id,
            KrsRequest.status == KrsRequestStatus.PENDING_APPROVAL,
        )
    )
    if pending_req:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permohonan untuk kelas ini sudah diajukan dan sedang menunggu persetujuan dosen",
        )

    # Check schedule conflict with existing active enrollments
    active_enrollments = db.scalars(
        select(ClassEnrollment).where(
            ClassEnrollment.student_id == student.id,
            ClassEnrollment.status == EnrollmentStatus.AKTIF,
        )
    ).all()

    DAY_NAMES = {1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu", 7: "Minggu"}

    t_day = target_class.hari or target_class.day_of_week
    t_start = target_class.jam_mulai or target_class.start_time
    t_end = target_class.jam_selesai or target_class.end_time

    for enr in active_enrollments:
        other_class = enr.course_class
        if not other_class:
            continue
        o_day = other_class.hari or other_class.day_of_week
        o_start = other_class.jam_mulai or other_class.start_time
        o_end = other_class.jam_selesai or other_class.end_time

        if t_day and o_day and t_day == o_day:
            if t_start and t_end and o_start and o_end:
                if o_start < t_end and o_end > t_start:
                    c_name = other_class.course.name if other_class.course else (other_class.kode_kelas or other_class.name)
                    day_str = DAY_NAMES.get(t_day, f"Hari {t_day}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Jadwal bentrok dengan mata kuliah '{c_name}' pada {day_str} jam {o_start.strftime('%H:%M')}-{o_end.strftime('%H:%M')}",
                    )

    # Create KRS request
    krs_obj = KrsRequest(
        student_id=student.id,
        class_id=req.class_id,
        request_type=req.request_type,
        status=KrsRequestStatus.PENDING_APPROVAL,
        alasan=req.alasan,
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(krs_obj)
    db.commit()
    db.refresh(krs_obj)

    return KrsRequestResponse.model_validate(krs_obj)


@router.get(
    "/krs/my-requests",
    response_model=List[KrsRequestResponse],
    summary="Daftar permohonan KRS mahasiswa yang sedang login",
)
def get_my_krs_requests(
    current: CurrentUser,
    db: DBSession,
) -> List[KrsRequestResponse]:
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya mahasiswa yang dapat mengakses riwayat permohonan KRS",
        )

    requests = db.scalars(
        select(KrsRequest)
        .where(KrsRequest.student_id == student.id)
        .order_by(KrsRequest.submitted_at.desc())
    ).all()
    return [KrsRequestResponse.model_validate(r) for r in requests]


@router.delete(
    "/krs/requests/{request_id}",
    response_model=KrsRequestResponse,
    summary="Batalkan permohonan KRS yang masih pending",
)
def cancel_krs_request(
    request_id: int,
    current: CurrentUser,
    db: DBSession,
) -> KrsRequestResponse:
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya mahasiswa yang dapat membatalkan permohonan KRS",
        )

    krs_obj = db.scalar(select(KrsRequest).where(KrsRequest.id == request_id))
    if not krs_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permohonan KRS tidak ditemukan")

    if krs_obj.student_id != student.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Anda tidak memiliki akses ke permohonan ini")

    if krs_obj.status != KrsRequestStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permohonan tidak dapat dibatalkan karena statusnya sudah {krs_obj.status.value}",
        )

    krs_obj.status = KrsRequestStatus.CANCELLED
    db.commit()
    db.refresh(krs_obj)
    return KrsRequestResponse.model_validate(krs_obj)


@router.get(
    "/krs/lecturer-requests",
    response_model=List[KrsRequestResponse],
    summary="Daftar permohonan KRS yang diajukan ke kelas dosen pengampu",
)
def get_lecturer_krs_requests(
    current: RequireLecturer,
    db: DBSession,
    status_filter: Optional[KrsRequestStatus] = Query(None, alias="status", description="Filter status permohonan"),
) -> List[KrsRequestResponse]:
    query = select(KrsRequest).join(CourseClass, KrsRequest.class_id == CourseClass.id)

    if current.role == UserRole.DOSEN:
        lecturer = LecturerRepository.get_by_user_id(db, current.id)
        if not lecturer:
            return []
        query = query.where(CourseClass.lecturer_id == lecturer.id)

    if status_filter:
        query = query.where(KrsRequest.status == status_filter)

    query = query.order_by(KrsRequest.submitted_at.desc())
    requests = db.scalars(query).all()
    return [KrsRequestResponse.model_validate(r) for r in requests]


@router.post(
    "/krs/requests/{request_id}/review",
    response_model=KrsRequestResponse,
    summary="Review (Persetujuan / Penolakan) permohonan KRS oleh Dosen Pengampu",
)
def review_krs_request(
    request_id: int,
    req: KrsRequestReview,
    current: RequireLecturer,
    db: DBSession,
) -> KrsRequestResponse:
    krs_obj = db.scalar(select(KrsRequest).where(KrsRequest.id == request_id))
    if not krs_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permohonan KRS tidak ditemukan")

    if krs_obj.status != KrsRequestStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permohonan ini sudah diproses sebelumnya ({krs_obj.status.value})",
        )

    course_class = AcademicRepository.get_class_by_id(db, krs_obj.class_id)
    if not course_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kelas terkait tidak ditemukan")

    # Check authorization: user must be the lecturer of the class or Admin/Kaprodi
    if current.role == UserRole.DOSEN:
        lecturer = LecturerRepository.get_by_user_id(db, current.id)
        if not lecturer or course_class.lecturer_id != lecturer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda bukan dosen pengampu untuk kelas ini",
            )

    action = req.action.upper().strip()
    if action not in ("APPROVE", "REJECT"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aksi review harus bernilai 'APPROVE' atau 'REJECT'",
        )

    krs_obj.reviewed_at = datetime.now(timezone.utc)
    krs_obj.reviewed_by = current.id
    krs_obj.reviewer_notes = req.notes

    if action == "APPROVE":
        krs_obj.status = KrsRequestStatus.APPROVED

        # Check if enrollment already exists
        enr = db.scalar(
            select(ClassEnrollment).where(
                ClassEnrollment.class_id == krs_obj.class_id,
                ClassEnrollment.student_id == krs_obj.student_id,
            )
        )
        enr_type = (
            EnrollmentType.TAMBAH_SKS
            if krs_obj.request_type == KrsRequestType.TAMBAH_SKS
            else EnrollmentType.MENGULANG
        )
        if enr:
            enr.status = EnrollmentStatus.AKTIF
            enr.enrollment_type = enr_type
        else:
            enr = ClassEnrollment(
                class_id=krs_obj.class_id,
                student_id=krs_obj.student_id,
                status=EnrollmentStatus.AKTIF,
                enrollment_type=enr_type,
            )
            db.add(enr)
            db.flush()

        krs_obj.enrollment_id = enr.id
    else:
        krs_obj.status = KrsRequestStatus.REJECTED

    db.commit()
    db.refresh(krs_obj)
    return KrsRequestResponse.model_validate(krs_obj)

