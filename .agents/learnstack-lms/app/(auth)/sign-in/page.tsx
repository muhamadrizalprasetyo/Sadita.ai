import Logo from "@/components/logo";
import SignInForm from "../_components/signin-form";
import { getServerSession } from "@/lib/get-server-session";
import { redirect } from "next/navigation";

async function SignInPage() {
  const session = await getServerSession();
  if (session?.user) {
    if (session.user.role === "ADMIN") redirect("/admin");
    if (session.user.isKaprodi || session.user.role === "KAPRODI") redirect("/kaprodi");
    if (session.user.role === "DOSEN") redirect("/dosen");
    redirect("/mahasiswa");
  }

  return (
    <div className="bg-muted-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo height={30} width={30} className="self-center" />
        <SignInForm />
      </div>
    </div>
  );
}

export default SignInPage;
