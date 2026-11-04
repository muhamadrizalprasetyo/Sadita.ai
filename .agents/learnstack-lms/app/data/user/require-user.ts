import { getServerSession } from "@/lib/get-server-session";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await getServerSession();
  if (!session || !session.user) {
    return redirect("/sign-in");
  }

  return session.user;
}
