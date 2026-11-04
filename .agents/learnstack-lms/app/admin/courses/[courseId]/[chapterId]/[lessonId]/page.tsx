import { LessonForm } from "@/app/admin/_components/lesson-form";
import { adminGetLesson } from "@/app/data/admin/admin-get-lesson";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

async function LessonDetailsPage({ params }: { params: Params }) {
  const { chapterId, courseId, lessonId } = await params;
  const lesson = await adminGetLesson(lessonId);
  return <LessonForm chapterId={chapterId} courseId={courseId} data={lesson} />;
}

export default LessonDetailsPage;
