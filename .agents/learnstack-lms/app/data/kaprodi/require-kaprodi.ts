import "server-only";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireKaprodi() {
  const session = await auth.api.getSession();
  if (!session) return redirect("/sign-in");
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "KAPRODI" &&
    !session.user.isKaprodi
  ) {
    return redirect("/sign-in");
  }
  return session;
}
