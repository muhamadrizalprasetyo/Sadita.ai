import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function Unauthorized() {
  return (
    <main>
      <h1>401 - Unauthorized</h1>
      <p>Please log in to access this page.</p>
      <Link href="/sign-in" className={buttonVariants()}>
        Login
      </Link>
    </main>
  );
}

//TODO: invoke unauthoried() to redirect the user to this page
