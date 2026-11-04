"""
SADITA — Grading Service
Calculates final grades based on configurable SADITA weights: UTS=30%, UAS=35%, Aktif=10%, Tugas=15%, Absen=10%.
Supports grade configuration per class, default activity score (80) with distinction label,
grade publication workflow, and audited post-publication revisions.
"""
from datetime import datetime, timezone
from typing import Optional, Tuple, Dict

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lms import StudentGrade, GradeScale, ClassGradeConfig
from app.models.attendance import AttendanceStatus, AttendanceRecord, AttendanceSession


class GradingService:
    """Service for calculating and managing student grades."""

    # Default SADITA grading weights
    DEFAULT_WEIGHTS = {
        "uts": 0.30,
        "uas": 0.35,
        "aktif": 0.10,
        "tugas": 0.15,
        "absen": 0.10,
    }

    # Grade scale thresholds
    GRADE_THRESHOLDS = {
        GradeScale.A: 85.0,
        GradeScale.B: 75.0,
        GradeScale.C: 65.0,
        GradeScale.D: 55.0,
    }

    @staticmethod
    def get_or_create_config(db: Session, class_id: int) -> ClassGradeConfig:
        """Get class grade configuration or create one with default weights."""
        config = db.query(ClassGradeConfig).filter(ClassGradeConfig.class_id == class_id).first()
        if not config:
            config = ClassGradeConfig(
                class_id=class_id,
                uts_weight=0.30,
                uas_weight=0.35,
                aktif_weight=0.10,
                tugas_weight=0.15,
                absen_weight=0.10,
                default_aktif_score=80.0,
                is_published=False,
            )
            db.add(config)
            db.commit()
            db.refresh(config)
        return config

    @staticmethod
    def update_config(
        db: Session,
        class_id: int,
        *,
        uts_weight: float,
        uas_weight: float,
        aktif_weight: float,
        tugas_weight: float,
        absen_weight: float,
        default_aktif_score: float = 80.0,
    ) -> ClassGradeConfig:
        """Update grade weighting for a class. Weights must sum to 1.0 (100%)."""
        total = round(uts_weight + uas_weight + aktif_weight + tugas_weight + absen_weight, 4)
        if abs(total - 1.0) > 0.001:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Total bobot komponen nilai harus tepat 100% (1.0). Total saat ini: {total * 100:.1f}%",
            )

        config = GradingService.get_or_create_config(db, class_id)
        config.uts_weight = uts_weight
        config.uas_weight = uas_weight
        config.aktif_weight = aktif_weight
        config.tugas_weight = tugas_weight
        config.absen_weight = absen_weight
        config.default_aktif_score = default_aktif_score
        config.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(config)
        return config

    @staticmethod
    def get_or_create_grade(db: Session, class_id: int, student_id: int) -> StudentGrade:
        """Get existing grade or create new one with default activity score."""
        grade = db.query(StudentGrade).filter(
            StudentGrade.class_id == class_id,
            StudentGrade.student_id == student_id,
        ).first()

        if not grade:
            config = GradingService.get_or_create_config(db, class_id)
            grade = StudentGrade(
                class_id=class_id,
                student_id=student_id,
                aktif_score=config.default_aktif_score,
                is_default_aktif=True,
                is_published=config.is_published,
            )
            db.add(grade)
            db.commit()
            db.refresh(grade)

        return grade

    @staticmethod
    def calculate_attendance_score(db: Session, class_id: int, student_id: int) -> float:
        """
        Calculate attendance score based on attendance records.
        Score = (HADIR + TERLAMBAT) / total_sessions * 100
        """
        sessions = (
            db.query(AttendanceRecord)
            .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
            .filter(
                AttendanceSession.class_id == class_id,
                AttendanceRecord.student_id == student_id,
            )
            .all()
        )

        if not sessions:
            return 0.0

        total = len(sessions)
        present = sum(1 for s in sessions if s.status in [AttendanceStatus.HADIR, AttendanceStatus.TERLAMBAT])

        score = (present / total) * 100 if total > 0 else 0.0
        return round(score, 2)

    @staticmethod
    def calculate_final_grade(
        grade: StudentGrade,
        config: Optional[ClassGradeConfig] = None,
    ) -> Tuple[float, GradeScale]:
        """Calculate final score and letter grade from component scores using configured weights."""
        if config:
            weights = {
                "uts": config.uts_weight,
                "uas": config.uas_weight,
                "aktif": config.aktif_weight,
                "tugas": config.tugas_weight,
                "absen": config.absen_weight,
            }
        else:
            weights = GradingService.DEFAULT_WEIGHTS

        scores = {
            "uts": grade.uts_score or 0.0,
            "uas": grade.uas_score or 0.0,
            "aktif": grade.aktif_score or (config.default_aktif_score if config else 80.0),
            "tugas": grade.tugas_score or 0.0,
            "absen": grade.absen_score or 0.0,
        }

        final_score = sum(scores[key] * weights[key] for key in weights)
        final_score = round(final_score, 2)

        grade_scale = GradingService.determine_grade_scale(final_score)
        return final_score, grade_scale

    @staticmethod
    def determine_grade_scale(score: float) -> GradeScale:
        """Determine letter grade from final score."""
        if score >= GradingService.GRADE_THRESHOLDS[GradeScale.A]:
            return GradeScale.A
        elif score >= GradingService.GRADE_THRESHOLDS[GradeScale.B]:
            return GradeScale.B
        elif score >= GradingService.GRADE_THRESHOLDS[GradeScale.C]:
            return GradeScale.C
        elif score >= GradingService.GRADE_THRESHOLDS[GradeScale.D]:
            return GradeScale.D
        else:
            return GradeScale.E

    @staticmethod
    def update_component_score(
        db: Session,
        class_id: int,
        student_id: int,
        component: str,
        score: float,
        user_id: int,
        reason: Optional[str] = None,
    ) -> StudentGrade:
        """
        Update a component score and recalculate final grade.
        Component can be: uts, uas, aktif, tugas, absen.
        If already published, requires reason for audit trail.
        """
        valid_components = {"uts", "uas", "aktif", "tugas", "absen"}
        if component not in valid_components:
            raise ValueError(f"Komponen nilai tidak valid: {component}")

        grade = GradingService.get_or_create_grade(db, class_id, student_id)
        config = GradingService.get_or_create_config(db, class_id)

        # Post-publication check
        if grade.is_published and not reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nilai kelas sudah dipublikasikan. Perubahan nilai wajib menyertakan alasan revisi untuk audit trail.",
            )

        if component == "aktif":
            grade.is_default_aktif = False

        setattr(grade, f"{component}_score", score)

        if reason:
            grade.revision_reason = reason
            grade.revision_requested_at = datetime.now(timezone.utc)

        final_score, grade_scale = GradingService.calculate_final_grade(grade, config)
        grade.final_score = final_score
        grade.grade_scale = grade_scale
        grade.calculated_at = datetime.now(timezone.utc)
        grade.calculated_by = user_id

        db.commit()
        db.refresh(grade)
        return grade

    @staticmethod
    def calculate_all_for_class(db: Session, class_id: int, user_id: int) -> list[StudentGrade]:
        """Calculate grades for all enrolled students in a class."""
        from app.models.academic import ClassEnrollment, EnrollmentStatus

        config = GradingService.get_or_create_config(db, class_id)
        enrollments = (
            db.query(ClassEnrollment)
            .filter(
                ClassEnrollment.class_id == class_id,
                ClassEnrollment.status == EnrollmentStatus.AKTIF,
            )
            .all()
        )

        grades = []
        for enrollment in enrollments:
            grade = GradingService.get_or_create_grade(db, class_id, enrollment.student_id)

            # Auto calculate attendance score if missing
            if grade.absen_score is None:
                grade.absen_score = GradingService.calculate_attendance_score(
                    db, class_id, enrollment.student_id
                )

            # Default activity score if missing
            if grade.aktif_score is None:
                grade.aktif_score = config.default_aktif_score
                grade.is_default_aktif = True

            final_score, grade_scale = GradingService.calculate_final_grade(grade, config)
            grade.final_score = final_score
            grade.grade_scale = grade_scale
            grade.calculated_at = datetime.now(timezone.utc)
            grade.calculated_by = user_id

            grades.append(grade)

        db.commit()
        for g in grades:
            db.refresh(g)
        return grades

    @staticmethod
    def publish_class_grades(
        db: Session,
        class_id: int,
        user_id: int,
        is_published: bool = True,
    ) -> ClassGradeConfig:
        """Publish or unpublish all grades in a class to students."""
        config = GradingService.get_or_create_config(db, class_id)
        config.is_published = is_published
        config.published_at = datetime.now(timezone.utc) if is_published else None
        config.published_by = user_id if is_published else None

        # Update all student grades in this class
        grades = db.query(StudentGrade).filter(StudentGrade.class_id == class_id).all()
        for g in grades:
            g.is_published = is_published

        db.commit()
        db.refresh(config)
        return config

    @staticmethod
    def get_class_grades(db: Session, class_id: int) -> list[StudentGrade]:
        """Get all grades for a class."""
        return db.query(StudentGrade).filter(StudentGrade.class_id == class_id).all()

    @staticmethod
    def get_student_grade(db: Session, class_id: int, student_id: int) -> Optional[StudentGrade]:
        """Get grade for a specific student in a class."""
        return db.query(StudentGrade).filter(
            StudentGrade.class_id == class_id,
            StudentGrade.student_id == student_id,
        ).first()
