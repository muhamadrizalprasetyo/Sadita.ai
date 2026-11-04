"""Class ownership and resource scope checks shared by academic, attendance, and LMS endpoints."""
from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.academic import ClassEnrollment, EnrollmentStatus, CourseClass
from app.models.user import User, UserRole
from app.models.workflow import ClassLeaderAssignment
from app.repositories.user_repo import LecturerRepository, StudentRepository


def require_class_access(
    db: Session,
    user: User,
    class_id: int,
    *,
    leader: bool = False,
) -> CourseClass:
    """Verify *user* may access *class_id*.

    Returns the CourseClass on success.
    Raises 404 on failure — per BR-ROLE-008, unauthorized access must not
    reveal whether the resource exists.
    """
    course_class = db.get(CourseClass, class_id)
    if not course_class:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")

    # ADMIN — full access
    if user.role == UserRole.ADMIN:
        return course_class

    # KAPRODI — only their own prodi
    if user.role == UserRole.KAPRODI:
        lecturer = LecturerRepository.get_by_user_id(db, user.id)
        if lecturer and course_class.course and course_class.course.prodi_id == lecturer.prodi_id:
            return course_class

    # DOSEN — only classes they teach
    if user.role == UserRole.DOSEN:
        lecturer = LecturerRepository.get_by_user_id(db, user.id)
        if lecturer and course_class.lecturer_id == lecturer.id:
            return course_class

    # MAHASISWA — must be enrolled or assigned as leader
    if user.role == UserRole.MAHASISWA:
        student = StudentRepository.get_by_user_id(db, user.id)
        if student:
            if leader:
                assignment = db.scalar(
                    select(ClassLeaderAssignment).where(
                        ClassLeaderAssignment.class_id == class_id,
                        ClassLeaderAssignment.student_id == student.id,
                        ClassLeaderAssignment.is_active.is_(True),
                    )
                )
                if assignment:
                    return course_class
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Hanya ketua kelas yang berhak melakukan tindakan ini",
                )
            else:
                enrollment = db.scalar(
                    select(ClassEnrollment).where(
                        ClassEnrollment.class_id == class_id,
                        ClassEnrollment.student_id == student.id,
                        ClassEnrollment.status == EnrollmentStatus.AKTIF,
                    )
                )
                if enrollment:
                    return course_class

    # Default: 404 (BR-ROLE-008 — hide existence from unauthorized users)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Kelas tidak ditemukan",
    )


def require_own_student_data(
    db: Session,
    user: User,
    student_id: int,
) -> None:
    """For MAHASISWA role: verify user is accessing their own data.

    ADMIN, KAPRODI, and DOSEN are allowed through (they have broader checks
    at the endpoint level). Only MAHASISWA/KETUA_KELAS is restricted to
    their own student_id.

    Raises 404 per BR-ROLE-008.
    """
    if user.role in (UserRole.ADMIN, UserRole.KAPRODI, UserRole.DOSEN):
        return
    student = StudentRepository.get_by_user_id(db, user.id)
    if not student or student.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data tidak ditemukan",
        )


def audit(
    db: Session,
    actor_id: int | None,
    action: str,
    entity: str,
    entity_id: int | None,
    *,
    before: dict | None = None,
    after: dict | None = None,
    reason: str | None = None,
    request: Request | None = None,
) -> None:
    """Write an immutable audit log entry.

    If a FastAPI Request object is provided, IP address and User-Agent
    are automatically extracted.
    """
    from app.models.workflow import AuditLog

    ip_address: str | None = None
    user_agent: str | None = None

    if request is not None:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")[:500]

    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            before=before,
            after=after,
            reason=reason,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

