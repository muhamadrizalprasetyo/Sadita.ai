"""
SADITA — Models Package (v2)
Exports semua SQLAlchemy ORM models.
Import urutan penting untuk menghindari circular dependency.
"""
# Base models (no foreign keys to other models)
from app.models.user import User, UserRole
from app.models.program_studi import ProgramStudi

# Profile models
from app.models.lecturer import LecturerProfile
from app.models.student import StudentProfile, KtmStatus

# Credential models (linked to StudentProfile)
from app.models.credential import RfidCredential, FingerprintCredential

# Academic models
from app.models.academic import (
    ClassType,
    EnrollmentStatus,
    AcademicTerm,
    Course,
    ClassRoom,
    CourseClass,
    ClassEnrollment,
)

# Device model (linked to ClassRoom)
from app.models.device import SaditaDevice, DeviceStatus

# Attendance models (linked to everything above)
from app.models.attendance import (
    SessionStatus,
    AttendanceStatus,
    AttendanceMethod,
    AttendanceEventType,
    AttendanceSession,
    AttendanceRecord,
    AttendanceEvent,
)

# LMS models
from app.models.lms import (
    MaterialType,
    LessonType,
    SubmissionStatus,
)
from app.models.lms import (
    CourseChapter,
    CourseLesson,
    CourseMaterial,
    Assignment,
    AssignmentSubmission,
    Quiz,
    QuizQuestion,
    QuizOption,
    QuizSubmission,
    QuizAnswer,
    LessonProgress,
    CourseProgress,
    StudentGrade,
    GradeScale,
)
from app.models.workflow import AuditLog, AttendanceRequest, AttendanceRequestStatus, ClassLeaderAssignment

__all__ = [
    # User
    "User",
    "UserRole",
    # Prodi
    "ProgramStudi",
    # Profiles
    "LecturerProfile",
    "StudentProfile",
    "KtmStatus",
    # Credentials
    "RfidCredential",
    "FingerprintCredential",
    # Academic
    "ClassType",
    "EnrollmentStatus",
    "AcademicTerm",
    "Course",
    "ClassRoom",
    "CourseClass",
    "ClassEnrollment",
    # Device
    "SaditaDevice",
    "DeviceStatus",
    # Attendance
    "SessionStatus",
    "AttendanceStatus",
    "AttendanceMethod",
    "AttendanceEventType",
    "AttendanceSession",
    "AttendanceRecord",
    "AttendanceEvent",
    # LMS
    "MaterialType",
    "LessonType",
    "SubmissionStatus",
    "QuizQuestionType",
    "CourseChapter",
    "CourseLesson",
    "CourseMaterial",
    "Assignment",
    "AssignmentSubmission",
    "Quiz",
    "QuizQuestion",
    "QuizOption",
    "QuizSubmission",
    "QuizAnswer",
    "LessonProgress",
    "CourseProgress",
    "StudentGrade",
    "GradeScale",
    "AuditLog",
    "AttendanceRequest",
    "AttendanceRequestStatus",
    "ClassLeaderAssignment",
]
