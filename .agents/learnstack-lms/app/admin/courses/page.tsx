import { buttonVariants } from "@/components/ui/button";
import { adminGetCourses } from "@/app/data/admin/admin-get-courses";
import Link from "next/link";
import AdminCourseCard, {
  AdminCourseCardSkeleton,
} from "../_components/admin-course-card";
import EmptyState from "@/components/empty-state";
import { Suspense } from "react";

function CoursesPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Courses</h1>
        <Link href="/admin/courses/create" className={buttonVariants()}>
          Create Course
        </Link>
      </div>
      <Suspense fallback={<AdminCourseCardLayoutSkeleton />}>
        <RenderCourses />
      </Suspense>
    </>
  );
}

export default CoursesPage;

async function RenderCourses() {
  const data = await adminGetCourses();
  return (
    <>
      {data.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Create a new course to get starrted"
          buttonText="Create course"
          href="/admin/courses/create"
        />
      ) : (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          {data.map((course) => (
            <AdminCourseCard key={course.id} data={course} />
          ))}
        </div>
      )}
    </>
  );
}
function AdminCourseCardLayoutSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <AdminCourseCardSkeleton key={idx} />
      ))}
    </div>
  );
}
