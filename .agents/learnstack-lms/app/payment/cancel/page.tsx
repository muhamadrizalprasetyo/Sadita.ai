import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, XIcon } from "lucide-react";
import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="flex min-h-screen w-full flex-1 items-center justify-center">
      <Card className="w-[350px]">
        <CardContent>
          <div className="flex w-full justify-center">
            <XIcon className="text-red size-4 rounded-full bg-red-500/30 text-red-500" />
          </div>
          <div className="mt-3 w-full text-center sm:mt-5">
            <h2 className="text-xl font-semibold">Payment Canceled</h2>
            <p className="text-muted-foreground mt-2 text-sm tracking-tight text-balance">
              No worries, you won't be charged. Please try again!
            </p>
            <Link
              href="/"
              className={buttonVariants({
                // variant: "outline",
                className: "mt-5 w-full",
              })}
            >
              <ArrowLeft className="size-4" />
              Go back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
