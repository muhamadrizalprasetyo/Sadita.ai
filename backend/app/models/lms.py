"""
SADITA — LMS Models (Enhanced with Frappe LMS patterns)
CourseChapter, CourseLesson, CourseMaterial, Assignment, Quiz, Progress, Grading.
"""
from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.academic import CourseClass
    from app.models.attendance import AttendanceSession
    from app.models.lecturer import LecturerProfile
    from app.models.student import StudentProfile


class GradeScale(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"


class MaterialType(str, enum.Enum):
    DOCUMENT = "DOCUMENT"      # PDF, PPT, Word, dll.
    LINK = "LINK"              # URL referensi eksternal, video YouTube, repo GitHub
    TEXT = "TEXT"              # Catatan / instruksi teks langsung
    VIDEO = "VIDEO"            # Video embed (YouTube, Vimeo)
    SCORM = "SCORM"            # SCORM package


class LessonType(str, enum.Enum):
    DOCUMENT = "DOCUMENT"      # Dokumen/bahan bacaan
    VIDEO = "VIDEO"            # Video
    QUIZ = "QUIZ"              # Kuis
    ASSIGNMENT = "ASSIGNMENT"  # Tugas
    EXERCISE = "EXERCISE"      # Latihan programming


class SubmissionStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"    # Tepat waktu
    LATE = "LATE"              # Terlambat (lewat due_date)
    GRADED = "GRADED"          # Sudah dinilai oleh dosen
    NOT_SUBMITTED = "NOT_SUBMITTED"  # Belum submit


class QuizQuestionType(str, enum.Enum):
    SINGLE_CHOICE = "SINGLE_CHOICE"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TEXT = "TEXT"


class CourseChapter(Base):
    """
    Chapter/Module untuk mengelompokkan lessons.
    Inspired by Frappe LMS Course Chapter.
    """
    __tablename__ = "course_chapters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    chapter_number: Mapped[int] = mapped_column(Integer, nullable=False)  # Urutan chapter
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    course_class: Mapped["CourseClass"] = relationship("CourseClass")
    lessons: Mapped[List["CourseLesson"]] = relationship(
        "CourseLesson",
        back_populates="chapter",
        cascade="all, delete-orphan",
        order_by="CourseLesson.lesson_number",
    )

    def __repr__(self) -> str:
        return f"<CourseChapter id={self.id} class_id={self.class_id} title='{self.title}' number={self.chapter_number}>"


class CourseLesson(Base):
    """
    Lesson/Pertemuan dalam chapter.
    Bisa berupa dokumen, video, quiz, atau assignment.
    Inspired by Frappe LMS Course Lesson.
    """
    __tablename__ = "course_lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    chapter_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("course_chapters.id", ondelete="SET NULL"),
        nullable=True,
    )
    class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("attendance_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lesson_type: Mapped[LessonType] = mapped_column(
        Enum(LessonType, name="lesson_type_enum", create_constraint=True),
        default=LessonType.DOCUMENT,
        nullable=False,
    )
    lesson_number: Mapped[int] = mapped_column(Integer, nullable=False)  # Urutan dalam chapter
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Markdown/text content
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    resource_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_comments: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    chapter: Mapped[Optional["CourseChapter"]] = relationship(
        "CourseChapter", back_populates="lessons"
    )
    course_class: Mapped["CourseClass"] = relationship("CourseClass")
    session: Mapped[Optional["AttendanceSession"]] = relationship("AttendanceSession")
    materials: Mapped[List["CourseMaterial"]] = relationship(
        "CourseMaterial",
        back_populates="lesson",
        cascade="all, delete-orphan",
    )
    progress_records: Mapped[List["LessonProgress"]] = relationship(
        "LessonProgress",
        back_populates="lesson",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<CourseLesson id={self.id} class_id={self.class_id} title='{self.title}' type={self.lesson_type}>"


class CourseMaterial(Base):
    """
    Material attachment untuk lesson (PDF, link, dll).
    """
    __tablename__ = "course_materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("course_lessons.id", ondelete="CASCADE"),
        nullable=True,
    )
    class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("attendance_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    material_type: Mapped[MaterialType] = mapped_column(
        Enum(MaterialType, name="material_type_enum", create_constraint=True),
        default=MaterialType.DOCUMENT,
        nullable=False,
    )
    resource_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Markdown/text content
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    lesson: Mapped[Optional["CourseLesson"]] = relationship("CourseLesson", back_populates="materials")
    course_class: Mapped["CourseClass"] = relationship("CourseClass")
    session: Mapped[Optional["AttendanceSession"]] = relationship("AttendanceSession")

    def __repr__(self) -> str:
        return f"<CourseMaterial id={self.id} class_id={self.class_id} title='{self.title}'>"


