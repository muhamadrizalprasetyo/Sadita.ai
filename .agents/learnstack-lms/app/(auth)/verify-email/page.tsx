import { Card } from "@/components/ui/card";
import { getServerSession } from "@/lib/get-server-session";
import { redirect } from "next/navigation";
import { ResendVerificationEmailButton } from "../_components/resend-verification-email-button";

export default async function VerifyEmailPage() {
  const session = await getServerSession();
  const user = session?.user;
  if (!user) redirect("/sign-in");
  if (user.emailVerified) redirect("/");

  return (
    <div className="min-h-screen w-full">
      <Card className="mx-auto mt-20 flex max-w-md flex-col gap-6 rounded-lg p-6 text-center shadow-md">
        <h1 className="text-2xl font-bold">Please verify your email</h1>
        <p>
          A verification link has been sent to your email address. Please check
          your inbox and click on the link to verify your email.
        </p>
        <ResendVerificationEmailButton email={user?.email} />
      </Card>
    </div>
  );
}
