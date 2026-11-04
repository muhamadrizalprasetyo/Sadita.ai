"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";

function SignOutButton({ className }: { className?: string }) {
  const [signOutPending, startSignOutTransition] = useTransition();
  const router = useRouter();

  const handleSignOut = async () => {
    startSignOutTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully");
            router.push("/");
          },
          onError: (err) => {
            toast.error(err.error?.message);
          },
        },
      });
    });
  };
  return (
    <button
      className={cn("", className)}
      disabled={signOutPending}
      onClick={handleSignOut}
    >
      {signOutPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Signing out...</span>
        </>
      ) : (
        <span className="text-sm font-semibold">Sign out</span>
      )}
    </button>
  );
}

export default SignOutButton;
