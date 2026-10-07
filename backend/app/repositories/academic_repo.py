"""
SADITA — Academic Repositories
Data access for terms, courses, classes, enrollments.
"""
from __future__ import annotations

from datetime import date, time
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.academic import (
    AcademicTerm,
    ClassRoom,
    ClassEnrollment,
    ClassType,
    Course,
    CourseClass,
)


class AcademicRepository:
    # --- Terms ---
    @staticmethod
    def create_term(
        db: Session,
        *,
        name: str,
        start_date: date,
        end_date: date,
        is_active: bool = True,
    ) -> AcademicTerm:
        term = AcademicTerm(
            nama=name.strip(),
            tanggal_mulai=start_date,
            tanggal_selesai=end_date,
            is_active=is_active,
        )
        db.add(term)
        db.commit()
        db.refresh(term)
        return term

    @staticmethod
    def get_active_term(db: Session) -> Optional[AcademicTerm]:
        return db.scalar(select(AcademicTerm).where(AcademicTerm.is_active == True))

    @staticmethod
    def list_terms(db: Session) -> List[AcademicTerm]:
        return list(db.scalars(select(AcademicTerm).order_by(AcademicTerm.id.desc())).all())

    # --- Courses ---
    @staticmethod
    def create_course(
        db: Session,
        *,
        code: str,
        name: str,
        credits: int = 3,
        description: Optional[str] = None,
        prodi_id: Optional[int] = None,
    ) -> Course:
        from app.models.program_studi import ProgramStudi

        if not prodi_id:
            prodi = db.scalar(select(ProgramStudi))
            if not prodi:
                prodi = ProgramStudi(kode="TI", nama="Teknik Informatika", jenjang="S1")
                db.add(prodi)
                db.flush()
            prodi_id = prodi.id

        course = Course(
            prodi_id=prodi_id,
            kode=code.upper().strip(),
            nama=name.strip(),
            sks=credits,
            deskripsi=description,
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        return course

    @staticmethod
    def get_course_by_code(db: Session, code: str) -> Optional[Course]:
        return db.scalar(select(Course).where(Course.kode == code.upper().strip()))

    @staticmethod
    def list_courses(db: Session) -> List[Course]:
        return list(db.scalars(select(Course).order_by(Course.kode)).all())

    # --- Rooms ---
    @staticmethod
    def create_room(
        db: Session, *, name: str, capacity: int = 40, kode: Optional[str] = None
    ) -> ClassRoom:
        room_kode = kode or (name[:10].replace(" ", "-").upper())
        room = ClassRoom(kode=room_kode, nama=name.strip(), kapasitas=capacity)
        db.add(room)
        db.commit()
        db.refresh(room)
        return room

    @staticmethod
    def list_rooms(db: Session) -> List[ClassRoom]:
        return list(db.scalars(select(ClassRoom).order_by(ClassRoom.nama)).all())

    # --- Classes ---
    @staticmethod
    def create_class(
        db: Session,
        *,
        name: str,
        course_id: int,
        term_id: int,
        lecturer_id: int,
        room_id: Optional[int] = None,
        day_of_week: int = 1,
        start_time: time,
        end_time: time,
        class_type: Optional[ClassType] = None,
        is_active: bool = True,
    ) -> CourseClass:
        course_class = CourseClass(
            kode_kelas=name.strip(),
            class_type=class_type or ClassType.REGULER_PAGI,
            course_id=course_id,
            term_id=term_id,
            lecturer_id=lecturer_id,
            room_id=room_id,
            hari=day_of_week,
            jam_mulai=start_time,
            jam_selesai=end_time,
            is_active=is_active,
        )
        db.add(course_class)
        db.commit()
        db.refresh(course_class)
        return course_class

    @staticmethod
    def get_class_by_id(db: Session, class_id: int) -> Optional[CourseClass]:
        return db.scalar(
            select(CourseClass)
            .options(
                joinedload(CourseClass.course),
                joinedload(CourseClass.term),
                joinedload(CourseClass.lecturer),
                joinedload(CourseClass.room),
            )
            .where(CourseClass.id == class_id)
        )

    @staticmethod
    def list_classes(
        db: Session,
        term_id: Optional[int] = None,
        lecturer_id: Optional[int] = None,
    ) -> List[CourseClass]:
        stmt = (
            select(CourseClass)
            .options(
                joinedload(CourseClass.course),
                joinedload(CourseClass.term),
                joinedload(CourseClass.lecturer),
                joinedload(CourseClass.room),
            )
            .order_by(CourseClass.id)
        )
        if term_id:
            stmt = stmt.where(CourseClass.term_id == term_id)
        if lecturer_id:
            stmt = stmt.where(CourseClass.lecturer_id == lecturer_id)
        return list(db.scalars(stmt).unique().all())

    # --- Enrollments ---
    @staticmethod
    def enroll_student(
        db: Session,
        class_id: int,
        student_id: int,
        status: str = "AKTIF",
    ) -> ClassEnrollment:
        from app.models.academic import EnrollmentStatus

        status_enum = EnrollmentStatus.AKTIF
        if isinstance(status, str):
            status_clean = status.upper().strip()
            if status_clean in ("ACTIVE", "AKTIF"):
                status_enum = EnrollmentStatus.AKTIF
            elif status_clean == "DROP":
                status_enum = EnrollmentStatus.DROP
            elif status_clean == "CUTI":
                status_enum = EnrollmentStatus.CUTI
            elif status_clean == "LULUS":
                status_enum = EnrollmentStatus.LULUS
        elif isinstance(status, EnrollmentStatus):
            status_enum = status

        enrollment = ClassEnrollment(
            class_id=class_id,
            student_id=student_id,
            status=status_enum,
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return enrollment

    @staticmethod
    def get_enrollments(db: Session, class_id: int) -> List[ClassEnrollment]:
        return list(
            db.scalars(
                select(ClassEnrollment)
                .options(joinedload(ClassEnrollment.student))
                .where(ClassEnrollment.class_id == class_id)
            ).unique().all()
        )
