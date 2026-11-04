"use server";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";

export async function enrollInCourseAction(
  courseId: string,
): Promise<ApiResponse> {
  const user = await requireUser();
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true },
    });
    if (!course) {
      return {
        status: "error",
        message: "Mata kuliah / course tidak ditemukan.",
      };
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment?.status === "Active") {
      return {
        status: "success",
        message: "Anda sudah terdaftar di kelas ini.",
      };
    }

    if (existingEnrollment) {
      await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { status: "Active" },
      });
    } else {
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          amount: 0,
          status: "Active",
        },
      });
    }

    return {
      status: "success",
      message: "Berhasil terdaftar ke dalam kelas.",
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Gagal mendaftar kelas.",
    };
  }
}

