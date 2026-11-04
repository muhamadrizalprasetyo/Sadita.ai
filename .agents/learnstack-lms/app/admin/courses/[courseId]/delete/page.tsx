"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { tryCatch } from "@/hooks/try-catch";
import Link from "next/link";
import { useTransition } from "react";
import { deleteCourse } from "./actions";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

function DeleteCoursePage() {
  const [pending, startTransition] = useTransition();
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const onSubmit = () => {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(deleteCourse(courseId));
      if (error) {
        toast.error("An unexpected error occured. Please try again");
        return;
      }
      if (result.status === "success") {
        toast.success(result.message);
        router.push("/admin/courses");
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };
  return (
    <div className="mx-auto w-full max-w-xl">
      <Card className="mt-32">
        <CardHeader>
          <CardTitle>Are you sure you want to delete this course?</CardTitle>
          <CardDescription>
            This will permanently delete the course
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-4">
          <Link
            href="/admin/courses"
            className={buttonVariants({
              variant: "outline",
            })}
          >
            Cancel
          </Link>
          <Button variant="destructive" disabled={pending} onClick={onSubmit}>
            {pending ? (
              <>
                <Loader2 className="size-4" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default DeleteCoursePage;
