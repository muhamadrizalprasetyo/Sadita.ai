import "server-only";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth.api.getSession();
  if (!session) return redirect("/sign-in");
  if (session.user.role !== "ADMIN") {
    return redirect("/sign-in");
  }

  return session;
}
