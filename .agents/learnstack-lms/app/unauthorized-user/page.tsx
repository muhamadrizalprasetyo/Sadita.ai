import { buttonVariants } from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import { ArrowLeft, ShieldX } from "lucide-react";
import Link from "next/link";

export function UnauthorizedUserPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <Card.Card className="w-full max-w-md">
        <Card.CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto w-fit rounded-full p-4">
            <ShieldX className="text-16 text-destructive" />
          </div>
          <Card.CardTitle className="text-2xl">Access denied</Card.CardTitle>
          <Card.CardDescription className="mx-auto max-w-xs">
            You are not an admin. Only admin can perform this action
          </Card.CardDescription>
        </Card.CardHeader>
        <Card.CardContent>
          <Link
            href="/"
            className={buttonVariants({
              className: "w-full",
            })}
          >
            <ArrowLeft className="mr-1 size-4" /> Back to home
          </Link>
        </Card.CardContent>
      </Card.Card>
    </div>
  );
}

export default UnauthorizedUserPage;
