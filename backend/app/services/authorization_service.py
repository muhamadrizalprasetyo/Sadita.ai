"""Class ownership checks shared by academic, attendance, and LMS endpoints."""
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.academic import ClassEnrollment, EnrollmentStatus, CourseClass
from app.models.user import User, UserRole
from app.models.workflow import ClassLeaderAssignment
from app.repositories.user_repo import LecturerRepository, StudentRepository


def require_class_access(db: Session, user: User, class_id: int, *, leader: bool = False) -> CourseClass:
    course_class = db.get(CourseClass, class_id)
    if not course_class:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if user.role == UserRole.ADMIN:
        return course_class
    if user.role == UserRole.KAPRODI:
        lecturer = LecturerRepository.get_by_user_id(db, user.id)
        if lecturer and course_class.course and course_class.course.prodi_id == lecturer.prodi_id:
            return course_class
    if user.role == UserRole.DOSEN:
        lecturer = LecturerRepository.get_by_user_id(db, user.id)
        if lecturer and course_class.lecturer_id == lecturer.id:
            return course_class
    elif user.role in (UserRole.MAHASISWA, UserRole.KETUA_KELAS):
        student = StudentRepository.get_by_user_id(db, user.id)
        if student:
            if leader:
                assignment = db.scalar(select(ClassLeaderAssignment).where(ClassLeaderAssignment.class_id == class_id, ClassLeaderAssignment.student_id == student.id, ClassLeaderAssignment.is_active.is_(True)))
                if assignment:
                    return course_class
            else:
                enrollment = db.scalar(select(ClassEnrollment).where(ClassEnrollment.class_id == class_id, ClassEnrollment.student_id == student.id, ClassEnrollment.status == EnrollmentStatus.AKTIF))
                if enrollment:
                    return course_class
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Anda tidak berhak mengakses kelas ini")


def audit(db: Session, actor_id: int | None, action: str, entity: str, entity_id: int | None, before: dict | None = None, after: dict | None = None) -> None:
    from app.models.workflow import AuditLog
    db.add(AuditLog(actor_id=actor_id, action=action, entity=entity, entity_id=entity_id, before=before, after=after))
