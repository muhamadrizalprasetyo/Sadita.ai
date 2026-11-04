import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative">
      <Link
        href="/"
        className={buttonVariants({
          variant: "outline",
          className: "fixed top-4 left-4",
        })}
      >
        <ArrowLeft />
        Go Back
      </Link>
      {children}
    </main>
  );
}

export default AuthLayout;
