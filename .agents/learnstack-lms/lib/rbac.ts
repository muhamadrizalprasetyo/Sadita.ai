import { prisma } from "./db";
import { SessionUser, UserRole } from "./session";

export type Permission =
  | "SYSTEM_ADMIN"
  | "PRODI_MANAGE"
  | "PRODI_VIEW"
  | "CLASS_MANAGE"
  | "CLASS_VIEW"
  | "PERTEMUAN_MANAGE"
  | "MATERI_MANAGE"
  | "ASSIGNMENT_MANAGE"
  | "ASSIGNMENT_SUBMIT"
  | "QUIZ_MANAGE"
  | "QUIZ_SUBMIT"
  | "ATTENDANCE_OPEN"
  | "ATTENDANCE_OVERRIDE"
  | "GRADE_MANAGE"
  | "GRADE_VIEW"
  | "DEVICE_MANAGE";

export interface ResourceScope {
  prodiId?: number;
  classId?: number;
  studentId?: number;
}

/**
 * Validasi hak akses pengguna secara server-side berbasis Role + Permission + Resource Scope.
 */
export async function checkPermission(
  user: SessionUser,
  permission: Permission,
  scope?: ResourceScope
): Promise<boolean> {
  // 1. ADMIN selalu memiliki akses global
  if (user.role === "ADMIN") {
    return true;
  }

  // 2. KAPRODI: scope berbasis Program Studi
  if (user.role === "KAPRODI") {
    switch (permission) {
      case "PRODI_VIEW":
      case "PRODI_MANAGE":
        return !scope?.prodiId || scope.prodiId === user.prodiId;
      case "CLASS_VIEW":
      case "GRADE_VIEW":
        if (scope?.classId && user.prodiId) {
          const cls = await prisma.course_classes.findUnique({
            where: { id: scope.classId },
            include: { courses: true },
          });
          return cls?.courses.prodi_id === user.prodiId;
        }
        return true;
      default:
        return false;
    }
  }

  // 3. DOSEN: scope berbasis Kelas yang diampu
  if (user.role === "DOSEN") {
    switch (permission) {
      case "CLASS_VIEW":
      case "CLASS_MANAGE":
      case "PERTEMUAN_MANAGE":
      case "MATERI_MANAGE":
      case "ASSIGNMENT_MANAGE":
      case "QUIZ_MANAGE":
      case "ATTENDANCE_OPEN":
      case "ATTENDANCE_OVERRIDE":
      case "GRADE_MANAGE":
      case "GRADE_VIEW":
        if (!scope?.classId) return true;
        // Cek apakah dosen mengampu kelas ini
        const lecturer = await prisma.lecturer_profiles.findUnique({
          where: { user_id: user.id },
        });
        if (!lecturer) return false;
        const assigned = await prisma.course_classes.findFirst({
          where: {
            id: scope.classId,
            lecturer_id: lecturer.id,
          },
        });
        return !!assigned;
      default:
        return false;
    }
  }

  // 4. MAHASISWA & KETUA_KELAS: scope berbasis Kelas yang diikuti / data diri sendiri
  if (user.role === "MAHASISWA") {
    const student = await prisma.student_profiles.findUnique({
      where: { user_id: user.id },
    });
    if (!student) return false;

    switch (permission) {
      case "CLASS_VIEW":
        if (!scope?.classId) return true;
        const enrollment = await prisma.class_enrollments.findFirst({
          where: {
            class_id: scope.classId,
            student_id: student.id,
            status: "AKTIF",
          },
        });
        return !!enrollment;

      case "ASSIGNMENT_SUBMIT":
      case "QUIZ_SUBMIT":
        if (!scope?.classId) return false;
        const enr = await prisma.class_enrollments.findFirst({
          where: {
            class_id: scope.classId,
            student_id: student.id,
            status: "AKTIF",
          },
        });
        return !!enr;

      case "GRADE_VIEW":
        // Mahasiswa hanya boleh melihat nilainya sendiri
        if (scope?.studentId) {
          return scope.studentId === student.id;
        }
        return true;

      case "ATTENDANCE_OVERRIDE":
        // Khusus Ketua Kelas yang ditugaskan di kelas bersangkutan
        if (scope?.classId) {
          const leader = await prisma.class_leader_assignments.findFirst({
            where: {
              class_id: scope.classId,
              student_id: student.id,
              is_active: true,
            },
          });
          return !!leader;
        }
        return false;

      default:
        return false;
    }
  }

  return false;
}

/**
 * Throw exception jika izin tidak terpenuhi
 */
export async function enforcePermission(
  user: SessionUser,
  permission: Permission,
  scope?: ResourceScope
): Promise<void> {
  const allowed = await checkPermission(user, permission, scope);
  if (!allowed) {
    throw new Error(
      `Akses ditolak: Anda tidak memiliki izin '${permission}' pada resource ini.`
    );
  }
}
