"""
SADITA — LMS Repository
Data access for CourseMaterial, Assignment, and AssignmentSubmission.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.lms import (
    Assignment,
    AssignmentSubmission,
    CourseMaterial,
    MaterialType,
    SubmissionStatus,
)


class LMSRepository:

    # ------------------------------------------------------------------
    # Course Materials
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
        material = CourseMaterial(
            class_id=class_id,
            session_id=session_id,
            title=title.strip(),
            material_type=material_type,
            description=description.strip() if description else None,
            resource_url=resource_url.strip() if resource_url else None,
            content=content,
        )
        db.add(material)
        db.commit()
        db.refresh(material)
        return material

    @staticmethod
    def get_material_by_id(db: Session, material_id: int) -> Optional[CourseMaterial]:
        return db.scalar(
            select(CourseMaterial)
            .options(
                joinedload(CourseMaterial.course_class),
                joinedload(CourseMaterial.session),
            )
            .where(CourseMaterial.id == material_id)
        )

    @staticmethod
    def list_materials_for_class(
        db: Session,
        class_id: int,
        session_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[CourseMaterial]:
        stmt = (
            select(CourseMaterial)
            .where(CourseMaterial.class_id == class_id)
            .order_by(CourseMaterial.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if session_id:
            stmt = stmt.where(CourseMaterial.session_id == session_id)
        return list(db.scalars(stmt).all())

    @staticmethod
    def delete_material(db: Session, material_id: int) -> bool:
        mat = db.get(CourseMaterial, material_id)
        if not mat:
            return False
        db.delete(mat)
        db.commit()
        return True

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
        assignment = Assignment(
            class_id=class_id,
            session_id=session_id,
            title=title.strip(),
            description=description.strip() if description else None,
            due_date=due_date,
            max_score=max_score,
            allow_late=allow_late,
            is_published=is_published,
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def get_assignment_by_id(db: Session, assignment_id: int) -> Optional[Assignment]:
        return db.scalar(
            select(Assignment)
            .options(
                joinedload(Assignment.course_class),
                joinedload(Assignment.session),
                joinedload(Assignment.submissions),
            )
            .where(Assignment.id == assignment_id)
        )

    @staticmethod
    def list_assignments_for_class(
        db: Session,
        class_id: int,
        session_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Assignment]:
        stmt = (
            select(Assignment)
            .options(joinedload(Assignment.submissions))
            .where(Assignment.class_id == class_id)
            .order_by(Assignment.due_date.asc())
            .offset(offset)
            .limit(limit)
        )
        if session_id:
            stmt = stmt.where(Assignment.session_id == session_id)
        return list(db.scalars(stmt).unique().all())

    @staticmethod
    def delete_assignment(db: Session, assignment_id: int) -> bool:
        assign = db.get(Assignment, assignment_id)
        if not assign:
            return False
        db.delete(assign)
        db.commit()
        return True

    # ------------------------------------------------------------------
    # Submissions & Grading
    # ------------------------------------------------------------------

    @staticmethod
    def upsert_submission(
        db: Session,
        *,
        assignment_id: int,
        student_id: int,
        status: SubmissionStatus,
        file_url: Optional[str] = None,
        content: Optional[str] = None,
        submitted_at: Optional[datetime] = None,
    ) -> AssignmentSubmission:
        sub = db.scalar(
            select(AssignmentSubmission).where(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.student_id == student_id,
            )
        )
        now = submitted_at or datetime.now(timezone.utc)
        if sub:
            sub.file_url = file_url
            sub.content = content
            sub.submitted_at = now
            sub.status = status
        else:
            sub = AssignmentSubmission(
                assignment_id=assignment_id,
                student_id=student_id,
                file_url=file_url,
                content=content,
                submitted_at=now,
                status=status,
            )
            db.add(sub)
        db.commit()
        db.refresh(sub)
        return sub

    @staticmethod
    def get_submission(
        db: Session, assignment_id: int, student_id: int
    ) -> Optional[AssignmentSubmission]:
        return db.scalar(
            select(AssignmentSubmission)
            .options(
                joinedload(AssignmentSubmission.student),
                joinedload(AssignmentSubmission.grader),
            )
            .where(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.student_id == student_id,
            )
        )

    @staticmethod
    def list_submissions_for_assignment(
        db: Session,
        assignment_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AssignmentSubmission]:
        return list(
            db.scalars(
                select(AssignmentSubmission)
                .options(
                    joinedload(AssignmentSubmission.student),
                    joinedload(AssignmentSubmission.grader),
                )
                .where(AssignmentSubmission.assignment_id == assignment_id)
                .order_by(AssignmentSubmission.submitted_at.desc())
                .offset(offset)
                .limit(limit)
            ).unique().all()
        )

    @staticmethod
    def grade_submission(
        db: Session,
        submission_id: int,
        *,
        score: float,
        feedback: Optional[str] = None,
        graded_by: int,
    ) -> Optional[AssignmentSubmission]:
        sub = db.get(AssignmentSubmission, submission_id)
        if not sub:
            return None
        sub.score = score
        sub.feedback = feedback
        sub.graded_by = graded_by
        sub.graded_at = datetime.now(timezone.utc)
        sub.status = SubmissionStatus.GRADED
        db.commit()
        db.refresh(sub)
        return sub

    @staticmethod
    def list_student_submissions(
        db: Session, student_id: int, class_id: Optional[int] = None
    ) -> List[AssignmentSubmission]:
        stmt = (
            select(AssignmentSubmission)
            .options(
                joinedload(AssignmentSubmission.assignment),
                joinedload(AssignmentSubmission.grader),
            )
            .where(AssignmentSubmission.student_id == student_id)
            .order_by(AssignmentSubmission.submitted_at.desc())
        )
        if class_id:
            stmt = stmt.join(Assignment).where(Assignment.class_id == class_id)
        return list(db.scalars(stmt).unique().all())
