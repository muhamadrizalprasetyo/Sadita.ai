"""
SADITA — LMS API Endpoints
/api/v1/lms
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentUser, CurrentUserID, DBSession, RequireLecturer, RequireStudent
from app.repositories.lms_repo import LMSRepository
from app.repositories.user_repo import StudentRepository
from app.schemas.lms import (
    AssignmentCreateRequest,
    AssignmentDetailResponse,
    AssignmentResponse,
    GradeSubmissionRequest,
    MaterialCreateRequest,
    MaterialResponse,
    SubmissionCreateRequest,
    SubmissionResponse,
    ChapterCreateRequest,
    ChapterResponse,
    LessonCreateRequest,
    LessonResponse,
    QuizCreateRequest,
    QuizResponse,
    QuizDetailResponse,
    QuizQuestionCreateRequest,
    QuizQuestionResponse,
    QuizOptionCreateRequest,
    QuizOptionResponse,
    QuizSubmissionCreateRequest,
    QuizSubmissionResponse,
    LessonProgressResponse,
    CourseProgressResponse,
    GradeUpdateRequest,
    GradeResponse,
    GradeCalculateRequest,
)
from app.services.lms_service import LMSService
from app.services.authorization_service import audit, require_class_access
from app.services.grading_service import GradingService
from app.models.user import UserRole
from app.models.lms import AssignmentSubmission

router = APIRouter(prefix="/lms", tags=["LMS (Learning Management System)"])


# ============================================================
# COURSE CHAPTERS
# ============================================================

@router.post(
    "/chapters",
    response_model=ChapterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Buat chapter/module baru",
    description="Dosen membuat chapter untuk mengelompokkan lessons.",
)
def create_chapter(req: ChapterCreateRequest, current: RequireLecturer, db: DBSession):
    require_class_access(db, current, req.class_id)
    from app.models.lms import CourseChapter
    chapter = CourseChapter(
        class_id=req.class_id,
        title=req.title,
        description=req.description,
        chapter_number=req.chapter_number,
        is_published=req.is_published,
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    audit(db, current.id, "CREATE_CHAPTER", "course_chapter", chapter.id, after={"class_id": req.class_id})
    db.commit()
    return ChapterResponse.model_validate(chapter)


@router.get(
    "/chapters",
    response_model=List[ChapterResponse],
    summary="Daftar chapter kelas",
)
def list_chapters(class_id: int, current: CurrentUser, db: DBSession):
    require_class_access(db, current, class_id)
    from app.models.lms import CourseChapter
    chapters = db.query(CourseChapter).filter(CourseChapter.class_id == class_id).order_by(CourseChapter.chapter_number).all()
    return [ChapterResponse.model_validate(c) for c in chapters]


@router.delete("/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter(chapter_id: int, current: RequireLecturer, db: DBSession):
    from app.models.lms import CourseChapter
    chapter = db.get(CourseChapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter tidak ditemukan")
    require_class_access(db, current, chapter.class_id)
    db.delete(chapter)
    audit(db, current.id, "DELETE_CHAPTER", "course_chapter", chapter_id)
    db.commit()


# ============================================================
# COURSE LESSONS
# ============================================================

@router.post(
    "/lessons",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Buat lesson/pertemuan baru",
    description="Dosen membuat lesson (dokumen, video, quiz, atau assignment).",
)
def create_lesson(req: LessonCreateRequest, current: RequireLecturer, db: DBSession):
    require_class_access(db, current, req.class_id)
    from app.models.lms import CourseLesson
    lesson = CourseLesson(
        class_id=req.class_id,
        chapter_id=req.chapter_id,
        session_id=req.session_id,
        title=req.title,
        description=req.description,
        lesson_type=req.lesson_type,
        lesson_number=req.lesson_number,
        content=req.content,
        video_url=req.video_url,
        resource_url=req.resource_url,
        duration_minutes=req.duration_minutes,
        is_published=req.is_published,
        allow_comments=req.allow_comments,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    audit(db, current.id, "CREATE_LESSON", "course_lesson", lesson.id, after={"class_id": req.class_id})
    db.commit()
    return LessonResponse.model_validate(lesson)


@router.get("/lessons", response_model=List[LessonResponse], summary="Daftar lesson kelas")
def list_lessons(class_id: int, current: CurrentUser, db: DBSession, chapter_id: Optional[int] = Query(None)):
    require_class_access(db, current, class_id)
    from app.models.lms import CourseLesson
    query = db.query(CourseLesson).filter(CourseLesson.class_id == class_id)
    if chapter_id:
        query = query.filter(CourseLesson.chapter_id == chapter_id)
    lessons = query.order_by(CourseLesson.lesson_number).all()
    return [LessonResponse.model_validate(l) for l in lessons]


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(lesson_id: int, current: RequireLecturer, db: DBSession):
    from app.models.lms import CourseLesson
    lesson = db.get(CourseLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson tidak ditemukan")
    require_class_access(db, current, lesson.class_id)
    db.delete(lesson)
    audit(db, current.id, "DELETE_LESSON", "course_lesson", lesson_id)
    db.commit()


# ============================================================
# COURSE MATERIALS
# ============================================================

@router.post(
    "/materials",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Unggah / buat materi perkuliahan baru",
    description="Dosen mengunggah dokumen/link/catatan materi untuk kelas dan sesi tertentu.",
)
def create_material(req: MaterialCreateRequest, current: RequireLecturer, db: DBSession):
    require_class_access(db, current, req.class_id)
    material = LMSService.create_material(
        db,
        class_id=req.class_id,
        title=req.title,
        material_type=req.material_type,
        session_id=req.session_id,
        description=req.description,
        resource_url=req.resource_url,
        content=req.content,
    )
    audit(db, current.id, "CREATE_MATERIAL", "course_material", material.id, after={"class_id": req.class_id}); db.commit()
    return MaterialResponse.model_validate(material)


@router.get(
    "/materials",
    response_model=List[MaterialResponse],
    summary="Daftar materi kelas",
    description="Menampilkan semua materi untuk satu kelas, opsional difilter per sesi pertemuan.",
)
def list_materials(
    class_id: int,
    current: CurrentUser,
    db: DBSession,
    session_id: Optional[int] = Query(None),
):
    require_class_access(db, current, class_id)
    materials = LMSRepository.list_materials_for_class(db, class_id=class_id, session_id=session_id)
    return [MaterialResponse.model_validate(m) for m in materials]


@router.get(
    "/materials/{material_id}",
    response_model=MaterialResponse,
    summary="Detail materi",
)
def get_material(material_id: int, current: CurrentUser, db: DBSession):
    material = LMSRepository.get_material_by_id(db, material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materi tidak ditemukan")
    require_class_access(db, current, material.class_id)
    return MaterialResponse.model_validate(material)


@router.delete(
    "/materials/{material_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Hapus materi",
)
def delete_material(material_id: int, current: RequireLecturer, db: DBSession):
    material = LMSRepository.get_material_by_id(db, material_id)
    if material: require_class_access(db, current, material.class_id)
    success = LMSRepository.delete_material(db, material_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materi tidak ditemukan")
    audit(db, current.id, "DELETE_MATERIAL", "course_material", material_id); db.commit()


# ============================================================
# ASSIGNMENTS
# ============================================================

@router.post(
    "/assignments",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Buat tugas baru",
    description="Dosen membuat penugasan dengan tenggat waktu (due date) dan bobot nilai.",
)
def create_assignment(req: AssignmentCreateRequest, current: RequireLecturer, db: DBSession):
    require_class_access(db, current, req.class_id)
    assignment = LMSService.create_assignment(
        db,
        class_id=req.class_id,
        title=req.title,
        due_date=req.due_date,
        session_id=req.session_id,
        description=req.description,
        max_score=req.max_score,
        allow_late=req.allow_late,
    )
    audit(db, current.id, "CREATE_ASSIGNMENT", "assignment", assignment.id, after={"class_id": req.class_id}); db.commit()
    return AssignmentResponse.model_validate(assignment)


@router.get(
    "/assignments",
    response_model=List[AssignmentResponse],
    summary="Daftar tugas kelas",
)
def list_assignments(
    class_id: int,
    current: CurrentUser,
    db: DBSession,
    session_id: Optional[int] = Query(None),
):
    require_class_access(db, current, class_id)
    assignments = LMSRepository.list_assignments_for_class(db, class_id=class_id, session_id=session_id)
    results = []
    for a in assignments:
        resp = AssignmentResponse.model_validate(a)
        resp.submission_count = len(a.submissions)
        results.append(resp)
    return results


@router.get(
    "/assignments/{assignment_id}",
    response_model=AssignmentDetailResponse,
    summary="Detail tugas beserta daftar pengumpulan",
)
def get_assignment(assignment_id: int, current: CurrentUser, db: DBSession):
    assignment = LMSRepository.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tugas tidak ditemukan")
    require_class_access(db, current, assignment.class_id)
    resp = AssignmentDetailResponse.model_validate(assignment)
    resp.submission_count = len(assignment.submissions)
    resp.submissions = [SubmissionResponse.model_validate(s) for s in assignment.submissions]
    return resp


@router.get(
    "/assignments/{assignment_id}/summary",
    summary="Statistik dan analitik nilai tugas",
    response_model=dict,
)
def get_assignment_summary(assignment_id: int, current: CurrentUser, db: DBSession):
    assignment = LMSRepository.get_assignment_by_id(db, assignment_id)
    if not assignment: raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    require_class_access(db, current, assignment.class_id)
    return LMSService.get_assignment_summary(db, assignment_id)


@router.delete(
    "/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Hapus tugas",
)
def delete_assignment(assignment_id: int, current: RequireLecturer, db: DBSession):
    assignment = LMSRepository.get_assignment_by_id(db, assignment_id)
    if assignment: require_class_access(db, current, assignment.class_id)
    success = LMSRepository.delete_assignment(db, assignment_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tugas tidak ditemukan")
    audit(db, current.id, "DELETE_ASSIGNMENT", "assignment", assignment_id); db.commit()


# ============================================================
# SUBMISSIONS & GRADING
# ============================================================

@router.post(
    "/assignments/{assignment_id}/submissions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Kumpulkan tugas (Mahasiswa)",
    description="Mahasiswa mengumpulkan tugas (file URL atau teks jawaban). Menandai LATE otomatis jika melewati tenggat waktu.",
)
def submit_assignment(
    assignment_id: int,
    req: SubmissionCreateRequest,
    current: CurrentUser,
    db: DBSession,
):
    assignment = LMSRepository.get_assignment_by_id(db, assignment_id)
    if not assignment: raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    require_class_access(db, current, assignment.class_id)
    sub = LMSService.submit_assignment(
        db,
        assignment_id=assignment_id,
        user_id=current.id,
        file_url=req.file_url,
        content=req.content,
    )
    audit(db, current.id, "SUBMIT_ASSIGNMENT", "assignment_submission", sub.id, after={"assignment_id": assignment_id}); db.commit()
    return SubmissionResponse.model_validate(sub)


@router.get(
    "/assignments/{assignment_id}/submissions",
    response_model=List[SubmissionResponse],
    summary="Daftar pengumpulan tugas kelas (Dosen)",
)
def list_submissions(assignment_id: int, current: RequireLecturer, db: DBSession):
    assignment = LMSRepository.get_assignment_by_id(db, assignment_id)
    if not assignment: raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    require_class_access(db, current, assignment.class_id)
    submissions = LMSRepository.list_submissions_for_assignment(db, assignment_id)
    return [SubmissionResponse.model_validate(s) for s in submissions]


@router.get(
    "/assignments/{assignment_id}/my-submission",
    response_model=Optional[SubmissionResponse],
    summary="Lihat pengumpulan tugas pribadi (Mahasiswa)",
)
def get_my_submission(
    assignment_id: int,
    current: CurrentUser,
    db: DBSession,
):
    assignment = LMSRepository.get_assignment_by_id(db, assignment_id)
    if not assignment: raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    require_class_access(db, current, assignment.class_id)
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil mahasiswa tidak ditemukan")
    sub = LMSRepository.get_submission(db, assignment_id, student.id)
    if not sub:
        return None
    return SubmissionResponse.model_validate(sub)


@router.put(
    "/submissions/{submission_id}/grade",
    response_model=SubmissionResponse,
    summary="Beri nilai dan umpan balik tugas (Dosen)",
)
def grade_submission(
    submission_id: int,
    req: GradeSubmissionRequest,
    current: RequireLecturer,
    db: DBSession,
):
    submission = db.get(AssignmentSubmission, submission_id)
    if not submission: raise HTTPException(status_code=404, detail="Pengumpulan tidak ditemukan")
    assignment = LMSRepository.get_assignment_by_id(db, submission.assignment_id)
    require_class_access(db, current, assignment.class_id)
    graded = LMSService.grade_submission(
        db,
        submission_id=submission_id,
        score=req.score,
        feedback=req.feedback,
        grader_user_id=current.id,
    )
    audit(db, current.id, "CREATE_GRADE", "assignment_submission", submission_id, after={"score": req.score}); db.commit()
    return SubmissionResponse.model_validate(graded)


@router.get(
    "/students/{student_id}/submissions",
    response_model=List[SubmissionResponse],
    summary="Riwayat pengumpulan tugas mahasiswa",
)
def list_student_submissions(
    student_id: int,
    current: CurrentUser,
    db: DBSession,
    class_id: Optional[int] = Query(None),
):
    if current.role == UserRole.MAHASISWA:
        own = StudentRepository.get_by_user_id(db, current.id)
        if not own or own.id != student_id: raise HTTPException(status_code=403, detail="Tidak dapat melihat submission mahasiswa lain")
    if class_id: require_class_access(db, current, class_id)
    submissions = LMSRepository.list_student_submissions(db, student_id=student_id, class_id=class_id)
    return [SubmissionResponse.model_validate(s) for s in submissions]


# ============================================================
# QUIZZES
# ============================================================

@router.post(
    "/quizzes",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Buat kuis baru",
    description="Dosen membuat kuis dengan passing score dan max attempts.",
)
def create_quiz(req: QuizCreateRequest, current: RequireLecturer, db: DBSession):
    require_class_access(db, current, req.class_id)
    from app.models.lms import Quiz
    quiz = Quiz(
        class_id=req.class_id,
        lesson_id=req.lesson_id,
        session_id=req.session_id,
        title=req.title,
        description=req.description,
        passing_score=req.passing_score,
        max_attempts=req.max_attempts,
        time_limit_minutes=req.time_limit_minutes,
        shuffle_questions=req.shuffle_questions,
        is_published=req.is_published,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    audit(db, current.id, "CREATE_QUIZ", "quiz", quiz.id, after={"class_id": req.class_id})
    db.commit()
    return QuizResponse.model_validate(quiz)


@router.get("/quizzes", response_model=List[QuizResponse], summary="Daftar kuis kelas")
def list_quizzes(class_id: int, current: CurrentUser, db: DBSession):
    require_class_access(db, current, class_id)
    from app.models.lms import Quiz
    quizzes = db.query(Quiz).filter(Quiz.class_id == class_id).all()
    return [QuizResponse.model_validate(q) for q in quizzes]


@router.get("/quizzes/{quiz_id}", response_model=QuizDetailResponse, summary="Detail kuis beserta pertanyaan & opsi")
def get_quiz_detail(quiz_id: int, current: CurrentUser, db: DBSession):
    from app.models.lms import Quiz
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Kuis tidak ditemukan")
    require_class_access(db, current, quiz.class_id)
    
    resp = QuizDetailResponse.model_validate(quiz)
    if current.role in (UserRole.MAHASISWA, UserRole.KETUA_KELAS):
        for q in resp.questions:
            for opt in q.options:
                opt.is_correct = False
    return resp


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Hapus kuis (Dosen)")
def delete_quiz(quiz_id: int, current: RequireLecturer, db: DBSession):
    from app.models.lms import Quiz
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Kuis tidak ditemukan")
    require_class_access(db, current, quiz.class_id)
    audit(db, current.id, "DELETE_QUIZ", "quiz", quiz.id, before={"title": quiz.title})
    db.delete(quiz)
    db.commit()
    return None


@router.get("/quizzes/{quiz_id}/submissions", response_model=List[QuizSubmissionResponse], summary="Daftar submission kuis")
def list_quiz_submissions(quiz_id: int, current: CurrentUser, db: DBSession):
    from app.models.lms import Quiz, QuizSubmission
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Kuis tidak ditemukan")
    require_class_access(db, current, quiz.class_id)
    query = db.query(QuizSubmission).filter(QuizSubmission.quiz_id == quiz_id)
    if current.role in (UserRole.MAHASISWA, UserRole.KETUA_KELAS):
        student = StudentRepository.get_by_user_id(db, current.id)
        if not student:
            return []
        query = query.filter(QuizSubmission.student_id == student.id)
    submissions = query.order_by(QuizSubmission.attempt_number.desc()).all()
    return [QuizSubmissionResponse.model_validate(s) for s in submissions]


@router.post(
    "/quizzes/{quiz_id}/questions",
    response_model=QuizQuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tambah pertanyaan kuis",
)
def create_quiz_question(quiz_id: int, req: QuizQuestionCreateRequest, current: RequireLecturer, db: DBSession):
    from app.models.lms import Quiz, QuizQuestion
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Kuis tidak ditemukan")
    require_class_access(db, current, quiz.class_id)
    question = QuizQuestion(
        quiz_id=quiz_id,
        question_text=req.question_text,
        question_type=req.question_type,
        points=req.points,
        question_number=req.question_number,
        explanation=req.explanation,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    audit(db, current.id, "CREATE_QUIZ_QUESTION", "quiz_question", question.id, after={"quiz_id": quiz_id})
    db.commit()
    return QuizQuestionResponse.model_validate(question)


@router.post(
    "/questions/{question_id}/options",
    response_model=QuizOptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tambah opsi jawaban",
)
def create_quiz_option(question_id: int, req: QuizOptionCreateRequest, current: RequireLecturer, db: DBSession):
    from app.models.lms import QuizQuestion, QuizOption
    question = db.get(QuizQuestion, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Pertanyaan tidak ditemukan")
    quiz = db.get(Quiz, question.quiz_id)
    require_class_access(db, current, quiz.class_id)
    option = QuizOption(
        question_id=question_id,
        option_text=req.option_text,
        is_correct=req.is_correct,
        option_number=req.option_number,
    )
    db.add(option)
    db.commit()
    db.refresh(option)
    return QuizOptionResponse.model_validate(option)


@router.post(
    "/quizzes/{quiz_id}/submit",
    response_model=QuizSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit jawaban kuis (Mahasiswa)",
)
def submit_quiz(quiz_id: int, req: QuizSubmissionCreateRequest, current: CurrentUser, db: DBSession):
    from app.models.lms import Quiz, QuizSubmission, QuizAnswer, QuizQuestion, QuizOption
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        raise HTTPException(status_code=404, detail="Profil mahasiswa tidak ditemukan")
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Kuis tidak ditemukan")
    require_class_access(db, current, quiz.class_id)
    
    # Check attempts
    existing_attempts = db.query(QuizSubmission).filter(
        QuizSubmission.quiz_id == quiz_id,
        QuizSubmission.student_id == student.id
    ).count()
    if existing_attempts >= quiz.max_attempts:
        raise HTTPException(status_code=400, detail="Maksimal percobaan tercapai")
    
    submission = QuizSubmission(
        quiz_id=quiz_id,
        student_id=student.id,
        attempt_number=existing_attempts + 1,
        score=0.0,
        passed=False,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    total_points = 0
    earned_points = 0
    
    for answer_req in req.answers:
        question = db.get(QuizQuestion, answer_req.question_id)
        if question:
            total_points += question.points
            is_correct = False
            points_earned = 0.0
            
            if question.points > 0:
                if answer_req.selected_option_id:
                    option = db.get(QuizOption, answer_req.selected_option_id)
                    if option and option.is_correct:
                        is_correct = True
                        points_earned = question.points
                        earned_points += question.points
            
            answer = QuizAnswer(
                submission_id=submission.id,
                question_id=answer_req.question_id,
                selected_option_id=answer_req.selected_option_id,
                text_answer=answer_req.text_answer,
                is_correct=is_correct,
                points_earned=points_earned,
            )
            db.add(answer)
    
    if total_points > 0:
        submission.score = (earned_points / total_points) * 100
    submission.passed = submission.score >= quiz.passing_score
    db.commit()
    db.refresh(submission)
    
    audit(db, current.id, "SUBMIT_QUIZ", "quiz_submission", submission.id, after={"score": submission.score})
    db.commit()
    return QuizSubmissionResponse.model_validate(submission)


# ============================================================
# PROGRESS
# ============================================================

@router.get(
    "/lessons/{lesson_id}/progress",
    response_model=Optional[LessonProgressResponse],
    summary="Progress lesson mahasiswa",
)
def get_lesson_progress(lesson_id: int, current: CurrentUser, db: DBSession):
    from app.models.lms import CourseLesson, LessonProgress
    lesson = db.get(CourseLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson tidak ditemukan")
    require_class_access(db, current, lesson.class_id)
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        return None
    progress = db.query(LessonProgress).filter(
        LessonProgress.lesson_id == lesson_id,
        LessonProgress.student_id == student.id
    ).first()
    if progress:
        return LessonProgressResponse.model_validate(progress)
    return None


@router.put(
    "/lessons/{lesson_id}/progress",
    response_model=LessonProgressResponse,
    summary="Update progress lesson (Mahasiswa)",
)
def update_lesson_progress(lesson_id: int, current: CurrentUser, db: DBSession, progress_percentage: float = Query(..., ge=0, le=100)):
    from app.models.lms import CourseLesson, LessonProgress
    lesson = db.get(CourseLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson tidak ditemukan")
    require_class_access(db, current, lesson.class_id)
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        raise HTTPException(status_code=404, detail="Profil mahasiswa tidak ditemukan")
    
    progress = db.query(LessonProgress).filter(
        LessonProgress.lesson_id == lesson_id,
        LessonProgress.student_id == student.id
    ).first()
    
    is_completed = progress_percentage >= 100
    if not progress:
        progress = LessonProgress(
            lesson_id=lesson_id,
            student_id=student.id,
            is_completed=is_completed,
            progress_percentage=progress_percentage,
        )
        db.add(progress)
    else:
        progress.progress_percentage = progress_percentage
        progress.is_completed = is_completed
        if is_completed and not progress.completed_at:
            progress.completed_at = datetime.now()
    
    db.commit()
    db.refresh(progress)
    return LessonProgressResponse.model_validate(progress)


@router.get(
    "/classes/{class_id}/progress",
    response_model=Optional[CourseProgressResponse],
    summary="Progress total kelas mahasiswa",
)
def get_course_progress(class_id: int, current: CurrentUser, db: DBSession):
    from app.models.lms import CourseProgress, CourseLesson
    require_class_access(db, current, class_id)
    student = StudentRepository.get_by_user_id(db, current.id)
    if not student:
        return None
    progress = db.query(CourseProgress).filter(
        CourseProgress.class_id == class_id,
        CourseProgress.student_id == student.id
    ).first()
    if progress:
        return CourseProgressResponse.model_validate(progress)
    return None


# ============================================================
# GRADING
# ============================================================

@router.get(
    "/classes/{class_id}/grades",
    response_model=List[GradeResponse],
    summary="Semua nilai kelas (Dosen/Admin)",
)
def get_class_grades(class_id: int, current: CurrentUser, db: DBSession):
    require_class_access(db, current, class_id)
    if current.role not in [UserRole.ADMIN, UserRole.DOSEN]:
        raise HTTPException(status_code=403, detail="Hanya dosen dan admin")
    grades = GradingService.get_class_grades(db, class_id)
    return [GradeResponse.model_validate(g) for g in grades]


@router.get(
    "/classes/{class_id}/students/{student_id}/grade",
    response_model=Optional[GradeResponse],
    summary="Nilai mahasiswa spesifik",
)
def get_student_grade(class_id: int, student_id: int, current: CurrentUser, db: DBSession):
    require_class_access(db, current, class_id)
    grade = GradingService.get_student_grade(db, class_id, student_id)
    if grade:
        return GradeResponse.model_validate(grade)
    return None


@router.put(
    "/classes/{class_id}/students/{student_id}/grade",
    response_model=GradeResponse,
    summary="Update komponen nilai (Dosen/Admin)",
)
def update_grade(
    class_id: int,
    student_id: int,
    req: GradeUpdateRequest,
    current: CurrentUser,
    db: DBSession,
):
    require_class_access(db, current, class_id)
    if current.role not in [UserRole.ADMIN, UserRole.DOSEN]:
        raise HTTPException(status_code=403, detail="Hanya dosen dan admin")
    
    grade = GradingService.update_component_score(
        db, class_id, student_id, req.component, req.score, current.id
    )
    audit(db, current.id, f"UPDATE_GRADE_{req.component.upper()}", "student_grade", grade.id, 
          after={"component": req.component, "score": req.score})
    db.commit()
    return GradeResponse.model_validate(grade)


@router.post(
    "/classes/{class_id}/grades/calculate",
    response_model=List[GradeResponse],
    summary="Hitung ulang semua nilai kelas (Dosen/Admin)",
)
def calculate_class_grades(
    class_id: int,
    req: GradeCalculateRequest,
    current: CurrentUser,
    db: DBSession,
):
    require_class_access(db, current, class_id)
    if current.role not in [UserRole.ADMIN, UserRole.DOSEN]:
        raise HTTPException(status_code=403, detail="Hanya dosen dan admin")
    
    grades = GradingService.calculate_all_for_class(db, class_id, current.id)
    audit(db, current.id, "CALCULATE_CLASS_GRADES", "course_class", class_id,
          after={"recalculate_attendance": req.recalculate_attendance})
    db.commit()
    return [GradeResponse.model_validate(g) for g in grades]
