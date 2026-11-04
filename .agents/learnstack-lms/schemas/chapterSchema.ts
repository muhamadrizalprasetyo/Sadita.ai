import { z } from "zod";

export const chapterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  courseId: z.string().uuid("Invalid course id"),
});

export type ChapterType = z.infer<typeof chapterSchema>;
