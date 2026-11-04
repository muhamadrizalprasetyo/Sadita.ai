import { z } from "zod";

export const lessonSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  courseId: z.string().uuid("Invalid course Id"),
  chapterId: z.string().uuid("Invalid chapter Id"),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters long")
    .optional(),
  thumbnailKey: z.string().optional(),
  videoKey: z.string().optional(),
});

export type LessonType = z.infer<typeof lessonSchema>;
