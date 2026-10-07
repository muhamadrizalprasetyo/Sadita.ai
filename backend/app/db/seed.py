"""
SADITA — Initial Database Seeder (Real Production Schema)
Seeds Program Studi, Dosen, Mahasiswa (berbagai kondisi KTM),
Perangkat ESP32-S3, Ruangan, Kelas Kuliah, dan Sesi Aktif.
Can be executed with: python -m app.db.seed
"""
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
import app.models  # ensure all models are registered
from app.models.academic import (
    AcademicTerm,
    ClassEnrollment,
    ClassRoom,
    ClassType,
    Course,
    CourseClass,
    EnrollmentStatus,
)
from app.models.attendance import (
    AttendanceRecord,
    AttendanceSession,
    AttendanceStatus,
    SessionStatus,
)
from app.models.credential import FingerprintCredential, RfidCredential
from app.models.device import DeviceStatus, SaditaDevice
from app.models.lecturer import LecturerProfile
from app.models.lms import Assignment, CourseMaterial, MaterialType
from app.models.program_studi import ProgramStudi
from app.models.student import KtmStatus, StudentProfile
from app.models.user import User, UserRole


def seed_database():
    db = SessionLocal()
    try:
        print("🌱 Seeding SADITA real database...")

        # 0. Program Studi
        prodi = db.scalar(select(ProgramStudi).where(ProgramStudi.kode == "TI"))
        if not prodi:
            prodi = ProgramStudi(
                kode="TI",
                nama="Teknik Informatika",
                jenjang="S1",
                deskripsi="Program Studi Sarjana Teknik Informatika Universitas Pramita Indonesia",
                is_active=True,
            )
            db.add(prodi)
            db.commit()
            db.refresh(prodi)
            print("  ✅ Program Studi created: S1 Teknik Informatika (TI)")
        else:
            print("  ℹ️ Program Studi already exists")

        # 1. Admin User
        admin = db.scalar(select(User).where(User.email == "admin@unipi.ac.id"))
        if not admin:
            admin = User(
                email="admin@unipi.ac.id",
                password_hash=hash_password("admin123"),
                full_name="Administrator SADITA",
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("  ✅ Admin created: admin@unipi.ac.id / admin123")
        else:
            print("  ℹ️ Admin already exists")

        # 2. Lecturer (Dosen)
        lecturer_user = db.scalar(select(User).where(User.email == "dosen@unipi.ac.id"))
        if not lecturer_user:
            lecturer_user = User(
                email="dosen@unipi.ac.id",
                password_hash=hash_password("dosen123"),
                full_name="Dr. Ahmad Fauzi, M.Kom.",
                role=UserRole.DOSEN,
                is_active=True,
            )
            db.add(lecturer_user)
            db.commit()
            db.refresh(lecturer_user)

            lecturer_profile = LecturerProfile(
                user_id=lecturer_user.id,
                prodi_id=prodi.id,
                nidn="0412058501",
                gelar_depan="Dr.",
                gelar_belakang="M.Kom.",
                phone="081234567890",
                is_active=True,
            )
            db.add(lecturer_profile)
            db.commit()
            db.refresh(lecturer_profile)
            print("  ✅ Dosen created: dosen@unipi.ac.id / dosen123 (NIDN: 0412058501)")
        else:
            lecturer_profile = lecturer_user.lecturer_profile
            print("  ℹ️ Dosen already exists")

        # 3. Room & IoT Perangkat SADITA (ESP32-S3)
        room = db.scalar(select(ClassRoom).where(ClassRoom.kode == "R301"))
        if not room:
            room = ClassRoom(
                kode="R301",
                nama="Lab IoT & Mobile (R301)",
                kapasitas=40,
                gedung="Gedung Rektorat Baru",
                lantai=3,
                is_active=True,
            )
            db.add(room)
            db.commit()
            db.refresh(room)
            print("  ✅ Ruangan created: Lab IoT & Mobile (R301)")
        else:
            print("  ℹ️ Ruangan already exists")

        device = db.scalar(select(SaditaDevice).where(SaditaDevice.device_id == "SADITA-ESP32-LAB-01"))
        if not device:
            device = SaditaDevice(
                device_id="SADITA-ESP32-LAB-01",
                nama="ESP32-S3 Presensi Meja Dosen Lab IoT",
                room_id=room.id,
                status=DeviceStatus.ACTIVE,
                firmware_version="v2.1.0-ESP32S3",
                mac_address="30:30:F9:5A:12:34",
                ip_address="192.168.1.150",
                keterangan="ESP32-S3 + RC522 + AS608 + DS3231 + LCD 16x2 I2C + 3 LED + Buzzer",
            )
            db.add(device)
            db.commit()
            db.refresh(device)
            print("  ✅ Perangkat SADITA created: SADITA-ESP32-LAB-01 (Lab R301)")
        else:
            print("  ℹ️ Perangkat SADITA already exists")

        # 4. Students dengan status KTM nyata
        students_config = [
            {
                "email": "rizal@mhs.unipi.ac.id",
                "name": "Mochamad Rizal",
                "nim": "202401001",
                "angkatan": 2024,
                "ktm_status": KtmStatus.KTM_TERDAFTAR,
                "rfid": "A1B2C3D4",
                "rfid_active": True,
                "fp_slot": 1,
            },
            {
                "email": "budi@mhs.unipi.ac.id",
                "name": "Budi Santoso",
                "nim": "202401002",
                "angkatan": 2024,
                "ktm_status": KtmStatus.BELUM_MEMILIKI_KTM,
                "rfid": None,  # Belum memiliki KTM sejak awal
                "rfid_active": False,
                "fp_slot": 2,  # Terdaftar fingerprint terlebih dahulu
            },
            {
                "email": "siti@mhs.unipi.ac.id",
                "name": "Siti Nurhaliza",
                "nim": "202401003",
                "angkatan": 2024,
                "ktm_status": KtmStatus.KTM_TIDAK_DIBAWA,
                "rfid": "E5F60718",  # Punya kartu aktif tapi status hari ini lupa bawa
                "rfid_active": True,
                "fp_slot": 3,
            },
            {
                "email": "dani@mhs.unipi.ac.id",
                "name": "Ahmad Dani",
                "nim": "202401004",
                "angkatan": 2024,
                "ktm_status": KtmStatus.KTM_HILANG,
                "rfid": "11223344",  # Kartu pernah ada tapi dilaporkan hilang
                "rfid_active": False,
                "fp_slot": 4,
            },
        ]

        created_students = []
        for s in students_config:
            stu_user = db.scalar(select(User).where(User.email == s["email"]))
            if not stu_user:
                stu_user = User(
                    email=s["email"],
                    password_hash=hash_password("mhs123"),
                    full_name=s["name"],
                    role=UserRole.MAHASISWA,
                    is_active=True,
                )
                db.add(stu_user)
                db.commit()
                db.refresh(stu_user)

                stu_profile = StudentProfile(
                    user_id=stu_user.id,
                    prodi_id=prodi.id,
                    nim=s["nim"],
                    angkatan=s["angkatan"],
                    ktm_status=s["ktm_status"],
                    phone="089876543210",
                    is_active=True,
                )
                db.add(stu_profile)
                db.commit()
                db.refresh(stu_profile)

                if s["rfid"]:
                    rfid_cred = RfidCredential(
                        student_id=stu_profile.id,
                        uid=s["rfid"].upper(),
                        is_active=s["rfid_active"],
                        keterangan="KTM Mahasiswa" if s["rfid_active"] else "KTM Dilaporkan Hilang",
                    )
                    db.add(rfid_cred)

                if s["fp_slot"]:
                    fp_cred = FingerprintCredential(
                        student_id=stu_profile.id,
                        device_id="SADITA-ESP32-LAB-01",
                        template_slot=s["fp_slot"],
                        finger_label="Telunjuk Kanan",
                        is_active=True,
                    )
                    db.add(fp_cred)

                db.commit()
                db.refresh(stu_profile)
                created_students.append(stu_profile)
                print(f"  ✅ Mahasiswa created: {s['name']} (NIM: {s['nim']}, KTM: {s['ktm_status'].value}, RFID: {s['rfid'] or '-'}, FP: #{s['fp_slot']})")
            else:
                created_students.append(stu_user.student_profile)

        # 5. Academic Term
        term = db.scalar(select(AcademicTerm).where(AcademicTerm.nama == "Ganjil 2026/2027"))
        if not term:
            term = AcademicTerm(
                nama="Ganjil 2026/2027",
                is_active=True,
                tanggal_mulai=date(2026, 9, 1),
                tanggal_selesai=date(2027, 1, 31),
            )
            db.add(term)
            db.commit()
            db.refresh(term)
            print("  ✅ Semester created: Ganjil 2026/2027")
        else:
            print("  ℹ️ Semester already exists")

        # 6. Course (Mata Kuliah)
        course = db.scalar(select(Course).where(Course.kode == "IF201"))
        if not course:
            course = Course(
                prodi_id=prodi.id,
                kode="IF201",
                nama="Pemrograman Berbasis Sensor & IoT",
                sks=3,
                semester_ke=3,
                deskripsi="Praktikum sistem embedded, sensor RFID, biometrik fingerprint, protokol MQTT, dan integrasi backend.",
                is_active=True,
            )
            db.add(course)
            db.commit()
            db.refresh(course)
            print("  ✅ Mata Kuliah created: IF201 - Pemrograman Berbasis Sensor & IoT")
        else:
            print("  ℹ️ Mata Kuliah already exists")

        # 7. Class (Kelas Perkuliahan Pagi UNIPI)
        course_class = db.scalar(select(CourseClass).where(CourseClass.kode_kelas == "TI-2024-PAGI-A"))
        if not course_class:
            course_class = CourseClass(
                kode_kelas="TI-2024-PAGI-A",
                class_type=ClassType.REGULER_PAGI,
                course_id=course.id,
                term_id=term.id,
                lecturer_id=lecturer_profile.id,
                room_id=room.id,
                hari=1,  # Senin
                jam_mulai=time(8, 0),
                jam_selesai=time(10, 30),
                batas_terlambat_menit=15,
                total_pertemuan=16,
                is_active=True,
            )
            db.add(course_class)
            db.commit()
            db.refresh(course_class)
            print("  ✅ Kelas Kuliah created: TI-2024-PAGI-A (REGULER_PAGI, Senin 08:00 - 10:30)")
        else:
            print("  ℹ️ Kelas Kuliah already exists")

        # 8. Enroll valid student cohort in KRS. Students with a reported lost KTM are not
        # included in the default attendance roster.
        enrolled_count = 0
        for stu in created_students:
            if stu.ktm_status == KtmStatus.KTM_HILANG:
                continue

            enrolled = db.scalar(
                select(ClassEnrollment).where(
                    ClassEnrollment.class_id == course_class.id,
                    ClassEnrollment.student_id == stu.id,
                )
            )
            if not enrolled:
                enrollment = ClassEnrollment(
                    class_id=course_class.id,
                    student_id=stu.id,
                    status=EnrollmentStatus.AKTIF,
                )
                db.add(enrollment)
                enrolled_count += 1
        db.commit()
        print(f"  ✅ {enrolled_count} Mahasiswa enrolled ke kelas TI-2024-PAGI-A")

        # 9. Attendance Session (Pertemuan 1 - STATUS: OPEN)
        session = db.scalar(
            select(AttendanceSession).where(
                AttendanceSession.class_id == course_class.id,
                AttendanceSession.pertemuan_ke == 1,
            )
        )
        if not session:
            session = AttendanceSession(
                class_id=course_class.id,
                pertemuan_ke=1,
                tanggal=date.today(),
                topik="Pengenalan ESP32-S3, Sensor RFID, Biometrik, & Komunikasi MQTT SADITA",
                status=SessionStatus.OPEN,
                dibuka_pada=datetime.now(timezone.utc),
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            print("  ✅ Sesi Pertemuan 1 (OPEN) created")

            # Init ALFA records for all students
            for stu in created_students:
                rec = AttendanceRecord(
                    session_id=session.id,
                    student_id=stu.id,
                    status=AttendanceStatus.ALFA,
                )
                db.add(rec)
            db.commit()
            print(f"  ✅ {len(created_students)} Mahasiswa diinisialisasi status ALFA untuk Pertemuan 1")
        else:
            # Ensure session is OPEN for immediate testing
            session.status = SessionStatus.OPEN
            if not session.dibuka_pada:
                session.dibuka_pada = datetime.now(timezone.utc)
            db.commit()
            print("  ℹ️ Sesi Pertemuan 1 dipastikan dalam keadaan OPEN")

        # 10. Course Material
        material = db.scalar(select(CourseMaterial).where(CourseMaterial.class_id == course_class.id))
        if not material:
            material = CourseMaterial(
                class_id=course_class.id,
                session_id=session.id,
                title="Modul 1: Pengenalan ESP32-S3 & Protokol Komunikasi MQTT SADITA",
                material_type=MaterialType.DOCUMENT,
                resource_url="https://unipi.ac.id/sadita/modul-01.pdf",
                description="Panduan pengkabelan sensor RC522, AS608, DS3231, LCD I2C, serta pengiriman payload MQTT ke broker Mosquitto.",
            )
            db.add(material)
            db.commit()
            print("  ✅ Materi Kuliah Modul 1 created")

        # 11. Assignment
        assignment = db.scalar(select(Assignment).where(Assignment.class_id == course_class.id))
        if not assignment:
            due = datetime.now(timezone.utc) + timedelta(days=7)
            assignment = Assignment(
                class_id=course_class.id,
                session_id=session.id,
                title="Tugas 1: Pengujian End-to-End Alur RFID + Fingerprint",
                description="Lakukan simulasi atau pengetesan fisik tap RFID dan scan fingerprint, amati respon LCD dan LED pada perangkat ESP32.",
                due_date=due,
                max_score=100.0,
                allow_late=True,
            )
            db.add(assignment)
            db.commit()
            print("  ✅ Tugas 1 created")

        print("✨ Database seeding completed successfully with real UNIPI dataset!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
