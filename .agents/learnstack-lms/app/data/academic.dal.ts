import { prisma } from "@/lib/db";

/**
 * Data Access Layer untuk Entitas Akademik SADITA.ai
 */

export async function getProgramStudiList() {
  return await prisma.program_studi.findMany({
    where: { is_active: true },
    orderBy: { nama: "asc" },
  });
}

export async function getAcademicTerms() {
  return await prisma.academic_terms.findMany({
    orderBy: { id: "desc" },
  });
}

export async function getActiveAcademicTerm() {
  return await prisma.academic_terms.findFirst({
    where: { is_active: true },
  });
}

export async function getCoursesList(prodiId?: number) {
  return await prisma.courses.findMany({
    where: {
      is_active: true,
      ...(prodiId ? { prodi_id: prodiId } : {}),
    },
    include: {
      program_studi: true,
    },
    orderBy: [{ semester_ke: "asc" }, { kode: "asc" }],
  });
}

export async function getCourseClassesList(options?: {
  termId?: number;
  lecturerId?: number;
  prodiId?: number;
}) {
  return await prisma.course_classes.findMany({
    where: {
      is_active: true,
      ...(options?.termId ? { term_id: options.termId } : {}),
      ...(options?.lecturerId ? { lecturer_id: options.lecturerId } : {}),
      ...(options?.prodiId
        ? {
            courses: {
              prodi_id: options.prodiId,
            },
          }
        : {}),
    },
    include: {
      courses: {
        include: { program_studi: true },
      },
      academic_terms: true,
      lecturer_profiles: {
        include: { users: true },
      },
      class_rooms: true,
      class_enrollments: {
        include: {
          student_profiles: {
            include: { users: true },
          },
        },
      },
      class_leader_assignments: {
        where: { is_active: true },
        include: {
          student_profiles: {
            include: { users: true },
          },
        },
      },
    },
    orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
  });
}

export async function getClassDetail(classId: number) {
  return await prisma.course_classes.findUnique({
    where: { id: classId },
    include: {
      courses: {
        include: { program_studi: true },
      },
      academic_terms: true,
      lecturer_profiles: {
        include: { users: true },
      },
      class_rooms: true,
      class_enrollments: {
        include: {
          student_profiles: {
            include: {
              users: true,
              rfid_credentials: { where: { is_active: true } },
            },
          },
        },
      },
      class_leader_assignments: {
        where: { is_active: true },
        include: {
          student_profiles: {
            include: { users: true },
          },
        },
      },
      course_chapters: {
        orderBy: { chapter_number: "asc" },
        include: {
          course_lessons: {
            orderBy: { lesson_number: "asc" },
            include: {
              course_materials: true,
              assignments: true,
              quizzes: true,
              attendance_sessions: {
                include: {
                  attendance_records: true,
                },
              },
            },
          },
        },
      },
      attendance_sessions: {
        orderBy: { session_number: "asc" },
        include: {
          attendance_records: {
            include: {
              student_profiles: {
                include: { users: true },
              },
            },
          },
          sadita_devices: true,
        },
      },
    },
  });
}

export async function getStudentEnrollments(userId: number) {
  const student = await prisma.student_profiles.findUnique({
    where: { user_id: userId },
  });

  if (!student) return [];

  return await prisma.class_enrollments.findMany({
    where: {
      student_id: student.id,
      status: "AKTIF",
    },
    include: {
      course_classes: {
        include: {
          courses: {
            include: { program_studi: true },
          },
          academic_terms: true,
          lecturer_profiles: {
            include: { users: true },
          },
          class_rooms: true,
        },
      },
    },
  });
}

export async function getLecturerClasses(userId: number) {
  const lecturer = await prisma.lecturer_profiles.findUnique({
    where: { user_id: userId },
  });

  if (!lecturer) return [];

  return await prisma.course_classes.findMany({
    where: {
      lecturer_id: lecturer.id,
      is_active: true,
    },
    include: {
      courses: {
        include: { program_studi: true },
      },
      academic_terms: true,
      class_rooms: true,
      _count: {
        select: {
          class_enrollments: true,
          attendance_sessions: true,
        },
      },
    },
    orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
  });
}
