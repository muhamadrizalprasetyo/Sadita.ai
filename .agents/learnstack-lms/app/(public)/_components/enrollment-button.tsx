"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { enrollInCourseAction } from "../courses/[slug]/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
function EnrollmentButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();
  const onSubmit = () => {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        enrollInCourseAction(courseId),
      );
      if (error) {
        toast.error("Please Sign-in to enroll in this course.");
        return;
      }
      if (result.status === "success") {
        toast.success(result.message || "Enrolled successfully!");
      } else if (result.status === "error") {
        toast.error(result.message || "Failed to enroll in course.");
      }
    });
  };
  return (
    <Button onClick={onSubmit} disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-1 size-4 animate-spin" />
          Enrolling...
        </>
      ) : (
        "Enroll Now"
      )}
    </Button>
  );
}

export default EnrollmentButton;
