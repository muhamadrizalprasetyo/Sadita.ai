"""
SADITA — LMS Service
Business logic for Course Materials, Assignments, Submissions, and Grading.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lms import (
    Assignment,
    AssignmentSubmission,
    CourseMaterial,
    MaterialType,
    SubmissionStatus,
)
from app.repositories.academic_repo import AcademicRepository
from app.repositories.attendance_repo import AttendanceRepository
from app.repositories.lms_repo import LMSRepository
from app.repositories.user_repo import StudentRepository

logger = logging.getLogger(__name__)


class LMSService:

    # ------------------------------------------------------------------
    # Materials
    # ------------------------------------------------------------------

    @staticmethod
    def create_material(
        db: Session,
        *,
        class_id: int,
        title: str,
        material_type: MaterialType = MaterialType.DOCUMENT,
        session_id: Optional[int] = None,
        description: Optional[str] = None,
        resource_url: Optional[str] = None,
        content: Optional[str] = None,
    ) -> CourseMaterial:
        course_class = AcademicRepository.get_class_by_id(db, class_id)
        if not course_class:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kelas ID {class_id} tidak ditemukan",
            )

        if session_id:
            session = AttendanceRepository.get_session_by_id(db, session_id)
            if not session or session.class_id != class_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Sesi ID {session_id} tidak valid untuk kelas ini",
                )

        material = LMSRepository.create_material(
            db,
            class_id=class_id,
            title=title,
            material_type=material_type,
            session_id=session_id,
            description=description,
            resource_url=resource_url,
            content=content,
        )
        logger.info("Material created: id=%d class_id=%d title='%s'", material.id, class_id, title)
        return material

    # ------------------------------------------------------------------
    # Assignments
    # ------------------------------------------------------------------

    @staticmethod
    def create_assignment(
        db: Session,
        *,
        class_id: int,
        title: str,
        due_date: datetime,
        session_id: Optional[int] = None,
        description: Optional[str] = None,
        max_score: float = 100.0,
        allow_late: bool = True,
        is_published: bool = True,
    ) -> Assignment:
        course_class = AcademicRepository.get_class_by_id(db, class_id)
        if not course_class:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kelas ID {class_id} tidak ditemukan",
            )

        if session_id:
            session = AttendanceRepository.get_session_by_id(db, session_id)
            if not session or session.class_id != class_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Sesi ID {session_id} tidak valid untuk kelas ini",
                )

        assignment = LMSRepository.create_assignment(
            db,
            class_id=class_id,
            title=title,
            due_date=due_date,
            session_id=session_id,
            description=description,
            max_score=max_score,
            allow_late=allow_late,
            is_published=is_published,
        )
        logger.info("Assignment created: id=%d class_id=%d title='%s'", assignment.id, class_id, title)
        return assignment

    # ------------------------------------------------------------------
    # Submissions
    # ------------------------------------------------------------------

    @staticmethod
    def submit_assignment(
        db: Session,
        *,
        assignment_id: int,
        user_id: int,
        file_url: Optional[str] = None,
        content: Optional[str] = None,
        submitted_at: Optional[datetime] = None,
    ) -> AssignmentSubmission:
        assignment = LMSRepository.get_assignment_by_id(db, assignment_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tugas ID {assignment_id} tidak ditemukan",
            )

        student = StudentRepository.get_by_user_id(db, user_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Profil mahasiswa tidak ditemukan untuk akun ini",
            )

        # Check enrollment
        from sqlalchemy import select
        from app.models.academic import ClassEnrollment, EnrollmentStatus
        enrollment = db.scalar(
            select(ClassEnrollment).where(
                ClassEnrollment.class_id == assignment.class_id,
                ClassEnrollment.student_id == student.id,
                ClassEnrollment.status.in_([EnrollmentStatus.AKTIF, "AKTIF"]),
            )
        )
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak terdaftar aktif di kelas ini",
            )

        now = submitted_at or datetime.now(timezone.utc)
        # Compare due_date timezone-safely
        due = assignment.due_date
        if due.tzinfo is None and now.tzinfo is not None:
            due = due.replace(tzinfo=timezone.utc)
        elif due.tzinfo is not None and now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        is_late = now > due
        if is_late and not assignment.allow_late:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Batas waktu pengumpulan telah lewat dan tugas ini tidak menerima keterlambatan",
            )

        submission_status = SubmissionStatus.LATE if is_late else SubmissionStatus.SUBMITTED

        sub = LMSRepository.upsert_submission(
            db,
            assignment_id=assignment.id,
            student_id=student.id,
            status=submission_status,
            file_url=file_url,
            content=content,
            submitted_at=now,
        )
        logger.info(
            "Assignment submitted: assignment_id=%d student_id=%d status=%s",
            assignment.id,
            student.id,
            submission_status,
        )
        return sub

    # ------------------------------------------------------------------
    # Grading
    # ------------------------------------------------------------------

    @staticmethod
    def grade_submission(
        db: Session,
        *,
        submission_id: int,
        score: float,
        feedback: Optional[str] = None,
        grader_user_id: int,
    ) -> AssignmentSubmission:
        sub = db.get(AssignmentSubmission, submission_id)
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pengumpulan ID {submission_id} tidak ditemukan",
            )

        from app.models.user import UserRole
        from app.repositories.user_repo import UserRepository, LecturerRepository

        grader_user = UserRepository.get_by_id(db, grader_user_id)
        if not grader_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User tidak valid")

        lecturer_id = None
        if grader_user.role == UserRole.DOSEN:
            lecturer = LecturerRepository.get_by_user_id(db, grader_user_id)
            if lecturer:
                lecturer_id = lecturer.id
        elif grader_user.role == UserRole.ADMIN:
            # Admin can grade, look up lecturer profile if exists
            lecturer = LecturerRepository.get_by_user_id(db, grader_user_id)
            if lecturer:
                lecturer_id = lecturer.id

        graded = LMSRepository.grade_submission(
            db,
            submission_id=submission_id,
            score=score,
            feedback=feedback,
            graded_by=lecturer_id,
        )
        logger.info("Submission %d graded: score=%.1f by_user=%d", submission_id, score, grader_user_id)
        return graded

    # ------------------------------------------------------------------
    # Analytics & Summary
    # ------------------------------------------------------------------

    @staticmethod
    def get_assignment_summary(db: Session, assignment_id: int) -> dict:
        assignment = LMSRepository.get_assignment_by_id(db, assignment_id)
        if not assignment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tugas tidak ditemukan")

        enrollments = AcademicRepository.get_enrollments(db, assignment.class_id)
        total_students = len(enrollments)
        submissions = LMSRepository.list_submissions_for_assignment(db, assignment_id)

        submitted_count = len(submissions)
        graded_count = sum(1 for s in submissions if s.status == SubmissionStatus.GRADED)
        scores = [s.score for s in submissions if s.score is not None]
        avg_score = round(sum(scores) / len(scores), 2) if scores else None

        return {
            "assignment_id": assignment.id,
            "title": assignment.title,
            "total_enrolled": total_students,
            "total_submitted": submitted_count,
            "total_graded": graded_count,
            "submission_rate_percent": round((submitted_count / total_students) * 100, 1) if total_students else 0,
            "average_score": avg_score,
            "highest_score": max(scores) if scores else None,
            "lowest_score": min(scores) if scores else None,
        }
