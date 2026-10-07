"""
SADITA — Attendance API Endpoints
/api/v1/attendance
"""
from datetime import date
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import CurrentUser, DBSession, RequireLecturer, get_current_user_optional
from app.models.attendance import AttendanceStatus
from app.repositories.attendance_repo import AttendanceRepository
from app.schemas.attendance import (
    AttendanceRecordResponse,
    ManualUpdateRequest,
    SessionCreateRequest,
    SessionOpenRequest,
    SessionResponse,
)
from app.services.attendance_service import AttendanceService
from app.services.authorization_service import audit, require_class_access
from app.models.user import User, UserRole
from app.repositories.user_repo import StudentRepository

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# ============================================================
# SESSION endpoints
# ============================================================

@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Buat sesi pertemuan baru",
    description="Dosen / Admin membuat sesi kuliah ke-N untuk sebuah kelas. Status awal: SCHEDULED.",
)
def create_session(req: SessionCreateRequest, current: RequireLecturer, db: DBSession):
    require_class_access(db, current, req.class_id)
    session = AttendanceService.create_session(
        db,
        class_id=req.class_id,
        session_number=req.session_number,
        date=req.date,
        topic=req.topic,
    )
    return SessionResponse.model_validate(session)


@router.get(
    "/sessions/{session_id}",
    response_model=SessionResponse,
    summary="Detail sesi",
)
def get_session(
    session_id: int,
    db: DBSession,
    current: Annotated[User | None, Depends(get_current_user_optional)] = None,
):
    session = AttendanceRepository.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesi tidak ditemukan")
    if current is not None:
        require_class_access(db, current, session.class_id)
    return SessionResponse.model_validate(session)


@router.get(
    "/sessions",
    response_model=List[SessionResponse],
    summary="Daftar sesi berdasarkan kelas",
)
def list_sessions(
    class_id: int,
    db: DBSession,
    current: Annotated[User | None, Depends(get_current_user_optional)] = None,
):
    if current is not None:
        require_class_access(db, current, class_id)
    sessions = AttendanceRepository.list_sessions_for_class(db, class_id)
    return [SessionResponse.model_validate(s) for s in sessions]


@router.post(
    "/sessions/{session_id}/open",
    response_model=SessionResponse,
    summary="Buka sesi absensi (OPEN)",
    description=(
        "Mengubah status sesi ke OPEN. "
        "Semua mahasiswa yang terdaftar di kelas otomatis mendapat status ALFA. "
        "Mengirim perintah ke perangkat SADITA melalui MQTT."
    ),
)
def open_session(session_id: int, req: SessionOpenRequest, current: RequireLecturer, db: DBSession):
    from app.mqtt.client import mqtt_client
    from app.schemas.attendance import SessionOpenCommand
    from app.repositories.attendance_repo import AttendanceRepository as AR

    existing = AttendanceRepository.get_session_by_id(db, session_id)
    if not existing: raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")
    require_class_access(db, current, existing.class_id)
    session = AttendanceService.open_session(db, session_id)

    # Update topic if provided
    if req.topic:
        raw_session = db.get(
            __import__("app.models.attendance", fromlist=["AttendanceSession"]).AttendanceSession,
            session_id,
        )
        if raw_session:
            raw_session.topic = req.topic
            db.commit()
            db.refresh(raw_session)
            session = AR.get_session_by_id(db, session_id)

    # Publish MQTT command to all devices attached to this class
    from app.repositories.academic_repo import AcademicRepository
    course_class = AcademicRepository.get_class_by_id(db, session.class_id)
    cmd = SessionOpenCommand(
        session_id=session.id,
        class_name=course_class.name if course_class else f"class_{session.class_id}",
    )
    # Note: in a real system we'd look up the device_id(s) from a devices table.
    # For now, publish to a "class-level" broadcast topic.
    class_topic = f"sadita/class/{session.class_id}/command"
    mqtt_client.publish(class_topic, cmd.model_dump(), qos=1)

    return SessionResponse.model_validate(session)


@router.post(
    "/sessions/{session_id}/close",
    response_model=SessionResponse,
    summary="Tutup sesi absensi (CLOSED)",
    description="Menutup sesi absensi. Mahasiswa yang belum hadir tetap tercatat ALFA.",
)
def close_session(session_id: int, current: RequireLecturer, db: DBSession):
    from app.mqtt.client import mqtt_client
    from app.schemas.attendance import SessionCloseCommand

    existing = AttendanceRepository.get_session_by_id(db, session_id)
    if not existing: raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")
    require_class_access(db, current, existing.class_id)
    session = AttendanceService.close_session(db, session_id)

    # Publish close command
    cmd = SessionCloseCommand(session_id=session.id)
    class_topic = f"sadita/class/{session.class_id}/command"
    mqtt_client.publish(class_topic, cmd.model_dump(), qos=1)

    return SessionResponse.model_validate(session)


