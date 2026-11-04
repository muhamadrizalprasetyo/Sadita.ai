"use server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseType } from "@/schemas/courseSchema";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

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

export async function createCourse(values: CourseType): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
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
    const validation = courseSchema.safeParse(values);
    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid form data",
      };
    }
    await prisma.course.create({
      data: {
        ...validation.data,
        userId: session?.user.id as string,
        stripePriceId: `free_${Date.now()}`,
      },
    });

    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: "Failed to create course",
    };
  }
}
