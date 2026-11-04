import { z } from "zod";
import { dummyCategories } from "./categorySchema";

export const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const;
export const courseStatuses = ["Draft", "Published", "Archived"] as const;

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title must be at most 100 characters long"),

  description: z
    .string()
    .min(3, "Description must be at least 3 characters long")
    .max(25000, "Description must be at most 25000 characters long"),

  fileKey: z.string().min(1, "File is required"),

  price: z.coerce.number().min(1, "Price must be a positive number"),

  duration: z.coerce
    .number()
    .min(1, "Duration must be at least 1 hour")
    .max(500, "Duration must be at most 500 hours"),

  levels: z.enum(courseLevels),
  category: z.enum(dummyCategories),
  smallDescription: z
    .string()
    .min(3, "Small description must be at least 3 characters long")
    .max(200, "Small description must be at most 200 characters long"),

  slug: z.string().min(3, "Slug must be at least 3 characters long"),
  status: z.enum(courseStatuses),
});

export type CourseType = z.infer<typeof courseSchema>;
