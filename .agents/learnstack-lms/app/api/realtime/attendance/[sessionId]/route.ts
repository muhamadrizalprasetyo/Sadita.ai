import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const sId = parseInt(sessionId, 10);

  if (isNaN(sId)) {
    return new Response("Invalid sessionId", { status: 400 });
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  let isClosed = false;

  const intervalId = setInterval(async () => {
    if (isClosed) return;
    try {
      const session = await prisma.attendance_sessions.findUnique({
        where: { id: sId },
        include: {
          attendance_records: {
            orderBy: { check_in_time: "desc" },
            include: {
              student_profiles: {
                include: { users: true },
              },
            },
          },
        },
      });

      if (!session) {
        clearInterval(intervalId);
        writer.close();
        isClosed = true;
        return;
      }

      const payload = JSON.stringify({
        sessionId: session.id,
        status: session.status,
        records: session.attendance_records.map((r) => ({
          id: r.id,
          studentId: r.student_id,
          name: r.student_profiles.users.full_name,
          nim: r.student_profiles.nim,
          status: r.status,
          method: r.method,
          time: r.check_in_time ? r.check_in_time.toISOString() : null,
        })),
      });

      await writer.write(encoder.encode(`data: ${payload}\n\n`));

      if (session.status === "CLOSED") {
        clearInterval(intervalId);
        writer.close();
        isClosed = true;
      }
    } catch (err) {
      clearInterval(intervalId);
      if (!isClosed) {
        writer.close();
        isClosed = true;
      }
    }
  }, 1500);

  request.signal.addEventListener("abort", () => {
    clearInterval(intervalId);
    if (!isClosed) {
      writer.close();
      isClosed = true;
    }
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
