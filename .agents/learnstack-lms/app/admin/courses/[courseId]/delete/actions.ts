"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

const aj = arcjet
  // .withRule(
  //   detectBot({
  //     mode: "LIVE",
  //     allow: [],
  //   }),
  // )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 5,
    }),
  );

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  const session = await requireAdmin();
  try {
    // Arcjet /////////////////////////
    const req = await request();
    const decission = await aj.protect(req, {
      fingerprint: session?.user.id,
    });
    if (decission.isDenied()) {
      if (decission?.reason.isRateLimit()) {
        return {
          status: "error",
          message: "Request blocked due to rate limit",
        };
      } else {
        return {
          status: "error",
          message: "Melicious request",
        };
      }
    }
    //////////////////////////////////
    await prisma.course.delete({
      where: {
        id: courseId,
      },
    });
    revalidatePath(`/admin/courses`);
    return {
      status: "success",
      message: "Course deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete course",
    };
  }
}
