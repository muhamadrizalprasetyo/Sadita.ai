import { SessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getStudentEnrollments, getLecturerClasses } from "@/app/data/academic.dal";

export interface KobarMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface KobarToolResponse {
  toolName: string;
  result: any;
  needsConfirmation?: boolean;
  confirmationAction?: string;
}

/**
 * Audit log untuk eksekusi tool SI KOBAR
 */
async function auditKobarExecution(
  user: SessionUser,
  toolName: string,
  params: any,
  success: boolean
) {
  try {
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        action: `KOBAR_TOOL_${toolName}`,
        resource_type: "KOBAR",
        details: JSON.stringify({ params, success, timestamp: new Date() }),
        created_at: new Date(),
      },
    });
  } catch (e) {
    console.error("Failed to write audit log for Kobar:", e);
  }
}

/**
 * Tool Registry yang terotentikasi dan mematuhi RBAC
 */
export const KobarTools = {
  // MAHASISWA TOOLS
  async getMyPendingAssignments(user: SessionUser) {
    if (user.role !== "MAHASISWA") {
      throw new Error("Tool ini hanya dapat diakses oleh mahasiswa.");
    }
    const student = await prisma.student_profiles.findUnique({
      where: { user_id: user.id },
      include: {
        class_enrollments: {
          where: { status: "AKTIF" },
          include: {
            course_classes: {
              include: {
                courses: true,
                assignments: {
                  where: { is_published: true },
                  include: {
                    assignment_submissions: {
                      where: { student_id: student?.id },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) return [];

    const pendingList: any[] = [];
    for (const enr of student.class_enrollments) {
      for (const a of enr.course_classes.assignments) {
        if (a.assignment_submissions.length === 0) {
          pendingList.push({
            assignmentId: a.id,
            title: a.title,
            courseName: enr.course_classes.courses.nama,
            dueDate: a.due_date,
            isOverdue: new Date() > a.due_date,
          });
        }
      }
    }

    await auditKobarExecution(user, "getMyPendingAssignments", {}, true);
    return pendingList;
  },

  async getMyAttendance(user: SessionUser) {
    if (user.role !== "MAHASISWA") {
      throw new Error("Tool ini hanya dapat diakses oleh mahasiswa.");
    }
    const student = await prisma.student_profiles.findUnique({
      where: { user_id: user.id },
    });
    if (!student) return [];

    const records = await prisma.attendance_records.findMany({
      where: { student_id: student.id },
      include: {
        attendance_sessions: {
          include: {
            course_classes: {
              include: { courses: true },
            },
          },
        },
      },
      orderBy: { check_in_time: "desc" },
    });

    await auditKobarExecution(user, "getMyAttendance", {}, true);
    return records.map((r) => ({
      courseName: r.attendance_sessions.course_classes.courses.nama,
      sessionNumber: r.attendance_sessions.session_number,
      status: r.status,
      time: r.check_in_time,
    }));
  },

  async getMyGrades(user: SessionUser) {
    if (user.role !== "MAHASISWA") {
      throw new Error("Tool ini hanya dapat diakses oleh mahasiswa.");
    }
    const student = await prisma.student_profiles.findUnique({
      where: { user_id: user.id },
    });
    if (!student) return [];

    const grades = await prisma.student_grades.findMany({
      where: { student_id: student.id },
      include: {
        course_classes: {
          include: { courses: true },
        },
      },
    });

    await auditKobarExecution(user, "getMyGrades", {}, true);
    return grades.map((g) => ({
      courseName: g.course_classes.courses.nama,
      tugas: g.tugas_score,
      uts: g.uts_score,
      uas: g.uas_score,
      finalScore: g.final_score,
      gradeLetter: g.grade_scale,
    }));
  },

  // DOSEN TOOLS
  async getClassAttendanceSummary(user: SessionUser, classId: number) {
    if (user.role !== "DOSEN" && user.role !== "ADMIN") {
      throw new Error("Hanya Dosen atau Admin yang dapat melihat rekap kelas.");
    }
    const lecturer = await prisma.lecturer_profiles.findUnique({
      where: { user_id: user.id },
    });

    const cls = await prisma.course_classes.findFirst({
      where: {
        id: classId,
        ...(user.role === "DOSEN" ? { lecturer_id: lecturer?.id } : {}),
      },
      include: {
        courses: true,
        attendance_sessions: {
          include: {
            attendance_records: true,
          },
        },
        class_enrollments: {
          where: { status: "AKTIF" },
        },
      },
    });

    if (!cls) throw new Error("Kelas tidak ditemukan atau Anda bukan dosen pengampu.");

    const totalStudents = cls.class_enrollments.length;
    const sessions = cls.attendance_sessions.map((s) => ({
      sessionNumber: s.session_number,
      status: s.status,
      presentCount: s.attendance_records.filter((r) => r.status === "HADIR").length,
      totalStudents,
    }));

    await auditKobarExecution(user, "getClassAttendanceSummary", { classId }, true);
    return {
      className: cls.kode_kelas,
      courseName: cls.courses.nama,
      totalStudents,
      sessions,
    };
  },

  // ADMIN TOOLS
  async getDeviceStatus(user: SessionUser) {
    if (user.role !== "ADMIN") {
      throw new Error("Hanya Admin yang dapat memonitor perangkat IoT.");
    }
    const devices = await prisma.sadita_devices.findMany({
      include: { class_rooms: true },
    });
    await auditKobarExecution(user, "getDeviceStatus", {}, true);
    return devices.map((d) => ({
      deviceId: d.device_id,
      name: d.nama,
      status: d.status,
      room: d.class_rooms?.nama || "Tidak terikat",
      lastSeen: d.last_seen_at,
    }));
  },
};

/**
 * Pemroses Pesan dan Intent SI KOBAR (Role-Aware)
 */
export async function processKobarChat(user: SessionUser, userQuery: string) {
  const query = userQuery.toLowerCase();

  // 1. MAHASISWA INTENTS
  if (user.role === "MAHASISWA") {
    if (query.includes("tugas") || query.includes("deadline") || query.includes("belum")) {
      const assignments = await KobarTools.getMyPendingAssignments(user);
      if (assignments.length === 0) {
        return {
          reply: "Hebat! Semua tugas akademik Anda saat ini sudah selesai dikumpulkan. Pertahankan prestasinya! 🎓",
          data: [],
        };
      }
      return {
        reply: `Ditemukan ${assignments.length} tugas yang perlu Anda selesaikan:`,
        data: assignments,
      };
    }

    if (query.includes("presensi") || query.includes("absen") || query.includes("hadir")) {
      const attendance = await KobarTools.getMyAttendance(user);
      return {
        reply: `Berikut adalah riwayat kehadiran kuliah Anda terkini:`,
        data: attendance,
      };
    }

    if (query.includes("nilai") || query.includes("grade") || query.includes("ipk")) {
      const grades = await KobarTools.getMyGrades(user);
      return {
        reply: `Berikut adalah rekapitulasi nilai akademik Anda semester ini:`,
        data: grades,
      };
    }

    if (query.includes("jadwal") || query.includes("kuliah") || query.includes("kelas")) {
      const classes = await getStudentEnrollments(user.id);
      return {
        reply: `Anda terdaftar pada ${classes.length} kelas perkuliahan aktif:`,
        data: classes.map((c) => ({
          matkul: c.course_classes.courses.nama,
          kelas: c.course_classes.kode_kelas,
          hari: c.course_classes.hari === 1 ? "Senin" : "Selasa",
          jam: `${c.course_classes.jam_mulai} - ${c.course_classes.jam_selesai}`,
          ruang: c.course_classes.class_rooms?.nama,
        })),
      };
    }
  }

  // 2. DOSEN INTENTS
  if (user.role === "DOSEN" || user.isKaprodi) {
    if (query.includes("kelas") || query.includes("ampu") || query.includes("mengajar")) {
      const myClasses = await getLecturerClasses(user.id);
      return {
        reply: `Halo ${user.fullName}, berikut adalah kelas yang Anda ampu semester ini:`,
        data: myClasses.map((c) => ({
          kelasId: c.id,
          matkul: c.courses.nama,
          kelas: c.kode_kelas,
          totalMahasiswa: c._count.class_enrollments,
        })),
      };
    }

    if (query.includes("presensi") || query.includes("kehadiran")) {
      const myClasses = await getLecturerClasses(user.id);
      if (myClasses.length > 0) {
        const report = await KobarTools.getClassAttendanceSummary(user, myClasses[0].id);
        return {
          reply: `Rekapitulasi kehadiran untuk kelas ${report.className} (${report.courseName}):`,
          data: report,
        };
      }
    }
  }

  // 3. ADMIN INTENTS
  if (user.role === "ADMIN") {
    if (query.includes("perangkat") || query.includes("device") || query.includes("iot") || query.includes("esp32")) {
      const devices = await KobarTools.getDeviceStatus(user);
      return {
        reply: `Status perangkat IoT Presensi SADITA:`,
        data: devices,
      };
    }
  }

  // Generic Respons
  return {
    reply: `Halo ${user.fullName} (${user.role}). Saya SI KOBAR, asisten akademik terpadu Anda di SADITA.ai. Ada yang bisa saya bantu terkait perkuliahan, tugas, presensi, atau jadwal kuliah hari ini?`,
    data: null,
  };
}
