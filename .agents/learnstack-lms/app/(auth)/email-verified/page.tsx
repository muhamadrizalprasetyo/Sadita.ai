// import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getServerSession } from "@/lib/get-server-session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

async function EmailVerifiedPage() {
  const session = await getServerSession();
  const user = session?.user;
  if (!user) redirect("/sign-in");
  if (!user.emailVerified) redirect("/verify-email");
  return (
    <div className="min-h-screen w-full">
      <Card className="mx-auto mt-20 flex max-w-md flex-col gap-6 rounded-lg p-6 text-center shadow-md">
        <h1 className="text-2xl font-bold">Email Verified</h1>
        <p>
          Your email has been successfully verified. You can now sign in to your
          account.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            variant: "default",
            className: "w-fit self-center",
          })}
        >
          Go to Dashboard
        </Link>
      </Card>
    </div>
  );
}

export default EmailVerifiedPage;
