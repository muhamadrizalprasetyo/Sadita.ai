import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-server-session";

export async function checkIfCourseBought(courseId: string) {
  const session = await getServerSession();
  if (!session?.user) return false;
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        courseId: courseId,
        userId: session?.user.id,
      },
    },
    select: {
      status: true,
    },
  });
  return enrollment?.status === "Active" ? true : false;
}
