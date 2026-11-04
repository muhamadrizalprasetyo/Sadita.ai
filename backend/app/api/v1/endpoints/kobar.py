"""
SADITA — SI KOBAR AI Assistant Endpoints
/api/v1/kobar
Grounded, role-aware AI assistant grounded strictly in SADITA authoritative data.
Never fabricates grades, attendance, or schedules.
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func

from app.core.deps import CurrentUser, DBSession
from app.models.academic import CourseClass, ClassEnrollment, EnrollmentStatus
from app.models.attendance import AttendanceRecord, AttendanceSession, SessionStatus
from app.models.lms import Assignment, AssignmentSubmission, CourseMaterial, StudentGrade, ClassGradeConfig
from app.models.student import StudentProfile
from app.models.lecturer import LecturerProfile
from app.models.user import UserRole
from app.services.authorization_service import audit

router = APIRouter(prefix="/kobar", tags=["SI KOBAR (AI Assistant)"])


class KobarChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Pesan pertanyaan pengguna")


class KobarActionSuggestion(BaseModel):
    action_type: str
    label: str
    route: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class KobarChatResponse(BaseModel):
    reply: str
    intent: str
    role: str
    grounded_data: Optional[Dict[str, Any]] = None
    suggestions: List[KobarActionSuggestion] = []


FAQ_KNOWLEDGE_BASE = {
    "ktm": "Aturan KTM SADITA: Jika KTM hilang atau tertinggal, mahasiswa dapat mengajukan permohonan Presensi Alternatif melalui menu Presensi. Pengajuan wajib diverifikasi oleh Ketua Kelas dan disetujui final oleh Dosen Pengampu.",
    "grace_period": "Grace Period Presensi: Mahasiswa diberikan toleransi keterlambatan 15 menit dari waktu efektif perkuliahan. Check-in dalam rentang waktu toleransi tercatat sebagai TERLAMBAT, sedangkan check-in tepat waktu tercatat sebagai HADIR.",
    "uas": "Kebijakan Syarat UAS: Sesuai PO-01 SADITA, batas kehadiran minimal untuk mengikuti UAS adalah 75%. Sistem menampilkan soft warning bagi mahasiswa yang presensinya di bawah 75%.",
    "krs": "Siklus KRS SADITA: Alur KRS Tambah SKS / Mengulang dimulai dari DRAFT -> PENDING_APPROVAL -> Disetujui/Ditolak Dosen Pengampu -> Enrollment AKTIF otomatis.",
    "grading": "Komponen Nilai SADITA: Komponen default terdiri dari UTS (30%), UAS (35%), Tugas (15%), Absensi (10%), dan Aktivitas (10% default 80). Dosen dapat menyesuaikan bobot per kelas.",
}


@router.post("/chat", response_model=KobarChatResponse, summary="Percakapan dengan SI KOBAR AI Assistant")
def chat_with_kobar(
    req: KobarChatRequest,
    current: CurrentUser,
    db: DBSession,
    request: Request,
) -> KobarChatResponse:
    query = req.message.lower().strip()
    user_role = current.role.value if hasattr(current.role, "value") else str(current.role)
    first_name = current.full_name.split()[0]

    # 1. JADWAL / KELAS
    if any(k in query for k in ["jadwal", "kelas", "mata kuliah", "kuliah"]):
        if current.role == UserRole.MAHASISWA:
            student = db.scalar(select(StudentProfile).where(StudentProfile.user_id == current.id))
            if not student:
                return KobarChatResponse(reply="Profil mahasiswa tidak ditemukan.", intent="SCHEDULE", role=user_role)

            enrollments = db.scalars(
                select(ClassEnrollment)
                .where(
                    ClassEnrollment.student_id == student.id,
                    ClassEnrollment.status == EnrollmentStatus.AKTIF,
                )
            ).all()

            classes_info = []
            for enr in enrollments:
                c = enr.course_class
                if c:
                    day_str = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][(c.hari or c.day_of_week or 1) - 1]
                    start = c.jam_mulai.strftime("%H:%M") if c.jam_mulai else "-"
                    end = c.jam_selesai.strftime("%H:%M") if c.jam_selesai else "-"
                    course_name = c.course.name if c.course else c.name
                    classes_info.append(f"• **{course_name}** ({c.name}) — {day_str}, {start} - {end}")

            if classes_info:
                reply = f"Halo {first_name}, berikut jadwal kelas aktif Anda semester ini:\n\n" + "\n".join(classes_info)
            else:
                reply = f"Halo {first_name}, Anda belum memiliki kelas aktif yang terdaftar dalam KRS."

            return KobarChatResponse(
                reply=reply,
                intent="SCHEDULE",
                role=user_role,
                suggestions=[
                    KobarActionSuggestion(action_type="NAVIGATE", label="Buka Jadwal Kuliah", route="/student/schedule"),
                    KobarActionSuggestion(action_type="NAVIGATE", label="Katalog KRS", route="/student/krs"),
                ],
            )

        elif current.role == UserRole.DOSEN:
            lecturer = db.scalar(select(LecturerProfile).where(LecturerProfile.user_id == current.id))
            if not lecturer:
                return KobarChatResponse(reply="Profil dosen tidak ditemukan.", intent="SCHEDULE", role=user_role)

            classes = db.scalars(select(CourseClass).where(CourseClass.lecturer_id == lecturer.id, CourseClass.is_active.is_(True))).all()
            classes_info = []
            for c in classes:
                day_str = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][(c.hari or c.day_of_week or 1) - 1]
                start = c.jam_mulai.strftime("%H:%M") if c.jam_mulai else "-"
                end = c.jam_selesai.strftime("%H:%M") if c.jam_selesai else "-"
                course_name = c.course.name if c.course else c.name
                classes_info.append(f"• **{course_name}** ({c.name}) — {day_str}, {start} - {end}")

            reply = f"Bapak/Ibu {first_name}, Anda mengampu {len(classes)} kelas aktif:\n\n" + ("\n".join(classes_info) if classes_info else "Belum ada kelas yang ditugaskan.")
            return KobarChatResponse(
                reply=reply,
                intent="SCHEDULE",
                role=user_role,
                suggestions=[
                    KobarActionSuggestion(action_type="NAVIGATE", label="Buka Kelas Saya", route="/lecturer/classes"),
                    KobarActionSuggestion(action_type="NAVIGATE", label="Buka Presensi", route="/lecturer/attendance"),
                ],
            )

    # 2. PRESENSI / KEHADIRAN
    if any(k in query for k in ["presensi", "absen", "kehadiran"]):
        if current.role == UserRole.MAHASISWA:
            student = db.scalar(select(StudentProfile).where(StudentProfile.user_id == current.id))
            if student:
                records = db.scalars(select(AttendanceRecord).where(AttendanceRecord.student_id == student.id)).all()
                total = len(records)
                hadir = sum(1 for r in records if r.status.value in ["HADIR", "TERLAMBAT"])
                pct = round((hadir / total) * 100, 1) if total > 0 else 0.0

                reply = (
                    f"📊 **Ringkasan Presensi Anda:**\n"
                    f"• Total Sesi Tercatat: {total}\n"
                    f"• Total Kehadiran: {hadir}\n"
                    f"• Persentase Kehadiran: **{pct}%**\n\n"
                )
                if pct < 75.0 and total > 0:
                    reply += "⚠️ *Perhatian:* Persentase kehadiran Anda berada di bawah ambang batas minimal 75% untuk UAS. Segera konsultasikan dengan dosen pengampu jika terdapat kendala presensi."
                else:
                    reply += "✅ Status kehadiran Anda memenuhi syarat operasional akademik."

                return KobarChatResponse(
                    reply=reply,
                    intent="ATTENDANCE",
                    role=user_role,
                    grounded_data={"total": total, "hadir": hadir, "percentage": pct},
                    suggestions=[
                        KobarActionSuggestion(action_type="NAVIGATE", label="Riwayat Presensi", route="/student/attendance"),
                        KobarActionSuggestion(action_type="NAVIGATE", label="Presensi Alternatif", route="/student/attendance/alternative"),
                    ],
                )

        elif current.role in [UserRole.DOSEN, UserRole.ADMIN, UserRole.KAPRODI]:
            open_sessions = db.scalars(select(AttendanceSession).where(AttendanceSession.status == SessionStatus.OPEN)).all()
            reply = f"Saat ini terdapat **{len(open_sessions)} sesi perkuliahan** dengan presensi yang sedang DIBUKA (OPEN) di sistem."
            return KobarChatResponse(
                reply=reply,
                intent="ATTENDANCE",
                role=user_role,
                suggestions=[
                    KobarActionSuggestion(action_type="NAVIGATE", label="Panel Presensi", route="/lecturer/attendance"),
                ],
            )

    # 3. TUGAS / ASSIGNMENT / LMS
    if any(k in query for k in ["tugas", "assignment", "materi", "kuis"]):
        if current.role == UserRole.MAHASISWA:
            student = db.scalar(select(StudentProfile).where(StudentProfile.user_id == current.id))
            if student:
                enrolled_class_ids = db.scalars(
                    select(ClassEnrollment.class_id).where(
                        ClassEnrollment.student_id == student.id,
                        ClassEnrollment.status == EnrollmentStatus.AKTIF,
                    )
                ).all()

                assignments = db.scalars(
                    select(Assignment).where(
                        Assignment.class_id.in_(enrolled_class_ids),
                        Assignment.is_published.is_(True),
                    )
                ).all()

                submitted_ids = set(
                    db.scalars(
                        select(AssignmentSubmission.assignment_id).where(
                            AssignmentSubmission.student_id == student.id
                        )
                    ).all()
                )

                pending = [a for a in assignments if a.id not in submitted_ids]
                reply = f"📝 **Status Tugas LMS Anda:**\n• Total Tugas Diumumkan: {len(assignments)}\n• Tugas Selesai Dikumpulkan: {len(submitted_ids)}\n• Tugas Belum Dikumpulkan: **{len(pending)}**\n"
                if pending:
                    reply += "\nTugas yang perlu diselesaikan:\n" + "\n".join([f"• **{p.title}** (Deadline: {p.due_date.strftime('%d %b %Y %H:%M')})" for p in pending[:3]])

                return KobarChatResponse(
                    reply=reply,
                    intent="LMS_TASKS",
                    role=user_role,
                    suggestions=[
                        KobarActionSuggestion(action_type="NAVIGATE", label="Buka Menu Tugas", route="/student/assignments"),
                        KobarActionSuggestion(action_type="NAVIGATE", label="Buka Materi Kuliah", route="/student/materials"),
                    ],
                )

    # 4. NILAI / GRADES
    if any(k in query for k in ["nilai", "ipk", "grade", "mutu", "transkrip"]):
        if current.role == UserRole.MAHASISWA:
            student = db.scalar(select(StudentProfile).where(StudentProfile.user_id == current.id))
            if student:
                grades = db.scalars(
                    select(StudentGrade).where(
                        StudentGrade.student_id == student.id,
                        StudentGrade.is_published.is_(True),
                    )
                ).all()

                if grades:
                    reply = f"🎓 **Nilai yang Sudah Dipublikasikan ({len(grades)} mata kuliah):**\n"
                    for g in grades:
                        c_name = g.course_class.course.name if g.course_class and g.course_class.course else "Mata Kuliah"
                        letter = g.grade_scale.value if g.grade_scale else "-"
                        score = f"{g.final_score:.1f}" if g.final_score is not None else "-"
                        reply += f"• **{c_name}**: Nilai Akhir {score} (Huruf Mutu: **{letter}**)\n"
                else:
                    reply = "Nilai Anda semester ini belum dipublikasikan oleh dosen pengampu. Silakan tunggu pengumuman resmi nilai akhir."

                return KobarChatResponse(
                    reply=reply,
                    intent="GRADES",
                    role=user_role,
                    suggestions=[
                        KobarActionSuggestion(action_type="NAVIGATE", label="Buka Rekap Nilai", route="/student/grades"),
                    ],
                )

    # 5. FAQ INSTANT MATCHING
    for key, ans in FAQ_KNOWLEDGE_BASE.items():
        if key in query:
            return KobarChatResponse(
                reply=f"ℹ️ **Informasi Resmi SADITA.ai:**\n\n{ans}",
                intent="FAQ",
                role=user_role,
            )

    # 6. DEFAULT GROUNDED ASSISTANCE
    reply = (
        f"Halo {first_name}! Saya **SI KOBAR**, asisten AI operasional SADITA.ai untuk peran **{user_role}**.\n\n"
        f"Anda dapat menanyakan informasi data operasional nyata seperti:\n"
        f"• Jadwal kuliah dan kelas yang diikuti\n"
        f"• Ringkasan presensi dan status toleransi kehadiran\n"
        f"• Tugas dan materi LMS yang belum dikumpulkan\n"
        f"• Nilai resmi yang telah dipublikasikan\n"
        f"• Prosedur presensi alternatif saat KTM tertinggal/hilang"
    )
    return KobarChatResponse(
        reply=reply,
        intent="GENERAL",
        role=user_role,
        suggestions=[
            KobarActionSuggestion(action_type="NAVIGATE", label="Dashboard Utama", route="/"),
        ],
    )
