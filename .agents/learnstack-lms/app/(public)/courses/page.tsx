import { getAllCourses } from "@/app/data/course/get-all-courses";
import CourseCard, {
  PublicCourseCardSkeleton,
} from "../_components/course-card";
import { Suspense } from "react";

function CoursesPage() {
  return (
    <div className="mt-5">
      <div className="mb-10 flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Explore Courses
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Discover our wide range designed to help you acheive your learning
          goals.
        </p>
      </div>
      <Suspense fallback={<LoadingSkeletonLayout />}>
        <PublicCoursesGrid />
      </Suspense>
    </div>
  );
}

export default CoursesPage;

async function PublicCoursesGrid() {
  const courses = await getAllCourses();
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} data={course} />
      ))}
    </div>
  );
}

function LoadingSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, idx) => (
        <PublicCourseCardSkeleton key={idx} />
      ))}
    </div>
  );
}
