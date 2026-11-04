import { SignUpForm } from "../_components/signup-form";
import { getServerSession } from "@/lib/get-server-session";
import Logo from "@/components/logo";
import { redirect } from "next/navigation";

async function SignUpPage() {
  const session = await getServerSession();
  if (session?.user) redirect("/");
  return (
    <div className="bg-muted-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo height={30} width={30} className="self-center" />
        <SignUpForm />
      </div>
    </div>
  );
}

export default SignUpPage;
