"""
SADITA — Schedule & Lecturer Accounts Seeder
Seeder otomatis dari Jadwal Perkuliahan TEKFO 1 - TEKFO 8
Membuat akun Dosen, Mata Kuliah, Ruang, dan Kelas sesuai gambar jadwal.
"""
from datetime import date, time
from sqlalchemy import select
from app.core.security import hash_password
from app.db.session import SessionLocal
import app.models  # register all models
from app.models.academic import (
    AcademicTerm,
    ClassEnrollment,
    ClassRoom,
    ClassType,
    Course,
    CourseClass,
    EnrollmentStatus,
    EnrollmentType,
)
from app.models.lecturer import LecturerProfile
from app.models.program_studi import ProgramStudi
from app.models.student import StudentProfile
from app.models.user import User, UserRole

DEFAULT_PWD_HASH = hash_password("dosen123")

LECTURERS_DATA = [
    {"name": "Ferdi, M.Kom.", "email": "ferdi@unipi.ac.id", "nidn": "0401018801"},
    {"name": "Nurul, M.Kom.", "email": "nurul@unipi.ac.id", "nidn": "0402028802"},
    {"name": "Alifah, M.Pd.I.", "email": "alifah@unipi.ac.id", "nidn": "0403038803"},
    {"name": "Henry, M.Kom.", "email": "henry@unipi.ac.id", "nidn": "0404048804"},
    {"name": "Riyanto, M.Kom.", "email": "riyanto@unipi.ac.id", "nidn": "0405058805"},
    {"name": "Fathiroh, M.Pd.", "email": "fathiroh@unipi.ac.id", "nidn": "0406068806"},
    {"name": "Rifah, M.Kom.", "email": "rifah@unipi.ac.id", "nidn": "0407078807"},
    {"name": "Imam, M.Kom.", "email": "imam@unipi.ac.id", "nidn": "0408088808"},
    {"name": "Nyoman, M.Kom.", "email": "nyoman@unipi.ac.id", "nidn": "0409098809"},
    {"name": "Aris, M.Hum.", "email": "aris@unipi.ac.id", "nidn": "0410108810"},
    {"name": "Rintis, M.Kom.", "email": "rintis@unipi.ac.id", "nidn": "0411118811"},
    {"name": "Beby, M.Kom.", "email": "beby@unipi.ac.id", "nidn": "0412128812"},
    {"name": "Yulis, M.Kom.", "email": "yulis@unipi.ac.id", "nidn": "0413138813"},
    {"name": "Reksa, M.Kom.", "email": "reksa@unipi.ac.id", "nidn": "0414148814"},
    {"name": "Cipto, M.Kom.", "email": "cipto@unipi.ac.id", "nidn": "0415158815"},
    {"name": "Yoga, M.Kom.", "email": "yoga@unipi.ac.id", "nidn": "0416168816"},
    {"name": "Nuri, M.Kom.", "email": "nuri@unipi.ac.id", "nidn": "0417178817"},
    {"name": "Arfan, M.H.", "email": "arfan@unipi.ac.id", "nidn": "0418188818"},
    {"name": "Erly, M.Kom.", "email": "erly@unipi.ac.id", "nidn": "0419198819"},
    {"name": "Eva, M.Pd.", "email": "eva@unipi.ac.id", "nidn": "0420208820"},
    {"name": "Jum, M.Kom.", "email": "jum@unipi.ac.id", "nidn": "0421218821"},
    {"name": "Andi, M.Kom.", "email": "andi@unipi.ac.id", "nidn": "0422228822"},
    {"name": "Bamb, M.Kom.", "email": "bamb@unipi.ac.id", "nidn": "0423238823"},
    {"name": "Rukmana, M.Kom.", "email": "rukmana@unipi.ac.id", "nidn": "0424248824"},
    {"name": "Yusuf, M.Kom.", "email": "yusuf@unipi.ac.id", "nidn": "0425258825"},
    {"name": "Mano, M.Kom.", "email": "mano@unipi.ac.id", "nidn": "0426268826"},
]

