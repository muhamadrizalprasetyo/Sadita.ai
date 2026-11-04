import "server-only";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireDosen() {
  const session = await auth.api.getSession();
  if (!session) return redirect("/sign-in");
  if (session.user.role !== "DOSEN" && session.user.role !== "ADMIN") {
    return redirect("/sign-in");
  }
  return session;
}