class Assignment(Base):
    """
    Tugas/Assignment untuk kelas.
    Inspired by Frappe LMS Assignment.
    """
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("course_lessons.id", ondelete="SET NULL"),
        nullable=True,
    )
    class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("attendance_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assignment_type: Mapped[str] = mapped_column(String(50), default="DOCUMENT")  # DOCUMENT, PDF, URL, IMAGE, TEXT
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_score: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    allow_late: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_answer: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Model jawaban untuk type TEXT
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    lesson: Mapped[Optional["CourseLesson"]] = relationship("CourseLesson")
    course_class: Mapped["CourseClass"] = relationship("CourseClass")
    session: Mapped[Optional["AttendanceSession"]] = relationship("AttendanceSession")
    submissions: Mapped[List["AssignmentSubmission"]] = relationship(
        "AssignmentSubmission",
        back_populates="assignment",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Assignment id={self.id} class_id={self.class_id} title='{self.title}'>"


class AssignmentSubmission(Base):
    """
    Submission mahasiswa untuk assignment.
    Inspired by Frappe LMS Assignment Submission.
    """
    __tablename__ = "assignment_submissions"
    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student_submission"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assignment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, name="submission_status_enum", create_constraint=True),
        default=SubmissionStatus.SUBMITTED,
        nullable=False,
    )

    # Grading fields
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    graded_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("lecturer_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    graded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    assignment: Mapped["Assignment"] = relationship("Assignment", back_populates="submissions")
    student: Mapped["StudentProfile"] = relationship("StudentProfile")
    grader: Mapped[Optional["LecturerProfile"]] = relationship("LecturerProfile")

    def __repr__(self) -> str:
        return f"<AssignmentSubmission id={self.id} assignment_id={self.assignment_id} student_id={self.student_id} score={self.score}>"


class Quiz(Base):
    """
    Kuis untuk lesson.
    Inspired by Frappe LMS Quiz.
    """
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("course_lessons.id", ondelete="SET NULL"),
        nullable=True,
    )
    class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("attendance_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    passing_score: Mapped[float] = mapped_column(Float, default=60.0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    time_limit_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    shuffle_questions: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    lesson: Mapped[Optional["CourseLesson"]] = relationship("CourseLesson")
    course_class: Mapped["CourseClass"] = relationship("CourseClass")
    session: Mapped[Optional["AttendanceSession"]] = relationship("AttendanceSession")
    questions: Mapped[List["QuizQuestion"]] = relationship(
        "QuizQuestion",
        back_populates="quiz",
        cascade="all, delete-orphan",
    )
    submissions: Mapped[List["QuizSubmission"]] = relationship(
        "QuizSubmission",
        back_populates="quiz",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Quiz id={self.id} class_id={self.class_id} title='{self.title}'>"


class QuizQuestion(Base):
    """
    Pertanyaan dalam kuis.
    Inspired by Frappe LMS Question.
    """
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[QuizQuestionType] = mapped_column(
        Enum(QuizQuestionType, name="quiz_question_type_enum", create_constraint=True),
        default=QuizQuestionType.SINGLE_CHOICE,
        nullable=False,
    )
    points: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="questions")
    options: Mapped[List["QuizOption"]] = relationship(
        "QuizOption",
        back_populates="question",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<QuizQuestion id={self.id} quiz_id={self.quiz_id} type={self.question_type} points={self.points}>"


class QuizOption(Base):
    """
    Opsi jawaban untuk pertanyaan pilihan ganda.
    """
    __tablename__ = "quiz_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quiz_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    option_text: Mapped[str] = mapped_column(String(500), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    option_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    question: Mapped["QuizQuestion"] = relationship("QuizQuestion", back_populates="options")

    def __repr__(self) -> str:
        return f"<QuizOption id={self.id} question_id={self.question_id} is_correct={self.is_correct}>"


class QuizSubmission(Base):
    """
    Submission kuis oleh mahasiswa.
    Inspired by Frappe LMS Quiz Submission.
    """
    __tablename__ = "quiz_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="submissions")
    student: Mapped["StudentProfile"] = relationship("StudentProfile")
    answers: Mapped[List["QuizAnswer"]] = relationship(
        "QuizAnswer",
        back_populates="submission",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<QuizSubmission id={self.id} quiz_id={self.quiz_id} student_id={self.student_id} score={self.score}>"


class QuizAnswer(Base):
    """
    Jawaban mahasiswa untuk setiap pertanyaan kuis.
    """
    __tablename__ = "quiz_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    submission_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quiz_submissions.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quiz_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    selected_option_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("quiz_options.id", ondelete="SET NULL"),
        nullable=True,
    )
    text_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    points_earned: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    submission: Mapped["QuizSubmission"] = relationship("QuizSubmission", back_populates="answers")
    question: Mapped["QuizQuestion"] = relationship("QuizQuestion")
    selected_option: Mapped[Optional["QuizOption"]] = relationship("QuizOption")

    def __repr__(self) -> str:
        return f"<QuizAnswer id={self.id} question_id={self.question_id} is_correct={self.is_correct}>"


class LessonProgress(Base):
    """
    Progress mahasiswa pada lesson.
    Inspired by Frappe LMS Course Progress.
    """
    __tablename__ = "lesson_progress"
    __table_args__ = (
        UniqueConstraint("lesson_id", "student_id", name="uq_lesson_student_progress"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course_lessons.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    lesson: Mapped["CourseLesson"] = relationship("CourseLesson", back_populates="progress_records")
    student: Mapped["StudentProfile"] = relationship("StudentProfile")

    def __repr__(self) -> str:
        return f"<LessonProgress id={self.id} lesson_id={self.lesson_id} student_id={self.student_id} completed={self.is_completed}>"


class CourseProgress(Base):
    """
    Progress total mahasiswa pada satu kelas (CourseClass).
    Inspired by Frappe LMS Course Progress.
    """
    __tablename__ = "course_progress"
    __table_args__ = (
        UniqueConstraint("class_id", "student_id", name="uq_class_student_progress"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    total_lessons: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_lessons: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    course_class: Mapped["CourseClass"] = relationship("CourseClass")
    student: Mapped["StudentProfile"] = relationship("StudentProfile")

    def __repr__(self) -> str:
        return f"<CourseProgress id={self.id} class_id={self.class_id} student_id={self.student_id} progress={self.progress_percentage}%>"


class StudentGrade(Base):
    """
    Nilai komponen dan nilai akhir mahasiswa per kelas.
    SADITA grading weights: UTS=30%, UAS=35%, Aktif=10%, Tugas=15%, Absen=10%.
    """
    __tablename__ = "student_grades"
    __table_args__ = (
        UniqueConstraint("class_id", "student_id", name="uq_class_student_grade"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Component scores (0-100)
    uts_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 30%
    uas_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 35%
    aktif_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 10%
    tugas_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 15%
    absen_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 10%
    
    # Final grade
    final_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0-100
    grade_scale: Mapped[Optional[GradeScale]] = mapped_column(
        Enum(GradeScale, name="grade_scale_enum", create_constraint=True),
        nullable=True,
    )
    
    # Metadata
    calculated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    calculated_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    course_class: Mapped["CourseClass"] = relationship("CourseClass")
    student: Mapped["StudentProfile"] = relationship("StudentProfile")

    def calculate_final_score(self) -> float:
        """Calculate final score based on SADITA weights."""
        weights = {
            "uts": 0.30,
            "uas": 0.35,
            "aktif": 0.10,
            "tugas": 0.15,
            "absen": 0.10,
        }
        
        scores = {
            "uts": self.uts_score or 0,
            "uas": self.uas_score or 0,
            "aktif": self.aktif_score or 0,
            "tugas": self.tugas_score or 0,
            "absen": self.absen_score or 0,
        }
        
        final = sum(scores[key] * weights[key] for key in weights)
        return round(final, 2)

    def determine_grade_scale(self, score: float) -> GradeScale:
        """Determine letter grade from final score."""
        if score >= 85:
            return GradeScale.A
        elif score >= 75:
            return GradeScale.B
        elif score >= 65:
            return GradeScale.C
        elif score >= 55:
            return GradeScale.D
        else:
            return GradeScale.E

    def __repr__(self) -> str:
        return f"<StudentGrade id={self.id} class_id={self.class_id} student_id={self.student_id} final={self.final_score}>"
