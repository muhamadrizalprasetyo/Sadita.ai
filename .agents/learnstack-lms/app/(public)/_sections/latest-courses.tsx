import { Button } from "@/components/ui/button";
import CourseCard from "../_components/course-card";
import { getAllCourses } from "@/app/data/course/get-all-courses";
import { PublicCourseCardSkeleton } from "../_components/course-card";
import { Suspense } from "react";
async function LatestCourses() {
  return (
    <section className="bg-muted/30 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Popular Courses
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Explore our most sought-after courses trusted by thousands of
            learners
          </p>
        </div>
        <Suspense fallback={<CoursesGridFallback />}>
          <CoursesGrid />
        </Suspense>
        <div className="mt-12 text-center">
          <Button size="lg">Browse All Courses</Button>
        </div>
      </div>
    </section>
  );
}

export default LatestCourses;

async function CoursesGrid() {
  const courses = await getAllCourses();
  if (!courses) {
    return <div className="h-20 w-full"></div>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {courses.map((course) => (
        <CourseCard key={course.id} data={course} />
      ))}
    </div>
  );
}

function CoursesGridFallback() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <PublicCourseCardSkeleton key={idx} />
      ))}
    </div>
  );
}
