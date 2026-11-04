import { Skeleton } from "@/components/ui/skeleton";

function LessonSkeleton() {
  return (
    <div className="flex h-full flex-col pl-6">
      <div className="bg-muted relative aspect-video overflow-hidden rounded-lg">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex-1 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export default LessonSkeleton;
