import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";
import CourseSidebar from "../_components/CourseSidebar";

interface iAppProps {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export default async function CourseDetailsLayout({
  children,
  params,
}: iAppProps) {
  const { slug } = await params;
  const course = await getCourseSidebarData(slug);
  return (
    <div className="flex flex-1">
      {/* Sidebar */}
      <div className="border-border w-80 shrink-0 border-r">
        <CourseSidebar course={course.course} />
      </div>
      {/* MAin */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
