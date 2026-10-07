"""
SADITA — LMS Schemas (Enhanced with Frappe LMS patterns)
Request/Response models for CourseChapter, CourseLesson, CourseMaterial, Assignment, Quiz, Progress.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.lms import (
    MaterialType,
    LessonType,
    SubmissionStatus,
    QuizQuestionType,
    GradeScale,
)
from app.schemas.user import StudentProfileResponse


# ---------------------------------------------------------------------------
# Course Chapter Schemas
# ---------------------------------------------------------------------------
class ChapterCreateRequest(BaseModel):
    class_id: int
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    chapter_number: int = Field(..., ge=1)
    is_published: bool = False


class ChapterResponse(BaseModel):
    id: int
    class_id: int
    title: str
    description: Optional[str]
    chapter_number: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    lesson_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Course Lesson Schemas
# ---------------------------------------------------------------------------
class LessonCreateRequest(BaseModel):
    class_id: int
    chapter_id: Optional[int] = None
    session_id: Optional[int] = None
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    lesson_type: LessonType = LessonType.DOCUMENT
    lesson_number: int = Field(..., ge=1)
    content: Optional[str] = None
    video_url: Optional[str] = None
    resource_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_published: bool = False
    allow_comments: bool = True


class LessonResponse(BaseModel):
    id: int
    class_id: int
    chapter_id: Optional[int]
    session_id: Optional[int]
    title: str
    description: Optional[str]
    lesson_type: LessonType
    lesson_number: int
    content: Optional[str]
    video_url: Optional[str]
    resource_url: Optional[str]
    duration_minutes: Optional[int]
    is_published: bool
    allow_comments: bool
    created_at: datetime
    updated_at: datetime
    material_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Course Material Schemas
# ---------------------------------------------------------------------------
class MaterialCreateRequest(BaseModel):
    class_id: int
    lesson_id: Optional[int] = None
    session_id: Optional[int] = Field(None, description="Terkait sesi/pertemuan ke-N (opsional)")
    title: str = Field(..., min_length=2, max_length=200)
    material_type: MaterialType = MaterialType.DOCUMENT
    description: Optional[str] = None
    resource_url: Optional[str] = Field(None, description="URL dokumen/Google Drive/GitHub/video")
    content: Optional[str] = Field(None, description="Isi teks langsung (Markdown)")


class MaterialResponse(BaseModel):
    id: int
    class_id: int
    lesson_id: Optional[int]
    session_id: Optional[int]
    title: str
    material_type: MaterialType
    description: Optional[str]
    resource_url: Optional[str]
    content: Optional[str]
    file_size: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Assignment Schemas
# ---------------------------------------------------------------------------
class AssignmentCreateRequest(BaseModel):
    class_id: int
    lesson_id: Optional[int] = None
    session_id: Optional[int] = None
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    assignment_type: str = "DOCUMENT"
    due_date: datetime
    max_score: float = Field(100.0, ge=1.0, le=100.0)
    allow_late: bool = True
    show_answer: bool = False
    answer: Optional[str] = None
    is_published: bool = False


class AssignmentResponse(BaseModel):
    id: int
    class_id: int
    lesson_id: Optional[int]
    session_id: Optional[int]
    title: str
    description: Optional[str]
    assignment_type: str
    due_date: datetime
    max_score: float
    allow_late: bool
    show_answer: bool
    is_published: bool
    created_at: datetime
    updated_at: datetime
    submission_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Submission & Grading Schemas
# ---------------------------------------------------------------------------
class SubmissionCreateRequest(BaseModel):
    file_url: Optional[str] = Field(None, description="URL lampiran file/repo tugas")
    content: Optional[str] = Field(None, description="Catatan teks/laporan tugas")


class GradeSubmissionRequest(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0, description="Nilai tugas (0 - 100)")
    feedback: Optional[str] = Field(None, description="Catatan atau masukan dari dosen")


class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    file_url: Optional[str]
    content: Optional[str]
    submitted_at: datetime
    status: SubmissionStatus
    score: Optional[float]
    feedback: Optional[str]
    graded_by: Optional[int]
    graded_at: Optional[datetime]
    student: Optional[StudentProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class AssignmentDetailResponse(AssignmentResponse):
    submissions: List[SubmissionResponse] = []


# ---------------------------------------------------------------------------
# Quiz Schemas
# ---------------------------------------------------------------------------
class QuizCreateRequest(BaseModel):
    class_id: int
    lesson_id: Optional[int] = None
    session_id: Optional[int] = None
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    passing_score: float = Field(60.0, ge=0.0, le=100.0)
    max_attempts: int = Field(3, ge=1)
    time_limit_minutes: Optional[int] = None
    shuffle_questions: bool = False
    is_published: bool = False


class QuizResponse(BaseModel):
    id: int
    class_id: int
    lesson_id: Optional[int]
    session_id: Optional[int]
    title: str
    description: Optional[str]
    passing_score: float
    max_attempts: int
    time_limit_minutes: Optional[int]
    shuffle_questions: bool
    is_published: bool
    created_at: datetime
    updated_at: datetime
    question_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class QuizQuestionCreateRequest(BaseModel):
    quiz_id: int
    question_text: str = Field(..., min_length=5)
    question_type: QuizQuestionType = QuizQuestionType.SINGLE_CHOICE
    points: float = Field(1.0, ge=0.0)
    question_number: int = Field(..., ge=1)
    explanation: Optional[str] = None


class QuizQuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    question_type: QuizQuestionType
    points: float
    question_number: int
    explanation: Optional[str]
    created_at: datetime
    options: List["QuizOptionResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class QuizOptionCreateRequest(BaseModel):
    question_id: int
    option_text: str = Field(..., min_length=1)
    is_correct: bool = False
    option_number: int = Field(..., ge=1)


class QuizOptionResponse(BaseModel):
    id: int
    question_id: int
    option_text: str
    is_correct: bool
    option_number: int

    model_config = ConfigDict(from_attributes=True)


class QuizSubmissionCreateRequest(BaseModel):
    quiz_id: int
    answers: List["QuizAnswerCreateRequest"] = []


class QuizAnswerCreateRequest(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    text_answer: Optional[str] = None


class QuizSubmissionResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    attempt_number: int
    score: float
    passed: bool
    started_at: datetime
    submitted_at: Optional[datetime]
    answers: List["QuizAnswerResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class QuizAnswerResponse(BaseModel):
    id: int
    submission_id: int
    question_id: int
    selected_option_id: Optional[int]
    text_answer: Optional[str]
    is_correct: bool
    points_earned: float

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Progress Schemas
# ---------------------------------------------------------------------------
class LessonProgressResponse(BaseModel):
    id: int
    lesson_id: int
    student_id: int
    is_completed: bool
    progress_percentage: float
    started_at: datetime
    completed_at: Optional[datetime]
    time_spent_seconds: int

    model_config = ConfigDict(from_attributes=True)


class CourseProgressResponse(BaseModel):
    id: int
    class_id: int
    student_id: int
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
    started_at: datetime
    last_activity_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Grading Schemas
# ---------------------------------------------------------------------------
class GradeUpdateRequest(BaseModel):
    component: str = Field(..., pattern="^(uts|uas|aktif|tugas|absen)$")
    score: float = Field(..., ge=0.0, le=100.0)


class GradeResponse(BaseModel):
    id: int
    class_id: int
    student_id: int
    uts_score: Optional[float]
    uas_score: Optional[float]
    aktif_score: Optional[float]
    tugas_score: Optional[float]
    absen_score: Optional[float]
    final_score: Optional[float]
    grade_scale: Optional[GradeScale]
    calculated_at: Optional[datetime]
    notes: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class GradeCalculateRequest(BaseModel):
    recalculate_attendance: bool = False
