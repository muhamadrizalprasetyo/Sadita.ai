"""
SADITA — User, Student, and Lecturer Repositories
Data access functions using SQLAlchemy Session.
"""
from __future__ import annotations

from typing import Any, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.user import User, UserRole
from app.models.student import StudentProfile, KtmStatus
from app.models.lecturer import LecturerProfile


class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.scalar(
            select(User)
            .options(
                joinedload(User.student_profile),
                joinedload(User.lecturer_profile),
            )
            .where(User.id == user_id)
        )

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.scalar(
            select(User)
            .options(
                joinedload(User.student_profile),
                joinedload(User.lecturer_profile),
            )
            .where(User.email == email.lower().strip())
        )

    @staticmethod
    def create(
        db: Session,
        *,
        email: str,
        password_hash: str,
        full_name: str,
        role: UserRole = UserRole.MAHASISWA,
        is_active: bool = True,
    ) -> User:
        user = User(
            email=email.lower().strip(),
            password_hash=password_hash,
            full_name=full_name.strip(),
            role=role,
            is_active=is_active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def list(
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        role: Optional[UserRole] = None,
    ) -> List[User]:
        stmt = (
            select(User)
            .options(
                joinedload(User.student_profile),
                joinedload(User.lecturer_profile),
            )
            .order_by(User.id)
            .offset(skip)
            .limit(limit)
        )
        if role:
            stmt = stmt.where(User.role == role)
        return list(db.scalars(stmt).unique().all())

    @staticmethod
    def update(
        db: Session,
        user_id: int,
        *,
        full_name: Optional[str] = None,
        email: Optional[str] = None,
        is_active: Optional[bool] = None,
        password_hash: Optional[str] = None,
        role: Optional[UserRole] = None,
    ) -> Optional[User]:
        user = db.get(User, user_id)
        if not user:
            return None
        if full_name is not None:
            user.full_name = full_name.strip()
        if email is not None:
            user.email = email.lower().strip()
        if is_active is not None:
            user.is_active = is_active
        if password_hash is not None:
            user.password_hash = password_hash
        if role is not None:
            user.role = role
        db.commit()
        db.refresh(user)
        return UserRepository.get_by_id(db, user_id)

    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        user = db.get(User, user_id)
        if not user:
            return False
        db.delete(user)
        db.commit()
        return True


class StudentRepository:
    @staticmethod
    def get_by_id(db: Session, student_id: int) -> Optional[StudentProfile]:
        return db.scalar(
            select(StudentProfile)
            .options(joinedload(StudentProfile.user))
            .where(StudentProfile.id == student_id)
        )

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[StudentProfile]:
        return db.scalar(
            select(StudentProfile)
            .options(joinedload(StudentProfile.user))
            .where(StudentProfile.user_id == user_id)
        )

    @staticmethod
    def get_by_nim(db: Session, nim: str) -> Optional[StudentProfile]:
        return db.scalar(
            select(StudentProfile)
            .options(joinedload(StudentProfile.user))
            .where(StudentProfile.nim == nim.strip())
        )

    @staticmethod
    def get_by_rfid(db: Session, rfid_uid: str) -> Optional[StudentProfile]:
        """Look up student by RFID card UID using RfidCredential table."""
        if not rfid_uid:
            return None
        from sqlalchemy import func
        from app.models.credential import RfidCredential

        uid_clean = rfid_uid.strip().upper()
        cred = db.scalar(
            select(RfidCredential).where(
                func.upper(RfidCredential.uid) == uid_clean,
                RfidCredential.is_active == True,
            )
        )
        if cred and cred.student_id:
            return db.scalar(
                select(StudentProfile)
                .options(
                    joinedload(StudentProfile.user),
                    joinedload(StudentProfile.rfid_credentials),
                    joinedload(StudentProfile.fingerprint_credentials),
                    joinedload(StudentProfile.program_studi),
                )
                .where(StudentProfile.id == cred.student_id)
            )
        return None

    @staticmethod
    def get_by_fingerprint_id(
        db: Session, template_id: int, device_id: Optional[str] = None
    ) -> Optional[StudentProfile]:
        """Look up student by optical fingerprint template slot index."""
        from app.models.credential import FingerprintCredential

        stmt = select(FingerprintCredential).where(
            FingerprintCredential.template_slot == template_id,
            FingerprintCredential.is_active == True,
        )
        if device_id:
            stmt = stmt.where(FingerprintCredential.device_id == device_id)
        cred = db.scalar(stmt)
        if cred and cred.student_id:
            return db.scalar(
                select(StudentProfile)
                .options(
                    joinedload(StudentProfile.user),
                    joinedload(StudentProfile.rfid_credentials),
                    joinedload(StudentProfile.fingerprint_credentials),
                    joinedload(StudentProfile.program_studi),
                )
                .where(StudentProfile.id == cred.student_id)
            )
        return None

    @staticmethod
    def create(
        db: Session,
        *,
        user_id: int,
        nim: str,
        department: str = "Teknik Informatika",
        prodi_id: Optional[int] = None,
        batch_year: int = 2024,
        academic_cohort: int = 1,
        class_type: Optional[ClassType] = None,
        phone: Optional[str] = None,
        rfid_uid: Optional[str] = None,
        fingerprint_template_id: Optional[int] = None,
        device_id: str = "SADITA-ESP32-LAB-01",
        ktm_status: Optional[KtmStatus] = None,
    ) -> StudentProfile:
        from app.models.program_studi import ProgramStudi
        from app.models.credential import RfidCredential, FingerprintCredential
        from app.models.academic import ClassType as MClassType

        if not prodi_id:
            prodi = db.scalar(select(ProgramStudi).where(ProgramStudi.nama == department.strip()))
            if not prodi:
                prodi = db.scalar(select(ProgramStudi))
            if not prodi:
                prodi = ProgramStudi(kode="TI", nama=department.strip(), jenjang="S1")
                db.add(prodi)
                db.flush()
            prodi_id = prodi.id

        if ktm_status is None:
            if rfid_uid:
                ktm_status = KtmStatus.KTM_TERDAFTAR
            else:
                ktm_status = KtmStatus.BELUM_MEMILIKI_KTM

        student = StudentProfile(
            user_id=user_id,
            prodi_id=prodi_id,
            nim=nim.strip(),
            angkatan=batch_year,
            academic_cohort=academic_cohort,
            class_type=class_type or MClassType.REGULER_PAGI,
            ktm_status=ktm_status,
            phone=phone.strip() if phone else None,
        )
        db.add(student)
        db.flush()

        if rfid_uid:
            rfid = RfidCredential(
                student_id=student.id,
                uid=rfid_uid.strip().upper(),
                is_active=True,
            )
            db.add(rfid)

        if fingerprint_template_id is not None:
            fp = FingerprintCredential(
                student_id=student.id,
                device_id=device_id,
                template_slot=fingerprint_template_id,
                finger_label="Telunjuk Kanan",
                is_active=True,
            )
            db.add(fp)

        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def update_hardware(
        db: Session,
        student_id: int,
        *,
        rfid_uid: Optional[str] = None,
        fingerprint_template_id: Optional[int] = None,
        device_id: str = "SADITA-ESP32-LAB-01",
    ) -> Optional[StudentProfile]:
        from sqlalchemy import func

        from app.models.credential import RfidCredential, FingerprintCredential

        student = db.get(StudentProfile, student_id)
        if not student:
            return None

        if rfid_uid is not None:
            uid_clean = rfid_uid.strip().upper() if rfid_uid else None

            # Deactivate all active RFID credentials for this student, then ensure the
            # incoming UID is unique and active without violating the unique index.
            for cred in student.rfid_credentials:
                if cred.is_active:
                    cred.is_active = False

            if uid_clean:
                existing_same_uid = db.scalar(
                    select(RfidCredential).where(
                        func.upper(RfidCredential.uid) == uid_clean,
                    )
                )

                if existing_same_uid and existing_same_uid.student_id != student.id:
                    existing_same_uid.is_active = False

                existing_for_student = next(
                    (cred for cred in student.rfid_credentials if cred.uid.upper() == uid_clean),
                    None,
                )
                if existing_for_student:
                    existing_for_student.is_active = True
                else:
                    db.add(
                        RfidCredential(
                            student_id=student.id,
                            uid=uid_clean,
                            is_active=True,
                        )
                    )
                student.ktm_status = KtmStatus.KTM_TERDAFTAR
            else:
                student.ktm_status = KtmStatus.BELUM_MEMILIKI_KTM

        if fingerprint_template_id is not None:
            # Deactivate all active fingerprint credentials for this student on this device
            for fp in student.fingerprint_credentials:
                if fp.device_id == device_id and fp.is_active:
                    fp.is_active = False

            # Flush deactivation before INSERT to avoid UniqueConstraint violation
            # (uq_device_template_slot) when the same slot is being reassigned
            db.flush()

            # Check if an entry with this exact (device_id, template_slot) already exists
            # for THIS student — if so, just reactivate it instead of inserting a new one
            existing_slot = next(
                (
                    fp for fp in student.fingerprint_credentials
                    if fp.device_id == device_id and fp.template_slot == fingerprint_template_id
                ),
                None,
            )
            if existing_slot:
                existing_slot.is_active = True
            else:
                db.add(
                    FingerprintCredential(
                        student_id=student.id,
                        device_id=device_id,
                        template_slot=fingerprint_template_id,
                        finger_label="Telunjuk Kanan",
                        is_active=True,
                    )
                )

        db.commit()
        db.expire(student)
        db.refresh(student)
        return student

    @staticmethod
    def list(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        cohort: Optional[int] = None,
        class_type: Optional[Any] = None,
    ) -> List[StudentProfile]:
        stmt = (
            select(StudentProfile)
            .options(joinedload(StudentProfile.user))
            .order_by(StudentProfile.nim)
        )
        if cohort is not None:
            stmt = stmt.where(StudentProfile.academic_cohort == cohort)
        if class_type is not None:
            stmt = stmt.where(StudentProfile.class_type == class_type)
        return list(
            db.scalars(stmt.offset(skip).limit(limit)).unique().all()
        )

    @staticmethod
    def update_profile(
        db: Session,
        student_id: int,
        *,
        academic_cohort: Optional[int] = None,
        class_type: Optional[Any] = None,
        phone: Optional[str] = None,
        batch_year: Optional[int] = None,
    ) -> Optional[StudentProfile]:
        student = db.get(StudentProfile, student_id)
        if not student:
            return None
        if academic_cohort is not None:
            student.academic_cohort = academic_cohort
        if class_type is not None:
            student.class_type = class_type
        if phone is not None:
            student.phone = phone.strip() if phone else None
        if batch_year is not None:
            student.angkatan = batch_year
        db.commit()
        db.refresh(student)
        return student



class LecturerRepository:
    @staticmethod
    def get_by_id(db: Session, lecturer_id: int) -> Optional[LecturerProfile]:
        return db.scalar(
            select(LecturerProfile)
            .options(joinedload(LecturerProfile.user))
            .where(LecturerProfile.id == lecturer_id)
        )

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[LecturerProfile]:
        return db.scalar(
            select(LecturerProfile)
            .options(joinedload(LecturerProfile.user))
            .where(LecturerProfile.user_id == user_id)
        )

    @staticmethod
    def get_by_nidn(db: Session, nidn: str) -> Optional[LecturerProfile]:
        return db.scalar(
            select(LecturerProfile)
            .options(joinedload(LecturerProfile.user))
            .where(LecturerProfile.nidn == nidn.strip())
        )

    @staticmethod
    def create(
        db: Session,
        *,
        user_id: int,
        nidn: str,
        department: str = "Teknik Informatika",
        phone: Optional[str] = None,
    ) -> LecturerProfile:
        lecturer = LecturerProfile(
            user_id=user_id,
            nidn=nidn.strip(),
            department=department.strip(),
            phone=phone.strip() if phone else None,
        )
        db.add(lecturer)
        db.commit()
        db.refresh(lecturer)
        return lecturer

    @staticmethod
    def list(db: Session, skip: int = 0, limit: int = 100) -> List[LecturerProfile]:
        return list(
            db.scalars(
                select(LecturerProfile)
                .options(joinedload(LecturerProfile.user))
                .order_by(LecturerProfile.nidn)
                .offset(skip)
                .limit(limit)
            ).unique().all()
        )
