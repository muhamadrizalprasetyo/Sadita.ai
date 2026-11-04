import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z
    .string()
    .nonempty("Password is required")
    .min(1, "Password is at least 6 characters"),
});

export type SignInType = z.infer<typeof signInSchema>;
