import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CreateCourseForm from "../../_components/create-course-form";
import Link from "next/link";

function CreateCoursePage() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1>Create Courses</h1>
      </div>
      <CreateCourseForm />
    </>
  );
}

export default CreateCoursePage;