# Schedule entries from the spreadsheet:
# (cohort, course_code, course_name, credits, lecturer_key, room_code, day_of_week, start_time, end_time)
SCHEDULE_ENTRIES = [
    # --- SENIN (day 1) ---
    ("TEKFO. 1", "MAT101", "Matematika 1", 3, "ferdi", "FB303", 1, time(9, 0), time(10, 30)),
    ("TEKFO. 1", "IMK101", "Interaksi Manusia & Komp.", 3, "nurul", "FB303", 1, time(10, 30), time(12, 0)),
    ("TEKFO. 2", "AGM101", "Pendidikan Agama", 2, "alifah", "FB202", 1, time(9, 0), time(10, 30)),
    ("TEKFO. 2", "SBD101", "Sistem Basis Data", 3, "henry", "FB202", 1, time(10, 30), time(12, 0)),
    ("TEKFO. 3", "JNR101", "Jaringan Nirkabel", 3, "riyanto", "FK407", 1, time(9, 0), time(10, 30)),
    ("TEKFO. 3", "BIN101", "Bahasa Indonesia", 2, "fathiroh", "FK407", 1, time(10, 30), time(12, 0)),
    ("TEKFO. 4", "KIM101", "Kimia", 2, "rifah", "FK205", 1, time(10, 30), time(12, 0)),
    ("TEKFO. 5", "TCP101", "Technopreneur", 2, "nurul", "FB406", 1, time(9, 0), time(10, 30)),
    ("TEKFO. 5", "AIS101", "Arsitektur & Integ Sist", 3, "rifah", "FK201", 1, time(9, 0), time(10, 30)),
    ("TEKFO. 5", "PIN101", "Pemrog. Integratif", 3, "ferdi", "FK201", 1, time(10, 30), time(12, 0)),
    ("TEKFO. 6", "WAT101", "Wawasan & Apk. Teknologi", 2, "henry", "FB401", 1, time(9, 0), time(10, 30)),
    ("TEKFO. 6", "SMC101", "Tech. Smart City", 3, "imam", "FB401", 1, time(10, 30), time(12, 0)),
    ("TEKFO. 8", "SKR101", "Skripsi", 6, "henry", "FB401", 1, time(9, 0), time(12, 0)),

    # --- SELASA (day 2) ---
    ("TEKFO. 1", "OAK101", "Org. & Arsitektur Komp.", 3, "nyoman", "FK403", 2, time(9, 0), time(10, 30)),
    ("TEKFO. 1", "ENG101", "General English", 2, "aris", "FK403", 2, time(10, 30), time(12, 0)),
    ("TEKFO. 6", "KRP101", "Kriptografi", 3, "rintis", "FK407", 2, time(9, 0), time(10, 30)),
    ("TEKFO. 7", "STD101", "Sistem Terdistribusi", 3, "henry", "FB502", 2, time(9, 0), time(10, 30)),
    ("TEKFO. 7", "CLD101", "Tech. Berbasis Cloud", 3, "rintis", "FB502", 2, time(10, 30), time(12, 0)),

    # --- RABU (day 3) ---
    ("TEKFO. 1", "LAL101", "Logika & Algoritma / P. Algo", 3, "beby", "FK202", 3, time(9, 0), time(10, 30)),
    ("TEKFO. 2", "MAT102", "Matematika 2", 3, "rifah", "FK502", 3, time(9, 0), time(10, 30)),
    ("TEKFO. 2", "HET101", "Hukum & Etika TI", 2, "yulis", "FK502", 3, time(10, 30), time(12, 0)),
    ("TEKFO. 3", "ADS101", "Analisa & Desain Sisfo", 3, "yulis", "FK203", 3, time(9, 0), time(10, 30)),
    ("TEKFO. 3", "PDS102", "Pemrograman Dasar II", 3, "reksa", "LABFK101", 3, time(10, 30), time(12, 0)),
    ("TEKFO. 4", "WEB101", "Teknologi WEB", 3, "nurul", "FK406", 3, time(9, 0), time(10, 30)),
    ("TEKFO. 4", "ASI101", "Arsitek. Informasi", 3, "cipto", "FK406", 3, time(10, 30), time(12, 0)),
    ("TEKFO. 5", "SOP101", "Sistem Operasi", 3, "reksa", "FK407", 3, time(9, 0), time(10, 30)),
    ("TEKFO. 5", "STA101", "Statistika", 3, "rifah", "FK407", 3, time(10, 30), time(12, 0)),
    ("TEKFO. 7", "IMK102", "Interaksi Manusia & Komp.", 3, "ferdi", "FK405", 3, time(9, 0), time(10, 30)),
    ("TEKFO. 7", "EAR101", "Enterprise Architecture", 3, "nurul", "FK405", 3, time(10, 30), time(12, 0)),

    # --- KAMIS (day 4) ---
    ("TEKFO. 2", "STD102", "Struktur Data", 3, "nuri", "FB303", 4, time(8, 30), time(10, 0)),
    ("TEKFO. 2", "PDS101", "Pemrograman Dasar", 3, "rintis", "LABFB604", 4, time(10, 0), time(11, 30)),
    ("TEKFO. 3", "TKK101", "Tekn. Keamanan Komp.", 3, "rintis", "FK403", 4, time(8, 30), time(10, 0)),
    ("TEKFO. 3", "WAT102", "Wawasan & Apk. Teknologi", 2, "nurul", "FK403", 4, time(10, 0), time(11, 30)),
    ("TEKFO. 4", "KPF101", "Komunikasi Prof", 2, "nurul", "FK406", 4, time(8, 30), time(10, 0)),
    ("TEKFO. 4", "PMD101", "Pemodelan Data", 3, "yoga", "FK406", 4, time(10, 0), time(11, 30)),
    ("TEKFO. 6", "KLS101", "Komputasi Kluster", 3, "imam", "FK405", 4, time(8, 30), time(10, 0)),
    ("TEKFO. 6", "DTM101", "Data Mining", 3, "riyanto", "FK405", 4, time(10, 0), time(11, 30)),
    ("TEKFO. 7", "FSD101", "Forensik Digital", 3, "henry", "FK402", 4, time(10, 0), time(11, 30)),

    # --- JUMAT (day 5) ---
    ("TEKFO. 1", "PKN101", "PKN", 2, "arfan", "FK502", 5, time(9, 0), time(10, 30)),
    ("TEKFO. 1", "PTI101", "PTI", 2, "yulis", "FK502", 5, time(10, 30), time(12, 0)),
    ("TEKFO. 2", "KDJ101", "Kom. Data & Jarkom", 3, "erly", "FB304", 5, time(9, 0), time(10, 30)),
    ("TEKFO. 2", "EFC101", "English For Comp", 2, "eva", "FB304", 5, time(10, 30), time(12, 0)),
    ("TEKFO. 3", "PAM101", "Platform Apl. Mobile", 3, "nuri", "LABFB602", 5, time(9, 0), time(10, 30)),
    ("TEKFO. 3", "TWB101", "Teknologi Web", 3, "jum", "LABFB602", 5, time(10, 30), time(12, 0)),
    ("TEKFO. 4", "JNR102", "Jaringan Nirkabel", 3, "andi", "FB203", 5, time(9, 0), time(10, 30)),
    ("TEKFO. 4", "KPA101", "Komputasi Awan", 3, "imam", "FB203", 5, time(10, 30), time(12, 0)),
    ("TEKFO. 5", "TKI101", "Tata Kelola Infra. TI", 3, "bamb", "FK206", 5, time(9, 0), time(10, 30)),
    ("TEKFO. 5", "SDI101", "Sist. Deteksi & Intrusi", 3, "nuri", "FK206", 5, time(10, 30), time(12, 0)),
    ("TEKFO. 6", "IOT101", "Internet of Thing", 3, "rukmana", "FK401", 5, time(9, 0), time(10, 30)),
    ("TEKFO. 6", "KWA101", "Keamanan Web & Aplikasi", 3, "bamb", "FK401", 5, time(10, 30), time(12, 0)),
    ("TEKFO. 7", "ADT101", "Audit IT", 3, "yusuf", "FK501", 5, time(9, 0), time(10, 30)),
    ("TEKFO. 7", "MET101", "Met. Penelitian", 2, "mano", "FK501", 5, time(10, 30), time(12, 0)),
    ("TEKFO. 8", "ADT102", "Audit IT", 3, "yusuf", "FK501", 5, time(9, 0), time(10, 30)),
]


