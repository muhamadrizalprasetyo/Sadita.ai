import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordStudentAttendance, findStudentByRfidUid } from "@/app/data/attendance.dal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { device_id, rfid_uid, timestamp } = body;

    if (!device_id || !rfid_uid) {
      return NextResponse.json(
        { error: "device_id dan rfid_uid wajib diisi" },
        { status: 400 }
      );
    }

    // 1. Verifikasi Perangkat IoT Terdaftar
    const device = await prisma.sadita_devices.findUnique({
      where: { device_id },
      include: { class_rooms: true },
    });

    if (!device || device.status === "OFFLINE") {
      return NextResponse.json(
        { status: "REJECTED", reason: "DEVICE_UNAUTHORIZED", message: "Perangkat tidak terdaftar" },
        { status: 403 }
      );
    }

    // Update last seen
    await prisma.sadita_devices.update({
      where: { id: device.id },
      data: { last_seen_at: new Date() },
    });

    // 2. Cari Mahasiswa berdasarkan RFID UID
    const student = await findStudentByRfidUid(rfid_uid);
    if (!student) {
      // Log event kartu tidak dikenal
      await prisma.attendance_events.create({
        data: {
          device_id,
          device_db_id: device.id,
          event_type: "RFID_UNKNOWN",
          rfid_uid,
          berhasil: false,
          pesan: "Kartu RFID tidak terdaftar pada mahasiswa mana pun",
          received_at: new Date(),
        },
      });

      return NextResponse.json(
        { status: "REJECTED", reason: "CARD_UNKNOWN", message: "Kartu tidak terdaftar" },
        { status: 404 }
      );
    }

    // 3. Cari Sesi Presensi Aktif di Ruangan Perangkat Ini
    const activeSession = await prisma.attendance_sessions.findFirst({
      where: {
        status: "OPEN",
        ...(device.room_id ? { room_id: device.room_id } : {}),
      },
      include: {
        course_classes: {
          include: { courses: true },
        },
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { status: "REJECTED", reason: "NO_ACTIVE_SESSION", message: "Tidak ada sesi presensi aktif" },
        { status: 400 }
      );
    }

    // 4. Verifikasi Mahasiswa adalah Peserta Kelas Ini
    const isEnrolled = student.class_enrollments.some(
      (enr) => enr.class_id === activeSession.class_id
    );

    if (!isEnrolled) {
      return NextResponse.json(
        {
          status: "REJECTED",
          reason: "NOT_ENROLLED",
          message: "Mahasiswa bukan anggota kelas ini",
          student: { nim: student.nim, name: student.users.full_name },
        },
        { status: 403 }
      );
    }

    // 5. Catat Presensi dengan Idempotensi Duplicate Prevention
    const attendanceResult = await recordStudentAttendance({
      sessionId: activeSession.id,
      studentId: student.id,
      status: "HADIR",
      method: "RFID_FINGERPRINT",
    });

    // Log Event
    await prisma.attendance_events.create({
      data: {
        device_id,
        device_db_id: device.id,
        session_id: activeSession.id,
        student_id: student.id,
        event_type: "ATTENDANCE_RECORDED",
        rfid_uid,
        berhasil: true,
        pesan: attendanceResult.isDuplicate ? "Tap ganda terdeteksi" : "Presensi berhasil dicatat",
        received_at: new Date(),
      },
    });

    return NextResponse.json({
      status: "SUCCESS",
      attendanceStatus: attendanceResult.message,
      isDuplicate: attendanceResult.isDuplicate,
      student: {
        id: student.id,
        nim: student.nim,
        name: student.users.full_name,
      },
      class: {
        id: activeSession.class_id,
        name: activeSession.course_classes.kode_kelas,
        matkul: activeSession.course_classes.courses.nama,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in IoT attendance tap:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
