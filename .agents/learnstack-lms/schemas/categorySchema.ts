import { z } from "zod";

export const categorySchema = z.object({});

export type CategoryType = z.infer<typeof categorySchema>;

export const dummyCategories = [
  "Development",
  "Business",
  "Finance",
  "IT & Softwate",
  "Office Productivity",
  "Personal Development",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Music",
  "Teaching & Academics",
] as const;
