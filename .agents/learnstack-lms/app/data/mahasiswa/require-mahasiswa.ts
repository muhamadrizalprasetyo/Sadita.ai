import "server-only";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireMahasiswa() {
  const session = await auth.api.getSession();
  if (!session) return redirect("/sign-in");
  if (session.user.role !== "MAHASISWA" && session.user.role !== "ADMIN") {
    return redirect("/sign-in");
  }
  return session;
}
