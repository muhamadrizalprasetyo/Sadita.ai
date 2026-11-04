import { z } from "zod";

export const signUpSchema = z
  .object({
    name: z
      .string()
      .nonempty("Name is required")
      .min(3, "Name should be at least 3 characters"),

    email: z.string().email("Invalid email").min(1, "Email is required"),

    password: z
      .string()
      .nonempty("Password is required")
      .min(6, "Password should be at least 6 characters")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
        "Password must contain at least one letter and one number",
      ),

    confirmPassword: z.string().nonempty("Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // optional but recommended
  });

export type SignUpType = z.infer<typeof signUpSchema>;