def seed_schedule():
    db = SessionLocal()
    try:
        print("🌱 Seeding schedule, lecturers, courses, and classes...")

        # 1. Program Studi
        prodi = db.scalar(select(ProgramStudi).where(ProgramStudi.kode == "TI"))
        if not prodi:
            prodi = ProgramStudi(
                kode="TI",
                nama="Teknik Informatika",
                jenjang="S1",
                is_active=True,
            )
            db.add(prodi)
            db.commit()
            db.refresh(prodi)

        # 2. Term
        term = db.scalar(select(AcademicTerm).where(AcademicTerm.is_active == True))
        if not term:
            term = AcademicTerm(
                nama="Ganjil 2026/2027",
                tanggal_mulai=date(2026, 9, 1),
                tanggal_selesai=date(2027, 2, 28),
                is_active=True,
            )
            db.add(term)
            db.commit()
            db.refresh(term)

        # 3. Create Lecturer Accounts & Profiles
        lecturer_map = {}
        for l in LECTURERS_DATA:
            user = db.scalar(select(User).where(User.email == l["email"]))
            if not user:
                user = User(
                    email=l["email"],
                    password_hash=DEFAULT_PWD_HASH,
                    full_name=l["name"],
                    role=UserRole.DOSEN,
                    is_active=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            prof = db.scalar(select(LecturerProfile).where(LecturerProfile.user_id == user.id))
            if not prof:
                prof = LecturerProfile(
                    user_id=user.id,
                    prodi_id=prodi.id,
                    nidn=l["nidn"],
                    department="Teknik Informatika",
                    is_active=True,
                )
                db.add(prof)
                db.commit()
                db.refresh(prof)

            # Key by lowercase name prefix for matching schedule entries
            key = l["name"].split(",")[0].strip().lower()
            lecturer_map[key] = prof
            print(f"  ✅ Dosen: {l['name']} ({l['email']} / dosen123) - NIDN {l['nidn']}")

        # 4. Create Rooms
        room_codes = set(item[5] for item in SCHEDULE_ENTRIES)
        room_map = {}
        for rcode in room_codes:
            room = db.scalar(select(ClassRoom).where(ClassRoom.kode == rcode))
            if not room:
                room = ClassRoom(kode=rcode, nama=f"Ruang {rcode}", kapasitas=40)
                db.add(room)
                db.commit()
                db.refresh(room)
            room_map[rcode] = room

        # 5. Create Courses & Course Classes
        created_classes = []
        for cohort, ccode, cname, credits, lkey, rcode, day, stime, etime in SCHEDULE_ENTRIES:
            course = db.scalar(select(Course).where(Course.kode == ccode))
            if not course:
                course = Course(
                    kode=ccode,
                    nama=cname,
                    sks=credits,
                    prodi_id=prodi.id,
                    is_active=True,
                )
                db.add(course)
                db.commit()
                db.refresh(course)

            lecturer = lecturer_map.get(lkey)
            if not lecturer:
                print(f"  ⚠️ Lecturer key not found: {lkey}")
                continue

            room = room_map.get(rcode)
            class_name = f"{cohort} - {cname}"
            existing_class = db.scalar(
                select(CourseClass).where(
                    CourseClass.kode_kelas == class_name,
                    CourseClass.term_id == term.id,
                )
            )
            if not existing_class:
                c_class = CourseClass(
                    kode_kelas=class_name,
                    class_type=ClassType.REGULER_PAGI,
                    course_id=course.id,
                    term_id=term.id,
                    lecturer_id=lecturer.id,
                    room_id=room.id if room else None,
                    hari=day,
                    jam_mulai=stime,
                    jam_selesai=etime,
                    is_active=True,
                )
                db.add(c_class)
                db.commit()
                db.refresh(c_class)
                created_classes.append(c_class)
            else:
                existing_class.lecturer_id = lecturer.id
                existing_class.hari = day
                existing_class.jam_mulai = stime
                existing_class.jam_selesai = etime
                db.commit()
                created_classes.append(existing_class)

        print(f"  ✅ Created/Updated {len(created_classes)} Course Classes from schedule.")

        # 6. Seed Students for Semester 1 to Semester 8 & Cohort-based Enrollment
        DEFAULT_MHS_PWD = hash_password("mhs123")
        from app.models.student import KtmStatus

        SEMESTER_STUDENTS = [
            # Semester 1 (TEKFO 1)
            {"name": "Mochamad Rizal", "email": "rizal@mhs.unipi.ac.id", "nim": "202401001", "angkatan": 2024, "semesters": [1], "cohort": 1, "class_type": ClassType.REGULER_PAGI},
            {"name": "Budi Santoso", "email": "budi@mhs.unipi.ac.id", "nim": "202401002", "angkatan": 2024, "semesters": [1], "cohort": 1, "class_type": ClassType.REGULER_PAGI},
            {"name": "Siti Nurhaliza", "email": "siti@mhs.unipi.ac.id", "nim": "202401003", "angkatan": 2024, "semesters": [1], "cohort": 1, "class_type": ClassType.REGULER_PAGI},
            {"name": "Ketua Kelas TI-1", "email": "ketua@mhs.unipi.ac.id", "nim": "202401099", "angkatan": 2024, "semesters": [1], "cohort": 1, "class_type": ClassType.REGULER_PAGI},
            {"name": "Rian Hidayat (Smt 1)", "email": "mhs1@mhs.unipi.ac.id", "nim": "202401010", "angkatan": 2024, "semesters": [1], "cohort": 1, "class_type": ClassType.REGULER_PAGI},

            # Semester 2 (TEKFO 2)
            {"name": "Ahmad Dani (Smt 2)", "email": "dani@mhs.unipi.ac.id", "nim": "202401004", "angkatan": 2024, "semesters": [2], "cohort": 2, "class_type": ClassType.REGULER_PAGI},
            {"name": "Nadya Eka (Smt 2)", "email": "mhs2@mhs.unipi.ac.id", "nim": "202301020", "angkatan": 2023, "semesters": [2], "cohort": 2, "class_type": ClassType.REGULER_PAGI},

            # Semester 3 (TEKFO 3)
            {"name": "Fajar Ramadhan (Smt 3)", "email": "mhs3@mhs.unipi.ac.id", "nim": "202301030", "angkatan": 2023, "semesters": [3], "cohort": 3, "class_type": ClassType.REGULER_PAGI},

            # Semester 4 (TEKFO 4)
            {"name": "Annisa Putri (Smt 4)", "email": "mhs4@mhs.unipi.ac.id", "nim": "202201040", "angkatan": 2022, "semesters": [4], "cohort": 4, "class_type": ClassType.REGULER_PAGI},

            # Semester 5 (TEKFO 5)
            {"name": "Rina Wulandari (Smt 5)", "email": "mhs5@mhs.unipi.ac.id", "nim": "202201050", "angkatan": 2022, "semesters": [5], "cohort": 5, "class_type": ClassType.REGULER_MALAM},

            # Semester 6 (TEKFO 6)
            {"name": "Gilang Pratama (Smt 6)", "email": "mhs6@mhs.unipi.ac.id", "nim": "202101060", "angkatan": 2021, "semesters": [6], "cohort": 6, "class_type": ClassType.REGULER_PAGI},

            # Semester 7 (TEKFO 7)
            {"name": "Dimas Saputra (Smt 7)", "email": "mhs7@mhs.unipi.ac.id", "nim": "202101070", "angkatan": 2021, "semesters": [7], "cohort": 7, "class_type": ClassType.REGULER_PAGI},

            # Semester 8 (TEKFO 8)
            {"name": "Wahyu Hidayat (Smt 8)", "email": "mhs8@mhs.unipi.ac.id", "nim": "202001080", "angkatan": 2020, "semesters": [8], "cohort": 8, "class_type": ClassType.REGULER_PAGI},
        ]

        student_obj_map = {}
        for s_data in SEMESTER_STUDENTS:
            u = db.scalar(select(User).where(User.email == s_data["email"]))
            if not u:
                u = User(
                    email=s_data["email"],
                    password_hash=DEFAULT_MHS_PWD,
                    full_name=s_data["name"],
                    role=UserRole.KETUA_KELAS if "ketua" in s_data["email"] else UserRole.MAHASISWA,
                    is_active=True,
                )
                db.add(u)
                db.commit()
                db.refresh(u)

            sp = db.scalar(select(StudentProfile).where(StudentProfile.user_id == u.id))
            target_cohort = s_data.get("cohort", s_data["semesters"][0])
            target_class_type = s_data.get("class_type", ClassType.REGULER_PAGI)
            if not sp:
                sp = StudentProfile(
                    user_id=u.id,
                    prodi_id=prodi.id,
                    nim=s_data["nim"],
                    angkatan=s_data["angkatan"],
                    academic_cohort=target_cohort,
                    class_type=target_class_type,
                    ktm_status=KtmStatus.KTM_TERDAFTAR,
                    phone="089876543210",
                    is_active=True,
                )
                db.add(sp)
                db.commit()
                db.refresh(sp)
            else:
                sp.academic_cohort = target_cohort
                sp.class_type = target_class_type
                db.commit()
            student_obj_map[s_data["email"]] = (sp, s_data["semesters"])

        # Cohort parsing helper: "TEKFO. 1 - ..." -> 1
        def get_cohort_num(class_name: str) -> int:
            try:
                part = class_name.split("-")[0].strip()
                if "TEKFO." in part:
                    return int(part.replace("TEKFO.", "").strip())
            except Exception:
                pass
            return 1

        enroll_count = 0
        all_db_classes = list(db.scalars(select(CourseClass)).all())

        for email, (student_profile, allowed_semesters) in student_obj_map.items():
            for c in all_db_classes:
                c_num = get_cohort_num(c.kode_kelas or c.name or "")
                enr = db.scalar(
                    select(ClassEnrollment).where(
                        ClassEnrollment.class_id == c.id,
                        ClassEnrollment.student_id == student_profile.id,
                    )
                )
                if c_num in allowed_semesters:
                    if not enr:
                        db.add(ClassEnrollment(
                            class_id=c.id,
                            student_id=student_profile.id,
                            status=EnrollmentStatus.AKTIF,
                            enrollment_type=EnrollmentType.REGULER,
                        ))
                        enroll_count += 1
                else:
                    # Clean up incorrect reguler enrollments from previous runs so semester isolation is strict
                    # Preserve any KRS Tambah SKS / Mengulang approved enrollments
                    if enr and getattr(enr, "enrollment_type", EnrollmentType.REGULER) == EnrollmentType.REGULER:
                        db.delete(enr)

        db.commit()
        print(f"  ✅ Enrolled semester students with strict cohort isolation ({enroll_count} new enrollments).")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding schedule: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_schedule()
