"""
SADITA — Academic Service (OOP Clean Architecture)
Business logic for academic management, high-performance dashboards, classes, and KRS workflows.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, List, Optional, Set
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.academic import (
    ClassEnrollment,
    ClassType,
    Course,
    CourseClass,
    EnrollmentStatus,
    EnrollmentType,
    KrsRequest,
    KrsRequestStatus,
    KrsRequestType,
)
from app.models.attendance import AttendanceRecord, AttendanceSession, SessionStatus
from app.models.lecturer import LecturerProfile
from app.models.student import StudentProfile
from app.models.user import User, UserRole
from app.models.workflow import AuditLog, ClassLeaderAssignment
from app.repositories.academic_repo import AcademicRepository
from app.repositories.audit_repo import AuditRepository
from app.repositories.device_repo import DeviceRepository
from app.repositories.user_repo import LecturerRepository, StudentRepository
from app.schemas.academic import (
    ActiveSessionInfo,
    AdminDashboardResponse,
    RecentActivityItem,
)
from app.services.base import BaseService
from app.services.authorization_service import audit, require_class_access


class AcademicService(BaseService[AcademicRepository]):
    def __init__(
        self,
        repository: AcademicRepository | None = None,
        device_repo: DeviceRepository | None = None,
        audit_repo: AuditRepository | None = None,
    ):
        super().__init__(repository or AcademicRepository())
        self._device_repo = device_repo or DeviceRepository()
        self._audit_repo = audit_repo or AuditRepository()

    def get_admin_dashboard(self, db: Session) -> AdminDashboardResponse:
        """
        Ringkasan operasional admin dengan query agregasi berkecepatan tinggi.
        Mengurangi roundtrip database dan menggunakan eager loading untuk sesi aktif.
        """
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())

        # Agregasi data inti
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

        # Liveness check perangkat menggunakan batch update yang dioptimasi
        self._device_repo.update_liveness(db, cutoff_minutes=5)
        devices_offline = self._device_repo.count_offline(db)

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
                    AttendanceRecord.check_in_time >= today_start
                )
            )
            or 0
        )

        # Active session details dengan single-query eager loading
        active_session_info: Optional[ActiveSessionInfo] = None
        open_sess = db.scalars(
            select(AttendanceSession)
            .where(AttendanceSession.status == SessionStatus.OPEN)
            .order_by(AttendanceSession.id.desc())
        ).first()

        if open_sess:
            cls = db.scalar(
                select(CourseClass)
                .options(
                    joinedload(CourseClass.course),
                    joinedload(CourseClass.lecturer).joinedload(LecturerProfile.user),
                    joinedload(CourseClass.room),
                )
                .where(CourseClass.id == open_sess.class_id)
            )
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

        # Recent activities via AuditRepository
        recent_activities: List[RecentActivityItem] = []
        audits = self._audit_repo.get_recent_activities(db, limit=5)
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
                select(AttendanceRecord)
                .options(joinedload(AttendanceRecord.student).joinedload(StudentProfile.user))
                .order_by(AttendanceRecord.id.desc())
                .limit(5)
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

    def list_classes_for_user(
        self,
        db: Session,
        current: Optional[User],
        term_id: Optional[int] = None,
        lecturer_id: Optional[int] = None,
    ) -> List[CourseClass]:
        """Ambil daftar kelas perkuliahan terfilter berdasarkan hak akses peran pengguna."""
        classes = AcademicRepository.list_classes(db, term_id=term_id, lecturer_id=lecturer_id)
        if current is not None:
            if current.role == UserRole.DOSEN:
                lecturer = LecturerRepository.get_by_user_id(db, current.id)
                classes = [item for item in classes if lecturer and item.lecturer_id == lecturer.id]
            elif current.role in (UserRole.MAHASISWA, UserRole.KETUA_KELAS):
                student = StudentRepository.get_by_user_id(db, current.id)
                if student:
                    enrolled_ids = {
                        item.class_id
                        for item in db.scalars(
                            select(ClassEnrollment).where(
                                ClassEnrollment.student_id == student.id,
                                ClassEnrollment.status == EnrollmentStatus.AKTIF,
                            )
                        ).all()
                    }
                    classes = [item for item in classes if item.id in enrolled_ids]
                else:
                    classes = []
        return classes

    def list_students_with_filters(
        self,
        db: Session,
        current: User,
        class_id: Optional[int] = None,
        cohort: Optional[int] = None,
        class_type: Optional[ClassType] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[StudentProfile]:
        """Ambil daftar mahasiswa dengan isolasi hak akses (Admin, Dosen, Kaprodi, Ketua Kelas)."""
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
            return students

        if current.role in (UserRole.KETUA_KELAS, UserRole.MAHASISWA):
            student = StudentRepository.get_by_user_id(db, current.id)
            if not student:
                return []
            assignments = db.scalars(
                select(ClassLeaderAssignment.class_id).where(
                    ClassLeaderAssignment.student_id == student.id,
                    ClassLeaderAssignment.is_active.is_(True),
                )
            ).all()
            target_class_ids = set(assignments)
            if not target_class_ids:
                enrolled = db.scalars(
                    select(ClassEnrollment.class_id).where(
                        ClassEnrollment.student_id == student.id
                    )
                ).all()
                target_class_ids = set(enrolled)

            if not target_class_ids:
                return []

            student_ids = db.scalars(
                select(ClassEnrollment.student_id).where(
                    ClassEnrollment.class_id.in_(target_class_ids)
                )
            ).all()
            return list(
                db.scalars(
                    select(StudentProfile)
                    .options(joinedload(StudentProfile.user))
                    .where(StudentProfile.id.in_(set(student_ids)))
                    .offset(skip)
                    .limit(limit)
                ).unique().all()
            )

        return StudentRepository.list(
            db, skip=skip, limit=limit, cohort=cohort, class_type=class_type
        )

