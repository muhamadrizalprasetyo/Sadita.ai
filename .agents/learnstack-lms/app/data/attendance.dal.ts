import { prisma } from "@/lib/db";
import { attendance_status_enum, attendance_method_enum, session_status_enum } from "@/lib/generated/prisma/enums";

/**
 * Data Access Layer untuk Presensi Perkuliahan & IoT RFID SADITA.ai
 */

export async function openAttendanceSession(data: {
  classId: number;
  lecturerId: number;
  sessionNumber: number;
  roomId?: number;
  lessonId?: number;
}) {
  const now = new Date();

  // Cari apakah sudah ada sesi untuk pertemuan ini
  const existing = await prisma.attendance_sessions.findFirst({
    where: {
      class_id: data.classId,
      session_number: data.sessionNumber,
    },
  });

  if (existing) {
    if (existing.status === "OPEN") return existing;
    return await prisma.attendance_sessions.update({
      where: { id: existing.id },
      data: {
        status: "OPEN",
        open_time: now,
        close_time: null,
      },
    });
  }

  return await prisma.attendance_sessions.create({
    data: {
      class_id: data.classId,
      lecturer_id: data.lecturerId,
      session_number: data.sessionNumber,
      room_id: data.roomId || 1,
      status: "OPEN",
      open_time: now,
    },
  });
}

export async function closeAttendanceSession(sessionId: number) {
  return await prisma.attendance_sessions.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      close_time: new Date(),
    },
  });
}

export async function getActiveSession(classId: number) {
  return await prisma.attendance_sessions.findFirst({
    where: {
      class_id: classId,
      status: "OPEN",
    },
    include: {
      attendance_records: {
        include: {
          student_profiles: {
            include: { users: true },
          },
        },
      },
      sadita_devices: true,
      class_rooms: true,
    },
  });
}

export async function getSessionAttendanceRecords(sessionId: number) {
  return await prisma.attendance_records.findMany({
    where: { session_id: sessionId },
    include: {
      student_profiles: {
        include: { users: true },
      },
    },
    orderBy: { check_in_time: "asc" },
  });
}

export async function recordStudentAttendance(data: {
  sessionId: number;
  studentId: number;
  status: attendance_status_enum;
  method: attendance_method_enum;
}) {
  const now = new Date();

  // Pencegahan Duplikasi Tap (Idempotency)
  const existing = await prisma.attendance_records.findUnique({
    where: {
      session_id_student_id: {
        session_id: data.sessionId,
        student_id: data.studentId,
      },
    },
  });

  if (existing) {
    return {
      record: existing,
      isDuplicate: true,
      message: "SUDAH TERCATAT",
    };
  }

  const record = await prisma.attendance_records.create({
    data: {
      session_id: data.sessionId,
      student_id: data.studentId,
      status: data.status,
      method: data.method,
      check_in_time: now,
    },
    include: {
      student_profiles: {
        include: { users: true },
      },
    },
  });

  return {
    record,
    isDuplicate: false,
    message: "HADIR",
  };
}

export async function findStudentByRfidUid(rfidUid: string) {
  const credential = await prisma.rfid_credentials.findUnique({
    where: { uid: rfidUid },
    include: {
      student_profiles: {
        include: {
          users: true,
          class_enrollments: {
            where: { status: "AKTIF" },
          },
        },
      },
    },
  });

  if (!credential || !credential.is_active) return null;
  return credential.student_profiles;
}

export async function updateAttendanceRecordStatus(
  recordId: number,
  status: attendance_status_enum,
  keterangan?: string
) {
  return await prisma.attendance_records.update({
    where: { id: recordId },
    data: {
      status,
      notes: keterangan,
      method: "MANUAL_DOSEN",
    },
  });
}
