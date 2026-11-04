"use server";

import { authenticateUser, logoutUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface SignInState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function signInAction(
  prevState: SignInState | null,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      status: "error",
      message: "Email dan password wajib diisi.",
    };
  }

  const result = await authenticateUser(email, password);

  if (!result.success || !result.user) {
    return {
      status: "error",
      message: result.message || "Gagal masuk.",
    };
  }

  // Redirect berdasarkan Role Pengguna
  if (result.user.role === "ADMIN") {
    redirect("/admin");
  } else if (result.user.isKaprodi || result.user.role === "KAPRODI") {
    redirect("/kaprodi");
  } else if (result.user.role === "DOSEN") {
    redirect("/dosen");
  } else {
    redirect("/mahasiswa");
  }
}

export async function signOutAction(): Promise<void> {
  await logoutUser();
  redirect("/sign-in");
}
