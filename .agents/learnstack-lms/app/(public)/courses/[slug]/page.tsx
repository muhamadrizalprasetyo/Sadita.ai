import { getSingleCourse } from "@/app/data/course/get-single-course";
import { RenderDescription } from "@/components/text-editor/render-description";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  IconBook,
  IconCategory,
  IconChartBar,
  IconChevronDown,
  IconClock,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { checkIfCourseBought } from "@/app/data/user/user-is-enrolled";
import Link from "next/link";
import EnrollmentButton from "../../_components/enrollment-button";
import { buttonVariants } from "@/components/ui/button";

type Params = Promise<{
  slug: string;
}>;

async function CourseDetailsPage({ params }: { params: Params }) {
  const { slug } = await params;
  const course = await getSingleCourse(slug);
  const isEnrolled = await checkIfCourseBought(course.id);

  return (
    <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="order-1 lg:col-span-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
          <Image
            src={`https://learnstack-lms.t3.storage.dev/${course.fileKey}`}
            alt={course.title}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              {course.title}
            </h1>
            <p className="text-muted-foreground line-clamp-2 text-lg leading-relaxed">
              {course.smallDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconChartBar className="size-4" />
              <span>{course.levels}</span>
            </Badge>
            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconCategory className="size-4" />
              <span>{course.category}</span>
            </Badge>
            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconClock className="size-4" />
              <span>{course.duration}h</span>
            </Badge>
          </div>
          <Separator className="my-8" />
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight">
              Course Description
            </h2>
            <div>
              <RenderDescription json={JSON.parse(course.description)} />
            </div>
          </div>
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold tracking-tight">
                Course Content
              </h2>
              <div>
                {course.chapter.length} {""}
                chapters |{" "}
                {course.chapter.reduce(
                  (total, chapter) => total + chapter.lessons.length,
                  0,
                ) || 0}{" "}
                Lessons
              </div>
            </div>
            <div className="space-y-4">
              {course.chapter.map((chapter, index) => (
                <Collapsible key={chapter.id} defaultOpen={index === 0}>
                  <Card className="gap-0 overflow-hidden border p-0 transition-all duration-200 hover:shadow-sm">
                    <CollapsibleTrigger>
                      <div>
                        <CardContent className="hover:bg-muted/50 p-6 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <p className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full font-semibold">
                                {index + 1}
                              </p>
                              <div>
                                <h3>{chapter.title}</h3>
                                <p className="text-muted-foreground mt-1 text-left text-sm">
                                  {chapter.lessons.length} lesson
                                  {chapter.lessons.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">
                                {chapter.lessons.length} lesson
                                {chapter.lessons.length !== 1 ? "s" : ""}
                              </Badge>
                              <IconChevronDown className="text-muted-foreground size-5" />
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/20 border-t">
                        <div className="space-y-3 p-6 pt-4">
                          {chapter.lessons.map((lesson, index) => (
                            <div
                              key={lesson.id}
                              className="hover:bg-accent flex items-center gap-4 rounded-lg p-3 transition-colors"
                            >
                              <div className="bg-background border-primary/30 flex size-8 items-center justify-center rounded-full border-2">
                                <IconPlayerPlay className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {lesson.title}
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                  Lesson {index + 1}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Enrollment card section */}
      {/* md:order-none */}
      <div className="order-2">
        <div className="sticky top-20">
          <Card className="py-0">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-lg font-medium">Price:</span>
                <span className="text-primary text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(course.price)}
                </span>
              </div>
              <div className="bg-muted mb-6 space-y-3 rounded-lg p-4">
                <h4 className="font-medium">What you will get:</h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full">
                      <IconClock className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Course Duration</p>
                      <p className="text-muted-foreground text-sm">
                        {course.duration} hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full">
                      <IconChartBar className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Difficulty Level</p>
                      <p className="text-muted-foreground text-sm">
                        {course.levels}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full">
                      <IconCategory className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-muted-foreground text-sm">
                        {course.category} hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full">
                      <IconBook className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Lessons</p>
                      <p className="text-muted-foreground text-sm">
                        {course.chapter.reduce(
                          (total, chapter) => total + chapter.lessons.length,
                          0,
                        ) || 0}{" "}
                        Lessons
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6 space-y-3">
                <h4>This course includes:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full bg-green-500/10 p-1 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>Full lifetime access</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full bg-green-500/10 p-1 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>Access on Mobile and Desktop</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full bg-green-500/10 p-1 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>Certificate on completion</span>
                  </li>
                </ul>
              </div>

              {isEnrolled ? (
                <Link
                  href="/dashboard"
                  className={buttonVariants({
                    className: "w-full",
                  })}
                >
                  Watch Course
                </Link>
              ) : (
                <EnrollmentButton courseId={course.id} />
              )}
              <p className="text-muted-foreground mt-3 text-center text-xs">
                30-day money back guarantee
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailsPage;
