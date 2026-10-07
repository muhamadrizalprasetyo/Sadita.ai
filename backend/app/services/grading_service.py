"""
SADITA — Grading Service
Calculates final grades based on SADITA weights: UTS=30%, UAS=35%, Aktif=10%, Tugas=15%, Absen=10%.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.lms import StudentGrade, GradeScale
from app.models.attendance import AttendanceStatus, AttendanceRecord


class GradingService:
    """Service for calculating and managing student grades."""
    
    # SADITA grading weights
    WEIGHTS = {
        "uts": 0.30,
        "uas": 0.35,
        "aktif": 0.10,
        "tugas": 0.15,
        "absen": 0.10,
    }
    
    # Grade scale thresholds
    GRADE_THRESHOLDS = {
        GradeScale.A: 85,
        GradeScale.B: 75,
        GradeScale.C: 65,
        GradeScale.D: 55,
    }
    
    @staticmethod
    def get_or_create_grade(db: Session, class_id: int, student_id: int) -> StudentGrade:
        """Get existing grade or create new one."""
        grade = db.query(StudentGrade).filter(
            StudentGrade.class_id == class_id,
            StudentGrade.student_id == student_id
        ).first()
        
        if not grade:
            grade = StudentGrade(
                class_id=class_id,
                student_id=student_id,
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
        sessions = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id.in_(
                db.query(AttendanceRecord.session_id).filter(
                    AttendanceRecord.session_id.in_(
                        db.query(AttendanceRecord.id).join(
                            AttendanceRecord.session
                        ).filter(
                            AttendanceRecord.session.has(class_id=class_id)
                        )
                    )
                )
            ),
            AttendanceRecord.student_id == student_id
        ).all()
        
        if not sessions:
            return 0.0
        
        total = len(sessions)
        present = sum(1 for s in sessions if s.status in [AttendanceStatus.HADIR, AttendanceStatus.TERLAMBAT])
        
        score = (present / total) * 100 if total > 0 else 0.0
        return round(score, 2)
    
    @staticmethod
    def calculate_final_grade(grade: StudentGrade) -> tuple[float, GradeScale]:
        """Calculate final score and letter grade from component scores."""
        weights = GradingService.WEIGHTS
        
        scores = {
            "uts": grade.uts_score or 0,
            "uas": grade.uas_score or 0,
            "aktif": grade.aktif_score or 0,
            "tugas": grade.tugas_score or 0,
            "absen": grade.absen_score or 0,
        }
        
        final_score = sum(scores[key] * weights[key] for key in weights)
        final_score = round(final_score, 2)
        
        # Determine letter grade
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
    ) -> StudentGrade:
        """
        Update a component score and recalculate final grade.
        Component can be: uts, uas, aktif, tugas, absen
        """
        if component not in GradingService.WEIGHTS:
            raise ValueError(f"Invalid component: {component}")
        
        grade = GradingService.get_or_create_grade(db, class_id, student_id)
        
        # Update component score
        setattr(grade, f"{component}_score", score)
        
        # Recalculate final grade
        final_score, grade_scale = GradingService.calculate_final_grade(grade)
        grade.final_score = final_score
        grade.grade_scale = grade_scale
        grade.calculated_at = datetime.now(timezone.utc)
        grade.calculated_by = user_id
        
        db.commit()
        db.refresh(grade)
        
        return grade
    
    @staticmethod
    def calculate_all_for_class(db: Session, class_id: int, user_id: int) -> list[StudentGrade]:
        """Calculate grades for all students in a class."""
        from app.models.academic import ClassEnrollment
        
        enrollments = db.query(ClassEnrollment).filter(
            ClassEnrollment.class_id == class_id
        ).all()
        
        grades = []
        for enrollment in enrollments:
            grade = GradingService.get_or_create_grade(db, class_id, enrollment.student_id)
            
            # Calculate attendance score if not set
            if grade.absen_score is None:
                grade.absen_score = GradingService.calculate_attendance_score(db, class_id, enrollment.student_id)
            
            # Recalculate final grade
            final_score, grade_scale = GradingService.calculate_final_grade(grade)
            grade.final_score = final_score
            grade.grade_scale = grade_scale
            grade.calculated_at = datetime.now(timezone.utc)
            grade.calculated_by = user_id
            
            db.commit()
            db.refresh(grade)
            grades.append(grade)
        
        return grades
    
    @staticmethod
    def get_class_grades(db: Session, class_id: int) -> list[StudentGrade]:
        """Get all grades for a class."""
        return db.query(StudentGrade).filter(
            StudentGrade.class_id == class_id
        ).all()
    
    @staticmethod
    def get_student_grade(db: Session, class_id: int, student_id: int) -> Optional[StudentGrade]:
        """Get grade for a specific student in a class."""
        return db.query(StudentGrade).filter(
            StudentGrade.class_id == class_id,
            StudentGrade.student_id == student_id
        ).first()