# ============================================================
# ATTENDANCE RECORD endpoints
# ============================================================

@router.get(
    "/sessions/{session_id}/records",
    response_model=List[AttendanceRecordResponse],
    summary="Rekap kehadiran satu sesi",
    description="Menampilkan daftar kehadiran seluruh mahasiswa pada satu sesi.",
)
def get_session_records(
    session_id: int,
    db: DBSession,
    current: Annotated[User | None, Depends(get_current_user_optional)] = None,
):
    session = AttendanceRepository.get_session_by_id(db, session_id)
    if not session: raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")
    if current is not None:
        require_class_access(db, current, session.class_id)
    records = AttendanceRepository.get_records_for_session(db, session_id)
    return [AttendanceRecordResponse.model_validate(r) for r in records]


@router.get(
    "/sessions/{session_id}/summary",
    summary="Statistik kehadiran satu sesi",
    response_model=dict,
)
def get_session_summary(
    session_id: int,
    db: DBSession,
    current: Annotated[User | None, Depends(get_current_user_optional)] = None,
):
    session = AttendanceRepository.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesi tidak ditemukan")
    if current is not None:
        require_class_access(db, current, session.class_id)
    return AttendanceService.get_session_summary(db, session_id)


@router.put(
    "/sessions/{session_id}/manual",
    response_model=AttendanceRecordResponse,
    summary="Update kehadiran manual oleh Dosen",
    description="Dosen mengubah status kehadiran mahasiswa secara manual (IZIN, SAKIT, HADIR, dsb).",
)
def manual_update(session_id: int, req: ManualUpdateRequest, current: RequireLecturer, db: DBSession):
    session = AttendanceRepository.get_session_by_id(db, session_id)
    if not session: raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")
    require_class_access(db, current, session.class_id)
    previous = AttendanceRepository.get_record(db, session_id, req.student_id)
    before = {"status": previous.status.value if previous else None, "check_in_time": previous.check_in_time.isoformat() if previous and previous.check_in_time else None}
    if not req.notes or not req.notes.strip(): raise HTTPException(status_code=422, detail="Alasan koreksi wajib diisi")
    record = AttendanceService.manual_update(
        db,
        session_id=session_id,
        student_id=req.student_id,
        new_status=req.status,
        notes=req.notes,
    )
    audit(db, current.id, "MANUAL_ATTENDANCE_CORRECTION", "attendance_record", record.id, before=before, after={"status": record.status.value, "reason": req.notes}); db.commit()
    return AttendanceRecordResponse.model_validate(record)


@router.get(
    "/students/{student_id}/history",
    response_model=List[AttendanceRecordResponse],
    summary="Riwayat kehadiran mahasiswa",
    description="Menampilkan seluruh rekap kehadiran seorang mahasiswa, opsional difilter berdasarkan kelas.",
)
def get_student_history(
    student_id: int,
    db: DBSession,
    current: Annotated[User | None, Depends(get_current_user_optional)] = None,
    class_id: Optional[int] = Query(None),
):
    if current is not None and current.role == UserRole.MAHASISWA:
        own = StudentRepository.get_by_user_id(db, current.id)
        if not own or own.id != student_id: raise HTTPException(status_code=403, detail="Tidak dapat melihat riwayat mahasiswa lain")
    if current is not None and class_id:
        require_class_access(db, current, class_id)
    records = AttendanceRepository.get_records_for_student(
        db, student_id=student_id, class_id=class_id
    )
    return [AttendanceRecordResponse.model_validate(r) for r in records]


# ============================================================
# IoT DEVICE DIRECT ENDPOINT (REST fallback jika MQTT gagal)
# ============================================================

@router.post(
    "/iot/record",
    response_model=AttendanceRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Rekam absensi dari perangkat IoT (REST fallback)",
    description=(
        "Endpoint REST yang dipanggil perangkat SADITA ESP32 "
        "apabila MQTT tidak tersedia. Menerima payload RFID UID + fingerprint template ID."
    ),
)
def iot_record_attendance(
    rfid_uid: str,
    fingerprint_template_id: int,
    confidence: int,
    db: DBSession,
    session_id: Optional[int] = Query(None),
):
    record = AttendanceService.record_attendance_by_rfid_and_fingerprint(
        db,
        rfid_uid=rfid_uid,
        fingerprint_template_id=fingerprint_template_id,
        confidence=confidence,
        session_id=session_id,
    )
    return AttendanceRecordResponse.model_validate(record)
    require_class_access(db, current, session.class_id)
    require_class_access(db, current, session.class_id)
